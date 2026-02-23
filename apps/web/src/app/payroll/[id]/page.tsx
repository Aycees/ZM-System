'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { usePayrollRecord, useAddDeduction, useDeleteDeduction, useUpdateDeduction, useAddIncentive, useDeleteIncentive, useUpdateIncentive, useCashAdvancesByEmployee } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Gift, MinusCircle, Pencil, Check, X } from 'lucide-react';

export default function PayrollDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [showDeduction, setShowDeduction] = useState(false);
  const [showIncentive, setShowIncentive] = useState(false);
  const [deductForm, setDeductForm] = useState({ type: 'ABSENCE', description: '', amount: '', cashAdvanceId: '' });
  const [incentiveForm, setIncentiveForm] = useState({ type: 'BONUS', description: '', amount: '' });
  const [editingIncentiveId, setEditingIncentiveId] = useState<string | null>(null);
  const [editIncentiveForm, setEditIncentiveForm] = useState({ description: '', amount: '' });
  const [editingDeductionId, setEditingDeductionId] = useState<string | null>(null);
  const [editDeductionForm, setEditDeductionForm] = useState({ description: '', amount: '' });

  const { data: record, isLoading: loading } = usePayrollRecord(id as string);
  const { data: cashAdvances = [] } = useCashAdvancesByEmployee(record?.employeeId);
  const addDeduction = useAddDeduction(id as string);
  const updateDeduction = useUpdateDeduction(id as string);
  const deleteDeduction = useDeleteDeduction(id as string);
  const addIncentive = useAddIncentive(id as string);
  const updateIncentive = useUpdateIncentive(id as string);
  const deleteIncentive = useDeleteIncentive(id as string);

  const handleAddDeduction = (e: React.FormEvent) => {
    e.preventDefault();
    addDeduction.mutate(
      {
        type: deductForm.type,
        description: deductForm.description,
        amount: parseFloat(deductForm.amount),
        cashAdvanceId: deductForm.type === 'CASH_ADVANCE' ? deductForm.cashAdvanceId || undefined : undefined,
      },
      {
        onSuccess: () => {
          setShowDeduction(false);
          setDeductForm({ type: 'ABSENCE', description: '', amount: '', cashAdvanceId: '' });
        },
      },
    );
  };

  const handleAddIncentive = (e: React.FormEvent) => {
    e.preventDefault();
    addIncentive.mutate(
      {
        type: incentiveForm.type,
        description: incentiveForm.description,
        amount: parseFloat(incentiveForm.amount),
      },
      {
        onSuccess: () => {
          setShowIncentive(false);
          setIncentiveForm({ type: 'BONUS', description: '', amount: '' });
        },
      },
    );
  };

  const handleEditIncentive = (inc: any) => {
    setEditingIncentiveId(inc.id);
    setEditIncentiveForm({ description: inc.description, amount: String(inc.amount) });
  };

  const handleSaveIncentive = (incentiveId: string) => {
    updateIncentive.mutate(
      { incentiveId, data: { description: editIncentiveForm.description, amount: parseFloat(editIncentiveForm.amount) } },
      { onSuccess: () => setEditingIncentiveId(null) },
    );
  };

  const handleEditDeduction = (d: any) => {
    setEditingDeductionId(d.id);
    setEditDeductionForm({ description: d.description, amount: String(d.amount) });
  };

  const handleSaveDeduction = (deductionId: string) => {
    updateDeduction.mutate(
      { deductionId, data: { description: editDeductionForm.description, amount: parseFloat(editDeductionForm.amount) } },
      { onSuccess: () => setEditingDeductionId(null) },
    );
  };

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 bg-muted rounded w-48" /><div className="h-48 bg-muted rounded-lg" /></div>;
  if (!record) return <p className="text-muted-foreground">Record not found.</p>;

  const isDraft = record.status === 'DRAFT';

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
          <div className="flex items-center gap-2">
            {record.frequency && <Badge variant="secondary">{record.frequency.replace('_', ' ')}</Badge>}
            <Badge variant={record.status === 'FINALIZED' ? 'default' : 'warning'}>{record.status}</Badge>
          </div>
        </CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">Regular Hours</p><p className="text-lg font-bold">{Number(record.regularHours || 0).toFixed(1)}</p></div>
            <div><p className="text-muted-foreground">Overtime Hours</p><p className="text-lg font-bold">{Number(record.overtimeHours).toFixed(1)}</p></div>
            <div><p className="text-muted-foreground">Daily Rate</p><p className="text-lg font-bold">₱{Number(record.dailyRate).toLocaleString()}</p></div>
            <div><p className="text-muted-foreground">OT Rate/hr</p><p className="text-lg font-bold">₱{Number(record.overtimeRate).toLocaleString()}</p></div>
          </div>
          <hr className="my-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">Base Pay</p><p className="text-xl font-bold">₱{(Number(record.regularHours || 0) * Number(record.dailyRate) / 8 + Number(record.overtimeHours) * Number(record.overtimeRate)).toLocaleString()}</p></div>
            <div><p className="text-muted-foreground">Incentives</p><p className="text-xl font-bold text-green-600">+₱{Number(record.incentives || 0).toLocaleString()}</p></div>
            <div><p className="text-muted-foreground">Deductions</p><p className="text-xl font-bold text-destructive">-₱{Number(record.deductions).toLocaleString()}</p></div>
            <div><p className="text-muted-foreground">Net Pay</p><p className="text-xl font-bold text-primary">₱{Number(record.netPay).toLocaleString()}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Incentives */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Gift className="h-5 w-5" /> Incentives</CardTitle>
          {isDraft && (
            <Button size="sm" onClick={() => setShowIncentive(!showIncentive)}>
              <Plus className="h-4 w-4 mr-1" /> Add Incentive
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showIncentive && (
            <form onSubmit={handleAddIncentive} className="space-y-3 mb-4 p-4 bg-muted/50 rounded-lg">
              {addIncentive.error && <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">{(addIncentive.error as any).message}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <select value={incentiveForm.type} onChange={(e) => setIncentiveForm({ ...incentiveForm, type: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                    <option value="BONUS">Bonus</option>
                    <option value="ALLOWANCE">Allowance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount (₱)</Label>
                  <Input type="number" step="0.01" value={incentiveForm.amount} onChange={(e) => setIncentiveForm({ ...incentiveForm, amount: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input value={incentiveForm.description} onChange={(e) => setIncentiveForm({ ...incentiveForm, description: e.target.value })} required placeholder="Reason" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={addIncentive.isPending}>{addIncentive.isPending ? 'Adding...' : 'Add'}</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowIncentive(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {(!record.incentiveItems || record.incentiveItems.length === 0) ? (
            <p className="text-center text-muted-foreground py-4 text-sm">No incentives.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground">
                <th className="text-left py-2 px-3 font-medium">Type</th>
                <th className="text-left py-2 px-3 font-medium">Description</th>
                <th className="text-left py-2 px-3 font-medium">Amount</th>
                {isDraft && <th className="text-left py-2 px-3 font-medium w-24"></th>}
              </tr></thead>
              <tbody>
                {record.incentiveItems?.map((inc: any) =>
                  editingIncentiveId === inc.id ? (
                    <tr key={inc.id} className="border-b last:border-0 bg-muted/30">
                      <td className="py-2 px-3"><Badge variant="success">{inc.type.replace('_', ' ')}</Badge></td>
                      <td className="py-2 px-3">
                        <Input
                          className="h-7 text-xs"
                          value={editIncentiveForm.description}
                          onChange={(e) => setEditIncentiveForm({ ...editIncentiveForm, description: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          className="h-7 text-xs w-28"
                          type="number"
                          step="0.01"
                          value={editIncentiveForm.amount}
                          onChange={(e) => setEditIncentiveForm({ ...editIncentiveForm, amount: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="text-green-600 h-7 w-7 p-0" onClick={() => handleSaveIncentive(inc.id)} disabled={updateIncentive.isPending}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingIncentiveId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={inc.id} className="border-b last:border-0">
                      <td className="py-2 px-3"><Badge variant="success">{inc.type.replace('_', ' ')}</Badge></td>
                      <td className="py-2 px-3">{inc.description}</td>
                      <td className="py-2 px-3 font-medium text-green-600">+₱{Number(inc.amount).toLocaleString()}</td>
                      {isDraft && (
                        <td className="py-2 px-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEditIncentive(inc)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => deleteIncentive.mutate(inc.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Deductions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><MinusCircle className="h-5 w-5" /> Deductions</CardTitle>
          {isDraft && (
            <Button size="sm" onClick={() => setShowDeduction(!showDeduction)}>
              <Plus className="h-4 w-4 mr-1" /> Add Deduction
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showDeduction && (
            <form onSubmit={handleAddDeduction} className="space-y-3 mb-4 p-4 bg-muted/50 rounded-lg">
              {addDeduction.error && <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">{(addDeduction.error as any).message}</div>}
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
                <Button type="submit" size="sm" disabled={addDeduction.isPending}>{addDeduction.isPending ? 'Adding...' : 'Add'}</Button>
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
                {isDraft && <th className="text-left py-2 px-3 font-medium w-24"></th>}
              </tr></thead>
              <tbody>
                {record.deductionItems?.map((d: any) =>
                  editingDeductionId === d.id ? (
                    <tr key={d.id} className="border-b last:border-0 bg-muted/30">
                      <td className="py-2 px-3"><Badge variant="secondary">{d.type.replace('_', ' ')}</Badge></td>
                      <td className="py-2 px-3">
                        <Input
                          className="h-7 text-xs"
                          value={editDeductionForm.description}
                          onChange={(e) => setEditDeductionForm({ ...editDeductionForm, description: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          className="h-7 text-xs w-28"
                          type="number"
                          step="0.01"
                          value={editDeductionForm.amount}
                          onChange={(e) => setEditDeductionForm({ ...editDeductionForm, amount: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="text-green-600 h-7 w-7 p-0" onClick={() => handleSaveDeduction(d.id)} disabled={updateDeduction.isPending}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingDeductionId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-2 px-3"><Badge variant="secondary">{d.type.replace('_', ' ')}</Badge></td>
                      <td className="py-2 px-3">{d.description}</td>
                      <td className="py-2 px-3 font-medium text-destructive">-₱{Number(d.amount).toLocaleString()}</td>
                      {isDraft && (
                        <td className="py-2 px-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEditDeduction(d)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => deleteDeduction.mutate(d.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
