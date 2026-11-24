import { NativeDateAdapter } from './native-date-adapter';
import { EN_US_LOCALE } from '../../localization/locale';

describe('NativeDateAdapter', () => {
  const adapter = new NativeDateAdapter();
  const d = (y: number, m: number, day: number, h = 0, mi = 0, s = 0) => adapter.create(y, m, day, h, mi, s);

  describe('creation and validity', () => {
    it('creates local dates from calendar fields', () => {
      const date = d(2026, 10, 23, 14, 30, 5);
      expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()]).toEqual([
        2026, 10, 23, 14, 30, 5,
      ]);
    });

    it('returns an invalid date instead of rolling over', () => {
      expect(adapter.isValid(d(2023, 1, 29))).toBe(false); // 29 Feb 2023
      expect(adapter.isValid(d(2024, 1, 29))).toBe(true);
      expect(adapter.isValid(d(2024, 12, 1))).toBe(false);
      expect(adapter.isValid(d(2024, 0, 1, 24))).toBe(false);
    });

    it('does not map years 0-99 to the 1900s', () => {
      expect(d(50, 0, 1).getFullYear()).toBe(50);
    });

    it('treats null and non-dates as invalid', () => {
      expect(adapter.isValid(null)).toBe(false);
      expect(adapter.isValid(new Date('nope'))).toBe(false);
    });
  });

  describe('deserialize', () => {
    it('reads a bare ISO date as that local day (never UTC)', () => {
      const date = adapter.deserialize('2026-03-15')!;
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(2);
      expect(date.getDate()).toBe(15);
      expect(date.getHours()).toBe(0);
    });

    it('rejects impossible ISO dates and garbage', () => {
      expect(adapter.deserialize('2026-02-30')).toBeNull();
      expect(adapter.deserialize('')).toBeNull();
      expect(adapter.deserialize('hello')).toBeNull();
      expect(adapter.deserialize({})).toBeNull();
    });

    it('copies Date inputs and accepts timestamps', () => {
      const source = d(2026, 0, 1);
      const copy = adapter.deserialize(source)!;
      expect(copy).not.toBe(source);
      expect(copy.getTime()).toBe(source.getTime());
      expect(adapter.deserialize(source.getTime())!.getTime()).toBe(source.getTime());
    });
  });

  describe('manipulation', () => {
    it('adds and subtracts days across month and year boundaries', () => {
      expect(adapter.addDays(d(2026, 11, 31), 1)).toEqual(d(2027, 0, 1));
      expect(adapter.subtractDays(d(2026, 2, 1), 1)).toEqual(d(2026, 1, 28));
    });

    it('preserves wall-clock time when adding days', () => {
      const result = adapter.addDays(d(2026, 2, 28, 9, 30), 2);
      expect([result.getHours(), result.getMinutes()]).toEqual([9, 30]);
    });

    it('clamps the day when adding months into a shorter month', () => {
      expect(adapter.addMonths(d(2026, 0, 31), 1)).toEqual(d(2026, 1, 28));
      expect(adapter.addMonths(d(2024, 0, 31), 1)).toEqual(d(2024, 1, 29));
      expect(adapter.subtractMonths(d(2026, 2, 31), 1)).toEqual(d(2026, 1, 28));
    });

    it('rolls months over years in both directions', () => {
      expect(adapter.addMonths(d(2026, 10, 15), 3)).toEqual(d(2027, 1, 15));
      expect(adapter.addMonths(d(2026, 0, 15), -1)).toEqual(d(2025, 11, 15));
      expect(adapter.addMonths(d(2026, 0, 15), -25)).toEqual(d(2023, 11, 15));
    });

    it('clamps 29 February when adding years', () => {
      expect(adapter.addYears(d(2024, 1, 29), 1)).toEqual(d(2025, 1, 28));
      expect(adapter.addYears(d(2024, 1, 29), 4)).toEqual(d(2028, 1, 29));
      expect(adapter.subtractYears(d(2026, 5, 1), 2)).toEqual(d(2024, 5, 1));
    });
  });

  describe('comparison', () => {
    it('compares, and checks equality with null safety', () => {
      expect(adapter.compare(d(2026, 0, 1), d(2026, 0, 2))).toBe(-1);
      expect(adapter.compare(d(2026, 0, 2), d(2026, 0, 1))).toBe(1);
      expect(adapter.compare(d(2026, 0, 1), d(2026, 0, 1))).toBe(0);
      expect(adapter.isEqual(null, null)).toBe(true);
      expect(adapter.isEqual(d(2026, 0, 1), null)).toBe(false);
    });

    it('checks same day / month / year', () => {
      expect(adapter.isSameDay(d(2026, 5, 5, 1), d(2026, 5, 5, 23))).toBe(true);
      expect(adapter.isSameDay(d(2026, 5, 5), d(2026, 5, 6))).toBe(false);
      expect(adapter.isSameMonth(d(2026, 5, 1), d(2026, 5, 30))).toBe(true);
      expect(adapter.isSameMonth(d(2026, 5, 1), d(2025, 5, 1))).toBe(false);
      expect(adapter.isSameYear(d(2026, 0, 1), d(2026, 11, 31))).toBe(true);
    });

    it('checks ranges inclusively by default', () => {
      const [a, b] = [d(2026, 0, 1), d(2026, 0, 10)];
      expect(adapter.isBetween(a, a, b)).toBe(true);
      expect(adapter.isBetween(b, a, b)).toBe(true);
      expect(adapter.isBetween(a, a, b, false)).toBe(false);
      expect(adapter.isBetween(d(2026, 0, 5), a, b, false)).toBe(true);
      expect(adapter.isBetween(d(2026, 0, 11), a, b)).toBe(false);
    });

    it('computes whole-day differences ignoring time', () => {
      expect(adapter.differenceInDays(d(2026, 0, 10, 23), d(2026, 0, 1, 1))).toBe(9);
      expect(adapter.differenceInDays(d(2026, 0, 1), d(2026, 0, 10))).toBe(-9);
    });

    it('keeps whole-day differences correct across a DST change', () => {
      // March in most northern zones contains a 23h day; the count must still be whole days.
      expect(adapter.differenceInDays(d(2026, 3, 1), d(2026, 2, 1))).toBe(31);
    });

    it('clamps to bounds', () => {
      const [min, max] = [d(2026, 0, 10), d(2026, 0, 20)];
      expect(adapter.clamp(d(2026, 0, 1), min, max)).toBe(min);
      expect(adapter.clamp(d(2026, 0, 30), min, max)).toBe(max);
      expect(adapter.clamp(d(2026, 0, 15), min, max)).toEqual(d(2026, 0, 15));
    });
  });

  describe('boundaries', () => {
    it('computes start/end of day, month and year', () => {
      const date = d(2026, 1, 14, 13, 45, 10);
      expect(adapter.startOfDay(date)).toEqual(d(2026, 1, 14));
      expect(adapter.endOfDay(date).getHours()).toBe(23);
      expect(adapter.startOfMonth(date)).toEqual(d(2026, 1, 1));
      expect(adapter.endOfMonth(date).getDate()).toBe(28);
      expect(adapter.startOfYear(date)).toEqual(d(2026, 0, 1));
      expect(adapter.endOfYear(date).getMonth()).toBe(11);
    });

    it('computes weeks for either first day of week', () => {
      const wed = d(2026, 10, 25); // Wednesday
      expect(adapter.startOfWeek(wed, 0)).toEqual(d(2026, 10, 22)); // Sunday
      expect(adapter.startOfWeek(wed, 1)).toEqual(d(2026, 10, 23)); // Monday
      expect(adapter.startOfWeek(d(2026, 10, 22), 1)).toEqual(d(2026, 10, 16)); // Sunday belongs to prior Mon week
      expect(adapter.endOfWeek(wed, 1).getDate()).toBe(29);
    });
  });

  describe('calendar', () => {
    it('knows month lengths including leap years', () => {
      expect(adapter.getDaysInMonth(d(2024, 1, 1))).toBe(29);
      expect(adapter.getDaysInMonth(d(2023, 1, 1))).toBe(28);
      expect(adapter.getDaysInMonth(d(1900, 1, 1))).toBe(28);
      expect(adapter.getDaysInMonth(d(2000, 1, 1))).toBe(29);
      expect(adapter.getDaysInMonth(d(2026, 3, 1))).toBe(30);
      expect(adapter.getDaysInMonth(d(2026, 0, 1))).toBe(31);
    });

    it('returns first and last days of the month', () => {
      expect(adapter.getFirstDayOfMonth(d(2026, 1, 14))).toEqual(d(2026, 1, 1));
      expect(adapter.getLastDayOfMonth(d(2026, 1, 14))).toEqual(d(2026, 1, 28));
    });

    it('builds calendar weeks that cover the month', () => {
      const weeks = adapter.getCalendarWeeks(d(2026, 10, 15), 0); // Nov 2026 starts on Sunday
      expect(weeks.length).toBe(5);
      expect(weeks.every((w) => w.length === 7)).toBe(true);
      expect(weeks[0][0]).toEqual(d(2026, 10, 1));
      expect(weeks[4][6]).toEqual(d(2026, 11, 5));
      expect(adapter.getCalendarWeeks(d(2026, 10, 15), 1)[0][0]).toEqual(d(2026, 9, 26));
    });

    it('can force six weeks', () => {
      expect(adapter.getCalendarWeeks(d(2026, 1, 1), 0, true).length).toBe(6);
      expect(adapter.getCalendarWeeks(d(2026, 1, 1), 0).length).toBe(4); // Feb 2026: 28 days from Sunday
    });
  });

  describe('time', () => {
    it('reads and sets hours, minutes and seconds', () => {
      const date = d(2026, 5, 5, 10, 20, 30);
      expect([adapter.getHours(date), adapter.getMinutes(date), adapter.getSeconds(date)]).toEqual([10, 20, 30]);
      expect(adapter.setHours(date, 1)).toEqual(d(2026, 5, 5, 1, 20, 30));
      expect(adapter.setMinutes(date, 2)).toEqual(d(2026, 5, 5, 10, 2, 30));
      expect(adapter.setSeconds(date, 3)).toEqual(d(2026, 5, 5, 10, 20, 3));
      expect(date).toEqual(d(2026, 5, 5, 10, 20, 30)); // not mutated
    });

    it('combines a day with a time of day', () => {
      expect(adapter.combine(d(2026, 0, 1), d(2000, 5, 5, 7, 8, 9))).toEqual(d(2026, 0, 1, 7, 8, 9));
      expect(adapter.secondsOfDay(d(2026, 0, 1, 1, 1, 1))).toBe(3661);
    });
  });

  describe('formatting and parsing', () => {
    it('formats with the locale defaults', () => {
      const date = d(2026, 10, 23, 15, 5);
      expect(adapter.formatDate(date, EN_US_LOCALE)).toBe('11/23/2026');
      expect(adapter.formatTime(date, EN_US_LOCALE)).toBe('03:05 PM');
      expect(adapter.formatDateTime(date, EN_US_LOCALE)).toBe('11/23/2026 03:05 PM');
      expect(adapter.formatMonthYear(date, EN_US_LOCALE)).toBe('November 2026');
      expect(adapter.formatWeekday(date, EN_US_LOCALE, 'long')).toBe('Monday');
      expect(adapter.formatWeekday(date, EN_US_LOCALE)).toBe('Mon');
    });

    it('parses what it formats (round trip)', () => {
      const date = d(2026, 10, 23, 15, 5, 9);
      const pattern = 'yyyy-MM-dd HH:mm:ss';
      expect(adapter.parse(adapter.format(date, pattern, EN_US_LOCALE), pattern, EN_US_LOCALE)).toEqual(date);
    });

    it('rejects impossible dates when parsing', () => {
      expect(adapter.parse('02/30/2026', 'MM/dd/yyyy', EN_US_LOCALE)).toBeNull();
      expect(adapter.parse('13/01/2026', 'MM/dd/yyyy', EN_US_LOCALE)).toBeNull();
      expect(adapter.parse('02/29/2023', 'MM/dd/yyyy', EN_US_LOCALE)).toBeNull();
      expect(adapter.parse('02/29/2024', 'MM/dd/yyyy', EN_US_LOCALE)).toEqual(d(2024, 1, 29));
    });

    it('takes the date from a base when the pattern only has a time', () => {
      const base = d(2026, 5, 5);
      expect(adapter.parse('09:15', 'HH:mm', EN_US_LOCALE, base)).toEqual(d(2026, 5, 5, 9, 15));
    });
  });
});

import { describeAdapterContract } from '../../testing/adapter-contract';

describeAdapterContract('NativeDateAdapter', () => new NativeDateAdapter());
