# Accessibility

Accessibility is built into the components rather than added on top. This page lists what is implemented and what has and has not been verified.

## Verification status

- **Automated**: the test suite runs [axe-core](https://github.com/dequelabs/axe-core) over every component at rest, with validation errors, with each popup open, and in the month/year/decade views, and asserts keyboard and focus behaviour (`projects/chronora/src/lib/testing/a11y.spec.ts` and the per-component specs). axe found and we fixed one real problem during development (`role="alert"` on a list).
- **Contrast of the default palette**: `npm run check:contrast` computes WCAG 2.x ratios for the default light and dark colour pairs (text ≥ 4.5:1, input borders, focus ring and today ring ≥ 3:1). All pass; the script found three failures during development (input borders in both themes, the active preset in dark) that were fixed. This checks the *token values*, not rendered pixels, and custom palettes are yours to check.
- **Not verified**: axe's `color-contrast` rule is disabled in the tests (jsdom has no rendering), and **no testing with real screen readers** (NVDA, JAWS, VoiceOver, TalkBack) or in real browsers has been done yet. Treat the markup as following the WAI-ARIA Authoring Practices patterns, not as certified.

## Labelling

Every control needs an accessible name. Use one of:

```html
<label for="due">Due date</label>
<chr-date-picker inputId="due" />

<chr-date-picker ariaLabel="Due date" />
<chr-date-picker ariaLabelledby="heading-id" />
```

The range picker exposes a `group` named "Date range" (or your `ariaLabel`) containing inputs named "Start date" and "End date" (localized).

## Patterns used

| Piece | Semantics |
| --- | --- |
| Text input of a picker | `role="combobox"`, `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` (only while open), `aria-autocomplete="none"`, `aria-invalid`, `aria-describedby` → error region |
| Toggle button | `<button>` with a localized label, `aria-haspopup`, `aria-expanded`, `aria-controls` |
| Popup | `role="dialog"`, `aria-modal="true"`, labelled; `cdkTrapFocus` keeps Tab inside |
| Calendar grid | `<table role="grid">` named by its title; `<th scope="col" abbr>` weekday headers with the full name as label; `role="gridcell"` with `aria-selected`; each day is a `<button>` with a full-date label ("Monday, November 23, 2026"), `aria-current="date"` for today, `aria-disabled` for unavailable days |
| Calendar header | Previous/next buttons with specific labels ("Previous month", "Next decade", …); the title is a button announcing the view change (`aria-live="polite"`) |
| Time lists | `role="listbox"` per column (named Hours, Minutes, …) with `role="option"`, `aria-selected`, `aria-disabled`; roving `tabindex` |
| Validation messages | `role="alert"` region linked with `aria-describedby`, shown after the control is touched |
| Range hint | `aria-live="polite"` region announcing "Select the end date" |

## Keyboard

| Where | Keys |
| --- | --- |
| Field | `Alt+↓` opens the popup · `Esc` closes it · `↑`/`↓` step the value · `Enter` normalizes the text · `Tab` moves on |
| Calendar | `←` `→` previous/next day · `↑` `↓` previous/next week · `PageUp`/`PageDown` previous/next month (`Shift`: year) · `Home`/`End` start/end of the week · `Enter`/`Space` select · `Ctrl+↑` coarser view |
| Month / year / decade views | arrows move by 1 and by a row, `PageUp`/`PageDown` by the next unit, `Home`/`End` start/end of the period |
| Time lists | `↑` `↓` change and select · `Home`/`End` first/last · `←` `→` between lists · `Tab` leaves the lists |
| Popup | `Esc` closes and returns focus to the input; `Tab`/`Shift+Tab` cycle inside |

## Focus management

- Opening the popup moves focus to the active day (or the first time list); the calendar has exactly one tab stop.
- Closing with `Esc` or after a selection returns focus to the input.
- Closing by clicking elsewhere does **not** move focus back (the user chose to go elsewhere).
- The control is marked touched when the popup closes or the field blurs without a popup open, so focus moving *into* the popup does not trigger validation messages.
- Focus rings use `:focus-visible` with a configurable colour and a forced-colors fallback.

## Known gaps

No screen-reader testing; rendered contrast not verified; no right-to-left support; the calendar does not announce selection changes beyond the native button semantics and the grid's `aria-selected`; the AM/PM and hour lists are `listbox`es whose selection follows focus, which some screen readers announce verbosely.
