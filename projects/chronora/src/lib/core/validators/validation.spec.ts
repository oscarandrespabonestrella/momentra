import { FormControl } from '@angular/forms';
import { NativeDateAdapter } from '../adapters/native-date-adapter';
import { EN_US_LOCALE } from '../../localization/locale';
import { ChronoraValidators } from './chronora-validators';
import { getErrorMessages, rangeLengthInDays, validateDate, validateRange, validateTime } from './validation';

const adapter = new NativeDateAdapter();
const d = (y: number, m: number, day: number, h = 0, mi = 0) => adapter.create(y, m, day, h, mi);

describe('validation rules', () => {
  describe('validateDate', () => {
    it('accepts empty values unless required', () => {
      expect(validateDate(adapter, null)).toBeNull();
      expect(validateDate(adapter, null, { required: true })).toEqual({ required: true });
    });

    it('flags invalid dates', () => {
      expect(validateDate(adapter, new Date('x'))).toEqual({ chrInvalidDate: { value: expect.anything() } });
    });

    it('checks min and max by day by default', () => {
      const min = d(2026, 5, 10, 15);
      expect(validateDate(adapter, d(2026, 5, 10, 8), { min })).toBeNull(); // same day, earlier time
      expect(validateDate(adapter, d(2026, 5, 9, 23), { min })).toHaveProperty('chrMinDate');
      expect(validateDate(adapter, d(2026, 5, 11), { max: d(2026, 5, 10) })).toHaveProperty('chrMaxDate');
    });

    it('can compare exact instants', () => {
      const min = d(2026, 5, 10, 15);
      expect(validateDate(adapter, d(2026, 5, 10, 8), { min, granularity: 'instant' })).toHaveProperty('chrMinDate');
    });

    it('applies the disabled predicate', () => {
      expect(validateDate(adapter, d(2026, 5, 7), { isDisabled: (x) => x.getDay() === 0 })).toHaveProperty('chrDisabledDate');
      expect(validateDate(adapter, d(2026, 5, 8), { isDisabled: (x) => x.getDay() === 0 })).toBeNull();
    });
  });

  describe('validateTime', () => {
    it('compares time of day only', () => {
      const rules = { min: d(2000, 0, 1, 9), max: d(2000, 0, 1, 17) };
      expect(validateTime(adapter, d(2026, 5, 5, 8, 59), rules)).toHaveProperty('chrMinTime');
      expect(validateTime(adapter, d(2026, 5, 5, 9), rules)).toBeNull();
      expect(validateTime(adapter, d(1999, 1, 1, 17), rules)).toBeNull();
      expect(validateTime(adapter, d(2026, 5, 5, 17, 1), rules)).toHaveProperty('chrMaxTime');
    });

    it('flags invalid times and honours required', () => {
      expect(validateTime(adapter, new Date('x'))).toHaveProperty('chrInvalidTime');
      expect(validateTime(adapter, null, { required: true })).toEqual({ required: true });
    });
  });

  describe('validateRange', () => {
    const range = (s: Date | null, e: Date | null) => ({ start: s, end: e });

    it('treats empty as valid unless required', () => {
      expect(validateRange(adapter, range(null, null))).toBeNull();
      expect(validateRange(adapter, null, { required: true })).toEqual({ required: true });
    });

    it('flags incomplete ranges', () => {
      expect(validateRange(adapter, range(d(2026, 0, 1), null))).toHaveProperty('chrRangeIncomplete');
      expect(validateRange(adapter, range(null, d(2026, 0, 1)))).toHaveProperty('chrRangeIncomplete');
    });

    it('flags reversed ranges', () => {
      expect(validateRange(adapter, range(d(2026, 0, 5), d(2026, 0, 1)))).toHaveProperty('chrRangeOrder');
    });

    it('counts length inclusively', () => {
      expect(rangeLengthInDays(adapter, d(2026, 0, 1), d(2026, 0, 1))).toBe(1);
      expect(rangeLengthInDays(adapter, d(2026, 0, 1), d(2026, 0, 7))).toBe(7);
      expect(validateRange(adapter, range(d(2026, 0, 1), d(2026, 0, 3)), { minLength: 4 })).toEqual({
        chrMinRangeLength: { min: 4, actual: 3 },
      });
      expect(validateRange(adapter, range(d(2026, 0, 1), d(2026, 0, 3)), { minLength: 3 })).toBeNull();
      expect(validateRange(adapter, range(d(2026, 0, 1), d(2026, 0, 8)), { maxLength: 7 })).toHaveProperty('chrMaxRangeLength');
    });

    it('checks both ends against bounds', () => {
      expect(validateRange(adapter, range(d(2026, 0, 1), d(2026, 0, 3)), { min: d(2026, 0, 2) })).toHaveProperty('chrMinDate');
      expect(validateRange(adapter, range(d(2026, 0, 1), d(2026, 0, 3)), { max: d(2026, 0, 2) })).toHaveProperty('chrMaxDate');
    });
  });

  describe('Angular validators', () => {
    it('required', () => {
      expect(ChronoraValidators.required()(new FormControl(null))).toEqual({ required: true });
      expect(ChronoraValidators.required()(new FormControl(d(2026, 0, 1)))).toBeNull();
    });

    it('minDate / maxDate with fixed and lazy bounds', () => {
      expect(ChronoraValidators.minDate(d(2026, 0, 10))(new FormControl(d(2026, 0, 9)))).toHaveProperty('chrMinDate');
      expect(ChronoraValidators.minDate(() => d(2026, 0, 10))(new FormControl(d(2026, 0, 10)))).toBeNull();
      expect(ChronoraValidators.maxDate(d(2026, 0, 10))(new FormControl(d(2026, 0, 11)))).toHaveProperty('chrMaxDate');
      expect(ChronoraValidators.maxDate(null)(new FormControl(d(2026, 0, 11)))).toBeNull();
    });

    it('only reports its own error key', () => {
      expect(ChronoraValidators.minDate(d(2026, 0, 10))(new FormControl(new Date('x')))).toBeNull();
      expect(ChronoraValidators.validDate()(new FormControl(new Date('x')))).toHaveProperty('chrInvalidDate');
    });

    it('time, range and disabled-date validators', () => {
      expect(ChronoraValidators.minTime(d(2000, 0, 1, 9))(new FormControl(d(2026, 0, 1, 8)))).toHaveProperty('chrMinTime');
      expect(ChronoraValidators.maxTime(d(2000, 0, 1, 9))(new FormControl(d(2026, 0, 1, 10)))).toHaveProperty('chrMaxTime');
      expect(ChronoraValidators.validTime()(new FormControl(new Date('x')))).toHaveProperty('chrInvalidTime');
      expect(ChronoraValidators.minRangeLength(3)(new FormControl({ start: d(2026, 0, 1), end: d(2026, 0, 2) }))).toHaveProperty(
        'chrMinRangeLength',
      );
      expect(ChronoraValidators.maxRangeLength(3)(new FormControl({ start: d(2026, 0, 1), end: d(2026, 0, 9) }))).toHaveProperty(
        'chrMaxRangeLength',
      );
      expect(ChronoraValidators.dateRange({ required: true })(new FormControl(null))).toEqual({ required: true });
      expect(ChronoraValidators.disabledDates((x: Date) => x.getDay() === 0)(new FormControl(d(2026, 5, 7)))).toHaveProperty(
        'chrDisabledDate',
      );
    });
  });

  describe('messages', () => {
    const fmt = (v: unknown) => (v instanceof Date ? adapter.formatDate(v, EN_US_LOCALE) : String(v));

    it('interpolates payload values into templates', () => {
      const errors = validateDate(adapter, d(2026, 0, 1), { min: d(2026, 0, 10) });
      expect(getErrorMessages(errors, EN_US_LOCALE.validationMessages, fmt)).toEqual([
        'The date must be on or after 01/10/2026.',
      ]);
    });

    it('lets callers customise messages and ignores unknown error keys', () => {
      const errors = { chrMinRangeLength: { min: 3, actual: 1 }, minlength: { requiredLength: 2 } };
      expect(getErrorMessages(errors, { chrMinRangeLength: 'Pick {min}+ days' }, fmt)).toEqual(['Pick 3+ days']);
      expect(getErrorMessages(null, EN_US_LOCALE.validationMessages, fmt)).toEqual([]);
    });
  });
});
