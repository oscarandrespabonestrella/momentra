import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  ChronoraValidators,
  DateRangePickerComponent,
  NativeDateAdapter,
  createPreset,
  lastDaysRange,
  thisMonthRange,
  type DateRange,
  type DateRangePreset,
} from '@chronora/angular';

const adapter = new NativeDateAdapter();

@Component({
  selector: 'app-date-range-with-presets',
  imports: [ReactiveFormsModule, DateRangePickerComponent],
  template: `
    <chr-date-range-picker
      ariaLabel="Stay"
      [formControl]="stay"
      [presets]="presets"
      [minRangeLength]="2"
      [maxRangeLength]="30"
      [min]="today"
    />
  `,
})
export class DateRangeWithPresetsExample {
  readonly today = new Date();

  readonly presets: DateRangePreset<Date>[] = [
    createPreset('Last 7 days', () => lastDaysRange(adapter, 7)),
    createPreset('Last 30 days', () => lastDaysRange(adapter, 30)),
    createPreset('This month', () => thisMonthRange(adapter)),
  ];

  readonly stay = new FormControl<DateRange<Date> | null>(null, ChronoraValidators.dateRange({ required: true }));
}
