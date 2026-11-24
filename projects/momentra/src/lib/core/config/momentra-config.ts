import { makeEnvironmentProviders, type EnvironmentProviders, type Provider, type Type } from '@angular/core';
import type { DateAdapter } from '../adapters/date-adapter';
import type { MomentraLocale, MomentraValidationMessages } from '../../localization/locale';
import { MOMENTRA_CONFIG, MOMENTRA_DATE_ADAPTER, MOMENTRA_LOCALES } from '../tokens/tokens';

export type MomentraTheme = 'light' | 'dark' | 'auto';

/** Global defaults. Every option can be overridden per component through its inputs. */
export interface MomentraConfig {
  /** A locale code (`'en-US'`, `'es-ES'`, any `Intl` tag or a code registered via `locales`) or a full locale object. */
  locale: string | MomentraLocale;
  /** Extra locales that may be referenced by code in `locale`. */
  locales: readonly MomentraLocale[];
  /** Overrides the locale's date pattern, e.g. `'yyyy-MM-dd'`. */
  dateFormat?: string;
  /** Overrides the locale's time pattern, e.g. `'HH:mm'`. */
  timeFormat?: string;
  /** Overrides the locale's date-time pattern. */
  dateTimeFormat?: string;
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's first day of the week. */
  firstDayOfWeek?: number;
  theme: MomentraTheme;
  /** Placeholder used by text inputs that do not set their own. Defaults to the active pattern. */
  placeholder?: string;
  /** Adapter class used for all components. Defaults to the native `Date` adapter. */
  dateAdapter?: Type<DateAdapter<unknown>>;
  /** Show the *Today* button in calendars. */
  showTodayButton: boolean;
  /** Show *Clear* buttons. */
  showClearButton: boolean;
  /** Close popups right after a selection is made (date picker and range picker). */
  closeOnSelect: boolean;
  /** Always render 6 weeks in the day view so the popup height never changes. */
  fixedWeeks: boolean;
  /** Overrides validation message templates, on top of those of the active locale. */
  validationMessages?: Partial<MomentraValidationMessages>;
}

export const DEFAULT_MOMENTRA_CONFIG: Readonly<MomentraConfig> = Object.freeze({
  locale: 'en-US',
  locales: [],
  theme: 'light',
  showTodayButton: true,
  showClearButton: true,
  closeOnSelect: true,
  fixedWeeks: false,
});

/**
 * Configures Momentra. Call once in the application providers:
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideMomentra({ locale: 'es-ES', theme: 'auto' })],
 * });
 * ```
 */
export function provideMomentra(config: Partial<MomentraConfig> = {}): EnvironmentProviders {
  const resolved: MomentraConfig = Object.freeze({ ...DEFAULT_MOMENTRA_CONFIG, ...config });
  const providers: Provider[] = [
    { provide: MOMENTRA_CONFIG, useValue: resolved },
    { provide: MOMENTRA_LOCALES, useValue: resolved.locales },
  ];
  if (resolved.dateAdapter) {
    providers.push({ provide: MOMENTRA_DATE_ADAPTER, useClass: resolved.dateAdapter });
  }
  return makeEnvironmentProviders(providers);
}
