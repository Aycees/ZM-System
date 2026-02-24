'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PhilippineClockProps {
  /** Compact single-line format for tight spaces (e.g. mobile header). */
  compact?: boolean;
  className?: string;
}

export function PhilippineClock({ compact = false, className }: PhilippineClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const tz = 'Asia/Manila';

  if (compact) {
    // e.g. "Feb 24 · 09:35:22 AM"
    const datePart = now.toLocaleDateString('en-PH', {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
    });
    const timePart = now.toLocaleTimeString('en-PH', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    return (
      <span className={cn('text-xs text-muted-foreground tabular-nums whitespace-nowrap', className)}>
        {datePart}&nbsp;&middot;&nbsp;{timePart}
      </span>
    );
  }

  // Full format:
  // "Tuesday, February 24, 2026"
  // "09:35:22 AM"
  const fullDate = now.toLocaleDateString('en-PH', {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const fullTime = now.toLocaleTimeString('en-PH', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className={cn('text-xs text-muted-foreground tabular-nums leading-tight', className)}>
      <div className="font-medium text-foreground/70">{fullDate}</div>
      <div className="text-[11px] tracking-wide">{fullTime}</div>
    </div>
  );
}
