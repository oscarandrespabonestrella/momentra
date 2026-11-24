import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { provideChronoraControl } from '../../core/forms/chronora-form-control';
import type { LocaleOverrides } from '../../core/services/chronora-settings';
import { validateDate } from '../../core/validators/validation';
import { createDisabledPredicate, type DisabledDates } from '../../core/utils/disabled-dates';
import { ChrThemeDirective } from '../../theming/theme.directive';
import { ChrFieldShell } from '../shared/field-shell.component';
import { ChronoraTextControl } from '../shared/text-control';

/**
 * A text input for a calendar date with parsing, formatting and validation.
 *
 * The value is the **local start of the typed day**. `ArrowUp`/`ArrowDown` change the day
 * (`Shift`: month, `Ctrl`: year).
 *
 * @example
 * ```html
 * <chr-date-input formControlName="birthday" format="dd/MM/yyyy" />
 * ```
 */
@Component({
  selector: 'chr-date-input',
  templateUrl: './date-input.component.html',
  styleUrl: './date-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChrFieldShell],
  hostDirectives: [{ directive: ChrThemeDirective, inputs: ['theme'] }],
  providers: [provideChronoraControl(() => DateInputComponent)],
  host: { class: 'chr-date-input', '[class.chr-invalid]': 'invalid()' },
})
export class DateInputComponent<TDate = Date> extends ChronoraTextControl<TDate> {
  /** Date pattern, e.g. `'dd/MM/yyyy'`. Defaults to the locale's date format. */
  readonly format = input<string | null | undefined>(undefined);
  /** Dates that cannot be entered: a predicate or a list of days. */
  readonly disabledDates = input<DisabledDates<TDate> | null | undefined>(null);

  protected override readonly localeOverrides = computed<LocaleOverrides>(() => ({ dateFormat: this.format() }));
  protected readonly pattern = computed(() => this.effectiveLocale().dateFormat);

  protected override validateValue(value: TDate | null): ValidationErrors | null {
    return validateDate(this.adapter, value, {
      min: this.min(),
      max: this.max(),
      isDisabled: createDisabledPredicate(this.adapter, this.disabledDates()),
      required: this.required(),
    });
  }

  protected override extraValidationDependencies(): unknown {
    return this.disabledDates();
  }
}
