import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAppSettings, updateAppSettings } from '../services/apiSettings';
import { useToast } from '../components/ui/Toast';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchAppSettings,
    staleTime: 10 * 60 * 1000, // Settings change rarely, cache for 10 min
    retry: 1,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: updateAppSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    },
    onError: (error) => {
      toast.error(error.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
    },
  });
}
