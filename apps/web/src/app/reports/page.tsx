'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useDownloadPayrollReport, useDownloadAttendanceReport } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { FileDown, FileSpreadsheet } from 'lucide-react';

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const [payrollDates, setPayrollDates] = useState({ periodStart: '', periodEnd: '' });
  const [attendanceDates, setAttendanceDates] = useState({ dateFrom: '', dateTo: '' });

  const payrollReport = useDownloadPayrollReport();
  const attendanceReport = useDownloadAttendanceReport();

  const handlePayrollExport = () => {
    payrollReport.mutate(payrollDates);
  };

  const handleAttendanceExport = () => {
    attendanceReport.mutate(attendanceDates);
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
              <DatePicker value={attendanceDates.dateFrom} onChange={(val) => setAttendanceDates({ ...attendanceDates, dateFrom: val })} placeholder="From date" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <DatePicker value={attendanceDates.dateTo} onChange={(val) => setAttendanceDates({ ...attendanceDates, dateTo: val })} placeholder="To date" />
            </div>
          </div>
          {attendanceReport.isError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-3">
              {(attendanceReport.error as any)?.message ?? 'Failed to download attendance report.'}
            </div>
          )}
          <Button onClick={handleAttendanceExport} disabled={!attendanceDates.dateFrom || !attendanceDates.dateTo || attendanceReport.isPending}>
            <FileDown className="h-4 w-4 mr-2" /> {attendanceReport.isPending ? 'Downloading...' : 'Download Excel'}
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
                <DatePicker value={payrollDates.periodStart} onChange={(val) => setPayrollDates({ ...payrollDates, periodStart: val })} placeholder="Period start" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Period End</Label>
                <DatePicker value={payrollDates.periodEnd} onChange={(val) => setPayrollDates({ ...payrollDates, periodEnd: val })} placeholder="Period end" />
              </div>
            </div>
            {payrollReport.isError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-3">
                {(payrollReport.error as any)?.message ?? 'Failed to download payroll report.'}
              </div>
            )}
            <Button onClick={handlePayrollExport} disabled={!payrollDates.periodStart || !payrollDates.periodEnd || payrollReport.isPending}>
              <FileDown className="h-4 w-4 mr-2" /> {payrollReport.isPending ? 'Downloading...' : 'Download Excel'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
