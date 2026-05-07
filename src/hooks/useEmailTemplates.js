import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEmailTemplates, addEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '../services/apiEmailTemplates';
import { useToast } from '../components/ui/Toast';

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email_templates'],
    queryFn: fetchEmailTemplates,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useAddEmailTemplate() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: addEmailTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email_templates'] });
      toast.success('เพิ่ม template สำเร็จ');
    },
    onError: () => toast.error('ไม่สามารถเพิ่ม template ได้'),
  });
}

export function useUpdateEmailTemplate() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: updateEmailTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email_templates'] });
      toast.success('อัปเดต template สำเร็จ');
    },
    onError: () => toast.error('ไม่สามารถอัปเดต template ได้'),
  });
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: deleteEmailTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email_templates'] });
      toast.success('ลบ template สำเร็จ');
    },
    onError: () => toast.error('ไม่สามารถลบ template ได้'),
  });
}
