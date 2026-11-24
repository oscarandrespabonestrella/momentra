import { ChronoraPatternError, formatParts, parseParts, type DateTimeParts } from './format-pattern';
import { EN_US_LOCALE, createLocale } from '../localization/locale';

const parts = (over: Partial<DateTimeParts> = {}): DateTimeParts => ({
  year: 2026, month: 10, day: 5, hours: 0, minutes: 7, seconds: 9, milliseconds: 4, ...over,
});

describe('formatParts', () => {
  it('formats numeric tokens with padding', () => {
    expect(formatParts(parts(), 'yyyy-MM-dd HH:mm:ss.SSS', EN_US_LOCALE)).toBe('2026-11-05 00:07:09.004');
    expect(formatParts(parts(), 'M/d/yy', EN_US_LOCALE)).toBe('11/5/26');
  });

  it('formats names', () => {
    expect(formatParts(parts(), 'EEEE, MMMM d, yyyy', EN_US_LOCALE)).toBe('Thursday, November 5, 2026');
    expect(formatParts(parts(), 'EEE MMM d', EN_US_LOCALE)).toBe('Thu Nov 5');
  });

  it('formats 12-hour clocks, mapping midnight and noon to 12', () => {
    expect(formatParts(parts({ hours: 0 }), 'h:mm a', EN_US_LOCALE)).toBe('12:07 AM');
    expect(formatParts(parts({ hours: 12 }), 'hh:mm a', EN_US_LOCALE)).toBe('12:07 PM');
    expect(formatParts(parts({ hours: 15 }), 'hh:mm a', EN_US_LOCALE)).toBe('03:07 PM');
  });

  it('supports quoted literals', () => {
    expect(formatParts(parts(), "yyyy 'year' MM 'o''clock'", EN_US_LOCALE)).toBe("2026 year 11 o'clock");
  });

  it('throws on unsupported letters and unterminated quotes', () => {
    expect(() => formatParts(parts(), 'yyyy-QQ', EN_US_LOCALE)).toThrow(ChronoraPatternError);
    expect(() => formatParts(parts(), "yyyy 'oops", EN_US_LOCALE)).toThrow(ChronoraPatternError);
  });

  it('uses locale month names', () => {
    const es = createLocale('es-ES');
    expect(formatParts(parts(), 'MMMM', es).toLowerCase()).toBe('noviembre');
  });
});

describe('parseParts', () => {
  it('parses numeric dates leniently on digit count', () => {
    expect(parseParts('1/5/2026', 'M/d/yyyy', EN_US_LOCALE)).toEqual({ month: 0, day: 5, year: 2026 });
    expect(parseParts('01/05/2026', 'MM/dd/yyyy', EN_US_LOCALE)).toEqual({ month: 0, day: 5, year: 2026 });
  });

  it('requires a full match', () => {
    expect(parseParts('01/05/2026 extra', 'MM/dd/yyyy', EN_US_LOCALE)).toBeNull();
    expect(parseParts('01/05', 'MM/dd/yyyy', EN_US_LOCALE)).toBeNull();
    expect(parseParts('01-05-2026', 'MM/dd/yyyy', EN_US_LOCALE)).toBeNull();
    expect(parseParts('', 'MM/dd/yyyy', EN_US_LOCALE)).toBeNull();
  });

  it('requires four digits for yyyy', () => {
    expect(parseParts('01/05/26', 'MM/dd/yyyy', EN_US_LOCALE)).toBeNull();
  });

  it('expands two-digit years with a 70-year pivot', () => {
    expect(parseParts('01/05/26', 'MM/dd/yy', EN_US_LOCALE)?.year).toBe(2026);
    expect(parseParts('01/05/85', 'MM/dd/yy', EN_US_LOCALE)?.year).toBe(1985);
  });

  it('rejects out-of-range fields', () => {
    expect(parseParts('13/01/2026', 'MM/dd/yyyy', EN_US_LOCALE)).toBeNull();
    expect(parseParts('01/32/2026', 'MM/dd/yyyy', EN_US_LOCALE)).toBeNull();
    expect(parseParts('24:00', 'HH:mm', EN_US_LOCALE)).toBeNull();
    expect(parseParts('12:60', 'HH:mm', EN_US_LOCALE)).toBeNull();
    expect(parseParts('00:30 AM', 'hh:mm a', EN_US_LOCALE)).toBeNull();
  });

  it('parses month names case-insensitively, preferring the longest match', () => {
    expect(parseParts('november 5, 2026', 'MMMM d, yyyy', EN_US_LOCALE)).toEqual({ month: 10, day: 5, year: 2026 });
    expect(parseParts('Nov 5 2026', 'MMM d yyyy', EN_US_LOCALE)).toEqual({ month: 10, day: 5, year: 2026 });
  });

  it('parses 12-hour times with meridiem', () => {
    expect(parseParts('12:30 AM', 'hh:mm a', EN_US_LOCALE)).toEqual({ hours: 0, minutes: 30 });
    expect(parseParts('12:30 pm', 'hh:mm a', EN_US_LOCALE)).toEqual({ hours: 12, minutes: 30 });
    expect(parseParts('3:05 PM', 'h:mm a', EN_US_LOCALE)).toEqual({ hours: 15, minutes: 5 });
    expect(parseParts('3:05', 'h:mm a', EN_US_LOCALE)).toBeNull();
  });

  it('handles adjacent numeric tokens with fixed widths', () => {
    expect(parseParts('20260105', 'yyyyMMdd', EN_US_LOCALE)).toEqual({ year: 2026, month: 0, day: 5 });
    expect(parseParts('202601', 'yyyyMMdd', EN_US_LOCALE)).toBeNull();
    expect(parseParts('2026135', 'yyyyMMdd', EN_US_LOCALE)).toBeNull(); // month 13
    expect(parseParts('0930', 'HHmm', EN_US_LOCALE)).toEqual({ hours: 9, minutes: 30 });
  });

  it('ignores surrounding whitespace', () => {
    expect(parseParts('  01/05/2026  ', 'MM/dd/yyyy', EN_US_LOCALE)).toEqual({ month: 0, day: 5, year: 2026 });
  });
});
