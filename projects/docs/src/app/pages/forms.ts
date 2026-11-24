import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChronoraValidators, DateInputComponent, DatePickerComponent, DateRangePickerComponent, type DateRange } from '@chronora/angular';
import { Demo } from '../demo';

@Component({
  imports: [JsonPipe, ReactiveFormsModule, DateInputComponent, DatePickerComponent, DateRangePickerComponent, Demo],
  template: `
    <h1>Forms &amp; validation</h1>
    <p>All controls implement <code>ControlValueAccessor</code> and <code>Validator</code>. Errors show once the control is touched.</p>

    <doc-demo [code]="code">
      <form [formGroup]="form" style="display:grid;gap:1rem">
        <label>Birthday (required, not in the future)
          <br /><chr-date-input formControlName="birthday" ariaLabel="Birthday" /></label>
        <label>Due date (today or later)
          <br /><chr-date-picker formControlName="dueDate" ariaLabel="Due date" /></label>
        <label>Stay (required, 2–14 days)
          <br /><chr-date-range-picker formControlName="stay" ariaLabel="Stay" /></label>
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
    birthday: new FormControl<Date | null>(null, [Validators.required, ChronoraValidators.maxDate(() => new Date())]),
    dueDate: new FormControl<Date | null>(null, ChronoraValidators.minDate(() => new Date())),
    stay: new FormControl<DateRange<Date> | null>(null, ChronoraValidators.dateRange({ required: true, minLength: 2, maxLength: 14 })),
  });
  readonly code = `form = new FormGroup({
  birthday: new FormControl(null, [Validators.required, ChronoraValidators.maxDate(() => new Date())]),
  dueDate: new FormControl(null, ChronoraValidators.minDate(() => new Date())),
  stay: new FormControl(null, ChronoraValidators.dateRange({ required: true, minLength: 2, maxLength: 14 })),
});`;
}
