'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useEmployees, useArchiveEmployee } from '@/lib/queries';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TableSpinner } from '@/components/ui/table-spinner';
import { Plus, Search, Archive } from 'lucide-react';

export default function EmployeesPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  const { data: employees = [], isLoading: loading } = useEmployees(
    showArchived ? undefined : 'ACTIVE',
  );
  const archiveMutation = useArchiveEmployee();

  const filtered = employees.filter((emp: any) =>
    emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
    emp.position.toLowerCase().includes(search.toLowerCase())
  );

  const handleArchiveConfirm = () => {
    if (!archiveTarget) return;
    archiveMutation.mutate(archiveTarget, {
      onSuccess: () => setArchiveTarget(null),
      onError: () => setArchiveTarget(null),
    });
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}
        title="Archive Employee"
        description="Are you sure you want to archive this employee? They will no longer appear in active lists."
        confirmLabel="Archive"
        onConfirm={handleArchiveConfirm}
        isPending={archiveMutation.isPending}
      />
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

      {archiveMutation.isError && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
          {(archiveMutation.error as any)?.message ?? 'Failed to archive employee.'}
        </div>
      )}

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
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2.5 px-3 font-medium">Name</th>
                  <th className="text-left py-2.5 px-3 font-medium">Position</th>
                  <th className="text-left py-2.5 px-3 font-medium hidden lg:table-cell">Contact</th>
                  {isAdmin && <th className="text-left py-2.5 px-3 font-medium">Daily Rate</th>}
                  <th className="text-left py-2.5 px-3 font-medium">Status</th>
                  {isAdmin && <th className="text-left py-2.5 px-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSpinner colSpan={isAdmin ? 6 : 4} message="Loading employees..." />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 4} className="text-center text-muted-foreground py-8">No employees found.</td>
                  </tr>
                ) : (
                  filtered.map((emp: any) => (
                    <tr
                      key={emp.id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/employees/${emp.id}`)}
                    >
                      <td className="py-2.5 px-3 font-medium">{emp.fullName}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{emp.position}</td>
                      <td className="py-2.5 px-3 hidden lg:table-cell text-muted-foreground">{emp.contactNumber}</td>
                      {isAdmin && (
                        <td className="py-2.5 px-3 font-medium">₱{Number(emp.dailyRate).toLocaleString()}</td>
                      )}
                      <td className="py-2.5 px-3">
                        <Badge variant={emp.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {emp.status}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                          {emp.status === 'ACTIVE' && (
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setArchiveTarget(emp.id)}>
                              Archive
                            </Button>
                          )}
                        </td>
                      )}
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
