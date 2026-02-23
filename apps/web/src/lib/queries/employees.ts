import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { employeeApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function useEmployees(status?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['employees', 'list', { status }],
    queryFn: () => employeeApi.getAll(status).then((r) => r.data),
    enabled: !!token,
  });
}

export function useEmployee(id: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['employees', 'detail', id],
    queryFn: () => employeeApi.getOne(id!).then((r) => r.data),
    enabled: !!token && !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (data: any) => employeeApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees', 'list'] });
      router.push('/employees');
    },
  });
}

export function useUpdateEmployee(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => employeeApi.update(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['employees', 'list'] });
    },
  });
}

export function useArchiveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees', 'list'] });
    },
  });
}
