import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from '@momentra/angular';
import { Api, COMMON } from '../api';
import { Demo } from '../demo';

@Component({
  imports: [FormsModule, DatePickerComponent, Demo, Api],
  template: `
    <h1>DatePicker</h1>
    <p>Date input plus calendar popup. <code>Alt+↓</code> opens, <code>Escape</code> closes.</p>

    <h2>Basic</h2>
    <doc-demo [code]="basic">
      <mtr-date-picker ariaLabel="Date" [(value)]="value" />
      <span output>Value: {{ value() ?? 'null' }}</span>
    </doc-demo>

    <h2>Options</h2>
    <doc-demo [code]="options">
      <mtr-date-picker ariaLabel="Configurable" [(value)]="value" [showToday]="today" [closeOnSelect]="close" [disabled]="disabled" [readonly]="readonly" [showClear]="clear" />
      <div options>
        <label class="opt"><input type="checkbox" [(ngModel)]="today" /> showToday</label>
        <label class="opt"><input type="checkbox" [(ngModel)]="close" /> closeOnSelect</label>
        <label class="opt"><input type="checkbox" [(ngModel)]="clear" /> showClear</label>
        <label class="opt"><input type="checkbox" [(ngModel)]="disabled" /> disabled</label>
        <label class="opt"><input type="checkbox" [(ngModel)]="readonly" /> readonly</label>
      </div>
    </doc-demo>

    <h2>Disabled dates (weekends) and bounds</h2>
    <doc-demo [code]="disabledCode">
      <mtr-date-picker ariaLabel="Weekdays this month" [min]="monthStart" [max]="monthEnd" [disabledDates]="weekends" />
    </doc-demo>

    <h2>Custom cell template</h2>
    <doc-demo [code]="cellCode">
      <mtr-date-picker ariaLabel="With markers" [cellTemplate]="cell" />
      <ng-template #cell let-ctx>
        <span [title]="ctx.$implicit.ariaLabel">{{ ctx.$implicit.label }}{{ ctx.$implicit.date.getDate() === 15 ? '★' : '' }}</span>
      </ng-template>
    </doc-demo>

    <h2>Open state and events</h2>
    <doc-demo [code]="eventsCode">
      <mtr-date-picker ariaLabel="Events" [(open)]="open" (opened)="log('opened')" (closed)="log('closed')" />
      <div output>open = {{ open() }} · last event: {{ last() }}</div>
    </doc-demo>

    <h2>API</h2>
    <doc-api [rows]="api" />
  `,
})
export class DatePickerPage {
  readonly value = signal<Date | null>(null);
  readonly open = signal(false);
  readonly last = signal('—');
  today = true; close = true; clear = true; disabled = false; readonly = false;
  readonly monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  readonly monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  readonly weekends = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
  log(e: string): void { this.last.set(e); }

  readonly basic = `<mtr-date-picker ariaLabel="Date" [(value)]="value" />`;
  readonly options = `<mtr-date-picker [showToday]="..." [closeOnSelect]="..." [showClear]="..." [disabled]="..." [readonly]="..." />`;
  readonly disabledCode = `<mtr-date-picker [min]="start" [max]="end" [disabledDates]="d => d.getDay() % 6 === 0" />`;
  readonly cellCode = `<mtr-date-picker [cellTemplate]="cell" />
<ng-template #cell let-ctx>{{ ctx.$implicit.label }}</ng-template>`;
  readonly eventsCode = `<mtr-date-picker [(open)]="open" (opened)="..." (closed)="..." />`;
  readonly api = [
    ['value (model)', 'TDate | null', 'Selected date.'],
    ['open (model)', 'boolean', 'Popup state.'],
    ['format / placeholder', 'string', 'As in DateInput.'],
    ['min / max', 'TDate', 'Bounds.'],
    ['disabledDates', '(d) => boolean | TDate[]', 'Unselectable days.'],
    ['showToday / closeOnSelect / showClear', 'boolean', 'Behaviour toggles (default true).'],
    ['initialDate', 'TDate', 'Month shown when empty.'],
    ['cellTemplate', 'TemplateRef<MtrCellContext>', 'Custom day content.'],
    ['opened / closed', 'output', 'Popup events.'],
    ['openPopup() / closePopup(restoreFocus?) / focusInput()', 'methods', 'Programmatic control.'],
    ...COMMON,
  ];
}
