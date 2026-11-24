import { Component, input } from '@angular/core';

/** API table: rows are [name, type, description]. */
@Component({
  selector: 'doc-api',
  styles: `
    :host { display:block; overflow-x:auto; }
    table { min-width:640px; table-layout:fixed; }
    code { overflow-wrap:anywhere; }
    thead th:not(:last-child) { width:30%; }
    tbody th { font-weight:400; }
    .type { font-size:12.5px; color:var(--doc-soft-fg); }
  `,
  template: `
    <table>
      <thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Description</th></tr></thead>
      <tbody>
        @for (r of rows(); track r[0]) {
          <tr><th scope="row"><code>{{ r[0] }}</code></th><td><code class="type">{{ r[1] }}</code></td><td>{{ r[2] }}</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class Api {
  readonly rows = input.required<string[][]>();
}

/** Inputs shared by every control (docs/components.md). */
export const COMMON: string[][] = [
  ['disabled', 'boolean', 'Disables the control (default false).'],
  ['readonly', 'boolean', 'Shows the value, blocks editing and popups.'],
  ['required', 'boolean', 'Empty value reports `required`.'],
  ['locale', 'string | ChronoraLocale', 'Locale code or object; default global.'],
  ['firstDayOfWeek', 'number', '0 = Sunday … 6 = Saturday.'],
  ['errorMessages', 'Partial<ChronoraValidationMessages>', 'Per-control message templates.'],
  ['showErrors', 'boolean', 'Show validation messages once touched (default true).'],
  ['ariaLabel / ariaLabelledby', 'string', 'Accessible name.'],
  ['inputId', 'string', 'Id of the inner input for <label for>.'],
  ['theme', "'light' | 'dark' | 'auto'", 'Per-component theme.'],
];
