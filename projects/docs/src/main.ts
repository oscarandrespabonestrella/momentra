import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideMomentra, ES_ES_LOCALE } from '@momentra/angular';
import { App } from './app/app';
import { routes } from './app/routes';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    // ponytail: ES locale registered globally so pages can switch by code; theme is per-demo.
    provideMomentra({ locales: [ES_ES_LOCALE] }),
  ],
}).catch(console.error);
