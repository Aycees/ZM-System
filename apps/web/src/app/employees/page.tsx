'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { employeeApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Archive } from 'lucide-react';

export default function EmployeesPage() {
  const { token, isAdmin } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const loadEmployees = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await employeeApi.getAll(token, showArchived ? undefined : 'ACTIVE');
      if (res.success) setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployees(); }, [token, showArchived]);

  const filtered = employees.filter((emp) =>
    emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
    emp.position.toLowerCase().includes(search.toLowerCase())
  );

  const handleArchive = async (id: string) => {
    if (!token || !confirm('Are you sure you want to archive this employee?')) return;
    try {
      await employeeApi.archive(token, id);
      loadEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} employees found</p>
        </div>
        {isAdmin && (
          <Link href="/employees/new">
            <Button><Plus className="h-4 w-4 mr-2" /> Add Employee</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input placeholder="Search by name or position..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant={showArchived ? "default" : "outline"} size="sm" onClick={() => setShowArchived(!showArchived)}>
              <Archive className="h-4 w-4 mr-2" /> {showArchived ? 'Show All' : 'Include Archived'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No employees found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2.5 px-3 font-medium">Name</th>
                    <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">Position</th>
                    <th className="text-left py-2.5 px-3 font-medium hidden lg:table-cell">Contact</th>
                    <th className="text-left py-2.5 px-3 font-medium">Daily Rate</th>
                    <th className="text-left py-2.5 px-3 font-medium">Status</th>
                    {isAdmin && <th className="text-left py-2.5 px-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <Link href={`/employees/${emp.id}`} className="font-medium text-primary hover:underline">
                          {emp.fullName}
                        </Link>
                        <p className="text-xs text-muted-foreground md:hidden">{emp.position}</p>
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell text-muted-foreground">{emp.position}</td>
                      <td className="py-2.5 px-3 hidden lg:table-cell text-muted-foreground">{emp.contactNumber}</td>
                      <td className="py-2.5 px-3 font-medium">₱{Number(emp.dailyRate).toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={emp.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {emp.status}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="py-2.5 px-3">
                          <div className="flex gap-1">
                            <Link href={`/employees/${emp.id}`}>
                              <Button variant="ghost" size="sm">Edit</Button>
                            </Link>
                            {emp.status === 'ACTIVE' && (
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleArchive(emp.id)}>
                                Archive
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
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
