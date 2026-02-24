'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useEmployees, usePayrollRecords, useGeneratePayroll, useFinalizePayroll, useDeletePayroll } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Lock, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TableSpinner } from '@/components/ui/table-spinner';

const FREQUENCY_DAYS: Record<string, number> = {
  DAILY: 1,
  WEEKLY: 7,
  BI_WEEKLY: 14,
  MONTHLY: 30,
};

export default function PayrollPage() {
  const { isAdmin } = useAuth();
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    periodStart: '',
    frequency: 'WEEKLY',
    employeeIds: [] as string[],
    selectAll: true,
  });
  const [finalizeTarget, setFinalizeTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: records = [], isLoading: loading } = usePayrollRecords();
  const { data: employees = [] } = useEmployees('ACTIVE');
  const generateMutation = useGeneratePayroll();
  const finalizeMutation = useFinalizePayroll();
  const deleteMutation = useDeletePayroll();

  // Auto-calculate period end when start date or frequency changes
  const periodEnd = generateForm.periodStart
    ? (() => {
        const start = new Date(generateForm.periodStart);
        const days = FREQUENCY_DAYS[generateForm.frequency] || 7;
        start.setDate(start.getDate() + days - 1);
        return start.toISOString().split('T')[0];
      })()
    : '';

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      periodStart: generateForm.periodStart,
      frequency: generateForm.frequency,
    };
    if (!generateForm.selectAll && generateForm.employeeIds.length > 0) {
      payload.employeeIds = generateForm.employeeIds;
    }
    generateMutation.mutate(payload, {
      onSuccess: () => {
        setShowGenerate(false);
        setGenerateForm({ periodStart: '', frequency: 'WEEKLY', employeeIds: [], selectAll: true });
      },
    });
  };

  const toggleEmployee = (id: string) => {
    setGenerateForm((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(id)
        ? prev.employeeIds.filter((e) => e !== id)
        : [...prev.employeeIds, id],
    }));
  };

  const handleFinalizeConfirm = () => {
    if (!finalizeTarget) return;
    finalizeMutation.mutate(finalizeTarget, {
      onSettled: () => setFinalizeTarget(null),
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget, {
      onSettled: () => setDeleteTarget(null),
    });
  };

  if (!isAdmin) return <p className="text-muted-foreground">Access restricted to Admins.</p>;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={finalizeTarget !== null}
        onOpenChange={(open) => { if (!open) setFinalizeTarget(null); }}
        title="Finalize Payroll"
        description="This will lock all attendance records for the period and cannot be undone. Are you sure?"
        confirmLabel="Finalize"
        variant="default"
        onConfirm={handleFinalizeConfirm}
        isPending={finalizeMutation.isPending}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Payroll Record"
        description="This will permanently delete this payroll record. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground text-sm">Generate and manage payroll records</p>
        </div>
        <Button onClick={() => setShowGenerate(!showGenerate)}>
          <Plus className="h-4 w-4 mr-2" /> Generate Payroll
        </Button>
      </div>

      {generateMutation.isSuccess && <div className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-sm p-3 rounded-lg">Payroll generated successfully.</div>}
      {(finalizeMutation.isError || deleteMutation.isError) && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
          {(finalizeMutation.error as any)?.message || (deleteMutation.error as any)?.message || 'An error occurred.'}
        </div>
      )}

      {/* Generate Form */}
      {showGenerate && (
        <Card className="animate-fade-in border-primary/20">
          <CardHeader className="pb-3"><CardTitle className="text-lg">Generate Payroll</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              {generateMutation.error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{(generateMutation.error as any).message}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Period Start</Label>
                  <Input type="date" value={generateForm.periodStart} onChange={(e) => setGenerateForm({ ...generateForm, periodStart: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <select
                    value={generateForm.frequency}
                    onChange={(e) => setGenerateForm({ ...generateForm, frequency: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BI_WEEKLY">Bi-Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Period End (auto)</Label>
                  <Input type="date" value={periodEnd} disabled className="bg-muted" />
                </div>
              </div>

              {/* Employee Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={generateForm.selectAll}
                    onChange={(e) => setGenerateForm({ ...generateForm, selectAll: e.target.checked, employeeIds: [] })}
                    className="rounded border-input"
                  />
                  <Label htmlFor="select-all" className="text-sm cursor-pointer">All active employees</Label>
                </div>
                {!generateForm.selectAll && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {employees.map((emp: any) => (
                      <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={generateForm.employeeIds.includes(emp.id)}
                          onChange={() => toggleEmployee(emp.id)}
                          className="rounded border-input"
                        />
                        {emp.fullName}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={generateMutation.isPending}>{generateMutation.isPending ? 'Generating...' : 'Generate'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Records Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2.5 px-3 font-medium">Employee</th>
                  <th className="text-left py-2.5 px-3 font-medium">Period</th>
                  <th className="text-left py-2.5 px-3 font-medium">Hours</th>
                  <th className="text-left py-2.5 px-3 font-medium">OT Hrs</th>
                  <th className="text-left py-2.5 px-3 font-medium">Gross</th>
                  <th className="text-left py-2.5 px-3 font-medium">Incentives</th>
                  <th className="text-left py-2.5 px-3 font-medium">Deductions</th>
                  <th className="text-left py-2.5 px-3 font-medium">Net Pay</th>
                  <th className="text-left py-2.5 px-3 font-medium">Status</th>
                  <th className="text-left py-2.5 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSpinner colSpan={10} message="Loading payroll records..." />
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center text-muted-foreground py-8">No payroll records yet.</td>
                  </tr>
                ) : (
                  records.map((rec: any) => (
                    <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{rec.employee?.fullName}</td>
                      <td className="py-2.5 px-3 text-xs">
                        {new Date(rec.periodStart).toLocaleDateString()} — {new Date(rec.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">{Number(rec.regularHours || 0).toFixed(1)}</td>
                      <td className="py-2.5 px-3">{Number(rec.overtimeHours).toFixed(1)}</td>
                      <td className="py-2.5 px-3">₱{Number(rec.grossPay).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-green-600">+₱{Number(rec.incentives || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-destructive">-₱{Number(rec.deductions).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold">₱{Number(rec.netPay).toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={rec.status === 'FINALIZED' ? 'default' : 'warning'}>
                          {rec.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-1 flex-wrap">
                          <Link href={`/payroll/${rec.id}`}>
                            <Button variant="ghost" size="sm">Details</Button>
                          </Link>
                          {rec.status === 'DRAFT' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setFinalizeTarget(rec.id)}>
                                <Lock className="h-3.5 w-3.5 mr-1" /> Finalize
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(rec.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
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
