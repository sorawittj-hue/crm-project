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
    }),
    {
      name: 'zenith-crm-store',
      partialize: (state) => ({
        monthlyTarget: state.monthlyTarget,
      }),
    }
  )
);
