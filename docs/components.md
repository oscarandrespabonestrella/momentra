# Component APIs

All components are standalone, `OnPush`, generic over the date type (`<TDate = Date>`), and use signal `input()`/`model()`/`output()`. Import them from `@chronora/angular`.

Two-way bindable members are `model()`s: `[(value)]`, `[(open)]`, `[(view)]`.

## Inputs shared by every control

Available on `chr-date-input`, `chr-date-picker`, `chr-time-picker`, `chr-datetime-picker`, `chr-date-range-picker`, `chr-calendar`, `chr-month-picker`, `chr-year-picker` and `chr-decade-picker`.

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Disables the control (also set by `control.disable()`). |
| `readonly` | `boolean` | `false` | Shows the value, blocks editing and opening popups. |
| `required` | `boolean` | `false` | An empty value reports `required`. |
| `locale` | `string \| ChronoraLocale` | global | Locale code or object. |
| `firstDayOfWeek` | `number` | locale's | 0 = Sunday … 6 = Saturday. |
| `errorMessages` | `Partial<ChronoraValidationMessages>` | — | Per-control message templates. |
| `showErrors` | `boolean` | `true` | Show validation messages once touched. |
| `ariaLabel` | `string` | — | Accessible name. |
| `ariaLabelledby` | `string` | — | Id(s) of labelling elements. |
| `inputId` | `string` | generated | Id of the inner `<input>` so `<label for>` works. |
| `theme` | `'light' \| 'dark' \| 'auto'` | global | Per-component theme. |

## `chr-date-input`

A text input for a calendar date. Value: `TDate | null` (local start of day).

| Input | Type | Description |
| --- | --- | --- |
| `value` (model) | `TDate \| null` | The date. |
| `format` | `string` | Pattern, default the locale's date format. |
| `min`, `max` | `TDate` | Bounds (whole days). |
| `disabledDates` | `(date) => boolean \| TDate[]` | Dates that cannot be entered. |
| `placeholder` | `string` | Default: global placeholder, else the pattern (`mm/dd/yyyy`). |
| `showClear` | `boolean` | Clear button; default global (`true`). |

Keyboard: `↑`/`↓` step the day (`Shift` month, `Ctrl` year); `Enter` normalizes the text. Typing an unparsable or impossible date sets `chrInvalidDate` and emits `null`; the text is kept for correction.

## `chr-date-picker`

`chr-date-input` plus a calendar popup. In addition:

| Input / Output | Type | Description |
| --- | --- | --- |
| `cellTemplate` | `TemplateRef<ChrCellContext<TDate>>` | Custom day content. |
| `showToday` | `boolean` | *Today* button (default global `true`). |
| `initialDate` | `TDate` | Month to show when there is no value. |
| `closeOnSelect` | `boolean` | Close after picking (default global `true`). |
| `open` (model) | `boolean` | Popup state. |
| `opened`, `closed` | `void` | Popup events. |
| `openPopup()`, `closePopup(restoreFocus?)`, `focusInput()` | methods | Programmatic control. |

Keyboard: `Alt+↓` opens; `Escape` closes and returns focus to the input; arrow keys, `PageUp`/`PageDown`, `Home`/`End` navigate the calendar; `Enter`/`Space` select.

## `chr-time-picker`

Value: a `TDate` whose **time of day** is the time. Its date part is the previous value's date, or `baseDate`.

| Input | Type | Description |
| --- | --- | --- |
| `format` | `string` | Explicit time pattern (`'HH:mm'`, `'h:mm a'`); wins over the two inputs below. |
| `hourFormat` | `12 \| 24` | Default: the locale's clock. |
| `showSeconds` | `boolean` | Default: what the pattern shows. |
| `hourStep`, `minuteStep`, `secondStep` | `number` | Intervals in the lists (default 1; invalid values fall back to 1). |
| `min`, `max` | `TDate` | Time-of-day limits (the date part is ignored). |
| `baseDate` | `TDate` | Date for values created from scratch (default today). |

The popup has `listbox` columns; `↑`/`↓`/`Home`/`End` change *and* select, `←`/`→` move between columns. *Now* snaps the current time to the steps; *Done* closes. Keyboard stepping in the text input moves minutes (`Shift` hours, `Ctrl` seconds). Inherits `open`, `opened`, `closed`, `placeholder`, `showClear`, `openPopup()`, `closePopup()`.

## `chr-datetime-picker`

Calendar and time lists in one popup. Value: local date-time.

| Input | Type | Description |
| --- | --- | --- |
| `format` | `string` | Full date-time pattern; overrides everything below. |
| `dateFormat`, `timeFormat` | `string` | Parts of the pattern. |
| `hourFormat`, `showSeconds`, `hourStep`, `minuteStep`, `secondStep` | | As in the time picker. |
| `min`, `max` | `TDate` | Exact date-times. Time lists restrict the time of day only on the boundary days. |
| `disabledDates`, `cellTemplate`, `showToday`, `initialDate` | | As in the date picker. |

Picking a day keeps the current time; changing the time keeps the day. The popup stays open until *Done*, `Escape` or an outside click (`closeOnSelect` does not apply).

## `chr-calendar`

| Input / Output | Type | Description |
| --- | --- | --- |
| `value` (model) | `TDate \| null` | Selected day. |
| `view` (model) | `'day' \| 'month' \| 'year' \| 'decade'` | Displayed view. |
| `selectionView` | same | View in which a click *selects*; coarser views drill down. Default `'day'`. |
| `min`, `max` | `TDate` | Bounds; navigation arrows disable at the edges. |
| `disabledDates` | `(date) => boolean \| TDate[]` | Unselectable days. |
| `range` | `{ start: TDate \| null; end: TDate \| null }` | Highlighted range (partial ranges allowed). |
| `cellTemplate` | `TemplateRef<ChrCellContext<TDate>>` | Context: `$implicit: CalendarCell`, `view`. |
| `initialDate` | `TDate` | Date shown when there is no value. |
| `showToday`, `fixedWeeks` | `boolean` | Defaults from global config. |
| `dateSelect` | `TDate` | A date was picked in the selection view. |
| `dateHover` | `TDate \| null` | Day under pointer/focus (day view), `null` on leave. |
| `activeDateChange` | `TDate` | Keyboard focus moved. |
| `focusActiveCell()` | method | Move DOM focus into the grid. |

Keyboard (day view): `←→↑↓` day/week, `PageUp`/`PageDown` month (`Shift` year), `Home`/`End` start/end of week, `Ctrl+↑` coarser view, `Enter`/`Space` select. Month view moves by month and 3 months, year view by year and 4 years, decade view by 10 and 40 years.

`CalendarCell`: `date`, `label`, `ariaLabel`, `disabled`, `selected`, `active`, `today`, `outside`, `inRange`, `rangeStart`, `rangeEnd`, `key`.

## `chr-month-picker`, `chr-year-picker`, `chr-decade-picker`

A calendar locked to `selectionView` `'month'`, `'year'` or `'decade'`. Value: the **first day of the selected period** (first of the month; 1 January; 1 January of the decade's first year). Inputs: `value` (model), `min`, `max`, `showToday`, plus the shared inputs. A period is disabled when it lies entirely outside `min`/`max`.

## `chr-date-range-picker`

Value: `DateRange<TDate>` = `{ start: TDate | null; end: TDate | null }` (both local start of day). `null` written by a form becomes an empty range.

| Input / Output | Type | Description |
| --- | --- | --- |
| `value` (model) | `DateRange<TDate>` | The range; may be incomplete. |
| `min`, `max` | `TDate` | Bounds for both ends. |
| `minRangeLength`, `maxRangeLength` | `number` | Days spanned, inclusive (a one-day range is 1). |
| `disabledDates` | `(date) => boolean \| TDate[]` | Days that cannot be part of a range. |
| `presets` | `DateRangePreset<TDate>[]` | `{ label, range }`; `range` may be a function evaluated on use. Presets that violate the constraints are disabled. |
| `format`, `placeholder` | `string` | For both inputs. |
| `cellTemplate`, `showToday`, `showClear`, `closeOnSelect`, `initialDate` | | As elsewhere. |
| `open` (model), `opened`, `closed` | | Popup state and events. |
| `openPopup()`, `closePopup(restoreFocus?)`, `focusStart()` | methods | |

Selecting: the first click sets `start` (the value becomes an **incomplete range**, reported as `chrRangeIncomplete`); the second click on or after `start` completes it; a click before `start` restarts it; a click after a complete range starts a new one. Hovering or keyboard-focusing days previews the range. While the end is chosen, days that would break the length limits are disabled.

Helpers: `pickRangeDate`, `isSameRange`, `createPreset`, `lastDaysRange(adapter, n)`, `thisWeekRange(adapter, firstDayOfWeek)`, `thisMonthRange`, `lastMonthRange`, `resolvePreset`, `emptyRange`, `isCompleteRange`.

## Global configuration

`provideChronora(config)` — all options are optional.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `locale` | `string \| ChronoraLocale` | `'en-US'` | Code (built-in, registered or `Intl`) or object. |
| `locales` | `ChronoraLocale[]` | `[]` | Registers locales addressable by code. |
| `dateFormat`, `timeFormat`, `dateTimeFormat` | `string` | locale's | Override the locale's patterns. |
| `firstDayOfWeek` | `number` | locale's | |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | |
| `placeholder` | `string` | pattern | Placeholder for text inputs. |
| `dateAdapter` | `Type<DateAdapter<unknown>>` | `NativeDateAdapter` | |
| `showTodayButton` | `boolean` | `true` | |
| `showClearButton` | `boolean` | `true` | |
| `closeOnSelect` | `boolean` | `true` | Date picker and range picker. |
| `fixedWeeks` | `boolean` | `false` | Always six weeks in the day view. |
| `validationMessages` | `Partial<ChronoraValidationMessages>` | — | Message templates. |

Precedence for the effective locale of a component: component inputs → global config → locale object.

## Events and outputs summary

| Output | Components |
| --- | --- |
| `valueChange` | every control with a `value` model (`[(value)]`) |
| `viewChange` | `chr-calendar` (`[(view)]`) |
| `openChange` | pickers with a popup (`[(open)]`) |
| `opened`, `closed` | pickers with a popup |
| `dateSelect`, `dateHover`, `activeDateChange` | `chr-calendar` |

Changes to a control's value are also delivered through Angular Forms (`valueChanges`, `ngModelChange`).
