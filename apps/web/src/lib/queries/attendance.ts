import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { attendanceApi } from '@/lib/api';

interface AttendanceFilter {
  dateFrom?: string;
  dateTo?: string;
}

export function useAttendance(params?: AttendanceFilter) {
  const { token } = useAuth();
  const query: Record<string, string> = {};
  if (params?.dateFrom) query.dateFrom = params.dateFrom;
  if (params?.dateTo) query.dateTo = params.dateTo;

  return useQuery({
    queryKey: ['attendance', 'list', params],
    queryFn: () =>
      attendanceApi
        .getAll(Object.keys(query).length ? query : undefined)
        .then((r) => r.data),
    enabled: !!token,
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => attendanceApi.clockIn(data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['attendance', 'today'] });
      qc.invalidateQueries({ queryKey: ['attendance', 'list'] });
    },
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      attendanceApi.clockOut(id, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['attendance', 'today'] });
      qc.invalidateQueries({ queryKey: ['attendance', 'list'] });
    },
  });
}

export function useUpdateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      attendanceApi.update(id, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceApi.delete(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
