import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDeals, updateDeal, addDeal, deleteDeals } from '../services/apiDeals';

export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: fetchDeals,
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useAddDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useDeleteDeals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeals,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}
