'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AppLayout from '@/components/layout/app-layout';

const publicRoutes = ['/login', '/coca-cola'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      const isPublic = publicRoutes.some(route => pathname?.startsWith(route));

      if (!user && !isPublic) {
        router.push('/login');
      } else if (user && isPublic) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center animate-pulse-soft">
            <span className="text-primary-foreground text-lg font-bold">ZM</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isPublic = publicRoutes.some(route => pathname?.startsWith(route));

  if (isPublic) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
