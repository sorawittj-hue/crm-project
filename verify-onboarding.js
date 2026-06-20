// Verification script for onboarding checklist and demo mode

// 1. Mock global localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    getRawStore: () => store
  };
})();

global.localStorage = localStorageMock;

// 2. Import stores and mock data
import { useOnboardingStore } from './src/store/useOnboardingStore.js';
import { useAppStore } from './src/store/useAppStore.js';
import { mockCustomers, mockDeals, mockActivities } from './src/lib/mockData.js';

async function runTests() {
  console.log("=== STARTING ONBOARDING AND DEMO MODE TESTS ===");
  
  let passed = 0;
  let failed = 0;
  
  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Test 1: Initial state of Onboarding Store
  const store = useOnboardingStore.getState();
  assert(!store.isTourActive, "Tour should not be active initially");
  assert(store.currentStep === 0, "Current step should be 0");
  assert(!store.tourCompleted, "Tour should not be completed initially");
  assert(!store.isDemoMode, "Demo mode should be disabled initially");
  
  const initialTasks = store.completedTasks;
  assert(!initialTasks.setTarget, "setTarget task should be incomplete");
  assert(!initialTasks.addCustomer, "addCustomer task should be incomplete");
  assert(!initialTasks.addDeal, "addDeal task should be incomplete");
  assert(!initialTasks.logActivity, "logActivity task should be incomplete");
  assert(!initialTasks.useCalculator, "useCalculator task should be incomplete");

  // Test 2: Completing tasks individually
  useOnboardingStore.getState().completeTask('setTarget');
  assert(useOnboardingStore.getState().completedTasks.setTarget === true, "setTarget should be complete");
  
  useOnboardingStore.getState().completeTask('addCustomer');
  assert(useOnboardingStore.getState().completedTasks.addCustomer === true, "addCustomer should be complete");

  useOnboardingStore.getState().completeTask('addDeal');
  assert(useOnboardingStore.getState().completedTasks.addDeal === true, "addDeal should be complete");

  useOnboardingStore.getState().completeTask('logActivity');
  assert(useOnboardingStore.getState().completedTasks.logActivity === true, "logActivity should be complete");

  useOnboardingStore.getState().completeTask('useCalculator');
  assert(useOnboardingStore.getState().completedTasks.useCalculator === true, "useCalculator should be complete");

  // Test 3: Calculate completion percentage
  const finalTasks = useOnboardingStore.getState().completedTasks;
  const completedCount = Object.values(finalTasks).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);
  assert(progressPercent === 100, "Progress percentage should be 100% when all tasks are complete");

  // Test 4: App Store Target updating
  const appStore = useAppStore.getState();
  assert(appStore.monthlyTarget === 10000000, "Default monthly target should be 10M");
  appStore.setMonthlyTarget(15000000);
  assert(useAppStore.getState().monthlyTarget === 15000000, "Monthly target should update to 15M in Zustand store");

  // Test 5: Reset Onboarding
  useOnboardingStore.getState().resetOnboarding();
  const resetTasks = useOnboardingStore.getState().completedTasks;
  assert(!resetTasks.setTarget, "Reset: setTarget should be false");
  assert(!resetTasks.addCustomer, "Reset: addCustomer should be false");
  assert(!resetTasks.addDeal, "Reset: addDeal should be false");
  assert(!resetTasks.logActivity, "Reset: logActivity should be false");
  assert(!resetTasks.useCalculator, "Reset: useCalculator should be false");
  assert(!useOnboardingStore.getState().isDemoMode, "Reset: Demo Mode should be false");

  // Test 6: Toggle Demo Mode & Storage Seeding
  localStorage.clear();
  assert(!localStorage.getItem('nova_local_deals'), "Storage deals should be empty");
  
  useOnboardingStore.getState().toggleDemoMode();
  assert(useOnboardingStore.getState().isDemoMode === true, "Demo mode should be enabled");
  
  const seededDeals = JSON.parse(localStorage.getItem('nova_local_deals'));
  const seededCustomers = JSON.parse(localStorage.getItem('nova_local_customers'));
  const seededActivities = JSON.parse(localStorage.getItem('nova_local_activities'));
  
  assert(seededDeals && seededDeals.length === mockDeals.length, "Mock deals should be seeded to localStorage");
  assert(seededCustomers && seededCustomers.length === mockCustomers.length, "Mock customers should be seeded to localStorage");
  assert(seededActivities && seededActivities.length === mockActivities.length, "Mock activities should be seeded to localStorage");
  assert(seededDeals[0].title === mockDeals[0].title, "First seeded deal title should match mockDeals");

  // Toggle off demo mode
  useOnboardingStore.getState().toggleDemoMode();
  assert(useOnboardingStore.getState().isDemoMode === false, "Demo mode should be disabled after toggle");

  console.log(`\n=== TEST SUMMARY: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error("Unhandle test rejection:", err);
  process.exit(1);
});
