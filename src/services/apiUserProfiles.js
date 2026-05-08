import { supabase } from '../utils/supabase';

export async function fetchMyProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (error) return null;
  return data;
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error('Could not load users');
  return data || [];
}

export async function updateProfileRole(id, role) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', id)
    .select();
  if (error) throw new Error('Could not update role');
  return data?.[0];
}

export async function updateMyPersonalTarget(userId, personalTarget) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ personal_target: Number(personalTarget) || 0 })
    .eq('id', userId)
    .select();
  if (error) throw new Error('Could not update personal target');
  return data?.[0];
}

export async function touchLastSeen(userId) {
  await supabase
    .from('user_profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userId);
}
