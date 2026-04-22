import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTeamMembers, updateTeamMember } from '../services/apiTeam';
import { useToast } from '../components/ui/Toast';

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: fetchTeamMembers,
    staleTime: 10 * 60 * 1000, // Team data rarely changes
    retry: 1,
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: updateTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('อัปเดตข้อมูลทีมเรียบร้อยแล้ว');
    },
    onError: (error) => {
      toast.error(error.message || 'ไม่สามารถอัปเดตข้อมูลทีมได้');
    },
  });
}
