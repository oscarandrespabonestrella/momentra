import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MomentraValidators,
  DateInputComponent,
  DatePickerComponent,
  DateTimePickerComponent,
  TimePickerComponent,
} from '@momentra/angular';

@Component({
  selector: 'app-reactive-form',
  imports: [ReactiveFormsModule, DateInputComponent, DatePickerComponent, TimePickerComponent, DateTimePickerComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label for="birthday">Birthday</label>
      <mtr-date-input inputId="birthday" formControlName="birthday" format="dd/MM/yyyy" />

      <mtr-date-picker ariaLabel="Due date" formControlName="dueDate" [min]="today" />
      <mtr-time-picker ariaLabel="Start time" formControlName="startTime" [hourFormat]="24" [minuteStep]="15" />
      <mtr-datetime-picker ariaLabel="Appointment" formControlName="appointment" [minuteStep]="30" />

      <button type="submit" [disabled]="form.invalid">Save</button>
    </form>
  `,
})
export class ReactiveFormExample {
  readonly today = new Date();

  readonly form = new FormGroup({
    birthday: new FormControl<Date | null>(null, [Validators.required, MomentraValidators.maxDate(() => new Date())]),
    dueDate: new FormControl<Date | null>(null, MomentraValidators.minDate(() => new Date())),
    startTime: new FormControl<Date | null>(null),
    appointment: new FormControl<Date | null>(null, Validators.required),
  });

  submit(): void {
    if (this.form.valid) {
      console.log(this.form.getRawValue());
    }
  }
}
