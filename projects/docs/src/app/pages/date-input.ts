import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateInputComponent } from '@momentra/angular';
import { Api, COMMON } from '../api';
import { Demo } from '../demo';

@Component({
  imports: [FormsModule, DateInputComponent, Demo, Api],
  template: `
    <h1>DateInput</h1>
    <p>A text input that parses and formats a date. Type, or use <code>↑ ↓</code> to step the part under the caret: day, month or year (<code>Shift</code> month, <code>Ctrl</code> year when no part is selected).</p>

    <h2>Basic</h2>
    <doc-demo [code]="basic">
      <mtr-date-input ariaLabel="Date" [(value)]="value" />
      <span output>Value: {{ value() ?? 'null' }}</span>
    </doc-demo>

    <h2>Formats</h2>
    <doc-demo [code]="formats">
      @for (f of fmts; track f) { <mtr-date-input [ariaLabel]="f" [format]="f" [(value)]="value" /> }
    </doc-demo>

    <h2>States</h2>
    <doc-demo [code]="states">
      <mtr-date-input ariaLabel="Demo" [disabled]="disabledM" [readonly]="readonlyM" [showClear]="clearM" [required]="requiredM" [(value)]="value" />
      <div options>
        <label class="opt"><input type="checkbox" [(ngModel)]="disabledM" /> disabled</label>
        <label class="opt"><input type="checkbox" [(ngModel)]="readonlyM" /> readonly</label>
        <label class="opt"><input type="checkbox" [(ngModel)]="clearM" /> showClear</label>
        <label class="opt"><input type="checkbox" [(ngModel)]="requiredM" /> required</label>
      </div>
    </doc-demo>

    <h2>Spinners</h2>
    <doc-demo [code]="spin">
      <mtr-date-input ariaLabel="With spinners" spinners [(value)]="value" />
    </doc-demo>

    <h2>Min / max</h2>
    <doc-demo [code]="minmax">
      <mtr-date-input ariaLabel="Within ±15 days" [min]="min" [max]="max" [(value)]="value" />
      <span output>Allowed: {{ min.toDateString() }} – {{ max.toDateString() }}</span>
    </doc-demo>

    <h2>API</h2>
    <doc-api [rows]="api" />
  `,
})
export class DateInputPage {
  readonly value = signal<Date | null>(new Date());
  readonly fmts = ['MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd', 'd MMM yyyy'];
  disabledM = false; readonlyM = false; clearM = true; requiredM = false;
  readonly min = new Date(Date.now() - 15 * 864e5);
  readonly max = new Date(Date.now() + 15 * 864e5);

  readonly basic = `<mtr-date-input ariaLabel="Date" [(value)]="value" />`;
  readonly formats = `<mtr-date-input format="dd/MM/yyyy" [(value)]="value" />`;
  readonly states = `<mtr-date-input [disabled]="..." [readonly]="..." [showClear]="..." [required]="..." />`;
  readonly spin = `<mtr-date-input spinners [(value)]="value" />`;
  readonly minmax = `<mtr-date-input [min]="min" [max]="max" [(value)]="value" />`;
  readonly api = [
    ['value (model)', 'TDate | null', 'The date.'],
    ['format', 'string', 'Pattern; default the locale format.'],
    ['min / max', 'TDate', 'Whole-day bounds.'],
    ['disabledDates', '(d) => boolean | TDate[]', 'Dates that cannot be entered.'],
    ['placeholder', 'string', 'Default: global placeholder, else the pattern.'],
    ['spinners', 'boolean', 'Up / down buttons. They step the part under the caret (day, month, year); click a part of the date first. Width: --mtr-spinner-width.'],
    ['showClear', 'boolean', 'Clear button; default true.'],
    ...COMMON,
  ];
}
