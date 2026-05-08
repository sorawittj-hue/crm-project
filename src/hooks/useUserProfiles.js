import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyProfile, fetchAllProfiles, updateProfileRole, updateMyPersonalTarget } from '../services/apiUserProfiles';

import { useToast } from '../components/ui/Toast';

export function useMyProfile(userId) {
  return useQuery({
    queryKey: ['my_profile', userId],
    queryFn: fetchMyProfile,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ['all_profiles'],
    queryFn: fetchAllProfiles,
    staleTime: 60_000,
  });
}

export function useUpdateProfileRole() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, role }) => updateProfileRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_profiles'] });
      toast.success('อัพเดทสิทธิ์แล้ว');
    },
    onError: () => toast.error('ไม่สามารถอัพเดทสิทธิ์ได้'),
  });
}

export function useUpdateMyPersonalTarget() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ userId, target }) => updateMyPersonalTarget(userId, target),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['my_profile', userId] });
      toast.success('บันทึกเป้าหมายส่วนตัวแล้ว');
    },
    onError: () => toast.error('ไม่สามารถบันทึกเป้าหมายได้'),
  });
}
