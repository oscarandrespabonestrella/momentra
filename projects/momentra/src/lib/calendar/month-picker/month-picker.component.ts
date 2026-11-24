import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideMomentraControl } from '../../core/forms/momentra-form-control';
import type { CalendarView } from '../../core/utils/calendar-engine';
import { MtrThemeDirective } from '../../theming/theme.directive';
import { CalendarComponent } from '../calendar/calendar.component';
import { CALENDAR_PICKER_STYLES, CALENDAR_PICKER_TEMPLATE, CalendarPickerBase } from '../shared/calendar-picker.base';

/** Selects a month. The value is the first day of that month. */
@Component({
  selector: 'mtr-month-picker',
  template: CALENDAR_PICKER_TEMPLATE,
  styles: CALENDAR_PICKER_STYLES,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarComponent],
  hostDirectives: [{ directive: MtrThemeDirective, inputs: ['theme'] }],
  providers: [provideMomentraControl(() => MonthPickerComponent)],
  host: { class: 'mtr-month-picker' },
})
export class MonthPickerComponent<TDate = Date> extends CalendarPickerBase<TDate> {
  protected readonly selectionView: CalendarView = 'month';
}
