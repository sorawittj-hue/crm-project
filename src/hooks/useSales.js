import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMonthlySales, upsertMonthlySale } from '../services/apiSales';
import { useToast } from '../components/ui/Toast';
import { useAuth } from './useAuth';

export function useMonthlySales(year) {
  const { user } = useAuth();
  const currentYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ['monthly_sales', user?.id, currentYear],
    queryFn: () => fetchMonthlySales(currentYear),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpsertMonthlySale() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: upsertMonthlySale,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['monthly_sales'] });
      // Toast handles success silently to not spam if user types quickly, 
      // but we can show it for explicit saves.
    },
    onError: (error) => {
      toast.error(error.message || 'ไม่สามารถบันทึกยอดขายได้');
    },
  });
}
