/**
 * User-facing strings used by Chronora components. Every string rendered or announced by a
 * component comes from here, so a locale fully controls the UI language.
 */
export interface ChronoraLabels {
  readonly today: string;
  readonly clear: string;
  readonly done: string;
  readonly now: string;
  readonly openCalendar: string;
  readonly closeCalendar: string;
  readonly openTimePicker: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly previousYear: string;
  readonly nextYear: string;
  readonly previousDecade: string;
  readonly nextDecade: string;
  readonly previousCentury: string;
  readonly nextCentury: string;
  readonly chooseView: string;
  readonly hours: string;
  readonly minutes: string;
  readonly seconds: string;
  readonly meridiem: string;
  readonly calendar: string;
  readonly months: string;
  readonly timeSelector: string;
  readonly presets: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly dateRange: string;
  readonly rangeSeparator: string;
  readonly selectedRange: string;
  readonly selectingEnd: string;
  /** Length of a picked range in the range popup footer; `{n}` is the day count. */
  readonly rangeDays: string;
  readonly cancel: string;
  readonly set: string;
  readonly date: string;
  readonly time: string;
  readonly dateAndTime: string;
  readonly increase: string;
  readonly decrease: string;
}

/**
 * Validation message templates keyed by Chronora error key. `{min}`, `{max}`, `{value}` style
 * placeholders are replaced with the formatted error payload.
 */
export interface ChronoraValidationMessages {
  readonly required: string;
  readonly chrInvalidDate: string;
  readonly chrMinDate: string;
  readonly chrMaxDate: string;
  readonly chrDisabledDate: string;
  readonly chrInvalidTime: string;
  readonly chrMinTime: string;
  readonly chrMaxTime: string;
  readonly chrRangeIncomplete: string;
  readonly chrRangeOrder: string;
  readonly chrMinRangeLength: string;
  readonly chrMaxRangeLength: string;
}

/** A complete locale definition: names, default formats, week configuration and UI strings. */
export interface ChronoraLocale {
  /** BCP-47 language tag, e.g. `en-US`. */
  readonly code: string;
  /** Full month names, January first. */
  readonly monthNames: readonly string[];
  /** Abbreviated month names, January first. */
  readonly monthNamesShort: readonly string[];
  /** Full weekday names, Sunday first. */
  readonly weekdayNames: readonly string[];
  /** Abbreviated weekday names, Sunday first. */
  readonly weekdayNamesShort: readonly string[];
  /** Narrow (1–2 letters) weekday names, Sunday first. */
  readonly weekdayNamesNarrow: readonly string[];
  readonly meridiem: { readonly am: string; readonly pm: string };
  /** 0 = Sunday … 6 = Saturday. */
  readonly firstDayOfWeek: number;
  readonly dateFormat: string;
  readonly timeFormat: string;
  readonly dateTimeFormat: string;
  readonly monthYearFormat: string;
  /** Long, human-readable date announced by screen readers, e.g. `EEEE, MMMM d, yyyy`. */
  readonly longDateFormat: string;
  readonly labels: ChronoraLabels;
  readonly validationMessages: ChronoraValidationMessages;
}

export const EN_LABELS: ChronoraLabels = {
  today: 'Today',
  clear: 'Clear',
  done: 'Done',
  now: 'Now',
  openCalendar: 'Open calendar',
  closeCalendar: 'Close calendar',
  openTimePicker: 'Open time picker',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYear: 'Previous year',
  nextYear: 'Next year',
  previousDecade: 'Previous decade',
  nextDecade: 'Next decade',
  previousCentury: 'Previous century',
  nextCentury: 'Next century',
  chooseView: 'Change calendar view',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  meridiem: 'AM/PM',
  calendar: 'Calendar',
  months: 'Months',
  timeSelector: 'Time selector',
  presets: 'Presets',
  startDate: 'Start date',
  endDate: 'End date',
  dateRange: 'Date range',
  rangeSeparator: 'to',
  selectedRange: 'Selected range',
  selectingEnd: 'Select the end date',
  rangeDays: '{n} days',
  cancel: 'Cancel',
  set: 'Set',
  date: 'Date',
  time: 'Time',
  dateAndTime: 'Date and time',
  increase: 'Increase',
  decrease: 'Decrease',
};

export const EN_VALIDATION_MESSAGES: ChronoraValidationMessages = {
  required: 'This field is required.',
  chrInvalidDate: 'Enter a valid date.',
  chrMinDate: 'The date must be on or after {min}.',
  chrMaxDate: 'The date must be on or before {max}.',
  chrDisabledDate: 'This date is not available.',
  chrInvalidTime: 'Enter a valid time.',
  chrMinTime: 'The time must be {min} or later.',
  chrMaxTime: 'The time must be {max} or earlier.',
  chrRangeIncomplete: 'Select both a start and an end date.',
  chrRangeOrder: 'The end date must not be before the start date.',
  chrMinRangeLength: 'The range must span at least {min} days.',
  chrMaxRangeLength: 'The range must span at most {max} days.',
};

/** Spanish UI strings, provided as a reference for writing your own locale. */
export const ES_LABELS: ChronoraLabels = {
  today: 'Hoy',
  clear: 'Borrar',
  done: 'Aceptar',
  now: 'Ahora',
  openCalendar: 'Abrir calendario',
  closeCalendar: 'Cerrar calendario',
  openTimePicker: 'Abrir selector de hora',
  previousMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
  previousYear: 'Año anterior',
  nextYear: 'Año siguiente',
  previousDecade: 'Década anterior',
  nextDecade: 'Década siguiente',
  previousCentury: 'Siglo anterior',
  nextCentury: 'Siglo siguiente',
  chooseView: 'Cambiar vista del calendario',
  hours: 'Horas',
  minutes: 'Minutos',
  seconds: 'Segundos',
  meridiem: 'AM/PM',
  calendar: 'Calendario',
  months: 'Meses',
  timeSelector: 'Selector de hora',
  presets: 'Atajos',
  startDate: 'Fecha de inicio',
  endDate: 'Fecha de fin',
  dateRange: 'Rango de fechas',
  rangeSeparator: 'a',
  selectedRange: 'Rango seleccionado',
  selectingEnd: 'Selecciona la fecha de fin',
  rangeDays: '{n} días',
  cancel: 'Cancelar',
  set: 'Aplicar',
  date: 'Fecha',
  time: 'Hora',
  dateAndTime: 'Fecha y hora',
  increase: 'Aumentar',
  decrease: 'Disminuir',
};

export const ES_VALIDATION_MESSAGES: ChronoraValidationMessages = {
  required: 'Este campo es obligatorio.',
  chrInvalidDate: 'Introduce una fecha válida.',
  chrMinDate: 'La fecha debe ser igual o posterior a {min}.',
  chrMaxDate: 'La fecha debe ser igual o anterior a {max}.',
  chrDisabledDate: 'Esta fecha no está disponible.',
  chrInvalidTime: 'Introduce una hora válida.',
  chrMinTime: 'La hora debe ser {min} o posterior.',
  chrMaxTime: 'La hora debe ser {max} o anterior.',
  chrRangeIncomplete: 'Selecciona una fecha de inicio y una de fin.',
  chrRangeOrder: 'La fecha de fin no puede ser anterior a la de inicio.',
  chrMinRangeLength: 'El rango debe abarcar al menos {min} días.',
  chrMaxRangeLength: 'El rango debe abarcar como máximo {max} días.',
};

/** Reference date used to derive localized names: Sunday 2 Jan 2033 … built per index. */
function intlNames(
  code: string,
  options: Intl.DateTimeFormatOptions,
  count: number,
  dateFor: (index: number) => Date,
): string[] {
  const formatter = new Intl.DateTimeFormat(code, { ...options, timeZone: 'UTC' });
  return Array.from({ length: count }, (_, i) => formatter.format(dateFor(i)));
}

/** Derives a Chronora date pattern (`yyyy`, `MM`, `dd`) from the locale's numeric short date. */
function deriveDatePattern(code: string): string | null {
  try {
    const text = new Intl.DateTimeFormat(`${code}-u-nu-latn`, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(2033, 10, 22)));
    if (!text.includes('2033') || !text.includes('11') || !text.includes('22')) {
      return null;
    }
    // Strip bidirectional marks some engines insert around parts.
    return text
      .replace(/[‎‏]/g, '')
      .replace('2033', 'yyyy')
      .replace('11', 'MM')
      .replace('22', 'dd');
  } catch {
    return null;
  }
}

function uses12HourClock(code: string): boolean {
  try {
    const cycle = new Intl.DateTimeFormat(code, { hour: 'numeric' }).resolvedOptions().hourCycle;
    return cycle === 'h12' || cycle === 'h11';
  } catch {
    return false;
  }
}

function deriveMeridiem(code: string): { am: string; pm: string } {
  try {
    const formatter = new Intl.DateTimeFormat(code, {
      hour: 'numeric',
      hour12: true,
      timeZone: 'UTC',
    });
    const part = (hour: number) =>
      formatter
        .formatToParts(new Date(Date.UTC(2033, 0, 1, hour)))
        .find((p) => p.type === 'dayPeriod')?.value;
    return { am: part(3) ?? 'AM', pm: part(15) ?? 'PM' };
  } catch {
    return { am: 'AM', pm: 'PM' };
  }
}

function deriveFirstDayOfWeek(code: string): number {
  try {
    const info = (
      new Intl.Locale(code) as Intl.Locale & {
        getWeekInfo?: () => { firstDay: number };
        weekInfo?: { firstDay: number };
      }
    );
    const firstDay = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
    if (firstDay !== undefined) {
      return firstDay % 7; // Intl uses 1 = Monday … 7 = Sunday
    }
  } catch {
    // fall through to default
  }
  return 0;
}

/**
 * Builds a locale from `Intl`: month/weekday names, default formats, meridiem and first day of
 * week are derived from the platform. English UI strings are used unless `overrides` supplies others.
 */
export function createLocale(code: string, overrides: Partial<ChronoraLocale> = {}): ChronoraLocale {
  const monthDate = (i: number) => new Date(Date.UTC(2033, i, 15));
  // 2033-01-02 is a Sunday.
  const weekdayDate = (i: number) => new Date(Date.UTC(2033, 0, 2 + i));
  const datePattern = deriveDatePattern(code) ?? 'yyyy-MM-dd';
  const timePattern = uses12HourClock(code) ? 'hh:mm a' : 'HH:mm';
  const base: ChronoraLocale = {
    code,
    monthNames: intlNames(code, { month: 'long' }, 12, monthDate),
    monthNamesShort: intlNames(code, { month: 'short' }, 12, monthDate),
    weekdayNames: intlNames(code, { weekday: 'long' }, 7, weekdayDate),
    weekdayNamesShort: intlNames(code, { weekday: 'short' }, 7, weekdayDate),
    weekdayNamesNarrow: intlNames(code, { weekday: 'narrow' }, 7, weekdayDate),
    meridiem: deriveMeridiem(code),
    firstDayOfWeek: deriveFirstDayOfWeek(code),
    dateFormat: datePattern,
    timeFormat: timePattern,
    dateTimeFormat: `${datePattern} ${timePattern}`,
    monthYearFormat: 'MMMM yyyy',
    longDateFormat: 'EEEE, d MMMM yyyy',
    labels: EN_LABELS,
    validationMessages: EN_VALIDATION_MESSAGES,
  };
  return { ...base, ...overrides };
}

/** Built-in default locale. Static (not Intl-derived) so output is identical on every platform. */
export const EN_US_LOCALE: ChronoraLocale = {
  code: 'en-US',
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  weekdayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  weekdayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  weekdayNamesNarrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  meridiem: { am: 'AM', pm: 'PM' },
  firstDayOfWeek: 0,
  dateFormat: 'MM/dd/yyyy',
  timeFormat: 'hh:mm a',
  dateTimeFormat: 'MM/dd/yyyy hh:mm a',
  monthYearFormat: 'MMMM yyyy',
  longDateFormat: 'EEEE, MMMM d, yyyy',
  labels: EN_LABELS,
  validationMessages: EN_VALIDATION_MESSAGES,
};

/** Spanish (Spain) locale with Monday as the first day of the week. */
export const ES_ES_LOCALE: ChronoraLocale = createLocale('es-ES', {
  firstDayOfWeek: 1,
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm',
  dateTimeFormat: 'dd/MM/yyyy HH:mm',
  labels: ES_LABELS,
  validationMessages: ES_VALIDATION_MESSAGES,
});
