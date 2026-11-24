import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideMomentra } from '@momentra/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideMomentra({ locale: 'en-US', firstDayOfWeek: 1, theme: 'auto' }),
  ],
};
