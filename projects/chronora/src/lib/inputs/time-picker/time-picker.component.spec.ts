import { Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TimePickerComponent } from './time-picker.component';
import { blur, clickEl, createHost, overlay, press, settle, typeText } from '../../testing/test-helpers';

const at = (h: number, m = 0, s = 0, day = 5) => new Date(2026, 5, day, h, m, s);

@Component({
  imports: [TimePickerComponent, ReactiveFormsModule],
  template: `<chr-time-picker
    [formControl]="control"
    [hourFormat]="hourFormat()"
    [showSeconds]="seconds()"
    [minuteStep]="minuteStep()"
    [hourStep]="hourStep()"
    [min]="min()"
    [max]="max()"
    [baseDate]="base"
  />`,
})
class Host {
  control = new FormControl<Date | null>(null);
  hourFormat = signal<12 | 24 | null>(null);
  seconds = signal<boolean | null>(null);
  minuteStep = signal(1);
  hourStep = signal(1);
  min = signal<Date | null>(null);
  max = signal<Date | null>(null);
  base = at(0, 0, 0, 9);
}

@Component({
  imports: [TimePickerComponent, FormsModule],
  template: `<chr-time-picker [(ngModel)]="time" />`,
})
class NgModelHost {
  time: Date | null = null;
}

const input = (el: HTMLElement) => el.querySelector('input')!;
const toggle = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.chr-toggle')!;
const column = (id: string) => overlay().querySelector<HTMLElement>(`[data-col="${id}"]`)!;
const option = (col: string, label: string) =>
  Array.from(column(col).querySelectorAll<HTMLElement>('.chr-time-opt')).find((o) => o.textContent!.trim() === label)!;
const selected = (col: string) => column(col).querySelector('.chr-selected')?.textContent?.trim();

describe('TimePickerComponent', () => {
  describe('text input', () => {
    it('formats with the locale 12-hour clock and parses typed values', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      expect(input(el).placeholder).toBe('hh:mm a');
      await typeText(fixture, input(el), '3:45 pm');
      const value = fixture.componentInstance.control.value!;
      expect([value.getHours(), value.getMinutes(), value.getSeconds()]).toEqual([15, 45, 0]);
      expect([value.getFullYear(), value.getMonth(), value.getDate()]).toEqual([2026, 5, 9]); // baseDate
      await blur(fixture, input(el));
      expect(input(el).value).toBe('03:45 PM');
    });

    it('keeps the date part of an existing value when the time changes', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.setValue(at(8, 0, 0, 20));
      await settle(fixture);
      await typeText(fixture, input(el), '09:30 AM');
      expect(fixture.componentInstance.control.value).toEqual(at(9, 30, 0, 20));
    });

    it('supports a 24-hour clock', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.hourFormat.set(24);
      fixture.componentInstance.control.setValue(at(15, 5));
      await settle(fixture);
      expect(input(el).value).toBe('15:05');
      await typeText(fixture, input(el), '23:59');
      expect(fixture.componentInstance.control.value!.getHours()).toBe(23);
    });

    it('shows seconds when enabled', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.hourFormat.set(24);
      fixture.componentInstance.seconds.set(true);
      fixture.componentInstance.control.setValue(at(1, 2, 3));
      await settle(fixture);
      expect(input(el).value).toBe('01:02:03');
    });

    it('flags invalid times with chrInvalidTime', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await typeText(fixture, input(el), '25:99');
      expect(fixture.componentInstance.control.errors).toHaveProperty('chrInvalidTime');
      await blur(fixture, input(el));
      expect(el.querySelector('[role="alert"]')!.textContent).toContain('valid time');
    });

    it('validates min and max time of day regardless of date', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.hourFormat.set(24);
      fixture.componentInstance.min.set(at(9, 0, 0, 1));
      fixture.componentInstance.max.set(at(17, 0, 0, 1));
      await settle(fixture);
      await typeText(fixture, input(el), '08:59');
      expect(fixture.componentInstance.control.errors).toHaveProperty('chrMinTime');
      await typeText(fixture, input(el), '17:01');
      expect(fixture.componentInstance.control.errors).toHaveProperty('chrMaxTime');
      await typeText(fixture, input(el), '12:00');
      expect(fixture.componentInstance.control.errors).toBeNull();
    });

    it('steps minutes with the arrow keys (Shift: hours)', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.minuteStep.set(15);
      fixture.componentInstance.control.setValue(at(10, 0));
      await settle(fixture);
      await press(fixture, input(el), 'ArrowUp');
      expect(fixture.componentInstance.control.value).toEqual(at(10, 15));
      await press(fixture, input(el), 'ArrowDown', { shiftKey: true });
      expect(fixture.componentInstance.control.value).toEqual(at(9, 15));
    });

    it('does not step beyond max', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.max.set(at(10, 5));
      fixture.componentInstance.control.setValue(at(10, 5));
      await settle(fixture);
      await press(fixture, input(el), 'ArrowUp');
      expect(fixture.componentInstance.control.value).toEqual(at(10, 5));
    });
  });

  describe('popup', () => {
    it('opens with hour, minute and AM/PM lists and marks the current value', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.setValue(at(15, 30));
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      const dialog = overlay().querySelector('.chr-popup')!;
      expect(dialog.getAttribute('role')).toBe('dialog');
      expect(column('hours').getAttribute('role')).toBe('listbox');
      expect(column('hours').getAttribute('aria-label')).toBe('Hours');
      expect(column('seconds')).toBeNull();
      expect(selected('hours')).toBe('3');
      expect(selected('minutes')).toBe('30');
      expect(selected('meridiem')).toBe('PM');
      expect(toggle(el).getAttribute('aria-expanded')).toBe('true');
    });

    it('selects hour, minute and meridiem by clicking and keeps the popup open', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await clickEl(fixture, toggle(el));
      await clickEl(fixture, option('hours', '7'));
      await clickEl(fixture, option('minutes', '25'));
      await clickEl(fixture, option('meridiem', 'PM'));
      expect(fixture.componentInstance.control.value).toEqual(at(19, 25, 0, 9));
      expect(input(el).value).toBe('07:25 PM');
      expect(overlay().querySelector('.chr-popup')).not.toBeNull();
    });

    it('lists 24 hours and seconds in 24-hour mode', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.hourFormat.set(24);
      fixture.componentInstance.seconds.set(true);
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      expect(column('hours').querySelectorAll('.chr-time-opt').length).toBe(24);
      expect(column('seconds').querySelectorAll('.chr-time-opt').length).toBe(60);
      expect(column('meridiem')).toBeNull();
    });

    it('applies the configured intervals', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.minuteStep.set(15);
      fixture.componentInstance.hourFormat.set(24);
      fixture.componentInstance.hourStep.set(6);
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      expect(Array.from(column('minutes').querySelectorAll('.chr-time-opt')).map((o) => o.textContent!.trim())).toEqual([
        '00', '15', '30', '45',
      ]);
      expect(Array.from(column('hours').querySelectorAll('.chr-time-opt')).map((o) => o.textContent!.trim())).toEqual([
        '00', '06', '12', '18',
      ]);
    });

    it('disables options outside min/max and ignores clicks on them', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.hourFormat.set(24);
      fixture.componentInstance.min.set(at(9, 0));
      fixture.componentInstance.max.set(at(17, 0));
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      expect(option('hours', '08').getAttribute('aria-disabled')).toBe('true');
      expect(option('hours', '09').getAttribute('aria-disabled')).toBeNull();
      expect(option('hours', '18').getAttribute('aria-disabled')).toBe('true');
      await clickEl(fixture, option('hours', '08'));
      expect(fixture.componentInstance.control.value).toBeNull();
    });

    it('moves focus into the lists and navigates with arrows, selecting as it goes', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      document.body.appendChild(el);
      fixture.componentInstance.hourFormat.set(24);
      fixture.componentInstance.control.setValue(at(10, 30));
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      expect(document.activeElement).toBe(option('hours', '10'));
      expect(document.activeElement!.getAttribute('tabindex')).toBe('0');
      await press(fixture, document.activeElement!, 'ArrowDown');
      expect(fixture.componentInstance.control.value).toEqual(at(11, 30));
      expect(document.activeElement).toBe(option('hours', '11'));
      await press(fixture, document.activeElement!, 'ArrowRight');
      expect(document.activeElement).toBe(option('minutes', '30'));
      await press(fixture, document.activeElement!, 'End');
      expect(fixture.componentInstance.control.value).toEqual(at(11, 59));
      await press(fixture, document.activeElement!, 'Home');
      expect(fixture.componentInstance.control.value).toEqual(at(11, 0));
      await press(fixture, document.activeElement!, 'ArrowLeft');
      expect(document.activeElement).toBe(option('hours', '11'));
      el.remove();
    });

    it('closes with Done and Escape, returning focus to the input', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      document.body.appendChild(el);
      await clickEl(fixture, toggle(el));
      await clickEl(fixture, Array.from(overlay().querySelectorAll('.chr-btn')).find((b) => b.textContent!.trim() === 'Done')!);
      expect(overlay().querySelector('.chr-popup')).toBeNull();
      expect(document.activeElement).toBe(input(el));
      await clickEl(fixture, toggle(el));
      await press(fixture, document.activeElement!, 'Escape');
      expect(overlay().querySelector('.chr-popup')).toBeNull();
      el.remove();
    });

    it('"Now" selects the current time snapped to the steps', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.minuteStep.set(30);
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      await clickEl(fixture, Array.from(overlay().querySelectorAll('.chr-btn')).find((b) => b.textContent!.trim() === 'Now')!);
      const value = fixture.componentInstance.control.value!;
      expect([0, 30]).toContain(value.getMinutes());
      expect(value.getSeconds()).toBe(0);
    });

    it('stays reachable by keyboard: Alt+ArrowDown opens it', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await press(fixture, input(el), 'ArrowDown', { altKey: true });
      expect(overlay().querySelector('.chr-popup')).not.toBeNull();
    });
  });

  describe('Angular Forms', () => {
    it('is touched after closing, disabled by the form, and writes values', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await clickEl(fixture, toggle(el));
      await press(fixture, document.activeElement!, 'Escape');
      expect(fixture.componentInstance.control.touched).toBe(true);
      fixture.componentInstance.control.disable();
      await settle(fixture);
      expect(input(el).disabled).toBe(true);
      expect(toggle(el).disabled).toBe(true);
    });

    it('works with ngModel', async () => {
      const fixture = await createHost(NgModelHost);
      const el = fixture.nativeElement as HTMLElement;
      await typeText(fixture, input(el), '1:05 AM');
      expect(fixture.componentInstance.time!.getHours()).toBe(1);
      expect(fixture.componentInstance.time!.getMinutes()).toBe(5);
    });
  });
});
