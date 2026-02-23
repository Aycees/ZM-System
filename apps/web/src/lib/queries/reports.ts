import { useMutation } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function useDownloadPayrollReport() {
  return useMutation({
    mutationFn: ({
      periodStart,
      periodEnd,
    }: {
      periodStart: string;
      periodEnd: string;
    }) => reportsApi.downloadPayroll(periodStart, periodEnd),
    onSuccess: (blob, { periodStart, periodEnd }) => {
      downloadBlob(blob, `payroll_${periodStart}_${periodEnd}.xlsx`);
    },
  });
}

export function useDownloadAttendanceReport() {
  return useMutation({
    mutationFn: ({
      dateFrom,
      dateTo,
    }: {
      dateFrom: string;
      dateTo: string;
    }) => reportsApi.downloadAttendance(dateFrom, dateTo),
    onSuccess: (blob, { dateFrom, dateTo }) => {
      downloadBlob(blob, `attendance_${dateFrom}_${dateTo}.xlsx`);
    },
  });
}
