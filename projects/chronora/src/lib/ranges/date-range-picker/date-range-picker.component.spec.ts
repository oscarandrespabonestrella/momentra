import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateRangePickerComponent } from './date-range-picker.component';
import type { DateRange, DateRangePreset } from '../../core/models/date-range';
import { NativeDateAdapter } from '../../core/adapters/native-date-adapter';
import {
  isSameRange,
  lastDaysRange,
  lastMonthRange,
  pickRangeDate,
  thisMonthRange,
  thisWeekRange,
} from '../../core/utils/range-utils';
import { blur, clickEl, createHost, overlay, press, settle, typeText } from '../../testing/test-helpers';

const d = (y: number, m: number, day: number) => new Date(y, m, day);
const range = (s: Date | null, e: Date | null): DateRange<Date> => ({ start: s, end: e });

@Component({
  imports: [DateRangePickerComponent, ReactiveFormsModule],
  template: `<chr-date-range-picker
    [formControl]="control"
    [min]="min()"
    [max]="max()"
    [minRangeLength]="minLength()"
    [maxRangeLength]="maxLength()"
    [disabledDates]="disabled()"
    [presets]="presets"
    [closeOnSelect]="closeOnSelect()"
    [initialDate]="initial"
    [required]="required()"
  />`,
})
class Host {
  control = new FormControl<DateRange<Date> | null>(null);
  min = signal<Date | null>(null);
  max = signal<Date | null>(null);
  minLength = signal<number | null>(null);
  maxLength = signal<number | null>(null);
  disabled = signal<((x: Date) => boolean) | null>(null);
  closeOnSelect = signal(true);
  required = signal(false);
  initial = d(2026, 10, 15);
  presets: DateRangePreset<Date>[] = [
    { label: 'Early November', range: { start: d(2026, 10, 1), end: d(2026, 10, 7) } },
    { label: 'Lazy', range: () => ({ start: d(2026, 10, 10), end: d(2026, 10, 12) }) },
  ];
}

const inputs = (el: HTMLElement) => el.querySelectorAll<HTMLInputElement>('input');
const toggle = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.chr-toggle')!;
const day = (label: string) =>
  Array.from(overlay().querySelectorAll<HTMLButtonElement>('button.chr-cell')).find(
    (c) => c.textContent!.trim() === label && !c.classList.contains('chr-outside'),
  )!;
const highlighted = () =>
  Array.from(overlay().querySelectorAll('button.chr-cell.chr-in-range')).map((c) => c.textContent!.trim());
const popup = () => overlay().querySelector('.chr-popup');
const hover = async (fixture: Parameters<typeof settle>[0], el: Element) => {
  el.dispatchEvent(new MouseEvent('mouseenter'));
  await settle(fixture);
};

describe('range utilities', () => {
  const adapter = new NativeDateAdapter();

  it('pickRangeDate starts, completes and restarts', () => {
    const empty = range(null, null);
    const started = pickRangeDate(adapter, empty, d(2026, 0, 10));
    expect(started).toEqual(range(d(2026, 0, 10), null));
    expect(pickRangeDate(adapter, started, d(2026, 0, 15))).toEqual(range(d(2026, 0, 10), d(2026, 0, 15)));
    expect(pickRangeDate(adapter, started, d(2026, 0, 10))).toEqual(range(d(2026, 0, 10), d(2026, 0, 10)));
    expect(pickRangeDate(adapter, started, d(2026, 0, 5))).toEqual(range(d(2026, 0, 5), null)); // earlier: restart
    const complete = range(d(2026, 0, 10), d(2026, 0, 15));
    expect(pickRangeDate(adapter, complete, d(2026, 0, 20))).toEqual(range(d(2026, 0, 20), null)); // new range
  });

  it('normalises picked dates to the start of the day', () => {
    const picked = pickRangeDate(adapter, range(null, null), new Date(2026, 0, 10, 15, 30));
    expect(picked.start).toEqual(d(2026, 0, 10));
  });

  it('compares ranges', () => {
    expect(isSameRange(adapter, range(d(2026, 0, 1), d(2026, 0, 2)), range(d(2026, 0, 1), d(2026, 0, 2)))).toBe(true);
    expect(isSameRange(adapter, range(d(2026, 0, 1), null), range(d(2026, 0, 1), d(2026, 0, 2)))).toBe(false);
    expect(isSameRange(adapter, null, range(null, null))).toBe(true);
  });

  it('builds common presets relative to today', () => {
    const today = adapter.today();
    const last7 = lastDaysRange(adapter, 7);
    expect(adapter.differenceInDays(last7.end, last7.start)).toBe(6);
    expect(adapter.isSameDay(last7.end, today)).toBe(true);
    const month = thisMonthRange(adapter);
    expect(month.start.getDate()).toBe(1);
    expect(month.end.getMonth()).toBe(today.getMonth());
    expect(month.end.getDate()).toBe(adapter.getDaysInMonth(today));
    const previous = lastMonthRange(adapter);
    expect(previous.end.getMonth()).toBe(adapter.addMonths(today, -1).getMonth());
    expect(adapter.differenceInDays(adapter.addDays(previous.end, 1), month.start)).toBe(0);
    const week = thisWeekRange(adapter, 1);
    expect(week.start.getDay()).toBe(1);
    expect(adapter.differenceInDays(week.end, week.start)).toBe(6);
  });
});

describe('DateRangePickerComponent', () => {
  describe('text inputs', () => {
    it('shows two inputs with accessible names and writes typed ranges', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      const [start, end] = Array.from(inputs(el));
      expect(start.getAttribute('aria-label')).toBe('Start date');
      expect(end.getAttribute('aria-label')).toBe('End date');
      expect(el.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Date range');
      await typeText(fixture, start, '11/02/2026');
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 2), null));
      await typeText(fixture, end, '11/09/2026');
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 2), d(2026, 10, 9)));
      expect(fixture.componentInstance.control.errors).toBeNull();
    });

    it('shows values written by the form, including ISO strings and null', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.setValue(range(d(2026, 10, 2), d(2026, 10, 9)));
      await settle(fixture);
      expect([inputs(el)[0].value, inputs(el)[1].value]).toEqual(['11/02/2026', '11/09/2026']);
      fixture.componentInstance.control.setValue({ start: '2026-12-01', end: '2026-12-31' } as never);
      await settle(fixture);
      expect([inputs(el)[0].value, inputs(el)[1].value]).toEqual(['12/01/2026', '12/31/2026']);
      fixture.componentInstance.control.setValue(null);
      await settle(fixture);
      expect([inputs(el)[0].value, inputs(el)[1].value]).toEqual(['', '']);
    });

    it('reformats on blur and keeps unparsable text with an error', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await typeText(fixture, inputs(el)[0], '1/2/2026');
      await blur(fixture, inputs(el)[0]);
      expect(inputs(el)[0].value).toBe('01/02/2026');
      await typeText(fixture, inputs(el)[1], 'soon');
      expect(fixture.componentInstance.control.errors).toHaveProperty('chrInvalidDate');
      await blur(fixture, inputs(el)[1]);
      expect(inputs(el)[1].value).toBe('soon');
      expect(inputs(el)[1].getAttribute('aria-invalid')).toBe('true');
      expect(el.querySelector('[role="alert"]')!.textContent).toContain('valid date');
    });
  });

  describe('validation', () => {
    it('reports incomplete, reversed, bounded and length-limited ranges', async () => {
      const fixture = await createHost(Host);
      const { control } = fixture.componentInstance;
      control.setValue(range(d(2026, 10, 2), null));
      expect(control.errors).toHaveProperty('chrRangeIncomplete');
      control.setValue(range(d(2026, 10, 9), d(2026, 10, 2)));
      expect(control.errors).toHaveProperty('chrRangeOrder');

      fixture.componentInstance.min.set(d(2026, 10, 5));
      await settle(fixture);
      control.setValue(range(d(2026, 10, 2), d(2026, 10, 9)));
      expect(control.errors).toHaveProperty('chrMinDate');
      fixture.componentInstance.min.set(null);
      fixture.componentInstance.minLength.set(5);
      fixture.componentInstance.maxLength.set(7);
      await settle(fixture);
      control.setValue(range(d(2026, 10, 2), d(2026, 10, 4)));
      expect(control.errors).toEqual({ chrMinRangeLength: { min: 5, actual: 3 } });
      control.setValue(range(d(2026, 10, 2), d(2026, 10, 12)));
      expect(control.errors).toEqual({ chrMaxRangeLength: { max: 7, actual: 11 } });
      control.setValue(range(d(2026, 10, 2), d(2026, 10, 8)));
      expect(control.errors).toBeNull();
    });

    it('supports required and re-validates when limits change', async () => {
      const fixture = await createHost(Host);
      fixture.componentInstance.required.set(true);
      await settle(fixture);
      expect(fixture.componentInstance.control.errors).toHaveProperty('required');
      fixture.componentInstance.control.setValue(range(d(2026, 10, 2), d(2026, 10, 4)));
      expect(fixture.componentInstance.control.errors).toBeNull();
      fixture.componentInstance.minLength.set(10);
      await settle(fixture);
      expect(fixture.componentInstance.control.errors).toHaveProperty('chrMinRangeLength');
    });

    it('shows messages with the numbers filled in once touched', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.minLength.set(5);
      fixture.componentInstance.control.setValue(range(d(2026, 10, 2), d(2026, 10, 3)));
      await settle(fixture);
      await blur(fixture, inputs(el)[0]);
      expect(el.querySelector('[role="alert"]')!.textContent).toContain('at least 5 days');
    });
  });

  describe('popup and range selection', () => {
    it('picks a start and an end, highlighting in between, then closes', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await clickEl(fixture, toggle(el));
      expect(popup()!.getAttribute('role')).toBe('dialog');
      expect(popup()!.getAttribute('aria-label')).toBe('Date range');
      expect(document.activeElement).toBe(day('15'));

      await clickEl(fixture, day('10'));
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 10), null)); // incomplete while choosing
      expect(popup()).not.toBeNull();
      expect(overlay().querySelector('.chr-hint')!.textContent).toContain('Select the end date');
      expect(inputs(el)[0].value).toBe('11/10/2026');

      await clickEl(fixture, day('13'));
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 10), d(2026, 10, 13)));
      expect(inputs(el)[1].value).toBe('11/13/2026');
      expect(popup()).toBeNull();
    });

    it('previews the range while the pointer moves and shows the start/end styling', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.closeOnSelect.set(false);
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      await clickEl(fixture, day('10'));
      await hover(fixture, day('13'));
      expect(highlighted()).toEqual(['10', '11', '12', '13']);
      await hover(fixture, day('11'));
      expect(highlighted()).toEqual(['10', '11']);
      await hover(fixture, day('5')); // before the start: nothing to preview but the start
      expect(highlighted()).toEqual(['10']);
      await clickEl(fixture, day('13'));
      expect(highlighted()).toEqual(['10', '11', '12', '13']);
      expect(day('10').classList.contains('chr-range-start')).toBe(true);
      expect(day('13').classList.contains('chr-range-end')).toBe(true);
      expect(popup()).not.toBeNull(); // closeOnSelect=false
    });

    it('restarts when a day before the start is picked, and starts over after a complete range', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.closeOnSelect.set(false);
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      await clickEl(fixture, day('10'));
      await clickEl(fixture, day('5'));
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 5), null));
      await clickEl(fixture, day('8'));
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 5), d(2026, 10, 8)));
      await clickEl(fixture, day('20'));
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 20), null));
    });

    it('allows a one-day range by picking the start twice', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await clickEl(fixture, toggle(el));
      await clickEl(fixture, day('10'));
      await clickEl(fixture, day('10'));
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 10), d(2026, 10, 10)));
    });

    it('selects with the keyboard and previews on focus', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.closeOnSelect.set(false);
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      (document.activeElement as HTMLElement).click(); // Enter on 15
      await settle(fixture);
      await press(fixture, document.activeElement!, 'ArrowRight');
      await press(fixture, document.activeElement!, 'ArrowRight');
      expect(highlighted()).toEqual(['15', '16', '17']);
      (document.activeElement as HTMLElement).click();
      await settle(fixture);
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 15), d(2026, 10, 17)));
    });

    it('disables days outside min/max and via disabledDates', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.min.set(d(2026, 10, 5));
      fixture.componentInstance.max.set(d(2026, 10, 25));
      fixture.componentInstance.disabled.set((x) => x.getDate() === 12);
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      expect(day('4').getAttribute('aria-disabled')).toBe('true');
      expect(day('12').getAttribute('aria-disabled')).toBe('true');
      expect(day('26').getAttribute('aria-disabled')).toBe('true');
      await clickEl(fixture, day('12'));
      expect(fixture.componentInstance.control.value).toBeNull();
    });

    it('enforces minimum and maximum range length while choosing the end', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.minLength.set(3);
      fixture.componentInstance.maxLength.set(5);
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      await clickEl(fixture, day('10'));
      expect(day('10').getAttribute('aria-disabled')).toBe('true'); // 1 day < min 3
      expect(day('11').getAttribute('aria-disabled')).toBe('true'); // 2 days
      expect(day('12').getAttribute('aria-disabled')).toBeNull(); // 3 days
      expect(day('14').getAttribute('aria-disabled')).toBeNull(); // 5 days
      expect(day('15').getAttribute('aria-disabled')).toBe('true'); // 6 days > max 5
      expect(day('9').getAttribute('aria-disabled')).toBeNull(); // earlier days restart
      await clickEl(fixture, day('15'));
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 10), null));
      await clickEl(fixture, day('14'));
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 10), d(2026, 10, 14)));
      expect(fixture.componentInstance.control.errors).toBeNull();
    });

    it('closes on Escape (returning focus to the start input) and on outside click', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      document.body.appendChild(el);
      await clickEl(fixture, toggle(el));
      await press(fixture, document.activeElement!, 'Escape');
      expect(popup()).toBeNull();
      expect(document.activeElement).toBe(inputs(el)[0]);
      await press(fixture, inputs(el)[1], 'ArrowDown', { altKey: true });
      expect(popup()).not.toBeNull();
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await settle(fixture);
      expect(popup()).toBeNull();
      el.remove();
    });

    it('keeps the displayed month stable while the end date is chosen in another month', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.closeOnSelect.set(false);
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      await clickEl(fixture, day('20'));
      await clickEl(fixture, overlay().querySelectorAll('.chr-nav')[1]);
      expect(overlay().querySelector('.chr-title')!.textContent!.trim()).toBe('December 2026');
      await clickEl(fixture, day('5'));
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 20), d(2026, 11, 5)));
      expect(overlay().querySelector('.chr-title')!.textContent!.trim()).toBe('December 2026');
    });
  });

  describe('presets', () => {
    it('lists presets, applies them and marks the active one', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await clickEl(fixture, toggle(el));
      const buttons = Array.from(overlay().querySelectorAll<HTMLButtonElement>('.chr-preset'));
      expect(buttons.map((b) => b.textContent!.trim())).toEqual(['Early November', 'Lazy']);
      await clickEl(fixture, buttons[1]);
      expect(fixture.componentInstance.control.value).toEqual(range(d(2026, 10, 10), d(2026, 10, 12)));
      expect(popup()).toBeNull();
      await clickEl(fixture, toggle(el));
      const again = Array.from(overlay().querySelectorAll<HTMLButtonElement>('.chr-preset'));
      expect(again[1].getAttribute('aria-pressed')).toBe('true');
      expect(again[0].getAttribute('aria-pressed')).toBe('false');
    });

    it('disables presets that violate the constraints', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.min.set(d(2026, 10, 9));
      await settle(fixture);
      await clickEl(fixture, toggle(el));
      const buttons = Array.from(overlay().querySelectorAll<HTMLButtonElement>('.chr-preset'));
      expect(buttons[0].disabled).toBe(true);
      expect(buttons[1].disabled).toBe(false);
    });
  });

  describe('clear and forms', () => {
    it('clears both ends', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.setValue(range(d(2026, 10, 2), d(2026, 10, 9)));
      await settle(fixture);
      await clickEl(fixture, el.querySelector('.chr-clear'));
      expect(fixture.componentInstance.control.value).toEqual(range(null, null));
      expect([inputs(el)[0].value, inputs(el)[1].value]).toEqual(['', '']);
      expect(el.querySelector('.chr-clear')).toBeNull();
    });

    it('is disabled by the form and does not open', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.disable();
      await settle(fixture);
      expect(inputs(el)[0].disabled).toBe(true);
      expect(inputs(el)[1].disabled).toBe(true);
      expect(toggle(el).disabled).toBe(true);
    });

    it('marks the control touched when the popup closes after a complete selection', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await clickEl(fixture, toggle(el));
      await clickEl(fixture, day('3'));
      await clickEl(fixture, day('4'));
      expect(fixture.componentInstance.control.touched).toBe(true);
    });
  });
});
