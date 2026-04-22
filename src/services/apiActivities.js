import { supabase } from '../utils/supabase';

/**
 * Get current authenticated user ID from Supabase session
 */
async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Fetch activities for a specific deal
 */
export async function fetchActivitiesByDeal(dealId) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

/**
 * Fetch all activities
 */
export async function fetchActivities() {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

/**
 * Create a new activity
 */
export async function addActivity(activityData) {
  try {
    if (!activityData.type || !activityData.title) {
      throw new Error('Activity type and title are required');
    }

    // Get current user ID for created_by
    const userId = await getCurrentUserId();

    const data = {
      deal_id: activityData.deal_id || null,
      customer_id: activityData.customer_id || null,
      type: activityData.type,
      title: activityData.title.trim(),
      description: activityData.description?.trim() || null,
      scheduled_at: activityData.scheduled_at || null,
      completed_at: activityData.completed_at || null,
      result: activityData.result || null,
      created_by: activityData.created_by ?? userId ?? null,
      metadata: activityData.metadata || {},
      created_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from('activities')
      .insert([data])
      .select();

    if (error) throw error;
    return result?.[0];
  } catch (error) {
    console.error('Error creating activity:', error);
    throw new Error('Failed to create activity: ' + error.message);
  }
}

/**
 * Delete an activity
 */
export async function deleteActivity(id) {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw new Error('Failed to delete activity: ' + error.message);
  }
}
