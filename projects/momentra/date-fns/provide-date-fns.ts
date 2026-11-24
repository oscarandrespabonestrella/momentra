import type { EnvironmentProviders } from '@angular/core';
import { provideMomentra, type MomentraConfig } from '@momentra/angular';
import { DateFnsDateAdapter } from './date-fns-date-adapter';

/**
 * Configures Momentra to use the date-fns adapter. Equivalent to
 * `provideMomentra({ ...config, dateAdapter: DateFnsDateAdapter })`.
 */
export function provideMomentraDateFns(config: Partial<Omit<MomentraConfig, 'dateAdapter'>> = {}): EnvironmentProviders {
  return provideMomentra({ ...config, dateAdapter: DateFnsDateAdapter });
}
