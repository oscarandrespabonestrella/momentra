import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimePickerComponent } from '@chronora/angular';
import { Api, COMMON } from '../api';
import { Demo } from '../demo';

@Component({
  imports: [FormsModule, TimePickerComponent, Demo, Api],
  template: `
    <h1>TimePicker</h1>
    <p>Text input with hour / minute / second listboxes. Arrow keys inside the lists change and select.</p>

    <h2>Basic</h2>
    <doc-demo [code]="basic">
      <chr-time-picker ariaLabel="Time" [(value)]="value" />
      <span output>Value: {{ value()?.toLocaleTimeString() ?? 'null' }}</span>
    </doc-demo>

    <h2>Options</h2>
    <doc-demo [code]="options">
      <chr-time-picker ariaLabel="Configurable" [hourFormat]="hourFormat" [showSeconds]="seconds" [minuteStep]="minuteStep" />
      <div options>
        <label class="opt">hourFormat
          <select [(ngModel)]="hourFormat"><option [ngValue]="12">12</option><option [ngValue]="24">24</option></select></label>
        <label class="opt"><input type="checkbox" [(ngModel)]="seconds" /> showSeconds</label>
        <label class="opt">minuteStep
          <select [(ngModel)]="minuteStep"><option [ngValue]="1">1</option><option [ngValue]="5">5</option><option [ngValue]="15">15</option><option [ngValue]="30">30</option></select></label>
      </div>
    </doc-demo>

    <h2>Explicit format and limits (09:00–17:00)</h2>
    <doc-demo [code]="limits">
      <chr-time-picker ariaLabel="Office hours" format="HH:mm" [min]="from" [max]="to" [minuteStep]="15" />
    </doc-demo>

    <h2>API</h2>
    <doc-api [rows]="api" />
  `,
})
export class TimePickerPage {
  readonly value = signal<Date | null>(null);
  hourFormat: 12 | 24 = 12; seconds = false; minuteStep = 5;
  readonly from = new Date(2000, 0, 1, 9);
  readonly to = new Date(2000, 0, 1, 17);
  readonly basic = `<chr-time-picker ariaLabel="Time" [(value)]="value" />`;
  readonly options = `<chr-time-picker [hourFormat]="24" [showSeconds]="true" [minuteStep]="5" />`;
  readonly limits = `<chr-time-picker format="HH:mm" [min]="from" [max]="to" [minuteStep]="15" />`;
  readonly api = [
    ['value (model)', 'TDate | null', 'Time of day lives in the Date.'],
    ['format', 'string', 'e.g. HH:mm, h:mm a; wins over hourFormat/showSeconds.'],
    ['hourFormat', '12 | 24', 'Default: locale clock.'],
    ['showSeconds', 'boolean', 'Default: what the pattern shows.'],
    ['hourStep / minuteStep / secondStep', 'number', 'List intervals (default 1).'],
    ['min / max', 'TDate', 'Time-of-day limits.'],
    ['baseDate', 'TDate', 'Date part for new values (default today).'],
    ['open (model) / opened / closed', '…', 'Popup state and events.'],
    ['placeholder / showClear', '…', 'As in DateInput.'],
    ['openPopup() / closePopup()', 'methods', 'Programmatic control.'],
    ...COMMON,
  ];
}
