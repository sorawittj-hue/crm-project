import { supabase } from '../utils/supabase';

export async function fetchTeamMembers() {
  const { data, error } = await supabase.from('team_members').select('*').order('created_at', { ascending: true });
  if (error) {
    return [
      { id: 'leader', name: 'Sorawit (Leader)', role: 'หัวหน้าทีม', goal: 7000000, color: 'bg-indigo-600', icon_type: 'ShieldCheck' },
      { id: 'off', name: 'น้องออฟ', role: 'ทีมงาน', goal: 3000000, color: 'bg-orange-600', icon_type: 'UserCheck' },
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

export async function addTeamMember(member) {
  const { data, error } = await supabase
    .from('team_members')
    .insert([{ ...member, created_at: new Date().toISOString() }])
    .select();
  if (error) throw new Error('Could not add team member: ' + error.message);
  return data?.[0];
}

export async function deleteTeamMember(id) {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) throw new Error('Could not delete team member: ' + error.message);
  return true;
}
