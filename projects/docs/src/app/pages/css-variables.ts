import { Component, computed, signal } from '@angular/core';
import { CalendarComponent, DateInputComponent } from '@momentra/angular';
import { Demo } from '../demo';

/** [property, light default, dark default, used for] — mirrors theming/_tokens.scss. */
const COLORS: string[][] = [
  ['--mtr-primary', '#4c5bd4', '#7f8cff', 'Selected day, primary buttons, accents'],
  ['--mtr-primary-contrast', '#ffffff', '#0b0d12', 'Text on --mtr-primary'],
  ['--mtr-primary-soft', '#eceefd', '#252a4a', 'Active preset, selected time, soft fills'],
  ['--mtr-primary-text', '#3542ae', '#c3c9ff', 'Text on --mtr-primary-soft'],
  ['--mtr-surface', '#ffffff', '#151821', 'Field and popup background'],
  ['--mtr-surface-alt', '#f7f8fa', '#1b1f2a', 'Disabled / read-only fields, side rails'],
  ['--mtr-surface-hover', '#eef0f5', '#232836', 'Hover background'],
  ['--mtr-text', '#151922', '#e9ebf1', 'Body text'],
  ['--mtr-text-muted', '#555d6e', '#a1a8b8', 'Placeholders, secondary text'],
  ['--mtr-text-subtle', '#6f7685', '#8e95a6', 'Weekday headers, captions'],
  ['--mtr-text-disabled', '#a6acb8', '#565d6e', 'Disabled text'],
  ['--mtr-border', '#d5d9e1', '#2c3242', 'Dividers'],
  ['--mtr-border-strong', '#b4bac7', '#454d62', 'Field border'],
  ['--mtr-danger', '#c2342b', '#f2766b', 'Invalid state and error messages'],
  ['--mtr-today', '#b45309', '#f2b544', "Today marker"],
  ['--mtr-range', '#e6e9fc', '#21264a', 'Days inside a selected range'],
  ['--mtr-range-text', '#232a6b', '#d6daff', 'Text on --mtr-range'],
  ['--mtr-ring', 'rgba(76,91,212,.32)', 'rgba(127,140,255,.4)', 'Focus halo (3px box-shadow)'],
  ['--mtr-focus-ring', '#4c5bd4', '#7f8cff', 'Keyboard focus outline'],
];

/** [property, default, used for] */
const STRUCTURE: string[][] = [
  ['--mtr-font-family', 'Inter, system-ui, …', 'All text'],
  ['--mtr-font-size', '14px', 'Base text size'],
  ['--mtr-radius', '8px', 'Fields and popups'],
  ['--mtr-radius-sm', '6px', 'Cells and buttons'],
  ['--mtr-spacing', '12px', 'Calendar padding unit'],
  ['--mtr-cell-size', '38px', 'Calendar column width (calendar width = 7 × cell + 2 × spacing)'],
  ['--mtr-cell-height', '34px', 'Calendar cell height'],
  ['--mtr-shadow', 'two-layer soft shadow', 'Popup elevation'],
  ['--mtr-shadow-sm', '0 1px 2px …', 'Field elevation'],
];

const SIZING: string[][] = [
  ['--mtr-field-width', '14rem · time 12rem · date-time 18rem · range 22rem', 'Field width (capped at 100% of the container)'],
  ['--mtr-spinner-width', '26px', 'Up/down spinner buttons'],
  ['--mtr-infinite-width', 'auto', 'mtr-infinite-calendar width'],
  ['--mtr-infinite-height', '300px', 'mtr-infinite-calendar scroll height'],
  ['--mtr-infinite-rail-width', '76px', 'mtr-infinite-calendar year/month rail'],
  ['--mtr-multiview-gap', '34px', 'Gap between months in mtr-multiview-calendar'],
];

@Component({
  imports: [CalendarComponent, DateInputComponent, Demo],
  template: `
    <h1>CSS custom properties</h1>
    <p>Every visual decision is a <code>--mtr-*</code> custom property. Override them in plain CSS — no Sass, no <code>::ng-deep</code>, no build step.</p>

    <h2>Where to set them</h2>
    <pre><code>{{ whereCode }}</code></pre>
    <p class="note"><strong>Set them on <code>:root</code> or <code>body</code>.</strong> Popups render in the CDK overlay container, a sibling of your app root, so a property set on some ancestor of the picker never reaches its popup. Properties on the component's own host element reach the field only.</p>

    <h2>Playground</h2>
    <doc-demo [code]="playCode()">
      <div class="play" [style.--mtr-primary]="primary()" [style.--mtr-radius.px]="radius()" [style.--mtr-radius-sm.px]="radius() * .75"
           [style.--mtr-cell-size.px]="cell()" [style.--mtr-cell-height.px]="cell() - 4" [style.--mtr-font-size.px]="font()">
        <mtr-date-input ariaLabel="Playground date" />
        <mtr-calendar ariaLabel="Playground calendar" />
      </div>
      <div options>
        <label class="opt">--mtr-primary <input type="color" [value]="primary()" (input)="primary.set(val($event))" /></label>
        <label class="opt">--mtr-radius <input type="range" min="0" max="20" [value]="radius()" (input)="radius.set(+val($event))" /> {{ radius() }}px</label>
        <label class="opt">--mtr-cell-size <input type="range" min="30" max="48" [value]="cell()" (input)="cell.set(+val($event))" /> {{ cell() }}px</label>
        <label class="opt">--mtr-font-size <input type="range" min="12" max="18" [value]="font()" (input)="font.set(+val($event))" /> {{ font() }}px</label>
      </div>
    </doc-demo>

    <h2>Colour tokens</h2>
    <p>Defaults differ per theme. A value you set applies to <em>both</em> themes; see the next section to scope it.</p>
    <div class="scroll"><table>
      <thead><tr><th scope="col">Property</th><th scope="col">Light</th><th scope="col">Dark</th><th scope="col">Used for</th></tr></thead>
      <tbody>
        @for (r of colors; track r[0]) {
          <tr>
            <th scope="row"><code>{{ r[0] }}</code></th>
            <td><span class="sw" [style.background]="r[1]"></span><code>{{ r[1] }}</code></td>
            <td><span class="sw" [style.background]="r[2]"></span><code>{{ r[2] }}</code></td>
            <td>{{ r[3] }}</td>
          </tr>
        }
      </tbody>
    </table></div>

    <h2>Different values per theme</h2>
    <pre><code>{{ perThemeCode }}</code></pre>

    <h2>Shape, type and spacing</h2>
    <div class="scroll"><table>
      <thead><tr><th scope="col">Property</th><th scope="col">Default</th><th scope="col">Used for</th></tr></thead>
      <tbody>
        @for (r of structure; track r[0]) { <tr><th scope="row"><code>{{ r[0] }}</code></th><td><code>{{ r[1] }}</code></td><td>{{ r[2] }}</td></tr> }
      </tbody>
    </table></div>

    <h2>Component sizing</h2>
    <div class="scroll"><table>
      <thead><tr><th scope="col">Property</th><th scope="col">Default</th><th scope="col">Used for</th></tr></thead>
      <tbody>
        @for (r of sizing; track r[0]) { <tr><th scope="row"><code>{{ r[0] }}</code></th><td><code>{{ r[1] }}</code></td><td>{{ r[2] }}</td></tr> }
      </tbody>
    </table></div>

    <h2>Recipes</h2>
    <h3>Full-width fields</h3>
    <doc-demo [code]="fullWidthCode">
      <mtr-date-input ariaLabel="Full width" style="width:100%" />
    </doc-demo>

    <h3>Compact density</h3>
    <doc-demo [code]="compactCode">
      <mtr-calendar ariaLabel="Compact" style="--mtr-cell-size:30px;--mtr-cell-height:28px;--mtr-spacing:8px;--mtr-font-size:13px" />
    </doc-demo>

    <h3>Square corners and a brand colour</h3>
    <doc-demo [code]="brandCode">
      <mtr-calendar ariaLabel="Brand" style="--mtr-primary:#0f766e;--mtr-primary-soft:#ccfbf1;--mtr-primary-text:#115e59;--mtr-range:#ccfbf1;--mtr-range-text:#134e4a;--mtr-ring:rgba(15,118,110,.3);--mtr-focus-ring:#0f766e;--mtr-radius:0;--mtr-radius-sm:0" />
    </doc-demo>

    <h3>Custom day content</h3>
    <p>Internal <code>.mtr-*</code> class names are <strong>not</strong> a stable API. To change what a cell shows (badges, prices, events), use the <code>cellTemplate</code> input rather than targeting internal classes.</p>
    <pre><code>{{ cellCode }}</code></pre>

    <h3>Contrast</h3>
    <p>The defaults meet WCAG AA. When you change colours, keep text tokens at 4.5:1 against their background and <code>--mtr-focus-ring</code> at 3:1 against <code>--mtr-surface</code>. The repo's <code>npm run check:contrast</code> script verifies the defaults.</p>
  `,
  styles: `
    .scroll { overflow-x:auto; }
    .scroll table { min-width:640px; }
    td { white-space:nowrap; }
    td:last-child { white-space:normal; }
    .sw { display:inline-block; width:14px; height:14px; margin-right:8px; vertical-align:-2px; border-radius:4px; border:1px solid var(--doc-line); }
    .note { padding:12px 16px; border-radius:10px; background:var(--doc-warn-soft); color:var(--doc-warn-fg); }
    .note strong, .note code { color:inherit; }
    .play { display:flex; flex-wrap:wrap; gap:24px; align-items:flex-start; }
    label.opt input[type=range] { padding:0; height:auto; border:0; background:none; }
    label.opt input[type=color] { width:36px; padding:2px; }
  `,
})
export class CssVariablesPage {
  readonly colors = COLORS;
  readonly structure = STRUCTURE;
  readonly sizing = SIZING;

  readonly primary = signal('#4c5bd4');
  readonly radius = signal(8);
  readonly cell = signal(38);
  readonly font = signal(14);
  readonly playCode = computed(
    () => `:root {
  --mtr-primary: ${this.primary()};
  --mtr-radius: ${this.radius()}px;
  --mtr-radius-sm: ${this.radius() * 0.75}px;
  --mtr-cell-size: ${this.cell()}px;
  --mtr-cell-height: ${this.cell() - 4}px;
  --mtr-font-size: ${this.font()}px;
}`,
  );

  val(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  readonly whereCode = `/* styles.css — applies to every field and every popup */
:root {
  --mtr-primary: #0f766e;
  --mtr-radius: 12px;
  --mtr-font-family: 'IBM Plex Sans', sans-serif;
}

/* one instance only (the field, not its popup) */
mtr-date-picker.compact { --mtr-field-width: 10rem; }`;
  readonly perThemeCode = `:root { --mtr-primary: #0f766e; }

/* dark components: global theme 'dark', or 'auto' on a dark OS */
@media (prefers-color-scheme: dark) {
  :root { --mtr-primary: #5eead4; --mtr-primary-contrast: #042f2e; }
}

/* or, with a class-based app dark mode */
:root.dark { --mtr-primary: #5eead4; --mtr-primary-contrast: #042f2e; }`;
  readonly fullWidthCode = `<mtr-date-input style="width: 100%" />
/* or: mtr-date-input { width: 100%; } */`;
  readonly compactCode = `:root {
  --mtr-cell-size: 30px;
  --mtr-cell-height: 28px;
  --mtr-spacing: 8px;
  --mtr-font-size: 13px;
}`;
  readonly brandCode = `:root {
  --mtr-primary: #0f766e;
  --mtr-primary-soft: #ccfbf1;
  --mtr-primary-text: #115e59;
  --mtr-range: #ccfbf1;
  --mtr-range-text: #134e4a;
  --mtr-ring: rgba(15, 118, 110, .3);
  --mtr-focus-ring: #0f766e;
  --mtr-radius: 0;
  --mtr-radius-sm: 0;
}`;
  readonly cellCode = `<mtr-calendar [cellTemplate]="cell" />
<ng-template #cell let-ctx>
  {{ ctx.$implicit.label }}
  @if (hasEvent(ctx.$implicit.date)) { <span class="dot"></span> }
</ng-template>`;
}
