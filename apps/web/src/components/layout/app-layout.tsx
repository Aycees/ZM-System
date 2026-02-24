'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Clock, Wallet, Settings, FileText,
  LogOut, Menu, X, HelpCircle, Receipt, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhilippineClock } from '@/components/ui/philippine-clock';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
  { href: '/employees', label: 'Employees', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { href: '/attendance', label: 'Attendance', icon: Clock, roles: ['ADMIN', 'MANAGER'] },
  { href: '/payroll', label: 'Payroll', icon: Wallet, roles: ['ADMIN'] },
  { href: '/cash-advances', label: 'Cash Advances', icon: Receipt, roles: ['ADMIN'] },
  { href: '/reports', label: 'Reports', icon: FileText, roles: ['ADMIN', 'MANAGER'] },
  { href: '/audit-logs', label: 'Audit Logs', icon: Shield, roles: ['ADMIN'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
  { href: '/help', label: 'Help Guide', icon: HelpCircle, roles: ['ADMIN', 'MANAGER'] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b h-14 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="ml-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">ZM</span>
          </div>
          <span className="font-semibold text-sm">ZM Systems</span>
        </div>
        <div className="ml-auto pr-1">
          <PhilippineClock compact />
        </div>
      </header>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-card border-r transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 flex items-center px-5 border-b">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3">
              <span className="text-primary-foreground text-sm font-bold">ZM</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">ZM Systems</h1>
              <p className="text-[10px] text-muted-foreground">Employee Management</p>
            </div>
          </div>

          {/* Philippine Time clock */}
          <div className="px-5 py-3 border-b">
            <PhilippineClock />
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-xs font-bold text-secondary-foreground">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={logout}
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
