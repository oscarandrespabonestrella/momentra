import { ApplicationConfig, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DatePickerComponent, DateTimePickerComponent } from '@chronora/angular';
import { provideChronoraLuxon } from '@chronora/angular/luxon';
import { DateTime } from 'luxon';

export const appConfig: ApplicationConfig = {
  // Calendar fields are read and written in Madrid, whatever the user's system zone is.
  providers: [provideChronoraLuxon({ locale: 'es-ES' }, { zone: 'Europe/Madrid' })],
};

@Component({
  selector: 'app-luxon-example',
  imports: [ReactiveFormsModule, DatePickerComponent, DateTimePickerComponent],
  template: `
    <chr-date-picker ariaLabel="Date" [formControl]="date" />
    <chr-datetime-picker ariaLabel="Meeting" [formControl]="meeting" />
  `,
})
export class LuxonExample {
  readonly date = new FormControl<DateTime | null>(null);
  readonly meeting = new FormControl<DateTime | null>(DateTime.fromISO('2026-11-23T09:30', { zone: 'Europe/Madrid' }));
}
