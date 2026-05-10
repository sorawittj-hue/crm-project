import { supabase } from '../utils/supabase';
import { DEFAULT_MEMBER_TARGET, ensureOwnerTeamMember, getRequiredUserId } from './sessionScope';

const MEMBER_COLORS = [
  'bg-violet-600',
  'bg-indigo-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-500',
  'bg-orange-600',
  'bg-rose-600',
  'bg-pink-600',
  'bg-slate-700',
];

export async function fetchTeamMembers() {
  const userId = await getRequiredUserId();
  await ensureOwnerTeamMember();

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Unable to load team members:', error);
    throw new Error('Team members could not be loaded');
  }

  return data || [];
}

export async function updateTeamMember({ id, ...updates }) {
  const userId = await getRequiredUserId();

  if (!id) {
    throw new Error('Team member ID is required');
  }

  const payload = {
    name: updates.name?.trim(),
    role: updates.role?.trim(),
    email: updates.email?.trim() || null,
    phone: updates.phone?.trim() || null,
    goal: Number(updates.goal) || 0,
    color: updates.color,
    icon_type: updates.icon_type,
    is_active: updates.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  const { data, error } = await supabase
    .from('team_members')
    .update(payload)
    .eq('id', id)
    .eq('owner_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Unable to update team member:', error);
    throw new Error('Team member could not be updated');
  }

  return data;
}

export async function addTeamMember(member) {
  const userId = await getRequiredUserId();
  const name = member.name?.trim();

  if (!name) {
    throw new Error('Team member name is required');
  }

  const { data: existingMembers, error: countError } = await supabase
    .from('team_members')
    .select('id')
    .eq('owner_id', userId);

  if (countError) {
    console.error('Unable to inspect existing team members:', countError);
    throw new Error('Team member could not be prepared');
  }

  const colorIndex = existingMembers?.length ? existingMembers.length % MEMBER_COLORS.length : 0;
  const payload = {
    id: crypto.randomUUID(),
    owner_id: userId,
    name,
    role: member.role?.trim() || 'Member',
    email: member.email?.trim() || null,
    phone: member.phone?.trim() || null,
    goal: Number(member.goal) || DEFAULT_MEMBER_TARGET,
    color: member.color || MEMBER_COLORS[colorIndex],
    icon_type: member.icon_type || 'UserCheck',
    is_active: member.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('team_members')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Unable to add team member:', error);
    throw new Error('Could not add team member: ' + error.message);
  }

  return data;
}

export async function deleteTeamMember(id) {
  const userId = await getRequiredUserId();

  if (!id) {
    throw new Error('Team member ID is required');
  }

  if (id === userId) {
    throw new Error('The account owner cannot be deleted');
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)
    .eq('owner_id', userId);

  if (error) {
    console.error('Unable to delete team member:', error);
    throw new Error('Could not delete team member: ' + error.message);
  }

  return true;
}
