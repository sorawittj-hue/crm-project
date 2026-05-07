import { supabase } from '../utils/supabase';

const DEFAULTS = {
  id: 'global',
  monthly_target: 10000000,
  leader_target: 7000000,
  member_target: 3000000,
  company_name: '',
  company_industry: '',
  currency: 'THB',
  fiscal_month_start: 1,
};

export async function fetchAppSettings() {
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'global').single();
  if (error) return { ...DEFAULTS };
  return { ...DEFAULTS, ...data };
}

export async function updateAppSettings(updates) {
  const { data, error } = await supabase
    .from('app_settings')
    .upsert({ id: 'global', ...updates })
    .select();
  if (error) throw new Error('Settings could not be updated: ' + error.message);
  return data?.[0];
}
