import { useAuth } from './useAuth';
import { useMyProfile } from './useUserProfiles';
import { isLocalTrialActive as checkLocalTrial, getTrialDaysLeft as getLocalTrialDaysLeft } from '../lib/localDb';

export function useSubscription() {
  const { user } = useAuth();
  const { data: myProfile, isLoading } = useMyProfile(user?.id);

  // 1. Hardcoded VIP / Owner logic
  const isOwner = user?.email === 'sorawittj@gmail.com';
  
  // 2. Local Trial logic
  const isGuestAccount = checkLocalTrial();

  // 3. Admin logic
  const isAdmin = myProfile?.role === 'admin';

  // If user is owner or admin, they get full PRO access forever.
  const isPro = isOwner || isAdmin || myProfile?.plan_type === 'pro';

  // 4. Trial Logic
  let isTrialActive = false;
  let isExpired = false;
  let trialDaysLeft = 0;

  if (isGuestAccount) {
    trialDaysLeft = 3;
    isTrialActive = false; // Guest is read-only
    isExpired = false;
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
    
    const diffTime = endDate.getTime() - now.getTime();
    trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (trialDaysLeft < 0) trialDaysLeft = 0;
  }

  // Final access checks
  // Can they perform normal actions? (Pro or Registered Trial active. Guests are read-only)
  const canUseBasicFeatures = isPro || isTrialActive;
  
  // Can they perform premium actions? (Export, Backup)
  const canUsePremiumFeatures = isPro;

  // Should we show the paywall for normal actions?
  // Guests are blocked from basic actions (read-only showcase mode)
  const shouldBlockBasic = isGuestAccount || !canUseBasicFeatures;

  const isSuspended = myProfile?.plan_type === 'suspended';

  return {
    isLoading,
    isOwner,
    isAdmin,
    isPro,
    isTrialActive,
    isExpired,
    trialDaysLeft,
    isGuestAccount,
    canUseBasicFeatures,
    canUsePremiumFeatures,
    shouldBlockBasic,
    isSuspended
  };
}

