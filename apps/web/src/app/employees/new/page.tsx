'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateEmployee } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

export default function NewEmployeePage() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();
  const [form, setForm] = useState({
    fullName: '', address: '', contactNumber: '', emergencyContact: '',
    position: '', dailyRate: '', hireDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployee.mutate({
      ...form,
      dailyRate: parseFloat(form.dailyRate),
    });
  };

  const updateField = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Add New Employee</h1>
        <p className="text-muted-foreground text-sm">Fill in all required fields to register a new employee.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {createEmployee.error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{(createEmployee.error as any).message}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} required placeholder="Juan Dela Cruz" />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input id="address" value={form.address} onChange={(e) => updateField('address', e.target.value)} required placeholder="123 Main St, City" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input id="contactNumber" value={form.contactNumber} onChange={(e) => updateField('contactNumber', e.target.value)} required placeholder="09XX-XXX-XXXX" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                <Input id="emergencyContact" value={form.emergencyContact} onChange={(e) => updateField('emergencyContact', e.target.value)} required placeholder="09XX-XXX-XXXX" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input id="position" value={form.position} onChange={(e) => updateField('position', e.target.value)} required placeholder="Driver, Helper, etc." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyRate">Daily Rate (₱) *</Label>
                <Input id="dailyRate" type="number" step="0.01" min="0" value={form.dailyRate} onChange={(e) => updateField('dailyRate', e.target.value)} required placeholder="500.00" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">Date of Hire *</Label>
                <Input id="hireDate" type="date" value={form.hireDate} onChange={(e) => updateField('hireDate', e.target.value)} required />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createEmployee.isPending}>{createEmployee.isPending ? 'Creating...' : 'Add Employee'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
