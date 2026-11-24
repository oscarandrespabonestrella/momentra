import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, Injector, afterNextRender, computed, inject, input, viewChild } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { provideChronoraControl } from '../../core/forms/chronora-form-control';
import {
  clampTime,
  fromSeconds,
  normalizeStep,
  resolveTimePattern,
  snapToSteps,
} from '../../core/utils/time-engine';
import { validateTime } from '../../core/validators/validation';
import { patternHasSeconds, patternUses12Hours } from '../../formatting/format-pattern';
import { ChrThemeDirective } from '../../theming/theme.directive';
import { ChrFieldShell } from '../shared/field-shell.component';
import { ChronoraPopupControl } from '../shared/popup-control';
import { ChrTimeSelector } from '../shared/time-selector.component';

/**
 * A time-of-day input with a popup of hour, minute, (second) and AM/PM lists.
 *
 * The value is a date whose **time of day** is the selected time; its date part is the date of the
 * previous value, or `baseDate` (default: today) when there was none. `min`/`max` limit the time of
 * day only.
 *
 * @example
 * ```html
 * <chr-time-picker formControlName="start" hourFormat="24" [minuteStep]="15" />
 * ```
 */
@Component({
  selector: 'chr-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChrFieldShell, ChrTimeSelector, CdkConnectedOverlay, CdkTrapFocus],
  hostDirectives: [{ directive: ChrThemeDirective, inputs: ['theme'] }],
  providers: [provideChronoraControl(() => TimePickerComponent)],
  host: { class: 'chr-time-picker', '[class.chr-invalid]': 'invalid()', '[class.chr-open]': 'open()' },
})
export class TimePickerComponent<TDate = Date> extends ChronoraPopupControl<TDate> {
  private readonly injector = inject(Injector);

  /** Explicit time pattern, e.g. `'HH:mm'` or `'h:mm a'`. Overrides `hourFormat` and `showSeconds`. */
  readonly format = input<string | null | undefined>(undefined);
  /** `12` or `24`. Defaults to the locale's clock. */
  readonly hourFormat = input<12 | 24 | null | undefined>(undefined);
  /** Shows seconds. Defaults to whatever the pattern shows. */
  readonly showSeconds = input<boolean | null | undefined>(undefined);
  /** Interval between selectable hours, e.g. `2`. */
  readonly hourStep = input(1);
  /** Interval between selectable minutes, e.g. `15`. */
  readonly minuteStep = input(1);
  /** Interval between selectable seconds. */
  readonly secondStep = input(1);
  /** Date used for values created from scratch. Defaults to today. */
  readonly baseDate = input<TDate | null | undefined>(null);

  private readonly selector = viewChild(ChrTimeSelector);

  protected override readonly parseErrorKey = 'chrInvalidTime' as const;

  protected readonly pattern = computed(() =>
    resolveTimePattern({
      format: this.format(),
      hourFormat: this.hourFormat(),
      showSeconds: this.showSeconds(),
      localePattern: this.effectiveLocale().timeFormat,
    }),
  );
  protected readonly use12Hours = computed(() => patternUses12Hours(this.pattern()));
  protected readonly secondsVisible = computed(() => patternHasSeconds(this.pattern()));
  private readonly steps = computed(() => ({
    hour: normalizeStep(this.hourStep(), this.use12Hours() ? 12 : 24),
    minute: normalizeStep(this.minuteStep(), 60),
    second: normalizeStep(this.secondStep(), 60),
  }));

  protected readonly selectorBase = computed(() => this.value() ?? this.baseDate() ?? null);

  protected override parseBase(): TDate | null {
    return this.value() ?? this.baseDate() ?? this.adapter.today();
  }

  protected override validateValue(value: TDate | null): ValidationErrors | null {
    return validateTime(this.adapter, value, { min: this.min(), max: this.max(), required: this.required() });
  }

  private bounds() {
    const min = this.min();
    const max = this.max();
    return {
      min: min && this.adapter.isValid(min) ? this.adapter.secondsOfDay(min) : null,
      max: max && this.adapter.isValid(max) ? this.adapter.secondsOfDay(max) : null,
    };
  }

  protected override unitStep(kind: string): number {
    const steps = this.steps();
    return kind === 'hour24' || kind === 'hour12' ? steps.hour : kind === 'minute' ? steps.minute : kind === 'second' ? steps.second : 1;
  }

  /** `ArrowUp`/`ArrowDown` step minutes (`Shift`: hours, `Ctrl`: seconds), wrapping within the day's bounds. */
  protected override stepValue(direction: 1 | -1, event: KeyboardEvent): TDate {
    const base = this.value() ?? this.baseDate() ?? this.adapter.today();
    const steps = this.steps();
    const unit = event.shiftKey ? steps.hour * 3600 : event.ctrlKey || event.metaKey ? steps.second : steps.minute * 60;
    const current = this.value() ? this.adapter.secondsOfDay(base) : 0;
    const next = fromSeconds(Math.max(0, Math.min(86399, current + direction * unit)));
    return this.adapter.withTime(base, next.hours, next.minutes, next.seconds);
  }

  protected override clampToBounds(date: TDate): TDate {
    const clamped = clampTime(
      { hours: this.adapter.getHours(date), minutes: this.adapter.getMinutes(date), seconds: this.adapter.getSeconds(date) },
      this.bounds(),
    );
    return this.adapter.withTime(date, clamped.hours, clamped.minutes, clamped.seconds);
  }

  protected onAttach(): void {
    afterNextRender(() => this.selector()?.focusFirst(), { injector: this.injector });
  }

  protected onSelectorChange(date: TDate): void {
    this.setFromUi(date);
  }

  /** Sets the current time of day, snapped to the configured steps and limits. */
  protected selectNow(): void {
    const now = this.adapter.now();
    const snapped = snapToSteps(
      { hours: this.adapter.getHours(now), minutes: this.adapter.getMinutes(now), seconds: this.adapter.getSeconds(now) },
      this.steps(),
      this.secondsVisible(),
    );
    const clamped = clampTime(snapped, this.bounds());
    const base = this.value() ?? this.baseDate() ?? this.adapter.today();
    this.setFromUi(this.adapter.withTime(base, clamped.hours, clamped.minutes, clamped.seconds));
    this.markTouched();
  }

  protected done(): void {
    this.closePopup(true);
  }
}
