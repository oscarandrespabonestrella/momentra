import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import type { DateAdapter } from '../adapters/date-adapter';
import { NativeDateAdapter } from '../adapters/native-date-adapter';
import type { DateRange } from '../models/date-range';
import {
  validateDate,
  validateRange,
  validateTime,
  type DateGranularity,
  type RangeRules,
} from './validation';

/** A bound that is either fixed or computed on every validation (e.g. "today"). */
export type Bound<TDate> = TDate | null | (() => TDate | null);

const resolve = <TDate>(bound: Bound<TDate> | undefined): TDate | null =>
  typeof bound === 'function' ? (bound as () => TDate | null)() : (bound ?? null);

const nativeAdapter = new NativeDateAdapter();
const defaultAdapter = <TDate>() => nativeAdapter as unknown as DateAdapter<TDate>;

/**
 * Angular `ValidatorFn` factories for Chronora values. They work with any form control holding a
 * date (or a {@link DateRange}) and share their rules with the components' built-in validation.
 *
 * Pass the adapter you configured when you use something other than native `Date`.
 *
 * Error keys: `required`, `chrInvalidDate`, `chrMinDate`, `chrMaxDate`, `chrDisabledDate`,
 * `chrInvalidTime`, `chrMinTime`, `chrMaxTime`, `chrRangeIncomplete`, `chrRangeOrder`,
 * `chrMinRangeLength`, `chrMaxRangeLength`.
 */
export const ChronoraValidators = {
  /** The control must hold a date. */
  required<TDate = Date>(adapter: DateAdapter<TDate> = defaultAdapter<TDate>()): ValidatorFn {
    return (c: AbstractControl) => validateDate(adapter, c.value as TDate | null, { required: true });
  },

  /** The value must be a valid date object (not `Invalid Date`). */
  validDate<TDate = Date>(adapter: DateAdapter<TDate> = defaultAdapter<TDate>()): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const error = validateDate(adapter, c.value as TDate | null);
      return error && 'chrInvalidDate' in error ? error : null;
    };
  },

  minDate<TDate = Date>(
    min: Bound<TDate>,
    adapter: DateAdapter<TDate> = defaultAdapter<TDate>(),
    granularity: DateGranularity = 'day',
  ): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const error = validateDate(adapter, c.value as TDate | null, { min: resolve(min), granularity });
      return error && 'chrMinDate' in error ? error : null;
    };
  },

  maxDate<TDate = Date>(
    max: Bound<TDate>,
    adapter: DateAdapter<TDate> = defaultAdapter<TDate>(),
    granularity: DateGranularity = 'day',
  ): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const error = validateDate(adapter, c.value as TDate | null, { max: resolve(max), granularity });
      return error && 'chrMaxDate' in error ? error : null;
    };
  },

  /** Rejects dates for which `isDisabled` returns `true` (weekends, holidays, …). */
  disabledDates<TDate = Date>(
    isDisabled: (date: TDate) => boolean,
    adapter: DateAdapter<TDate> = defaultAdapter<TDate>(),
  ): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const error = validateDate(adapter, c.value as TDate | null, { isDisabled });
      return error && 'chrDisabledDate' in error ? error : null;
    };
  },

  /** The value must be a valid date object whose time of day is meaningful. */
  validTime<TDate = Date>(adapter: DateAdapter<TDate> = defaultAdapter<TDate>()): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const error = validateTime(adapter, c.value as TDate | null);
      return error && 'chrInvalidTime' in error ? error : null;
    };
  },

  /** Time of day must not be before the time of day of `min` (the date part is ignored). */
  minTime<TDate = Date>(min: Bound<TDate>, adapter: DateAdapter<TDate> = defaultAdapter<TDate>()): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const error = validateTime(adapter, c.value as TDate | null, { min: resolve(min) });
      return error && 'chrMinTime' in error ? error : null;
    };
  },

  /** Time of day must not be after the time of day of `max` (the date part is ignored). */
  maxTime<TDate = Date>(max: Bound<TDate>, adapter: DateAdapter<TDate> = defaultAdapter<TDate>()): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const error = validateTime(adapter, c.value as TDate | null, { max: resolve(max) });
      return error && 'chrMaxTime' in error ? error : null;
    };
  },

  /** Validates a {@link DateRange}: completeness, ordering, bounds and length. */
  dateRange<TDate = Date>(
    rules: Omit<RangeRules<TDate>, 'min' | 'max'> & { min?: Bound<TDate>; max?: Bound<TDate>; required?: boolean } = {},
    adapter: DateAdapter<TDate> = defaultAdapter<TDate>(),
  ): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null =>
      validateRange(adapter, c.value as DateRange<TDate> | null, {
        ...rules,
        min: resolve(rules.min),
        max: resolve(rules.max),
      });
  },

  /** Range must span at least `days` days (inclusive count). */
  minRangeLength<TDate = Date>(days: number, adapter: DateAdapter<TDate> = defaultAdapter<TDate>()): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const error = validateRange(adapter, c.value as DateRange<TDate> | null, { minLength: days });
      return error && 'chrMinRangeLength' in error ? error : null;
    };
  },

  /** Range must span at most `days` days (inclusive count). */
  maxRangeLength<TDate = Date>(days: number, adapter: DateAdapter<TDate> = defaultAdapter<TDate>()): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const error = validateRange(adapter, c.value as DateRange<TDate> | null, { maxLength: days });
      return error && 'chrMaxRangeLength' in error ? error : null;
    };
  },
} as const;
