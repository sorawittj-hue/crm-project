import { supabase } from '../utils/supabase';
import { isMissingColumnError, removeMissingColumn } from './sessionScope';

let notificationWritesDisabled = true;

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

  let payload = {
    ...notif,
    created_at: new Date().toISOString(),
  };

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await supabase
      .from('notifications')
      .upsert(payload, { onConflict: 'notification_key', ignoreDuplicates: false })
      .select();

    if (!error) return data?.[0] || null;

    if (!isNotificationSchemaError(error)) {
      throw new Error('Could not upsert notification: ' + error.message);
    }

    const nextPayload = removeMissingColumn(payload, error);
    if (nextPayload === payload || error?.code === '42P10' || error?.code === '23503') {
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
