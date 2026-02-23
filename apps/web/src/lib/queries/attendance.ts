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
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['attendance', 'today'] });
      const prev = qc.getQueryData<any[]>(['attendance', 'today']);
      const optimisticEntry = {
        id: `optimistic-${Date.now()}`,
        employeeId: data.employeeId,
        date: data.date,
        timeIn: data.timeIn,
        timeOut: null,
        totalHours: null,
        status: 'PRESENT',
        locked: false,
        employee: { fullName: '...', position: '' },
      };
      qc.setQueryData<any[]>(['attendance', 'today'], (old = []) => [
        ...old,
        optimisticEntry,
      ]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(['attendance', 'today'], ctx.prev);
      }
    },
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
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ['attendance', 'today'] });
      const prev = qc.getQueryData<any[]>(['attendance', 'today']);
      qc.setQueryData<any[]>(['attendance', 'today'], (old = []) =>
        old.map((a) =>
          a.id === id ? { ...a, timeOut: data.timeOut } : a,
        ),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(['attendance', 'today'], ctx.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['attendance', 'today'] });
      qc.invalidateQueries({ queryKey: ['attendance', 'list'] });
    },
  });
}
