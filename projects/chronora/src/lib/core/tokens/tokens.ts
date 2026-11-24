import { InjectionToken } from '@angular/core';
import { DateAdapter } from '../adapters/date-adapter';
import { NativeDateAdapter } from '../adapters/native-date-adapter';
import type { ChronoraConfig } from '../config/chronora-config';
import type { ChronoraLocale } from '../../localization/locale';

/**
 * The date adapter used by all components. Defaults to {@link NativeDateAdapter}; override with
 * `provideChronora({ dateAdapter: ... })` or provide this token directly.
 */
export const CHRONORA_DATE_ADAPTER = new InjectionToken<DateAdapter<unknown>>('CHRONORA_DATE_ADAPTER', {
  providedIn: 'root',
  factory: () => new NativeDateAdapter(),
});

/** Resolved (fully populated) global configuration. Use {@link provideChronora} to set it. */
export const CHRONORA_CONFIG = new InjectionToken<ChronoraConfig>('CHRONORA_CONFIG');

/** Additional locales that can be referenced by code from `ChronoraConfig.locale`. */
export const CHRONORA_LOCALES = new InjectionToken<readonly ChronoraLocale[]>('CHRONORA_LOCALES', {
  providedIn: 'root',
  factory: () => [],
});
