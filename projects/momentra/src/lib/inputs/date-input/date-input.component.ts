import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { provideMomentraControl } from '../../core/forms/momentra-form-control';
import type { LocaleOverrides } from '../../core/services/momentra-settings';
import { validateDate } from '../../core/validators/validation';
import { createDisabledPredicate, type DisabledDates } from '../../core/utils/disabled-dates';
import { MtrThemeDirective } from '../../theming/theme.directive';
import { MtrFieldShell } from '../shared/field-shell.component';
import { MomentraTextControl } from '../shared/text-control';

/**
 * A text input for a calendar date with parsing, formatting and validation.
 *
 * The value is the **local start of the typed day**. `ArrowUp`/`ArrowDown` change the day
 * (`Shift`: month, `Ctrl`: year).
 *
 * @example
 * ```html
 * <mtr-date-input formControlName="birthday" format="dd/MM/yyyy" />
 * ```
 */
@Component({
  selector: 'mtr-date-input',
  templateUrl: './date-input.component.html',
  styleUrl: './date-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MtrFieldShell],
  hostDirectives: [{ directive: MtrThemeDirective, inputs: ['theme'] }],
  providers: [provideMomentraControl(() => DateInputComponent)],
  host: { class: 'mtr-date-input', '[class.mtr-invalid]': 'invalid()' },
})
export class DateInputComponent<TDate = Date> extends MomentraTextControl<TDate> {
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
