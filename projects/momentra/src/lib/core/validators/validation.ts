import type { ValidationErrors } from '@angular/forms';
import type { DateAdapter } from '../adapters/date-adapter';
import type { MomentraValidationMessages } from '../../localization/locale';
import type { DateRange } from '../models/date-range';

/**
 * Framework-free validation rules. Components and the Angular `ValidatorFn` wrappers in
 * `MomentraValidators` both call these functions, so rules are defined exactly once.
 */

/** Which part of a date participates in min/max comparisons. */
export type DateGranularity = 'day' | 'instant';

export interface DateRules<TDate> {
  min?: TDate | null;
  max?: TDate | null;
  /** Return `true` for dates that cannot be selected. */
  isDisabled?: ((date: TDate) => boolean) | null;
  /** `day` (default) ignores the time of day; `instant` compares exact values. */
  granularity?: DateGranularity;
}

export interface RangeRules<TDate> extends DateRules<TDate> {
  /** Minimum number of days a range must span (inclusive: same-day range = 1). */
  minLength?: number | null;
  /** Maximum number of days a range may span (inclusive). */
  maxLength?: number | null;
}

export interface TimeRules<TDate> {
  min?: TDate | null;
  max?: TDate | null;
}

/** Number of days spanned by a complete range, counting both ends (a same-day range is 1). */
export function rangeLengthInDays<TDate>(adapter: DateAdapter<TDate>, start: TDate, end: TDate): number {
  return adapter.differenceInDays(end, start) + 1;
}

function compareAt<TDate>(adapter: DateAdapter<TDate>, a: TDate, b: TDate, granularity: DateGranularity): number {
  return granularity === 'day' ? adapter.compare(adapter.startOfDay(a), adapter.startOfDay(b)) : adapter.compare(a, b);
}

/** Whether `date` violates `min`, `max` or the disabled predicate. */
export function isDateRestricted<TDate>(adapter: DateAdapter<TDate>, date: TDate, rules: DateRules<TDate>): boolean {
  return dateRuleError(adapter, date, rules) !== null;
}

function dateRuleError<TDate>(adapter: DateAdapter<TDate>, date: TDate, rules: DateRules<TDate>): ValidationErrors | null {
  const granularity = rules.granularity ?? 'day';
  if (rules.min && adapter.isValid(rules.min) && compareAt(adapter, date, rules.min, granularity) < 0) {
    return { mtrMinDate: { min: rules.min, actual: date } };
  }
  if (rules.max && adapter.isValid(rules.max) && compareAt(adapter, date, rules.max, granularity) > 0) {
    return { mtrMaxDate: { max: rules.max, actual: date } };
  }
  if (rules.isDisabled?.(date)) {
    return { mtrDisabledDate: { actual: date } };
  }
  return null;
}

/**
 * Validates a single date value. `null`/`undefined`/`''` count as empty and are valid unless
 * `required`. An invalid date object yields `mtrInvalidDate`.
 */
export function validateDate<TDate>(
  adapter: DateAdapter<TDate>,
  value: TDate | null | undefined,
  rules: DateRules<TDate> & { required?: boolean } = {},
): ValidationErrors | null {
  if (value == null || (value as unknown) === '') {
    return rules.required ? { required: true } : null;
  }
  if (!adapter.isValid(value)) {
    return { mtrInvalidDate: { value } };
  }
  return dateRuleError(adapter, value, rules);
}

/** Validates the time of day of a date value against `min`/`max` times (dates are ignored). */
export function validateTime<TDate>(
  adapter: DateAdapter<TDate>,
  value: TDate | null | undefined,
  rules: TimeRules<TDate> & { required?: boolean } = {},
): ValidationErrors | null {
  if (value == null || (value as unknown) === '') {
    return rules.required ? { required: true } : null;
  }
  if (!adapter.isValid(value)) {
    return { mtrInvalidTime: { value } };
  }
  const seconds = adapter.secondsOfDay(value);
  if (rules.min && adapter.isValid(rules.min) && seconds < adapter.secondsOfDay(rules.min)) {
    return { mtrMinTime: { min: rules.min, actual: value } };
  }
  if (rules.max && adapter.isValid(rules.max) && seconds > adapter.secondsOfDay(rules.max)) {
    return { mtrMaxTime: { max: rules.max, actual: value } };
  }
  return null;
}

/** Validates a (possibly incomplete) date range. */
export function validateRange<TDate>(
  adapter: DateAdapter<TDate>,
  value: DateRange<TDate> | null | undefined,
  rules: RangeRules<TDate> & { required?: boolean } = {},
): ValidationErrors | null {
  const start = value?.start ?? null;
  const end = value?.end ?? null;
  if (start === null && end === null) {
    return rules.required ? { required: true } : null;
  }
  if ((start !== null && !adapter.isValid(start)) || (end !== null && !adapter.isValid(end))) {
    return { mtrInvalidDate: { value } };
  }
  if (start === null || end === null) {
    return { mtrRangeIncomplete: { start, end } };
  }
  const endpointError = dateRuleError(adapter, start, rules) ?? dateRuleError(adapter, end, rules);
  if (endpointError) {
    return endpointError;
  }
  if (adapter.compare(adapter.startOfDay(end), adapter.startOfDay(start)) < 0) {
    return { mtrRangeOrder: { start, end } };
  }
  const length = rangeLengthInDays(adapter, start, end);
  if (rules.minLength != null && length < rules.minLength) {
    return { mtrMinRangeLength: { min: rules.minLength, actual: length } };
  }
  if (rules.maxLength != null && length > rules.maxLength) {
    return { mtrMaxRangeLength: { max: rules.maxLength, actual: length } };
  }
  return null;
}

/**
 * Turns validation errors into human-readable messages. `formatValue` renders dates found in the
 * error payloads (`min`, `max`, …); numbers are inserted as-is.
 */
export function getErrorMessages(
  errors: ValidationErrors | null | undefined,
  templates: Partial<MomentraValidationMessages>,
  formatValue: (value: unknown) => string,
): string[] {
  if (!errors) {
    return [];
  }
  const lookup = templates as Record<string, string | undefined>;
  return Object.keys(errors).flatMap((key) => {
    const template = lookup[key];
    if (!template) {
      return [];
    }
    const payload = errors[key];
    const fields = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
    return [template.replace(/\{(\w+)\}/g, (_, name: string) => (name in fields ? formatValue(fields[name]) : `{${name}}`))];
  });
}
