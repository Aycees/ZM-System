'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useEmployee, useUpdateEmployee } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save } from 'lucide-react';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const { data: employee, isLoading: loading } = useEmployee(id as string);
  const updateEmployee = useUpdateEmployee(id as string);

  // Populate form when employee data loads
  useEffect(() => {
    if (employee) {
      setForm({
        fullName: employee.fullName,
        address: employee.address,
        contactNumber: employee.contactNumber,
        emergencyContact: employee.emergencyContact,
        position: employee.position,
        dailyRate: employee.dailyRate ? Number(employee.dailyRate) : undefined,
        hireDate: employee.hireDate?.split('T')[0],
      });
    }
  }, [employee]);

  const handleSave = () => {
    updateEmployee.mutate(form, {
      onSuccess: () => setEditing(false),
    });
  };

  if (loading) {
    return <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-48" />
      <div className="h-64 bg-muted rounded-lg" />
    </div>;
  }

  if (!employee) {
    return <p className="text-muted-foreground">Employee not found.</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{employee.fullName}</h1>
          <Badge variant={employee.status === 'ACTIVE' ? 'success' : 'secondary'}>{employee.status}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">{employee.position} • Hired {new Date(employee.hireDate).toLocaleDateString()}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Employee Details</CardTitle>
          {isAdmin && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </CardHeader>
        <CardContent>
          {updateEmployee.error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">{(updateEmployee.error as any).message}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              {editing ? (
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              ) : (
                <p className="text-sm font-medium">{employee.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Position</Label>
              {editing ? (
                <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              ) : (
                <p className="text-sm font-medium">{employee.position}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              {editing ? (
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              ) : (
                <p className="text-sm font-medium">{employee.address}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Contact Number</Label>
              {editing ? (
                <Input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
              ) : (
                <p className="text-sm font-medium">{employee.contactNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Emergency Contact</Label>
              {editing ? (
                <Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
              ) : (
                <p className="text-sm font-medium">{employee.emergencyContact}</p>
              )}
            </div>

            {/* Only show Daily Rate for Admin */}
            {isAdmin && (
              <div className="space-y-2">
                <Label>Daily Rate</Label>
                {editing ? (
                  <Input type="number" step="0.01" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: parseFloat(e.target.value) })} />
                ) : (
                  <p className="text-sm font-medium">₱{Number(employee.dailyRate).toLocaleString()}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Date of Hire</Label>
              {editing ? (
                <Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
              ) : (
                <p className="text-sm font-medium">{new Date(employee.hireDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {editing && (
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button onClick={handleSave} disabled={updateEmployee.isPending}>
                <Save className="h-4 w-4 mr-2" /> {updateEmployee.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent attendance */}
      {employee.attendance && employee.attendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">Date</th>
                    <th className="text-left py-2 px-3 font-medium">Time In</th>
                    <th className="text-left py-2 px-3 font-medium">Time Out</th>
                    <th className="text-left py-2 px-3 font-medium">Hours</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.attendance.map((att: any) => (
                    <tr key={att.id} className="border-b last:border-0">
                      <td className="py-2 px-3">{new Date(att.date).toLocaleDateString()}</td>
                      <td className="py-2 px-3">{new Date(att.timeIn).toLocaleTimeString()}</td>
                      <td className="py-2 px-3">{att.timeOut ? new Date(att.timeOut).toLocaleTimeString() : '—'}</td>
                      <td className="py-2 px-3">{att.totalHours ? Number(att.totalHours).toFixed(1) : '—'}</td>
                      <td className="py-2 px-3">
                        <Badge variant={att.status === 'OVERTIME' ? 'warning' : att.status === 'HALF_DAY' ? 'secondary' : 'success'}>
                          {att.status.replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
