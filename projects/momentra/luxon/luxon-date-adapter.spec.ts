import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { EN_US_LOCALE } from '@momentra/angular';
import { describeAdapterContract } from '../src/lib/testing/adapter-contract';
import { LuxonDateAdapter } from './luxon-date-adapter';

describeAdapterContract('LuxonDateAdapter (system zone)', () => new LuxonDateAdapter());
describeAdapterContract('LuxonDateAdapter (UTC)', () => new LuxonDateAdapter({ zone: 'UTC' }));
describeAdapterContract('LuxonDateAdapter (Pacific/Auckland)', () => new LuxonDateAdapter({ zone: 'Pacific/Auckland' }));

describe('LuxonDateAdapter time zones', () => {
  it('creates and reads calendar fields in the configured zone', () => {
    const tokyo = new LuxonDateAdapter({ zone: 'Asia/Tokyo' });
    const date = tokyo.create(2026, 10, 23, 9, 30);
    expect(date.zoneName).toBe('Asia/Tokyo');
    expect(date.toUTC().toISO()).toBe('2026-11-23T00:30:00.000Z');
    expect([tokyo.getDate(date), tokyo.getHours(date)]).toEqual([23, 9]);
  });

  it('keeps a bare ISO date as that calendar day in the zone, whatever the system zone', () => {
    for (const zone of ['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'UTC']) {
      const adapter = new LuxonDateAdapter({ zone });
      const date = adapter.deserialize('2026-03-15')!;
      expect([adapter.getYear(date), adapter.getMonth(date), adapter.getDate(date)]).toEqual([2026, 2, 15]);
    }
  });

  it('converts instants into the adapter zone when deserializing', () => {
    const adapter = new LuxonDateAdapter({ zone: 'America/New_York' });
    const date = adapter.deserialize(new Date(Date.UTC(2026, 6, 1, 3, 0)))!; // 23:00 on 30 June in New York (EDT)
    expect([adapter.getMonth(date), adapter.getDate(date), adapter.getHours(date)]).toEqual([5, 30, 23]);
    expect(date.zoneName).toBe('America/New_York');
  });

  it('accepts DateTime, ISO strings with offsets and timestamps', () => {
    const adapter = new LuxonDateAdapter({ zone: 'UTC' });
    expect(adapter.deserialize(DateTime.fromISO('2026-01-02T03:04:05Z'))!.toMillis()).toBe(Date.UTC(2026, 0, 2, 3, 4, 5));
    expect(adapter.deserialize('2026-01-02T03:04:05+02:00')!.hour).toBe(1);
    expect(adapter.deserialize(Date.UTC(2026, 0, 2))!.day).toBe(2);
  });

  it('keeps wall-clock time across a DST change when adding days', () => {
    const adapter = new LuxonDateAdapter({ zone: 'America/New_York' });
    const before = adapter.create(2026, 2, 7, 12, 0); // day before US spring-forward (8 Mar 2026)
    const after = adapter.addDays(before, 2);
    expect([adapter.getDate(after), adapter.getHours(after)]).toEqual([9, 12]);
    expect(adapter.differenceInDays(after, before)).toBe(2);
  });

  it('reports a day that does not exist in a zone consistently', () => {
    const adapter = new LuxonDateAdapter({ zone: 'America/New_York' });
    expect(adapter.isValid(adapter.create(2026, 2, 8, 12, 0))).toBe(true);
    expect(adapter.formatDateTime(adapter.create(2026, 2, 8, 12, 0), EN_US_LOCALE)).toBe('03/08/2026 12:00 PM');
  });

  it('is immutable-friendly: clone returns an equal value', () => {
    const adapter = new LuxonDateAdapter();
    const date = adapter.create(2026, 0, 1);
    expect(adapter.isEqual(adapter.clone(date), date)).toBe(true);
  });
});
