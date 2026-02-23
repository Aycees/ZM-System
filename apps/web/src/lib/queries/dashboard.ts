import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { dashboardApi, attendanceApi } from '@/lib/api';

export function useDashboardStats() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
    enabled: !!token,
  });
}

export function useTodayAttendance() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceApi.getToday().then((r) => r.data),
    enabled: !!token,
  });
}
