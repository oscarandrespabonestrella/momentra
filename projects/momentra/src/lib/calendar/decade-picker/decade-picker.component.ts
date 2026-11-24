import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideMomentraControl } from '../../core/forms/momentra-form-control';
import type { CalendarView } from '../../core/utils/calendar-engine';
import { MtrThemeDirective } from '../../theming/theme.directive';
import { CalendarComponent } from '../calendar/calendar.component';
import { CALENDAR_PICKER_STYLES, CALENDAR_PICKER_TEMPLATE, CalendarPickerBase } from '../shared/calendar-picker.base';

/** Selects a decade (or drills into a year). The value is 1 January of the decade's first year. */
@Component({
  selector: 'mtr-decade-picker',
  template: CALENDAR_PICKER_TEMPLATE,
  styles: CALENDAR_PICKER_STYLES,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarComponent],
  hostDirectives: [{ directive: MtrThemeDirective, inputs: ['theme'] }],
  providers: [provideMomentraControl(() => DecadePickerComponent)],
  host: { class: 'mtr-decade-picker' },
})
export class DecadePickerComponent<TDate = Date> extends CalendarPickerBase<TDate> {
  protected readonly selectionView: CalendarView = 'decade';
}
