# momentra

**Momentra — The Angular Date & Time Toolkit.** Accessible, themeable date pickers, calendars, time pickers, date-time pickers and date range components for Angular, with Angular Forms integration and pluggable date adapters (native `Date`, date-fns, Luxon).

```bash
npm install @momentra/angular @angular/cdk
```

```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from '@momentra/angular';

@Component({
  selector: 'app-example',
  imports: [FormsModule, DatePickerComponent],
  template: `<mtr-date-picker [(ngModel)]="selectedDate" placeholder="Choose a date" ariaLabel="Date" />`,
})
export class ExampleComponent {
  selectedDate: Date | null = null;
}
```

Components: `mtr-date-input`, `mtr-date-picker`, `mtr-time-picker`, `mtr-datetime-picker`, `mtr-calendar`, `mtr-month-picker`, `mtr-year-picker`, `mtr-decade-picker`, `mtr-date-range-picker`. Configure globally with `provideMomentra({ locale, firstDayOfWeek, theme, … })`.

Optional entry points: `@momentra/angular/date-fns` and `@momentra/angular/luxon` (install `date-fns` / `luxon` only if you use them).

Peer dependencies: `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/cdk` (`^22.3.0`).

Status: pre-release, published to the `next` dist-tag (`npm i @momentra/angular@next`). Tested in jsdom, not yet in real browsers or with screen readers.

- [Repository and full README](https://github.com/oscarandrespabonestrella/momentra#readme), including known limitations
- [Component APIs](https://github.com/oscarandrespabonestrella/momentra/blob/main/docs/components.md) · [Styling and themes](https://github.com/oscarandrespabonestrella/momentra/blob/main/docs/styling-and-themes.md) · [Examples](https://github.com/oscarandrespabonestrella/momentra/tree/main/examples)
- [Changelog](https://github.com/oscarandrespabonestrella/momentra/blob/main/CHANGELOG.md) · [Issues](https://github.com/oscarandrespabonestrella/momentra/issues)

**For AI coding agents:** this package ships `llms.txt` (summary) and `llms-full.txt` (complete docs) next to this README in `node_modules/@momentra/angular/`.

License: MIT
