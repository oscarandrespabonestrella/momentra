import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateTimePickerComponent } from './datetime-picker.component';
import { blur, clickEl, createHost, overlay, press, settle, typeText } from '../../testing/test-helpers';

const dt = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0) => new Date(y, mo, d, h, mi, s);

@Component({
  imports: [DateTimePickerComponent, ReactiveFormsModule],
  template: `<mtr-datetime-picker
    [formControl]="control"
    [min]="min()"
    [max]="max()"
    [dateFormat]="dateFormat()"
    [hourFormat]="hourFormat()"
    [minuteStep]="minuteStep()"
    [initialDate]="initial"
  />`,
})
class Host {
  control = new FormControl<Date | null>(null);
  min = signal<Date | null>(null);
  max = signal<Date | null>(null);
  dateFormat = signal<string | undefined>(undefined);
  hourFormat = signal<12 | 24 | null>(null);
  minuteStep = signal(1);
  initial = dt(2026, 10, 15);
}

const input = (el: HTMLElement) => el.querySelector('input')!;
const toggle = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.mtr-toggle')!;
const day = (label: string) =>
  Array.from(overlay().querySelectorAll<HTMLButtonElement>('button.mtr-cell')).find(
    (c) => c.textContent!.trim() === label && !c.classList.contains('mtr-outside'),
  )!;
const timeOption = (col: string, label: string) =>
  Array.from(overlay().querySelectorAll<HTMLElement>(`[data-col="${col}"] .mtr-time-opt`)).find(
    (o) => o.textContent!.trim() === label,
  )!;

describe('DateTimePickerComponent', () => {
  describe('text input', () => {
    it('uses the locale date and time formats', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      expect(input(el).placeholder).toBe('mm/dd/yyyy hh:mm a');
      fixture.componentInstance.control.setValue(dt(2026, 10, 23, 15, 5));
      await settle(fixture);
      expect(input(el).value).toBe('11/23/2026 03:05 PM');
    });

    it('lets date and time formats be configured separately', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.dateFormat.set('yyyy-MM-dd');
      fixture.componentInstance.hourFormat.set(24);
      fixture.componentInstance.control.setValue(dt(2026, 10, 23, 15, 5));
      await settle(fixture);
      expect(input(el).value).toBe('2026-11-23 15:05');
    });

    it('parses typed date-times into a local Date', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await typeText(fixture, input(el), '02/09/2027 7:45 am');
      expect(fixture.componentInstance.control.value).toEqual(dt(2027, 1, 9, 7, 45));
      expect(fixture.componentInstance.control.errors).toBeNull();
      await typeText(fixture, input(el), '02/09/2027');
      expect(fixture.componentInstance.control.errors).toHaveProperty('mtrInvalidDate');
    });

    it('validates min and max as exact date-times', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.min.set(dt(2026, 5, 1, 9, 30));
      fixture.componentInstance.max.set(dt(2026, 5, 1, 17, 0));
      await settle(fixture);
      await typeText(fixture, input(el), '06/01/2026 09:00 AM');
      expect(fixture.componentInstance.control.errors).toHaveProperty('mtrMinDate');
      await typeText(fixture, input(el), '06/01/2026 05:30 PM');
      expect(fixture.componentInstance.control.errors).toHaveProperty('mtrMaxDate');
      await typeText(fixture, input(el), '06/01/2026 12:00 PM');
      expect(fixture.componentInstance.control.errors).toBeNull();
      await blur(fixture, input(el));
    });

    it('steps minutes, days (Shift) and hours (Ctrl) with the arrow keys, rolling over midnight', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.setValue(dt(2026, 0, 31, 23, 59));
      await settle(fixture);
      await press(fixture, input(el), 'ArrowUp');
      expect(fixture.componentInstance.control.value).toEqual(dt(2026, 1, 1, 0, 0));
      await press(fixture, input(el), 'ArrowDown', { ctrlKey: true });
      expect(fixture.componentInstance.control.value).toEqual(dt(2026, 0, 31, 23, 0));
      await press(fixture, input(el), 'ArrowUp', { shiftKey: true });
      expect(fixture.componentInstance.control.value).toEqual(dt(2026, 1, 1, 23, 0));
    });
  });

  describe('popup', () => {
    it('shows a calendar and time lists together', async () => {
      const fixture = await createHost(Host);
      await clickEl(fixture, toggle(fixture.nativeElement));
      expect(overlay().querySelector('mtr-calendar')).not.toBeNull();
      expect(overlay().querySelector('mtr-time-selector')).not.toBeNull();
      expect(overlay().querySelector('.mtr-title')!.textContent!.trim()).toBe('November 2026');
      expect(document.activeElement).toBe(day('15'));
    });

    it('combines the picked day with the picked time, in either order', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await clickEl(fixture, toggle(el));
      await clickEl(fixture, day('20'));
      expect(fixture.componentInstance.control.value).toEqual(dt(2026, 10, 20, 0, 0));
      expect(overlay().querySelector('.mtr-popup')).not.toBeNull(); // stays open to pick the time

      await clickEl(fixture, timeOption('hours', '2'));
      await clickEl(fixture, timeOption('minutes', '40'));
      await clickEl(fixture, timeOption('meridiem', 'PM'));
      expect(fixture.componentInstance.control.value).toEqual(dt(2026, 10, 20, 14, 40));

      await clickEl(fixture, day('22')); // changing the day keeps the time
      expect(fixture.componentInstance.control.value).toEqual(dt(2026, 10, 22, 14, 40));
      expect(input(el).value).toBe('11/22/2026 02:40 PM');
    });

    it('picks the time first when no date was chosen (date part comes from the shown month)', async () => {
      const fixture = await createHost(Host);
      await clickEl(fixture, toggle(fixture.nativeElement));
      await clickEl(fixture, timeOption('minutes', '15'));
      const value = fixture.componentInstance.control.value!;
      expect(value.getMinutes()).toBe(15);
      expect([value.getFullYear(), value.getMonth(), value.getDate()]).toEqual([2026, 10, 15]);
    });

    it('applies minute steps', async () => {
      const fixture = await createHost(Host);
      fixture.componentInstance.minuteStep.set(30);
      await settle(fixture);
      await clickEl(fixture, toggle(fixture.nativeElement));
      expect(overlay().querySelectorAll('[data-col="minutes"] .mtr-time-opt').length).toBe(2);
    });

    it('only restricts the time of day on the min boundary day', async () => {
      const fixture = await createHost(Host);
      fixture.componentInstance.hourFormat.set(24);
      fixture.componentInstance.min.set(dt(2026, 10, 10, 9, 0));
      fixture.componentInstance.control.setValue(dt(2026, 10, 10, 12, 0));
      await settle(fixture);
      await clickEl(fixture, toggle(fixture.nativeElement));
      expect(timeOption('hours', '08').getAttribute('aria-disabled')).toBe('true');
      expect(timeOption('hours', '09').getAttribute('aria-disabled')).toBeNull();
      await clickEl(fixture, day('12'));
      expect(timeOption('hours', '08').getAttribute('aria-disabled')).toBeNull();
    });

    it('clamps a picked day into min/max (time of day moves to the bound)', async () => {
      const fixture = await createHost(Host);
      fixture.componentInstance.min.set(dt(2026, 10, 10, 9, 0));
      fixture.componentInstance.control.setValue(dt(2026, 10, 12, 8, 0));
      await settle(fixture);
      await clickEl(fixture, toggle(fixture.nativeElement));
      await clickEl(fixture, day('10'));
      expect(fixture.componentInstance.control.value).toEqual(dt(2026, 10, 10, 9, 0));
    });

    it('closes with Done and Escape and marks the control touched', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await clickEl(fixture, toggle(el));
      await clickEl(fixture, Array.from(overlay().querySelectorAll('.mtr-btn')).find((b) => b.textContent!.trim() === 'Done')!);
      expect(overlay().querySelector('.mtr-popup')).toBeNull();
      expect(fixture.componentInstance.control.touched).toBe(true);
    });

    it('"Now" sets the current date and a snapped time', async () => {
      const fixture = await createHost(Host);
      fixture.componentInstance.minuteStep.set(30);
      await settle(fixture);
      await clickEl(fixture, toggle(fixture.nativeElement));
      await clickEl(fixture, Array.from(overlay().querySelectorAll('.mtr-btn')).find((b) => b.textContent!.trim() === 'Now')!);
      const value = fixture.componentInstance.control.value!;
      const now = new Date();
      expect([value.getFullYear(), value.getMonth(), value.getDate()]).toEqual([now.getFullYear(), now.getMonth(), now.getDate()]);
      expect([0, 30]).toContain(value.getMinutes());
    });
  });

  describe('Angular Forms', () => {
    it('propagates disabled state and clears via the clear button', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.setValue(dt(2026, 10, 23, 15, 5));
      await settle(fixture);
      await clickEl(fixture, el.querySelector('.mtr-clear'));
      expect(fixture.componentInstance.control.value).toBeNull();
      fixture.componentInstance.control.disable();
      await settle(fixture);
      expect(input(el).disabled).toBe(true);
    });
  });
});
