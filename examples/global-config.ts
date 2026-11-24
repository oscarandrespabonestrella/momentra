import { ApplicationConfig } from '@angular/core';
import { EN_LABELS, createLocale, provideMomentra } from '@momentra/angular';

/** A custom locale: Intl-derived names and formats, with the UI strings translated. */
export const PORTUGUESE = createLocale('pt-BR', {
  firstDayOfWeek: 0,
  labels: {
    ...EN_LABELS, // start from a complete set of labels, then translate what you need
    today: 'Hoje',
    clear: 'Limpar',
    done: 'Concluir',
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideMomentra({
      locale: 'pt-BR',
      locales: [PORTUGUESE],
      theme: 'auto',
      firstDayOfWeek: 1,
      dateFormat: 'dd/MM/yyyy',
      showTodayButton: true,
      closeOnSelect: true,
      validationMessages: { required: 'Campo obrigatório.' },
    }),
  ],
};
