import { InjectionToken } from '@angular/core';
import { DateAdapter } from '../adapters/date-adapter';
import { NativeDateAdapter } from '../adapters/native-date-adapter';
import type { MomentraConfig } from '../config/momentra-config';
import type { MomentraLocale } from '../../localization/locale';

/**
 * The date adapter used by all components. Defaults to {@link NativeDateAdapter}; override with
 * `provideMomentra({ dateAdapter: ... })` or provide this token directly.
 */
export const MOMENTRA_DATE_ADAPTER = new InjectionToken<DateAdapter<unknown>>('MOMENTRA_DATE_ADAPTER', {
  providedIn: 'root',
  factory: () => new NativeDateAdapter(),
});

/** Resolved (fully populated) global configuration. Use {@link provideMomentra} to set it. */
export const MOMENTRA_CONFIG = new InjectionToken<MomentraConfig>('MOMENTRA_CONFIG');

/** Additional locales that can be referenced by code from `MomentraConfig.locale`. */
export const MOMENTRA_LOCALES = new InjectionToken<readonly MomentraLocale[]>('MOMENTRA_LOCALES', {
  providedIn: 'root',
  factory: () => [],
});
