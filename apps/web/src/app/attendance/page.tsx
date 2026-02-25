'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useEmployees, useAttendance, useClockIn, useClockOut, useUpdateAttendance, useDeleteAttendance } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TableSpinner } from '@/components/ui/table-spinner';
import { Clock, LogIn, LogOut, Pencil, Trash2 } from 'lucide-react';

export default function AttendancePage() {
  const { isAdmin } = useAuth();
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [clockInForm, setClockInForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], timeIn: '' });
  const [clockingOutId, setClockingOutId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({ timeIn: '', timeOut: '' });

  // Auto-reload when filters change
  const { data: attendance = [], isLoading: loading } = useAttendance({ dateFrom, dateTo });
  const { data: employees = [] } = useEmployees('ACTIVE');
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();
  const updateMutation = useUpdateAttendance();
  const deleteMutation = useDeleteAttendance();

  const handleClockIn = (e: React.FormEvent) => {
    e.preventDefault();
    // TIMEZONE FIX: Send date as plain YYYY-MM-DD string, construct time in local format
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
    setClockingOutId(id);
    const timeOut = new Date().toISOString();
    clockOutMutation.mutate({ id, data: { timeOut } }, {
      onSettled: () => setClockingOutId(null),
    });
  };

  const handleEdit = (att: any) => {
    setEditTarget(att);
    setEditForm({
      timeIn: att.timeIn ? new Date(att.timeIn).toTimeString().slice(0, 5) : '',
      timeOut: att.timeOut ? new Date(att.timeOut).toTimeString().slice(0, 5) : '',
    });
  };

  const handleEditSave = () => {
    if (!editTarget) return;
    const dateStr = new Date(editTarget.date).toISOString().split('T')[0];
    const data: any = {};
    if (editForm.timeIn) data.timeIn = new Date(`${dateStr}T${editForm.timeIn}`).toISOString();
    if (editForm.timeOut) data.timeOut = new Date(`${dateStr}T${editForm.timeOut}`).toISOString();
    updateMutation.mutate({ id: editTarget.id, data }, {
      onSuccess: () => setEditTarget(null),
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Attendance Record"
        description="Are you sure you want to delete this attendance record? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground text-sm">Log and manage employee attendance</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <LogIn className="h-4 w-4 mr-2" /> Log Clock-In
        </Button>
      </div>

      {(clockOutMutation.isError || deleteMutation.isError || updateMutation.isError) && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
          {(clockOutMutation.error as any)?.message || (deleteMutation.error as any)?.message || (updateMutation.error as any)?.message || 'An error occurred.'}
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
                  <DatePicker value={clockInForm.date} onChange={(val) => setClockInForm({ ...clockInForm, date: val })} placeholder="Select date" />
                </div>
                <div className="space-y-2">
                  <Label>Time In</Label>
                  <Input type="time" value={clockInForm.timeIn} onChange={(e) => setClockInForm({ ...clockInForm, timeIn: e.target.value })} required />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={clockInMutation.isPending}>{clockInMutation.isPending ? 'Logging...' : 'Log Clock-In'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editTarget && (
        <Card className="animate-fade-in border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Edit Attendance — {editTarget.employee?.fullName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Time In</Label>
                <Input type="time" value={editForm.timeIn} onChange={(e) => setEditForm({ ...editForm, timeIn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Time Out</Label>
                <Input type="time" value={editForm.timeOut} onChange={(e) => setEditForm({ ...editForm, timeOut: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleEditSave} disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records — Auto-filters via dateFrom/dateTo state change */}
      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:items-end">
            <div className="space-y-1 sm:flex-1">
              <Label className="text-xs">From</Label>
              <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date" />
            </div>
            <div className="space-y-1 sm:flex-1">
              <Label className="text-xs">To</Label>
              <DatePicker value={dateTo} onChange={setDateTo} placeholder="To date" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[700px]">
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
                {loading ? (
                  <TableSpinner colSpan={7} message="Loading attendance records..." />
                ) : attendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted-foreground py-8">No attendance records for this period.</td>
                  </tr>
                ) : (
                  attendance.map((att: any) => (
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
                        <div className="flex gap-1 flex-wrap">
                          {!att.timeOut && !att.locked && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleClockOut(att.id)}
                              disabled={clockingOutId === att.id}
                            >
                              <LogOut className="h-3.5 w-3.5 mr-1" />
                              {clockingOutId === att.id ? 'Clocking Out…' : 'Clock Out'}
                            </Button>
                          )}
                          {isAdmin && !att.locked && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(att)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(att.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {att.locked && <span className="text-xs text-muted-foreground">🔒 Locked</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
