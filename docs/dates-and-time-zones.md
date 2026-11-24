# Dates and time zones

A JavaScript `Date` is an **absolute instant** (milliseconds since the UTC epoch). It has no "date only" type, and its default serialization (`toISOString()`) converts to UTC. That is how a birthday of 15 March silently becomes 14 March for users west of Greenwich. Chronora makes the distinction explicit.

## Four kinds of value

| Kind | Example | Meaning | Chronora representation |
| --- | --- | --- | --- |
| `calendar-date` | birthday, due date | a day on the calendar, no time, no zone | `CalendarDate` (`{ year, month, day }`) or ISO `yyyy-MM-dd` |
| `local-datetime` | "appointment at 09:30" | wall-clock fields, interpreted in the viewer's/adapter's zone | `Date`/`DateTime` created from local fields |
| `instant` | "event happened at …" | a point in time | `Date.getTime()`, ISO string with offset |
| `zoned-datetime` | "09:30 in Madrid" | instant + IANA zone | Luxon `DateTime` via `LuxonDateAdapter({ zone })` |

The type `ChronoraValueKind` and the functions in `core/models/calendar-date.ts` document and support this.

## How the components behave

- **Date-only controls** (`chr-date-input`, `chr-date-picker`, `chr-calendar`, `chr-month/year/decade-picker`, the range picker) emit the **local start of the selected day** — a `Date` at 00:00:00.000 in the local zone — and read only the local calendar fields (`getFullYear()`, `getMonth()`, `getDate()`). They never convert through UTC, so the selected day cannot shift because of a time-zone offset, in any zone (the test suite runs in eight zones, including +14:00 and −11:00).
- **Date-time controls** (`chr-datetime-picker`, `chr-time-picker`) emit **local date-time** values: the wall-clock fields you see are the fields of the value. `chr-time-picker` keeps the date of the previous value (or `baseDate`, default today) and changes only the time of day.
- **Writing values in.** Controls accept adapter dates, epoch milliseconds and ISO strings. A **bare `yyyy-MM-dd` string is read as that calendar day** (local midnight), not as UTC midnight — `new Date('2026-03-15')` would be UTC midnight and would show 14 March in the Americas; Chronora does not do that. Impossible dates (`'2026-02-30'`) become `null`. Strings with a time and offset (`2026-03-15T10:00:00Z`) are instants and are converted to the local zone.
- **Comparisons.** `min`/`max` on date-only controls compare **whole days** (a `min` of 10 Nov 15:00 still allows any time on 10 Nov). `chr-datetime-picker` compares exact date-times. `chr-time-picker` compares time of day only.
- **Daylight saving time.** `addDays` keeps the wall-clock time (`Date#setDate`), and day differences are computed from calendar fields, so a "day" is always one calendar day even when it is 23 or 25 hours long. A wall-clock time that does not exist (the hour skipped at the start of DST) is shifted by the platform, as `Date` always does.

## Persisting calendar dates

Do **not** serialize a date-only `Date` with `toISOString()` or `JSON.stringify`, which convert to UTC:

```ts
import { formatIsoDate, parseIsoDate, type CalendarDate } from '@chronora/angular';

// out: Date (local midnight) → 'yyyy-MM-dd'
const day: CalendarDate = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
const text = formatIsoDate(day); // '2026-03-15'

// in: 'yyyy-MM-dd' → a control (or adapter.deserialize(text))
control.setValue(text as never); // controls accept ISO date strings
const parsed = parseIsoDate(text); // CalendarDate | null
```

(`CalendarDate.month` is zero-based, like `Date`.)

## Zone-aware workflows

Use `LuxonDateAdapter({ zone })` (see [Date adapters](date-adapters.md)). Calendar fields are then the fields in that zone regardless of the user's system zone, and `DateTime` values keep their zone. The native adapter always works in the system zone; Chronora does not emulate other zones on top of `Date`.

## Testing across zones

```bash
npm run test:tz                         # eight zones
npm run test:tz -- UTC Asia/Tokyo       # chosen zones
```

`core/adapters/timezone.spec.ts` sweeps two years of days for DST-safe stepping, every month's calendar weeks, and ISO round-trips; the adapter contract suite runs for Luxon in UTC and `Pacific/Auckland`.
