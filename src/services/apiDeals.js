import { supabase } from '../utils/supabase';

/**
 * Fetch all deals with error handling
 */
export async function fetchDeals() {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw new Error('Failed to load deals: ' + error.message);
  }
}

/**
 * Get a single deal by ID
 */
export async function getDealById(id) {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching deal:', error);
    throw new Error('Failed to load deal: ' + error.message);
  }
}

/**
 * Update a deal with validation
 */
export async function updateDeal({ id, ...updates }) {
  try {
    if (!id) throw new Error('Deal ID is required');

    // Validate stage transitions
    const validStages = ['lead', 'contact', 'proposal', 'negotiation', 'won', 'lost'];
    if (updates.stage && !validStages.includes(updates.stage)) {
      throw new Error('Invalid stage value');
    }

    // Validate probability
    if (updates.probability !== undefined) {
      if (updates.probability < 0 || updates.probability > 100) {
        throw new Error('Probability must be between 0 and 100');
      }
    }

    // Auto-set actual_close_date when stage changes to won/lost
    if (updates.stage === 'won' || updates.stage === 'lost') {
      updates.actual_close_date = updates.actual_close_date || new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('deals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('Error updating deal:', error);
    throw new Error('Failed to update deal: ' + error.message);
  }
}

/**
 * Get current authenticated user ID from Supabase session
 */
async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Create a new deal with validation
 */
export async function addDeal(newDeal) {
  try {
    // Required fields validation
    if (!newDeal.title) {
      throw new Error('Deal title is required');
    }

    // Get current user ID for assigned_to
    const userId = await getCurrentUserId();

    // Set defaults - use authenticated user ID or null (not hardcoded 'leader')
    const dealData = {
      title: newDeal.title.trim(),
      company: newDeal.company?.trim() || null,
      value: Number(newDeal.value) || 0,
      stage: newDeal.stage || 'lead',
      probability: newDeal.probability || 0,
      // Use provided assigned_to, or authenticated user ID, or null
      assigned_to: newDeal.assigned_to ?? userId ?? null,
      contact: newDeal.contact?.trim() || null,
      contact_email: newDeal.contact_email?.trim() || null,
      contact_phone: newDeal.contact_phone?.trim() || null,
      description: newDeal.description?.trim() || null,
      source: newDeal.source || 'inbound',
      priority: newDeal.priority || 'medium',
      expected_close_date: newDeal.expected_close_date || null,
      last_activity: newDeal.last_activity || new Date().toISOString(),
      next_step: newDeal.next_step || null,
      tags: newDeal.tags || [],
      metadata: newDeal.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('deals')
      .insert([dealData])
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('Error creating deal:', error);
    throw new Error('Failed to create deal: ' + error.message);
  }
}

/**
 * Create multiple deals
 */
export async function addMultipleDeals(deals) {
  try {
    if (!Array.isArray(deals) || deals.length === 0) {
      throw new Error('At least one deal is required');
    }

    // Get current user ID for assigned_to
    const userId = await getCurrentUserId();

    const dealsData = deals.map(newDeal => ({
      title: newDeal.title?.trim() || 'Untitled Deal',
      company: newDeal.company?.trim() || null,
      value: Number(newDeal.value) || 0,
      stage: newDeal.stage || 'lead',
      probability: newDeal.probability || 0,
      // Use provided assigned_to, or authenticated user ID, or null
      assigned_to: newDeal.assigned_to ?? userId ?? null,
      contact: newDeal.contact?.trim() || null,
      contact_email: newDeal.contact_email?.trim() || null,
      contact_phone: newDeal.contact_phone?.trim() || null,
      description: newDeal.description?.trim() || null,
      source: newDeal.source || 'inbound',
      priority: newDeal.priority || 'medium',
      expected_close_date: newDeal.expected_close_date || null,
      last_activity: newDeal.last_activity || new Date().toISOString(),
      next_step: newDeal.next_step || null,
      tags: newDeal.tags || [],
      metadata: newDeal.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('deals')
      .insert(dealsData)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating multiple deals:', error);
    throw new Error('Failed to create multiple deals: ' + error.message);
  }
}

/**
 * Delete multiple deals
 */
export async function deleteDeals(ids) {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('At least one deal ID is required');
    }

    const { error } = await supabase
      .from('deals')
      .delete()
      .in('id', ids);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting deals:', error);
    throw new Error('Failed to delete deals: ' + error.message);
  }
}

/**
 * Bulk update deals
 */
export async function bulkUpdateDeals(ids, updates) {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('At least one deal ID is required');
    }

    const { data, error } = await supabase
      .from('deals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .in('id', ids)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error bulk updating deals:', error);
    throw new Error('Failed to update deals: ' + error.message);
  }
}

/**
 * Search deals - throws errors so react-query can catch them
 */
export async function searchDeals(query, filters = {}) {
  try {
    let builder = supabase.from('deals').select('*');

    // Text search
    if (query) {
      builder = builder.or(`title.ilike.%${query}%,company.ilike.%${query}%`);
    }

    // Stage filter
    if (filters.stage) {
      builder = builder.eq('stage', filters.stage);
    }

    // Assigned to filter
    if (filters.assigned_to) {
      builder = builder.eq('assigned_to', filters.assigned_to);
    }

    // Value range
    if (filters.minValue) {
      builder = builder.gte('value', filters.minValue);
    }
    if (filters.maxValue) {
      builder = builder.lte('value', filters.maxValue);
    }

    const { data, error } = await builder.order('created_at', { ascending: false });

    // Throw error instead of returning empty array
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching deals:', error);
    // Throw error so react-query can catch it and display error message
    throw new Error('Failed to search deals: ' + error.message);
  }
}
