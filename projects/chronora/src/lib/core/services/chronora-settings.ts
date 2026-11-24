import { Injectable, inject } from '@angular/core';
import type { DateAdapter } from '../adapters/date-adapter';
import { DEFAULT_CHRONORA_CONFIG, type ChronoraConfig } from '../config/chronora-config';
import { CHRONORA_CONFIG, CHRONORA_DATE_ADAPTER, CHRONORA_LOCALES } from '../tokens/tokens';
import {
  EN_US_LOCALE,
  ES_ES_LOCALE,
  createLocale,
  type ChronoraLocale,
} from '../../localization/locale';

/** Per-component overrides applied on top of the global configuration. */
export interface LocaleOverrides {
  locale?: string | ChronoraLocale | null;
  dateFormat?: string | null;
  timeFormat?: string | null;
  dateTimeFormat?: string | null;
  firstDayOfWeek?: number | null;
}

/**
 * Read-only access to the effective Chronora configuration. Resolves locales (registered,
 * built-in or `Intl`-derived) and applies global and per-component overrides.
 */
@Injectable({ providedIn: 'root' })
export class ChronoraSettings {
  readonly config: Readonly<ChronoraConfig> = inject(CHRONORA_CONFIG, { optional: true }) ?? DEFAULT_CHRONORA_CONFIG;
  private readonly registered = inject(CHRONORA_LOCALES);
  private readonly adapterToken = inject(CHRONORA_DATE_ADAPTER);
  private readonly cache = new Map<string, ChronoraLocale>();

  /** The configured date adapter, typed for the caller's date type. */
  adapter<TDate>(): DateAdapter<TDate> {
    return this.adapterToken as DateAdapter<TDate>;
  }

  /** Resolves a locale spec to a complete locale with global overrides applied. */
  resolveLocale(overrides: LocaleOverrides = {}): ChronoraLocale {
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

  private byCode(code: string): ChronoraLocale {
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
