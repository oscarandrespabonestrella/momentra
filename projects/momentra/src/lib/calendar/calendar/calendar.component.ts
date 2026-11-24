import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
} from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { MomentraFormControl, provideMomentraControl } from '../../core/forms/momentra-form-control';
import {
  NAVIGATION_KEYS,
  buildView,
  clampToRules,
  columnsOf,
  decadeStartOf,
  centuryStartOf,
  drillDownView,
  drillUpView,
  isPeriodDisabled,
  moveFocus,
  representativeDate,
  shiftView,
  type CalendarCell,
  type CalendarContext,
  type CalendarView,
  type NavigationKey,
} from '../../core/utils/calendar-engine';
import { createDisabledPredicate, type DisabledDates } from '../../core/utils/disabled-dates';
import { validateDate, type DateRules } from '../../core/validators/validation';
import { MtrThemeDirective } from '../../theming/theme.directive';

/** Template context for custom day / month / year cells (`<ng-template let-cell>`). */
export interface MtrCellContext<TDate> {
  /** The cell being rendered. */
  $implicit: CalendarCell<TDate>;
  /** The view the cell belongs to. */
  view: CalendarView;
}

/**
 * A calendar with day, month, year and decade views.
 *
 * Standalone it selects a day; with `selectionView` it can select a month, year or decade instead
 * (this is how `mtr-month-picker`, `mtr-year-picker` and `mtr-decade-picker` are built).
 *
 * Keyboard: arrows move, `PageUp`/`PageDown` change month (with `Shift`: year), `Home`/`End` jump to the
 * start/end of the week, `Enter`/`Space` select, `Ctrl+↑` goes to a coarser view.
 */
@Component({
  selector: 'mtr-calendar',
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  hostDirectives: [{ directive: MtrThemeDirective, inputs: ['theme'] }],
  providers: [provideMomentraControl(() => CalendarComponent)],
  host: { class: 'mtr-calendar', '[class.mtr-disabled]': 'isDisabled()' },
})
export class CalendarComponent<TDate = Date> extends MomentraFormControl<TDate, TDate | null> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** The selected date (two-way bindable: `[(value)]`). */
  readonly value = model<TDate | null>(null);
  /** The displayed view (two-way bindable: `[(view)]`). */
  readonly view = model<CalendarView>('day');
  /** The view in which picking a cell *selects*; coarser views drill down instead. */
  readonly selectionView = input<CalendarView>('day');
  readonly min = input<TDate | null | undefined>(null);
  readonly max = input<TDate | null | undefined>(null);
  /** Dates that cannot be selected, as a predicate or a list of days. */
  readonly disabledDates = input<DisabledDates<TDate> | null | undefined>(null);
  /** Highlighted range; either end may be `null`. Used by the range picker. */
  readonly range = input<{ start: TDate | null; end: TDate | null } | null | undefined>(null);
  /** Custom content for day / month / year / decade cells. */
  readonly cellTemplate = input<TemplateRef<MtrCellContext<TDate>> | null | undefined>(null);
  /** Date to show when nothing is selected. Defaults to today. */
  readonly initialDate = input<TDate | null | undefined>(null);
  /** Shows the *Today* button. Defaults to the global setting. */
  readonly showToday = input<boolean | null | undefined, unknown>(undefined, {
    transform: (v) => (v == null ? undefined : booleanAttribute(v)),
  });
  /** Always render six weeks in the day view. Defaults to the global setting. */
  readonly fixedWeeks = input<boolean | null | undefined, unknown>(undefined, {
    transform: (v) => (v == null ? undefined : booleanAttribute(v)),
  });

  /** Emits when the user picks a date in the selection view. */
  readonly dateSelect = output<TDate>();
  /** Emits the day under the pointer / focus in the day view, or `null` when it leaves the grid. */
  readonly dateHover = output<TDate | null>();
  /** Emits when keyboard focus moves to another date. */
  readonly activeDateChange = output<TDate>();

  /** The date that owns keyboard focus; it also decides which page is displayed. */
  protected readonly activeDate = linkedSignal<TDate>(() => this.value() ?? this.initialDate() ?? this.adapter.today());

  protected readonly rules = computed<DateRules<TDate>>(() => {
    return { min: this.min(), max: this.max(), isDisabled: createDisabledPredicate(this.adapter, this.disabledDates()) };
  });

  protected readonly focusDate = computed(() => clampToRules(this.adapter, this.activeDate(), this.rules()));

  protected readonly context = computed<CalendarContext<TDate>>(() => ({
    adapter: this.adapter,
    locale: this.effectiveLocale(),
    firstDayOfWeek: this.effectiveLocale().firstDayOfWeek,
    rules: this.rules(),
    selected: this.value(),
    active: this.focusDate(),
    range: this.range(),
    fixedWeeks: this.fixedWeeks() ?? this.settings.config.fixedWeeks,
  }));

  protected readonly viewModel = computed(() => buildView(this.view(), this.context(), this.focusDate()));

  protected readonly showTodayButton = computed(() => this.showToday() ?? this.settings.config.showTodayButton);

  protected readonly todayTarget = computed(() => representativeDate(this.adapter, this.selectionView(), this.adapter.today()));
  protected readonly todayDisabled = computed(
    () => this.isDisabled() || isPeriodDisabled(this.adapter, this.selectionView(), this.todayTarget(), this.rules()),
  );
  protected readonly todayLabel = computed(() => this.labels().today);

  protected readonly canDrillUp = computed(() => drillUpView(this.view()) !== null);

  protected readonly prevLabel = computed(() => this.navLabel(-1));
  protected readonly nextLabel = computed(() => this.navLabel(1));
  protected readonly prevDisabled = computed(() => this.pageOutOfBounds(-1));
  protected readonly nextDisabled = computed(() => this.pageOutOfBounds(1));

  protected override applyExternalValue(value: unknown): void {
    this.value.set(this.adapter.deserialize(value));
  }

  protected override validationDependencies(): unknown {
    return [this.value(), this.min(), this.max(), this.disabledDates()];
  }

  protected override computeErrors(): ValidationErrors | null {
    return validateDate(this.adapter, this.value(), { ...this.rules(), required: this.required() });
  }

  protected override formatForMessage(value: unknown): string {
    return this.adapter.isValid(value as TDate)
      ? this.adapter.formatDate(value as TDate, this.effectiveLocale())
      : String(value);
  }

  // ----------------------------------------------------------------------------- public API

  /** Moves keyboard focus to the active cell (used by popups when they open). */
  focusActiveCell(): void {
    this.host.nativeElement.querySelector<HTMLElement>('button.mtr-cell[tabindex="0"]')?.focus();
  }

  // ----------------------------------------------------------------------------- interaction

  protected pick(cell: CalendarCell<TDate>): void {
    if (cell.disabled || !this.isInteractive()) {
      return;
    }
    const view = this.view();
    if (view === this.selectionView()) {
      this.select(cell.date);
      return;
    }
    const lower = drillDownView(view);
    if (lower) {
      this.activeDate.set(this.drillTarget(view, cell.date));
      this.view.set(lower);
      this.focusAfterRender();
    }
  }

  protected selectToday(): void {
    if (this.todayDisabled() || !this.isInteractive()) {
      return;
    }
    const target = this.todayTarget();
    this.activeDate.set(target);
    this.view.set(this.selectionView());
    this.select(target);
    this.focusAfterRender();
  }

  private select(date: TDate): void {
    this.value.set(date);
    this.notifyChange(date);
    this.markTouched();
    this.dateSelect.emit(date);
  }

  protected shift(direction: 1 | -1): void {
    this.activeDate.set(shiftView(this.adapter, this.view(), this.focusDate(), direction));
    this.activeDateChange.emit(this.activeDate());
  }

  protected drillUp(): void {
    const coarser = drillUpView(this.view());
    if (coarser) {
      this.view.set(coarser);
      this.focusAfterRender();
    }
  }

  protected onGridKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' && event.ctrlKey) {
      event.preventDefault();
      this.drillUp();
      return;
    }
    if (!NAVIGATION_KEYS.has(event.key) || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    event.preventDefault();
    const next = moveFocus(this.adapter, this.view(), this.focusDate(), event.key as NavigationKey, {
      firstDayOfWeek: this.effectiveLocale().firstDayOfWeek,
      shift: event.shiftKey,
    });
    this.activeDate.set(clampToRules(this.adapter, next, this.rules()));
    this.activeDateChange.emit(this.activeDate());
    this.focusAfterRender();
  }

  protected onCellEnter(cell: CalendarCell<TDate>): void {
    if (this.view() === 'day' && !cell.disabled) {
      this.dateHover.emit(cell.date);
    }
  }

  protected onGridLeave(): void {
    if (this.view() === 'day') {
      this.dateHover.emit(null);
    }
  }

  protected onCellFocus(cell: CalendarCell<TDate>): void {
    if (this.view() === 'day' && !cell.disabled) {
      this.dateHover.emit(cell.date);
    }
  }

  protected cellAriaDisabled(cell: CalendarCell<TDate>): true | null {
    return cell.disabled || this.isDisabled() ? true : null;
  }

  protected gridLabel(): string {
    return this.viewModel().title;
  }

  protected columnsOfView(): number {
    return columnsOf(this.view());
  }

  protected cellContext(cell: CalendarCell<TDate>): MtrCellContext<TDate> {
    return { $implicit: cell, view: this.view() };
  }

  // ----------------------------------------------------------------------------- internals

  private focusAfterRender(): void {
    afterNextRender(() => this.focusActiveCell(), { injector: this.injector });
  }

  /** Keeps month/year/decade the user is navigating from when drilling down into a finer view. */
  private drillTarget(from: CalendarView, picked: TDate): TDate {
    const a = this.adapter;
    const active = this.focusDate();
    const year =
      from === 'decade'
        ? a.getYear(picked) + (a.getYear(active) - decadeStartOf(a.getYear(active)))
        : a.getYear(picked);
    const month = from === 'month' ? a.getMonth(picked) : a.getMonth(active);
    const day = Math.min(a.getDate(active), a.getDaysInMonth(a.create(year, month, 1)));
    return a.create(year, month, day);
  }

  private navLabel(direction: 1 | -1): string {
    const l = this.labels();
    const forward = direction === 1;
    switch (this.view()) {
      case 'day':
        return forward ? l.nextMonth : l.previousMonth;
      case 'month':
        return forward ? l.nextYear : l.previousYear;
      case 'year':
        return forward ? l.nextDecade : l.previousDecade;
      case 'decade':
        return forward ? l.nextCentury : l.previousCentury;
    }
  }

  /** `true` when every date of the previous/next page lies outside min/max. */
  private pageOutOfBounds(direction: 1 | -1): boolean {
    const a = this.adapter;
    const view = this.view();
    const target = shiftView(a, view, this.focusDate(), direction);
    const year = a.getYear(target);
    const { min, max } = this.rules();
    let first: TDate;
    let last: TDate;
    switch (view) {
      case 'day':
        first = a.startOfMonth(target);
        last = a.getLastDayOfMonth(target);
        break;
      case 'month':
        first = a.create(year, 0, 1);
        last = a.create(year, 11, 31);
        break;
      case 'year':
        first = a.create(decadeStartOf(year), 0, 1);
        last = a.create(decadeStartOf(year) + 9, 11, 31);
        break;
      case 'decade':
        first = a.create(centuryStartOf(year), 0, 1);
        last = a.create(centuryStartOf(year) + 99, 11, 31);
        break;
    }
    if (direction === -1) {
      return !!min && a.isValid(min) && a.compare(last, a.startOfDay(min)) < 0;
    }
    return !!max && a.isValid(max) && a.compare(first, a.startOfDay(max)) > 0;
  }
}
