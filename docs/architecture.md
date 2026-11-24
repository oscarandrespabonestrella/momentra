# Architecture

Momentra separates **what a date is and how it behaves** (the core) from **how it is presented** (Angular components).

```text
projects/momentra/src/lib/
├── core/
│   ├── adapters/     DateAdapter<TDate> (abstract) and NativeDateAdapter
│   ├── models/       CalendarDate, DateRange, value-kind documentation
│   ├── config/       MomentraConfig, provideMomentra()
│   ├── tokens/       MOMENTRA_CONFIG, MOMENTRA_DATE_ADAPTER, MOMENTRA_LOCALES
│   ├── services/     MomentraSettings (resolved config + locale lookup)
│   ├── validators/   validation rules (pure) + MomentraValidators (Angular ValidatorFn)
│   ├── utils/        calendar-engine, time-engine, range-utils, disabled-dates (pure, no Angular)
│   └── forms/        MomentraFormControl: ControlValueAccessor + Validator plumbing
├── formatting/       format-pattern: the pattern formatter/parser shared by all adapters
├── localization/     MomentraLocale, EN/ES locales, createLocale()
├── theming/          design tokens (SCSS), MtrThemeDirective
├── calendar/         CalendarComponent, MonthPicker, YearPicker, DecadePicker
├── inputs/           DateInput, DatePicker, TimePicker, DateTimePicker + shared building blocks
└── ranges/           DateRangePicker
```

`projects/momentra/date-fns` and `projects/momentra/luxon` are secondary entry points. They import the primary package; the primary package never imports them, so `date-fns` and `luxon` stay optional.

## Layers and dependency direction

```text
components  →  core/forms, core/utils, core/validators  →  core/adapters  →  formatting, localization
```

- **Pure core.** `calendar-engine`, `time-engine`, `range-utils`, `validation` and `format-pattern` do not import Angular (validation imports only the *type* `ValidationErrors`). They are tested without a `TestBed`.
- **No date logic in components.** Components never call `Date` methods. Every operation goes through the injected `DateAdapter`.
- **No circular dependencies.** Types flow downward; `tokens.ts` imports configuration *types* only.

## The date adapter

`DateAdapter<TDate>` is an abstract class with a **small set of primitives** (create, read fields, `addDays`, `toTimestamp`, `deserialize`, validity) and a large set of **derived operations** implemented once on top of them: month/year arithmetic with clamping, comparisons, boundaries, calendar weeks, time setters, and — importantly — **formatting and parsing**. Because formatting/parsing live in the base class (`formatting/format-pattern.ts`), the three adapters produce identical text and accept identical input. Adapter authors implement ~20 primitives; see [Date adapters](date-adapters.md).

A shared contract suite (`testing/adapter-contract.ts`) runs against every adapter, which is how adapters are kept behaviourally identical.

## Calendar engine

`calendar-engine.ts` turns *(adapter, locale, rules, selected/active/range)* into a plain view model:

- `buildDayView`, `buildMonthView`, `buildYearView`, `buildDecadeView` → rows of `CalendarCell`s (`selected`, `active`, `today`, `outside`, `disabled`, `inRange`, `rangeStart`, `rangeEnd`, labels).
- `moveFocus` maps a navigation key to the next date for each view; `shiftView` pages; `drillUpView`/`drillDownView` change granularity.

`CalendarComponent` is a thin shell around this: it holds the active date and view as signals, renders the view model, and handles input events. The month, year and decade pickers are `CalendarComponent` locked to a `selectionView`, so all four share one implementation. The range picker feeds the calendar a highlighted range and reacts to its `dateSelect` and `dateHover` outputs.

## Forms integration

`MomentraFormControl<TDate, TValue>` (an abstract `@Directive()`) is the single implementation of:

- `ControlValueAccessor` (`writeValue`, `registerOnChange/Touched`, `setDisabledState`),
- `Validator` (including re-validation when rule inputs such as `min` change),
- the shared inputs (`disabled`, `readonly`, `required`, `locale`, `firstDayOfWeek`, `errorMessages`, `showErrors`, `ariaLabel`, `ariaLabelledby`, `inputId`) and visible error messages.

On top of it, `MomentraTextControl` adds text ⇄ value synchronisation, and `MomentraPopupControl` adds the overlay popup. Components register themselves with `provideMomentraControl(() => Component)`, which provides both `NG_VALUE_ACCESSOR` and `NG_VALIDATORS`.

Decision: the components **provide validators themselves** rather than injecting `NgControl`. Injecting `NgControl` into a value accessor is circular with `NG_VALIDATORS`; providing the validator avoids it, and means validation works identically for `formControl`, `formControlName` and `ngModel`. The trade-off is that a component cannot see validators attached to the *control* (for example `Validators.required` on the `FormControl`) when deciding whether to display an error message; it shows messages for its own rules (`required` input, `min`, `max`, …). Use the `required` input when you want the message displayed.

## Configuration and state

`provideMomentra()` returns `EnvironmentProviders` with a frozen config object. `MomentraSettings` resolves it, and resolves locales (registered → built-in → `Intl`-derived). Components override any setting through inputs (`locale`, `format`, `firstDayOfWeek`, `theme`, …). All reactive state inside components is signals; there are no module-level mutable singletons (the only module-level state is a monotonically increasing id counter and a pattern-tokenizer cache).

## Popups

Popups use the Angular CDK `CdkConnectedOverlay`, anchored to the field (`<mtr-field>`), with four fallback positions and viewport push. Focus management is explicit: focus moves into the popup (the active day or the first list) when it attaches, `CdkTrapFocus` keeps Tab inside, and Escape or a selection closes it and returns focus to the input. An outside click closes it *without* stealing focus.

## Styling

Each component has its own SCSS (view encapsulation). Design tokens live in `theming/_tokens.scss` as `--_mtr-*` private custom properties that fall back from public `--mtr-*` properties, with separate light and dark defaults. See [Styling and themes](styling-and-themes.md).

## Extension points

Implemented hooks that future features build on:

| Future feature | Hook that exists today |
| --- | --- |
| Other calendar systems, timezone-aware workflows | `DateAdapter<TDate>` is generic over the date type; `LuxonDateAdapter({ zone })` is zone-aware |
| Holiday calendars, date exclusions, business-day restrictions | `disabledDates` (predicate or list) on every date control; `isDisabled` in the validation rules |
| Custom date templates | `cellTemplate` input on the calendar and pickers (context: `MtrCellContext`) |
| Presets / shortcuts | `presets` on the range picker, `createPreset`, `lastDaysRange`, … |
| Custom restrictions | custom `ValidatorFn`s compose with the built-in ones |
| Custom locale / formatting | `MomentraLocale` objects, `createLocale()`, per-component `format` |

**Not implemented:** fiscal calendars, built-in holiday data, week selection, multiple-date selection, recurring selections, business-day arithmetic and custom calendar headers. Adding them would mostly mean new view builders in `calendar-engine.ts` and a new selection model, without changing the adapter or the forms plumbing.
