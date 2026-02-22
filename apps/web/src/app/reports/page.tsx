'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { reportsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, FileSpreadsheet } from 'lucide-react';

export default function ReportsPage() {
  const { token, isAdmin } = useAuth();
  const [payrollDates, setPayrollDates] = useState({ periodStart: '', periodEnd: '' });
  const [attendanceDates, setAttendanceDates] = useState({ dateFrom: '', dateTo: '' });
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handlePayrollExport = async () => {
    if (!token) return;
    setDownloading('payroll');
    try {
      const blob = await reportsApi.downloadPayroll(token, payrollDates.periodStart, payrollDates.periodEnd);
      downloadFile(blob, `payroll_${payrollDates.periodStart}_${payrollDates.periodEnd}.xlsx`);
    } catch (err: any) {
      alert(err.message);
    } finally { setDownloading(null); }
  };

  const handleAttendanceExport = async () => {
    if (!token) return;
    setDownloading('attendance');
    try {
      const blob = await reportsApi.downloadAttendance(token, attendanceDates.dateFrom, attendanceDates.dateTo);
      downloadFile(blob, `attendance_${attendanceDates.dateFrom}_${attendanceDates.dateTo}.xlsx`);
    } catch (err: any) {
      alert(err.message);
    } finally { setDownloading(null); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm">Export attendance and payroll data as Excel files</p>
      </div>

      {/* Attendance Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Attendance Report
          </CardTitle>
          <CardDescription>Export attendance logs for a date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={attendanceDates.dateFrom} onChange={(e) => setAttendanceDates({ ...attendanceDates, dateFrom: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={attendanceDates.dateTo} onChange={(e) => setAttendanceDates({ ...attendanceDates, dateTo: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleAttendanceExport} disabled={!attendanceDates.dateFrom || !attendanceDates.dateTo || downloading === 'attendance'}>
            <FileDown className="h-4 w-4 mr-2" /> {downloading === 'attendance' ? 'Downloading...' : 'Download Excel'}
          </Button>
        </CardContent>
      </Card>

      {/* Payroll Report - Admin Only */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Payroll Report
            </CardTitle>
            <CardDescription>Export payroll summary for a pay period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <Label className="text-xs">Period Start</Label>
                <Input type="date" value={payrollDates.periodStart} onChange={(e) => setPayrollDates({ ...payrollDates, periodStart: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Period End</Label>
                <Input type="date" value={payrollDates.periodEnd} onChange={(e) => setPayrollDates({ ...payrollDates, periodEnd: e.target.value })} />
              </div>
            </div>
            <Button onClick={handlePayrollExport} disabled={!payrollDates.periodStart || !payrollDates.periodEnd || downloading === 'payroll'}>
              <FileDown className="h-4 w-4 mr-2" /> {downloading === 'payroll' ? 'Downloading...' : 'Download Excel'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
