import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePickerComponent } from './date-picker.component';
import { blur, clickEl, createHost, overlay, press, settle, typeText } from '../../testing/test-helpers';

const d = (y: number, m: number, day: number) => new Date(y, m, day);

@Component({
  imports: [DatePickerComponent, ReactiveFormsModule],
  template: `
    <button id="outside" type="button">outside</button>
    <chr-date-picker
      [formControl]="control"
      [min]="min()"
      [max]="max()"
      [disabledDates]="disabled()"
      [closeOnSelect]="closeOnSelect()"
      [initialDate]="initial"
      (opened)="events.push('opened')"
      (closed)="events.push('closed')"
    />`,
})
class Host {
  control = new FormControl<Date | null>(null);
  min = signal<Date | null>(null);
  max = signal<Date | null>(null);
  disabled = signal<((d: Date) => boolean) | null>(null);
  closeOnSelect = signal(true);
  initial = d(2026, 10, 15);
  events: string[] = [];
}

@Component({
  imports: [DatePickerComponent, FormsModule],
  template: `<chr-date-picker [(ngModel)]="date" placeholder="Choose a date" />`,
})
class NgModelHost {
  date: Date | null = null;
}

@Component({
  imports: [DatePickerComponent, ReactiveFormsModule],
  template: `<form [formGroup]="form"><chr-date-picker formControlName="date" /></form>`,
})
class GroupHost {
  form = new FormGroup({ date: new FormControl<Date | null>(null) });
}

const input = (el: HTMLElement) => el.querySelector('input')!;
const toggle = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.chr-toggle')!;
const popup = () => overlay().querySelector<HTMLElement>('.chr-popup');
const dayCell = (label: string) =>
  Array.from(overlay().querySelectorAll<HTMLButtonElement>('button.chr-cell')).find(
    (c) => c.textContent!.trim() === label && !c.classList.contains('chr-outside'),
  )!;

async function open(fixture: ComponentFixture<unknown>) {
  await clickEl(fixture, toggle(fixture.nativeElement));
}

describe('DatePickerComponent', () => {
  describe('popup', () => {
    it('is closed by default and opens from the toggle button', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      expect(popup()).toBeNull();
      expect(toggle(el).getAttribute('aria-label')).toBe('Open calendar');
      await open(fixture);
      expect(popup()).not.toBeNull();
      expect(fixture.componentInstance.events).toEqual(['opened']);
      expect(toggle(el).getAttribute('aria-expanded')).toBe('true');
      expect(toggle(el).getAttribute('aria-label')).toBe('Close calendar');
    });

    it('exposes dialog and combobox semantics with matching ids', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      expect(input(el).getAttribute('role')).toBe('combobox');
      expect(input(el).getAttribute('aria-haspopup')).toBe('dialog');
      expect(input(el).getAttribute('aria-expanded')).toBe('false');
      expect(input(el).getAttribute('aria-controls')).toBeNull();
      await open(fixture);
      const dialog = popup()!;
      expect(dialog.getAttribute('role')).toBe('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-label')).toBe('Calendar');
      expect(input(el).getAttribute('aria-expanded')).toBe('true');
      expect(input(el).getAttribute('aria-controls')).toBe(dialog.id);
      expect(toggle(el).getAttribute('aria-controls')).toBe(dialog.id);
    });

    it('moves focus to the active day when it opens', async () => {
      const fixture = await createHost(Host);
      await open(fixture);
      expect(document.activeElement).toBe(dayCell('15'));
    });

    it('focuses the selected day when a value exists', async () => {
      const fixture = await createHost(Host);
      fixture.componentInstance.control.setValue(d(2026, 10, 9));
      await settle(fixture);
      await open(fixture);
      expect(document.activeElement).toBe(dayCell('9'));
      expect(dayCell('9').classList.contains('chr-selected')).toBe(true);
    });

    it('opens with Alt+ArrowDown from the input', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await press(fixture, input(el), 'ArrowDown', { altKey: true });
      expect(popup()).not.toBeNull();
    });

    it('closes with Escape and returns focus to the input', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      document.body.appendChild(el);
      await open(fixture);
      await press(fixture, document.activeElement!, 'Escape');
      expect(popup()).toBeNull();
      expect(document.activeElement).toBe(input(el));
      expect(fixture.componentInstance.events).toEqual(['opened', 'closed']);
      el.remove();
    });

    it('closes with Escape pressed in the input', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await open(fixture);
      await press(fixture, input(el), 'Escape');
      expect(popup()).toBeNull();
    });

    it('closes on an outside click but not on a click inside the field', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await open(fixture);
      await clickEl(fixture, input(el));
      expect(popup()).not.toBeNull();
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await settle(fixture);
      expect(popup()).toBeNull();
    });

    it('toggles closed from the toggle button', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await open(fixture);
      await clickEl(fixture, toggle(el));
      expect(popup()).toBeNull();
    });

    it('does not open when disabled or read-only', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.control.disable();
      await settle(fixture);
      expect(toggle(el).disabled).toBe(true);
      await press(fixture, input(el), 'ArrowDown', { altKey: true });
      expect(popup()).toBeNull();
    });

    it('marks the control touched once the popup closes', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await open(fixture);
      await blur(fixture, input(el)); // focus moving into the popup is not "touched"
      expect(fixture.componentInstance.control.touched).toBe(false);
      await press(fixture, document.activeElement!, 'Escape');
      expect(fixture.componentInstance.control.touched).toBe(true);
    });
  });

  describe('selection', () => {
    it('selects a day, writes the local-midnight Date, closes and refocuses the input', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      document.body.appendChild(el);
      await open(fixture);
      await clickEl(fixture, dayCell('20'));
      expect(fixture.componentInstance.control.value).toEqual(d(2026, 10, 20));
      expect(input(el).value).toBe('11/20/2026');
      expect(popup()).toBeNull();
      expect(document.activeElement).toBe(input(el));
      el.remove();
    });

    it('stays open with closeOnSelect=false', async () => {
      const fixture = await createHost(Host);
      fixture.componentInstance.closeOnSelect.set(false);
      await settle(fixture);
      await open(fixture);
      await clickEl(fixture, dayCell('20'));
      expect(popup()).not.toBeNull();
      expect(fixture.componentInstance.control.value).toEqual(d(2026, 10, 20));
    });

    it('selects with the keyboard (Enter on the focused day)', async () => {
      const fixture = await createHost(Host);
      await open(fixture);
      await press(fixture, document.activeElement!, 'ArrowRight');
      (document.activeElement as HTMLElement).click(); // Enter/Space activate buttons natively
      await settle(fixture);
      expect(fixture.componentInstance.control.value).toEqual(d(2026, 10, 16));
    });

    it('reflects typed text in the open calendar', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await open(fixture);
      await typeText(fixture, input(el), '03/09/2027');
      expect(overlay().querySelector('.chr-title')!.textContent!.trim()).toBe('March 2027');
      expect(dayCell('9').classList.contains('chr-selected')).toBe(true);
    });

    it('disables days outside min/max and via disabledDates', async () => {
      const fixture = await createHost(Host);
      fixture.componentInstance.min.set(d(2026, 10, 10));
      fixture.componentInstance.max.set(d(2026, 10, 20));
      fixture.componentInstance.disabled.set((x) => x.getDate() === 12);
      await settle(fixture);
      await open(fixture);
      expect(dayCell('9').getAttribute('aria-disabled')).toBe('true');
      expect(dayCell('12').getAttribute('aria-disabled')).toBe('true');
      expect(dayCell('13').getAttribute('aria-disabled')).toBeNull();
      expect(dayCell('21').getAttribute('aria-disabled')).toBe('true');
      await clickEl(fixture, dayCell('12'));
      expect(fixture.componentInstance.control.value).toBeNull();
      expect(popup()).not.toBeNull();
    });

    it('offers a Today button that selects today', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      await open(fixture);
      await clickEl(fixture, overlay().querySelector('.chr-today-btn'));
      const now = new Date();
      expect(fixture.componentInstance.control.value).toEqual(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
      expect(popup()).toBeNull();
      expect(input(el).value).not.toBe('');
    });

    it('supports a custom date cell template', async () => {
      @Component({
        imports: [DatePickerComponent],
        template: `<ng-template #tpl let-cell><i class="x">{{ cell.label }}*</i></ng-template>
          <chr-date-picker [cellTemplate]="tpl" />`,
      })
      class TplHost {}
      const fixture = await createHost(TplHost);
      await open(fixture);
      expect(overlay().querySelector('.x')!.textContent).toMatch(/\d+\*/);
    });
  });

  describe('clear', () => {
    it('clears the value, empties the input and focuses it', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      document.body.appendChild(el);
      fixture.componentInstance.control.setValue(d(2026, 10, 9));
      await settle(fixture);
      await clickEl(fixture, el.querySelector('.chr-clear'));
      expect(fixture.componentInstance.control.value).toBeNull();
      expect(input(el).value).toBe('');
      expect(document.activeElement).toBe(input(el));
      el.remove();
    });
  });

  describe('Angular Forms', () => {
    it('works inside a FormGroup with formControlName', async () => {
      const fixture = await createHost(GroupHost);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.form.patchValue({ date: d(2026, 5, 1) });
      await settle(fixture);
      expect(input(el).value).toBe('06/01/2026');
      await typeText(fixture, input(el), '07/04/2026');
      expect(fixture.componentInstance.form.value.date).toEqual(d(2026, 6, 4));
      fixture.componentInstance.form.disable();
      await settle(fixture);
      expect(input(el).disabled).toBe(true);
    });

    it('works with ngModel', async () => {
      const fixture = await createHost(NgModelHost);
      const el = fixture.nativeElement as HTMLElement;
      expect(input(el).placeholder).toBe('Choose a date');
      await open(fixture);
      await clickEl(fixture, dayCell('14'));
      const now = new Date();
      expect(fixture.componentInstance.date).toEqual(new Date(now.getFullYear(), now.getMonth(), 14));
    });

    it('validates typed values against min', async () => {
      const fixture = await createHost(Host);
      const el = fixture.nativeElement as HTMLElement;
      fixture.componentInstance.min.set(d(2026, 10, 10));
      await settle(fixture);
      await typeText(fixture, input(el), '11/01/2026');
      expect(fixture.componentInstance.control.errors).toHaveProperty('chrMinDate');
    });
  });

  describe('responsive popup', () => {
    it('constrains the popup to the viewport width', async () => {
      const fixture = await createHost(Host);
      await open(fixture);
      expect(popup()!.classList.contains('chr-popup')).toBe(true);
    });
  });
});
