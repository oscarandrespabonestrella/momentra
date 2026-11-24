import { EN_US_LOCALE } from '@chronora/angular';
import { es, enGB } from 'date-fns/locale';
import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from '../src/lib/testing/adapter-contract';
import { DateFnsDateAdapter, chronoraLocaleFromDateFns } from './date-fns-date-adapter';

describeAdapterContract('DateFnsDateAdapter', () => new DateFnsDateAdapter());

describe('DateFnsDateAdapter specifics', () => {
  const adapter = new DateFnsDateAdapter();

  it('parses ISO date-times with an offset as instants', () => {
    expect(adapter.deserialize('2026-03-15T10:00:00Z')!.getTime()).toBe(Date.UTC(2026, 2, 15, 10));
  });

  it('only accepts ISO strings', () => {
    expect(adapter.deserialize('March 15, 2026')).toBeNull();
  });

  it('treats a null on either side of a same-day check like the native adapter', () => {
    expect(adapter.isSameDay(null, null)).toBe(true);
    expect(adapter.isSameDay(new Date(), null)).toBe(false);
  });
});

describe('chronoraLocaleFromDateFns', () => {
  it('takes names, week start and formats from the date-fns locale', () => {
    const locale = chronoraLocaleFromDateFns('es-ES', es);
    expect(locale.monthNames[0].toLowerCase()).toBe('enero');
    expect(locale.weekdayNames[1].toLowerCase()).toBe('lunes');
    expect(locale.firstDayOfWeek).toBe(1);
    expect(locale.dateFormat).toBe('dd/MM/yyyy');
    expect(locale.dateTimeFormat).toContain('dd/MM/yyyy');
    expect(locale.labels).toBeDefined();
  });

  it('formats dates with the converted locale', () => {
    const locale = chronoraLocaleFromDateFns('en-GB', enGB);
    const adapter = new DateFnsDateAdapter();
    expect(adapter.formatMonthYear(new Date(2026, 10, 1), locale)).toBe('November 2026');
    expect(locale.firstDayOfWeek).toBe(1);
  });

  it('lets callers override fields', () => {
    expect(chronoraLocaleFromDateFns('es-ES', es, { dateFormat: 'yyyy-MM-dd' }).dateFormat).toBe('yyyy-MM-dd');
    expect(EN_US_LOCALE.dateFormat).toBe('MM/dd/yyyy');
  });
});
