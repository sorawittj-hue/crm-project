import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { 
  fetchCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../services/apiCustomers';
import { useToast } from '../components/ui/Toast';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { getLocalCustomers, addLocalCustomer, updateLocalCustomer, deleteLocalCustomer } from '../lib/localDb';
import { supabase } from '../utils/supabase';

export function useCustomers() {
  const { user } = useAuth();
  const { isGuestAccount } = useSubscription();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isGuestAccount || !user?.id) return;

    const channel = supabase
      .channel('public:customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
          if (!old) return old;
          const isOwned = (record) => !record.owner_id || record.owner_id === user.id;

          if (eventType === 'INSERT' && isOwned(newRecord)) {
            if (old.some(c => c.id === newRecord.id)) return old;
            return [newRecord, ...old];
          }
          if (eventType === 'UPDATE') {
            const existing = old.find(c => c.id === newRecord.id);
            if (existing && JSON.stringify(existing) === JSON.stringify(newRecord)) return old;
            if (!isOwned(newRecord)) return old.filter(c => c.id !== newRecord.id);
            return old.map(c => c.id === newRecord.id ? { ...c, ...newRecord } : c);
          }
          if (eventType === 'DELETE') {
            return old.filter(c => c.id !== oldRecord.id);
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
    queryKey: ['customers', user?.id, isGuestAccount],
    queryFn: async () => {
      if (isGuestAccount) {
        await new Promise(resolve => setTimeout(resolve, 200));
        return getLocalCustomers();
      }
      return fetchCustomers();
    },
    enabled: !!user?.id || isGuestAccount,
    retry: 2,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useCustomer(id) {
  const { user } = useAuth();
  const { isGuestAccount } = useSubscription();

  return useQuery({
    queryKey: ['customer', user?.id, id],
    queryFn: async () => {
      if (isGuestAccount) {
        return getLocalCustomers().find(c => c.id === id) || null;
      }
      return getCustomerById(id);
    },
    enabled: !!user?.id && !!id,
    retry: 2,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isGuestAccount } = useSubscription();

  return useMutation({
    mutationFn: async (newCustomer) => {
      if (isGuestAccount) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return addLocalCustomer(newCustomer);
      }
      return createCustomer(newCustomer);
    },
    onMutate: async (newCustomer) => {
      await queryClient.cancelQueries({ queryKey: ['customers'] });
      const previousCustomersQueries = queryClient.getQueriesData({ queryKey: ['customers'] });

      const tempId = `temp-${Date.now()}`;
      queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
        if (!old) return old;
        return [...old, { ...newCustomer, id: tempId, tier: newCustomer.tier || 'Silver', created_at: new Date().toISOString() }];
      });

      return { previousCustomersQueries };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('เพิ่มลูกค้าสำเร็จ');
    },
    onError: (error, _, context) => {
      if (context?.previousCustomersQueries) {
        context.previousCustomersQueries.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      toast.error(error.message || 'Failed to create customer');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isGuestAccount } = useSubscription();

  return useMutation({
    mutationFn: async (updatedCustomer) => {
      if (isGuestAccount) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return updateLocalCustomer(updatedCustomer.id, updatedCustomer);
      }
      return updateCustomer(updatedCustomer);
    },
    onMutate: async (updatedCustomer) => {
      await queryClient.cancelQueries({ queryKey: ['customers'] });
      const previousCustomersQueries = queryClient.getQueriesData({ queryKey: ['customers'] });

      queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
        if (!old) return old;
        return old.map((c) =>
          c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c
        );
      });

      return { previousCustomersQueries };
    },
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
          if (!old) return [data];
          return old.map(c => c.id === data.id ? data : c);
        });
      } else {
        queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
          if (!old) return old;
          return old.map(c => c.id === variables.id ? { ...c, ...variables } : c);
        });
      }
      toast.success('อัปเดตลูกค้าสำเร็จ');
    },
    onError: (error, _, context) => {
      if (context?.previousCustomersQueries) {
        context.previousCustomersQueries.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      toast.error(error.message || 'Failed to update customer');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isGuestAccount } = useSubscription();

  return useMutation({
    mutationFn: async (id) => {
      if (isGuestAccount) {
        await new Promise(resolve => setTimeout(resolve, 300));
        deleteLocalCustomer(id);
        return { success: true };
      }
      return deleteCustomer(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['customers'] });
      const previousCustomersQueries = queryClient.getQueriesData({ queryKey: ['customers'] });

      queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
        if (!old) return old;
        return old.filter((c) => c.id !== id);
      });

      return { previousCustomersQueries };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('ลบลูกค้าสำเร็จ');
    },
    onError: (error, _, context) => {
      if (context?.previousCustomersQueries) {
        context.previousCustomersQueries.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      toast.error(error.message || 'Failed to delete customer');
    },
  });
}
