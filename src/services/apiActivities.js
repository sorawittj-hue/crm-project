import { supabase } from '../utils/supabase';
import { getRequiredUserId } from './sessionScope';

/**
 * Fetch activities for a specific deal
 */
export async function fetchActivitiesByDeal(dealId) {
  try {
    const userId = await getRequiredUserId();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('deal_id', dealId)
      .eq('owner_id', userId)
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
    const userId = await getRequiredUserId();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('owner_id', userId)
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

    const userId = await getRequiredUserId();

    const data = {
      deal_id: activityData.deal_id || null,
      customer_id: activityData.customer_id || null,
      type: activityData.type,
      title: activityData.title.trim(),
      description: activityData.description?.trim() || null,
      scheduled_at: activityData.scheduled_at || null,
      completed_at: activityData.completed_at || null,
      result: activityData.result || null,
      owner_id: userId,
      created_by: activityData.created_by ?? userId,
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
    const userId = await getRequiredUserId();
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('owner_id', userId)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw new Error('Failed to delete activity: ' + error.message);
  }
}
