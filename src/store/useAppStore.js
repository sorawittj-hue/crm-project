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

      // Paywall Modal
      isPaywallOpen: false,
      paywallReason: 'default', // 'default', 'trial_ended', 'premium_only'
      openPaywall: (reason = 'default') => set({ isPaywallOpen: true, paywallReason: reason }),
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
