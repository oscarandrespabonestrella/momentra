# Changelog

All notable changes to `@momentra/angular` are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/), and the project follows [Semantic Versioning](https://semver.org/) (breaking changes may occur in minor releases while the version is `0.x`).

## [Unreleased]

### Added

- Docs app: Styling & theming section (Themes, CSS custom properties), AI & LLMs page, version badge and GitHub link in the header.
- `llms.txt`, `llms-full.txt` (also shipped in the npm package) and `AGENTS.md` for coding agents.
- CI and Release GitHub workflows; npm publishing via trusted publishing with provenance.
- Docs site on GitHub Pages (https://oscarandrespabonestrella.github.io/momentra/), linked from the README, the npm README, `llms.txt` and the package `homepage`; the header version badge links to npm.

### Changed

- **Renamed from Chronora to Momentra** before the first publish: package `@momentra/angular` (`/date-fns`, `/luxon`), `provideMomentra`, `MomentraSettings`, `MOMENTRA_*` tokens, `MomentraValidators`, `mtr-*` selectors, `--mtr-*` custom properties, `mtr*` validation error keys and the `mtrTheme` directive.

## [0.1.0-alpha.0] — pre-release

First feature set, first npm release (`next` dist-tag) as `@momentra/angular`.

### Added

- **Core**: generic `DateAdapter<TDate>` with `NativeDateAdapter` (default); optional `DateFnsDateAdapter` (`@momentra/angular/date-fns`) and `LuxonDateAdapter` with zone support (`@momentra/angular/luxon`); shared adapter contract tests.
- **Date/time model**: calendar-date vs date-time vs instant semantics, `CalendarDate`, ISO date helpers, `DateRange`.
- **Formatting and parsing** with one pattern language across adapters (`yyyy MM dd HH hh mm ss a MMMM MMM EEEE EEE`, quoted literals).
- **Components**: `mtr-date-input`, `mtr-date-picker`, `mtr-time-picker`, `mtr-datetime-picker`, `mtr-calendar` (day/month/year/decade views), `mtr-month-picker`, `mtr-year-picker`, `mtr-decade-picker`, `mtr-date-range-picker` (presets, min/max length, live preview, incomplete ranges).
- **Angular Forms**: `ControlValueAccessor` + `Validator` on every control; `MomentraValidators`; localized validation messages.
- **Configuration**: `provideMomentra()` (locale, formats, first day of week, theme, adapter, behaviours) with per-component overrides.
- **Localization**: `MomentraLocale`, built-in English and Spanish, `Intl`-derived locales, custom locales.
- **Theming**: light/dark/auto themes and documented `--mtr-*` custom properties; responsive layouts; forced-colors support.
- **Accessibility**: ARIA grid/listbox/combobox/dialog patterns, roving tabindex, focus trap and return, live regions; axe-core in the test suite; contrast check script for the default palette.
- **Tooling**: time-zone test matrix (`npm run test:tz`), compiled examples, package verification script.

### Known limitations

See the README. Notably: not yet verified in real browsers or with screen readers; range picker shows a single month; future-ready features (fiscal/holiday calendars, week/multiple selection, recurrence, business days) are design hooks only.
