import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  template: `
    <h1>Momentra — Angular Date &amp; Time Toolkit</h1>
    <p>Living documentation and manual test bench for <code>&#64;momentra/angular</code>. Every page shows live components, option toggles and the code behind them.</p>
    <table>
      <thead><tr><th>Component</th><th>What it does</th><th>Page</th></tr></thead>
      <tbody>
        <tr><td><code>mtr-date-input</code></td><td>Typed, segment-based date entry</td><td><a routerLink="/date-input">Open</a></td></tr>
        <tr><td><code>mtr-date-picker</code></td><td>Date input with a calendar popup</td><td><a routerLink="/date-picker">Open</a></td></tr>
        <tr><td><code>mtr-time-picker</code></td><td>Time input with a scrolling time list</td><td><a routerLink="/time-picker">Open</a></td></tr>
        <tr><td><code>mtr-datetime-picker</code></td><td>Date and time in one popup</td><td><a routerLink="/datetime-picker">Open</a></td></tr>
        <tr><td><code>mtr-date-range-picker</code></td><td>Start/end range with presets</td><td><a routerLink="/date-range">Open</a></td></tr>
        <tr><td><code>mtr-datetime-input</code></td><td>Typed date and time entry</td><td><a routerLink="/datetime-input">Open</a></td></tr>
        <tr><td><code>mtr-calendar</code>, <code>mtr-infinite-calendar</code>, <code>mtr-multiview-calendar</code>, month/year/decade pickers</td><td>Inline calendars</td><td><a routerLink="/calendar">Open</a></td></tr>
      </tbody>
    </table>
    <h2>Getting started</h2>
    <p>Install <a href="https://www.npmjs.com/package/@momentra/angular" rel="noopener"><code>&#64;momentra/angular</code> from npm</a>:</p>
    <pre><code>npm i &#64;momentra/angular &#64;angular/cdk

import {{ '{' }} DatePickerComponent, provideMomentra {{ '}' }} from '&#64;momentra/angular';
bootstrapApplication(App, {{ '{' }} providers: [provideMomentra({{ '{' }} theme: 'auto' {{ '}' }})] {{ '}' }});</code></pre>
    <p>Next: make it yours with <a routerLink="/theming">themes</a> and <a routerLink="/css-variables">CSS custom properties</a>, or point your coding assistant at the <a routerLink="/ai">LLM-friendly docs</a>.</p>
  `,
})
export class Overview {}
