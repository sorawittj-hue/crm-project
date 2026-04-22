import { supabase } from '../utils/supabase';

export async function fetchTeamMembers() {
  const { data, error } = await supabase.from('team_members').select('*');
  if (error) {
    // Table doesn't exist yet - use defaults (no warning to avoid console spam)
    return [
      { id: 'leader', name: 'Sorawit (Leader)', role: 'หัวหน้าทีม', goal: 7000000, color: 'bg-indigo-600 shadow-indigo-500/20', icon_type: 'ShieldCheck' },
      { id: 'off', name: 'น้องออฟ', role: 'ทีมงาน', goal: 3000000, color: 'bg-orange-600 shadow-orange-500/20', icon_type: 'UserCheck' },
    ];
  }
  return data;
}

export async function updateTeamMember({ id, ...updates }) {
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw new Error('Team member could not be updated');
  return data;
}
