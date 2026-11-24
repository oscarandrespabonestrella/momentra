import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { CalendarComponent, type MtrCellContext } from '../../calendar/calendar/calendar.component';
import { MomentraFormControl, provideMomentraControl } from '../../core/forms/momentra-form-control';
import type { LocaleOverrides } from '../../core/services/momentra-settings';
import { emptyRange, type DateRange, type DateRangePreset } from '../../core/models/date-range';
import { createDisabledPredicate, type DisabledDates } from '../../core/utils/disabled-dates';
import { isSameRange, pickRangeDate, resolvePreset } from '../../core/utils/range-utils';
import { validateRange } from '../../core/validators/validation';
import { MtrFieldShell } from '../../inputs/shared/field-shell.component';
import { POPUP_POSITIONS } from '../../inputs/shared/popup-control';
import { MtrThemeDirective } from '../../theming/theme.directive';

type Edge = 'start' | 'end';

/**
 * Selects a start and an end date. Click (or press Enter on) a first day, then a second day; the
 * days in between are highlighted, previewing the range while the pointer or keyboard focus moves.
 *
 * The value is a {@link DateRange}. It can be **incomplete** (only `start`) while the user is still
 * choosing; an incomplete range is reported as a `mtrRangeIncomplete` validation error. Both ends are
 * local start-of-day dates.
 *
 * @example
 * ```html
 * <mtr-date-range-picker formControlName="stay" [minRangeLength]="2" [maxRangeLength]="14" [presets]="presets" />
 * ```
 */
@Component({
  selector: 'mtr-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  styleUrl: './date-range-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MtrFieldShell, CalendarComponent, CdkConnectedOverlay, CdkTrapFocus],
  hostDirectives: [{ directive: MtrThemeDirective, inputs: ['theme'] }],
  providers: [provideMomentraControl(() => DateRangePickerComponent)],
  host: { class: 'mtr-date-range-picker', '[class.mtr-invalid]': 'invalid()', '[class.mtr-open]': 'open()' },
})
export class DateRangePickerComponent<TDate = Date> extends MomentraFormControl<TDate, DateRange<TDate> | null> {
  private readonly injector = inject(Injector);

  /** The range (two-way bindable: `[(value)]`). Either end may be `null`. */
  readonly value = model<DateRange<TDate>>(emptyRange());
  /** Whether the popup is open (two-way bindable: `[(open)]`). */
  readonly open = model(false);

  readonly min = input<TDate | null | undefined>(null);
  readonly max = input<TDate | null | undefined>(null);
  /** Minimum number of days a range must span (inclusive: one day counts as 1). */
  readonly minRangeLength = input<number | null | undefined>(null);
  /** Maximum number of days a range may span (inclusive). */
  readonly maxRangeLength = input<number | null | undefined>(null);
  /** Dates that cannot be part of a range: a predicate or a list of days. */
  readonly disabledDates = input<DisabledDates<TDate> | null | undefined>(null);
  /** Shortcut ranges shown next to the calendar. */
  readonly presets = input<readonly DateRangePreset<TDate>[] | null | undefined>(null);
  /** Date pattern for both inputs. Defaults to the locale's date format. */
  readonly format = input<string | null | undefined>(undefined);
  /** Placeholder for both inputs. Defaults to the pattern. */
  readonly placeholder = input<string | null | undefined>(undefined);
  /** Custom content for day cells. */
  readonly cellTemplate = input<TemplateRef<MtrCellContext<TDate>> | null | undefined>(null);
  readonly showToday = input<boolean | null | undefined, unknown>(undefined, {
    transform: (v) => (v == null ? undefined : booleanAttribute(v)),
  });
  readonly showClear = input<boolean | null | undefined, unknown>(undefined, {
    transform: (v) => (v == null ? undefined : booleanAttribute(v)),
  });
  /** Closes the popup once a complete range was picked. Defaults to the global setting. */
  readonly closeOnSelect = input<boolean | null | undefined, unknown>(undefined, {
    transform: (v) => (v == null ? undefined : booleanAttribute(v)),
  });
  /** Month to show when the popup opens with no value. Defaults to today. */
  readonly initialDate = input<TDate | null | undefined>(null);

  /** Emits when the popup opens. */
  readonly opened = output<void>();
  /** Emits when the popup closes. */
  readonly closed = output<void>();

  protected readonly shell = viewChild.required(MtrFieldShell);
  private readonly calendar = viewChild(CalendarComponent);

  protected readonly popupId = `${this.uid}-popup`;
  protected readonly startId = computed(() => this.inputId() ?? `${this.uid}-start`);
  protected readonly endId = `${this.uid}-end`;
  protected readonly errorsId = `${this.uid}-errors`;
  protected readonly positions = POPUP_POSITIONS;

  protected override readonly localeOverrides = computed<LocaleOverrides>(() => ({ dateFormat: this.format() }));
  protected readonly pattern = computed(() => this.effectiveLocale().dateFormat);
  protected readonly placeholderText = computed(
    () => this.placeholder() ?? this.settings.config.placeholder ?? this.pattern().toLowerCase(),
  );

  protected readonly startText = signal('');
  protected readonly endText = signal('');
  protected readonly startFailed = signal(false);
  protected readonly endFailed = signal(false);
  private typing: Edge | null = null;

  /** The day under the pointer / focus while the end of the range is being chosen. */
  protected readonly hoverDate = signal<TDate | null>(null);

  protected readonly selectingEnd = computed(() => {
    const { start, end } = this.value();
    return start !== null && end === null;
  });

  protected readonly clearVisible = computed(
    () =>
      (this.showClear() ?? this.settings.config.showClearButton) &&
      this.isInteractive() &&
      (this.startText() !== '' || this.endText() !== ''),
  );

  /** The range the calendar highlights: the value, or a live preview while choosing the end. */
  protected readonly highlight = computed<DateRange<TDate>>(() => {
    const { start, end } = this.value();
    const hover = this.hoverDate();
    if (start && !end && hover && this.adapter.compare(this.adapter.startOfDay(hover), this.adapter.startOfDay(start)) >= 0) {
      return { start, end: hover };
    }
    return { start, end };
  });

  /** Disabled dates, plus — while choosing the end — days that would break the length limits. */
  protected readonly calendarDisabled = computed<((date: TDate) => boolean) | null>(() => {
    const base = createDisabledPredicate(this.adapter, this.disabledDates());
    const { start, end } = this.value();
    const minLen = this.minRangeLength();
    const maxLen = this.maxRangeLength();
    if (!start || end || (minLen == null && maxLen == null)) {
      return base;
    }
    const a = this.adapter;
    return (date: TDate) => {
      if (base?.(date)) {
        return true;
      }
      const offset = a.differenceInDays(date, start);
      if (offset < 0) {
        return false; // an earlier day restarts the range
      }
      const length = offset + 1;
      return (minLen != null && length < minLen) || (maxLen != null && length > maxLen);
    };
  });

  /** The month the left calendar shows; set when the popup opens, so picking an end date never jumps the view. */
  protected readonly popupAnchor = signal<TDate | null>(null);
  protected readonly leftMonth = computed(() => this.popupAnchor() ?? this.adapter.today());
  protected readonly rightMonth = computed(() => this.adapter.addMonths(this.leftMonth(), 1));

  /** "Nov 18 – Dec 3, 2026 · 16 days" once both ends are picked. */
  protected readonly summary = computed(() => {
    const { start, end } = this.value();
    if (!start || !end) {
      return '';
    }
    const a = this.adapter;
    const l = this.effectiveLocale();
    const days = a.differenceInDays(end, start) + 1;
    return `${a.formatDate(start, l)} – ${a.formatDate(end, l)} · ${this.labels().rangeDays.replace('{n}', String(days))}`;
  });

  protected readonly presetList = computed(() =>
    (this.presets() ?? []).map((preset) => {
      const range = resolvePreset(preset);
      return {
        preset,
        label: preset.label,
        active: isSameRange(this.adapter, range, this.value()),
        disabled: validateRange(this.adapter, range, this.rangeRules()) !== null,
      };
    }),
  );

  protected readonly hint = computed(() => (this.selectingEnd() ? this.labels().selectingEnd : ''));

  private readonly rangeRules = computed(() => ({
    min: this.min(),
    max: this.max(),
    isDisabled: createDisabledPredicate(this.adapter, this.disabledDates()),
    minLength: this.minRangeLength(),
    maxLength: this.maxRangeLength(),
  }));

  constructor() {
    super();
    effect(() => {
      this.value();
      this.pattern();
      this.effectiveLocale();
      untracked(() => this.syncText());
    });
  }

  // ----------------------------------------------------------------- forms plumbing

  protected override applyExternalValue(value: unknown): void {
    const raw = (value ?? {}) as { start?: unknown; end?: unknown };
    this.typing = null;
    this.startFailed.set(false);
    this.endFailed.set(false);
    this.value.set({ start: this.adapter.deserialize(raw.start), end: this.adapter.deserialize(raw.end) });
    this.syncText();
  }

  protected override validationDependencies(): unknown {
    return [
      this.value(),
      this.min(),
      this.max(),
      this.minRangeLength(),
      this.maxRangeLength(),
      this.disabledDates(),
      this.startFailed(),
      this.endFailed(),
    ];
  }

  protected override computeErrors(): ValidationErrors | null {
    if (this.startFailed() || this.endFailed()) {
      return { mtrInvalidDate: { value: this.startFailed() ? this.startText() : this.endText() } };
    }
    return validateRange(this.adapter, this.value(), { ...this.rangeRules(), required: this.required() });
  }

  protected override formatForMessage(value: unknown): string {
    return this.adapter.isValid(value as TDate) ? this.adapter.formatDate(value as TDate, this.effectiveLocale()) : String(value);
  }

  // ----------------------------------------------------------------- text <-> value

  private formatDay(date: TDate | null): string {
    return date !== null && this.adapter.isValid(date) ? this.adapter.format(date, this.pattern(), this.effectiveLocale()) : '';
  }

  private syncText(): void {
    const { start, end } = this.value();
    // Unparsable text is the user's work in progress: keep it so they can correct it.
    if (this.typing !== 'start' && !this.startFailed()) {
      this.startText.set(this.formatDay(start));
    }
    if (this.typing !== 'end' && !this.endFailed()) {
      this.endText.set(this.formatDay(end));
    }
  }

  private commit(next: DateRange<TDate>): void {
    const current = this.value();
    if (!isSameRange(this.adapter, current, next)) {
      this.value.set(next);
      this.notifyChange(next);
    }
  }

  protected onTextInput(edge: Edge, text: string): void {
    this.typing = edge;
    (edge === 'start' ? this.startText : this.endText).set(text);
    const failed = edge === 'start' ? this.startFailed : this.endFailed;
    const current = this.value();
    if (text.trim() === '') {
      failed.set(false);
      this.commit(edge === 'start' ? { start: null, end: current.end } : { start: current.start, end: null });
      return;
    }
    const parsed = this.adapter.parse(text, this.pattern(), this.effectiveLocale());
    failed.set(parsed === null);
    this.commit(edge === 'start' ? { start: parsed, end: current.end } : { start: current.start, end: parsed });
  }

  protected commitText(): void {
    this.typing = null;
    this.syncText();
  }

  protected onInputBlur(): void {
    this.commitText();
    if (!this.open()) {
      this.markTouched();
    }
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      event.stopPropagation();
      this.closePopup(true);
    } else if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.openPopup();
    } else if (event.key === 'Enter') {
      this.commitText();
    }
  }

  protected clear(): void {
    if (!this.isInteractive()) {
      return;
    }
    this.typing = null;
    this.startFailed.set(false);
    this.endFailed.set(false);
    this.commit(emptyRange());
    this.startText.set('');
    this.endText.set('');
    this.hoverDate.set(null);
    this.markTouched();
    this.closePopup();
    this.focusStart();
  }

  // ----------------------------------------------------------------- popup

  protected get shouldCloseOnSelect(): boolean {
    return this.closeOnSelect() ?? this.settings.config.closeOnSelect;
  }

  openPopup(): void {
    if (!this.isInteractive() || this.open()) {
      return;
    }
    this.commitText();
    const { start, end } = this.value();
    this.popupAnchor.set(start ?? end ?? this.initialDate() ?? null);
    this.open.set(true);
    this.opened.emit();
  }

  closePopup(restoreFocus = false): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.hoverDate.set(null);
    this.commitText();
    this.markTouched();
    this.closed.emit();
    if (restoreFocus) {
      this.focusStart();
    }
  }

  /** Moves focus to the start input. */
  focusStart(): void {
    this.shell().element.querySelector<HTMLInputElement>('input')?.focus();
  }

  protected togglePopup(): void {
    if (this.open()) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  protected onAttach(): void {
    afterNextRender(() => this.calendar()?.focusActiveCell(), { injector: this.injector });
  }

  protected onDetach(): void {
    this.closePopup();
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!this.shell().element.contains(event.target as Node)) {
      this.closePopup();
    }
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closePopup(true);
    }
  }

  // ----------------------------------------------------------------- calendar

  protected onCalendarSelect(date: TDate): void {
    this.typing = null;
    this.startFailed.set(false);
    this.endFailed.set(false);
    const next = pickRangeDate(this.adapter, this.value(), date);
    this.commit(next);
    this.syncText();
    if (next.end !== null) {
      this.hoverDate.set(null);
      this.markTouched();
      if (this.shouldCloseOnSelect) {
        this.closePopup(true);
      }
    }
  }

  /**
   * Keeps the two calendars consecutive: when either one pages or keyboard focus leaves its month,
   * the other follows.
   * ponytail: crossing from the left month into the right one pages both by a month instead of
   * handing focus over; teach mtr-calendar an external focus API if that matters.
   */
  protected onMonthChange(date: TDate, panel: 0 | 1): void {
    this.popupAnchor.set(panel === 0 ? date : this.adapter.addMonths(date, -1));
  }

  protected onHover(date: TDate | null): void {
    this.hoverDate.set(this.selectingEnd() ? date : null);
  }

  protected applyPreset(preset: DateRangePreset<TDate>): void {
    if (!this.isInteractive()) {
      return;
    }
    const range = resolvePreset(preset);
    this.typing = null;
    this.startFailed.set(false);
    this.endFailed.set(false);
    this.commit({ start: this.adapter.startOfDay(range.start), end: this.adapter.startOfDay(range.end) });
    this.syncText();
    this.markTouched();
    if (this.shouldCloseOnSelect) {
      this.closePopup(true);
    }
  }
}
