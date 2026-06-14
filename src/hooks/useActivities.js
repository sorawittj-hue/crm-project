import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchActivitiesByDeal, fetchActivities, addActivity, deleteActivity, updateActivity } from '../services/apiActivities';
import { useToast } from '../components/ui/Toast';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { mockActivities } from '../lib/mockData';

export function useActivities() {
  const { user } = useAuth();
  const { isGuestAccount } = useSubscription();

  return useQuery({
    queryKey: ['activities', user?.id, isGuestAccount],
    queryFn: async () => {
      if (isGuestAccount) return mockActivities;
      return fetchActivities();
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDealActivities(dealId) {
  const { user } = useAuth();
  const { isGuestAccount } = useSubscription();

  return useQuery({
    queryKey: ['activities', user?.id, 'deal', dealId, isGuestAccount],
    queryFn: async () => {
      if (isGuestAccount) return mockActivities.filter(a => a.deal_id === dealId);
      return fetchActivitiesByDeal(dealId);
    },
    enabled: !!user?.id && !!dealId,
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
        // Instead of invalidating deals and triggering refetch, update the last_activity of the specific deal in the cache directly
        queryClient.setQueriesData({ queryKey: ['deals'] }, (old) => {
          if (!old) return old;
          return old.map(deal =>
            deal.id === variables.deal_id
              ? { ...deal, last_activity: new Date().toISOString() }
              : deal
          );
        });
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

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, updates }) => updateActivity(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      if (variables.updates.deal_id || variables.deal_id) {
        queryClient.invalidateQueries({ queryKey: ['activities', 'deal', variables.updates.deal_id || variables.deal_id] });
      }
      toast.success('Activity updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update activity');
    },
  });
}
