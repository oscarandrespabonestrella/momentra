import { Component } from '@angular/core';
import { CalendarComponent } from '@momentra/angular';

@Component({
  selector: 'app-custom-cell-template',
  imports: [CalendarComponent],
  template: `
    <ng-template #cell let-cell>
      <span [class.weekend]="isWeekend(cell.date)">{{ cell.label }}</span>
      @if (hasEvent(cell.date)) {
        <span class="dot" aria-hidden="true"></span>
      }
    </ng-template>

    <mtr-calendar [cellTemplate]="cell" [disabledDates]="isHoliday" [showToday]="false" />
  `,
  styles: `
    .weekend {
      color: crimson;
    }
    .dot {
      position: absolute;
      bottom: 4px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: currentColor;
    }
  `,
})
export class CustomCellTemplateExample {
  private readonly events = new Set(['2026-12-24', '2026-12-31']);

  readonly isHoliday = (date: Date): boolean => date.getMonth() === 11 && date.getDate() === 25;

  isWeekend(date: Date): boolean {
    return date.getDay() === 0 || date.getDay() === 6;
  }

  hasEvent(date: Date): boolean {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return this.events.has(`${date.getFullYear()}-${month}-${day}`);
  }
}
