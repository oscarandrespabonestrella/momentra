import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  template: `
    <h1>Chronora — Angular Date &amp; Time Toolkit</h1>
    <p>Living documentation and manual test bench for <code>&#64;chronora/angular</code>. Every page shows live components, option toggles and the code behind them, organised like the Kendo UI <em>DateInputs</em> package.</p>
    <table>
      <thead><tr><th>Chronora</th><th>Kendo equivalent</th><th>Page</th></tr></thead>
      <tbody>
        <tr><td><code>chr-date-input</code></td><td>DateInput</td><td><a routerLink="/date-input">Open</a></td></tr>
        <tr><td><code>chr-date-picker</code></td><td>DatePicker</td><td><a routerLink="/date-picker">Open</a></td></tr>
        <tr><td><code>chr-time-picker</code></td><td>TimePicker</td><td><a routerLink="/time-picker">Open</a></td></tr>
        <tr><td><code>chr-datetime-picker</code></td><td>DateTimePicker</td><td><a routerLink="/datetime-picker">Open</a></td></tr>
        <tr><td><code>chr-date-range-picker</code></td><td>DateRange</td><td><a routerLink="/date-range">Open</a></td></tr>
        <tr><td><code>chr-datetime-input</code></td><td>DateTimeInput</td><td><a routerLink="/datetime-input">Open</a></td></tr>
        <tr><td><code>chr-calendar</code>, <code>chr-infinite-calendar</code>, <code>chr-multiview-calendar</code>, month/year/decade pickers</td><td>Calendar</td><td><a routerLink="/calendar">Open</a></td></tr>
      </tbody>
    </table>
    <h2>Getting started</h2>
    <pre><code>npm i &#64;chronora/angular &#64;angular/cdk

import {{ '{' }} DatePickerComponent, provideChronora {{ '}' }} from '&#64;chronora/angular';
bootstrapApplication(App, {{ '{' }} providers: [provideChronora({{ '{' }} theme: 'auto' {{ '}' }})] {{ '}' }});</code></pre>
    <p>Not covered by the library (compared to Kendo): masked-input sections. Use these pages to confirm each gap.</p>
  `,
})
export class Overview {}
