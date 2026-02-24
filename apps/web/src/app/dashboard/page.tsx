'use client';

import React from 'react';
import { useDashboardStats, useTodayAttendance } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, AlertTriangle, Wallet } from 'lucide-react';
import { TableSpinner } from '@/components/ui/table-spinner';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todayAttendance = [], isLoading: attLoading } = useTodayAttendance();

  if (statsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Present Today',
      value: stats?.presentToday || 0,
      icon: Clock,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Overtime Today',
      value: stats?.overtimeToday || 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Payroll Summary',
      value: `₱${(stats?.currentPayrollTotal || 0).toLocaleString()}`,
      icon: Wallet,
      color: 'text-primary',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back! Here&apos;s today&apos;s overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="stat-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`${card.bg} p-2.5 rounded-lg`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Today&apos;s Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2.5 px-3 font-medium">Employee</th>
                  <th className="text-left py-2.5 px-3 font-medium">Position</th>
                  <th className="text-left py-2.5 px-3 font-medium">Time In</th>
                  <th className="text-left py-2.5 px-3 font-medium">Time Out</th>
                  <th className="text-left py-2.5 px-3 font-medium">Hours</th>
                  <th className="text-left py-2.5 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {attLoading ? (
                  <TableSpinner colSpan={6} message="Loading today's attendance..." />
                ) : todayAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-sm text-muted-foreground text-center py-8">No attendance logged today.</td>
                  </tr>
                ) : (
                  todayAttendance.map((att: any) => (
                    <tr key={att.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{att.employee?.fullName}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{att.employee?.position}</td>
                      <td className="py-2.5 px-3">{new Date(att.timeIn).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-3">{att.timeOut ? new Date(att.timeOut).toLocaleTimeString() : '—'}</td>
                      <td className="py-2.5 px-3">{att.totalHours ? Number(att.totalHours).toFixed(1) : '—'}</td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={att.status === 'OVERTIME' ? 'warning' : att.status === 'HALF_DAY' ? 'secondary' : 'success'}
                        >
                          {att.status.replace('_', ' ')}
                        </Badge>
                      </td>
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
