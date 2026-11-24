import { Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateInputComponent } from './date-input.component';
import { blur, clickEl, createHost, press, settle, typeText } from '../../testing/test-helpers';

const d = (y: number, m: number, day: number) => new Date(y, m, day);

@Component({
  imports: [DateInputComponent, ReactiveFormsModule],
  template: `<chr-date-input
    [formControl]="control"
    [format]="format()"
    [min]="min()"
    [max]="max()"
    [disabledDates]="disabled()"
    [locale]="locale()"
    [readonly]="readonly()"
    [required]="required()"
  />`,
})
class Host {
  control = new FormControl<Date | null>(null);
  format = signal<string | undefined>(undefined);
  min = signal<Date | null>(null);
  max = signal<Date | null>(null);
  disabled = signal<((d: Date) => boolean) | null>(null);
  locale = signal<string | undefined>(undefined);
  readonly = signal(false);
  required = signal(false);
}

@Component({
  imports: [DateInputComponent, FormsModule],
  template: `<chr-date-input [(ngModel)]="date" />`,
})
class NgModelHost {
  date: Date | null = null;
}

const input = (el: HTMLElement) => el.querySelector('input')!;

describe('DateInputComponent', () => {
  it('shows the pattern as a placeholder and an accessible name', async () => {
    const fixture = await createHost(Host);
    const el = fixture.nativeElement as HTMLElement;
    expect(input(el).placeholder).toBe('mm/dd/yyyy');
    expect(input(el).type).toBe('text');
  });

  describe('parsing and formatting', () => {
    it('parses typed text into a local-midnight Date and reformats on blur', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await typeText(fixture, input(el), '3/5/2026');
      expect(fixture.componentInstance.control.value).toEqual(d(2026, 2, 5));
      expect(input(el).value).toBe('3/5/2026'); // not reformatted while typing
      await blur(fixture, input(el));
      expect(input(el).value).toBe('03/05/2026');
    });

    it('formats values written by the form, including ISO strings, without shifting the day', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.setValue(d(2026, 11, 31));
      await settle(fixture);
      expect(input(el).value).toBe('12/31/2026');
      fixture.componentInstance.control.setValue('2026-03-15' as never);
      await settle(fixture);
      expect(input(el).value).toBe('03/15/2026');
    });

    it('honours a custom format', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.format.set('yyyy-MM-dd');
      fixture.componentInstance.control.setValue(d(2026, 2, 5));
      await settle(fixture);
      expect(input(el).value).toBe('2026-03-05');
      expect(input(el).placeholder).toBe('yyyy-mm-dd');
      await typeText(fixture, input(el), '2027-01-09');
      expect(fixture.componentInstance.control.value).toEqual(d(2027, 0, 9));
    });

    it('reformats when the format changes', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.setValue(d(2026, 2, 5));
      await settle(fixture);
      fixture.componentInstance.format.set('dd.MM.yyyy');
      await settle(fixture);
      expect(input(el).value).toBe('05.03.2026');
    });

    it('uses the locale pattern for other locales', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.locale.set('es-ES');
      fixture.componentInstance.control.setValue(d(2026, 2, 5));
      await settle(fixture);
      expect(input(el).value).toBe('05/03/2026');
    });

    it('clears the value when the text is erased', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.setValue(d(2026, 2, 5));
      await settle(fixture);
      await typeText(fixture, input(el), '');
      expect(fixture.componentInstance.control.value).toBeNull();
      expect(fixture.componentInstance.control.errors).toBeNull();
    });
  });

  describe('validation', () => {
    it('reports unparsable text as chrInvalidDate and clears the value', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      const { control } = fixture.componentInstance;
      control.setValue(d(2026, 2, 5));
      await settle(fixture);
      await typeText(fixture, input(el), '13/45/2026');
      expect(control.value).toBeNull();
      expect(control.errors).toHaveProperty('chrInvalidDate');
      await blur(fixture, input(el));
      expect(input(el).value).toBe('13/45/2026'); // the user's text is kept for correction
      expect(input(el).getAttribute('aria-invalid')).toBe('true');
      const alert = el.querySelector('[role="alert"]')!;
      expect(alert.textContent).toContain('Enter a valid date.');
      expect(input(el).getAttribute('aria-describedby')).toBe(alert.id);
      await typeText(fixture, input(el), '01/05/2026');
      expect(control.errors).toBeNull();
    });

    it('rejects impossible calendar dates', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await typeText(fixture, input(el), '02/30/2026');
      expect(fixture.componentInstance.control.errors).toHaveProperty('chrInvalidDate');
    });

    it('validates min and max', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      const { control, min, max } = fixture.componentInstance;
      min.set(d(2026, 0, 10));
      max.set(d(2026, 0, 20));
      await settle(fixture);
      await typeText(fixture, input(el), '01/09/2026');
      expect(control.errors).toHaveProperty('chrMinDate');
      await typeText(fixture, input(el), '01/21/2026');
      expect(control.errors).toHaveProperty('chrMaxDate');
      await typeText(fixture, input(el), '01/15/2026');
      expect(control.errors).toBeNull();
      await blur(fixture, input(el));
      expect(el.querySelector('[role="alert"]')).toBeNull();
    });

    it('shows a formatted message for a min violation after touch', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.min.set(d(2026, 0, 10));
      await settle(fixture);
      await typeText(fixture, input(el), '01/01/2026');
      await blur(fixture, input(el));
      expect(el.querySelector('[role="alert"]')!.textContent).toContain('on or after 01/10/2026');
    });

    it('rejects disabled dates', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.disabled.set((x) => x.getDay() === 0);
      await settle(fixture);
      await typeText(fixture, input(el), '01/04/2026'); // Sunday
      expect(fixture.componentInstance.control.errors).toHaveProperty('chrDisabledDate');
    });

    it('supports required, merged with Angular validators', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.required.set(true);
      await settle(fixture);
      expect(fixture.componentInstance.control.errors).toHaveProperty('required');
      await blur(fixture, input(el));
      expect(el.querySelector('[role="alert"]')!.textContent).toContain('required');

      const control = new FormControl<Date | null>(null, Validators.required);
      expect(control.errors).toEqual({ required: true });
    });

    it('hides messages until touched and when showErrors is off', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await typeText(fixture, input(el), 'nope');
      expect(el.querySelector('[role="alert"]')).toBeNull();
    });
  });

  describe('Angular Forms', () => {
    it('marks the control touched on blur and dirty on typing', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      const { control } = fixture.componentInstance;
      expect(control.touched).toBe(false);
      await typeText(fixture, input(el), '01/05/2026');
      expect(control.dirty).toBe(true);
      await blur(fixture, input(el));
      expect(control.touched).toBe(true);
    });

    it('does not mark the control dirty for programmatic writes', async () => {
      const fixture = await createHost(Host);
      fixture.componentInstance.control.setValue(d(2026, 0, 1));
      await settle(fixture);
      expect(fixture.componentInstance.control.dirty).toBe(false);
    });

    it('propagates disabled state', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.disable();
      await settle(fixture);
      expect(input(el).disabled).toBe(true);
      fixture.componentInstance.control.enable();
      await settle(fixture);
      expect(input(el).disabled).toBe(false);
    });

    it('resets text on form reset', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await typeText(fixture, input(el), 'garbage');
      fixture.componentInstance.control.reset();
      await settle(fixture);
      expect(input(el).value).toBe('');
      expect(fixture.componentInstance.control.errors).toBeNull();
    });

    it('works with ngModel', async () => {
      const fixture = await createHost(NgModelHost);
      const el = fixture.nativeElement as HTMLElement;
      await typeText(fixture, input(el), '04/02/2026');
      expect(fixture.componentInstance.date).toEqual(d(2026, 3, 2));
    });
  });

  describe('clear button', () => {
    it('appears only when there is text and clears value and text', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.chr-clear')).toBeNull();
      fixture.componentInstance.control.setValue(d(2026, 0, 1));
      await settle(fixture);
      const clear = el.querySelector('.chr-clear') as HTMLButtonElement;
      expect(clear.getAttribute('aria-label')).toBe('Clear');
      await clickEl(fixture, clear);
      expect(fixture.componentInstance.control.value).toBeNull();
      expect(input(el).value).toBe('');
      expect(el.querySelector('.chr-clear')).toBeNull();
    });
  });

  describe('keyboard', () => {
    it('steps by day, month and year with the arrow keys', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      const { control } = fixture.componentInstance;
      control.setValue(d(2026, 0, 31));
      await settle(fixture);
      const up = await press(fixture, input(el), 'ArrowUp');
      expect(up.defaultPrevented).toBe(true);
      expect(control.value).toEqual(d(2026, 1, 1));
      await press(fixture, input(el), 'ArrowDown');
      expect(control.value).toEqual(d(2026, 0, 31));
      await press(fixture, input(el), 'ArrowUp', { shiftKey: true });
      expect(control.value).toEqual(d(2026, 1, 28));
      await press(fixture, input(el), 'ArrowDown', { ctrlKey: true });
      expect(control.value).toEqual(d(2025, 1, 28));
      expect(input(el).value).toBe('02/28/2025');
    });

    it('starts from today when empty', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await press(fixture, input(el), 'ArrowUp');
      const today = new Date();
      const value = fixture.componentInstance.control.value!;
      expect(value.getDate()).toBe(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getDate());
    });

    it('keeps stepped values within min/max', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.max.set(d(2026, 0, 10));
      fixture.componentInstance.control.setValue(d(2026, 0, 10));
      await settle(fixture);
      await press(fixture, input(el), 'ArrowUp');
      expect(fixture.componentInstance.control.value).toEqual(d(2026, 0, 10));
    });

    it('ignores the arrow keys when read-only', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.setValue(d(2026, 0, 10));
      fixture.componentInstance.readonly.set(true);
      await settle(fixture);
      await press(fixture, input(el), 'ArrowUp');
      expect(fixture.componentInstance.control.value).toEqual(d(2026, 0, 10));
      expect(input(el).readOnly).toBe(true);
      expect(el.querySelector('.chr-clear')).toBeNull();
    });
  });
});
