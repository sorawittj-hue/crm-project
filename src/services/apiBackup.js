import { supabase } from '../utils/supabase';

// Export all user data from Supabase into a JSON object
export async function exportWorkspaceData(userId) {
  if (!userId) throw new Error('User ID is required for export');

  const [
    { data: deals, error: errDeals },
    { data: customers, error: errCustomers },
    { data: activities, error: errActivities },
  ] = await Promise.all([
    supabase.from('deals').select('*').eq('owner_id', userId),
    supabase.from('customers').select('*').eq('owner_id', userId),
    supabase.from('activities').select('*').eq('owner_id', userId)
  ]);

  if (errDeals) throw errDeals;
  if (errCustomers) throw errCustomers;
  if (errActivities) throw errActivities;

  return {
    version: '1.0',
    export_date: new Date().toISOString(),
    owner_id: userId,
    data: {
      deals: deals || [],
      customers: customers || [],
      activities: activities || []
    }
  };
}

// Restore data by inserting/overwriting records using Supabase upsert
export async function restoreWorkspaceData(parsedJson, userId) {
  if (!userId) throw new Error('User ID is required for restore');
  if (!parsedJson || !parsedJson.data) throw new Error('Invalid backup file format');

  const { deals = [], customers = [], activities = [] } = parsedJson.data;

  // Validate ownership
  if (parsedJson.owner_id && parsedJson.owner_id !== userId) {
    console.warn("Backup file belongs to a different user ID. It will be imported to the current user.");
  }

  // Ensure all records have the correct owner_id for safety
  const safeCustomers = customers.map(c => ({ ...c, owner_id: userId }));
  const safeDeals = deals.map(d => ({ ...d, owner_id: userId }));
  const safeActivities = activities.map(a => ({ ...a, owner_id: userId }));

  // We should upsert in order: Customers -> Deals -> Activities (to respect foreign keys if any, though Supabase might not enforce strict FK if not configured, but it's best practice)
  
  if (safeCustomers.length > 0) {
    const { error } = await supabase.from('customers').upsert(safeCustomers);
    if (error) throw new Error(`Failed to restore customers: ${error.message}`);
  }

  if (safeDeals.length > 0) {
    const { error } = await supabase.from('deals').upsert(safeDeals);
    if (error) throw new Error(`Failed to restore deals: ${error.message}`);
  }

  if (safeActivities.length > 0) {
    const { error } = await supabase.from('activities').upsert(safeActivities);
    if (error) throw new Error(`Failed to restore activities: ${error.message}`);
  }

  return {
    customersCount: safeCustomers.length,
    dealsCount: safeDeals.length,
    activitiesCount: safeActivities.length
  };
}

// Factory Reset - delete all user data
export async function factoryResetWorkspace(userId) {
  if (!userId) throw new Error('User ID is required for factory reset');

  // Delete in reverse order of relationships
  await supabase.from('activities').delete().eq('owner_id', userId);
  await supabase.from('deals').delete().eq('owner_id', userId);
  await supabase.from('customers').delete().eq('owner_id', userId);

  return true;
}
