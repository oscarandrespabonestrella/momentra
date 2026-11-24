# Chronora — The Angular Date & Time Toolkit

Chronora is a modern, extensible Angular date and time component library providing beautiful, accessible, and highly configurable date pickers, calendars, time pickers, date-time pickers, and date range components.

- **Package:** `@chronora/angular` · **Selector prefix:** `chr` · **Angular:** 22 (standalone components, signals, OnPush)
- **No UI framework dependency.** Chronora owns its components and styling. It needs only Angular and the Angular CDK (overlay and a11y utilities).
- **Bring your own date library.** The core talks to a `DateAdapter<TDate>`; native `Date` is the default, with optional date-fns and Luxon adapters in separate entry points.

> **Status: 0.1.0, pre-release.** The library is feature-complete for the scope listed below, is covered by an automated test suite, and builds and installs from the packed tarball. It has been tested in jsdom, not yet in real browsers or with real screen readers — see [Known limitations](#known-limitations) before using it in production.

## Features

| Component | Selector | What it does |
| --- | --- | --- |
| `DateInputComponent` | `<chr-date-input>` | Text input: configurable format, parsing, validation, clear button, arrow-key stepping |
| `DatePickerComponent` | `<chr-date-picker>` | Date input + calendar popup, min/max, disabled dates, Today/Clear, custom day templates |
| `TimePickerComponent` | `<chr-time-picker>` | Hour/minute/(second)/AM-PM lists, 12/24-hour clock, intervals, min/max time |
| `DateTimePickerComponent` | `<chr-datetime-picker>` | Calendar and time lists in one popup, separate date/time formats |
| `CalendarComponent` | `<chr-calendar>` | Day, month, year and decade views, keyboard navigation, custom cell templates |
| `MonthPickerComponent` | `<chr-month-picker>` | Select a month |
| `YearPickerComponent` | `<chr-year-picker>` | Select a year |
| `DecadePickerComponent` | `<chr-decade-picker>` | Select a decade |
| `DateRangePickerComponent` | `<chr-date-range-picker>` | Start/end with live highlighting, presets, min/max length, incomplete ranges |

Across the library:

- **Angular Forms**: every input is a `ControlValueAccessor` *and* a `Validator`; works with `formControl`, `formControlName` and `ngModel`; honours disabled/touched/dirty state.
- **Validation**: `ChronoraValidators` (`minDate`, `maxDate`, `dateRange`, `minTime`, `minRangeLength`, …) plus rules the components apply on their own, with localizable messages.
- **Localization**: locales for any `Intl` tag, a built-in English and Spanish locale, custom locale objects, per-component overrides.
- **Theming**: light, dark and `auto` themes driven by documented `--chr-*` CSS custom properties.
- **Accessibility**: ARIA grid/listbox/combobox/dialog patterns, roving tabindex, focus trap and focus return, live regions, checked with axe-core in the test suite.
- **Time-zone safe**: calendar dates never pass through UTC; see [Dates and time zones](docs/dates-and-time-zones.md).

## Installation

```bash
npm install @chronora/angular @angular/cdk
```

Peer dependencies: `@angular/core`, `@angular/common`, `@angular/forms` and `@angular/cdk` (all `^22.3.0`). `date-fns` and `luxon` are **optional** peers, needed only if you import `@chronora/angular/date-fns` or `@chronora/angular/luxon`.

## Quick start

```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from '@chronora/angular';

@Component({
  selector: 'app-basic-date-picker',
  imports: [FormsModule, DatePickerComponent],
  template: `
    <chr-date-picker [(ngModel)]="selectedDate" placeholder="Choose a date" ariaLabel="Delivery date" />
    <p>Selected: {{ selectedDate?.toDateString() ?? 'nothing' }}</p>
  `,
})
export class BasicDatePickerExample {
  selectedDate: Date | null = null;
}
```

Reactive forms, with validators (`examples/reactive-form.ts`):

```ts
readonly form = new FormGroup({
  birthday: new FormControl<Date | null>(null, [Validators.required, ChronoraValidators.maxDate(() => new Date())]),
  dueDate: new FormControl<Date | null>(null, ChronoraValidators.minDate(() => new Date())),
  startTime: new FormControl<Date | null>(null),
  appointment: new FormControl<Date | null>(null, Validators.required),
});
```

```html
<chr-date-input inputId="birthday" formControlName="birthday" format="dd/MM/yyyy" />
<chr-date-picker ariaLabel="Due date" formControlName="dueDate" [min]="today" />
<chr-time-picker ariaLabel="Start time" formControlName="startTime" [hourFormat]="24" [minuteStep]="15" />
<chr-datetime-picker ariaLabel="Appointment" formControlName="appointment" [minuteStep]="30" />
```

A date range with presets (`examples/date-range-with-presets.ts`):

```html
<chr-date-range-picker ariaLabel="Stay" [formControl]="stay" [presets]="presets"
                       [minRangeLength]="2" [maxRangeLength]="30" [min]="today" />
```

> Give every control an accessible name: either a visible `<label for>` pointing at `inputId`, or `ariaLabel` / `ariaLabelledby`.

All examples in [`examples/`](examples) are compiled with the Angular compiler in strict mode (`npm run examples:check`).

## Configuration

```ts
import { provideChronora } from '@chronora/angular';

bootstrapApplication(App, {
  providers: [
    provideChronora({
      locale: 'es-ES',      // any Intl tag, 'en-US' (default), 'es-ES', or a registered/custom locale
      firstDayOfWeek: 1,    // 0 = Sunday … 6 = Saturday; defaults to the locale's
      theme: 'auto',        // 'light' | 'dark' | 'auto'
      dateFormat: 'dd/MM/yyyy',
    }),
  ],
});
```

Every option, and how components override them, is in [Component APIs](docs/components.md#global-configuration). Configuration is immutable and provided through Angular DI; there is no global mutable state.

## Theming

Components read `--chr-*` CSS custom properties with light/dark defaults:

```css
:root {
  --chr-primary: #0f766e;
  --chr-radius: 12px;
}
```

Set theme variables on `:root` (or `body`), because popups render in the CDK overlay container. See [Styling and themes](docs/styling-and-themes.md).

## Date adapters

```ts
import { provideChronoraLuxon } from '@chronora/angular/luxon';

providers: [provideChronoraLuxon({ locale: 'es-ES' }, { zone: 'Europe/Madrid' })];
```

See [Date adapters](docs/date-adapters.md) for the native, date-fns and Luxon adapters and for writing your own.

## Documentation

- [Architecture](docs/architecture.md)
- [Date adapters](docs/date-adapters.md)
- [Dates and time zones](docs/dates-and-time-zones.md)
- [Component APIs](docs/components.md) — inputs, outputs, methods
- [Validation](docs/validation.md)
- [Localization](docs/localization.md)
- [Styling and themes](docs/styling-and-themes.md)
- [Accessibility](docs/accessibility.md)
- [Contributing](CONTRIBUTING.md) · [Release and publishing](docs/release-and-publishing.md) · [Changelog](CHANGELOG.md)

## Browser compatibility

Chronora targets the evergreen browsers supported by Angular 22 (current Chrome, Edge, Firefox and Safari). Its styles use CSS custom properties, `:focus-visible`, `color-mix()`, `prefers-color-scheme` and `forced-colors` media queries. The test suite runs in jsdom; real-browser verification is listed under [Known limitations](#known-limitations).

## Development

```bash
npm install
npm test                # unit tests (Vitest, jsdom)
npm run test:tz         # unit tests in 8 time zones
npm run examples:check  # compile the examples with the Angular compiler (strict templates)
npm run build           # production library build -> dist/chronora
npm run verify:package  # build, npm pack, install into a fresh Angular app, build that app
npm run check           # tests + examples + build
```

Workspace layout:

```text
projects/chronora/src/lib/   core/ inputs/ calendar/ ranges/ formatting/ localization/ theming/ testing/
projects/chronora/date-fns/  optional date-fns entry point (@chronora/angular/date-fns)
projects/chronora/luxon/     optional Luxon entry point (@chronora/angular/luxon)
docs/  examples/  scripts/
```

## Known limitations

- **Not yet verified in real browsers or with screen readers.** Automated checks (axe-core, keyboard and ARIA assertions) run in jsdom, which has no layout or colour engine: colour contrast, popup positioning and responsive CSS have not been visually verified, and no assistive technology has been tried.
- The range picker shows one month at a time (no side-by-side months).
- While the end of a range is being chosen, days that would break `minRangeLength`/`maxRangeLength` are disabled; to restart with a later day, clear the range or edit the start input.
- Popups render in the CDK overlay container, so theme variables must be set on `:root`/`body`, not on an arbitrary ancestor.
- The future-ready features (fiscal/holiday calendars, week and multiple-date selection, recurring selections, business-day calculations) are **not implemented**; see [Architecture](docs/architecture.md#extension-points) for what the design already supports.
- Locale-aware parsing works through the locale's patterns and names; it does not guess formats and does not parse free-form text ("next friday").
- Right-to-left layouts are not specially handled.

## License

MIT — see [LICENSE](LICENSE).
