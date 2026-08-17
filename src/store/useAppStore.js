import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const applyThemeToDOM = (theme) => {
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);
  
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Theme Management
      theme: 'dark', // 'dark' | 'light' | 'system'
      setTheme: (theme) => {
        applyThemeToDOM(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const currentTheme = get().theme;
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyThemeToDOM(nextTheme);
        set({ theme: nextTheme });
      },

      // Sidebar
      isSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),

      // Monthly Target
      monthlyTarget: 10000000,
      setMonthlyTarget: (value) => set({ monthlyTarget: Number(value) || 10000000 }),

      // Global Search
      globalSearchTerm: '',
      setGlobalSearchTerm: (term) => set({ globalSearchTerm: term }),

      // Pending deal to open when navigating to /pipeline
      pendingOpenDeal: null,
      setPendingOpenDeal: (deal) => set({ pendingOpenDeal: deal }),
      clearPendingOpenDeal: () => set({ pendingOpenDeal: null }),

      // Pending customer for new deal creation
      pendingNewDealCustomer: null,
      setPendingNewDealCustomer: (customer) => set({ pendingNewDealCustomer: customer }),
      clearPendingNewDealCustomer: () => set({ pendingNewDealCustomer: null }),

      // Global Quick Add Modal
      isQuickAddOpen: false,
      openQuickAdd: () => set({ isQuickAddOpen: true }),
      closeQuickAdd: () => set({ isQuickAddOpen: false }),

      // Paywall Modal
      isPaywallOpen: false,
      paywallReason: 'default',
      openPaywall: (reason = 'default') => {
        let finalReason = reason;
        if (reason === 'default' || reason === 'upgrade') {
          try {
            const sessionId = sessionStorage.getItem('nova_guest_session_id');
            const raw = sessionId
              ? localStorage.getItem(`nova_trial_state_${sessionId}`)
              : localStorage.getItem('nova_trial_state');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.isActive) {
                finalReason = 'guest_upgrade';
              }
            }
          } catch {
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
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDOM(state.theme);
        } else {
          applyThemeToDOM('dark');
        }
      }
    }
  )
);
