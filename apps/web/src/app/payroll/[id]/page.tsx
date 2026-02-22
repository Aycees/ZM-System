'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { payrollApi, cashAdvanceApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus } from 'lucide-react';

export default function PayrollDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeduction, setShowDeduction] = useState(false);
  const [cashAdvances, setCashAdvances] = useState<any[]>([]);
  const [deductForm, setDeductForm] = useState({ type: 'ABSENCE', description: '', amount: '', cashAdvanceId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!token || !id) return;
    try {
      const res = await payrollApi.getOne(token, id as string);
      if (res.success) {
        setRecord(res.data);
        // Load active cash advances for this employee
        const caRes = await cashAdvanceApi.getByEmployee(token, res.data.employeeId);
        if (caRes.success) setCashAdvances(caRes.advances || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [token, id]);

  const handleAddDeduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;
    setError('');
    setSubmitting(true);
    try {
      await payrollApi.addDeduction(token, id as string, {
        type: deductForm.type,
        description: deductForm.description,
        amount: parseFloat(deductForm.amount),
        cashAdvanceId: deductForm.type === 'CASH_ADVANCE' ? deductForm.cashAdvanceId || undefined : undefined,
      });
      setShowDeduction(false);
      setDeductForm({ type: 'ABSENCE', description: '', amount: '', cashAdvanceId: '' });
      loadData();
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 bg-muted rounded w-48" /><div className="h-48 bg-muted rounded-lg" /></div>;
  if (!record) return <p className="text-muted-foreground">Record not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Payroll Detail</h1>
        <p className="text-muted-foreground text-sm">{record.employee?.fullName} — {new Date(record.periodStart).toLocaleDateString()} to {new Date(record.periodEnd).toLocaleDateString()}</p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center justify-between">
          Pay Summary
          <Badge variant={record.status === 'FINALIZED' ? 'default' : 'warning'}>{record.status}</Badge>
        </CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">Regular Days</p><p className="text-lg font-bold">{Number(record.regularDays).toFixed(1)}</p></div>
            <div><p className="text-muted-foreground">Overtime Hours</p><p className="text-lg font-bold">{Number(record.overtimeHours).toFixed(1)}</p></div>
            <div><p className="text-muted-foreground">Daily Rate</p><p className="text-lg font-bold">₱{Number(record.dailyRate).toLocaleString()}</p></div>
            <div><p className="text-muted-foreground">OT Rate/hr</p><p className="text-lg font-bold">₱{Number(record.overtimeRate).toLocaleString()}</p></div>
          </div>
          <hr className="my-4" />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground">Gross Pay</p><p className="text-xl font-bold">₱{Number(record.grossPay).toLocaleString()}</p></div>
            <div><p className="text-muted-foreground">Deductions</p><p className="text-xl font-bold text-destructive">₱{Number(record.deductions).toLocaleString()}</p></div>
            <div><p className="text-muted-foreground">Net Pay</p><p className="text-xl font-bold text-primary">₱{Number(record.netPay).toLocaleString()}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Deductions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Deductions</CardTitle>
          {record.status === 'DRAFT' && (
            <Button size="sm" onClick={() => setShowDeduction(!showDeduction)}>
              <Plus className="h-4 w-4 mr-1" /> Add Deduction
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showDeduction && (
            <form onSubmit={handleAddDeduction} className="space-y-3 mb-4 p-4 bg-muted/50 rounded-lg">
              {error && <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <select value={deductForm.type} onChange={(e) => setDeductForm({ ...deductForm, type: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                    <option value="ABSENCE">Absence</option>
                    <option value="CASH_ADVANCE">Cash Advance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount (₱)</Label>
                  <Input type="number" step="0.01" value={deductForm.amount} onChange={(e) => setDeductForm({ ...deductForm, amount: e.target.value })} required />
                </div>
                {deductForm.type === 'CASH_ADVANCE' && (
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Cash Advance</Label>
                    <select value={deductForm.cashAdvanceId} onChange={(e) => setDeductForm({ ...deductForm, cashAdvanceId: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                      <option value="">Select cash advance</option>
                      {cashAdvances.filter((ca: any) => ca.status === 'ACTIVE').map((ca: any) => (
                        <option key={ca.id} value={ca.id}>₱{Number(ca.amount).toLocaleString()} — Bal: ₱{Number(ca.remainingBalance).toLocaleString()} ({ca.description})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Description</Label>
                  <Input value={deductForm.description} onChange={(e) => setDeductForm({ ...deductForm, description: e.target.value })} required placeholder="Reason for deduction" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>{submitting ? 'Adding...' : 'Add'}</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDeduction(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {record.deductionItems?.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">No deductions.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground">
                <th className="text-left py-2 px-3 font-medium">Type</th>
                <th className="text-left py-2 px-3 font-medium">Description</th>
                <th className="text-left py-2 px-3 font-medium">Amount</th>
              </tr></thead>
              <tbody>
                {record.deductionItems?.map((d: any) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2 px-3"><Badge variant="secondary">{d.type.replace('_', ' ')}</Badge></td>
                    <td className="py-2 px-3">{d.description}</td>
                    <td className="py-2 px-3 font-medium text-destructive">₱{Number(d.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
