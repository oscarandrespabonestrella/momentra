import { parseIsoDate } from '../models/calendar-date';
import { DateAdapter, daysInMonthOf } from './date-adapter';

/**
 * Default adapter backed by the JavaScript `Date` object, operating in the **local** time zone.
 *
 * Date-only values are represented as local midnight and are only ever read through local
 * getters, so a selected calendar day never shifts with the UTC offset.
 */
export class NativeDateAdapter extends DateAdapter<Date> {
  override now(): Date {
    return new Date();
  }

  override create(
    year: number,
    month: number,
    day: number,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
  ): Date {
    const inRange =
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      month >= 0 &&
      month <= 11 &&
      Number.isInteger(day) &&
      day >= 1 &&
      day <= daysInMonthOf(year, month) &&
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59 &&
      seconds >= 0 &&
      seconds <= 59 &&
      milliseconds >= 0 &&
      milliseconds <= 999;
    if (!inRange) {
      return this.invalid();
    }
    const date = new Date(2000, 0, 1, 0, 0, 0, 0);
    // setFullYear (unlike the Date constructor) does not map years 0–99 to 1900–1999.
    date.setFullYear(year, month, day);
    date.setHours(hours, minutes, seconds, milliseconds);
    return date;
  }

  override clone(date: Date): Date {
    return new Date(date.getTime());
  }

  override invalid(): Date {
    return new Date(NaN);
  }

  override isValid(date: Date | null | undefined): date is Date {
    return date instanceof Date && !Number.isNaN(date.getTime());
  }

  override deserialize(value: unknown): Date | null {
    if (value instanceof Date) {
      return this.isValid(value) ? this.clone(value) : null;
    }
    if (typeof value === 'number') {
      const date = new Date(value);
      return this.isValid(date) ? date : null;
    }
    if (typeof value === 'string') {
      const text = value.trim();
      if (text === '') {
        return null;
      }
      const day = parseIsoDate(text);
      if (day) {
        // A bare ISO date is a calendar day, not a UTC instant.
        const date = this.create(day.year, day.month, day.day);
        return this.isValid(date) ? date : null;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return null; // looks like an ISO date but is impossible (e.g. 2026-02-30); Date.parse would roll it over
      }
      const date = new Date(text);
      return this.isValid(date) ? date : null;
    }
    return null;
  }

  override getYear(date: Date): number {
    return date.getFullYear();
  }

  override getMonth(date: Date): number {
    return date.getMonth();
  }

  override getDate(date: Date): number {
    return date.getDate();
  }

  override getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  override getHours(date: Date): number {
    return date.getHours();
  }

  override getMinutes(date: Date): number {
    return date.getMinutes();
  }

  override getSeconds(date: Date): number {
    return date.getSeconds();
  }

  override getMilliseconds(date: Date): number {
    return date.getMilliseconds();
  }

  override toTimestamp(date: Date): number {
    return date.getTime();
  }

  override addDays(date: Date, amount: number): Date {
    const result = new Date(date.getTime());
    result.setDate(result.getDate() + amount);
    return result;
  }
}
