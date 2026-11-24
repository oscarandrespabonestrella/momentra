import { formatParts, parseParts, type DateTimeParts, type PatternLocale } from '../../formatting/format-pattern';
import type { ChronoraLocale } from '../../localization/locale';

/** Number of days in a month of the proleptic Gregorian calendar. `month` is zero-based. */
export function daysInMonthOf(year: number, month: number): number {
  if (month === 1) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  }
  return [3, 5, 8, 10].includes(month) ? 30 : 31;
}

/**
 * Abstraction over a date library. Chronora components never touch a concrete date type: every
 * operation goes through the adapter, so any date representation (`Date`, date-fns, Luxon, …)
 * can be used by supplying an adapter.
 *
 * Adapters implement a small set of **primitives** (the abstract members). Everything else
 * (comparison helpers, boundaries, calendar weeks, formatting and parsing) is implemented once
 * here on top of those primitives, so behaviour is identical for every adapter.
 *
 * Conventions: months are zero-based (0 = January); weekdays are 0 = Sunday … 6 = Saturday.
 * Values handed out by the adapter are treated as immutable; operations return new objects.
 */
export abstract class DateAdapter<TDate> {
  // ---------------------------------------------------------------- primitives: creation

  /** The current instant. */
  abstract now(): TDate;

  /**
   * Creates a date from local calendar fields. Returns an *invalid* date (see {@link isValid})
   * when the fields are out of range, e.g. 30 February or month 12 — it never rolls over.
   */
  abstract create(
    year: number,
    month: number,
    day: number,
    hours?: number,
    minutes?: number,
    seconds?: number,
    milliseconds?: number,
  ): TDate;

  /** Returns a copy of the date. */
  abstract clone(date: TDate): TDate;

  /** Returns an invalid date value. */
  abstract invalid(): TDate;

  /** `true` when `date` is a usable date of this adapter's type. */
  abstract isValid(date: TDate | null | undefined): date is TDate;

  /**
   * Converts a supported external value (an adapter date, epoch milliseconds, an ISO string) to a
   * date. ISO strings without a time part (`yyyy-MM-dd`) are interpreted as that **local calendar
   * day**, never as UTC. Returns `null` for unsupported or invalid input.
   */
  abstract deserialize(value: unknown): TDate | null;

  // ---------------------------------------------------------------- primitives: reading

  abstract getYear(date: TDate): number;
  /** Zero-based month. */
  abstract getMonth(date: TDate): number;
  /** Day of the month, 1–31. */
  abstract getDate(date: TDate): number;
  /** 0 = Sunday … 6 = Saturday. */
  abstract getDayOfWeek(date: TDate): number;
  abstract getHours(date: TDate): number;
  abstract getMinutes(date: TDate): number;
  abstract getSeconds(date: TDate): number;
  abstract getMilliseconds(date: TDate): number;
  /** Epoch milliseconds of the instant. Used for ordering. */
  abstract toTimestamp(date: TDate): number;

  // ---------------------------------------------------------------- primitives: arithmetic

  /** Adds (or, if negative, subtracts) calendar days, preserving wall-clock time. */
  abstract addDays(date: TDate, amount: number): TDate;

  // ---------------------------------------------------------------- derived: creation

  /** Start of the current day. */
  today(): TDate {
    return this.startOfDay(this.now());
  }

  /** The local date fields of `date`, as plain numbers. */
  toParts(date: TDate): DateTimeParts {
    return {
      year: this.getYear(date),
      month: this.getMonth(date),
      day: this.getDate(date),
      hours: this.getHours(date),
      minutes: this.getMinutes(date),
      seconds: this.getSeconds(date),
      milliseconds: this.getMilliseconds(date),
    };
  }

  // ---------------------------------------------------------------- derived: formatting & parsing

  /** Formats `date` with a Chronora pattern (`yyyy MM dd HH hh mm ss a MMMM MMM EEEE EEE`). */
  format(date: TDate, pattern: string, locale: PatternLocale): string {
    return formatParts(this.toParts(date), pattern, locale);
  }

  /**
   * Parses `text` strictly against `pattern`. Fields missing from the pattern come from `base`
   * for date fields (today if omitted) and are zero for time fields. Returns `null` when the text
   * does not match or denotes an impossible date.
   */
  parse(text: string, pattern: string, locale: PatternLocale, base?: TDate | null): TDate | null {
    const parsed = parseParts(text, pattern, locale);
    if (!parsed) {
      return null;
    }
    const ref = base && this.isValid(base) ? base : this.today();
    const date = this.create(
      parsed.year ?? this.getYear(ref),
      parsed.month ?? this.getMonth(ref),
      parsed.day ?? this.getDate(ref),
      parsed.hours ?? 0,
      parsed.minutes ?? 0,
      parsed.seconds ?? 0,
      parsed.milliseconds ?? 0,
    );
    return this.isValid(date) ? date : null;
  }

  formatDate(date: TDate, locale: ChronoraLocale, pattern: string = locale.dateFormat): string {
    return this.format(date, pattern, locale);
  }

  formatTime(date: TDate, locale: ChronoraLocale, pattern: string = locale.timeFormat): string {
    return this.format(date, pattern, locale);
  }

  formatDateTime(date: TDate, locale: ChronoraLocale, pattern: string = locale.dateTimeFormat): string {
    return this.format(date, pattern, locale);
  }

  /** Label for a calendar header, e.g. `November 2026`. */
  formatMonthYear(date: TDate, locale: ChronoraLocale): string {
    return this.format(date, locale.monthYearFormat, locale);
  }

  /** Name of the weekday of `date`. */
  formatWeekday(date: TDate, locale: ChronoraLocale, style: 'long' | 'short' | 'narrow' = 'short'): string {
    const weekday = this.getDayOfWeek(date);
    return style === 'long'
      ? locale.weekdayNames[weekday]
      : style === 'narrow'
        ? locale.weekdayNamesNarrow[weekday]
        : locale.weekdayNamesShort[weekday];
  }

  // ---------------------------------------------------------------- derived: arithmetic

  subtractDays(date: TDate, amount: number): TDate {
    return this.addDays(date, -amount);
  }

  /**
   * Adds calendar months. When the target month is shorter the day is clamped to its last day
   * (31 Jan + 1 month = 28/29 Feb), never rolled into the next month.
   */
  addMonths(date: TDate, amount: number): TDate {
    const total = this.getYear(date) * 12 + this.getMonth(date) + amount;
    const year = Math.floor(total / 12);
    const month = total - year * 12;
    const day = Math.min(this.getDate(date), daysInMonthOf(year, month));
    return this.create(
      year,
      month,
      day,
      this.getHours(date),
      this.getMinutes(date),
      this.getSeconds(date),
      this.getMilliseconds(date),
    );
  }

  subtractMonths(date: TDate, amount: number): TDate {
    return this.addMonths(date, -amount);
  }

  addYears(date: TDate, amount: number): TDate {
    return this.addMonths(date, amount * 12);
  }

  subtractYears(date: TDate, amount: number): TDate {
    return this.addYears(date, -amount);
  }

  // ---------------------------------------------------------------- derived: comparison

  /** Negative when `a` is before `b`, positive when after, `0` when equal. */
  compare(a: TDate, b: TDate): number {
    return Math.sign(this.toTimestamp(a) - this.toTimestamp(b));
  }

  /** Same instant. `null` equals only `null`. */
  isEqual(a: TDate | null | undefined, b: TDate | null | undefined): boolean {
    if (a == null || b == null) {
      return a == null && b == null;
    }
    return this.toTimestamp(a) === this.toTimestamp(b);
  }

  isSameDay(a: TDate | null | undefined, b: TDate | null | undefined): boolean {
    if (a == null || b == null) {
      return a == null && b == null;
    }
    return (
      this.getYear(a) === this.getYear(b) && this.getMonth(a) === this.getMonth(b) && this.getDate(a) === this.getDate(b)
    );
  }

  isSameMonth(a: TDate | null | undefined, b: TDate | null | undefined): boolean {
    if (a == null || b == null) {
      return a == null && b == null;
    }
    return this.getYear(a) === this.getYear(b) && this.getMonth(a) === this.getMonth(b);
  }

  isSameYear(a: TDate | null | undefined, b: TDate | null | undefined): boolean {
    if (a == null || b == null) {
      return a == null && b == null;
    }
    return this.getYear(a) === this.getYear(b);
  }

  isBefore(a: TDate, b: TDate): boolean {
    return this.compare(a, b) < 0;
  }

  isAfter(a: TDate, b: TDate): boolean {
    return this.compare(a, b) > 0;
  }

  /** Whether `date` lies between `start` and `end`. Bounds are inclusive unless `inclusive` is false. */
  isBetween(date: TDate, start: TDate, end: TDate, inclusive = true): boolean {
    const c1 = this.compare(date, start);
    const c2 = this.compare(date, end);
    return inclusive ? c1 >= 0 && c2 <= 0 : c1 > 0 && c2 < 0;
  }

  /** Restricts `date` to `[min, max]`; either bound may be omitted. */
  clamp(date: TDate, min?: TDate | null, max?: TDate | null): TDate {
    if (min && this.compare(date, min) < 0) {
      return min;
    }
    if (max && this.compare(date, max) > 0) {
      return max;
    }
    return date;
  }

  /** Whole calendar days from `from` to `to` (negative if `to` is earlier); ignores time of day. */
  differenceInDays(to: TDate, from: TDate): number {
    const a = Date.UTC(this.getYear(to), this.getMonth(to), this.getDate(to));
    const b = Date.UTC(this.getYear(from), this.getMonth(from), this.getDate(from));
    return Math.round((a - b) / 86_400_000);
  }

  // ---------------------------------------------------------------- derived: boundaries

  startOfDay(date: TDate): TDate {
    return this.create(this.getYear(date), this.getMonth(date), this.getDate(date));
  }

  endOfDay(date: TDate): TDate {
    return this.create(this.getYear(date), this.getMonth(date), this.getDate(date), 23, 59, 59, 999);
  }

  startOfMonth(date: TDate): TDate {
    return this.create(this.getYear(date), this.getMonth(date), 1);
  }

  endOfMonth(date: TDate): TDate {
    const y = this.getYear(date);
    const m = this.getMonth(date);
    return this.create(y, m, daysInMonthOf(y, m), 23, 59, 59, 999);
  }

  startOfYear(date: TDate): TDate {
    return this.create(this.getYear(date), 0, 1);
  }

  endOfYear(date: TDate): TDate {
    return this.create(this.getYear(date), 11, 31, 23, 59, 59, 999);
  }

  /** First day of the week containing `date` (start of day). */
  startOfWeek(date: TDate, firstDayOfWeek: number): TDate {
    const offset = (this.getDayOfWeek(date) - firstDayOfWeek + 7) % 7;
    return this.addDays(this.startOfDay(date), -offset);
  }

  endOfWeek(date: TDate, firstDayOfWeek: number): TDate {
    return this.endOfDay(this.addDays(this.startOfWeek(date, firstDayOfWeek), 6));
  }

  // ---------------------------------------------------------------- derived: calendar

  getDaysInMonth(date: TDate): number {
    return daysInMonthOf(this.getYear(date), this.getMonth(date));
  }

  /** First day of the month (start of day). */
  getFirstDayOfMonth(date: TDate): TDate {
    return this.startOfMonth(date);
  }

  /** Last day of the month (start of day). */
  getLastDayOfMonth(date: TDate): TDate {
    return this.create(this.getYear(date), this.getMonth(date), this.getDaysInMonth(date));
  }

  /** First day of the week, as a start-of-day date. Alias of {@link startOfWeek}. */
  getFirstDayOfWeek(date: TDate, firstDayOfWeek: number): TDate {
    return this.startOfWeek(date, firstDayOfWeek);
  }

  /**
   * The weeks needed to display the month of `date`, each an array of 7 start-of-day dates that
   * includes the leading/trailing days of adjacent months. With `fixedWeeks` there are always 6 weeks.
   */
  getCalendarWeeks(date: TDate, firstDayOfWeek: number, fixedWeeks = false): TDate[][] {
    const first = this.startOfWeek(this.startOfMonth(date), firstDayOfWeek);
    const last = this.startOfDay(this.getLastDayOfMonth(date));
    const spanDays = this.differenceInDays(last, first) + 1;
    const weekCount = fixedWeeks ? 6 : Math.ceil(spanDays / 7);
    const weeks: TDate[][] = [];
    let cursor = first;
    for (let w = 0; w < weekCount; w++) {
      const week: TDate[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(cursor);
        cursor = this.addDays(cursor, 1);
      }
      weeks.push(week);
    }
    return weeks;
  }

  // ---------------------------------------------------------------- derived: time

  /** Returns `date` with the given time of day (date unchanged). */
  withTime(date: TDate, hours: number, minutes: number, seconds = 0, milliseconds = 0): TDate {
    return this.create(this.getYear(date), this.getMonth(date), this.getDate(date), hours, minutes, seconds, milliseconds);
  }

  setHours(date: TDate, hours: number): TDate {
    return this.withTime(date, hours, this.getMinutes(date), this.getSeconds(date), this.getMilliseconds(date));
  }

  setMinutes(date: TDate, minutes: number): TDate {
    return this.withTime(date, this.getHours(date), minutes, this.getSeconds(date), this.getMilliseconds(date));
  }

  setSeconds(date: TDate, seconds: number): TDate {
    return this.withTime(date, this.getHours(date), this.getMinutes(date), seconds, this.getMilliseconds(date));
  }

  /** Copies the calendar day of `day` onto the time of day of `time`. */
  combine(day: TDate, time: TDate): TDate {
    return this.withTime(day, this.getHours(time), this.getMinutes(time), this.getSeconds(time), this.getMilliseconds(time));
  }

  /** Seconds since local midnight; ignores the date part. */
  secondsOfDay(date: TDate): number {
    return this.getHours(date) * 3600 + this.getMinutes(date) * 60 + this.getSeconds(date);
  }
}
