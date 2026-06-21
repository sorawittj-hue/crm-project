import { supabase } from '../utils/supabase';

export async function fetchMyProfile() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Failed to get auth session for profile fetch:', sessionError);
      return null;
    }
    if (!session?.user?.id) return null;

    const userId = session.user.id;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile from database:', error);
      return null;
    }

    const fullName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';

    // Self-Healing: Create the profile row if it doesn't exist
    if (!data) {
      try {
        console.info(`Self-healing: Profile for user ${userId} not found. Creating a new one...`);
        const newProfile = await createProfile({
          id: userId,
          email: session.user.email,
          fullName,
          role: 'member',
          planType: 'trial',
          trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days trial
        });
        return newProfile;
      } catch (createErr) {
        console.error('Failed to self-heal user profile:', createErr);
        return null;
      }
    }

    // Session Syncing: Sync names/emails if they changed in Auth metadata
    if (data.email !== session.user.email || (fullName && data.full_name !== fullName)) {
      try {
        const { data: updatedData, error: syncError } = await supabase
          .from('user_profiles')
          .update({
            email: session.user.email,
            full_name: fullName,
          })
          .eq('id', userId)
          .select()
          .single();
        if (!syncError && updatedData) return updatedData;
      } catch (syncErr) {
        console.error('Failed to sync Auth metadata to user profile:', syncErr);
      }
    }

    return data;
  } catch (err) {
    console.error('Unexpected error in fetchMyProfile:', err);
    return null;
  }
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

export async function updateProfileSubscription(id, planType, trialEndsAt) {
  const updates = {};
  if (planType !== undefined) updates.plan_type = planType;
  if (trialEndsAt !== undefined) updates.trial_ends_at = trialEndsAt;

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw new Error('Could not update subscription: ' + error.message);
  return data?.[0];
}

export async function deleteProfile(id) {
  const { data, error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', id)
    .select();
  if (error) throw new Error('Could not delete profile: ' + error.message);
  return data?.[0];
}

export async function createProfile({ id, email, fullName, role, planType, trialEndsAt }) {
  const newProfile = {
    id,
    email,
    full_name: fullName,
    role: role || 'member',
    plan_type: planType || 'free',
    created_at: new Date().toISOString()
  };
  if (trialEndsAt !== undefined) {
    newProfile.trial_ends_at = trialEndsAt;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert([newProfile])
    .select();
  if (error) throw new Error('Could not create profile: ' + error.message);
  return data?.[0];
}

