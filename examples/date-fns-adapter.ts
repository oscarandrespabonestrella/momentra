import { ApplicationConfig } from '@angular/core';
import { momentraLocaleFromDateFns, provideMomentraDateFns } from '@momentra/angular/date-fns';
import { fr } from 'date-fns/locale';

// Month and weekday names, the first day of the week and default formats come from date-fns.
const french = momentraLocaleFromDateFns('fr-FR', fr);

export const appConfig: ApplicationConfig = {
  providers: [provideMomentraDateFns({ locale: french, locales: [french] })],
};
