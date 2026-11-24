/*
 * Public API surface of momentra
 */

// Core: models
export * from './lib/core/models/calendar-date';
export * from './lib/core/models/date-range';

// Core: adapters
export { DateAdapter, daysInMonthOf } from './lib/core/adapters/date-adapter';
export { NativeDateAdapter } from './lib/core/adapters/native-date-adapter';

// Core: configuration & tokens
export {
  provideMomentra,
  DEFAULT_MOMENTRA_CONFIG,
  type MomentraConfig,
  type MomentraTheme,
} from './lib/core/config/momentra-config';
export { MOMENTRA_CONFIG, MOMENTRA_DATE_ADAPTER, MOMENTRA_LOCALES } from './lib/core/tokens/tokens';
export { MomentraSettings, type LocaleOverrides } from './lib/core/services/momentra-settings';

// Core: validation
export { MomentraValidators, type Bound } from './lib/core/validators/momentra-validators';
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
  MomentraPatternError,
  type DateTimeParts,
  type ParsedParts,
} from './lib/formatting/format-pattern';
export * from './lib/localization/locale';

// Theming
export { MtrThemeDirective } from './lib/theming/theme.directive';

// Forms integration (for building custom controls on top of Momentra)
export { MomentraFormControl, provideMomentraControl } from './lib/core/forms/momentra-form-control';

// Calendar
export { CalendarComponent, type MtrCellContext } from './lib/calendar/calendar/calendar.component';
export { createDisabledPredicate, type DisabledDates } from './lib/core/utils/disabled-dates';
export { InfiniteCalendarComponent } from './lib/calendar/infinite-calendar/infinite-calendar.component';
export {
  MultiviewCalendarComponent,
  type MtrMultiviewMode,
} from './lib/calendar/multiview-calendar/multiview-calendar.component';
export { MonthPickerComponent } from './lib/calendar/month-picker/month-picker.component';
export { YearPickerComponent } from './lib/calendar/year-picker/year-picker.component';
export { DecadePickerComponent } from './lib/calendar/decade-picker/decade-picker.component';

// Inputs
export { DateInputComponent } from './lib/inputs/date-input/date-input.component';
export { DateTimeInputComponent } from './lib/inputs/datetime-input/datetime-input.component';
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
