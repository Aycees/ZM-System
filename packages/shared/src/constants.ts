// ============================================================
// ZM Systems — Shared Constants
// ============================================================

/** Standard working hours per day */
export const STANDARD_HOURS_PER_DAY = 8;

/** Half-day cap in hours */
export const HALF_DAY_HOURS_CAP = 4;

/** Maximum allowed hours per day */
export const MAX_HOURS_PER_DAY = 24;

/** Default overtime rate per additional hour (PHP) */
export const DEFAULT_OVERTIME_RATE = 100;

/** Default on-call rate per day (PHP) */
export const DEFAULT_ONCALL_RATE = 0;

/** Settings keys */
export const SETTINGS_KEYS = {
  OVERTIME_RATE_PER_HOUR: 'overtime_rate_per_hour',
  ONCALL_RATE_PER_DAY: 'oncall_rate_per_day',
} as const;

/** Pay period duration in days */
export const PAY_PERIOD_DAYS = 14; // bi-weekly
