'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { payrollApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, Lock } from 'lucide-react';
import Link from 'next/link';

export default function PayrollPage() {
  const { token, isAdmin } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateForm, setGenerateForm] = useState({ periodStart: '', periodEnd: '' });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await payrollApi.getAll(token);
      if (res.success) setRecords(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [token]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(''); setMessage('');
    setGenerating(true);
    try {
      const res: any = await payrollApi.generate(token, generateForm);
      setMessage(res.message || 'Payroll generated');
      setShowGenerate(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally { setGenerating(false); }
  };

  const handleFinalize = async (id: string) => {
    if (!token || !confirm('Finalize this payroll? This will lock all attendance records for the period.')) return;
    try {
      await payrollApi.finalize(token, id);
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  if (!isAdmin) return <p className="text-muted-foreground">Access restricted to Admins.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground text-sm">Generate and manage bi-weekly payroll</p>
        </div>
        <Button onClick={() => setShowGenerate(!showGenerate)}><Plus className="h-4 w-4 mr-2" /> Generate Payroll</Button>
      </div>

      {message && <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg">{message}</div>}

      {showGenerate && (
        <Card className="animate-fade-in border-primary/20">
          <CardHeader className="pb-3"><CardTitle className="text-lg">Generate Payroll</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Period Start</Label>
                  <Input type="date" value={generateForm.periodStart} onChange={(e) => setGenerateForm({ ...generateForm, periodStart: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Period End</Label>
                  <Input type="date" value={generateForm.periodEnd} onChange={(e) => setGenerateForm({ ...generateForm, periodEnd: e.target.value })} required />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={generating}>{generating ? 'Generating...' : 'Generate'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : records.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payroll records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2.5 px-3 font-medium">Employee</th>
                    <th className="text-left py-2.5 px-3 font-medium">Period</th>
                    <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">Days</th>
                    <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">OT Hrs</th>
                    <th className="text-left py-2.5 px-3 font-medium">Gross</th>
                    <th className="text-left py-2.5 px-3 font-medium">Deductions</th>
                    <th className="text-left py-2.5 px-3 font-medium">Net Pay</th>
                    <th className="text-left py-2.5 px-3 font-medium">Status</th>
                    <th className="text-left py-2.5 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec: any) => (
                    <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{rec.employee?.fullName}</td>
                      <td className="py-2.5 px-3 text-xs">
                        {new Date(rec.periodStart).toLocaleDateString()} — {new Date(rec.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell">{Number(rec.regularDays).toFixed(1)}</td>
                      <td className="py-2.5 px-3 hidden md:table-cell">{Number(rec.overtimeHours).toFixed(1)}</td>
                      <td className="py-2.5 px-3">₱{Number(rec.grossPay).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-destructive">₱{Number(rec.deductions).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold">₱{Number(rec.netPay).toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={rec.status === 'FINALIZED' ? 'default' : 'warning'}>
                          {rec.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-1">
                          <Link href={`/payroll/${rec.id}`}>
                            <Button variant="ghost" size="sm">Details</Button>
                          </Link>
                          {rec.status === 'DRAFT' && (
                            <Button variant="ghost" size="sm" onClick={() => handleFinalize(rec.id)}>
                              <Lock className="h-3.5 w-3.5 mr-1" /> Finalize
                            </Button>
                          )}
                        </div>
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
