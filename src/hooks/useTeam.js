import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTeamMembers, updateTeamMember, addTeamMember, deleteTeamMember } from '../services/apiTeam';
import { useToast } from '../components/ui/Toast';

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: fetchTeamMembers,
    staleTime: 10 * 60 * 1000,
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

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: addTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('เพิ่มสมาชิกทีมเรียบร้อยแล้ว');
    },
    onError: (error) => {
      toast.error(error.message || 'ไม่สามารถเพิ่มสมาชิกได้');
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('ลบสมาชิกทีมเรียบร้อยแล้ว');
    },
    onError: (error) => {
      toast.error(error.message || 'ไม่สามารถลบสมาชิกได้');
    },
  });
}
