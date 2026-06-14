import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDeals, updateDeal, addDeal, addMultipleDeals, deleteDeals } from '../services/apiDeals';
import { useToast } from '../components/ui/Toast';
import { useAuth } from './useAuth';
import { dispatchNotification } from '../services/integrationService';

export function useDeals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deals', user?.id],
    queryFn: fetchDeals,
    enabled: !!user?.id,
    retry: 2,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: updateDeal,
    // Optimistic update for instant UI feedback
    onMutate: async (updatedDeal) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['deals'] });

      // Snapshot the previous values for all deals queries
      const previousDealsQueries = queryClient.getQueriesData({ queryKey: ['deals'] });

      // Optimistically update all deals queries
      queryClient.setQueriesData({ queryKey: ['deals'] }, (old) => {
        if (!old) return old;
        return old.map(deal =>
          deal.id === updatedDeal.id ? { ...deal, ...updatedDeal } : deal
        );
      });

      return { previousDealsQueries };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      
      // Trigger integration notification if deal is moved to 'won'
      if (variables.stage === 'won') {
        let wasAlreadyWon = false;
        if (context?.previousDealsQueries) {
          for (const [_, oldData] of context.previousDealsQueries) {
            const oldDeal = oldData?.find(d => d.id === variables.id);
            if (oldDeal && oldDeal.stage === 'won') {
              wasAlreadyWon = true;
              break;
            }
          }
        }
        if (!wasAlreadyWon) {
          // We pass whatever data we have. variables contains what was updated.
          // Fallback to data if the backend returned the full row.
          const mergedData = { ...(data || {}), ...variables };
          dispatchNotification('DEAL_WON', {
            customerName: mergedData.company_name || 'ไม่ระบุชื่อบริษัท',
            value: mergedData.value || 0,
            userEmail: mergedData.contact_name || 'เซลส์'
          });
        }
      }
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousDealsQueries) {
        context.previousDealsQueries.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      toast.error(error.message || 'Failed to update deal');
    },
  });
}

export function useAddDeal() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: addDeal,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal created successfully');
      
      const mergedData = { ...(data?.[0] || data || {}), ...variables };
      dispatchNotification('DEAL_CREATED', {
        customerName: mergedData.company_name || 'ไม่ระบุชื่อบริษัท',
        value: mergedData.value || 0
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create deal');
    },
  });
}

export function useAddMultipleDeals() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: addMultipleDeals,
    onSuccess: (_, deals) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success(`Successfully added ${deals.length} deal(s)`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add multiple deals');
    },
  });
}

export function useDeleteDeals() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: deleteDeals,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal(s) deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete deals');
    },
  });
}
