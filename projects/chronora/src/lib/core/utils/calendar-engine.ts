import type { DateAdapter } from '../adapters/date-adapter';
import type { ChronoraLocale } from '../../localization/locale';
import { isDateRestricted, type DateRules } from '../validators/validation';

/**
 * Pure calendar calculations shared by the calendar, month, year and decade pickers.
 * Nothing in this file depends on Angular.
 *
 * Views, from most to least detailed:
 * - `day`    – the days of one month
 * - `month`  – the 12 months of one year
 * - `year`   – the 10 years of one decade (plus one year of padding on each side)
 * - `decade` – the 10 decades of one century (plus one decade of padding on each side)
 */
export type CalendarView = 'day' | 'month' | 'year' | 'decade';

export const CALENDAR_VIEWS: readonly CalendarView[] = ['day', 'month', 'year', 'decade'];

/** One selectable cell in a calendar grid. */
export interface CalendarCell<TDate> {
  /** Representative date: the day itself, or the first day of the month / year / decade. */
  readonly date: TDate;
  readonly label: string;
  /** Full text announced by screen readers. */
  readonly ariaLabel: string;
  readonly disabled: boolean;
  readonly selected: boolean;
  /** Holds keyboard focus (the roving-tabindex cell). */
  readonly active: boolean;
  readonly today: boolean;
  /** Belongs to a neighbouring period (e.g. a day of the previous month). */
  readonly outside: boolean;
  /** Inside the highlighted range (inclusive of the end points). */
  readonly inRange: boolean;
  readonly rangeStart: boolean;
  readonly rangeEnd: boolean;
  /** Stable identity within a view, used for DOM ids and tracking. */
  readonly key: string;
}

export interface CalendarWeekday {
  readonly short: string;
  readonly long: string;
}

export interface CalendarViewModel<TDate> {
  readonly view: CalendarView;
  readonly title: string;
  readonly columns: number;
  readonly weekdays: readonly CalendarWeekday[];
  readonly rows: readonly (readonly CalendarCell<TDate>[])[];
}

export interface CalendarContext<TDate> {
  readonly adapter: DateAdapter<TDate>;
  readonly locale: ChronoraLocale;
  readonly firstDayOfWeek: number;
  readonly rules: DateRules<TDate>;
  readonly selected: TDate | null;
  /** The keyboard-focused date; only the cell that contains it is `active`. */
  readonly active?: TDate | null;
  /** Highlighted range; either end may be `null` while selecting. */
  readonly range?: { readonly start: TDate | null; readonly end: TDate | null } | null;
  readonly fixedWeeks?: boolean;
}

export const decadeStartOf = (year: number): number => Math.floor(year / 10) * 10;
export const centuryStartOf = (year: number): number => Math.floor(year / 100) * 100;

const GRID_COLUMNS: Record<CalendarView, number> = { day: 7, month: 4, year: 4, decade: 4 };

export function columnsOf(view: CalendarView): number {
  return GRID_COLUMNS[view];
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/** Whether every day of `[from, to]` lies outside the allowed `min`/`max` bounds. */
function periodOutOfBounds<TDate>(adapter: DateAdapter<TDate>, from: TDate, to: TDate, rules: DateRules<TDate>): boolean {
  const { min, max } = rules;
  if (min && adapter.isValid(min) && adapter.compare(to, adapter.startOfDay(min)) < 0) {
    return true;
  }
  if (max && adapter.isValid(max) && adapter.compare(from, adapter.startOfDay(max)) > 0) {
    return true;
  }
  return false;
}

/** Normalises a possibly reversed or incomplete range into inclusive start-of-day bounds. */
function rangeBounds<TDate>(ctx: CalendarContext<TDate>): { start: TDate; end: TDate } | { start: TDate; end: null } | null {
  const { adapter, range } = ctx;
  if (!range || !range.start) {
    return null;
  }
  const start = adapter.startOfDay(range.start);
  if (!range.end) {
    return { start, end: null };
  }
  const end = adapter.startOfDay(range.end);
  return adapter.compare(end, start) < 0 ? { start: end, end: start } : { start, end };
}

function dayCell<TDate>(ctx: CalendarContext<TDate>, date: TDate, viewMonthDate: TDate, today: TDate): CalendarCell<TDate> {
  const { adapter, locale, rules } = ctx;
  const bounds = rangeBounds(ctx);
  const isStart = !!bounds && adapter.isSameDay(date, bounds.start);
  const isEnd = !!bounds && !!bounds.end && adapter.isSameDay(date, bounds.end);
  const inRange = !!bounds && (isStart || isEnd || (!!bounds.end && adapter.isBetween(date, bounds.start, bounds.end)));
  return {
    date,
    label: String(adapter.getDate(date)),
    ariaLabel: adapter.format(date, locale.longDateFormat, locale),
    disabled: isDateRestricted(adapter, date, { ...rules, granularity: 'day' }),
    selected: !!ctx.selected && adapter.isSameDay(date, ctx.selected),
    active: !!ctx.active && adapter.isSameDay(date, ctx.active),
    today: adapter.isSameDay(date, today),
    outside: !adapter.isSameMonth(date, viewMonthDate),
    inRange,
    rangeStart: isStart,
    rangeEnd: isEnd,
    key: adapter.format(date, 'yyyy-MM-dd', locale),
  };
}

export function buildDayView<TDate>(ctx: CalendarContext<TDate>, viewDate: TDate): CalendarViewModel<TDate> {
  const { adapter, locale, firstDayOfWeek } = ctx;
  const today = adapter.today();
  const weeks = adapter.getCalendarWeeks(viewDate, firstDayOfWeek, ctx.fixedWeeks ?? false);
  const weekdays: CalendarWeekday[] = Array.from({ length: 7 }, (_, i) => {
    const index = (firstDayOfWeek + i) % 7;
    return { short: locale.weekdayNamesShort[index].slice(0, 2), long: locale.weekdayNames[index] };
  });
  return {
    view: 'day',
    title: adapter.formatMonthYear(viewDate, locale),
    columns: 7,
    weekdays,
    rows: weeks.map((week) => week.map((d) => dayCell(ctx, d, viewDate, today))),
  };
}

export function buildMonthView<TDate>(ctx: CalendarContext<TDate>, viewDate: TDate): CalendarViewModel<TDate> {
  const { adapter, locale, rules } = ctx;
  const year = adapter.getYear(viewDate);
  const today = adapter.today();
  const cells = Array.from({ length: 12 }, (_, month): CalendarCell<TDate> => {
    const date = adapter.create(year, month, 1);
    const end = adapter.getLastDayOfMonth(date);
    return {
      date,
      label: locale.monthNamesShort[month],
      ariaLabel: `${locale.monthNames[month]} ${year}`,
      disabled: periodOutOfBounds(adapter, date, end, rules),
      selected: !!ctx.selected && adapter.isSameMonth(date, ctx.selected),
      active: !!ctx.active && adapter.isSameMonth(date, ctx.active),
      today: adapter.isSameMonth(date, today),
      outside: false,
      inRange: false,
      rangeStart: false,
      rangeEnd: false,
      key: `m-${year}-${month}`,
    };
  });
  return { view: 'month', title: String(year), columns: 4, weekdays: [], rows: chunk(cells, 4) };
}

export function buildYearView<TDate>(ctx: CalendarContext<TDate>, viewDate: TDate): CalendarViewModel<TDate> {
  const { adapter, rules } = ctx;
  const decade = decadeStartOf(adapter.getYear(viewDate));
  const today = adapter.today();
  const cells = Array.from({ length: 12 }, (_, i): CalendarCell<TDate> => {
    const year = decade - 1 + i;
    const date = adapter.create(year, 0, 1);
    const end = adapter.create(year, 11, 31);
    return {
      date,
      label: String(year),
      ariaLabel: String(year),
      disabled: periodOutOfBounds(adapter, date, end, rules),
      selected: !!ctx.selected && adapter.isSameYear(date, ctx.selected),
      active: !!ctx.active && adapter.isSameYear(date, ctx.active),
      today: adapter.isSameYear(date, today),
      outside: year < decade || year > decade + 9,
      inRange: false,
      rangeStart: false,
      rangeEnd: false,
      key: `y-${year}`,
    };
  });
  return { view: 'year', title: `${decade} – ${decade + 9}`, columns: 4, weekdays: [], rows: chunk(cells, 4) };
}

export function buildDecadeView<TDate>(ctx: CalendarContext<TDate>, viewDate: TDate): CalendarViewModel<TDate> {
  const { adapter, rules } = ctx;
  const century = centuryStartOf(adapter.getYear(viewDate));
  const today = adapter.today();
  const selectedDecade = ctx.selected ? decadeStartOf(adapter.getYear(ctx.selected)) : null;
  const todayDecade = decadeStartOf(adapter.getYear(today));
  const cells = Array.from({ length: 12 }, (_, i): CalendarCell<TDate> => {
    const start = century - 10 + i * 10;
    const date = adapter.create(start, 0, 1);
    const end = adapter.create(start + 9, 11, 31);
    const label = `${start} – ${start + 9}`;
    return {
      date,
      label,
      ariaLabel: label,
      disabled: periodOutOfBounds(adapter, date, end, rules),
      selected: selectedDecade === start,
      active: !!ctx.active && decadeStartOf(adapter.getYear(ctx.active)) === start,
      today: todayDecade === start,
      outside: start < century || start > century + 90,
      inRange: false,
      rangeStart: false,
      rangeEnd: false,
      key: `d-${start}`,
    };
  });
  return { view: 'decade', title: `${century} – ${century + 99}`, columns: 4, weekdays: [], rows: chunk(cells, 4) };
}

export function buildView<TDate>(view: CalendarView, ctx: CalendarContext<TDate>, viewDate: TDate): CalendarViewModel<TDate> {
  switch (view) {
    case 'day':
      return buildDayView(ctx, viewDate);
    case 'month':
      return buildMonthView(ctx, viewDate);
    case 'year':
      return buildYearView(ctx, viewDate);
    case 'decade':
      return buildDecadeView(ctx, viewDate);
  }
}

/** Moves the displayed period one page forward (`1`) or back (`-1`). */
export function shiftView<TDate>(adapter: DateAdapter<TDate>, view: CalendarView, date: TDate, direction: 1 | -1): TDate {
  switch (view) {
    case 'day':
      return adapter.addMonths(date, direction);
    case 'month':
      return adapter.addYears(date, direction);
    case 'year':
      return adapter.addYears(date, direction * 10);
    case 'decade':
      return adapter.addYears(date, direction * 100);
  }
}

/** The view shown after the user picks a cell in `view`, or `null` when that view is the finest. */
export function drillDownView(view: CalendarView): CalendarView | null {
  return view === 'decade' ? 'year' : view === 'year' ? 'month' : view === 'month' ? 'day' : null;
}

/** The coarser view reached by clicking the header title, or `null` for the coarsest. */
export function drillUpView(view: CalendarView): CalendarView | null {
  return view === 'day' ? 'month' : view === 'month' ? 'year' : view === 'year' ? 'decade' : null;
}

export type NavigationKey =
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'PageUp'
  | 'PageDown'
  | 'Home'
  | 'End';

export const NAVIGATION_KEYS: ReadonlySet<string> = new Set<NavigationKey>([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End',
]);

/**
 * Computes the date that receives focus after a navigation key press.
 *
 * - Arrows move by one cell horizontally and one row vertically.
 * - `PageUp`/`PageDown` move by the next coarser unit (`Shift` moves by two units coarser in the day view).
 * - `Home`/`End` jump to the start/end of the current week (day view) or of the enclosing period.
 */
export function moveFocus<TDate>(
  adapter: DateAdapter<TDate>,
  view: CalendarView,
  date: TDate,
  key: NavigationKey,
  options: { firstDayOfWeek: number; shift?: boolean },
): TDate {
  const sign = key === 'ArrowLeft' || key === 'ArrowUp' || key === 'PageUp' ? -1 : 1;
  switch (view) {
    case 'day':
      switch (key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          return adapter.addDays(date, sign);
        case 'ArrowUp':
        case 'ArrowDown':
          return adapter.addDays(date, sign * 7);
        case 'PageUp':
        case 'PageDown':
          return options.shift ? adapter.addYears(date, sign) : adapter.addMonths(date, sign);
        case 'Home':
          return adapter.startOfWeek(date, options.firstDayOfWeek);
        case 'End':
          return adapter.startOfDay(adapter.endOfWeek(date, options.firstDayOfWeek));
      }
      break;
    case 'month':
      switch (key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          return adapter.addMonths(date, sign);
        case 'ArrowUp':
        case 'ArrowDown':
          return adapter.addMonths(date, sign * columnsOf('month'));
        case 'PageUp':
        case 'PageDown':
          return adapter.addYears(date, sign);
        case 'Home':
          return adapter.startOfYear(date);
        case 'End':
          return adapter.create(adapter.getYear(date), 11, 1);
      }
      break;
    case 'year':
      switch (key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          return adapter.addYears(date, sign);
        case 'ArrowUp':
        case 'ArrowDown':
          return adapter.addYears(date, sign * 4);
        case 'PageUp':
        case 'PageDown':
          return adapter.addYears(date, sign * 10);
        case 'Home':
          return adapter.create(decadeStartOf(adapter.getYear(date)), 0, 1);
        case 'End':
          return adapter.create(decadeStartOf(adapter.getYear(date)) + 9, 0, 1);
      }
      break;
    case 'decade':
      switch (key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          return adapter.addYears(date, sign * 10);
        case 'ArrowUp':
        case 'ArrowDown':
          return adapter.addYears(date, sign * 40);
        case 'PageUp':
        case 'PageDown':
          return adapter.addYears(date, sign * 100);
        case 'Home':
          return adapter.create(centuryStartOf(adapter.getYear(date)), 0, 1);
        case 'End':
          return adapter.create(centuryStartOf(adapter.getYear(date)) + 90, 0, 1);
      }
      break;
  }
  return date;
}

/** Keeps `date` within `[min, max]` (day granularity). */
export function clampToRules<TDate>(adapter: DateAdapter<TDate>, date: TDate, rules: DateRules<TDate>): TDate {
  const min = rules.min && adapter.isValid(rules.min) ? adapter.startOfDay(rules.min) : null;
  const max = rules.max && adapter.isValid(rules.max) ? adapter.startOfDay(rules.max) : null;
  return adapter.clamp(date, min, max);
}

/** The date that represents the period of `view` containing `date` (day, first of month, Jan 1, first year of decade). */
export function representativeDate<TDate>(adapter: DateAdapter<TDate>, view: CalendarView, date: TDate): TDate {
  const year = adapter.getYear(date);
  switch (view) {
    case 'day':
      return adapter.startOfDay(date);
    case 'month':
      return adapter.create(year, adapter.getMonth(date), 1);
    case 'year':
      return adapter.create(year, 0, 1);
    case 'decade':
      return adapter.create(decadeStartOf(year), 0, 1);
  }
}

/** Whether the period (day / month / year / decade) represented by `date` cannot be selected under `rules`. */
export function isPeriodDisabled<TDate>(
  adapter: DateAdapter<TDate>,
  view: CalendarView,
  date: TDate,
  rules: DateRules<TDate>,
): boolean {
  const year = adapter.getYear(date);
  switch (view) {
    case 'day':
      return isDateRestricted(adapter, date, { ...rules, granularity: 'day' });
    case 'month':
      return periodOutOfBounds(adapter, adapter.startOfMonth(date), adapter.getLastDayOfMonth(date), rules);
    case 'year':
      return periodOutOfBounds(adapter, adapter.create(year, 0, 1), adapter.create(year, 11, 31), rules);
    case 'decade': {
      const start = decadeStartOf(year);
      return periodOutOfBounds(adapter, adapter.create(start, 0, 1), adapter.create(start + 9, 11, 31), rules);
    }
  }
}
