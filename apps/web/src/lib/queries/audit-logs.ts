import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { auditLogApi } from '@/lib/api';

export function useAuditLogs(params?: Record<string, string>) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditLogApi.getAll(params).then((r) => r.data),
    enabled: !!token,
  });
}
