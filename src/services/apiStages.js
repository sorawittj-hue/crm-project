import { supabase } from '../utils/supabase';
import { getRequiredUserId, addOwnerIdIfSupported } from './sessionScope';

export async function fetchPipelineStages() {
  try {
    const userId = await getRequiredUserId();
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('owner_id', userId)
      .order('position', { ascending: true });
      
    if (error) {
      console.error('Error fetching pipeline stages:', error);
      return null; // return null to fallback to constants
    }
    
    return data;
  } catch (err) {
    console.error('Failed to fetch stages:', err);
    return null;
  }
}

export async function upsertPipelineStages(stages) {
  const userId = await getRequiredUserId();
  const payload = stages.map(stage => addOwnerIdIfSupported('pipeline_stages', {
    ...stage,
    owner_id: userId
  }, userId));

  const { data, error } = await supabase
    .from('pipeline_stages')
    .upsert(payload, { onConflict: 'id' })
    .select();
    
  if (error) {
    console.error('Error upserting pipeline stages:', error);
    throw error;
  }
  
  return data;
}

export async function deletePipelineStage(stageId) {
  const userId = await getRequiredUserId();
  const { error } = await supabase
    .from('pipeline_stages')
    .delete()
    .eq('id', stageId)
    .eq('owner_id', userId);
    
  if (error) {
    console.error('Error deleting pipeline stage:', error);
    throw error;
  }
}
