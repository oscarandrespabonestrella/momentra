import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { CHRONORA_DATE_ADAPTER, provideChronora, type ChronoraConfig } from '@chronora/angular';
import { LuxonDateAdapter, type LuxonDateAdapterOptions } from './luxon-date-adapter';

/**
 * Configures Chronora to use Luxon `DateTime` values. Pass `adapter.zone` to work in a fixed IANA
 * time zone instead of the system zone.
 *
 * ```ts
 * provideChronoraLuxon({ locale: 'es-ES' }, { zone: 'Europe/Madrid' })
 * ```
 */
export function provideChronoraLuxon(
  config: Partial<Omit<ChronoraConfig, 'dateAdapter'>> = {},
  adapter: LuxonDateAdapterOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideChronora(config),
    { provide: CHRONORA_DATE_ADAPTER, useValue: new LuxonDateAdapter(adapter) },
  ]);
}
