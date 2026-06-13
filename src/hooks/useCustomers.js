import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../services/apiCustomers';
import { useToast } from '../components/ui/Toast';
import { useAuth } from './useAuth';

export function useCustomers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customers', user?.id],
    queryFn: fetchCustomers,
    enabled: !!user?.id,
    retry: 2,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useCustomer(id) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer', user?.id, id],
    queryFn: () => getCustomerById(id),
    enabled: !!user?.id && !!id,
    retry: 2,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: createCustomer,
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

  return useMutation({
    mutationFn: updateCustomer,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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

  return useMutation({
    mutationFn: deleteCustomer,
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
