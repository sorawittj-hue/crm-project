import { useAuth } from './useAuth';
import { useMyProfile } from './useUserProfiles';
import { 
  isLocalTrialActive as checkLocalTrial,
  isLocalTrialExpired as checkLocalExpired,
  getTrialMsLeft,
  getTrialDaysLeft as getLocalTrialDaysLeft,
} from '../lib/localDb';

export function useSubscription() {
  const { user } = useAuth();
  const { data: myProfile, isLoading } = useMyProfile(user?.id);
  
  // 1. Role-based access
  const isAdmin = myProfile?.role === 'admin';
  const isOwner = myProfile?.role === 'owner' || isAdmin; // owner is separate from admin

  // 2. Guest / Sandbox mode (no Supabase session)
  const isGuestAccount = checkLocalTrial();
  const isGuestExpired = !isGuestAccount && checkLocalExpired(); // guest session timed out

  // 3. Pro access
  const isPro = isOwner || isAdmin || myProfile?.plan_type === 'pro';

  // 4. Trial Logic — computed differently for guests vs registered users
  let isTrialActive = false;
  let isExpired = false;
  let trialDaysLeft = 0;
  let trialMsLeft = 0; // precise milliseconds for countdown timers

  if (isGuestAccount) {
    // Guest: trial is active as long as they haven't timed out
    trialMsLeft = getTrialMsLeft();
    trialDaysLeft = getLocalTrialDaysLeft();
    isTrialActive = trialMsLeft > 0;
    isExpired = trialMsLeft === 0 && checkLocalExpired();
  } else if (myProfile?.plan_type === 'trial' || (!isPro && user)) {
    // Registered users trial logic
    const startDate = myProfile?.created_at ? new Date(myProfile.created_at) : new Date();
    let endDate = myProfile?.trial_ends_at ? new Date(myProfile.trial_ends_at) : null;
    
    if (!endDate) {
      endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    }

    const now = new Date();
    isTrialActive = now < endDate;
    isExpired = now >= endDate;
    
    const diffMs = endDate.getTime() - now.getTime();
    trialMsLeft = Math.max(0, diffMs);
    trialDaysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (trialDaysLeft < 0) trialDaysLeft = 0;
  }

  // Final access checks
  // Basic features: Pro, active trial (registered OR guest), or sandbox guest
  const canUseBasicFeatures = isPro || isTrialActive || isGuestAccount;
  
  // Premium features: Export, Backup, Advanced AI — Pro only
  const canUsePremiumFeatures = isPro;

  // Should block normal CRUD actions?
  const shouldBlockBasic = !canUseBasicFeatures;

  // Should block premium-only actions?
  const shouldBlockPremium = !canUsePremiumFeatures;

  const isSuspended = myProfile?.plan_type === 'suspended';

  return {
    isLoading,
    isOwner,
    isAdmin,
    isPro,
    isTrialActive,
    isExpired,
    trialDaysLeft,
    trialMsLeft,
    isGuestAccount,
    isGuestExpired,
    canUseBasicFeatures,
    canUsePremiumFeatures,
    shouldBlockBasic,
    shouldBlockPremium,
    isSuspended,
  };
}
