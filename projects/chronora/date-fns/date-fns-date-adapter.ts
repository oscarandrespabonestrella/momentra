import { createLocale, NativeDateAdapter, type ChronoraLocale } from '@chronora/angular';
import {
  addDays,
  addMonths,
  addYears,
  compareAsc,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  getDaysInMonth,
  isSameDay,
  isSameMonth,
  isSameYear,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  type Day,
  type Locale,
  type Month,
} from 'date-fns';

type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Date adapter that performs arithmetic, comparison and boundary calculations with
 * [date-fns](https://date-fns.org). Values are plain `Date` objects, so this adapter is a drop-in
 * replacement for the native one in the same applications.
 *
 * Differences from the native adapter: string input is parsed with `parseISO`, so only ISO 8601
 * strings are accepted (bare `yyyy-MM-dd` is still a *local* calendar day).
 */
export class DateFnsDateAdapter extends NativeDateAdapter {
  override isValid(date: Date | null | undefined): date is Date {
    return date instanceof Date && isValid(date);
  }

  override deserialize(value: unknown): Date | null {
    if (typeof value === 'string') {
      const text = value.trim();
      const parsed = text === '' ? null : parseISO(text);
      return parsed && isValid(parsed) ? parsed : null;
    }
    return super.deserialize(value);
  }

  override addDays(date: Date, amount: number): Date {
    return addDays(date, amount);
  }

  override addMonths(date: Date, amount: number): Date {
    return addMonths(date, amount);
  }

  override addYears(date: Date, amount: number): Date {
    return addYears(date, amount);
  }

  override compare(a: Date, b: Date): number {
    return compareAsc(a, b);
  }

  override isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
    return a == null || b == null ? a == null && b == null : isSameDay(a, b);
  }

  override isSameMonth(a: Date | null | undefined, b: Date | null | undefined): boolean {
    return a == null || b == null ? a == null && b == null : isSameMonth(a, b);
  }

  override isSameYear(a: Date | null | undefined, b: Date | null | undefined): boolean {
    return a == null || b == null ? a == null && b == null : isSameYear(a, b);
  }

  override differenceInDays(to: Date, from: Date): number {
    return differenceInCalendarDays(to, from);
  }

  override getDaysInMonth(date: Date): number {
    return getDaysInMonth(date);
  }

  override startOfDay(date: Date): Date {
    return startOfDay(date);
  }

  override endOfDay(date: Date): Date {
    return endOfDay(date);
  }

  override startOfMonth(date: Date): Date {
    return startOfMonth(date);
  }

  override endOfMonth(date: Date): Date {
    return endOfMonth(date);
  }

  override startOfYear(date: Date): Date {
    return startOfYear(date);
  }

  override endOfYear(date: Date): Date {
    return endOfYear(date);
  }

  override startOfWeek(date: Date, firstDayOfWeek: number): Date {
    return startOfWeek(date, { weekStartsOn: firstDayOfWeek as WeekDay });
  }

  override endOfWeek(date: Date, firstDayOfWeek: number): Date {
    return endOfWeek(date, { weekStartsOn: firstDayOfWeek as WeekDay });
  }
}

/** Converts a date-fns format string (`dd/MM/y`, `h:mm a`) to a Chronora pattern. */
function toChronoraPattern(pattern: string): string {
  return pattern
    .replace(/'[^']*'|y+/g, (m) => (m.startsWith("'") ? m : 'yyyy'))
    .replace(/M+/g, 'MM')
    .replace(/d+/g, 'dd')
    .replace(/H+/g, 'HH')
    .replace(/h+/g, 'hh')
    .replace(/m+/g, 'mm')
    .replace(/s+/g, 'ss')
    .replace(/a+/g, 'a');
}

/**
 * Builds a {@link ChronoraLocale} from a date-fns locale object, so month/weekday names, the first
 * day of the week and default formats come from date-fns.
 *
 * ```ts
 * import { es } from 'date-fns/locale';
 * provideChronoraDateFns({ locale: chronoraLocaleFromDateFns('es-ES', es) })
 * ```
 */
export function chronoraLocaleFromDateFns(
  code: string,
  locale: Locale,
  overrides: Partial<ChronoraLocale> = {},
): ChronoraLocale {
  const month = (i: number, width: 'wide' | 'abbreviated') => locale.localize.month(i as Month, { width });
  const day = (i: number, width: 'wide' | 'abbreviated' | 'narrow') => locale.localize.day(i as Day, { width });
  const range = <T>(n: number, fn: (i: number) => T) => Array.from({ length: n }, (_, i) => fn(i));
  const base = createLocale(code);
  const dateFormat = locale.formatLong.date({ width: 'short' });
  const timeFormat = locale.formatLong.time({ width: 'short' });
  const datePattern = dateFormat ? toChronoraPattern(dateFormat) : base.dateFormat;
  const timePattern = timeFormat ? toChronoraPattern(timeFormat) : base.timeFormat;
  return {
    ...base,
    monthNames: range(12, (i) => month(i, 'wide')),
    monthNamesShort: range(12, (i) => month(i, 'abbreviated')),
    weekdayNames: range(7, (i) => day(i, 'wide')),
    weekdayNamesShort: range(7, (i) => day(i, 'abbreviated')),
    weekdayNamesNarrow: range(7, (i) => day(i, 'narrow')),
    firstDayOfWeek: locale.options?.weekStartsOn ?? 0,
    dateFormat: datePattern,
    timeFormat: timePattern,
    dateTimeFormat: `${datePattern} ${timePattern}`,
    ...overrides,
  };
}
