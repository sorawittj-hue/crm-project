import { useAuth } from './useAuth';
import { useMyProfile } from './useUserProfiles';

export function useSubscription() {
  const { user } = useAuth();
  const { data: myProfile, isLoading } = useMyProfile(user?.id);

  // 1. Hardcoded VIP / Owner logic
  const isOwner = user?.email === 'sorawittj@gmail.com';
  
  // 2. Original Guest logic (if someone still uses the demo account)
  const isGuestAccount = user?.email === 'demo@novapipeline.com';

  // 3. Admin logic
  const isAdmin = myProfile?.role === 'admin';

  // If user is owner or admin, they get full PRO access forever.
  const isPro = isOwner || isAdmin || myProfile?.plan_type === 'pro';

  // 4. Trial Logic
  let isTrialActive = false;
  let isExpired = false;
  let trialDaysLeft = 0;

  if (myProfile?.plan_type === 'trial' || (!isPro && !isGuestAccount)) {
    // If no plan_type is set but they are not PRO, we treat them as trial.
    // If trial_ends_at is null, maybe we give them 3 days from `created_at` 
    // or just default to expired if we want to be strict.
    // Let's use `created_at` + 3 days as a fallback if `trial_ends_at` is null.
    
    const startDate = myProfile?.created_at ? new Date(myProfile.created_at) : new Date();
    let endDate = myProfile?.trial_ends_at ? new Date(myProfile.trial_ends_at) : null;
    
    if (!endDate) {
      // Fallback: 3 days after account creation
      endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    }

    const now = new Date();
    isTrialActive = now < endDate;
    isExpired = now >= endDate;
    
    // Calculate days left
    const diffTime = endDate.getTime() - now.getTime();
    trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (trialDaysLeft < 0) trialDaysLeft = 0;
  }

  // Final access checks
  // Can they perform normal actions? (Pro or Trial active)
  const canUseBasicFeatures = isPro || isTrialActive;
  
  // Can they perform premium actions? (Export, Backup)
  const canUsePremiumFeatures = isPro;

  // Should we show the paywall for normal actions?
  // We show it if they are an expired trial or a guest account
  const shouldBlockBasic = !canUseBasicFeatures || isGuestAccount;

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
    shouldBlockBasic
  };
}
