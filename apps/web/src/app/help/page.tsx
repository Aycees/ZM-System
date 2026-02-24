'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Users, Clock, Wallet, Settings, FileText, Receipt, Shield, LayoutDashboard } from 'lucide-react';

const sections = [
  {
    icon: Shield,
    title: 'Logging In',
    content: [
      'Go to the login page and enter your username and password.',
      'Your Admin will provide your credentials.',
      'After logging in, you will be taken to the Dashboard.',
    ],
  },
  {
    icon: LayoutDashboard,
    title: 'Using the Dashboard',
    content: [
      'After logging in, you will land on the Dashboard which shows a live overview for today.',
      'The four stat cards display: Total Employees, Present Today, Overtime Today, and the current payroll period total.',
      'The "Today\'s Attendance" table lists every attendance record for the current Philippine date. It updates automatically when new attendance is logged.',
      'All "today" data is calculated using Philippine Time (Asia/Manila, UTC+8), so the dashboard always reflects the correct date in the Philippines regardless of the server\'s timezone.',
      'A real-time Philippine Time clock is displayed in the sidebar on desktop, and at the top of the screen on mobile. It shows the current date and time in the Philippines and ticks every second — use it to verify the local time when logging attendance.',
    ],
  },
  {
    icon: Users,
    title: 'Managing Employees',
    badge: 'Admin Only',
    content: [
      'Go to "Employees" from the sidebar menu.',
      'Click "Add Employee" to register a new employee. Fill in all required fields: full name, address, contact number, emergency contact, position, daily rate, and date of hire.',
      'Click on an employee\'s name to view their details and recent attendance.',
      'To edit, click "Edit" on the details page, make changes, then click "Save Changes."',
      'To archive an employee (soft delete), click "Archive." Employees with existing payroll records cannot be deleted — they can only be archived.',
    ],
  },
  {
    icon: Clock,
    title: 'Logging Attendance',
    content: [
      'Go to "Attendance" from the sidebar menu.',
      'Click "Log Clock-In" to open the form.',
      'Select the employee, the date, and the time they started working.',
      'When the employee is done for the day, click the "Clock Out" button next to their name in the attendance table.',
      'The system will automatically calculate total hours and flag the status as Full Day (8 hours), Half Day (≤4 hours), or Overtime (>8 hours).',
      'Note: You cannot log attendance twice for the same employee on the same day.',
      'Tip: All attendance dates are stored in Philippine Time (Asia/Manila). Use the real-time clock in the sidebar to confirm the correct local date before logging.',
    ],
  },
  {
    icon: Wallet,
    title: 'Generating Payroll',
    badge: 'Admin Only',
    content: [
      'Go to "Payroll" from the sidebar menu.',
      'Click "Generate Payroll" and enter the pay period start and end dates (bi-weekly).',
      'The system will calculate salary for all active employees based on their attendance during that period.',
      'Formula: Net Pay = (Regular Days × Daily Rate) + (Overtime Hours × OT Rate) − Deductions.',
      'If an employee has incomplete attendance (missing clock-out), their payroll will be skipped.',
      'Click "Details" next to a payroll record to view the breakdown and add deductions.',
      'When ready, click "Finalize" to lock the payroll. This also locks all attendance records for that period.',
    ],
  },
  {
    icon: Receipt,
    title: 'Cash Advances',
    badge: 'Admin Only',
    content: [
      'Go to "Cash Advances" from the sidebar menu.',
      'Click "Record Advance" to log a new cash advance given to an employee.',
      'Each cash advance has a running balance that decreases as deductions are applied during payroll.',
      'When adding a deduction to a payroll record, select "Cash Advance" as the type and choose the specific advance to deduct from.',
      'Once the remaining balance reaches ₱0, the cash advance is marked as "Fully Deducted."',
    ],
  },
  {
    icon: Settings,
    title: 'System Settings',
    badge: 'Admin Only',
    content: [
      'Go to "Settings" from the sidebar menu.',
      'You can configure:',
      '  • Overtime Rate — The amount paid per additional hour beyond 8 hours.',
      '  • On-Call Rate — The amount paid per on-call day (e.g., Sunday work).',
      'Changes are saved immediately and take effect on the next payroll generation.',
    ],
  },
  {
    icon: FileText,
    title: 'Exporting Reports',
    content: [
      'Go to "Reports" from the sidebar menu.',
      'Choose a date range and click "Download Excel" for either:',
      '  • Attendance Report — Lists all attendance logs for the selected period.',
      '  • Payroll Report (Admin only) — Lists all salary records with breakdowns.',
      'The file will download as an .xlsx file that you can open in Excel or Google Sheets.',
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-6 w-6" /> Help & User Guide
        </h1>
        <p className="text-muted-foreground text-sm">Learn how to use ZM Systems — step by step</p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <p className="text-sm">
            <strong>Welcome to ZM Systems!</strong> This system helps manage employee data, track daily attendance, and automatically calculate salaries. Below are simple instructions for each feature.
          </p>
        </CardContent>
      </Card>

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <section.icon className="h-5 w-5 text-primary" />
              {section.title}
              {section.badge && <Badge variant="outline" className="ml-2 text-xs">{section.badge}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {section.content.map((step, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  {step.startsWith('  •') ? (
                    <span className="ml-4">{step}</span>
                  ) : (
                    <>
                      <span className="text-primary font-bold min-w-[20px]">{i + 1}.</span>
                      <span>{step}</span>
                    </>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ))}

      <Card className="bg-muted/50">
        <CardContent className="py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Need more help? Contact your system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
