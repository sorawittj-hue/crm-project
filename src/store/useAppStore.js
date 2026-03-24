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

      // Zenith Mode (dark theme toggle)
      zenithMode: false,
      toggleZenithMode: () => set((state) => ({ zenithMode: !state.zenithMode })),

      // Global Search
      globalSearchTerm: '',
      setGlobalSearchTerm: (term) => set({ globalSearchTerm: term }),
    }),
    {
      name: 'zenith-crm-store',
      partialize: (state) => ({
        zenithMode: state.zenithMode,
        monthlyTarget: state.monthlyTarget,
      }),
    }
  )
);
