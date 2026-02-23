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

export function useDeletePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollApi.delete(id),
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
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'detail', payrollId] });
      qc.invalidateQueries({ queryKey: ['payroll', 'list'] });
    },
  });
}

export function useUpdateDeduction(payrollId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deductionId, data }: { deductionId: string; data: any }) =>
      payrollApi.updateDeduction(payrollId!, deductionId, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'detail', payrollId] });
      qc.invalidateQueries({ queryKey: ['payroll', 'list'] });
    },
  });
}

export function useDeleteDeduction(payrollId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deductionId: string) =>
      payrollApi.deleteDeduction(payrollId!, deductionId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'detail', payrollId] });
      qc.invalidateQueries({ queryKey: ['payroll', 'list'] });
    },
  });
}

export function useAddIncentive(payrollId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => payrollApi.addIncentive(payrollId!, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'detail', payrollId] });
      qc.invalidateQueries({ queryKey: ['payroll', 'list'] });
    },
  });
}

export function useUpdateIncentive(payrollId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ incentiveId, data }: { incentiveId: string; data: any }) =>
      payrollApi.updateIncentive(payrollId!, incentiveId, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'detail', payrollId] });
      qc.invalidateQueries({ queryKey: ['payroll', 'list'] });
    },
  });
}

export function useDeleteIncentive(payrollId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (incentiveId: string) =>
      payrollApi.deleteIncentive(payrollId!, incentiveId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'detail', payrollId] });
      qc.invalidateQueries({ queryKey: ['payroll', 'list'] });
    },
  });
}
