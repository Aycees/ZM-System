'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useEmployees } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', role: 'MANAGER', employeeId: '' });
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: employees = [] } = useEmployees();

  const signupMutation = useMutation({
    mutationFn: (data: { username: string; password: string; role: string; employeeId?: string }) =>
      authApi.signup(data),
    onSuccess: () => {
      setSuccess('Account created successfully!');
      setForm({ username: '', password: '', confirmPassword: '', role: 'MANAGER', employeeId: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    signupMutation.mutate({
      username: form.username,
      password: form.password,
      role: form.role,
      employeeId: form.role === 'MANAGER' ? form.employeeId || undefined : undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-red-200 mb-4">
            <span className="text-primary-foreground text-2xl font-bold">ZM</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
          <p className="text-sm text-muted-foreground">ZM Systems — Internal Registration</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">New Account</CardTitle>
            <CardDescription>Register a new Admin or Manager account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(validationError || signupMutation.error) && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">
                  {validationError || (signupMutation.error as any)?.message || 'Signup failed'}
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg text-center">{success}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required placeholder="Choose a username" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Min. 6 characters" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required placeholder="Confirm password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {form.role === 'MANAGER' && (
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Link to Employee (Optional)</Label>
                  <select
                    id="employeeId"
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} — {emp.position}</option>
                    ))}
                  </select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
                {signupMutation.isPending ? 'Creating...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          This is a restricted registration page. <br />
          <a href="/login" className="text-primary hover:underline">Back to login</a>
        </p>
      </div>
    </div>
  );
}
