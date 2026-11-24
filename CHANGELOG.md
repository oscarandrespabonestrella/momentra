# Changelog

All notable changes to `@chronora/angular` are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/), and the project follows [Semantic Versioning](https://semver.org/) (breaking changes may occur in minor releases while the version is `0.x`).

## [Unreleased]

## [0.1.0] — pre-release

First feature set.

### Added

- **Core**: generic `DateAdapter<TDate>` with `NativeDateAdapter` (default); optional `DateFnsDateAdapter` (`@chronora/angular/date-fns`) and `LuxonDateAdapter` with zone support (`@chronora/angular/luxon`); shared adapter contract tests.
- **Date/time model**: calendar-date vs date-time vs instant semantics, `CalendarDate`, ISO date helpers, `DateRange`.
- **Formatting and parsing** with one pattern language across adapters (`yyyy MM dd HH hh mm ss a MMMM MMM EEEE EEE`, quoted literals).
- **Components**: `chr-date-input`, `chr-date-picker`, `chr-time-picker`, `chr-datetime-picker`, `chr-calendar` (day/month/year/decade views), `chr-month-picker`, `chr-year-picker`, `chr-decade-picker`, `chr-date-range-picker` (presets, min/max length, live preview, incomplete ranges).
- **Angular Forms**: `ControlValueAccessor` + `Validator` on every control; `ChronoraValidators`; localized validation messages.
- **Configuration**: `provideChronora()` (locale, formats, first day of week, theme, adapter, behaviours) with per-component overrides.
- **Localization**: `ChronoraLocale`, built-in English and Spanish, `Intl`-derived locales, custom locales.
- **Theming**: light/dark/auto themes and documented `--chr-*` custom properties; responsive layouts; forced-colors support.
- **Accessibility**: ARIA grid/listbox/combobox/dialog patterns, roving tabindex, focus trap and return, live regions; axe-core in the test suite; contrast check script for the default palette.
- **Tooling**: time-zone test matrix (`npm run test:tz`), compiled examples, package verification script.

### Known limitations

See the README. Notably: not yet verified in real browsers or with screen readers; range picker shows a single month; future-ready features (fiscal/holiday calendars, week/multiple selection, recurrence, business days) are design hooks only.
