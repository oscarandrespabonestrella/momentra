import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CalendarComponent,
  ChronoraValidators,
  DateAdapter,
  DateInputComponent,
  DatePickerComponent,
  DateRangePickerComponent,
  DateTimePickerComponent,
  DecadePickerComponent,
  MonthPickerComponent,
  NativeDateAdapter,
  TimePickerComponent,
  YearPickerComponent,
  lastDaysRange,
  createPreset,
  type DateRange,
} from '@chronora/angular';
import { DateFnsDateAdapter } from '@chronora/angular/date-fns';
import { LuxonDateAdapter } from '@chronora/angular/luxon';

const adapter: DateAdapter<Date> = new NativeDateAdapter();
// The optional adapters must be importable from their own entry points.
export const optionalAdapters = [new DateFnsDateAdapter(), new LuxonDateAdapter({ zone: 'UTC' })];

@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CalendarComponent,
    DateInputComponent,
    DatePickerComponent,
    TimePickerComponent,
    DateTimePickerComponent,
    DateRangePickerComponent,
    MonthPickerComponent,
    YearPickerComponent,
    DecadePickerComponent,
  ],
  template: `
    <chr-date-picker [(ngModel)]="selectedDate" placeholder="Choose a date" ariaLabel="Date" />
    <form [formGroup]="form">
      <chr-date-input formControlName="date" ariaLabel="Typed date" />
      <chr-time-picker formControlName="time" ariaLabel="Time" />
      <chr-datetime-picker formControlName="appointment" ariaLabel="Appointment" />
      <chr-date-range-picker formControlName="range" ariaLabel="Range" [presets]="presets" />
    </form>
    <chr-calendar [(value)]="calendarValue" />
    <chr-month-picker ariaLabel="Month" />
    <chr-year-picker ariaLabel="Year" />
    <chr-decade-picker ariaLabel="Decade" />
    <p>{{ title() }}</p>
  `,
})
export class App {
  protected readonly title = signal('Chronora consumer check');
  selectedDate: Date | null = null;
  calendarValue: Date | null = null;
  readonly presets = [createPreset('Last 7 days', () => lastDaysRange(adapter, 7))];
  readonly form = new FormGroup({
    date: new FormControl<Date | null>(null, [Validators.required, ChronoraValidators.minDate(new Date(2000, 0, 1))]),
    time: new FormControl<Date | null>(null),
    appointment: new FormControl<Date | null>(null),
    range: new FormControl<DateRange<Date> | null>(null, ChronoraValidators.dateRange({ required: true })),
  });
}
