import { Injectable, inject, signal } from '@angular/core';
import type { DateAdapter } from '../adapters/date-adapter';
import { DEFAULT_MOMENTRA_CONFIG, type MomentraConfig, type MomentraTheme } from '../config/momentra-config';
import { MOMENTRA_CONFIG, MOMENTRA_DATE_ADAPTER, MOMENTRA_LOCALES } from '../tokens/tokens';
import {
  EN_US_LOCALE,
  ES_ES_LOCALE,
  createLocale,
  type MomentraLocale,
} from '../../localization/locale';

/** Per-component overrides applied on top of the global configuration. */
export interface LocaleOverrides {
  locale?: string | MomentraLocale | null;
  dateFormat?: string | null;
  timeFormat?: string | null;
  dateTimeFormat?: string | null;
  firstDayOfWeek?: number | null;
}

/**
 * Read-only access to the effective Momentra configuration. Resolves locales (registered,
 * built-in or `Intl`-derived) and applies global and per-component overrides.
 */
@Injectable({ providedIn: 'root' })
export class MomentraSettings {
  readonly config: Readonly<MomentraConfig> = inject(MOMENTRA_CONFIG, { optional: true }) ?? DEFAULT_MOMENTRA_CONFIG;
  /**
   * The global theme, seeded from `config.theme`. Set it to re-theme every component that has no
   * `theme` input of its own, e.g. from an app-level dark mode toggle.
   */
  readonly theme = signal<MomentraTheme>(this.config.theme);
  private readonly registered = inject(MOMENTRA_LOCALES);
  private readonly adapterToken = inject(MOMENTRA_DATE_ADAPTER);
  private readonly cache = new Map<string, MomentraLocale>();

  /** The configured date adapter, typed for the caller's date type. */
  adapter<TDate>(): DateAdapter<TDate> {
    return this.adapterToken as DateAdapter<TDate>;
  }

  /** Resolves a locale spec to a complete locale with global overrides applied. */
  resolveLocale(overrides: LocaleOverrides = {}): MomentraLocale {
    const spec = overrides.locale ?? this.config.locale;
    const base = typeof spec === 'string' ? this.byCode(spec) : spec;
    const firstDayOfWeek = overrides.firstDayOfWeek ?? this.config.firstDayOfWeek;
    const dateFormat = overrides.dateFormat ?? this.config.dateFormat;
    const timeFormat = overrides.timeFormat ?? this.config.timeFormat;
    const dateTimeFormat = overrides.dateTimeFormat ?? this.config.dateTimeFormat;
    const messages = this.config.validationMessages;
    const derivedDateTime =
      dateTimeFormat ?? (dateFormat || timeFormat ? `${dateFormat ?? base.dateFormat} ${timeFormat ?? base.timeFormat}` : undefined);
    return {
      ...base,
      ...(firstDayOfWeek != null ? { firstDayOfWeek } : {}),
      ...(dateFormat ? { dateFormat } : {}),
      ...(timeFormat ? { timeFormat } : {}),
      ...(derivedDateTime ? { dateTimeFormat: derivedDateTime } : {}),
      ...(messages ? { validationMessages: { ...base.validationMessages, ...messages } } : {}),
    };
  }

  private byCode(code: string): MomentraLocale {
    const registered = this.registered.find((l) => l.code === code);
    if (registered) {
      return registered;
    }
    if (code === EN_US_LOCALE.code) {
      return EN_US_LOCALE;
    }
    if (code === ES_ES_LOCALE.code) {
      return ES_ES_LOCALE;
    }
    let locale = this.cache.get(code);
    if (!locale) {
      locale = createLocale(code);
      this.cache.set(code, locale);
    }
    return locale;
  }
}
