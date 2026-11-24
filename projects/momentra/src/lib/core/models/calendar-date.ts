/**
 * # Date, time and time-zone semantics
 *
 * Momentra distinguishes four kinds of value. Which one you are holding decides how it must be
 * stored and serialized:
 *
 * | Kind             | Example                    | Representation                                      |
 * |------------------|----------------------------|-----------------------------------------------------|
 * | `calendar-date`  | birthday, due date         | {@link CalendarDate} (`{year, month, day}`) or ISO `yyyy-MM-dd` |
 * | `local-datetime` | appointment at 09:30 local | wall-clock fields, no zone                          |
 * | `instant`        | event timestamp            | absolute point in time (UTC epoch)                  |
 * | `zoned-datetime` | 09:30 in Europe/Madrid     | instant + IANA zone (needs a zone-aware adapter)    |
 *
 * A JavaScript `Date` is an *instant*; it has no date-only type. Momentra's components therefore
 * treat the `Date` they emit for date-only pickers as **local midnight of the selected day** and
 * they only ever read/write the local calendar fields (`getFullYear()`, `getMonth()`, `getDate()`).
 * They never convert through UTC, so the selected day cannot shift by a time-zone offset.
 *
 * If you need to persist a calendar date (to JSON, a database `date` column, …), convert it with
 * {@link toCalendarDate}/{@link formatIsoDate} instead of `Date.prototype.toISOString()`, which
 * converts to UTC and can move the day.
 */
export type MomentraValueKind = 'calendar-date' | 'local-datetime' | 'instant' | 'zoned-datetime';

/** A date without time or time zone. `month` is zero-based (0 = January), like `Date`. */
export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/** Formats a calendar date as ISO 8601 `yyyy-MM-dd`. */
export function formatIsoDate(date: CalendarDate): string {
  const year = String(date.year).padStart(4, '0');
  const month = String(date.month + 1).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses an ISO `yyyy-MM-dd` string. Returns `null` for other shapes or for impossible dates
 * such as `2023-02-30`.
 */
export function parseIsoDate(text: string): CalendarDate | null {
  const match = ISO_DATE.exec(text.trim());
  if (!match) {
    return null;
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  const check = new Date(Date.UTC(2000, month, day));
  check.setUTCFullYear(year);
  if (month > 11 || check.getUTCMonth() !== month || check.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

/** Returns `true` when two calendar dates denote the same day. */
export function isSameCalendarDate(a: CalendarDate | null, b: CalendarDate | null): boolean {
  return a === b || (!!a && !!b && a.year === b.year && a.month === b.month && a.day === b.day);
}
