import { mockCustomers, mockDeals, mockActivities } from './mockData';

// ==============================
// Session-scoped storage keys
// Each guest gets a unique session ID so multiple users
// on the same device don't share data.
// ==============================

const GLOBAL_KEYS = {
  SESSION_ID: 'nova_guest_session_id',
  TRIAL_STATE: 'nova_trial_state', // kept for backward compatibility
};

const getSessionId = () => {
  let id = sessionStorage.getItem(GLOBAL_KEYS.SESSION_ID);
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substr(2, 12) + '_' + Date.now();
    sessionStorage.setItem(GLOBAL_KEYS.SESSION_ID, id);
  }
  return id;
};

// Session-scoped localStorage keys (per-tab / per-browser-session)
const getSessionKeys = () => {
  const sid = getSessionId();
  return {
    TRIAL_STATE: `nova_trial_state_${sid}`,
    DEALS: `nova_local_deals_${sid}`,
    CUSTOMERS: `nova_local_customers_${sid}`,
    ACTIVITIES: `nova_local_activities_${sid}`,
  };
};

// Trial duration: 3 days in milliseconds
const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

// ==============================
// 1. Trial State Management
// ==============================

export const startLocalTrial = () => {
  const keys = getSessionKeys();
  const trialState = {
    isActive: true,
    startTime: Date.now(),
    expiresAt: Date.now() + TRIAL_DURATION_MS,
  };
  localStorage.setItem(keys.TRIAL_STATE, JSON.stringify(trialState));
  
  // Initialize with fresh seed data for this session
  localStorage.setItem(keys.DEALS, JSON.stringify(mockDeals));
  localStorage.setItem(keys.CUSTOMERS, JSON.stringify(mockCustomers));
  localStorage.setItem(keys.ACTIVITIES, JSON.stringify(mockActivities));
};

export const getTrialState = () => {
  try {
    const keys = getSessionKeys();
    const raw = localStorage.getItem(keys.TRIAL_STATE);
    if (!raw) {
      // Check legacy key for backward compatibility
      const legacy = localStorage.getItem(GLOBAL_KEYS.TRIAL_STATE);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        // Migrate: add expiresAt if missing
        if (!parsed.expiresAt && parsed.startTime) {
          parsed.expiresAt = parsed.startTime + TRIAL_DURATION_MS;
        }
        return parsed;
      }
      return { isActive: false, startTime: null, expiresAt: null };
    }
    return JSON.parse(raw);
  } catch {
    return { isActive: false, startTime: null, expiresAt: null };
  }
};

export const endLocalTrial = () => {
  const keys = getSessionKeys();
  localStorage.removeItem(keys.TRIAL_STATE);
  localStorage.removeItem(keys.DEALS);
  localStorage.removeItem(keys.CUSTOMERS);
  localStorage.removeItem(keys.ACTIVITIES);
  // Also clear legacy keys
  localStorage.removeItem(GLOBAL_KEYS.TRIAL_STATE);
  localStorage.removeItem('nova_local_deals');
  localStorage.removeItem('nova_local_customers');
  localStorage.removeItem('nova_local_activities');
  sessionStorage.removeItem(GLOBAL_KEYS.SESSION_ID);
};

export const isLocalTrialActive = () => {
  const state = getTrialState();
  if (!state.isActive) return false;
  // Check real time expiry
  if (state.expiresAt && Date.now() >= state.expiresAt) {
    // Auto-mark as expired without destroying data
    return false;
  }
  return true;
};

export const isLocalTrialExpired = () => {
  const state = getTrialState();
  if (!state.isActive && !state.startTime) return false; // never started
  if (!state.expiresAt) return false;
  return Date.now() >= state.expiresAt;
};

// Returns milliseconds left (precise for countdown timers)
export const getTrialMsLeft = () => {
  const state = getTrialState();
  if (!state.isActive || !state.expiresAt) return 0;
  return Math.max(0, state.expiresAt - Date.now());
};

// Returns days left (for display)
export const getTrialDaysLeft = () => {
  const msLeft = getTrialMsLeft();
  return Math.ceil(msLeft / (1000 * 60 * 60 * 24));
};

// Reset session — clear data and start fresh (for "Reset Demo" feature)
export const resetGuestSession = () => {
  endLocalTrial();
  startLocalTrial();
};

// ==============================
// 2. Generic Helpers
// ==============================

const getList = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveList = (key, list) => {
  localStorage.setItem(key, JSON.stringify(list));
};

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

// ==============================
// 3. Deals
// ==============================
export const getLocalDeals = () => getList(getSessionKeys().DEALS);

export const addLocalDeal = (deal) => {
  const keys = getSessionKeys();
  const deals = getLocalDeals();
  const newDeal = { ...deal, id: generateId('deal'), created_at: new Date().toISOString() };
  deals.unshift(newDeal);
  saveList(keys.DEALS, deals);
  return newDeal;
};

export const updateLocalDeal = (id, updates) => {
  const keys = getSessionKeys();
  const deals = getLocalDeals();
  const idx = deals.findIndex(d => d.id === id);
  if (idx !== -1) {
    deals[idx] = { ...deals[idx], ...updates, updated_at: new Date().toISOString() };
    saveList(keys.DEALS, deals);
    return deals[idx];
  }
  return null;
};

export const deleteLocalDeals = (ids) => {
  const keys = getSessionKeys();
  const deals = getLocalDeals();
  const filtered = deals.filter(d => !ids.includes(d.id));
  saveList(keys.DEALS, filtered);
};

// ==============================
// 4. Customers
// ==============================
export const getLocalCustomers = () => getList(getSessionKeys().CUSTOMERS);

export const addLocalCustomer = (customer) => {
  const keys = getSessionKeys();
  const customers = getLocalCustomers();
  const newCustomer = { ...customer, id: generateId('cust'), created_at: new Date().toISOString() };
  customers.unshift(newCustomer);
  saveList(keys.CUSTOMERS, customers);
  return newCustomer;
};

export const updateLocalCustomer = (id, updates) => {
  const keys = getSessionKeys();
  const customers = getLocalCustomers();
  const idx = customers.findIndex(c => c.id === id);
  if (idx !== -1) {
    customers[idx] = { ...customers[idx], ...updates, updated_at: new Date().toISOString() };
    saveList(keys.CUSTOMERS, customers);
    return customers[idx];
  }
  return null;
};

export const deleteLocalCustomer = (id) => {
  const keys = getSessionKeys();
  const customers = getLocalCustomers();
  const filtered = customers.filter(c => c.id !== id);
  saveList(keys.CUSTOMERS, filtered);
};

// ==============================
// 5. Activities
// ==============================
export const getLocalActivities = () => getList(getSessionKeys().ACTIVITIES);

export const addLocalActivity = (activity) => {
  const keys = getSessionKeys();
  const activities = getLocalActivities();
  const newActivity = { ...activity, id: generateId('act'), created_at: new Date().toISOString() };
  activities.unshift(newActivity);
  saveList(keys.ACTIVITIES, activities);
  return newActivity;
};

export const updateLocalActivity = (id, updates) => {
  const keys = getSessionKeys();
  const activities = getLocalActivities();
  const idx = activities.findIndex(a => a.id === id);
  if (idx !== -1) {
    activities[idx] = { ...activities[idx], ...updates, updated_at: new Date().toISOString() };
    saveList(keys.ACTIVITIES, activities);
    return activities[idx];
  }
  return null;
};

export const deleteLocalActivity = (id) => {
  const keys = getSessionKeys();
  const activities = getLocalActivities();
  const filtered = activities.filter(a => a.id !== id);
  saveList(keys.ACTIVITIES, filtered);
};
