import {
  Directive,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  signal,
  type Provider,
  type Type,
} from '@angular/core';
import {
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ControlValueAccessor,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import type { DateAdapter } from '../adapters/date-adapter';
import { ChronoraSettings, type LocaleOverrides } from '../services/chronora-settings';
import { ChrThemeDirective } from '../../theming/theme.directive';
import type { ChronoraLocale, ChronoraValidationMessages } from '../../localization/locale';
import { getErrorMessages } from '../validators/validation';

/**
 * Registers a component as both `ControlValueAccessor` and `Validator`, so it works with
 * `formControl`, `formControlName` and `ngModel`, and contributes its own validation errors.
 */
export function provideChronoraControl(component: () => Type<unknown>): Provider[] {
  return [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(component), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(component), multi: true },
  ];
}

let nextId = 0;

/**
 * Shared forms integration for every Chronora input-like component. It owns:
 *
 * - `ControlValueAccessor` plumbing (value propagation, touched, disabled)
 * - `Validator` plumbing (validation re-runs when rule inputs change)
 * - common inputs: `disabled`, `readonly`, `required`, `locale`, `firstDayOfWeek`, `errorMessages`
 * - resolved locale/labels and visible validation messages
 *
 * Subclasses supply the value type, how an external value is read, and the validation rules.
 */
@Directive()
export abstract class ChronoraFormControl<TDate, TValue> implements ControlValueAccessor, Validator {
  protected readonly settings = inject(ChronoraSettings);
  protected readonly adapter: DateAdapter<TDate> = this.settings.adapter<TDate>();
  protected readonly themeDirective = inject(ChrThemeDirective, { self: true });

  /** Disables the component. Also controlled by the forms API (`control.disable()`). */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Makes the value visible but not editable. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Marks an empty value as invalid. Also set by the Angular `required` attribute/validator. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Locale code (`'es-ES'`) or a full {@link ChronoraLocale}. Defaults to the global locale. */
  readonly locale = input<string | ChronoraLocale | null | undefined>(undefined);
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's first day of the week. */
  readonly firstDayOfWeek = input<number | null | undefined>(undefined);
  /** Overrides validation message templates, e.g. `{ chrMinDate: 'Too early' }`. */
  readonly errorMessages = input<Partial<ChronoraValidationMessages> | null | undefined>(undefined);
  /** Shows validation messages below the component once it was touched. */
  readonly showErrors = input(true, { transform: booleanAttribute });
  /** Accessible name when there is no visible `<label>`. */
  readonly ariaLabel = input<string | null | undefined>(undefined);
  /** Id(s) of the element(s) that label the control, as an alternative to {@link ariaLabel}. */
  readonly ariaLabelledby = input<string | null | undefined>(undefined);
  /** Id for the inner text input, so an external `<label for="…">` can point at it. */
  readonly inputId = input<string | null | undefined>(undefined);

  /** Unique id prefix for ARIA relationships. */
  protected readonly uid = `chr-${nextId++}`;

  protected readonly formDisabled = signal(false);
  protected readonly touched = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly isInteractive = computed(() => !this.isDisabled() && !this.readonly());

  /** Extra locale overrides contributed by the subclass (formats). */
  protected readonly localeOverrides = computed<LocaleOverrides>(() => ({}));

  /** The locale in effect. */
  readonly effectiveLocale = computed(() =>
    this.settings.resolveLocale({
      ...this.localeOverrides(),
      locale: this.locale(),
      firstDayOfWeek: this.firstDayOfWeek(),
    }),
  );
  protected readonly labels = computed(() => this.effectiveLocale().labels);
  protected readonly effectiveTheme = this.themeDirective.resolved;

  private onChange: (value: unknown) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  constructor() {
    // Re-run validation whenever a rule input changes.
    effect(() => {
      this.validationDependencies();
      this.required();
      this.onValidatorChange();
    });
  }

  // ----------------------------------------------------------------- subclass contract

  /** Converts the value written by the forms API into the component's value. Must not emit. */
  protected abstract applyExternalValue(value: unknown): void;

  /** Current validation errors, or `null`. Read the signals the rules depend on here. */
  protected abstract computeErrors(): ValidationErrors | null;

  /**
   * Reads every signal that influences {@link computeErrors}; the framework re-validates when
   * any of them change.
   */
  protected abstract validationDependencies(): unknown;

  /** Formats a value found in an error payload for display in a message. */
  protected abstract formatForMessage(value: unknown): string;

  // ----------------------------------------------------------------- ControlValueAccessor

  writeValue(value: unknown): void {
    this.applyExternalValue(value);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  // ----------------------------------------------------------------- Validator

  validate(_control?: AbstractControl): ValidationErrors | null {
    return this.computeErrors();
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  // ----------------------------------------------------------------- helpers for subclasses

  /** Notifies the forms API about a user-initiated change. */
  protected notifyChange(value: unknown): void {
    this.onChange(value);
  }

  /** Marks the control as touched (call on blur / popup close). */
  protected markTouched(): void {
    if (!this.touched()) {
      this.touched.set(true);
    }
    this.onTouched();
  }

  /** Errors that are currently relevant for display (own rules only). */
  protected readonly currentErrors = computed(() => {
    this.validationDependencies();
    this.required();
    return this.computeErrors();
  });

  /** Messages shown to the user: only after the control was touched. */
  protected readonly errorMessageList = computed(() => {
    if (!this.touched() || !this.showErrors() || this.isDisabled()) {
      return [];
    }
    const templates = { ...this.effectiveLocale().validationMessages, ...this.errorMessages() };
    return getErrorMessages(this.currentErrors(), templates, (value) => this.formatForMessage(value));
  });

  protected readonly invalid = computed(() => this.touched() && !this.isDisabled() && this.currentErrors() !== null);
}
