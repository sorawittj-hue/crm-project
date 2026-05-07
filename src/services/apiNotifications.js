import { supabase } from '../utils/supabase';

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .limit(80);
  if (error) throw new Error('Could not load notifications');
  return data || [];
}

// Upsert by notification_key — idempotent, won't create duplicates for same event
export async function upsertNotification(notif) {
  const payload = { ...notif, created_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('notifications')
    .upsert(payload, { onConflict: 'notification_key', ignoreDuplicates: false })
    .select();
  if (error) throw new Error('Could not upsert notification: ' + error.message);
  return data?.[0];
}

export async function markNotificationRead(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw new Error('Could not mark read');
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .is('dismissed_at', null);
  if (error) throw new Error('Could not mark all read');
}

export async function dismissNotification(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error('Could not dismiss notification');
}

export async function dismissAllNotifications(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('dismissed_at', null);
  if (error) throw new Error('Could not dismiss all');
}
