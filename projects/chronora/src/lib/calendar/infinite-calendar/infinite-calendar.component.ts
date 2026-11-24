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
  signal,
  viewChild,
} from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { ChronoraFormControl, provideChronoraControl } from '../../core/forms/chronora-form-control';
import {
  NAVIGATION_KEYS,
  buildDayView,
  clampToRules,
  moveFocus,
  type CalendarCell,
  type CalendarContext,
  type NavigationKey,
} from '../../core/utils/calendar-engine';
import { createDisabledPredicate, type DisabledDates } from '../../core/utils/disabled-dates';
import { validateDate, type DateRules } from '../../core/validators/validation';
import { ChrThemeDirective } from '../../theming/theme.directive';
import type { ChrCellContext } from '../calendar/calendar.component';

const CHUNK = 12; // months added per scroll extension
// ponytail: the window only grows (no DOM recycling); add real virtualisation if users scroll past ~100 months.

/**
 * A calendar whose months scroll continuously. The header follows the month in view.
 * Styling: `--chr-infinite-height` / `--chr-infinite-width` size the scroll area; all `--chr-*` tokens apply.
 *
 * @example
 * ```html
 * <chr-infinite-calendar [(value)]="date" style="--chr-infinite-height: 360px" />
 * ```
 */
@Component({
  selector: 'chr-infinite-calendar',
  templateUrl: './infinite-calendar.component.html',
  styleUrl: './infinite-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  hostDirectives: [{ directive: ChrThemeDirective, inputs: ['theme'] }],
  providers: [provideChronoraControl(() => InfiniteCalendarComponent)],
  host: { class: 'chr-infinite-calendar', '[class.chr-disabled]': 'isDisabled()' },
})
export class InfiniteCalendarComponent<TDate = Date> extends ChronoraFormControl<TDate, TDate | null> {
  private readonly injector = inject(Injector);
  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  readonly value = model<TDate | null>(null);
  readonly min = input<TDate | null | undefined>(null);
  readonly max = input<TDate | null | undefined>(null);
  readonly disabledDates = input<DisabledDates<TDate> | null | undefined>(null);
  readonly cellTemplate = input<TemplateRef<ChrCellContext<TDate>> | null | undefined>(null);
  /** Month to show first when nothing is selected. Defaults to today. */
  readonly initialDate = input<TDate | null | undefined>(null);
  /** Shows the column of months next to the calendar (click one to scroll there). */
  readonly monthRail = input(true, { transform: booleanAttribute });
  readonly showToday = input<boolean | null | undefined, unknown>(undefined, {
    transform: (v) => (v == null ? undefined : booleanAttribute(v)),
  });

  readonly dateSelect = output<TDate>();

  /** Anchor month of the rendered window; `before`/`after` count months around it. */
  private readonly origin = linkedSignal<TDate>(() =>
    this.adapter.startOfMonth(this.value() ?? this.initialDate() ?? this.adapter.today()),
  );
  private readonly before = signal(CHUNK);
  private readonly after = signal(CHUNK * 2);
  protected readonly activeDate = linkedSignal<TDate>(() => this.value() ?? this.initialDate() ?? this.adapter.today());
  /** Index (relative to `origin`) of the month at the top of the scroll area. */
  protected readonly topMonth = signal(0);

  private readonly rules = computed<DateRules<TDate>>(() => ({
    min: this.min(),
    max: this.max(),
    isDisabled: createDisabledPredicate(this.adapter, this.disabledDates()),
  }));
  private readonly focusDate = computed(() => clampToRules(this.adapter, this.activeDate(), this.rules()));

  private readonly context = computed<CalendarContext<TDate>>(() => ({
    adapter: this.adapter,
    locale: this.effectiveLocale(),
    firstDayOfWeek: this.effectiveLocale().firstDayOfWeek,
    rules: this.rules(),
    selected: this.value(),
    active: this.focusDate(),
  }));

  protected readonly months = computed(() => {
    const ctx = this.context();
    const out = [];
    for (let i = -this.before(); i < this.after(); i++) {
      const vm = buildDayView(ctx, this.adapter.addMonths(this.origin(), i));
      out.push({ index: i, title: vm.title, rows: vm.rows });
    }
    return out;
  });
  protected readonly rail = computed(() => {
    const a = this.adapter;
    const l = this.effectiveLocale();
    const top = this.topMonth();
    return Array.from({ length: 11 }, (_, k) => {
      const index = top - 5 + k;
      const d = a.addMonths(this.origin(), index);
      const newYear = a.getMonth(d) === 0;
      return {
        index,
        label: newYear ? String(a.getYear(d)) : a.format(d, 'MMM', l),
        year: newYear,
        current: index === top,
        aria: a.formatMonthYear(d, l),
      };
    });
  });
  protected readonly weekdays = computed(() => buildDayView(this.context(), this.origin()).weekdays);
  protected readonly headerTitle = computed(() => this.months().find((m) => m.index === this.topMonth())?.title ?? '');
  protected readonly showTodayButton = computed(() => this.showToday() ?? this.settings.config.showTodayButton);
  protected readonly todayDisabled = computed(() => {
    const { min, max, isDisabled } = this.rules();
    const a = this.adapter;
    const t = a.today();
    return (
      this.isDisabled() ||
      !!(min && a.isValid(min) && a.isBefore(t, a.startOfDay(min))) ||
      !!(max && a.isValid(max) && a.isAfter(t, max)) ||
      !!isDisabled?.(t)
    );
  });

  constructor() {
    super();
    afterNextRender(() => this.scrollToMonth(0, false), { injector: this.injector });
  }

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

  // ------------------------------------------------------------------ interaction

  protected pick(cell: CalendarCell<TDate>): void {
    if (cell.disabled || !this.isInteractive()) {
      return;
    }
    this.select(cell.date);
  }

  protected goToday(): void {
    if (this.todayDisabled() || !this.isInteractive()) {
      return;
    }
    const today = this.adapter.today();
    this.select(today);
    this.reveal(today);
  }

  private select(date: TDate): void {
    this.activeDate.set(date);
    this.value.set(date);
    this.notifyChange(date);
    this.markTouched();
    this.dateSelect.emit(date);
  }

  protected onScroll(): void {
    const el = this.scroller().nativeElement;
    let top = this.topMonth();
    for (const s of Array.from(el.querySelectorAll<HTMLElement>('section[data-i]'))) {
      if (s.offsetTop + s.offsetHeight > el.scrollTop + 1) {
        top = Number(s.dataset['i']);
        break;
      }
    }
    this.topMonth.set(top);
    if (el.scrollTop < 120) {
      const fromBottom = el.scrollHeight - el.scrollTop;
      this.before.update((n) => n + CHUNK);
      // Prepending pushes content down; restore the visual position.
      afterNextRender(() => (el.scrollTop = el.scrollHeight - fromBottom), { injector: this.injector });
    } else if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      this.after.update((n) => n + CHUNK);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!NAVIGATION_KEYS.has(event.key) || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    event.preventDefault();
    const next = moveFocus(this.adapter, 'day', this.focusDate(), event.key as NavigationKey, {
      firstDayOfWeek: this.effectiveLocale().firstDayOfWeek,
      shift: event.shiftKey,
    });
    const clamped = clampToRules(this.adapter, next, this.rules());
    this.activeDate.set(clamped);
    this.reveal(clamped);
  }

  protected goToMonth(index: number): void {
    this.before.update((n) => Math.max(n, -index + 1));
    this.after.update((n) => Math.max(n, index + 2));
    afterNextRender(() => this.scrollToMonth(index, true), { injector: this.injector });
  }

  /** Renders the month of `date`, scrolls it into view and focuses its cell. */
  private reveal(date: TDate): void {
    const a = this.adapter;
    const o = this.origin();
    const index = (a.getYear(date) - a.getYear(o)) * 12 + a.getMonth(date) - a.getMonth(o);
    this.before.update((n) => Math.max(n, -index + 1));
    this.after.update((n) => Math.max(n, index + 2));
    afterNextRender(
      () => {
        this.scrollToMonth(index, true);
        this.scroller().nativeElement.querySelector<HTMLElement>('button.chr-cell[tabindex="0"]')?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  private scrollToMonth(index: number, smooth: boolean): void {
    const el = this.scroller().nativeElement;
    const section = el.querySelector<HTMLElement>(`section[data-i="${index}"]`);
    if (section) {
      el.scrollTo({ top: section.offsetTop, behavior: smooth ? 'smooth' : 'auto' });
      this.topMonth.set(index);
    }
  }

  protected cellContext(cell: CalendarCell<TDate>): ChrCellContext<TDate> {
    return { $implicit: cell, view: 'day' };
  }
}
