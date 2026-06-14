import { mockCustomers, mockDeals, mockActivities } from './mockData';

const STORAGE_KEYS = {
  TRIAL_STATE: 'nova_trial_state',
  DEALS: 'nova_local_deals',
  CUSTOMERS: 'nova_local_customers',
  ACTIVITIES: 'nova_local_activities',
};

// ==============================
// 1. Trial State Management
// ==============================

export const startLocalTrial = () => {
  const trialState = {
    isActive: true,
    startTime: Date.now(),
  };
  localStorage.setItem(STORAGE_KEYS.TRIAL_STATE, JSON.stringify(trialState));
  
  // Initialize with seed data if empty
  if (!localStorage.getItem(STORAGE_KEYS.DEALS)) {
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(mockDeals));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(mockCustomers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(mockActivities));
  }
};

export const getTrialState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRIAL_STATE);
    if (!raw) return { isActive: false, startTime: null };
    return JSON.parse(raw);
  } catch (e) {
    return { isActive: false, startTime: null };
  }
};

export const endLocalTrial = () => {
  localStorage.removeItem(STORAGE_KEYS.TRIAL_STATE);
  localStorage.removeItem(STORAGE_KEYS.DEALS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
};

export const isLocalTrialActive = () => {
  return getTrialState().isActive;
};

// Trial limit is 3 days
export const getTrialDaysLeft = () => {
  const state = getTrialState();
  if (!state.isActive) return 0;
  
  const msPassed = Date.now() - state.startTime;
  const daysPassed = msPassed / (1000 * 60 * 60 * 24);
  return Math.max(0, 3 - daysPassed);
};

// ==============================
// 2. Generic Helpers
// ==============================

const getList = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
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
export const getLocalDeals = () => getList(STORAGE_KEYS.DEALS);

export const addLocalDeal = (deal) => {
  const deals = getLocalDeals();
  const newDeal = { ...deal, id: generateId('deal'), created_at: new Date().toISOString() };
  deals.unshift(newDeal);
  saveList(STORAGE_KEYS.DEALS, deals);
  return newDeal;
};

export const updateLocalDeal = (id, updates) => {
  const deals = getLocalDeals();
  const idx = deals.findIndex(d => d.id === id);
  if (idx !== -1) {
    deals[idx] = { ...deals[idx], ...updates, updated_at: new Date().toISOString() };
    saveList(STORAGE_KEYS.DEALS, deals);
    return deals[idx];
  }
  return null;
};

export const deleteLocalDeals = (ids) => {
  const deals = getLocalDeals();
  const filtered = deals.filter(d => !ids.includes(d.id));
  saveList(STORAGE_KEYS.DEALS, filtered);
};

// ==============================
// 4. Customers
// ==============================
export const getLocalCustomers = () => getList(STORAGE_KEYS.CUSTOMERS);

export const addLocalCustomer = (customer) => {
  const customers = getLocalCustomers();
  const newCustomer = { ...customer, id: generateId('cust'), created_at: new Date().toISOString() };
  customers.unshift(newCustomer);
  saveList(STORAGE_KEYS.CUSTOMERS, customers);
  return newCustomer;
};

export const updateLocalCustomer = (id, updates) => {
  const customers = getLocalCustomers();
  const idx = customers.findIndex(c => c.id === id);
  if (idx !== -1) {
    customers[idx] = { ...customers[idx], ...updates, updated_at: new Date().toISOString() };
    saveList(STORAGE_KEYS.CUSTOMERS, customers);
    return customers[idx];
  }
  return null;
};

export const deleteLocalCustomer = (id) => {
  const customers = getLocalCustomers();
  const filtered = customers.filter(c => c.id !== id);
  saveList(STORAGE_KEYS.CUSTOMERS, filtered);
};

// ==============================
// 5. Activities
// ==============================
export const getLocalActivities = () => getList(STORAGE_KEYS.ACTIVITIES);

export const addLocalActivity = (activity) => {
  const activities = getLocalActivities();
  const newActivity = { ...activity, id: generateId('act'), created_at: new Date().toISOString() };
  activities.unshift(newActivity);
  saveList(STORAGE_KEYS.ACTIVITIES, activities);
  return newActivity;
};

export const updateLocalActivity = (id, updates) => {
  const activities = getLocalActivities();
  const idx = activities.findIndex(a => a.id === id);
  if (idx !== -1) {
    activities[idx] = { ...activities[idx], ...updates, updated_at: new Date().toISOString() };
    saveList(STORAGE_KEYS.ACTIVITIES, activities);
    return activities[idx];
  }
  return null;
};

export const deleteLocalActivity = (id) => {
  const activities = getLocalActivities();
  const filtered = activities.filter(a => a.id !== id);
  saveList(STORAGE_KEYS.ACTIVITIES, filtered);
};
