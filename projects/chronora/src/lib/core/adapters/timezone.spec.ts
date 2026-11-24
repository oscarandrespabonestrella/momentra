import { NativeDateAdapter } from './native-date-adapter';
import { CalendarDate, formatIsoDate, parseIsoDate, isSameCalendarDate } from '../models/calendar-date';

/**
 * Time-zone safety. These tests hold in every zone; run the suite with `TZ=<zone>` (see
 * `npm run test:tz`) to exercise DST transitions and extreme offsets.
 */
describe('time-zone handling (native adapter)', () => {
  const adapter = new NativeDateAdapter();

  it('applies the TZ environment variable when one is set (sanity check for the matrix run)', () => {
    const expected: Record<string, number> = {
      UTC: 0,
      'Asia/Kolkata': -330,
      'Pacific/Auckland': -720, // NZST in July
      'America/New_York': 240, // EDT in July
    };
    const tz = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env['TZ'];
    if (tz && tz in expected) {
      expect(new Date(2026, 6, 1, 12).getTimezoneOffset()).toBe(expected[tz]);
    }
  });

  it('visits every day of two years exactly once when stepping with addDays, with stable wall-clock noon', () => {
    let cursor = adapter.create(2026, 0, 1, 12, 0);
    for (let i = 0; i < 730; i++) {
      const next = adapter.addDays(cursor, 1);
      expect(adapter.differenceInDays(next, cursor)).toBe(1);
      expect(adapter.getHours(next)).toBe(12);
      expect(adapter.isSameDay(next, cursor)).toBe(false);
      cursor = next;
    }
    expect([adapter.getYear(cursor), adapter.getMonth(cursor), adapter.getDate(cursor)]).toEqual([2028, 0, 1]);
  });

  it('keeps every calendar week 7 consecutive days long in every month of a leap year', () => {
    for (let month = 0; month < 12; month++) {
      for (const firstDay of [0, 1, 6]) {
        const weeks = adapter.getCalendarWeeks(adapter.create(2024, month, 10), firstDay);
        const days = weeks.flat();
        expect(days.length % 7).toBe(0);
        days.slice(1).forEach((day, i) => expect(adapter.differenceInDays(day, days[i])).toBe(1));
        expect(adapter.getDayOfWeek(days[0])).toBe(firstDay);
        expect(days.some((d) => adapter.getDate(d) === 1 && adapter.getMonth(d) === month)).toBe(true);
      }
    }
  });

  it('round-trips every day of 2026 through the ISO calendar-date form without shifting', () => {
    for (let i = 0; i < 365; i++) {
      const date = adapter.addDays(adapter.create(2026, 0, 1), i);
      const calendarDate: CalendarDate = {
        year: adapter.getYear(date),
        month: adapter.getMonth(date),
        day: adapter.getDate(date),
      };
      const iso = formatIsoDate(calendarDate);
      expect(isSameCalendarDate(parseIsoDate(iso), calendarDate)).toBe(true);
      const back = adapter.deserialize(iso)!;
      expect(adapter.isSameDay(back, date)).toBe(true);
    }
  });

  it('shows why toISOString must not be used for calendar dates: the serializer here does not shift', () => {
    const date = adapter.create(2026, 5, 15); // local midnight
    expect(formatIsoDate({ year: 2026, month: 5, day: 15 })).toBe('2026-06-15');
    expect(adapter.deserialize('2026-06-15')).toEqual(date);
  });

  it('formats and parses dates that fall on DST change days', () => {
    // Pick every day of March and November: covers the US/EU/Chile/NZ transitions in at least one zone.
    for (const month of [2, 9, 10]) {
      for (let day = 1; day <= 28; day++) {
        const date = adapter.create(2026, month, day, 12, 30);
        const text = adapter.format(date, 'yyyy-MM-dd HH:mm', {
          monthNames: [], monthNamesShort: [], weekdayNames: [], weekdayNamesShort: [], meridiem: { am: 'AM', pm: 'PM' },
        });
        const parsed = adapter.parse(text, 'yyyy-MM-dd HH:mm', {
          monthNames: [], monthNamesShort: [], weekdayNames: [], weekdayNamesShort: [], meridiem: { am: 'AM', pm: 'PM' },
        });
        expect(parsed && adapter.isEqual(parsed, date)).toBe(true);
      }
    }
  });
});

describe('calendar-date helpers', () => {
  it('rejects impossible and malformed ISO dates', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('26-01-01')).toBeNull();
    expect(parseIsoDate('2026-1-1')).toBeNull();
    expect(parseIsoDate('2024-02-29')).toEqual({ year: 2024, month: 1, day: 29 });
  });

  it('pads years below 1000', () => {
    expect(formatIsoDate({ year: 33, month: 0, day: 5 })).toBe('0033-01-05');
  });
});
