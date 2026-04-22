import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchActivitiesByDeal, fetchActivities, addActivity, deleteActivity } from '../services/apiActivities';
import { useToast } from '../components/ui/Toast';

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDealActivities(dealId) {
  return useQuery({
    queryKey: ['activities', 'deal', dealId],
    queryFn: () => fetchActivitiesByDeal(dealId),
    enabled: !!dealId,
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddActivity() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: addActivity,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      if (variables.deal_id) {
        queryClient.invalidateQueries({ queryKey: ['activities', 'deal', variables.deal_id] });
        queryClient.invalidateQueries({ queryKey: ['deals'] });
      }
      toast.success('Activity logged successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to log activity');
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Activity deleted');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete activity');
    },
  });
}
