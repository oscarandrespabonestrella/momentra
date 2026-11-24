import type { DateAdapter } from '../adapters/date-adapter';
import type { CompleteDateRange, DateRange, DateRangePreset } from '../models/date-range';

/**
 * Range selection logic and preset helpers. Pure functions, no Angular.
 */

/**
 * The range after the user picks `date` in the calendar:
 *
 * - empty or complete range → `date` starts a new range;
 * - only a start, and `date` is on/after it → the range is completed;
 * - only a start, and `date` is before it → `date` becomes the new start.
 */
export function pickRangeDate<TDate>(adapter: DateAdapter<TDate>, current: DateRange<TDate>, date: TDate): DateRange<TDate> {
  const day = adapter.startOfDay(date);
  const { start, end } = current;
  if (start === null || end !== null) {
    return { start: day, end: null };
  }
  if (adapter.compare(day, adapter.startOfDay(start)) < 0) {
    return { start: day, end: null };
  }
  return { start: adapter.startOfDay(start), end: day };
}

/** Whether two ranges cover exactly the same days. */
export function isSameRange<TDate>(
  adapter: DateAdapter<TDate>,
  a: DateRange<TDate> | null | undefined,
  b: DateRange<TDate> | null | undefined,
): boolean {
  return (
    adapter.isSameDay(a?.start ?? null, b?.start ?? null) && adapter.isSameDay(a?.end ?? null, b?.end ?? null)
  );
}

/** The `days` days ending today (inclusive): `lastDays(adapter, 7)` is today and the 6 days before. */
export function lastDaysRange<TDate>(adapter: DateAdapter<TDate>, days: number): CompleteDateRange<TDate> {
  const today = adapter.today();
  return { start: adapter.addDays(today, -(days - 1)), end: today };
}

/** From the first to the last day of the current month. */
export function thisMonthRange<TDate>(adapter: DateAdapter<TDate>): CompleteDateRange<TDate> {
  const today = adapter.today();
  return { start: adapter.startOfMonth(today), end: adapter.getLastDayOfMonth(today) };
}

/** From the first to the last day of the previous month. */
export function lastMonthRange<TDate>(adapter: DateAdapter<TDate>): CompleteDateRange<TDate> {
  const previous = adapter.addMonths(adapter.today(), -1);
  return { start: adapter.startOfMonth(previous), end: adapter.getLastDayOfMonth(previous) };
}

/** From the start to the end of the current week. */
export function thisWeekRange<TDate>(adapter: DateAdapter<TDate>, firstDayOfWeek: number): CompleteDateRange<TDate> {
  const today = adapter.today();
  return {
    start: adapter.startOfWeek(today, firstDayOfWeek),
    end: adapter.startOfDay(adapter.endOfWeek(today, firstDayOfWeek)),
  };
}

/** Builds a preset whose range is computed when it is used, so "last 7 days" is never stale. */
export function createPreset<TDate>(label: string, range: () => CompleteDateRange<TDate>): DateRangePreset<TDate> {
  return { label, range };
}

/** Resolves a preset's (possibly lazy) range. */
export function resolvePreset<TDate>(preset: DateRangePreset<TDate>): CompleteDateRange<TDate> {
  return typeof preset.range === 'function' ? preset.range() : preset.range;
}
