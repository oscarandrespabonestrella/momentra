import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideChronoraControl } from '../../core/forms/chronora-form-control';
import type { CalendarView } from '../../core/utils/calendar-engine';
import { ChrThemeDirective } from '../../theming/theme.directive';
import { CalendarComponent } from '../calendar/calendar.component';
import { CALENDAR_PICKER_STYLES, CALENDAR_PICKER_TEMPLATE, CalendarPickerBase } from '../shared/calendar-picker.base';

/** Selects a decade (or drills into a year). The value is 1 January of the decade's first year. */
@Component({
  selector: 'chr-decade-picker',
  template: CALENDAR_PICKER_TEMPLATE,
  styles: CALENDAR_PICKER_STYLES,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarComponent],
  hostDirectives: [{ directive: ChrThemeDirective, inputs: ['theme'] }],
  providers: [provideChronoraControl(() => DecadePickerComponent)],
  host: { class: 'chr-decade-picker' },
})
export class DecadePickerComponent<TDate = Date> extends CalendarPickerBase<TDate> {
  protected readonly selectionView: CalendarView = 'decade';
}
