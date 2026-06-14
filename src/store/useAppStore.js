import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      // Sidebar
      isSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),

      // Monthly Target (synced with settings via React Query, this is the local override)
      monthlyTarget: 10000000,
      setMonthlyTarget: (value) => set({ monthlyTarget: Number(value) || 10000000 }),

      // Global Search
      globalSearchTerm: '',
      setGlobalSearchTerm: (term) => set({ globalSearchTerm: term }),

      // Pending deal to open when navigating to /pipeline (from notifications, dashboard, etc.)
      pendingOpenDeal: null,
      setPendingOpenDeal: (deal) => set({ pendingOpenDeal: deal }),
      clearPendingOpenDeal: () => set({ pendingOpenDeal: null }),

      // Pending customer for new deal creation (when redirecting from Customers to Pipeline)
      pendingNewDealCustomer: null,
      setPendingNewDealCustomer: (customer) => set({ pendingNewDealCustomer: customer }),
      clearPendingNewDealCustomer: () => set({ pendingNewDealCustomer: null }),

      // Global Quick Add Modal
      isQuickAddOpen: false,
      openQuickAdd: () => set({ isQuickAddOpen: true }),
      closeQuickAdd: () => set({ isQuickAddOpen: false }),

      // Paywall Modal
      isPaywallOpen: false,
      paywallReason: 'default', // 'default', 'trial_ended', 'premium_only', 'guest_upgrade'
      openPaywall: (reason = 'default') => {
        let finalReason = reason;
        if (reason === 'default' || reason === 'upgrade') {
          try {
            const raw = localStorage.getItem('nova_trial_state');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.isActive) {
                finalReason = 'guest_upgrade';
              }
            }
          } catch (e) {
            // Silently ignore
          }
        }
        set({ isPaywallOpen: true, paywallReason: finalReason });
      },
      closePaywall: () => set({ isPaywallOpen: false }),
    }),
    {
      name: 'nova-pipeline-store',
      partialize: (state) => ({
        monthlyTarget: state.monthlyTarget,
      }),
    }
  )
);
