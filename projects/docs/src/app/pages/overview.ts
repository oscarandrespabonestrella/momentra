import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  template: `
    <h1>Chronora — Angular Date &amp; Time Toolkit</h1>
    <p>Living documentation and manual test bench for <code>&#64;chronora/angular</code>. Every page shows live components, option toggles and the code behind them.</p>
    <table>
      <thead><tr><th>Component</th><th>What it does</th><th>Page</th></tr></thead>
      <tbody>
        <tr><td><code>chr-date-input</code></td><td>Typed, segment-based date entry</td><td><a routerLink="/date-input">Open</a></td></tr>
        <tr><td><code>chr-date-picker</code></td><td>Date input with a calendar popup</td><td><a routerLink="/date-picker">Open</a></td></tr>
        <tr><td><code>chr-time-picker</code></td><td>Time input with a scrolling time list</td><td><a routerLink="/time-picker">Open</a></td></tr>
        <tr><td><code>chr-datetime-picker</code></td><td>Date and time in one popup</td><td><a routerLink="/datetime-picker">Open</a></td></tr>
        <tr><td><code>chr-date-range-picker</code></td><td>Start/end range with presets</td><td><a routerLink="/date-range">Open</a></td></tr>
        <tr><td><code>chr-datetime-input</code></td><td>Typed date and time entry</td><td><a routerLink="/datetime-input">Open</a></td></tr>
        <tr><td><code>chr-calendar</code>, <code>chr-infinite-calendar</code>, <code>chr-multiview-calendar</code>, month/year/decade pickers</td><td>Inline calendars</td><td><a routerLink="/calendar">Open</a></td></tr>
      </tbody>
    </table>
    <h2>Getting started</h2>
    <pre><code>npm i &#64;chronora/angular &#64;angular/cdk

import {{ '{' }} DatePickerComponent, provideChronora {{ '}' }} from '&#64;chronora/angular';
bootstrapApplication(App, {{ '{' }} providers: [provideChronora({{ '{' }} theme: 'auto' {{ '}' }})] {{ '}' }});</code></pre>
    <p>Next: make it yours with <a routerLink="/theming">themes</a> and <a routerLink="/css-variables">CSS custom properties</a>, or point your coding assistant at the <a routerLink="/ai">LLM-friendly docs</a>.</p>
  `,
})
export class Overview {}
