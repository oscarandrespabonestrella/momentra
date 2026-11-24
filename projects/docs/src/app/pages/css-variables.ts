import { Component, computed, signal } from '@angular/core';
import { CalendarComponent, DateInputComponent } from '@chronora/angular';
import { Demo } from '../demo';

/** [property, light default, dark default, used for] — mirrors theming/_tokens.scss. */
const COLORS: string[][] = [
  ['--chr-primary', '#4c5bd4', '#7f8cff', 'Selected day, primary buttons, accents'],
  ['--chr-primary-contrast', '#ffffff', '#0b0d12', 'Text on --chr-primary'],
  ['--chr-primary-soft', '#eceefd', '#252a4a', 'Active preset, selected time, soft fills'],
  ['--chr-primary-text', '#3542ae', '#c3c9ff', 'Text on --chr-primary-soft'],
  ['--chr-surface', '#ffffff', '#151821', 'Field and popup background'],
  ['--chr-surface-alt', '#f7f8fa', '#1b1f2a', 'Disabled / read-only fields, side rails'],
  ['--chr-surface-hover', '#eef0f5', '#232836', 'Hover background'],
  ['--chr-text', '#151922', '#e9ebf1', 'Body text'],
  ['--chr-text-muted', '#555d6e', '#a1a8b8', 'Placeholders, secondary text'],
  ['--chr-text-subtle', '#6f7685', '#8e95a6', 'Weekday headers, captions'],
  ['--chr-text-disabled', '#a6acb8', '#565d6e', 'Disabled text'],
  ['--chr-border', '#d5d9e1', '#2c3242', 'Dividers'],
  ['--chr-border-strong', '#b4bac7', '#454d62', 'Field border'],
  ['--chr-danger', '#c2342b', '#f2766b', 'Invalid state and error messages'],
  ['--chr-today', '#b45309', '#f2b544', "Today marker"],
  ['--chr-range', '#e6e9fc', '#21264a', 'Days inside a selected range'],
  ['--chr-range-text', '#232a6b', '#d6daff', 'Text on --chr-range'],
  ['--chr-ring', 'rgba(76,91,212,.32)', 'rgba(127,140,255,.4)', 'Focus halo (3px box-shadow)'],
  ['--chr-focus-ring', '#4c5bd4', '#7f8cff', 'Keyboard focus outline'],
];

/** [property, default, used for] */
const STRUCTURE: string[][] = [
  ['--chr-font-family', 'Inter, system-ui, …', 'All text'],
  ['--chr-font-size', '14px', 'Base text size'],
  ['--chr-radius', '8px', 'Fields and popups'],
  ['--chr-radius-sm', '6px', 'Cells and buttons'],
  ['--chr-spacing', '12px', 'Calendar padding unit'],
  ['--chr-cell-size', '38px', 'Calendar column width (calendar width = 7 × cell + 2 × spacing)'],
  ['--chr-cell-height', '34px', 'Calendar cell height'],
  ['--chr-shadow', 'two-layer soft shadow', 'Popup elevation'],
  ['--chr-shadow-sm', '0 1px 2px …', 'Field elevation'],
];

const SIZING: string[][] = [
  ['--chr-field-width', '14rem · time 12rem · date-time 18rem · range 22rem', 'Field width (capped at 100% of the container)'],
  ['--chr-spinner-width', '26px', 'Up/down spinner buttons'],
  ['--chr-infinite-width', 'auto', 'chr-infinite-calendar width'],
  ['--chr-infinite-height', '300px', 'chr-infinite-calendar scroll height'],
  ['--chr-infinite-rail-width', '76px', 'chr-infinite-calendar year/month rail'],
  ['--chr-multiview-gap', '34px', 'Gap between months in chr-multiview-calendar'],
];

@Component({
  imports: [CalendarComponent, DateInputComponent, Demo],
  template: `
    <h1>CSS custom properties</h1>
    <p>Every visual decision is a <code>--chr-*</code> custom property. Override them in plain CSS — no Sass, no <code>::ng-deep</code>, no build step.</p>

    <h2>Where to set them</h2>
    <pre><code>{{ whereCode }}</code></pre>
    <p class="note"><strong>Set them on <code>:root</code> or <code>body</code>.</strong> Popups render in the CDK overlay container, a sibling of your app root, so a property set on some ancestor of the picker never reaches its popup. Properties on the component's own host element reach the field only.</p>

    <h2>Playground</h2>
    <doc-demo [code]="playCode()">
      <div class="play" [style.--chr-primary]="primary()" [style.--chr-radius.px]="radius()" [style.--chr-radius-sm.px]="radius() * .75"
           [style.--chr-cell-size.px]="cell()" [style.--chr-cell-height.px]="cell() - 4" [style.--chr-font-size.px]="font()">
        <chr-date-input ariaLabel="Playground date" />
        <chr-calendar ariaLabel="Playground calendar" />
      </div>
      <div options>
        <label class="opt">--chr-primary <input type="color" [value]="primary()" (input)="primary.set(val($event))" /></label>
        <label class="opt">--chr-radius <input type="range" min="0" max="20" [value]="radius()" (input)="radius.set(+val($event))" /> {{ radius() }}px</label>
        <label class="opt">--chr-cell-size <input type="range" min="30" max="48" [value]="cell()" (input)="cell.set(+val($event))" /> {{ cell() }}px</label>
        <label class="opt">--chr-font-size <input type="range" min="12" max="18" [value]="font()" (input)="font.set(+val($event))" /> {{ font() }}px</label>
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
      <chr-date-input ariaLabel="Full width" style="width:100%" />
    </doc-demo>

    <h3>Compact density</h3>
    <doc-demo [code]="compactCode">
      <chr-calendar ariaLabel="Compact" style="--chr-cell-size:30px;--chr-cell-height:28px;--chr-spacing:8px;--chr-font-size:13px" />
    </doc-demo>

    <h3>Square corners and a brand colour</h3>
    <doc-demo [code]="brandCode">
      <chr-calendar ariaLabel="Brand" style="--chr-primary:#0f766e;--chr-primary-soft:#ccfbf1;--chr-primary-text:#115e59;--chr-range:#ccfbf1;--chr-range-text:#134e4a;--chr-ring:rgba(15,118,110,.3);--chr-focus-ring:#0f766e;--chr-radius:0;--chr-radius-sm:0" />
    </doc-demo>

    <h3>Custom day content</h3>
    <p>Internal <code>.chr-*</code> class names are <strong>not</strong> a stable API. To change what a cell shows (badges, prices, events), use the <code>cellTemplate</code> input rather than targeting internal classes.</p>
    <pre><code>{{ cellCode }}</code></pre>

    <h3>Contrast</h3>
    <p>The defaults meet WCAG AA. When you change colours, keep text tokens at 4.5:1 against their background and <code>--chr-focus-ring</code> at 3:1 against <code>--chr-surface</code>. The repo's <code>npm run check:contrast</code> script verifies the defaults.</p>
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
  --chr-primary: ${this.primary()};
  --chr-radius: ${this.radius()}px;
  --chr-radius-sm: ${this.radius() * 0.75}px;
  --chr-cell-size: ${this.cell()}px;
  --chr-cell-height: ${this.cell() - 4}px;
  --chr-font-size: ${this.font()}px;
}`,
  );

  val(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  readonly whereCode = `/* styles.css — applies to every field and every popup */
:root {
  --chr-primary: #0f766e;
  --chr-radius: 12px;
  --chr-font-family: 'IBM Plex Sans', sans-serif;
}

/* one instance only (the field, not its popup) */
chr-date-picker.compact { --chr-field-width: 10rem; }`;
  readonly perThemeCode = `:root { --chr-primary: #0f766e; }

/* dark components: global theme 'dark', or 'auto' on a dark OS */
@media (prefers-color-scheme: dark) {
  :root { --chr-primary: #5eead4; --chr-primary-contrast: #042f2e; }
}

/* or, with a class-based app dark mode */
:root.dark { --chr-primary: #5eead4; --chr-primary-contrast: #042f2e; }`;
  readonly fullWidthCode = `<chr-date-input style="width: 100%" />
/* or: chr-date-input { width: 100%; } */`;
  readonly compactCode = `:root {
  --chr-cell-size: 30px;
  --chr-cell-height: 28px;
  --chr-spacing: 8px;
  --chr-font-size: 13px;
}`;
  readonly brandCode = `:root {
  --chr-primary: #0f766e;
  --chr-primary-soft: #ccfbf1;
  --chr-primary-text: #115e59;
  --chr-range: #ccfbf1;
  --chr-range-text: #134e4a;
  --chr-ring: rgba(15, 118, 110, .3);
  --chr-focus-ring: #0f766e;
  --chr-radius: 0;
  --chr-radius-sm: 0;
}`;
  readonly cellCode = `<chr-calendar [cellTemplate]="cell" />
<ng-template #cell let-ctx>
  {{ ctx.$implicit.label }}
  @if (hasEvent(ctx.$implicit.date)) { <span class="dot"></span> }
</ng-template>`;
}
