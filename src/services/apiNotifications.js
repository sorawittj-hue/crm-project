import { supabase } from '../utils/supabase';
import { isMissingColumnError, removeMissingColumn } from './sessionScope';

let notificationWritesDisabled = false;

function isNotificationSchemaError(error) {
  const message = String(error?.message || '');
  return (
    isMissingColumnError(error) ||
    error?.code === '42P10' ||
    error?.code === '23503' ||
    message.includes('no unique or exclusion constraint') ||
    message.includes('violates foreign key constraint') ||
    message.includes('Could not find the table')
  );
}

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(80);

  if (error) {
    if (isNotificationSchemaError(error)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(80);

      if (!legacyError) return legacyData || [];
      return [];
    }

    throw new Error('Could not load notifications');
  }

  return (data || []).filter((notification) => !notification.dismissed_at);
}

// Upsert by notification_key. When production has not been migrated yet, stop
// notification writes for this page session so the proactive engine cannot spam.
export async function upsertNotification(notif) {
  if (notificationWritesDisabled) return null;

  const ownerId = notif.owner_id || notif.user_id;
  let payload = {
    ...notif,
    owner_id: ownerId,
    notification_key: ownerId && notif.notification_key
      ? `${ownerId}:${notif.notification_key}`
      : notif.notification_key,
    created_at: new Date().toISOString(),
  };

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const key = payload.notification_key;
    if (key) {
      // 1. Try to find the existing notification by notification_key
      const { data: existing, error: selectError } = await supabase
        .from('notifications')
        .select('*')
        .eq('notification_key', key)
        .maybeSingle();

      if (selectError) {
        if (!isNotificationSchemaError(selectError)) {
          throw new Error('Could not select notification: ' + selectError.message);
        }
        const nextPayload = removeMissingColumn(payload, selectError);
        if (nextPayload === payload || selectError?.code === '42P10' || selectError?.code === '23503') {
          notificationWritesDisabled = true;
          return null;
        }
        payload = nextPayload;
        continue;
      }

      if (existing) {
        // 2. If it exists, update it by ID
        const updatePayload = { ...payload };
        delete updatePayload.created_at;
        delete updatePayload.id;

        const { data, error: updateError } = await supabase
          .from('notifications')
          .update(updatePayload)
          .eq('id', existing.id)
          .select();

        if (!updateError) return data?.[0] || null;

        if (!isNotificationSchemaError(updateError)) {
          throw new Error('Could not update notification: ' + updateError.message);
        }

        const nextPayload = removeMissingColumn(payload, updateError);
        if (nextPayload === payload || updateError?.code === '42P10' || updateError?.code === '23503') {
          notificationWritesDisabled = true;
          return null;
        }
        payload = nextPayload;
        continue;
      }
    }

    // 3. If it doesn't exist, or has no notification_key, insert it
    const { data, error: insertError } = await supabase
      .from('notifications')
      .insert([payload])
      .select();

    if (!insertError) return data?.[0] || null;

    if (!isNotificationSchemaError(insertError)) {
      throw new Error('Could not insert notification: ' + insertError.message);
    }

    const nextPayload = removeMissingColumn(payload, insertError);
    if (nextPayload === payload || insertError?.code === '42P10' || insertError?.code === '23503') {
      notificationWritesDisabled = true;
      return null;
    }
    payload = nextPayload;
  }

  notificationWritesDisabled = true;
  return null;
}

export async function markNotificationRead(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error && !isNotificationSchemaError(error)) throw new Error('Could not mark read');
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .is('dismissed_at', null);
  if (error && isNotificationSchemaError(error)) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return;
  }
  if (error) throw new Error('Could not mark all read');
}

export async function dismissNotification(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', id);
  if (error && isNotificationSchemaError(error)) {
    await markNotificationRead(id);
    return;
  }
  if (error) throw new Error('Could not dismiss notification');
}

export async function dismissAllNotifications(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('dismissed_at', null);
  if (error && isNotificationSchemaError(error)) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    return;
  }
  if (error) throw new Error('Could not dismiss all');
}

export async function upsertNotificationsBatch(notificationsList) {
  if (notificationWritesDisabled || !notificationsList?.length) return [];

  let payloads = notificationsList.map(notif => {
    const ownerId = notif.owner_id || notif.user_id;
    return {
      ...notif,
      owner_id: ownerId,
      notification_key: ownerId && notif.notification_key
        ? `${ownerId}:${notif.notification_key}`
        : notif.notification_key,
      created_at: new Date().toISOString(),
    };
  });

  try {
    const { data, error } = await supabase
      .from('notifications')
      .upsert(payloads, { onConflict: 'notification_key' })
      .select();

    if (error) {
      if (isNotificationSchemaError(error)) {
        console.warn('Batch upsert failed due to schema constraint. Falling back to sequential upserts...', error);
        const results = [];
        for (const notif of notificationsList) {
          const res = await upsertNotification(notif);
          if (res) results.push(res);
        }
        return results;
      }
      throw error;
    }
    return data || [];
  } catch (err) {
    console.error('Failed to batch upsert notifications:', err);
    const results = [];
    for (const notif of notificationsList) {
      const res = await upsertNotification(notif).catch(() => null);
      if (res) results.push(res);
    }
    return results;
  }
}

