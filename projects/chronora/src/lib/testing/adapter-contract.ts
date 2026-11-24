import { describe, expect, it } from 'vitest';
import type { DateAdapter } from '../core/adapters/date-adapter';
import { EN_US_LOCALE, ES_ES_LOCALE } from '../localization/locale';

type Fields = [year: number, month: number, day: number, hours: number, minutes: number, seconds: number];

/**
 * Behavioural contract every {@link DateAdapter} must satisfy. Run it from the adapter's own spec:
 *
 * ```ts
 * describeAdapterContract('MyAdapter', () => new MyAdapter());
 * ```
 *
 * Fields are compared through the adapter's own getters, so the suite is independent of the date type.
 */
export function describeAdapterContract<TDate>(name: string, factory: () => DateAdapter<TDate>): void {
  describe(`${name} adapter contract`, () => {
    const a = factory();
    const make = (y: number, m: number, d: number, h = 0, mi = 0, s = 0) => a.create(y, m, d, h, mi, s);
    const fields = (date: TDate): Fields => [
      a.getYear(date), a.getMonth(date), a.getDate(date), a.getHours(date), a.getMinutes(date), a.getSeconds(date),
    ];
    const day = (date: TDate): [number, number, number] => [a.getYear(date), a.getMonth(date), a.getDate(date)];

    it('creates dates from local calendar fields', () => {
      expect(fields(make(2026, 10, 23, 14, 30, 5))).toEqual([2026, 10, 23, 14, 30, 5]);
      expect(a.getDayOfWeek(make(2026, 10, 23))).toBe(1); // Monday
      expect(a.getDayOfWeek(make(2026, 10, 22))).toBe(0); // Sunday
    });

    it('returns invalid dates instead of rolling over', () => {
      expect(a.isValid(make(2023, 1, 29))).toBe(false);
      expect(a.isValid(make(2024, 1, 29))).toBe(true);
      expect(a.isValid(make(2024, 12, 1))).toBe(false);
      expect(a.isValid(make(2024, 0, 1, 24))).toBe(false);
      expect(a.isValid(a.invalid())).toBe(false);
      expect(a.isValid(null)).toBe(false);
    });

    it('deserializes ISO dates as local calendar days, never UTC instants', () => {
      expect(day(a.deserialize('2026-03-15')!)).toEqual([2026, 2, 15]);
      expect(fields(a.deserialize('2026-03-15')!).slice(3)).toEqual([0, 0, 0]);
      expect(a.deserialize('2026-02-30')).toBeNull();
      expect(a.deserialize('')).toBeNull();
      expect(a.deserialize('not a date')).toBeNull();
      expect(a.deserialize({})).toBeNull();
      expect(a.deserialize(null)).toBeNull();
    });

    it('adds days across boundaries and keeps the wall-clock time', () => {
      expect(fields(a.addDays(make(2026, 11, 31, 9, 30), 1))).toEqual([2027, 0, 1, 9, 30, 0]);
      expect(day(a.subtractDays(make(2026, 2, 1), 1))).toEqual([2026, 1, 28]);
      expect(day(a.addDays(make(2026, 0, 1), 400))).toEqual([2027, 1, 5]);
    });

    it('clamps month and year arithmetic instead of overflowing', () => {
      expect(day(a.addMonths(make(2026, 0, 31), 1))).toEqual([2026, 1, 28]);
      expect(day(a.addMonths(make(2024, 0, 31), 1))).toEqual([2024, 1, 29]);
      expect(day(a.addMonths(make(2026, 0, 15), -1))).toEqual([2025, 11, 15]);
      expect(day(a.addYears(make(2024, 1, 29), 1))).toEqual([2025, 1, 28]);
      expect(day(a.subtractYears(make(2026, 5, 1), 2))).toEqual([2024, 5, 1]);
      expect(day(a.subtractMonths(make(2026, 2, 31), 1))).toEqual([2026, 1, 28]);
    });

    it('compares dates', () => {
      expect(a.compare(make(2026, 0, 1), make(2026, 0, 2))).toBeLessThan(0);
      expect(a.compare(make(2026, 0, 2), make(2026, 0, 1))).toBeGreaterThan(0);
      expect(a.compare(make(2026, 0, 1), make(2026, 0, 1))).toBe(0);
      expect(a.isEqual(make(2026, 0, 1), make(2026, 0, 1))).toBe(true);
      expect(a.isEqual(null, null)).toBe(true);
      expect(a.isEqual(make(2026, 0, 1), null)).toBe(false);
      expect(a.isSameDay(make(2026, 5, 5, 1), make(2026, 5, 5, 23))).toBe(true);
      expect(a.isSameDay(make(2026, 5, 5), make(2026, 5, 6))).toBe(false);
      expect(a.isSameMonth(make(2026, 5, 1), make(2026, 5, 30))).toBe(true);
      expect(a.isSameMonth(make(2026, 5, 1), make(2025, 5, 1))).toBe(false);
      expect(a.isSameYear(make(2026, 0, 1), make(2026, 11, 31))).toBe(true);
      expect(a.isBetween(make(2026, 0, 5), make(2026, 0, 1), make(2026, 0, 10))).toBe(true);
      expect(a.isBetween(make(2026, 0, 1), make(2026, 0, 1), make(2026, 0, 10), false)).toBe(false);
      expect(a.differenceInDays(make(2026, 3, 1), make(2026, 2, 1))).toBe(31);
      expect(a.differenceInDays(make(2026, 0, 1), make(2026, 0, 10))).toBe(-9);
    });

    it('computes boundaries', () => {
      const date = make(2026, 1, 14, 13, 45, 10);
      expect(fields(a.startOfDay(date))).toEqual([2026, 1, 14, 0, 0, 0]);
      expect(fields(a.endOfDay(date)).slice(3)).toEqual([23, 59, 59]);
      expect(day(a.startOfMonth(date))).toEqual([2026, 1, 1]);
      expect(day(a.endOfMonth(date))).toEqual([2026, 1, 28]);
      expect(day(a.startOfYear(date))).toEqual([2026, 0, 1]);
      expect(day(a.endOfYear(date))).toEqual([2026, 11, 31]);
      expect(day(a.startOfWeek(make(2026, 10, 25), 0))).toEqual([2026, 10, 22]);
      expect(day(a.startOfWeek(make(2026, 10, 25), 1))).toEqual([2026, 10, 23]);
      expect(day(a.startOfWeek(make(2026, 10, 22), 1))).toEqual([2026, 10, 16]);
      expect(day(a.endOfWeek(make(2026, 10, 25), 1))).toEqual([2026, 10, 29]);
    });

    it('exposes calendar information', () => {
      expect(a.getDaysInMonth(make(2024, 1, 1))).toBe(29);
      expect(a.getDaysInMonth(make(2023, 1, 1))).toBe(28);
      expect(a.getDaysInMonth(make(2026, 3, 1))).toBe(30);
      expect(day(a.getFirstDayOfMonth(make(2026, 1, 14)))).toEqual([2026, 1, 1]);
      expect(day(a.getLastDayOfMonth(make(2026, 1, 14)))).toEqual([2026, 1, 28]);
      const weeks = a.getCalendarWeeks(make(2026, 10, 15), 0);
      expect(weeks.length).toBe(5);
      expect(day(weeks[0][0])).toEqual([2026, 10, 1]);
      expect(day(weeks[4][6])).toEqual([2026, 11, 5]);
      expect(weeks.every((w) => w.length === 7)).toBe(true);
      expect(a.getCalendarWeeks(make(2026, 1, 1), 0, true).length).toBe(6);
      expect(day(a.getCalendarWeeks(make(2026, 10, 15), 1)[0][0])).toEqual([2026, 9, 26]);
    });

    it('reads and sets the time of day without mutating', () => {
      const date = make(2026, 5, 5, 10, 20, 30);
      expect([a.getHours(date), a.getMinutes(date), a.getSeconds(date)]).toEqual([10, 20, 30]);
      expect(fields(a.setHours(date, 1))).toEqual([2026, 5, 5, 1, 20, 30]);
      expect(fields(a.setMinutes(date, 2))).toEqual([2026, 5, 5, 10, 2, 30]);
      expect(fields(a.setSeconds(date, 3))).toEqual([2026, 5, 5, 10, 20, 3]);
      expect(fields(date)).toEqual([2026, 5, 5, 10, 20, 30]);
      expect(fields(a.combine(make(2026, 0, 1), make(2000, 5, 5, 7, 8, 9)))).toEqual([2026, 0, 1, 7, 8, 9]);
      expect(a.secondsOfDay(make(2026, 0, 1, 1, 1, 1))).toBe(3661);
    });

    it('formats and parses with Chronora patterns and locales', () => {
      const date = make(2026, 10, 23, 15, 5);
      expect(a.formatDate(date, EN_US_LOCALE)).toBe('11/23/2026');
      expect(a.formatTime(date, EN_US_LOCALE)).toBe('03:05 PM');
      expect(a.formatDateTime(date, EN_US_LOCALE)).toBe('11/23/2026 03:05 PM');
      expect(a.formatMonthYear(date, EN_US_LOCALE)).toBe('November 2026');
      expect(a.formatWeekday(date, EN_US_LOCALE, 'long')).toBe('Monday');
      expect(a.formatDate(date, ES_ES_LOCALE)).toBe('23/11/2026');
      expect(fields(a.parse('23/11/2026 15:05', 'dd/MM/yyyy HH:mm', ES_ES_LOCALE)!)).toEqual([2026, 10, 23, 15, 5, 0]);
      expect(a.parse('31/02/2026', 'dd/MM/yyyy', ES_ES_LOCALE)).toBeNull();
      expect(a.parse('garbage', 'dd/MM/yyyy', ES_ES_LOCALE)).toBeNull();
    });

    it('creates the current day at midnight for today()', () => {
      const today = a.today();
      expect(a.isValid(today)).toBe(true);
      expect(fields(today).slice(3)).toEqual([0, 0, 0]);
    });
  });
}
