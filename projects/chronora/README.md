# @chronora/angular

**Chronora — The Angular Date & Time Toolkit.** Accessible, themeable date pickers, calendars, time pickers, date-time pickers and date range components for Angular, with Angular Forms integration and pluggable date adapters (native `Date`, date-fns, Luxon).

```bash
npm install @chronora/angular @angular/cdk
```

```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from '@chronora/angular';

@Component({
  selector: 'app-example',
  imports: [FormsModule, DatePickerComponent],
  template: `<chr-date-picker [(ngModel)]="selectedDate" placeholder="Choose a date" ariaLabel="Date" />`,
})
export class ExampleComponent {
  selectedDate: Date | null = null;
}
```

Components: `chr-date-input`, `chr-date-picker`, `chr-time-picker`, `chr-datetime-picker`, `chr-calendar`, `chr-month-picker`, `chr-year-picker`, `chr-decade-picker`, `chr-date-range-picker`. Configure globally with `provideChronora({ locale, firstDayOfWeek, theme, … })`.

Optional entry points: `@chronora/angular/date-fns` and `@chronora/angular/luxon` (install `date-fns` / `luxon` only if you use them).

Peer dependencies: `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/cdk` (`^22.3.0`).

Full documentation, examples and known limitations: see the repository README and the `docs/` folder.

License: MIT
