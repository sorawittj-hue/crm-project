import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDeals, updateDeal, addDeal, addMultipleDeals, deleteDeals } from '../services/apiDeals';
import { useToast } from '../components/ui/Toast';

export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: fetchDeals,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: updateDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update deal');
    },
  });
}

export function useAddDeal() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: addDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal created successfully');
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
