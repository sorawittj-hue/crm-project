import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAppSettings, updateAppSettings } from '../services/apiSettings';
import { useToast } from '../components/ui/Toast';
import { useAuth } from './useAuth';

export function useSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['settings', user?.id],
    queryFn: fetchAppSettings,
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: updateAppSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      if (data?.owner_id) {
        queryClient.setQueryData(['settings', data.owner_id], data);
      }
      toast.success('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    },
    onError: (error) => {
      toast.error(error.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
    },
  });
}
