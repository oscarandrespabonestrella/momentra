/*
 * Public API surface of @chronora/angular
 */

// Core: models
export * from './lib/core/models/calendar-date';
export * from './lib/core/models/date-range';

// Core: adapters
export { DateAdapter, daysInMonthOf } from './lib/core/adapters/date-adapter';
export { NativeDateAdapter } from './lib/core/adapters/native-date-adapter';

// Core: configuration & tokens
export {
  provideChronora,
  DEFAULT_CHRONORA_CONFIG,
  type ChronoraConfig,
  type ChronoraTheme,
} from './lib/core/config/chronora-config';
export { CHRONORA_CONFIG, CHRONORA_DATE_ADAPTER, CHRONORA_LOCALES } from './lib/core/tokens/tokens';
export { ChronoraSettings, type LocaleOverrides } from './lib/core/services/chronora-settings';

// Core: validation
export { ChronoraValidators, type Bound } from './lib/core/validators/chronora-validators';
export {
  validateDate,
  validateTime,
  validateRange,
  getErrorMessages,
  rangeLengthInDays,
  type DateRules,
  type RangeRules,
  type TimeRules,
  type DateGranularity,
} from './lib/core/validators/validation';

// Core: calendar engine
export {
  buildView,
  shiftView,
  moveFocus,
  type CalendarView,
  type CalendarCell,
  type CalendarViewModel,
  type CalendarContext,
} from './lib/core/utils/calendar-engine';

// Formatting & localization
export {
  formatParts,
  parseParts,
  ChronoraPatternError,
  type DateTimeParts,
  type ParsedParts,
} from './lib/formatting/format-pattern';
export * from './lib/localization/locale';

// Theming
export { ChrThemeDirective } from './lib/theming/theme.directive';

// Forms integration (for building custom controls on top of Chronora)
export { ChronoraFormControl, provideChronoraControl } from './lib/core/forms/chronora-form-control';

// Calendar
export { CalendarComponent, type ChrCellContext } from './lib/calendar/calendar/calendar.component';
export { createDisabledPredicate, type DisabledDates } from './lib/core/utils/disabled-dates';
export { MonthPickerComponent } from './lib/calendar/month-picker/month-picker.component';
export { YearPickerComponent } from './lib/calendar/year-picker/year-picker.component';
export { DecadePickerComponent } from './lib/calendar/decade-picker/decade-picker.component';

// Inputs
export { DateInputComponent } from './lib/inputs/date-input/date-input.component';
export { DatePickerComponent } from './lib/inputs/date-picker/date-picker.component';
export { TimePickerComponent } from './lib/inputs/time-picker/time-picker.component';
export { DateTimePickerComponent } from './lib/inputs/datetime-picker/datetime-picker.component';

// Date ranges
export { DateRangePickerComponent } from './lib/ranges/date-range-picker/date-range-picker.component';
export {
  createPreset,
  isSameRange,
  lastDaysRange,
  lastMonthRange,
  pickRangeDate,
  resolvePreset,
  thisMonthRange,
  thisWeekRange,
} from './lib/core/utils/range-utils';
