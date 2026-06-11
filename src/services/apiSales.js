import { supabase } from '../utils/supabase';
import { getRequiredUserId } from './sessionScope';

/**
 * Fetch monthly sales for a specific year
 */
export async function fetchMonthlySales(year) {
  try {
    const userId = await getRequiredUserId();
    const { data, error } = await supabase
      .from('monthly_sales')
      .select('*')
      .eq('owner_id', userId)
      .eq('year', year)
      .order('month', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching monthly sales:', error);
    // Silent fail if table doesn't exist yet for seamless transition
    if (error.message?.includes('does not exist')) return [];
    throw new Error('Failed to load monthly sales: ' + error.message);
  }
}

/**
 * Upsert a monthly sale (insert if new, update if exists)
 */
export async function upsertMonthlySale({ year, month, amount }) {
  try {
    const userId = await getRequiredUserId();
    
    // We use upsert with the unique constraint we created: UNIQUE(owner_id, year, month)
    const { data, error } = await supabase
      .from('monthly_sales')
      .upsert({
        owner_id: userId,
        year,
        month,
        amount,
        updated_at: new Date().toISOString()
      }, { onConflict: 'owner_id,year,month' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting monthly sale:', error);
    throw new Error('Failed to save monthly sale: ' + error.message);
  }
}
