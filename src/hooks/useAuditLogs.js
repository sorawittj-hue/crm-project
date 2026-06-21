import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '../services/apiAuditLogs';

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit_logs'],
    queryFn: fetchAuditLogs,
    staleTime: 30_000, // 30 seconds
  });
}
