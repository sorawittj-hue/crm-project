import { supabase } from '../utils/supabase';
import {
  addOwnerIdIfSupported,
  filterRowsByOwner,
  getRequiredUserId,
  isMissingColumnError,
  removeMissingColumn,
} from './sessionScope';

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
      .order('created_at', { ascending: false });

    if (error) throw error;
    return filterRowsByOwner('activities', data, userId);
  } catch (error) {
    if (isMissingColumnError(error)) {
      const { data, error: legacyError } = await supabase
        .from('activities')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (!legacyError) return data || [];
    }

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
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return filterRowsByOwner('activities', data, userId);
  } catch (error) {
    if (isMissingColumnError(error)) {
      const { data, error: legacyError } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!legacyError) return data || [];
    }

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

    let payload = addOwnerIdIfSupported('activities', {
      deal_id: activityData.deal_id || null,
      customer_id: activityData.customer_id || null,
      type: activityData.type,
      title: activityData.title.trim(),
      description: activityData.description?.trim() || null,
      scheduled_at: activityData.scheduled_at || null,
      completed_at: activityData.completed_at || null,
      result: activityData.result || null,
      created_by: activityData.created_by ?? userId,
      metadata: activityData.metadata || {},
      created_at: new Date().toISOString(),
    }, userId);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data: result, error } = await supabase
        .from('activities')
        .insert([payload])
        .select();

      if (!error) return result?.[0];
      if (!isMissingColumnError(error)) throw error;

      const nextPayload = removeMissingColumn(payload, error);
      if (nextPayload === payload) throw error;
      payload = nextPayload;
    }

    return payload;
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
    await getRequiredUserId();
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    if (isMissingColumnError(error)) {
      const { error: legacyError } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (!legacyError) return true;
    }

    console.error('Error deleting activity:', error);
    throw new Error('Failed to delete activity: ' + error.message);
  }
}
