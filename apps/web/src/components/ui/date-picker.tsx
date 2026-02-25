'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ─── Calendar (DayPicker styled with Tailwind) ─────────────────────────────

type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          'h-7 w-7 bg-transparent p-0 inline-flex items-center justify-center rounded-md',
          'border border-input hover:bg-accent hover:text-accent-foreground',
          'opacity-50 hover:opacity-100 transition-opacity',
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center',
        row: 'flex w-full mt-2',
        cell: cn(
          'h-9 w-9 text-center text-sm p-0 relative',
          '[&:has([aria-selected].day-range-end)]:rounded-r-md',
          '[&:has([aria-selected].day-outside)]:bg-accent/50',
          '[&:has([aria-selected])]:bg-accent',
          'first:[&:has([aria-selected])]:rounded-l-md',
          'last:[&:has([aria-selected])]:rounded-r-md',
          'focus-within:relative focus-within:z-20',
        ),
        day: cn(
          'h-9 w-9 p-0 font-normal rounded-md',
          'inline-flex items-center justify-center text-sm',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'aria-selected:opacity-100 cursor-pointer transition-colors',
        ),
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground font-semibold',
        day_outside:
          'day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
        day_disabled: 'text-muted-foreground opacity-50 cursor-not-allowed',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <span className="text-xs">‹</span>,
        IconRight: () => <span className="text-xs">›</span>,
      }}
      {...props}
    />
  );
}

// ─── DatePicker ────────────────────────────────────────────────────────────

interface DatePickerProps {
  /** Controlled value as YYYY-MM-DD string. Pass '' for empty. */
  value: string;
  /** Called with a YYYY-MM-DD string when the user picks a date, or '' when cleared. */
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Prevent selecting dates before this YYYY-MM-DD */
  minDate?: string;
  /** Prevent selecting dates after this YYYY-MM-DD */
  maxDate?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  className,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse the YYYY-MM-DD string to a Date object for DayPicker
  const selected = React.useMemo(() => {
    if (!value) return undefined;
    const d = parse(value, 'yyyy-MM-dd', new Date());
    return isValid(d) ? d : undefined;
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    } else {
      onChange('');
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const fromDate = minDate ? parse(minDate, 'yyyy-MM-dd', new Date()) : undefined;
  const toDate = maxDate ? parse(maxDate, 'yyyy-MM-dd', new Date()) : undefined;

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            // Match the existing <Input> height, border, radius, and font size exactly
            'flex h-10 w-full items-center rounded-md border border-input',
            'bg-background px-3 py-2 text-sm ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            // Show muted text when no date selected
            !value && 'text-muted-foreground',
            disabled && 'bg-muted',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left truncate">
            {selected ? format(selected, 'MMM d, yyyy') : placeholder}
          </span>
          {value && !disabled && (
            <X
              className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleClear}
              role="button"
              aria-label="Clear date"
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          fromDate={fromDate}
          toDate={toDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
