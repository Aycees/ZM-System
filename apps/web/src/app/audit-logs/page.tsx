'use client';

import React, { useState } from 'react';
import { useAuditLogs } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const params: Record<string, string> = {};
  if (entityType) params.entityType = entityType;
  if (action) params.action = action;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  params.page = String(page);
  params.pageSize = String(pageSize);

  const { data: logs = [], isLoading } = useAuditLogs(params);

  const actionColors: Record<string, 'default' | 'success' | 'warning' | 'secondary' | 'destructive'> = {
    CREATE: 'success',
    UPDATE: 'warning',
    DELETE: 'destructive',
    CLOCK_IN: 'success',
    CLOCK_OUT: 'default',
    FINALIZE: 'default',
    ARCHIVE: 'secondary',
    UPDATE_DAILY_RATE: 'warning',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6" /> Audit Logs
        </h1>
        <p className="text-muted-foreground text-sm">Complete audit trail of all system modifications</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Entity Type</Label>
              <select
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">All Entities</option>
                <option value="Employee">Employee</option>
                <option value="Attendance">Attendance</option>
                <option value="Payroll">Payroll</option>
                <option value="Deduction">Deduction</option>
                <option value="Incentive">Incentive</option>
                <option value="Setting">Setting</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Action</Label>
              <select
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="CLOCK_IN">Clock In</option>
                <option value="CLOCK_OUT">Clock Out</option>
                <option value="FINALIZE">Finalize</option>
                <option value="ARCHIVE">Archive</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No audit logs found.</p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2.5 px-3 font-medium">Timestamp</th>
                      <th className="text-left py-2.5 px-3 font-medium">User</th>
                      <th className="text-left py-2.5 px-3 font-medium">Action</th>
                      <th className="text-left py-2.5 px-3 font-medium">Entity</th>
                      <th className="text-left py-2.5 px-3 font-medium">Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: any) => (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          {log.user?.username || log.performedBy?.slice(0, 8)}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={actionColors[log.action] || 'secondary'}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium">{log.entityType}</span>
                          <span className="text-muted-foreground text-xs ml-1">#{log.entityId?.slice(0, 8)}</span>
                        </td>
                        <td className="py-2.5 px-3 text-xs max-w-[300px]">
                          {log.oldValue && (
                            <details className="cursor-pointer">
                              <summary className="text-muted-foreground hover:text-foreground">View changes</summary>
                              <div className="mt-1 space-y-1">
                                {log.oldValue && (
                                  <div className="bg-destructive/5 p-1.5 rounded text-xs">
                                    <span className="font-medium text-destructive">Old:</span>{' '}
                                    <code className="break-all">{JSON.stringify(log.oldValue)}</code>
                                  </div>
                                )}
                                {log.newValue && (
                                  <div className="bg-green-50 dark:bg-green-950/20 p-1.5 rounded text-xs">
                                    <span className="font-medium text-green-600">New:</span>{' '}
                                    <code className="break-all">{JSON.stringify(log.newValue)}</code>
                                  </div>
                                )}
                              </div>
                            </details>
                          )}
                          {!log.oldValue && log.newValue && (
                            <code className="text-xs break-all">{JSON.stringify(log.newValue)}</code>
                          )}
                          {!log.oldValue && !log.newValue && <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Page {page}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={logs.length < pageSize}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
