import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideChronora } from '@chronora/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideChronora({ locale: 'en-US', firstDayOfWeek: 1, theme: 'auto' }),
  ],
};
