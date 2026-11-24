import type { EnvironmentProviders } from '@angular/core';
import { provideChronora, type ChronoraConfig } from '@chronora/angular';
import { DateFnsDateAdapter } from './date-fns-date-adapter';

/**
 * Configures Chronora to use the date-fns adapter. Equivalent to
 * `provideChronora({ ...config, dateAdapter: DateFnsDateAdapter })`.
 */
export function provideChronoraDateFns(config: Partial<Omit<ChronoraConfig, 'dateAdapter'>> = {}): EnvironmentProviders {
  return provideChronora({ ...config, dateAdapter: DateFnsDateAdapter });
}
