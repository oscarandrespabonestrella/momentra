import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePickerComponent } from '@chronora/angular';
import { Demo } from '../demo';

@Component({
  imports: [FormsModule, RouterLink, DatePickerComponent, Demo],
  template: `
    <h1>Globalization</h1>
    <p>Month names, weekday names, formats and the first day of the week come from the locale. Themes and colours live in <a routerLink="/theming">Styling &amp; theming</a>.</p>

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
  `,
})
export class GlobalizationPage {
  locale = 'en-US';
  readonly locales = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'];
  readonly localeCode = `<chr-date-picker [locale]="'es-ES'" />   // others via Intl, or provideChronora({ locales: [createLocale(...)] })`;
}
