import { supabase } from '../utils/supabase';

export const DEFAULT_MONTHLY_TARGET = 10000000;
export const DEFAULT_MEMBER_TARGET = 3000000;

export async function getRequiredUserId() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Unable to read Supabase session:', error);
    throw new Error('Authentication session could not be verified');
  }

  const userId = session?.user?.id;
  if (!userId) {
    throw new Error('You must be signed in to access CRM data');
  }

  return userId;
}

export function createOwnerMember(user) {
  const userId = user?.id;
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Owner';

  if (!userId) {
    throw new Error('User ID is required to create a team owner profile');
  }

  return {
    id: userId,
    owner_id: userId,
    name: displayName,
    role: 'Admin',
    email: user?.email || null,
    goal: DEFAULT_MONTHLY_TARGET,
    color: 'bg-violet-600',
    icon_type: 'ShieldCheck',
    is_active: true,
  };
}

export async function ensureOwnerTeamMember() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Unable to read Supabase user:', error);
    throw new Error('User profile could not be loaded');
  }

  if (!user) {
    throw new Error('You must be signed in to access team data');
  }

  const ownerMember = createOwnerMember(user);
  const { data, error: upsertError } = await supabase
    .from('team_members')
    .upsert(ownerMember, { onConflict: 'id' })
    .select()
    .single();

  if (upsertError) {
    console.error('Unable to ensure owner team member:', upsertError);
    throw new Error('Team owner profile could not be prepared');
  }

  return data;
}
