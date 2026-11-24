import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { MOMENTRA_DATE_ADAPTER, provideMomentra, type MomentraConfig } from '@momentra/angular';
import { LuxonDateAdapter, type LuxonDateAdapterOptions } from './luxon-date-adapter';

/**
 * Configures Momentra to use Luxon `DateTime` values. Pass `adapter.zone` to work in a fixed IANA
 * time zone instead of the system zone.
 *
 * ```ts
 * provideMomentraLuxon({ locale: 'es-ES' }, { zone: 'Europe/Madrid' })
 * ```
 */
export function provideMomentraLuxon(
  config: Partial<Omit<MomentraConfig, 'dateAdapter'>> = {},
  adapter: LuxonDateAdapterOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideMomentra(config),
    { provide: MOMENTRA_DATE_ADAPTER, useValue: new LuxonDateAdapter(adapter) },
  ]);
}
