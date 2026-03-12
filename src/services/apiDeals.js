import { supabase } from '../utils/supabase';

export async function fetchDeals() {
  const { data, error } = await supabase.from('deals').select('*').order('createdAt', { ascending: false });
  if (error) throw new Error('Deals could not be loaded');
  return data;
}

export async function updateDeal({ id, ...updates }) {
  const { data, error } = await supabase
    .from('deals')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw new Error('Deal could not be updated');
  return data;
}

export async function addDeal(newDeal) {
  const { data, error } = await supabase
    .from('deals')
    .insert([newDeal])
    .select();
  if (error) throw new Error('Deal could not be created');
  return data;
}

export async function deleteDeals(ids) {
  const { error } = await supabase
    .from('deals')
    .delete()
    .in('id', ids);
  if (error) throw new Error('Deals could not be deleted');
  return true;
}
