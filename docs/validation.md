# Validation

Validation has three layers that share one set of rules (`core/validators/validation.ts`):

1. **Pure rules** — `validateDate`, `validateTime`, `validateRange`: `(adapter, value, rules) => ValidationErrors | null`. No Angular, no UI.
2. **Angular validators** — `MomentraValidators.*` wrap the rules as `ValidatorFn`s for your own `FormControl`s.
3. **Built-in component validation** — every control validates itself with the same rules (from `min`, `max`, `disabledDates`, `minRangeLength`, `required`, …) and *also* acts as an Angular `Validator`, so the errors appear on the `FormControl` (`control.errors`, `control.invalid`) without you adding anything.

## Error keys

| Key | Payload | Raised when |
| --- | --- | --- |
| `required` | `true` | Empty and `required` (or `Validators.required` / `MomentraValidators.required`). |
| `mtrInvalidDate` | `{ value }` | Text cannot be parsed, the date does not exist (30 Feb), or the value is an invalid date object. |
| `mtrMinDate` | `{ min, actual }` | Before `min` (whole days; exact for the date-time picker). |
| `mtrMaxDate` | `{ max, actual }` | After `max`. |
| `mtrDisabledDate` | `{ actual }` | The date is excluded by `disabledDates`. |
| `mtrInvalidTime` | `{ value }` | Unparsable or invalid time. |
| `mtrMinTime` | `{ min, actual }` | Time of day before `min`'s time of day. |
| `mtrMaxTime` | `{ max, actual }` | Time of day after `max`'s time of day. |
| `mtrRangeIncomplete` | `{ start, end }` | Exactly one end of a range is set. |
| `mtrRangeOrder` | `{ start, end }` | `end` is before `start`. |
| `mtrMinRangeLength` | `{ min, actual }` | Range spans fewer than `min` days (inclusive count). |
| `mtrMaxRangeLength` | `{ max, actual }` | Range spans more than `max` days. |

An empty value is valid unless `required`.

## Using the validators

```ts
import { MomentraValidators } from '@momentra/angular';

new FormControl<Date | null>(null, [
  MomentraValidators.required(),
  MomentraValidators.minDate(() => new Date()),     // bound may be a value or a function evaluated on each validation
  MomentraValidators.disabledDates((d) => d.getDay() === 0),
]);

new FormControl<DateRange<Date> | null>(null, [
  MomentraValidators.dateRange({ required: true, minLength: 2, maxLength: 14 }),
]);
```

Available: `required`, `validDate`, `minDate`, `maxDate`, `disabledDates`, `validTime`, `minTime`, `maxTime`, `dateRange`, `minRangeLength`, `maxRangeLength`. Each accepts a `DateAdapter` as its last argument for non-native dates (`MomentraValidators.minDate(min, new LuxonDateAdapter())`); the default is the native adapter. Each returns only *its own* error key, so they compose.

## Messages

Components show messages below the field, in a `role="alert"` region referenced by `aria-describedby`, **after the control was touched** and when `showErrors` is true. Messages come from the active locale's `validationMessages` with these precedence rules: component `errorMessages` → global `validationMessages` → locale.

Templates are strings with `{placeholder}`s filled from the error payload; dates are formatted with the control's pattern:

```html
<mtr-date-picker [min]="today" [errorMessages]="{ mtrMinDate: 'Pick {min} or later.' }" />
```

```ts
provideMomentra({ validationMessages: { required: 'Please choose a date.' } });
```

To build your own message UI, use `getErrorMessages(errors, templates, formatValue)`.

## Notes and limits

- The component displays messages for **its own** rules. A validator you attach only to the `FormControl` (for example `Validators.required` without the `required` input) still invalidates the control but its message is not displayed by the component; show it in your template from `control.errors`.
- Typing something unparsable emits `null` to the form *and* sets `mtrInvalidDate`; the user's text stays in the input until they fix or clear it.
- Rules re-run when `min`, `max`, `disabledDates`, range lengths or `required` change.
