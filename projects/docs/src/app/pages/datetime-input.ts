import { Component, signal } from '@angular/core';
import { DateTimeInputComponent } from '@momentra/angular';
import { Api, COMMON } from '../api';
import { Demo } from '../demo';

@Component({
  imports: [DateTimeInputComponent, Demo, Api],
  template: `
    <h1>DateTimeInput</h1>
    <p>A text input for a local date-time, without a popup. <code>↑ ↓</code> step minutes (<code>Shift</code> days, <code>Ctrl</code> hours).</p>

    <h2>Basic</h2>
    <doc-demo [code]="basic">
      <mtr-datetime-input ariaLabel="Start" [(value)]="value" />
      <span output>Value: {{ value()?.toLocaleString() ?? 'null' }}</span>
    </doc-demo>

    <h2>Spinners and custom format</h2>
    <doc-demo [code]="spin">
      <mtr-datetime-input ariaLabel="24h" spinners format="yyyy-MM-dd HH:mm" [minuteStep]="15" [(value)]="value" />
    </doc-demo>

    <h2>API</h2>
    <doc-api [rows]="api" />
  `,
})
export class DateTimeInputPage {
  readonly value = signal<Date | null>(new Date());
  readonly basic = `<mtr-datetime-input [(value)]="value" />`;
  readonly spin = `<mtr-datetime-input spinners format="yyyy-MM-dd HH:mm" [minuteStep]="15" [(value)]="value" />`;
  readonly api = [
    ['value (model)', 'TDate | null', 'Local date-time.'],
    ['format', 'string', 'Full pattern; overrides the two below.'],
    ['dateFormat / timeFormat', 'string', 'Parts of the pattern.'],
    ['hourFormat / showSeconds', '12|24 / boolean', 'Clock options for the time part.'],
    ['minuteStep / hourStep', 'number', 'Arrow-key and spinner step.'],
    ['spinners', 'boolean', 'Up / down buttons. They step the part under the caret: day, month, year, hour or minute. Width: --mtr-spinner-width.'],
    ['min / max / disabledDates', '…', 'As in DateTimePicker.'],
    ['placeholder / showClear', '…', 'As in DateInput.'],
    ...COMMON,
  ];
}
