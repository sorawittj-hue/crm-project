import { supabase } from '../utils/supabase';

export const DEFAULT_MONTHLY_TARGET = 10000000;
export const DEFAULT_MEMBER_TARGET = 3000000;

export function isMissingColumnError(error) {
  const message = String(error?.message || '');
  return (
    error?.code === 'PGRST204' ||
    error?.code === '42703' ||
    message.includes('schema cache') ||
    message.includes('does not exist')
  );
}

export function getMissingColumnName(error) {
  const message = String(error?.message || '');
  const schemaMatch = message.match(/'([^']+)' column/);
  if (schemaMatch?.[1]) return schemaMatch[1];

  const pgMatch = message.match(/column [^.]+\."?([^"\s]+)"? does not exist/i);
  if (pgMatch?.[1]) return pgMatch[1];

  return null;
}

export function removeMissingColumn(payload, error) {
  const columnName = getMissingColumnName(error);
  if (!columnName || !Object.prototype.hasOwnProperty.call(payload, columnName)) {
    return payload;
  }

  const nextPayload = { ...payload };
  delete nextPayload[columnName];
  return nextPayload;
}

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

  let ownerMember = createOwnerMember(user);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error: upsertError } = await supabase
      .from('team_members')
      .upsert(ownerMember, { onConflict: 'id' })
      .select()
      .single();

    if (!upsertError) {
      return data;
    }

    if (!isMissingColumnError(upsertError)) {
      console.error('Unable to ensure owner team member:', upsertError);
      throw new Error('Team owner profile could not be prepared');
    }

    const nextOwnerMember = removeMissingColumn(ownerMember, upsertError);
    if (nextOwnerMember === ownerMember) {
      console.warn('Team owner profile is using legacy schema fallback:', upsertError);
      return null;
    }

    ownerMember = nextOwnerMember;
  }

  console.warn('Team owner profile fallback exhausted before schema was ready');
  return null;
}
