import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import axe from 'axe-core';
import { CalendarComponent } from '../calendar/calendar/calendar.component';
import { DecadePickerComponent } from '../calendar/decade-picker/decade-picker.component';
import { MonthPickerComponent } from '../calendar/month-picker/month-picker.component';
import { YearPickerComponent } from '../calendar/year-picker/year-picker.component';
import { DateInputComponent } from '../inputs/date-input/date-input.component';
import { DatePickerComponent } from '../inputs/date-picker/date-picker.component';
import { DateTimePickerComponent } from '../inputs/datetime-picker/datetime-picker.component';
import { TimePickerComponent } from '../inputs/time-picker/time-picker.component';
import { DateRangePickerComponent } from '../ranges/date-range-picker/date-range-picker.component';
import { blur, clickEl, createHost, overlay, press, settle, typeText } from './test-helpers';

/** Runs axe on `root`. jsdom has no layout engine, so colour-contrast and region rules are skipped. */
async function violations(root: Element): Promise<string[]> {
  const results = await axe.run(root, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.help} -> ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

@Component({
  imports: [
    ReactiveFormsModule,
    CalendarComponent,
    MonthPickerComponent,
    YearPickerComponent,
    DecadePickerComponent,
    DateInputComponent,
    DatePickerComponent,
    TimePickerComponent,
    DateTimePickerComponent,
    DateRangePickerComponent,
  ],
  template: `
    <label id="l-date" for="date-input">Birthday</label>
    <chr-date-input inputId="date-input" [formControl]="date" [required]="true" />
    <chr-date-picker ariaLabel="Due date" [formControl]="date" />
    <chr-time-picker ariaLabel="Start time" [formControl]="date" />
    <chr-datetime-picker ariaLabelledby="l-date" [formControl]="date" />
    <chr-date-range-picker ariaLabel="Stay" [formControl]="stay" />
    <chr-calendar [initialDate]="initial" />
    <chr-month-picker ariaLabel="Month" />
    <chr-year-picker ariaLabel="Year" />
    <chr-decade-picker ariaLabel="Decade" />`,
})
class Host {
  date = new FormControl<Date | null>(null);
  stay = new FormControl<{ start: Date | null; end: Date | null } | null>(null);
  initial = new Date(2026, 10, 15);
}

describe('accessibility (axe-core)', () => {
  it('has no violations in the resting state of every component', async () => {
    const fixture = await createHost(Host);
    expect(await violations(fixture.nativeElement)).toEqual([]);
  });

  it('has no violations with validation errors shown', async () => {
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#date-input')!;
    await typeText(fixture, input, 'nope');
    await blur(fixture, input);
    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(await violations(el)).toEqual([]);
  });

  it('has no violations while the date picker popup is open', async () => {
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    await clickEl(fixture, el.querySelectorAll('.chr-toggle')[0]);
    expect(overlay().querySelector('[role="dialog"]')).not.toBeNull();
    expect(await violations(overlay())).toEqual([]);
    expect(await violations(el)).toEqual([]);
  });

  it('has no violations while the time picker popup is open', async () => {
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    await clickEl(fixture, el.querySelector('chr-time-picker .chr-toggle'));
    expect(overlay().querySelector('[role="listbox"]')).not.toBeNull();
    expect(await violations(overlay())).toEqual([]);
  });

  it('has no violations while the date-time and range popups are open', async () => {
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    await clickEl(fixture, el.querySelector('chr-datetime-picker .chr-toggle'));
    expect(await violations(overlay())).toEqual([]);
    await press(fixture, document.activeElement!, 'Escape');
    await clickEl(fixture, el.querySelector('chr-date-range-picker .chr-toggle'));
    expect(overlay().querySelector('[role="dialog"]')).not.toBeNull();
    expect(await violations(overlay())).toEqual([]);
  });

  it('has no violations in the month, year and decade views of the calendar', async () => {
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    const calendar = el.querySelector('chr-calendar')!;
    for (let i = 0; i < 3; i++) {
      await clickEl(fixture, calendar.querySelector('.chr-title'));
      expect(await violations(calendar)).toEqual([]);
    }
  });
});

describe('keyboard and focus management', () => {
  it('lets the whole date picker be operated without a pointer', async () => {
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    const input = el.querySelector<HTMLInputElement>('chr-date-picker input')!;
    input.focus();
    await press(fixture, input, 'ArrowDown', { altKey: true }); // open
    expect(document.activeElement!.classList.contains('chr-cell')).toBe(true); // focus moved into the calendar
    await press(fixture, document.activeElement!, 'ArrowRight');
    (document.activeElement as HTMLElement).click(); // Enter / Space activate the focused day
    await settle(fixture);
    expect(overlay().querySelector('.chr-popup')).toBeNull(); // selection closes the popup
    expect(document.activeElement).toBe(input); // and returns focus to the field
    expect(fixture.componentInstance.date.value).not.toBeNull();
    el.remove();
  });

  it('exposes exactly one tab stop in the calendar grid and one per time list', async () => {
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    const grid = el.querySelector('chr-calendar table')!;
    expect(grid.querySelectorAll('button.chr-cell[tabindex="0"]').length).toBe(1);
    expect(grid.querySelectorAll('button.chr-cell[tabindex="-1"]').length).toBe(34);
    await clickEl(fixture, el.querySelector('chr-time-picker .chr-toggle'));
    overlay()
      .querySelectorAll('[role="listbox"]')
      .forEach((list) => {
        expect(list.querySelectorAll('[role="option"][tabindex="0"]').length).toBe(1);
      });
  });

  it('wraps the popup in a focus trap while it is open', async () => {
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    await clickEl(fixture, el.querySelector('chr-date-picker .chr-toggle'));
    expect(overlay().querySelectorAll('.cdk-focus-trap-anchor').length).toBe(2); // start and end sentinels
  });

  it('announces the label of the grid, the weekdays and the live title for assistive technology', async () => {
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    const calendar = el.querySelector('chr-calendar')!;
    expect(calendar.querySelector('table')!.getAttribute('aria-label')).toBe('November 2026');
    expect(calendar.querySelector('thead th')!.getAttribute('aria-label')).toBe('Sunday');
    expect(calendar.querySelector('.chr-title')!.getAttribute('aria-live')).toBe('polite');
  });
});
