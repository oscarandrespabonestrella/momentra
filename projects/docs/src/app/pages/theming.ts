import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CalendarComponent, MomentraSettings, DatePickerComponent } from '@momentra/angular';
import { Demo } from '../demo';

@Component({
  imports: [RouterLink, CalendarComponent, DatePickerComponent, Demo],
  template: `
    <h1>Themes</h1>
    <p>Momentra ships its own design system: no global stylesheet to import and no CSS framework. Component styles are encapsulated, and every colour, radius, size and shadow is a CSS custom property.</p>

    <h2>How it works</h2>
    <p>Each component host gets a <code>data-mtr-theme="light | dark | auto"</code> attribute. Its stylesheet defines private <code>--_mtr-*</code> aliases that read your public <code>--mtr-*</code> property first and fall back to the theme default:</p>
    <pre><code>{{ mechanism }}</code></pre>
    <p>So a value you set always wins, in both themes. Popups (calendar, time list, range presets) carry the same attribute, so they follow the field that opened them.</p>

    <h2>Light, dark and auto</h2>
    <p><code>auto</code> follows the operating system through <code>prefers-color-scheme</code>.</p>
    <doc-demo [code]="themeCode">
      @for (t of themes; track t) {
        <div class="swatch" [class.dark]="t === 'dark'">
          <span class="tag">{{ t }}</span>
          <mtr-calendar [theme]="t" [ariaLabel]="t + ' theme'" />
        </div>
      }
    </doc-demo>

    <h2>Global theme</h2>
    <p>Set the starting theme for the whole app once, at bootstrap.</p>
    <pre><code>{{ globalCode }}</code></pre>

    <h2>Switching at runtime</h2>
    <p><code>MomentraSettings.theme</code> is a signal. Setting it re-themes every component without its own <code>theme</code> input, including open popups. The theme button in this page's header does exactly this.</p>
    <doc-demo [code]="runtimeCode">
      <mtr-date-picker ariaLabel="Follows the global theme" />
      <div options>
        <button type="button" class="btn" (click)="toggle()">settings.theme.set('{{ settings.theme() === 'dark' ? 'light' : 'dark' }}')</button>
      </div>
      <span output>settings.theme() = '{{ settings.theme() }}'</span>
    </doc-demo>

    <h2>Per-component override</h2>
    <p>Every component accepts a <code>theme</code> input. It beats the global setting, which is handy for a dark sidebar in a light app.</p>
    <doc-demo [code]="perComponentCode">
      <div class="swatch dark"><mtr-date-picker theme="dark" ariaLabel="Always dark" /></div>
    </doc-demo>

    <h2>Syncing with your app's dark mode</h2>
    <p>If your app already toggles a class or attribute for dark mode, drive Momentra from the same state:</p>
    <pre><code>{{ syncCode }}</code></pre>

    <h2>High contrast</h2>
    <p>Under <code>forced-colors: active</code> (Windows High Contrast) selected cells and fields switch to system colours such as <code>Highlight</code>, and focus keeps a visible outline. Nothing to configure.</p>

    <p>Next: <a routerLink="/css-variables">CSS custom properties</a> lists every token you can override.</p>
  `,
  styles: `
    .swatch { padding:12px; border-radius:10px; display:flex; flex-direction:column; gap:8px; }
    .swatch.dark { background:#0b0d12; }
    .tag { font:600 12px var(--doc-mono); color:var(--doc-muted); }
    .dark .tag { color:#a1a8b8; }
    .btn { height:30px; padding:0 10px; border:1px solid var(--doc-line); border-radius:6px; background:var(--doc-surface); color:var(--doc-fg); font:12px var(--doc-mono); cursor:pointer; }
    .btn:hover { background:var(--doc-hover); }
  `,
})
export class ThemingPage {
  protected readonly settings = inject(MomentraSettings);
  readonly themes = ['light', 'dark', 'auto'] as const;

  toggle(): void {
    this.settings.theme.set(this.settings.theme() === 'dark' ? 'light' : 'dark');
  }

  readonly mechanism = `/* inside every component (simplified) */
:host                         { --_mtr-primary: var(--mtr-primary, #4c5bd4); }
:host([data-mtr-theme=dark])  { --_mtr-primary: var(--mtr-primary, #7f8cff); }
@media (prefers-color-scheme: dark) {
  :host([data-mtr-theme=auto]) { --_mtr-primary: var(--mtr-primary, #7f8cff); }
}`;
  readonly themeCode = `<mtr-calendar theme="light" />
<mtr-calendar theme="dark" />
<mtr-calendar theme="auto" />`;
  readonly globalCode = `import { provideMomentra } from '@momentra/angular';

bootstrapApplication(App, {
  providers: [provideMomentra({ theme: 'auto' })], // 'light' (default) | 'dark' | 'auto'
});`;
  readonly runtimeCode = `import { MomentraSettings } from '@momentra/angular';

export class ThemeToggle {
  private readonly settings = inject(MomentraSettings);

  toggle() {
    this.settings.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}`;
  readonly perComponentCode = `<mtr-date-picker theme="dark" />   <!-- ignores the global theme -->`;
  readonly syncCode = `// app.ts — keep <html class="dark"> and Momentra in step
const settings = inject(MomentraSettings);
effect(() => {
  const dark = settings.theme() === 'dark';
  document.documentElement.classList.toggle('dark', dark);
});`;
}
