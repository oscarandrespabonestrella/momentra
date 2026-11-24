# Localization

Nothing user-visible is hard-coded in components: month and weekday names, default formats, the first day of the week, the AM/PM labels, every button label and ARIA label, and validation messages all come from a `MomentraLocale`.

## Choosing a locale

```ts
provideMomentra({ locale: 'es-ES' });                 // global
```

```html
<mtr-date-picker locale="de-DE" />                    <!-- per component -->
<mtr-date-picker [locale]="myLocale" />               <!-- or a locale object -->
```

A locale code is resolved in this order: locales registered with `provideMomentra({ locales })` → built-in `en-US` and `es-ES` → derived from `Intl` for any other tag.

### What `Intl`-derived locales provide

`createLocale('de-DE')` builds, from the platform's `Intl` implementation: month names (long/short), weekday names (long/short/narrow), the meridiem labels, the first day of the week, a numeric **date pattern** (`dd.MM.yyyy`) and whether the locale uses a 12- or 24-hour clock (`HH:mm` / `hh:mm a`). UI labels and validation messages are **English** unless you supply translations. Because this relies on the runtime's `Intl`, names can differ slightly between engines; use a fixed locale object where you need exact output (the built-in `en-US` is static for that reason).

## Defining a locale

```ts
import { EN_LABELS, createLocale, provideMomentra } from '@momentra/angular';

export const PORTUGUESE = createLocale('pt-BR', {
  firstDayOfWeek: 0,
  labels: { ...EN_LABELS, today: 'Hoje', clear: 'Limpar', done: 'Concluir' },
});

provideMomentra({ locale: 'pt-BR', locales: [PORTUGUESE] });
```

`createLocale(code, overrides)` returns a complete `MomentraLocale`; you can also write the object by hand. Fields:

| Field | Description |
| --- | --- |
| `code` | BCP-47 tag |
| `monthNames`, `monthNamesShort` | 12 names, January first |
| `weekdayNames`, `weekdayNamesShort`, `weekdayNamesNarrow` | 7 names, **Sunday first** |
| `meridiem` | `{ am, pm }` |
| `firstDayOfWeek` | 0–6 |
| `dateFormat`, `timeFormat`, `dateTimeFormat` | default [patterns](date-adapters.md#format-patterns) |
| `monthYearFormat` | calendar header, default `MMMM yyyy` |
| `longDateFormat` | text announced for each day cell, e.g. `EEEE, MMMM d, yyyy` |
| `labels` | `MomentraLabels`: `today`, `clear`, `done`, `now`, `openCalendar`, `previousMonth`, `hours`, … |
| `validationMessages` | `MomentraValidationMessages` templates |

`ES_ES_LOCALE` (with Spanish labels and messages, Monday-first) is exported as a complete reference. With date-fns, `momentraLocaleFromDateFns(code, dateFnsLocale)` builds names and formats from a date-fns locale.

## Overriding formats and week start

Precedence (highest first): component input (`format`, `dateFormat`, `timeFormat`, `firstDayOfWeek`, `locale`) → global `provideMomentra` option → locale. A global or component `dateFormat` also feeds the date-time pattern (`<dateFormat> <timeFormat>`) unless `dateTimeFormat`/`format` is set explicitly.

```html
<mtr-date-picker format="dd 'de' MMMM 'de' yyyy" locale="es-ES" />
<mtr-datetime-picker dateFormat="yyyy-MM-dd" hourFormat="24" />
```

## Parsing

Parsing is **pattern-based and locale-aware**: month/weekday names are matched case-insensitively in the locale's language, numeric fields are range-checked, and the text must match the whole pattern. It does not try several formats or understand free text. To accept more than one format, listen to the text yourself or normalise before writing the value.

## Not covered

Right-to-left layout, non-Gregorian calendars, and non-Latin numerals in typed input (digits must be ASCII `0–9`; patterns derived from `Intl` use `latn` numerals).
