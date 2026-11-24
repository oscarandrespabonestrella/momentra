import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CalendarComponent,
  MomentraValidators,
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
} from '@momentra/angular';
import { DateFnsDateAdapter } from '@momentra/angular/date-fns';
import { LuxonDateAdapter } from '@momentra/angular/luxon';

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
    <mtr-date-picker [(ngModel)]="selectedDate" placeholder="Choose a date" ariaLabel="Date" />
    <form [formGroup]="form">
      <mtr-date-input formControlName="date" ariaLabel="Typed date" />
      <mtr-time-picker formControlName="time" ariaLabel="Time" />
      <mtr-datetime-picker formControlName="appointment" ariaLabel="Appointment" />
      <mtr-date-range-picker formControlName="range" ariaLabel="Range" [presets]="presets" />
    </form>
    <mtr-calendar [(value)]="calendarValue" />
    <mtr-month-picker ariaLabel="Month" />
    <mtr-year-picker ariaLabel="Year" />
    <mtr-decade-picker ariaLabel="Decade" />
    <p>{{ title() }}</p>
  `,
})
export class App {
  protected readonly title = signal('Momentra consumer check');
  selectedDate: Date | null = null;
  calendarValue: Date | null = null;
  readonly presets = [createPreset('Last 7 days', () => lastDaysRange(adapter, 7))];
  readonly form = new FormGroup({
    date: new FormControl<Date | null>(null, [Validators.required, MomentraValidators.minDate(new Date(2000, 0, 1))]),
    time: new FormControl<Date | null>(null),
    appointment: new FormControl<Date | null>(null),
    range: new FormControl<DateRange<Date> | null>(null, MomentraValidators.dateRange({ required: true })),
  });
}
