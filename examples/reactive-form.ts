import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ChronoraValidators,
  DateInputComponent,
  DatePickerComponent,
  DateTimePickerComponent,
  TimePickerComponent,
} from '@chronora/angular';

@Component({
  selector: 'app-reactive-form',
  imports: [ReactiveFormsModule, DateInputComponent, DatePickerComponent, TimePickerComponent, DateTimePickerComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label for="birthday">Birthday</label>
      <chr-date-input inputId="birthday" formControlName="birthday" format="dd/MM/yyyy" />

      <chr-date-picker ariaLabel="Due date" formControlName="dueDate" [min]="today" />
      <chr-time-picker ariaLabel="Start time" formControlName="startTime" [hourFormat]="24" [minuteStep]="15" />
      <chr-datetime-picker ariaLabel="Appointment" formControlName="appointment" [minuteStep]="30" />

      <button type="submit" [disabled]="form.invalid">Save</button>
    </form>
  `,
})
export class ReactiveFormExample {
  readonly today = new Date();

  readonly form = new FormGroup({
    birthday: new FormControl<Date | null>(null, [Validators.required, ChronoraValidators.maxDate(() => new Date())]),
    dueDate: new FormControl<Date | null>(null, ChronoraValidators.minDate(() => new Date())),
    startTime: new FormControl<Date | null>(null),
    appointment: new FormControl<Date | null>(null, Validators.required),
  });

  submit(): void {
    if (this.form.valid) {
      console.log(this.form.getRawValue());
    }
  }
}
