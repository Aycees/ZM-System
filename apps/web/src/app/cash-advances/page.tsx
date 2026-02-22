'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cashAdvanceApi, employeeApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Receipt } from 'lucide-react';

export default function CashAdvancesPage() {
  const { token, isAdmin } = useAuth();
  const [advances, setAdvances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', amount: '', description: '', dateGiven: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [caRes, empRes] = await Promise.all([
        cashAdvanceApi.getAll(token),
        employeeApi.getAll(token, 'ACTIVE'),
      ]);
      if (caRes.success) setAdvances(caRes.data);
      if (empRes.success) setEmployees(empRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(''); setSubmitting(true);
    try {
      await cashAdvanceApi.create(token, { ...form, amount: parseFloat(form.amount) });
      setShowForm(false);
      setForm({ employeeId: '', amount: '', description: '', dateGiven: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  if (!isAdmin) return <p className="text-muted-foreground">Access restricted to Admins.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash Advances</h1>
          <p className="text-muted-foreground text-sm">Track employee cash advances with running balance</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-2" /> Record Advance</Button>
      </div>

      {showForm && (
        <Card className="animate-fade-in border-primary/20">
          <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Receipt className="h-5 w-5" /> New Cash Advance</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Select employee</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₱)</Label>
                  <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Date Given</Label>
                  <Input type="date" value={form.dateGiven} onChange={(e) => setForm({ ...form, dateGiven: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Reason for advance" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? 'Recording...' : 'Record'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : advances.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No cash advances recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground">
                  <th className="text-left py-2.5 px-3 font-medium">Employee</th>
                  <th className="text-left py-2.5 px-3 font-medium">Date</th>
                  <th className="text-left py-2.5 px-3 font-medium">Amount</th>
                  <th className="text-left py-2.5 px-3 font-medium">Remaining</th>
                  <th className="text-left py-2.5 px-3 font-medium">Description</th>
                  <th className="text-left py-2.5 px-3 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {advances.map((ca: any) => (
                    <tr key={ca.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{ca.employee?.fullName}</td>
                      <td className="py-2.5 px-3">{new Date(ca.dateGiven).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3">₱{Number(ca.amount).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-medium">₱{Number(ca.remainingBalance).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{ca.description}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={ca.status === 'ACTIVE' ? 'warning' : 'success'}>
                          {ca.status === 'ACTIVE' ? 'Active' : 'Fully Deducted'}
                        </Badge>
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
