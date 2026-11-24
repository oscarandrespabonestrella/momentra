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
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { InfiniteCalendarComponent } from '../../calendar/infinite-calendar/infinite-calendar.component';
import { CalendarComponent, type MtrCellContext } from '../../calendar/calendar/calendar.component';
import { provideMomentraControl } from '../../core/forms/momentra-form-control';
import type { LocaleOverrides } from '../../core/services/momentra-settings';
import { createDisabledPredicate, type DisabledDates } from '../../core/utils/disabled-dates';
import { normalizeStep, resolveTimePattern, snapToSteps } from '../../core/utils/time-engine';
import { validateDate } from '../../core/validators/validation';
import { patternHasSeconds, patternUses12Hours } from '../../formatting/format-pattern';
import { MtrThemeDirective } from '../../theming/theme.directive';
import { MtrFieldShell } from '../shared/field-shell.component';
import { MomentraPopupControl } from '../shared/popup-control';
import { MtrTimeSelector } from '../shared/time-selector.component';

/**
 * A combined date and time input. The popup shows a calendar next to hour/minute lists.
 *
 * The value is a **local date-time** (wall-clock fields in the local zone, no conversion to UTC).
 * `min`/`max` are compared as exact date-times; the time lists only restrict the time of day on
 * the boundary days.
 *
 * @example
 * ```html
 * <mtr-datetime-picker [(ngModel)]="appointment" dateFormat="yyyy-MM-dd" hourFormat="24" [minuteStep]="15" />
 * ```
 */
@Component({
  selector: 'mtr-datetime-picker',
  templateUrl: './datetime-picker.component.html',
  styleUrl: './datetime-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MtrFieldShell, CalendarComponent, InfiniteCalendarComponent, MtrTimeSelector, CdkConnectedOverlay, CdkTrapFocus],
  hostDirectives: [{ directive: MtrThemeDirective, inputs: ['theme'] }],
  providers: [provideMomentraControl(() => DateTimePickerComponent)],
  host: { class: 'mtr-datetime-picker', '[class.mtr-invalid]': 'invalid()', '[class.mtr-open]': 'open()' },
})
export class DateTimePickerComponent<TDate = Date> extends MomentraPopupControl<TDate> {
  private readonly injector = inject(Injector);

  /** Full date-time pattern. Overrides `dateFormat`, `timeFormat`, `hourFormat` and `showSeconds`. */
  readonly format = input<string | null | undefined>(undefined);
  /** Date part of the pattern, e.g. `'yyyy-MM-dd'`. Defaults to the locale's date format. */
  readonly dateFormat = input<string | null | undefined>(undefined);
  /** Time part of the pattern, e.g. `'HH:mm'`. Defaults to the locale's time format. */
  readonly timeFormat = input<string | null | undefined>(undefined);
  /** `12` or `24`. Defaults to the time pattern's clock. */
  readonly hourFormat = input<12 | 24 | null | undefined>(undefined);
  /** Shows seconds. Defaults to whatever the time pattern shows. */
  readonly showSeconds = input<boolean | null | undefined>(undefined);
  readonly hourStep = input(1);
  readonly minuteStep = input(1);
  readonly secondStep = input(1);
  /** Dates that cannot be selected: a predicate or a list of days. */
  readonly disabledDates = input<DisabledDates<TDate> | null | undefined>(null);
  /** Custom content for day cells in the calendar. */
  readonly cellTemplate = input<TemplateRef<MtrCellContext<TDate>> | null | undefined>(null);
  /** Shows the *Today* button in the calendar. Defaults to the global setting. */
  readonly showToday = input<boolean | null | undefined, unknown>(undefined, {
    transform: (v) => (v == null ? undefined : booleanAttribute(v)),
  });
  /** Month to show when the popup opens with no value. Defaults to today. */
  readonly initialDate = input<TDate | null | undefined>(null);

  /**
   * `'split'`: calendar and time lists side by side. `'tabs'`: a Date tab and a Time tab with Cancel / Set
   * buttons (narrow popup; picking a date switches to the Time tab).
   */
  readonly layout = input<'split' | 'tabs'>('split');

  protected readonly tab = signal<'date' | 'time'>('date');
  /** Tabs layout: the value to restore on Cancel, and whether a time was chosen since opening. */
  private previous: TDate | null = null;
  protected readonly timeChosen = signal(false);
  protected readonly canSet = computed(() => this.value() != null && this.timeChosen());

  private readonly calendar = viewChild(CalendarComponent);

  protected override readonly localeOverrides = computed<LocaleOverrides>(() => ({
    dateFormat: this.dateFormat(),
    timeFormat: this.timeFormat(),
  }));

  private readonly timePattern = computed(() =>
    resolveTimePattern({
      format: this.timeFormat(),
      hourFormat: this.hourFormat(),
      showSeconds: this.showSeconds(),
      localePattern: this.effectiveLocale().timeFormat,
    }),
  );
  protected readonly pattern = computed(
    () => this.format() ?? `${this.effectiveLocale().dateFormat} ${this.timePattern()}`,
  );
  protected readonly use12Hours = computed(() => patternUses12Hours(this.timePattern()));
  protected readonly secondsVisible = computed(() => patternHasSeconds(this.timePattern()));
  protected readonly calendarStart = computed(() => this.value() ?? this.initialDate() ?? null);

  private readonly steps = computed(() => ({
    hour: normalizeStep(this.hourStep(), this.use12Hours() ? 12 : 24),
    minute: normalizeStep(this.minuteStep(), 60),
    second: normalizeStep(this.secondStep(), 60),
  }));

  /** The time-of-day limits that apply on the currently selected day (only the boundary days are limited). */
  protected readonly timeMin = computed(() => this.boundaryFor(this.min()));
  protected readonly timeMax = computed(() => this.boundaryFor(this.max()));

  private boundaryFor(bound: TDate | null | undefined): TDate | null {
    const value = this.value();
    return bound && value && this.adapter.isValid(bound) && this.adapter.isSameDay(bound, value) ? bound : null;
  }

  protected override validateValue(value: TDate | null): ValidationErrors | null {
    return validateDate(this.adapter, value, {
      min: this.min(),
      max: this.max(),
      isDisabled: createDisabledPredicate(this.adapter, this.disabledDates()),
      granularity: 'instant',
      required: this.required(),
    });
  }

  protected override extraValidationDependencies(): unknown {
    return this.disabledDates();
  }

  protected override clampToBounds(date: TDate): TDate {
    const min = this.min();
    const max = this.max();
    return this.adapter.clamp(
      date,
      min && this.adapter.isValid(min) ? min : null,
      max && this.adapter.isValid(max) ? max : null,
    );
  }

  protected override unitStep(kind: string): number {
    const steps = this.steps();
    return kind === 'hour24' || kind === 'hour12' ? steps.hour : kind === 'minute' ? steps.minute : kind === 'second' ? steps.second : 1;
  }

  /** `ArrowUp`/`ArrowDown` step minutes; `Shift` steps days, `Ctrl` steps hours. */
  protected override stepValue(direction: 1 | -1, event: KeyboardEvent): TDate {
    const base = this.value() ?? this.adapter.now();
    const steps = this.steps();
    if (event.shiftKey) {
      return this.adapter.addDays(base, direction);
    }
    const minutes = event.ctrlKey || event.metaKey ? steps.hour * 60 : steps.minute;
    const date = this.adapter.withTime(
      base,
      this.adapter.getHours(base),
      this.adapter.getMinutes(base),
      this.adapter.getSeconds(base),
    );
    const total = this.adapter.secondsOfDay(date) + direction * minutes * 60;
    const dayShift = Math.floor(total / 86400);
    const inDay = total - dayShift * 86400;
    return this.adapter.withTime(
      this.adapter.addDays(date, dayShift),
      Math.floor(inDay / 3600),
      Math.floor((inDay % 3600) / 60),
      inDay % 60,
    );
  }

  protected onAttach(): void {
    this.previous = this.value();
    this.timeChosen.set(this.previous != null);
    this.tab.set('date');
    afterNextRender(() => this.calendar()?.focusActiveCell(), { injector: this.injector });
  }

  protected onCalendarSelect(day: TDate): void {
    const current = this.value();
    const next = current && this.adapter.isValid(current) ? this.adapter.combine(day, current) : day;
    this.setFromUi(this.clampToBounds(next));
    this.markTouched();
    if (this.layout() === 'tabs') {
      this.tab.set('time');
    }
  }

  protected cancel(): void {
    this.setFromUi(this.previous);
    this.closePopup(true);
  }

  protected onTimeChange(date: TDate): void {
    this.timeChosen.set(true);
    this.setFromUi(this.clampToBounds(date));
  }

  /** Sets the current date and time, snapped to the configured steps and limits. */
  protected selectNow(): void {
    const now = this.adapter.now();
    const snapped = snapToSteps(
      { hours: this.adapter.getHours(now), minutes: this.adapter.getMinutes(now), seconds: this.adapter.getSeconds(now) },
      this.steps(),
      this.secondsVisible(),
    );
    this.setFromUi(
      this.clampToBounds(this.adapter.withTime(this.adapter.startOfDay(now), snapped.hours, snapped.minutes, snapped.seconds)),
    );
    this.markTouched();
  }

  protected done(): void {
    this.closePopup(true);
  }
}
