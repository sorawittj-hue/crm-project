import { supabase } from '../utils/supabase';
import {
  addOwnerIdIfSupported,
  ensureOwnerTeamMember,
  filterRowByOwner,
  filterRowsByOwner,
  getRequiredUserId,
  isMissingColumnError,
  removeMissingColumn,
} from './sessionScope';

/**
 * Fetch all customers with their stats
 */
export async function fetchCustomers(options = {}) {
  const { page = 1, limit = 2000 } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const userId = await getRequiredUserId();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    return filterRowsByOwner('customers', data, userId);
  } catch (error) {
    if (isMissingColumnError(error)) {
      const { data, error: legacyError } = await supabase
        .from('customers')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!legacyError) return data || [];
    }

    console.error('Error fetching customers:', error);
    throw new Error('Failed to load customers: ' + error.message);
  }
}

/**
 * Get a single customer by ID with deals
 */
export async function getCustomerById(id) {
  try {
    const userId = await getRequiredUserId();
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    const ownedCustomer = filterRowByOwner('customers', customer, userId);
    if (!ownedCustomer) throw new Error('Customer not found');
    
    // Fetch related deals
    const { data: deals } = await supabase
      .from('deals')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });
    
    return { ...ownedCustomer, deals: filterRowsByOwner('deals', deals, userId) };
  } catch (error) {
    if (isMissingColumnError(error)) {
      const { data: customer, error: legacyCustomerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (legacyCustomerError) {
        console.error('Error fetching customer:', legacyCustomerError);
        throw new Error('Failed to load customer: ' + legacyCustomerError.message);
      }

      const { data: deals } = await supabase
        .from('deals')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });

      return { ...customer, deals: deals || [] };
    }

    console.error('Error fetching customer:', error);
    throw new Error('Failed to load customer: ' + error.message);
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email) return true;
  return EMAIL_REGEX.test(email.trim());
}

function sanitizePhone(phone) {
  if (!phone) return null;
  return phone.trim().replace(/[^\d+x()-]/g, ''); // Keep digits, +, x, (), -
}

/**
 * Create a new customer
 */
export async function createCustomer(customerData) {
  try {
    // Validation
    if (!customerData.name || !customerData.name.trim()) {
      throw new Error('Customer name is required');
    }

    if (customerData.email && !validateEmail(customerData.email)) {
      throw new Error('Invalid email address format');
    }

    const validTiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const tier = customerData.tier && validTiers.includes(customerData.tier) ? customerData.tier : 'Silver';
    const phone = sanitizePhone(customerData.phone);
    
    const userId = await getRequiredUserId();
    let payload = addOwnerIdIfSupported('customers', {
      name: customerData.name.trim(),
      company: customerData.company?.trim() || null,
      email: customerData.email?.trim() || null,
      phone,
      address: customerData.address?.trim() || null,
      tax_id: customerData.tax_id?.trim() || null,
      industry: customerData.industry || null,
      tier,
      notes: customerData.notes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, userId);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data: result, error } = await supabase
        .from('customers')
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
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer: ' + error.message);
  }
}

/**
 * Known columns for the customers table.
 * Any extra fields (e.g. computed join data like `deals`) are stripped
 * before the PATCH request to avoid a 400 from PostgREST.
 */
const CUSTOMER_COLUMNS = new Set([
  'name', 'company', 'email', 'phone', 'address',
  'tax_id', 'industry', 'tier', 'notes',
  'owner_id', 'updated_at',
]);

/**
 * Update a customer
 */
export async function updateCustomer({ id, ...updates }) {
  try {
    if (!id) throw new Error('Customer ID is required');
    await getRequiredUserId();
    await ensureOwnerTeamMember();

    if (updates.email && !validateEmail(updates.email)) {
      throw new Error('Invalid email address format');
    }

    if (updates.phone !== undefined) {
      updates.phone = sanitizePhone(updates.phone);
    }

    const validTiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    if (updates.tier && !validTiers.includes(updates.tier)) {
      throw new Error('Invalid customer tier');
    }

    // Strip any keys that are not real DB columns (e.g. joined `deals` array)
    let payload = Object.fromEntries(
      Object.entries(updates).filter(([key]) => CUSTOMER_COLUMNS.has(key))
    );
    payload.updated_at = new Date().toISOString();

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data, error } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', id)
        .select();

      if (!error) return data?.[0];

      if (!isMissingColumnError(error)) {
        console.error('Error updating customer:', error);
        throw new Error('Failed to update customer: ' + error.message);
      }

      const nextPayload = removeMissingColumn(payload, error);
      if (nextPayload === payload) {
        console.error('Error updating customer (cannot remove column):', error);
        throw new Error('Failed to update customer: ' + error.message);
      }
      payload = nextPayload;
    }

    return null;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error instanceof Error ? error : new Error('Failed to update customer');
  }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id) {
  try {
    if (!id) throw new Error('Customer ID is required');
    await getRequiredUserId();
    await ensureOwnerTeamMember();
    
    const { error } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    if (isMissingColumnError(error)) {
      const { error: legacyError } = await supabase
        .from('customers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (!legacyError) return true;
    }

    console.error('Error deleting customer:', error);
    throw new Error('Failed to delete customer: ' + error.message);
  }
}

/**
 * Search customers
 */
export async function searchCustomers(query) {
  try {
    const userId = await getRequiredUserId();
    const { data, error } = await supabase.rpc('search_customers', { search_query: query });
    
    if (error) {
      // Fallback to simple search if RPC function doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%,company.ilike.%${query}%`);

      if (isMissingColumnError(fallbackError)) {
        const { data: legacyData } = await supabase
          .from('customers')
          .select('*')
          .or(`name.ilike.%${query}%,company.ilike.%${query}%`);
        return legacyData || [];
      }

      return filterRowsByOwner('customers', fallbackData, userId);
    }
    
    return filterRowsByOwner('customers', data, userId);
  } catch (error) {
    console.error('Error searching customers:', error);
    throw new Error('Failed to search customers: ' + error.message);
  }
}

/**
 * Get customer statistics
 */
export async function getCustomerStats(customerId) {
  try {
    await getRequiredUserId();
    const { data, error } = await supabase.rpc('get_customer_stats', { customer_id: customerId });
    
    if (error) {
      // Fallback: manually calculate stats
      const { data: deals } = await supabase
        .from('deals')
        .select('value, stage')
        .eq('customer_id', customerId);
      
      const wonValue = deals?.filter(d => d.stage === 'won').reduce((sum, d) => sum + (d.value || 0), 0) || 0;
      const activeCount = deals?.filter(d => !['won', 'lost'].includes(d.stage)).length || 0;
      const totalDeals = deals?.length || 0;
      const wonDeals = deals?.filter(d => d.stage === 'won').length || 0;
      
      return {
        wonValue,
        activeCount,
        totalDeals,
        wonDeals,
        winRate: totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0
      };
    }
    
    return data;
  } catch (error) {
    if (isMissingColumnError(error)) {
      const { data: deals } = await supabase
        .from('deals')
        .select('value, stage')
        .eq('customer_id', customerId);

      const wonValue = deals?.filter(d => d.stage === 'won').reduce((sum, d) => sum + (d.value || 0), 0) || 0;
      const activeCount = deals?.filter(d => !['won', 'lost'].includes(d.stage)).length || 0;
      const totalDeals = deals?.length || 0;
      const wonDeals = deals?.filter(d => d.stage === 'won').length || 0;

      return {
        wonValue,
        activeCount,
        totalDeals,
        wonDeals,
        winRate: totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0
      };
    }

    console.error('Error fetching customer stats:', error);
    return null;
  }
}
