import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent, CalendarComponent } from '@chronora/angular';
import { Demo } from '../demo';

@Component({
  imports: [FormsModule, DatePickerComponent, CalendarComponent, Demo],
  template: `
    <h1>Globalization &amp; themes</h1>

    <h2>Locale</h2>
    <doc-demo [code]="localeCode">
      <chr-date-picker ariaLabel="Localised" [locale]="locale" [firstDayOfWeek]="locale === 'es-ES' ? 1 : undefined" />
      <div options>
        <label class="opt">locale
          <select [(ngModel)]="locale">
            @for (l of locales; track l) { <option [value]="l">{{ l }}</option> }
          </select></label>
      </div>
    </doc-demo>

    <h2>Themes</h2>
    <doc-demo [code]="themeCode">
      @for (t of themes; track t) {
        <div [style.background]="t === 'dark' ? '#1b1e2e' : 'transparent'" style="padding:.75rem;border-radius:8px">
          <chr-calendar [theme]="t" [ariaLabel]="t + ' theme'" />
        </div>
      }
    </doc-demo>

    <h2>CSS custom properties</h2>
    <doc-demo [code]="cssCode">
      <chr-date-picker ariaLabel="Teal" style="--chr-primary:#0f766e;--chr-radius:14px" />
    </doc-demo>
    <p>Popups render in the CDK overlay, so set variables on <code>:root</code> to reach them.</p>
  `,
})
export class GlobalizationPage {
  locale = 'en-US';
  readonly locales = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'];
  readonly themes = ['light', 'dark', 'auto'] as const;
  readonly localeCode = `<chr-date-picker [locale]="'es-ES'" />   // others via Intl, or provideChronora({ locales: [createLocale(...)] })`;
  readonly themeCode = `<chr-calendar theme="dark" />   // or provideChronora({ theme: 'auto' })`;
  readonly cssCode = `chr-date-picker { --chr-primary: #0f766e; --chr-radius: 14px; }`;
}
