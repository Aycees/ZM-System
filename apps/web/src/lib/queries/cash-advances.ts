import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { cashAdvanceApi } from '@/lib/api';

export function useCashAdvances(params?: Record<string, string>) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['cash-advances', 'list', params],
    queryFn: () => cashAdvanceApi.getAll(params).then((r) => r.data),
    enabled: !!token,
  });
}

export function useCashAdvancesByEmployee(employeeId: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['cash-advances', 'by-employee', employeeId],
    queryFn: () =>
      cashAdvanceApi.getByEmployee(employeeId!).then((r) => r.advances ?? []),
    enabled: !!token && !!employeeId,
  });
}

export function useCreateCashAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => cashAdvanceApi.create(data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['cash-advances', 'list'] });
      const prevQueriesData = qc.getQueriesData<any[]>({
        queryKey: ['cash-advances', 'list'],
      });
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        employeeId: data.employeeId,
        amount: data.amount,
        remainingBalance: data.amount,
        description: data.description,
        dateGiven: data.dateGiven,
        status: 'ACTIVE',
        employee: { fullName: '...' },
      };
      qc.setQueriesData<any[]>({ queryKey: ['cash-advances', 'list'] }, (old = []) => [
        ...old,
        optimistic,
      ]);
      return { prevQueriesData };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prevQueriesData?.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['cash-advances', 'list'] });
    },
  });
}

export function useUpdateCashAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      cashAdvanceApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-advances'] });
    },
  });
}
