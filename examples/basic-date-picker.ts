import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from '@momentra/angular';

@Component({
  selector: 'app-basic-date-picker',
  imports: [FormsModule, DatePickerComponent],
  template: `
    <mtr-date-picker [(ngModel)]="selectedDate" placeholder="Choose a date" ariaLabel="Delivery date" />
    <p>Selected: {{ selectedDate?.toDateString() ?? 'nothing' }}</p>
  `,
})
export class BasicDatePickerExample {
  selectedDate: Date | null = null;
}
