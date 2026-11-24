import { Directive, computed, input, model } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { MomentraFormControl } from '../../core/forms/momentra-form-control';
import { isPeriodDisabled, representativeDate, type CalendarView } from '../../core/utils/calendar-engine';

/** Template shared by the month, year and decade pickers: a calendar locked to one selection view. */
export const CALENDAR_PICKER_TEMPLATE = `
<mtr-calendar
  [value]="value()"
  [view]="selectionView"
  [selectionView]="selectionView"
  [min]="min()"
  [max]="max()"
  [disabled]="isDisabled()"
  [readonly]="readonly()"
  [locale]="locale()"
  [firstDayOfWeek]="firstDayOfWeek()"
  [theme]="effectiveTheme()"
  [ariaLabel]="ariaLabel()"
  [showToday]="showToday()"
  (dateSelect)="onSelect($event)"
/>`;

export const CALENDAR_PICKER_STYLES = `:host { display: inline-block; }`;

/**
 * Shared behaviour of the month, year and decade pickers. The value is the first day of the
 * selected period (first of the month, 1 January, or 1 January of the decade's first year).
 */
@Directive()
export abstract class CalendarPickerBase<TDate> extends MomentraFormControl<TDate, TDate | null> {
  /** The selected period, as its first day (two-way bindable). */
  readonly value = model<TDate | null>(null);
  readonly min = input<TDate | null | undefined>(null);
  readonly max = input<TDate | null | undefined>(null);
  /** Shows the *Today* button (selects the current period). */
  readonly showToday = input<boolean | null | undefined>(undefined);

  /** The calendar view that selects (and is displayed first). */
  protected abstract readonly selectionView: CalendarView;

  protected readonly rules = computed(() => ({ min: this.min(), max: this.max() }));

  protected override applyExternalValue(value: unknown): void {
    const date = this.adapter.deserialize(value);
    this.value.set(date ? representativeDate(this.adapter, this.selectionView, date) : null);
  }

  protected onSelect(date: TDate): void {
    const value = representativeDate(this.adapter, this.selectionView, date);
    this.value.set(value);
    this.notifyChange(value);
    this.markTouched();
  }

  protected override validationDependencies(): unknown {
    return [this.value(), this.min(), this.max()];
  }

  protected override computeErrors(): ValidationErrors | null {
    const value = this.value();
    if (value == null) {
      return this.required() ? { required: true } : null;
    }
    if (!this.adapter.isValid(value)) {
      return { mtrInvalidDate: { value } };
    }
    const { min, max } = this.rules();
    if (isPeriodDisabled(this.adapter, this.selectionView, value, this.rules())) {
      const beforeMin = !!min && this.adapter.isValid(min) && this.adapter.compare(value, this.adapter.startOfDay(min)) < 0;
      return beforeMin ? { mtrMinDate: { min, actual: value } } : { mtrMaxDate: { max, actual: value } };
    }
    return null;
  }

  protected override formatForMessage(value: unknown): string {
    return this.adapter.isValid(value as TDate)
      ? this.adapter.formatDate(value as TDate, this.effectiveLocale())
      : String(value);
  }
}
