import { supabase } from '../utils/supabase';
import { getRequiredUserId } from './sessionScope';

/**
 * Fetch all customers with their stats
 */
export async function fetchCustomers() {
  try {
    const userId = await getRequiredUserId();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('owner_id', userId)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
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
      .eq('owner_id', userId)
      .single();
    
    if (error) throw error;
    
    // Fetch related deals
    const { data: deals } = await supabase
      .from('deals')
      .select('*')
      .eq('customer_id', id)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    
    return { ...customer, deals: deals || [] };
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw new Error('Failed to load customer: ' + error.message);
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(customerData) {
  try {
    // Validation
    if (!customerData.name) {
      throw new Error('Customer name is required');
    }
    
    const userId = await getRequiredUserId();
    const data = {
      name: customerData.name.trim(),
      company: customerData.company?.trim() || null,
      email: customerData.email?.trim() || null,
      phone: customerData.phone?.trim() || null,
      address: customerData.address?.trim() || null,
      tax_id: customerData.tax_id?.trim() || null,
      industry: customerData.industry || null,
      tier: customerData.tier || 'Silver',
      notes: customerData.notes?.trim() || null,
      owner_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: result, error } = await supabase
      .from('customers')
      .insert([data])
      .select();
    
    if (error) throw error;
    return result?.[0];
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer: ' + error.message);
  }
}

/**
 * Update a customer
 */
export async function updateCustomer({ id, ...updates }) {
  try {
    if (!id) throw new Error('Customer ID is required');
    const userId = await getRequiredUserId();
    
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('owner_id', userId)
      .select();
    
    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('Error updating customer:', error);
    throw new Error('Failed to update customer: ' + error.message);
  }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id) {
  try {
    if (!id) throw new Error('Customer ID is required');
    const userId = await getRequiredUserId();
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('owner_id', userId)
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
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
      const { data: fallbackData } = await supabase
        .from('customers')
        .select('*')
        .eq('owner_id', userId)
        .or(`name.ilike.%${query}%,company.ilike.%${query}%`);
      return fallbackData || [];
    }
    
    return (data || []).filter((customer) => customer.owner_id === userId);
  } catch (error) {
    console.error('Error searching customers:', error);
    return [];
  }
}

/**
 * Get customer statistics
 */
export async function getCustomerStats(customerId) {
  try {
    const userId = await getRequiredUserId();
    const { data, error } = await supabase.rpc('get_customer_stats', { customer_id: customerId });
    
    if (error) {
      // Fallback: manually calculate stats
      const { data: deals } = await supabase
        .from('deals')
        .select('value, stage')
        .eq('owner_id', userId)
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
    console.error('Error fetching customer stats:', error);
    return null;
  }
}
