import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchDeals, updateDeal, addDeal, addMultipleDeals, deleteDeals } from '../services/apiDeals';
import { useToast } from '../components/ui/Toast';
import { useAuth } from './useAuth';
import { dispatchNotification } from '../services/integrationService';
import { useSubscription } from './useSubscription';
import { getLocalDeals, addLocalDeal, updateLocalDeal, deleteLocalDeals } from '../lib/localDb';
import { supabase } from '../utils/supabase';

export function useDeals() {
  const { user } = useAuth();
  const { isGuestAccount } = useSubscription();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isGuestAccount || !user?.id) return;

    const channel = supabase
      .channel('public:deals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        queryClient.setQueriesData({ queryKey: ['deals'] }, (old) => {
          if (!old) return old;
          
          const isOwned = (record) => !record.owner_id || record.owner_id === user.id;

          if (eventType === 'INSERT' && newRecord) {
            if (!isOwned(newRecord)) return old;
            if (old.some(d => d.id === newRecord.id)) return old;
            return [newRecord, ...old];
          }
          
          if (eventType === 'UPDATE' && newRecord) {
            const existing = old.find(d => d.id === newRecord.id);
            // Avoid triggering cache changes if data is identical (e.g. from our own update)
            if (existing && JSON.stringify(existing) === JSON.stringify(newRecord)) return old;
            
            if (!isOwned(newRecord)) {
              return old.filter(d => d.id !== newRecord.id);
            }
            return old.map(deal => deal.id === newRecord.id ? { ...deal, ...newRecord } : deal);
          }
          
          if (eventType === 'DELETE' && oldRecord) {
            return old.filter(deal => deal.id !== oldRecord.id);
          }
          
          return old;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isGuestAccount, user?.id, queryClient]);

  return useQuery({
    queryKey: ['deals', user?.id, isGuestAccount],
    queryFn: async () => {
      if (isGuestAccount) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network
        return getLocalDeals();
      }
      return fetchDeals();
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isGuestAccount } = useSubscription();

  return useMutation({
    mutationFn: async (updatedDeal) => {
      if (isGuestAccount) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return updateLocalDeal(updatedDeal.id, updatedDeal);
      }
      return updateDeal(updatedDeal);
    },
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
      if (data) {
        queryClient.setQueriesData({ queryKey: ['deals'] }, (old) => {
          if (!old) return [data];
          return old.map(deal => deal.id === data.id ? { ...deal, ...data } : deal);
        });
      } else {
        queryClient.setQueriesData({ queryKey: ['deals'] }, (old) => {
          if (!old) return old;
          return old.map(deal => deal.id === variables.id ? { ...deal, ...variables } : deal);
        });
      }
      
      // Trigger integration notification if deal is moved to 'won'
      if (variables.stage === 'won') {
        let wasAlreadyWon = false;
        if (context?.previousDealsQueries) {
          for (const [, oldData] of context.previousDealsQueries) {
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
  const { isGuestAccount } = useSubscription();

  return useMutation({
    mutationFn: async (newDeal) => {
      if (isGuestAccount) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const added = addLocalDeal(newDeal);
        return [added];
      }
      return addDeal(newDeal);
    },
    onSuccess: (data, variables) => {
      const newRecord = Array.isArray(data) ? data[0] : data;
      if (newRecord) {
        queryClient.setQueriesData({ queryKey: ['deals'] }, (old) => {
          if (!old) return [newRecord];
          if (old.some(d => d.id === newRecord.id)) return old;
          return [newRecord, ...old];
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['deals'] });
      }
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
  const { isGuestAccount } = useSubscription();

  return useMutation({
    mutationFn: async (deals) => {
      if (isGuestAccount) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const addedDeals = deals.map(d => addLocalDeal(d));
        return addedDeals;
      }
      return addMultipleDeals(deals);
    },
    onSuccess: (data, deals) => {
      if (data && Array.isArray(data)) {
        queryClient.setQueriesData({ queryKey: ['deals'] }, (old) => {
          if (!old) return data;
          const filteredNew = data.filter(n => !old.some(o => o.id === n.id));
          return [...filteredNew, ...old];
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['deals'] });
      }
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
  const { isGuestAccount } = useSubscription();

  return useMutation({
    mutationFn: async (ids) => {
      if (isGuestAccount) {
        await new Promise(resolve => setTimeout(resolve, 400));
        deleteLocalDeals(ids);
        return { success: true };
      }
      return deleteDeals(ids);
    },
    onSuccess: (_, ids) => {
      if (ids && Array.isArray(ids)) {
        queryClient.setQueriesData({ queryKey: ['deals'] }, (old) => {
          if (!old) return [];
          return old.filter(deal => !ids.includes(deal.id));
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['deals'] });
      }
      toast.success('Deal(s) deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete deals');
    },
  });
}
