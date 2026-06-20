import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockCustomers, mockDeals, mockActivities } from '../lib/mockData';

export const useOnboardingStore = create(
  persist(
    (set) => ({
      // Tour status
      isTourActive: false,
      currentStep: 0,
      tourCompleted: false,

      // Checklist completion status
      completedTasks: {
        setTarget: false,
        addCustomer: false,
        addDeal: false,
        logActivity: false,
        useCalculator: false,
      },
      
      // Sandbox state
      isDemoMode: false,

      // Actions
      startTour: () => set({ isTourActive: true, currentStep: 0 }),
      endTour: () => set({ isTourActive: false, tourCompleted: true }),
      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
      
      completeTask: (taskKey) => set((state) => ({
        completedTasks: { ...state.completedTasks, [taskKey]: true }
      })),
      
      toggleDemoMode: () => set((state) => {
        const nextDemoMode = !state.isDemoMode;
        if (nextDemoMode) {
          // Initialize local DB with seed data if they are empty
          if (!localStorage.getItem('nova_local_deals')) {
            localStorage.setItem('nova_local_deals', JSON.stringify(mockDeals));
          }
          if (!localStorage.getItem('nova_local_customers')) {
            localStorage.setItem('nova_local_customers', JSON.stringify(mockCustomers));
          }
          if (!localStorage.getItem('nova_local_activities')) {
            localStorage.setItem('nova_local_activities', JSON.stringify(mockActivities));
          }
        }
        return { isDemoMode: nextDemoMode };
      }),
      
      resetOnboarding: () => set({
        isTourActive: false,
        currentStep: 0,
        tourCompleted: false,
        completedTasks: {
          setTarget: false,
          addCustomer: false,
          addDeal: false,
          logActivity: false,
          useCalculator: false,
        },
        isDemoMode: false,
      }),
    }),
    {
      name: 'nova-onboarding-store',
    }
  )
);

