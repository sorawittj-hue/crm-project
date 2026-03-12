import { create } from 'zustand';

export const useAppStore = create((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  
  theme: localStorage.getItem('theme') || 'dark', // Default to dark for high performance feel
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  // War Room Goals
  leaderTarget: 7000000,
  memberTarget: 3000000,
  monthlyTarget: 10000000,
  
  setTargets: (leader, member) => set({ 
    leaderTarget: leader, 
    memberTarget: member, 
    monthlyTarget: leader + member 
  }),

  zenithMode: localStorage.getItem('zenithMode') === 'true',
  toggleZenithMode: () => set((state) => {
    const newVal = !state.zenithMode;
    localStorage.setItem('zenithMode', String(newVal));
    return { zenithMode: newVal };
  }),
}));
