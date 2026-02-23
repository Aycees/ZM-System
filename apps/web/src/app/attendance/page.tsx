'use client';

import React, { useState } from 'react';
import { useEmployees, useAttendance, useClockIn, useClockOut } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, LogIn, LogOut } from 'lucide-react';

export default function AttendancePage() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [filterParams, setFilterParams] = useState({ dateFrom, dateTo });
  const [showForm, setShowForm] = useState(false);
  const [clockInForm, setClockInForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], timeIn: '' });

  const { data: attendance = [], isLoading: loading } = useAttendance(filterParams);
  const { data: employees = [] } = useEmployees('ACTIVE');
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const handleFilter = () => setFilterParams({ dateFrom, dateTo });

  const handleClockIn = (e: React.FormEvent) => {
    e.preventDefault();
    const timeIn = new Date(`${clockInForm.date}T${clockInForm.timeIn}`).toISOString();
    clockInMutation.mutate(
      { employeeId: clockInForm.employeeId, date: clockInForm.date, timeIn },
      {
        onSuccess: () => {
          setShowForm(false);
          setClockInForm({ employeeId: '', date: new Date().toISOString().split('T')[0], timeIn: '' });
        },
      },
    );
  };

  const handleClockOut = (id: string) => {
    const timeOut = new Date().toISOString();
    clockOutMutation.mutate({ id, data: { timeOut } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground text-sm">Log and manage employee attendance</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <LogIn className="h-4 w-4 mr-2" /> Log Clock-In
        </Button>
      </div>

      {clockOutMutation.isError && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
          {(clockOutMutation.error as any)?.message ?? 'Failed to clock out.'}
        </div>
      )}

      {/* Clock-In Form */}
      {showForm && (
        <Card className="animate-fade-in border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" /> Log Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleClockIn} className="space-y-4">
              {clockInMutation.error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{(clockInMutation.error as any).message}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <select
                    value={clockInForm.employeeId}
                    onChange={(e) => setClockInForm({ ...clockInForm, employeeId: e.target.value })}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select employee</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={clockInForm.date} onChange={(e) => setClockInForm({ ...clockInForm, date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Time In</Label>
                  <Input type="time" value={clockInForm.timeIn} onChange={(e) => setClockInForm({ ...clockInForm, timeIn: e.target.value })} required />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={clockInMutation.isPending}>{clockInMutation.isPending ? 'Logging...' : 'Log Clock-In'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button variant="outline" onClick={handleFilter}>Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : attendance.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No attendance records for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2.5 px-3 font-medium">Employee</th>
                    <th className="text-left py-2.5 px-3 font-medium">Date</th>
                    <th className="text-left py-2.5 px-3 font-medium">Time In</th>
                    <th className="text-left py-2.5 px-3 font-medium">Time Out</th>
                    <th className="text-left py-2.5 px-3 font-medium">Hours</th>
                    <th className="text-left py-2.5 px-3 font-medium">Status</th>
                    <th className="text-left py-2.5 px-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((att: any) => (
                    <tr key={att.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{att.employee?.fullName}</td>
                      <td className="py-2.5 px-3">{new Date(att.date).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3">{new Date(att.timeIn).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-3">{att.timeOut ? new Date(att.timeOut).toLocaleTimeString() : '—'}</td>
                      <td className="py-2.5 px-3">{att.totalHours ? Number(att.totalHours).toFixed(1) : '—'}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={att.status === 'OVERTIME' ? 'warning' : att.status === 'HALF_DAY' ? 'secondary' : 'success'}>
                          {att.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        {!att.timeOut && !att.locked && (
                          <Button variant="outline" size="sm" onClick={() => handleClockOut(att.id)}>
                            <LogOut className="h-3.5 w-3.5 mr-1" /> Clock Out
                          </Button>
                        )}
                        {att.locked && <span className="text-xs text-muted-foreground">🔒 Locked</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
