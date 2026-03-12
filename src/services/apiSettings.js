import { supabase } from '../utils/supabase';

export async function fetchAppSettings() {
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'global').single();
  if (error) {
    // Table doesn't exist yet - use defaults (no warning to avoid console spam)
    return {
      monthly_target: 10000000,
      leader_target: 7000000,
      member_target: 3000000
    };
  }
  return data;
}

export async function updateAppSettings(updates) {
  const { data, error } = await supabase
    .from('app_settings')
    .update(updates)
    .eq('id', 'global')
    .select();
  if (error) throw new Error('Settings could not be updated');
  return data;
}
