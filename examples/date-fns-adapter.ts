import { ApplicationConfig } from '@angular/core';
import { chronoraLocaleFromDateFns, provideChronoraDateFns } from '@chronora/angular/date-fns';
import { fr } from 'date-fns/locale';

// Month and weekday names, the first day of the week and default formats come from date-fns.
const french = chronoraLocaleFromDateFns('fr-FR', fr);

export const appConfig: ApplicationConfig = {
  providers: [provideChronoraDateFns({ locale: french, locales: [french] })],
};
