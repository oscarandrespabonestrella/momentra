import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from '@chronora/angular';

@Component({
  selector: 'app-basic-date-picker',
  imports: [FormsModule, DatePickerComponent],
  template: `
    <chr-date-picker [(ngModel)]="selectedDate" placeholder="Choose a date" ariaLabel="Delivery date" />
    <p>Selected: {{ selectedDate?.toDateString() ?? 'nothing' }}</p>
  `,
})
export class BasicDatePickerExample {
  selectedDate: Date | null = null;
}
