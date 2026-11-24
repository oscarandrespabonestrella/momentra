import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideChronora, ES_ES_LOCALE } from '@chronora/angular';
import { App } from './app/app';
import { routes } from './app/routes';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    // ponytail: ES locale registered globally so pages can switch by code; theme is per-demo.
    provideChronora({ locales: [ES_ES_LOCALE] }),
  ],
}).catch(console.error);
