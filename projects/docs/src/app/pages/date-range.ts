import { Component, signal } from '@angular/core';
import {
  DateRangePickerComponent, NativeDateAdapter, createPreset, lastDaysRange, thisMonthRange, lastMonthRange,
  type DateRange, type DateRangePreset,
} from '@momentra/angular';
import { Api, COMMON } from '../api';
import { Demo } from '../demo';

const adapter = new NativeDateAdapter();

@Component({
  imports: [DateRangePickerComponent, Demo, Api],
  template: `
    <h1>DateRange</h1>
    <p>Two inputs and one calendar. First click sets the start, second completes the range; hovering previews it.</p>

    <h2>Basic</h2>
    <doc-demo [code]="basic">
      <mtr-date-range-picker ariaLabel="Range" [(value)]="range" />
      <span output>{{ range().start?.toDateString() ?? '—' }} → {{ range().end?.toDateString() ?? '—' }}</span>
    </doc-demo>

    <h2>Presets and length limits (2–30 days)</h2>
    <doc-demo [code]="presetsCode">
      <mtr-date-range-picker ariaLabel="Stay" [presets]="presets" [minRangeLength]="2" [maxRangeLength]="30" />
    </doc-demo>

    <h2>Bounds</h2>
    <doc-demo [code]="bounds">
      <mtr-date-range-picker ariaLabel="Future only" [min]="today" [closeOnSelect]="false" />
    </doc-demo>

    <h2>API</h2>
    <doc-api [rows]="api" />
  `,
})
export class DateRangePage {
  readonly range = signal<DateRange<Date>>({ start: null, end: null });
  readonly today = new Date();
  readonly presets: DateRangePreset<Date>[] = [
    createPreset('Last 7 days', () => lastDaysRange(adapter, 7)),
    createPreset('Last 30 days', () => lastDaysRange(adapter, 30)),
    createPreset('This month', () => thisMonthRange(adapter)),
    createPreset('Last month', () => lastMonthRange(adapter)),
  ];
  readonly basic = `<mtr-date-range-picker [(value)]="range" />`;
  readonly presetsCode = `presets = [createPreset('Last 7 days', () => lastDaysRange(adapter, 7))];
<mtr-date-range-picker [presets]="presets" [minRangeLength]="2" [maxRangeLength]="30" />`;
  readonly bounds = `<mtr-date-range-picker [min]="today" [closeOnSelect]="false" />`;
  readonly api = [
    ['value (model)', 'DateRange<TDate>', '{ start, end }; may be incomplete (mtrRangeIncomplete).'],
    ['min / max', 'TDate', 'Bounds for both ends.'],
    ['minRangeLength / maxRangeLength', 'number', 'Days spanned, inclusive.'],
    ['disabledDates', '(d) => boolean | TDate[]', 'Days that cannot be in a range.'],
    ['presets', 'DateRangePreset<TDate>[]', '{ label, range }; range may be a function.'],
    ['format / placeholder', 'string', 'For both inputs.'],
    ['cellTemplate / showToday / showClear / closeOnSelect / initialDate', '…', 'As elsewhere.'],
    ['open (model) / opened / closed', '…', 'Popup state.'],
    ['openPopup() / closePopup() / focusStart()', 'methods', 'Programmatic control.'],
    ...COMMON,
  ];
}
