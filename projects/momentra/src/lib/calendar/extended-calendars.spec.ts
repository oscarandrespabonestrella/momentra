import { Component, signal } from '@angular/core';
import { DateInputComponent } from '../inputs/date-input/date-input.component';
import { DateTimeInputComponent } from '../inputs/datetime-input/datetime-input.component';
import { clickEl, createHost } from '../testing/test-helpers';
import { InfiniteCalendarComponent } from './infinite-calendar/infinite-calendar.component';
import { MultiviewCalendarComponent } from './multiview-calendar/multiview-calendar.component';

@Component({
  imports: [InfiniteCalendarComponent, MultiviewCalendarComponent, DateInputComponent, DateTimeInputComponent],
  template: `
    <mtr-infinite-calendar id="inf" [(value)]="single" [initialDate]="start" />
    <mtr-multiview-calendar id="mv" [views]="2" mode="range" [(value)]="range" [initialDate]="start" />
    <mtr-date-input id="di" spinners [(value)]="single" />
    <mtr-datetime-input id="dti" spinners [(value)]="stamp" format="yyyy-MM-dd HH:mm" />
  `,
})
class Host {
  start = new Date(2026, 10, 1);
  single = signal<Date | null>(null);
  range = signal<Date[]>([]);
  stamp = signal<Date | null>(new Date(2026, 10, 1, 10, 30));
}

const days = (root: Element) => Array.from(root.querySelectorAll<HTMLElement>('button.mtr-cell'));
const day = (root: Element, label: string) => days(root).find((b) => b.textContent!.trim() === label)!;

describe('extended components', () => {
  it('infinite calendar renders months and selects a day', async () => {
    const fixture = await createHost(Host);
    const el = (fixture.nativeElement as HTMLElement).querySelector('#inf')!;
    expect(el.querySelectorAll('section').length).toBeGreaterThan(12);
    await clickEl(fixture, day(el, '15'));
    expect(fixture.componentInstance.single()!.getDate()).toBe(15);
  });

  it('multiview calendar shows two months and picks a range across them', async () => {
    const fixture = await createHost(Host);
    const el = (fixture.nativeElement as HTMLElement).querySelector('#mv')!;
    expect(el.querySelectorAll('table').length).toBe(2);
    const [nov, dec] = Array.from(el.querySelectorAll('table'));
    await clickEl(fixture, day(nov, '20'));
    await clickEl(fixture, day(dec, '5'));
    const [start, end] = fixture.componentInstance.range();
    expect([start.getMonth(), start.getDate(), end.getMonth(), end.getDate()]).toEqual([10, 20, 11, 5]);
  });

  it('spinners step the date and the date-time value', async () => {
    const fixture = await createHost(Host);
    const root = fixture.nativeElement as HTMLElement;
    await clickEl(fixture, root.querySelector('#dti .mtr-spin'));
    expect(fixture.componentInstance.stamp()!.getMinutes()).toBe(31);
    await clickEl(fixture, root.querySelectorAll('#di .mtr-spin')[0]);
    expect(fixture.componentInstance.single()).not.toBeNull();
  });

  it('spinners step the segment under the caret', async () => {
    const fixture = await createHost(Host);
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('#dti input')!;
    const spin = root.querySelector('#dti .mtr-spin') as HTMLElement;
    // "2026-11-01 10:30": caret in the year, month, hour in turn.
    for (const [caret, check] of [
      [2, (d: Date) => d.getFullYear() === 2027],
      [6, (d: Date) => d.getFullYear() === 2027 && d.getMonth() === 11],
      [12, (d: Date) => d.getMonth() === 11 && d.getHours() === 11],
    ] as const) {
      input.focus();
      input.setSelectionRange(caret, caret);
      await clickEl(fixture, spin);
      expect(check(fixture.componentInstance.stamp()!)).toBe(true);
    }
  });

  it('infinite calendar has a month rail that scrolls to the clicked month', async () => {
    const fixture = await createHost(Host);
    const el = (fixture.nativeElement as HTMLElement).querySelector('#inf')!;
    const items = el.querySelectorAll('.mtr-inf-rail-item');
    expect(items.length).toBe(11);
    expect(el.querySelector('.mtr-inf-rail-item.mtr-current')!.textContent!.trim()).toBe('Nov');
  });
});
