import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { payrollApi } from '@/lib/api';

export function usePayrollRecords(params?: Record<string, string>) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['payroll', 'list', params],
    queryFn: () => payrollApi.getAll(params).then((r) => r.data),
    enabled: !!token,
  });
}

export function usePayrollRecord(id: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['payroll', 'detail', id],
    queryFn: () => payrollApi.getOne(id!).then((r) => r.data),
    enabled: !!token && !!id,
  });
}

export function useGeneratePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => payrollApi.generate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'list'] });
    },
  });
}

export function useFinalizePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollApi.finalize(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['payroll', 'list'] });
      qc.invalidateQueries({ queryKey: ['payroll', 'detail', id] });
    },
  });
}

export function useAddDeduction(payrollId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => payrollApi.addDeduction(payrollId!, data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['payroll', 'detail', payrollId] });
      const prev = qc.getQueryData<any>(['payroll', 'detail', payrollId]);
      const optimisticDeduction = {
        id: `optimistic-${Date.now()}`,
        type: data.type,
        description: data.description,
        amount: data.amount,
      };
      qc.setQueryData<any>(['payroll', 'detail', payrollId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          deductionItems: [...(old.deductionItems ?? []), optimisticDeduction],
          deductions: (Number(old.deductions) + Number(data.amount)).toString(),
          netPay: (Number(old.netPay) - Number(data.amount)).toString(),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(['payroll', 'detail', payrollId], ctx.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'detail', payrollId] });
      qc.invalidateQueries({ queryKey: ['payroll', 'list'] });
    },
  });
}
