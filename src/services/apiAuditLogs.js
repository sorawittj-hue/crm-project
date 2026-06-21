import { supabase } from '../utils/supabase';

export async function fetchAuditLogs() {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) {
    console.error('Failed to fetch audit logs:', error);
    throw new Error('Could not load audit logs: ' + error.message);
  }
  return data || [];
}
