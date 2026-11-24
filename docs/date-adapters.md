# Date adapters

Momentra never touches a concrete date type. Every component injects `MOMENTRA_DATE_ADAPTER` (a `DateAdapter<TDate>`) and the value type of the controls is that adapter's `TDate`.

| Adapter | Import | `TDate` | Notes |
| --- | --- | --- | --- |
| `NativeDateAdapter` | `@momentra/angular` | `Date` | **Default.** Local time zone. |
| `DateFnsDateAdapter` | `@momentra/angular/date-fns` | `Date` | Arithmetic, boundaries and comparisons via date-fns; strings parsed with `parseISO`. Requires `date-fns@^4`. |
| `LuxonDateAdapter` | `@momentra/angular/luxon` | `DateTime` | Optional fixed IANA zone. Requires `luxon@^3`. |

`date-fns` and `luxon` are *optional peer dependencies*: you only need them if you import those entry points.

## Choosing an adapter

```ts
// native Date (default): nothing to configure
provideMomentra({ locale: 'en-US' });

// date-fns
import { provideMomentraDateFns } from '@momentra/angular/date-fns';
provideMomentraDateFns({ locale: 'en-GB' });

// Luxon, in a fixed zone
import { provideMomentraLuxon } from '@momentra/angular/luxon';
provideMomentraLuxon({ locale: 'es-ES' }, { zone: 'Europe/Madrid' });

// any adapter class
provideMomentra({ dateAdapter: MyAdapter });
```

Components are generic over the date type (`DatePickerComponent<TDate = Date>`), so with Luxon `FormControl<DateTime | null>` type-checks (see `examples/luxon-adapter.ts`).

### date-fns locales

```ts
import { momentraLocaleFromDateFns, provideMomentraDateFns } from '@momentra/angular/date-fns';
import { fr } from 'date-fns/locale';

const french = momentraLocaleFromDateFns('fr-FR', fr);
provideMomentraDateFns({ locale: french, locales: [french] });
```

`momentraLocaleFromDateFns` takes month/weekday names, the first day of the week and the short date/time formats from the date-fns locale; UI strings stay English unless you pass `labels` in the third argument.

### Luxon zones

With `{ zone }`, dates are created and read in that zone: the calendar shows the *zone's* calendar fields whatever the user's system zone is, a bare ISO date (`'2026-03-15'`) is that day in the zone, and instants (`Date`, epoch milliseconds, ISO strings with offsets) are converted into the zone when written to a control. Without `zone`, the system zone is used.

## The adapter API

Months are **zero-based** (0 = January) and weekdays are 0 = Sunday … 6 = Saturday, like `Date`. Adapter values are treated as immutable.

| Group | Members |
| --- | --- |
| Creation | `now()`, `today()`, `create(y, m, d, h?, mi?, s?, ms?)`, `clone`, `invalid()`, `isValid`, `deserialize(value)` |
| Reading | `getYear`, `getMonth`, `getDate`, `getDayOfWeek`, `getHours`, `getMinutes`, `getSeconds`, `getMilliseconds`, `toTimestamp`, `toParts` |
| Arithmetic | `addDays`/`subtractDays`, `addMonths`/`subtractMonths`, `addYears`/`subtractYears` |
| Comparison | `compare`, `isEqual`, `isSameDay`, `isSameMonth`, `isSameYear`, `isBefore`, `isAfter`, `isBetween`, `clamp`, `differenceInDays` |
| Boundaries | `startOfDay`, `endOfDay`, `startOfMonth`, `endOfMonth`, `startOfYear`, `endOfYear`, `startOfWeek`, `endOfWeek` |
| Calendar | `getDaysInMonth`, `getFirstDayOfMonth`, `getLastDayOfMonth`, `getFirstDayOfWeek`, `getCalendarWeeks(date, firstDayOfWeek, fixedWeeks?)` |
| Time | `setHours`, `setMinutes`, `setSeconds`, `withTime`, `combine(day, time)`, `secondsOfDay` |
| Formatting | `format(date, pattern, locale)`, `formatDate`, `formatTime`, `formatDateTime`, `formatMonthYear`, `formatWeekday` |
| Parsing | `parse(text, pattern, locale, base?)` |

Semantics worth knowing:

- `create` **never rolls over**: `create(2026, 1, 30)` (30 February) or hour 24 returns an *invalid* date (`isValid` is `false`).
- `addMonths`/`addYears` **clamp**: 31 Jan + 1 month = 28/29 Feb.
- `deserialize` interprets a bare `yyyy-MM-dd` string as that **calendar day in the adapter's zone**, never as a UTC instant, and returns `null` for impossible dates such as `2026-02-30`.
- `parse` is strict: the text must match the pattern entirely, fields must be in range, and the date must exist. Missing date fields come from `base` (today if omitted); missing time fields are zero.

### Format patterns

Patterns are the same for every adapter and use date-fns-style letters:

| Token | Meaning | Example |
| --- | --- | --- |
| `yyyy`, `yy`, `y` | year | `2026`, `26`, `2026` |
| `MMMM`, `MMM`, `MM`, `M` | month (name, short name, padded, plain) | `November`, `Nov`, `11`, `11` |
| `dd`, `d` | day of month | `05`, `5` |
| `EEEE`, `EEE` | weekday (formatting and parsing) | `Monday`, `Mon` |
| `HH`, `H` | hour, 24-hour | `15` |
| `hh`, `h` | hour, 12-hour | `03` |
| `mm`, `m`, `ss`, `s`, `SSS` | minutes, seconds, milliseconds | `05` |
| `a` | AM/PM (locale's `meridiem`) | `PM` |
| `'text'` | literal (`''` is a quote) | `'at'` |

Other letters throw a `MomentraPatternError`. When parsing, `yyyy` requires four digits, `yy` expands with a 70-year pivot (`70`–`99` → 19xx, `00`–`69` → 20xx), single-letter numeric tokens accept one or two digits, and adjacent numeric tokens (`yyyyMMdd`) use fixed widths.

## Writing your own adapter

Extend `DateAdapter<TDate>` and implement the abstract members:

```ts
import { DateAdapter } from '@momentra/angular';

export class MyAdapter extends DateAdapter<MyDate> {
  now() { … }
  create(year, month, day, hours = 0, minutes = 0, seconds = 0, milliseconds = 0) { … } // invalid when out of range
  clone(date) { … }
  invalid() { … }
  isValid(date): date is MyDate { … }
  deserialize(value: unknown) { … }
  getYear(date) { … } getMonth(date) { … } getDate(date) { … } getDayOfWeek(date) { … }
  getHours(date) { … } getMinutes(date) { … } getSeconds(date) { … } getMilliseconds(date) { … }
  toTimestamp(date) { … }
  addDays(date, amount) { … }
}
```

Override derived methods only where your library does them better (as `DateFnsDateAdapter` does for boundaries). To prove compatibility, run the shared contract against it in your own tests — it is `describeAdapterContract(name, () => new MyAdapter())` in `projects/momentra/src/lib/testing/adapter-contract.ts` (it is not part of the published package; copy it into your tests).
