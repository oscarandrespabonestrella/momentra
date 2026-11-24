import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { provideMomentraControl } from '../../core/forms/momentra-form-control';
import type { LocaleOverrides } from '../../core/services/momentra-settings';
import { createDisabledPredicate, type DisabledDates } from '../../core/utils/disabled-dates';
import { normalizeStep, resolveTimePattern } from '../../core/utils/time-engine';
import { validateDate } from '../../core/validators/validation';
import { MtrThemeDirective } from '../../theming/theme.directive';
import { MtrFieldShell } from '../shared/field-shell.component';
import { MomentraTextControl } from '../shared/text-control';

/**
 * A text input for a local date-time (no popup). Set `spinners` for increment / decrement buttons.
 * `ArrowUp`/`ArrowDown` step minutes; `Shift` steps days, `Ctrl` steps hours.
 *
 * @example
 * ```html
 * <mtr-datetime-input [(value)]="start" format="yyyy-MM-dd HH:mm" spinners />
 * ```
 */
@Component({
  selector: 'mtr-datetime-input',
  templateUrl: './datetime-input.component.html',
  styleUrl: './datetime-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MtrFieldShell],
  hostDirectives: [{ directive: MtrThemeDirective, inputs: ['theme'] }],
  providers: [provideMomentraControl(() => DateTimeInputComponent)],
  host: { class: 'mtr-datetime-input', '[class.mtr-invalid]': 'invalid()' },
})
export class DateTimeInputComponent<TDate = Date> extends MomentraTextControl<TDate> {
  /** Full date-time pattern. Overrides `dateFormat`, `timeFormat`, `hourFormat` and `showSeconds`. */
  readonly format = input<string | null | undefined>(undefined);
  readonly dateFormat = input<string | null | undefined>(undefined);
  readonly timeFormat = input<string | null | undefined>(undefined);
  /** `12` or `24`. Defaults to the time pattern's clock. */
  readonly hourFormat = input<12 | 24 | null | undefined>(undefined);
  readonly showSeconds = input<boolean | null | undefined>(undefined);
  readonly minuteStep = input(1);
  readonly hourStep = input(1);
  readonly disabledDates = input<DisabledDates<TDate> | null | undefined>(null);

  protected override readonly localeOverrides = computed<LocaleOverrides>(() => ({
    dateFormat: this.dateFormat(),
    timeFormat: this.timeFormat(),
  }));
  protected readonly pattern = computed(
    () =>
      this.format() ??
      `${this.effectiveLocale().dateFormat} ${resolveTimePattern({
        format: this.timeFormat(),
        hourFormat: this.hourFormat(),
        showSeconds: this.showSeconds(),
        localePattern: this.effectiveLocale().timeFormat,
      })}`,
  );

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

  protected override unitStep(kind: string): number {
    return kind === 'hour24' || kind === 'hour12' ? normalizeStep(this.hourStep(), 24) : kind === 'minute' ? normalizeStep(this.minuteStep(), 60) : 1;
  }

  protected override stepValue(direction: 1 | -1, event: KeyboardEvent): TDate {
    const a = this.adapter;
    const base = this.value() ?? a.now();
    if (event.shiftKey) {
      return a.addDays(base, direction);
    }
    const ctrl = event.ctrlKey || event.metaKey;
    const minutes = ctrl ? normalizeStep(this.hourStep(), 24) * 60 : normalizeStep(this.minuteStep(), 60);
    const total = a.secondsOfDay(base) + direction * minutes * 60;
    const dayShift = Math.floor(total / 86400);
    const inDay = total - dayShift * 86400;
    return a.withTime(a.addDays(base, dayShift), Math.floor(inDay / 3600), Math.floor((inDay % 3600) / 60), inDay % 60);
  }
}
