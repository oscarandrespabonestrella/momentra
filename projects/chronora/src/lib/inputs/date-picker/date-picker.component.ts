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
  viewChild,
} from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { CalendarComponent, type ChrCellContext } from '../../calendar/calendar/calendar.component';
import { provideChronoraControl } from '../../core/forms/chronora-form-control';
import type { LocaleOverrides } from '../../core/services/chronora-settings';
import { createDisabledPredicate, type DisabledDates } from '../../core/utils/disabled-dates';
import { validateDate } from '../../core/validators/validation';
import { ChrThemeDirective } from '../../theming/theme.directive';
import { ChrFieldShell } from '../shared/field-shell.component';
import { ChronoraPopupControl } from '../shared/popup-control';

/**
 * A date input with a calendar popup.
 *
 * The value is the **local start of the selected day** (`Date` at 00:00 in the local zone), so the
 * calendar day never shifts with the time zone. Works with `formControl`, `formControlName` and
 * `ngModel`; it also accepts ISO `yyyy-MM-dd` strings written by the forms API.
 *
 * @example
 * ```html
 * <chr-date-picker [(ngModel)]="date" [min]="today" placeholder="Choose a date" />
 * ```
 */
@Component({
  selector: 'chr-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChrFieldShell, CalendarComponent, CdkConnectedOverlay, CdkTrapFocus],
  hostDirectives: [{ directive: ChrThemeDirective, inputs: ['theme'] }],
  providers: [provideChronoraControl(() => DatePickerComponent)],
  host: { class: 'chr-date-picker', '[class.chr-invalid]': 'invalid()', '[class.chr-open]': 'open()' },
})
export class DatePickerComponent<TDate = Date> extends ChronoraPopupControl<TDate> {
  private readonly injector = inject(Injector);

  /** Date pattern, e.g. `'dd/MM/yyyy'`. Defaults to the locale's date format. */
  readonly format = input<string | null | undefined>(undefined);
  /** Dates that cannot be selected: a predicate or a list of days. */
  readonly disabledDates = input<DisabledDates<TDate> | null | undefined>(null);
  /** Custom content for day cells in the calendar. */
  readonly cellTemplate = input<TemplateRef<ChrCellContext<TDate>> | null | undefined>(null);
  /** Shows the *Today* button in the popup. Defaults to the global setting. */
  readonly showToday = input<boolean | null | undefined, unknown>(undefined, {
    transform: (v) => (v == null ? undefined : booleanAttribute(v)),
  });
  /** Month to show when the popup opens with no value. Defaults to today. */
  readonly initialDate = input<TDate | null | undefined>(null);

  private readonly calendar = viewChild(CalendarComponent);

  protected override readonly localeOverrides = computed<LocaleOverrides>(() => ({ dateFormat: this.format() }));
  protected readonly pattern = computed(() => this.effectiveLocale().dateFormat);
  protected readonly calendarStart = computed(() => this.value() ?? this.initialDate() ?? null);

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

  /** Moves focus into the calendar once the popup is attached. */
  protected onAttach(): void {
    afterNextRender(() => this.calendar()?.focusActiveCell(), { injector: this.injector });
  }

  protected onCalendarSelect(date: TDate): void {
    this.setFromUi(date);
    this.markTouched();
    if (this.shouldCloseOnSelect) {
      this.closePopup(true);
    }
  }
}
