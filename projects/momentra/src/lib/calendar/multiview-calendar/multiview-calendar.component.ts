import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { MomentraFormControl, provideMomentraControl } from '../../core/forms/momentra-form-control';
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
import { MtrThemeDirective } from '../../theming/theme.directive';
import type { MtrCellContext } from '../calendar/calendar.component';

export type MtrMultiviewMode = 'single' | 'multiple' | 'range';

/**
 * Several consecutive months side by side under one header.
 *
 * The value is always an array: `[date]` in `single` mode, any number of dates in `multiple` mode and
 * `[start, end]` (end optional while picking) in `range` mode.
 * Styling: `--mtr-multiview-gap` is the space between months; all `--mtr-*` tokens apply.
 *
 * @example
 * ```html
 * <mtr-multiview-calendar [views]="2" mode="range" [(value)]="range" />
 * ```
 */
@Component({
  selector: 'mtr-multiview-calendar',
  templateUrl: './multiview-calendar.component.html',
  styleUrl: './multiview-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  hostDirectives: [{ directive: MtrThemeDirective, inputs: ['theme'] }],
  providers: [provideMomentraControl(() => MultiviewCalendarComponent)],
  host: { class: 'mtr-multiview-calendar', '[class.mtr-disabled]': 'isDisabled()' },
})
export class MultiviewCalendarComponent<TDate = Date> extends MomentraFormControl<TDate, TDate[]> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly value = model<TDate[]>([]);
  /** Number of months shown. */
  readonly views = input(2, { transform: (v: unknown) => Math.max(1, numberAttribute(v, 2)) });
  readonly mode = input<MtrMultiviewMode>('single');
  readonly min = input<TDate | null | undefined>(null);
  readonly max = input<TDate | null | undefined>(null);
  readonly disabledDates = input<DisabledDates<TDate> | null | undefined>(null);
  readonly cellTemplate = input<TemplateRef<MtrCellContext<TDate>> | null | undefined>(null);
  /** First month shown when nothing is selected. Defaults to today. */
  readonly initialDate = input<TDate | null | undefined>(null);

  /** Emits the date that was just clicked. */
  readonly dateSelect = output<TDate>();

  private readonly first = linkedSignal<TDate>(() =>
    this.adapter.startOfMonth(this.value()[0] ?? this.initialDate() ?? this.adapter.today()),
  );
  protected readonly activeDate = linkedSignal<TDate>(() => this.value()[0] ?? this.initialDate() ?? this.adapter.today());
  private readonly hovered = signal<TDate | null>(null);

  private readonly rules = computed<DateRules<TDate>>(() => ({
    min: this.min(),
    max: this.max(),
    isDisabled: createDisabledPredicate(this.adapter, this.disabledDates()),
  }));
  private readonly focusDate = computed(() => clampToRules(this.adapter, this.activeDate(), this.rules()));

  protected readonly panels = computed(() => {
    const a = this.adapter;
    const mode = this.mode();
    const value = this.value();
    const [start, end] = value;
    const ctx: CalendarContext<TDate> = {
      adapter: a,
      locale: this.effectiveLocale(),
      firstDayOfWeek: this.effectiveLocale().firstDayOfWeek,
      rules: this.rules(),
      selected: null,
      active: this.focusDate(),
      range: mode === 'range' && start ? { start, end: end ?? this.hovered() } : null,
    };
    return Array.from({ length: this.views() }, (_, i) => {
      const vm = buildDayView(ctx, a.addMonths(this.first(), i));
      const rows = vm.rows.map((row) =>
        row.map((cell) => ({
          ...cell,
          selected: mode !== 'range' && value.some((d) => a.isSameDay(d, cell.date)),
        })),
      );
      return { title: vm.title, weekdays: vm.weekdays, rows, key: i };
    });
  });

  protected readonly headerTitle = computed(() => {
    const a = this.adapter;
    const l = this.effectiveLocale();
    const from = a.formatMonthYear(this.first(), l);
    return this.views() === 1 ? from : `${from} – ${a.formatMonthYear(a.addMonths(this.first(), this.views() - 1), l)}`;
  });

  protected override applyExternalValue(value: unknown): void {
    const list = Array.isArray(value) ? value : value == null ? [] : [value];
    this.value.set(list.map((v) => this.adapter.deserialize(v)).filter((d): d is TDate => d != null));
  }
  protected override validationDependencies(): unknown {
    return [this.value(), this.min(), this.max(), this.disabledDates()];
  }
  protected override computeErrors(): ValidationErrors | null {
    const value = this.value();
    if (value.length === 0) {
      return validateDate(this.adapter, null, { ...this.rules(), required: this.required() });
    }
    for (const d of value) {
      const errors = validateDate(this.adapter, d, this.rules());
      if (errors) {
        return errors;
      }
    }
    return null;
  }
  protected override formatForMessage(value: unknown): string {
    return String(value);
  }

  // ------------------------------------------------------------------ interaction

  protected shift(direction: 1 | -1): void {
    this.first.set(this.adapter.addMonths(this.first(), direction));
  }

  protected goToday(): void {
    this.first.set(this.adapter.startOfMonth(this.adapter.today()));
  }

  protected pick(cell: CalendarCell<TDate>): void {
    if (cell.disabled || !this.isInteractive()) {
      return;
    }
    const a = this.adapter;
    const date = cell.date;
    const current = this.value();
    let next: TDate[];
    switch (this.mode()) {
      case 'single':
        next = [date];
        break;
      case 'multiple':
        next = current.some((d) => a.isSameDay(d, date)) ? current.filter((d) => !a.isSameDay(d, date)) : [...current, date];
        break;
      case 'range':
        next =
          current.length === 1
            ? a.isBefore(date, current[0])
              ? [date, current[0]]
              : [current[0], date]
            : [date];
        break;
    }
    this.activeDate.set(date);
    this.value.set(next);
    this.notifyChange(next);
    this.markTouched();
    this.dateSelect.emit(date);
  }

  protected onHover(cell: CalendarCell<TDate> | null): void {
    this.hovered.set(cell && !cell.disabled ? cell.date : null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!NAVIGATION_KEYS.has(event.key) || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    event.preventDefault();
    const a = this.adapter;
    const next = clampToRules(
      a,
      moveFocus(a, 'day', this.focusDate(), event.key as NavigationKey, {
        firstDayOfWeek: this.effectiveLocale().firstDayOfWeek,
        shift: event.shiftKey,
      }),
      this.rules(),
    );
    this.activeDate.set(next);
    // Arrow keys cross from one grid into the next; page the months when focus leaves the shown ones.
    const offset = (a.getYear(next) - a.getYear(this.first())) * 12 + a.getMonth(next) - a.getMonth(this.first());
    if (offset < 0) {
      this.first.set(a.startOfMonth(next));
    } else if (offset >= this.views()) {
      this.first.set(a.addMonths(a.startOfMonth(next), 1 - this.views()));
    }
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('button.mtr-cell[tabindex="0"]')?.focus(),
      { injector: this.injector },
    );
  }

  protected cellContext(cell: CalendarCell<TDate>): MtrCellContext<TDate> {
    return { $implicit: cell, view: 'day' };
  }
}
