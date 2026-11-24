import { Component } from '@angular/core';

@Component({
  template: `
    <h1>Accessibility &amp; keyboard</h1>
    <p>Use any other page to verify these with a keyboard or screen reader. See <code>docs/accessibility.md</code> for the full contract.</p>
    <table>
      <thead><tr><th>Control</th><th>Key</th><th>Action</th></tr></thead>
      <tbody>
        <tr><td>Date input</td><td><code>↑ ↓</code> (+<code>Shift</code>/<code>Ctrl</code>)</td><td>Step day / month / year</td></tr>
        <tr><td>Date input</td><td><code>Enter</code></td><td>Normalise typed text</td></tr>
        <tr><td>Pickers</td><td><code>Alt+↓</code></td><td>Open popup</td></tr>
        <tr><td>Pickers</td><td><code>Escape</code></td><td>Close, focus back to input</td></tr>
        <tr><td>Calendar</td><td><code>← → ↑ ↓</code></td><td>Day / week</td></tr>
        <tr><td>Calendar</td><td><code>PageUp/Down</code> (+<code>Shift</code>)</td><td>Month (year)</td></tr>
        <tr><td>Calendar</td><td><code>Home / End</code></td><td>Week start / end</td></tr>
        <tr><td>Calendar</td><td><code>Ctrl+↑</code></td><td>Coarser view</td></tr>
        <tr><td>Calendar</td><td><code>Enter / Space</code></td><td>Select</td></tr>
        <tr><td>Time lists</td><td><code>↑ ↓ Home End</code> / <code>← →</code></td><td>Change value / switch column</td></tr>
      </tbody>
    </table>
    <h2>Manual checklist</h2>
    <ul>
      <li>Every control has an accessible name (<code>ariaLabel</code>, <code>ariaLabelledby</code> or <code>&lt;label for&gt;</code> with <code>inputId</code>).</li>
      <li>Focus is visible and returns to the input after the popup closes.</li>
      <li>Errors are announced after the control is touched.</li>
    </ul>
  `,
})
export class AccessibilityPage {}
