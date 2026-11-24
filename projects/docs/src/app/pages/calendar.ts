import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarComponent, InfiniteCalendarComponent, MultiviewCalendarComponent, TimePickerComponent, MonthPickerComponent, YearPickerComponent, DecadePickerComponent } from '@chronora/angular';
import { Api, COMMON } from '../api';
import { Demo } from '../demo';

@Component({
  imports: [FormsModule, CalendarComponent, InfiniteCalendarComponent, MultiviewCalendarComponent, MonthPickerComponent, YearPickerComponent, DecadePickerComponent, TimePickerComponent, Demo, Api],
  template: `
    <h1>Calendar</h1>
    <p>Inline calendar with day, month, year and decade views. <code>Ctrl+↑</code> zooms out; arrows, <code>PageUp/Down</code>, <code>Home/End</code> navigate.</p>

    <h2>Basic</h2>
    <doc-demo [code]="basic">
      <chr-calendar ariaLabel="Calendar" [(value)]="value" [(view)]="view" />
      <span output>Value: {{ value()?.toDateString() ?? 'null' }} · view: {{ view() }}</span>
    </doc-demo>

    <h2>Options</h2>
    <doc-demo [code]="options">
      <chr-calendar ariaLabel="Configurable" [showToday]="today" [fixedWeeks]="fixed" [firstDayOfWeek]="fdow" />
      <div options>
        <label class="opt"><input type="checkbox" [(ngModel)]="today" /> showToday</label>
        <label class="opt"><input type="checkbox" [(ngModel)]="fixed" /> fixedWeeks</label>
        <label class="opt">firstDayOfWeek
          <select [(ngModel)]="fdow"><option [ngValue]="0">Sun</option><option [ngValue]="1">Mon</option><option [ngValue]="6">Sat</option></select></label>
      </div>
    </doc-demo>

    <h2>Month / Year / Decade pickers</h2>
    <doc-demo [code]="pickers">
      <chr-month-picker ariaLabel="Month" />
      <chr-year-picker ariaLabel="Year" />
      <chr-decade-picker ariaLabel="Decade" />
    </doc-demo>

    <h2>Highlighted range</h2>
    <doc-demo [code]="rangeCode">
      <chr-calendar ariaLabel="Range highlight" [range]="{ start: a, end: b }" />
    </doc-demo>

    <h2>Infinite calendar</h2>
    <p>Months scroll continuously and the header follows the month in view. The month rail on the left marks the month in view (a new year replaces January); click a month to scroll there. Size it with <code>--chr-infinite-height</code> / <code>--chr-infinite-width</code>.</p>
    <doc-demo [code]="infCode">
      <chr-infinite-calendar ariaLabel="Infinite" [(value)]="inf" />
      <span output>Value: {{ inf()?.toDateString() ?? 'null' }}</span>
    </doc-demo>

    <h3>Without the month rail</h3>
    <doc-demo [code]="infPlainCode">
      <chr-infinite-calendar ariaLabel="Infinite, no rail" [monthRail]="false" [(value)]="inf" />
    </doc-demo>

    <h2>Multi-view calendar</h2>
    <p>Several months under one header. The value is always an array: one date in <code>single</code>, any number in <code>multiple</code>, <code>[start, end]</code> in <code>range</code>. Under 600px the months stack. Spacing: <code>--chr-multiview-gap</code>.</p>
    <doc-demo [code]="multiCode">
      <chr-multiview-calendar ariaLabel="Multi-view" [views]="views" [mode]="mode" [(value)]="multi" />
      <div options>
        <label class="opt">mode
          <select [(ngModel)]="mode"><option value="single">single</option><option value="multiple">multiple</option><option value="range">range</option></select></label>
        <label class="opt">views
          <select [(ngModel)]="views"><option [ngValue]="1">1</option><option [ngValue]="2">2</option><option [ngValue]="3">3</option></select></label>
      </div>
      <span output>{{ multi().length }} selected</span>
    </doc-demo>

    <h2>Inline date-time (simulated)</h2>
    <doc-demo [code]="inlineCode">
      <chr-calendar ariaLabel="Day" [value]="dt()" (dateSelect)="setDay($event)" />
      <chr-time-picker ariaLabel="Time" [value]="dt()" (valueChange)="setTime($event)" />
      <span output>{{ dt()?.toLocaleString() ?? 'null' }}</span>
    </doc-demo>

    <h2>API: Calendar</h2>
    <doc-api [rows]="api" />
    <h2>API: InfiniteCalendar</h2>
    <doc-api [rows]="infApi" />
    <h2>API: MultiviewCalendar</h2>
    <doc-api [rows]="multiApi" />
  `,
})
export class CalendarPage {
  readonly value = signal<Date | null>(null);
  readonly view = signal<'day' | 'month' | 'year' | 'decade'>('day');
  readonly dt = signal<Date | null>(null);
  readonly inf = signal<Date | null>(null);
  readonly multi = signal<Date[]>([]);
  mode: 'single' | 'multiple' | 'range' = 'range';
  views = 2;
  setDay(d: Date): void {
    const c = this.dt() ?? new Date();
    this.dt.set(new Date(d.getFullYear(), d.getMonth(), d.getDate(), c.getHours(), c.getMinutes()));
  }
  setTime(t: Date | null): void {
    if (!t) return;
    const c = this.dt() ?? new Date();
    this.dt.set(new Date(c.getFullYear(), c.getMonth(), c.getDate(), t.getHours(), t.getMinutes()));
  }
  readonly infCode = `<chr-infinite-calendar [(value)]="date" />`;
  readonly infPlainCode = `<chr-infinite-calendar [monthRail]="false" [(value)]="date" />`;
  readonly multiCode = `<chr-multiview-calendar [views]="2" mode="range" [(value)]="dates" />`;
  readonly infApi = [
    ['value (model)', 'TDate | null', 'Selected day.'],
    ['min / max / disabledDates', '…', 'As in Calendar.'],
    ['initialDate', 'TDate', 'Month shown first when no value.'],
    ['monthRail', 'boolean', 'Column of months beside the calendar; default true.'],
    ['cellTemplate / showToday', '…', 'As in Calendar.'],
    ['dateSelect', 'output', 'Emits the picked day.'],
    ['--chr-infinite-height / --chr-infinite-width', 'CSS', 'Size of the scroll area.'],
    ...COMMON,
  ];
  readonly multiApi = [
    ['value (model)', 'TDate[]', 'Selection; [start, end] in range mode.'],
    ['views', 'number', 'Months shown; default 2.'],
    ['mode', "'single'|'multiple'|'range'", 'Selection mode; default single.'],
    ['min / max / disabledDates / initialDate / cellTemplate', '…', 'As in Calendar.'],
    ['dateSelect', 'output', 'Emits the clicked day.'],
    ['--chr-multiview-gap', 'CSS', 'Space between months.'],
    ...COMMON,
  ];
  readonly inlineCode = `<chr-calendar [value]="dt" (dateSelect)="setDay($event)" />
<chr-time-picker [value]="dt" (valueChange)="setTime($event)" />`;
  today = true; fixed = false; fdow = 1;
  readonly a = new Date(new Date().getFullYear(), new Date().getMonth(), 5);
  readonly b = new Date(new Date().getFullYear(), new Date().getMonth(), 12);
  readonly basic = `<chr-calendar [(value)]="value" [(view)]="view" />`;
  readonly options = `<chr-calendar [showToday]="true" [fixedWeeks]="false" [firstDayOfWeek]="1" />`;
  readonly pickers = `<chr-month-picker /> <chr-year-picker /> <chr-decade-picker />`;
  readonly rangeCode = `<chr-calendar [range]="{ start: a, end: b }" />`;
  readonly api = [
    ['value (model)', 'TDate | null', 'Selected day.'],
    ['view (model)', "'day'|'month'|'year'|'decade'", 'Displayed view.'],
    ['selectionView', 'same', 'View in which a click selects; default day.'],
    ['min / max', 'TDate', 'Bounds.'],
    ['disabledDates', '(d) => boolean | TDate[]', 'Unselectable days.'],
    ['range', '{ start, end }', 'Highlight only.'],
    ['cellTemplate', 'TemplateRef<ChrCellContext>', 'Context: $implicit CalendarCell, view.'],
    ['initialDate', 'TDate', 'Shown when no value.'],
    ['showToday / fixedWeeks', 'boolean', 'Defaults from global config.'],
    ['dateSelect / dateHover / activeDateChange', 'outputs', 'Interaction events.'],
    ['focusActiveCell()', 'method', 'Focus the grid.'],
    ...COMMON,
  ];
}
