import { DateAdapter, parseIsoDate } from '@chronora/angular';
import { DateTime } from 'luxon';

export interface LuxonDateAdapterOptions {
  /**
   * IANA zone (`'Europe/Madrid'`, `'UTC'`) in which dates are created and read. Defaults to the
   * system zone. Calendar fields (year, month, day, hour…) always refer to this zone.
   */
  zone?: string;
}

/**
 * Date adapter for [Luxon](https://moment.github.io/luxon/) `DateTime` values, with optional
 * fixed-zone support for time-zone-aware workflows.
 *
 * Values are zoned `DateTime`s: the calendar fields the picker shows are the fields **in the
 * adapter's zone**, regardless of the user's system zone.
 */
export class LuxonDateAdapter extends DateAdapter<DateTime> {
  private readonly zone: string | undefined;

  constructor(options: LuxonDateAdapterOptions = {}) {
    super();
    this.zone = options.zone;
  }

  override now(): DateTime {
    return this.inZone(DateTime.now());
  }

  override create(
    year: number,
    month: number,
    day: number,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
  ): DateTime {
    // Luxon would accept hour 24 as "end of day"; Chronora never rolls fields over.
    if (
      !Number.isInteger(month) ||
      month < 0 ||
      month > 11 ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59 ||
      seconds < 0 ||
      seconds > 59 ||
      milliseconds < 0 ||
      milliseconds > 999
    ) {
      return this.invalid();
    }
    // Luxon reports impossible dates (30 February, hour 24 with minutes…) as invalid DateTimes.
    return DateTime.fromObject(
      { year, month: month + 1, day, hour: hours, minute: minutes, second: seconds, millisecond: milliseconds },
      this.zone ? { zone: this.zone } : {},
    );
  }

  override clone(date: DateTime): DateTime {
    return date; // DateTime is immutable
  }

  override invalid(): DateTime {
    return DateTime.invalid('Invalid date');
  }

  override isValid(date: DateTime | null | undefined): date is DateTime {
    return DateTime.isDateTime(date) && date.isValid;
  }

  override deserialize(value: unknown): DateTime | null {
    let result: DateTime | null = null;
    if (DateTime.isDateTime(value)) {
      result = value;
    } else if (value instanceof Date) {
      result = DateTime.fromJSDate(value);
    } else if (typeof value === 'number') {
      result = DateTime.fromMillis(value);
    } else if (typeof value === 'string') {
      const text = value.trim();
      const day = parseIsoDate(text);
      if (day) {
        result = this.create(day.year, day.month, day.day); // a calendar day in the adapter's zone
      } else if (text !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        result = DateTime.fromISO(text, this.zone ? { zone: this.zone } : {});
      }
    }
    return result && result.isValid ? this.inZone(result) : null;
  }

  override getYear(date: DateTime): number {
    return date.year;
  }

  override getMonth(date: DateTime): number {
    return date.month - 1;
  }

  override getDate(date: DateTime): number {
    return date.day;
  }

  override getDayOfWeek(date: DateTime): number {
    return date.weekday % 7; // Luxon: 1 = Monday … 7 = Sunday
  }

  override getHours(date: DateTime): number {
    return date.hour;
  }

  override getMinutes(date: DateTime): number {
    return date.minute;
  }

  override getSeconds(date: DateTime): number {
    return date.second;
  }

  override getMilliseconds(date: DateTime): number {
    return date.millisecond;
  }

  override toTimestamp(date: DateTime): number {
    return date.toMillis();
  }

  override addDays(date: DateTime, amount: number): DateTime {
    return date.plus({ days: amount });
  }

  private inZone(date: DateTime): DateTime {
    return this.zone ? date.setZone(this.zone) : date.toLocal();
  }
}
