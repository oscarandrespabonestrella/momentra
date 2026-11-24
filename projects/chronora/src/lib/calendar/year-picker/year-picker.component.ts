import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideChronoraControl } from '../../core/forms/chronora-form-control';
import type { CalendarView } from '../../core/utils/calendar-engine';
import { ChrThemeDirective } from '../../theming/theme.directive';
import { CalendarComponent } from '../calendar/calendar.component';
import { CALENDAR_PICKER_STYLES, CALENDAR_PICKER_TEMPLATE, CalendarPickerBase } from '../shared/calendar-picker.base';

/** Selects a year. The value is 1 January of that year. */
@Component({
  selector: 'chr-year-picker',
  template: CALENDAR_PICKER_TEMPLATE,
  styles: CALENDAR_PICKER_STYLES,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarComponent],
  hostDirectives: [{ directive: ChrThemeDirective, inputs: ['theme'] }],
  providers: [provideChronoraControl(() => YearPickerComponent)],
  host: { class: 'chr-year-picker' },
})
export class YearPickerComponent<TDate = Date> extends CalendarPickerBase<TDate> {
  protected readonly selectionView: CalendarView = 'year';
}
