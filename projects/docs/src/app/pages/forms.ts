import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MomentraValidators, DateInputComponent, DatePickerComponent, DateRangePickerComponent, type DateRange } from '@momentra/angular';
import { Demo } from '../demo';

@Component({
  imports: [JsonPipe, ReactiveFormsModule, DateInputComponent, DatePickerComponent, DateRangePickerComponent, Demo],
  template: `
    <h1>Forms &amp; validation</h1>
    <p>All controls implement <code>ControlValueAccessor</code> and <code>Validator</code>. Errors show once the control is touched.</p>

    <doc-demo [code]="code">
      <form [formGroup]="form" style="display:grid;gap:1rem">
        <label>Birthday (required, not in the future)
          <br /><mtr-date-input formControlName="birthday" ariaLabel="Birthday" /></label>
        <label>Due date (today or later)
          <br /><mtr-date-picker formControlName="dueDate" ariaLabel="Due date" /></label>
        <label>Stay (required, 2–14 days)
          <br /><mtr-date-range-picker formControlName="stay" ariaLabel="Stay" /></label>
      </form>
      <div output>
        valid: {{ form.valid }} · errors:
        {{ form.controls.birthday.errors | json }} / {{ form.controls.dueDate.errors | json }} / {{ form.controls.stay.errors | json }}
      </div>
    </doc-demo>
  `,
})
export class FormsPage {
  readonly form = new FormGroup({
    birthday: new FormControl<Date | null>(null, [Validators.required, MomentraValidators.maxDate(() => new Date())]),
    dueDate: new FormControl<Date | null>(null, MomentraValidators.minDate(() => new Date())),
    stay: new FormControl<DateRange<Date> | null>(null, MomentraValidators.dateRange({ required: true, minLength: 2, maxLength: 14 })),
  });
  readonly code = `form = new FormGroup({
  birthday: new FormControl(null, [Validators.required, MomentraValidators.maxDate(() => new Date())]),
  dueDate: new FormControl(null, MomentraValidators.minDate(() => new Date())),
  stay: new FormControl(null, MomentraValidators.dateRange({ required: true, minLength: 2, maxLength: 14 })),
});`;
}
