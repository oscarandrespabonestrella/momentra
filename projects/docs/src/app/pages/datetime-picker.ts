import { Component, signal } from '@angular/core';
import { DateTimePickerComponent } from '@momentra/angular';
import { Api, COMMON } from '../api';
import { Demo } from '../demo';

@Component({
  imports: [DateTimePickerComponent, Demo, Api],
  template: `
    <h1>DateTimePicker</h1>
    <p>Calendar and time lists in one popup. It stays open until <em>Done</em>, <code>Escape</code> or an outside click.</p>

    <h2>Basic</h2>
    <doc-demo [code]="basic">
      <mtr-datetime-picker ariaLabel="Appointment" [(value)]="value" />
      <span output>Value: {{ value()?.toLocaleString() ?? 'null' }}</span>
    </doc-demo>

    <h2>Custom format and steps</h2>
    <doc-demo [code]="fmt">
      <mtr-datetime-picker ariaLabel="24h" format="yyyy-MM-dd HH:mm" [hourFormat]="24" [minuteStep]="30" />
    </doc-demo>

    <h2>Tabbed layout</h2>
    <p><code>layout="tabs"</code> shows a Date tab (infinite calendar) and a Time tab. Picking a date moves to Time; <em>Set</em> stays disabled until a time is chosen and <em>Cancel</em> restores the previous value. Tab color: <code>--mtr-tab-active-color</code>.</p>
    <doc-demo [code]="tabs">
      <mtr-datetime-picker ariaLabel="Tabbed" layout="tabs" />
    </doc-demo>

    <h2>Min / max (next 7 days)</h2>
    <doc-demo [code]="bounds">
      <mtr-datetime-picker ariaLabel="Bounded" [min]="now" [max]="week" />
    </doc-demo>

    <h2>API</h2>
    <doc-api [rows]="api" />
  `,
})
export class DateTimePickerPage {
  readonly value = signal<Date | null>(null);
  readonly now = new Date();
  readonly week = new Date(Date.now() + 7 * 864e5);
  readonly basic = `<mtr-datetime-picker ariaLabel="Appointment" [(value)]="value" />`;
  readonly fmt = `<mtr-datetime-picker format="yyyy-MM-dd HH:mm" [hourFormat]="24" [minuteStep]="30" />`;
  readonly tabs = `<mtr-datetime-picker layout="tabs" />`;
  readonly bounds = `<mtr-datetime-picker [min]="now" [max]="week" />`;
  readonly api = [
    ['value (model)', 'TDate | null', 'Local date-time.'],
    ['layout', "'split'|'tabs'", 'Side by side (default) or Date / Time tabs.'],
    ['format', 'string', 'Full pattern; overrides the two below.'],
    ['dateFormat / timeFormat', 'string', 'Parts of the pattern.'],
    ['hourFormat / showSeconds', '…', 'As in TimePicker.'],
    ['hourStep / minuteStep / secondStep', 'number', 'As in TimePicker.'],
    ['min / max', 'TDate', 'Exact date-times.'],
    ['disabledDates / cellTemplate / showToday / initialDate', '…', 'As in DatePicker.'],
    ['open (model) / opened / closed', '…', 'Popup state; closeOnSelect does not apply.'],
    ...COMMON,
  ];
}
