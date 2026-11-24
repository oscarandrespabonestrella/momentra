import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CalendarComponent } from './calendar.component';
import { MonthPickerComponent } from '../month-picker/month-picker.component';
import { YearPickerComponent } from '../year-picker/year-picker.component';
import { DecadePickerComponent } from '../decade-picker/decade-picker.component';

const d = (y: number, m: number, day: number) => new Date(y, m, day);

@Component({
  imports: [CalendarComponent, ReactiveFormsModule],
  template: `<chr-calendar [formControl]="control" [min]="min()" [max]="max()" [disabledDates]="disabled()" [initialDate]="initial" (dateSelect)="selected.push($event)" />`,
})
class ReactiveHost {
  control = new FormControl<Date | null>(null);
  min = signal<Date | null>(null);
  max = signal<Date | null>(null);
  disabled = signal<((d: Date) => boolean) | null>(null);
  initial = d(2026, 10, 15);
  selected: Date[] = [];
}

@Component({
  imports: [CalendarComponent, FormsModule],
  template: `<chr-calendar [(ngModel)]="date" [initialDate]="initial" [attr.data-tick]="tick()" />`,
})
class TemplateHost {
  date: Date | null = null;
  readonly tick = signal(0); // bump to re-render this OnPush-by-default host
  initial = d(2026, 10, 15);
}

async function setup<T>(host: new () => T): Promise<{ fixture: ComponentFixture<T>; el: HTMLElement }> {
  await TestBed.configureTestingModule({ imports: [host as never] }).compileComponents();
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

const cells = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLButtonElement>('button.chr-cell'));
const cell = (el: HTMLElement, label: string) =>
  cells(el).find((c) => c.textContent?.trim() === label && !c.classList.contains('chr-outside'))!;
const title = (el: HTMLElement) => el.querySelector('.chr-title')!.textContent!.trim();
const click = async (fixture: ComponentFixture<unknown>, target: Element) => {
  (target as HTMLElement).click();
  fixture.detectChanges();
  await fixture.whenStable();
};
const key = async (fixture: ComponentFixture<unknown>, target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
  fixture.detectChanges();
  await fixture.whenStable();
};

describe('CalendarComponent', () => {
  describe('rendering', () => {
    it('renders the month of the initial date with weekday headers', async () => {
      const { el } = await setup(ReactiveHost);
      expect(title(el)).toBe('November 2026');
      expect(el.querySelectorAll('th.chr-weekday').length).toBe(7);
      expect(cells(el).length).toBe(35);
      expect(el.querySelector('table')!.getAttribute('role')).toBe('grid');
    });

    it('exposes a descriptive label on each day', async () => {
      const { el } = await setup(ReactiveHost);
      expect(cells(el).some((c) => c.getAttribute('aria-label') === 'Monday, November 23, 2026')).toBe(true);
    });

    it('uses a roving tabindex: exactly one cell is tabbable', async () => {
      const { el } = await setup(ReactiveHost);
      const tabbable = cells(el).filter((c) => c.tabIndex === 0);
      expect(tabbable.length).toBe(1);
      expect(tabbable[0].textContent!.trim()).toBe('15');
    });

    it('highlights today when it is visible', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      fixture.componentInstance.control.setValue(new Date());
      fixture.detectChanges();
      await fixture.whenStable();
      expect(el.querySelectorAll('.chr-today').length).toBe(1);
      expect(el.querySelector('.chr-today')!.getAttribute('aria-current')).toBe('date');
    });
  });

  describe('selection', () => {
    it('selects a day, updates the control and emits dateSelect', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      await click(fixture, cell(el, '20'));
      expect(fixture.componentInstance.control.value).toEqual(d(2026, 10, 20));
      expect(fixture.componentInstance.selected).toEqual([d(2026, 10, 20)]);
      expect(cell(el, '20').classList.contains('chr-selected')).toBe(true);
      expect(cell(el, '20').closest('td')!.getAttribute('aria-selected')).toBe('true');
    });

    it('marks the control dirty-free but touched after a selection', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      await click(fixture, cell(el, '20'));
      expect(fixture.componentInstance.control.touched).toBe(true);
    });

    it('does not select disabled dates', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      fixture.componentInstance.disabled.set((x) => x.getDay() === 0);
      fixture.detectChanges();
      const sunday = cell(el, '22');
      expect(sunday.getAttribute('aria-disabled')).toBe('true');
      await click(fixture, sunday);
      expect(fixture.componentInstance.control.value).toBeNull();
    });

    it('accepts an explicit list of disabled days', async () => {
      await TestBed.configureTestingModule({ imports: [CalendarComponent] }).compileComponents();
      const fixture = TestBed.createComponent(CalendarComponent<Date>);
      fixture.componentRef.setInput('initialDate', d(2026, 10, 15));
      fixture.componentRef.setInput('disabledDates', [d(2026, 10, 18)]);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(cell(el, '18').getAttribute('aria-disabled')).toBe('true');
      expect(cell(el, '19').getAttribute('aria-disabled')).toBeNull();
    });

    it('does not select days outside min/max', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      fixture.componentInstance.min.set(d(2026, 10, 10));
      fixture.componentInstance.max.set(d(2026, 10, 20));
      fixture.detectChanges();
      await click(fixture, cell(el, '5'));
      await click(fixture, cell(el, '25'));
      expect(fixture.componentInstance.control.value).toBeNull();
      await click(fixture, cell(el, '12'));
      expect(fixture.componentInstance.control.value).toEqual(d(2026, 10, 12));
    });

    it('selects today with the Today button', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      await click(fixture, el.querySelector('.chr-today-btn')!);
      const value = fixture.componentInstance.control.value!;
      const now = new Date();
      expect([value.getFullYear(), value.getMonth(), value.getDate()]).toEqual([now.getFullYear(), now.getMonth(), now.getDate()]);
      expect(value.getHours()).toBe(0);
    });

    it('disables the Today button when today is outside the allowed range', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      fixture.componentInstance.max.set(d(2000, 0, 1));
      fixture.detectChanges();
      expect((el.querySelector('.chr-today-btn') as HTMLButtonElement).disabled).toBe(true);
    });

    it('can hide the Today button', async () => {
      await TestBed.configureTestingModule({ imports: [CalendarComponent] }).compileComponents();
      const fixture = TestBed.createComponent(CalendarComponent<Date>);
      fixture.componentRef.setInput('showToday', false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.chr-today-btn')).toBeNull();
    });
  });

  describe('navigation', () => {
    it('moves between months and disables arrows beyond min/max', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      const [prev, next] = Array.from(el.querySelectorAll<HTMLButtonElement>('.chr-nav'));
      await click(fixture, next);
      expect(title(el)).toBe('December 2026');
      await click(fixture, prev);
      await click(fixture, prev);
      expect(title(el)).toBe('October 2026');

      fixture.componentInstance.min.set(d(2026, 9, 1));
      fixture.detectChanges();
      expect(prev.disabled).toBe(true);
      fixture.componentInstance.max.set(d(2026, 9, 31));
      fixture.detectChanges();
      expect(next.disabled).toBe(true);
    });

    it('drills up to months, years and decades and back down by picking', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      const titleBtn = () => el.querySelector('.chr-title') as HTMLButtonElement;
      await click(fixture, titleBtn());
      expect(title(el)).toBe('2026');
      expect(cells(el).length).toBe(12);
      await click(fixture, titleBtn());
      expect(title(el)).toBe('2020 – 2029');
      await click(fixture, titleBtn());
      expect(title(el)).toBe('2000 – 2099');
      expect(titleBtn().disabled).toBe(true);

      await click(fixture, cells(el).find((c) => c.textContent!.trim() === '2030 – 2039')!);
      expect(title(el)).toBe('2030 – 2039');
      await click(fixture, cells(el).find((c) => c.textContent!.trim() === '2033')!);
      expect(title(el)).toBe('2033');
      await click(fixture, cells(el).find((c) => c.textContent!.trim() === 'Feb')!);
      expect(title(el)).toBe('February 2033');
      expect(fixture.componentInstance.control.value).toBeNull(); // drilling does not select
    });

    it('moves focus with the arrow keys and pages with PageDown', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      const grid = el.querySelector('table')!;
      await key(fixture, grid, 'ArrowRight');
      expect(cells(el).find((c) => c.tabIndex === 0)!.textContent!.trim()).toBe('16');
      await key(fixture, grid, 'ArrowDown');
      expect(cells(el).find((c) => c.tabIndex === 0)!.textContent!.trim()).toBe('23');
      await key(fixture, grid, 'ArrowLeft');
      await key(fixture, grid, 'ArrowUp');
      expect(cells(el).find((c) => c.tabIndex === 0)!.textContent!.trim()).toBe('15');
      await key(fixture, grid, 'PageDown');
      expect(title(el)).toBe('December 2026');
      expect(cells(el).find((c) => c.tabIndex === 0)!.textContent!.trim()).toBe('15');
      await key(fixture, grid, 'PageUp', { shiftKey: true });
      expect(title(el)).toBe('December 2025');
    });

    it('flows across month boundaries with the arrow keys', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      const grid = el.querySelector('table')!;
      for (let i = 0; i < 16; i++) {
        await key(fixture, grid, 'ArrowRight'); // 15 Nov -> 1 Dec
      }
      expect(title(el)).toBe('December 2026');
      expect(cells(el).find((c) => c.tabIndex === 0)!.textContent!.trim()).toBe('1');
    });

    it('jumps to week boundaries with Home and End', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      const grid = el.querySelector('table')!;
      await key(fixture, grid, 'Home');
      expect(cells(el).find((c) => c.tabIndex === 0)!.textContent!.trim()).toBe('15'); // 15 Nov 2026 is a Sunday
      await key(fixture, grid, 'End');
      expect(cells(el).find((c) => c.tabIndex === 0)!.textContent!.trim()).toBe('21');
    });

    it('does not move focus beyond max', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      fixture.componentInstance.max.set(d(2026, 10, 16));
      fixture.detectChanges();
      const grid = el.querySelector('table')!;
      await key(fixture, grid, 'ArrowRight');
      await key(fixture, grid, 'ArrowRight');
      expect(cells(el).find((c) => c.tabIndex === 0)!.textContent!.trim()).toBe('16');
    });

    it('moves DOM focus to the active cell after keyboard navigation', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      document.body.appendChild(el);
      await key(fixture, el.querySelector('table')!, 'ArrowRight');
      await fixture.whenStable();
      expect(document.activeElement).toBe(cell(el, '16'));
      el.remove();
    });

    it('Ctrl+ArrowUp goes to a coarser view', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      await key(fixture, el.querySelector('table')!, 'ArrowUp', { ctrlKey: true });
      expect(title(el)).toBe('2026');
    });

    it('ignores navigation keys when modified by Ctrl/Alt/Meta', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      await key(fixture, el.querySelector('table')!, 'ArrowRight', { altKey: true });
      expect(cells(el).find((c) => c.tabIndex === 0)!.textContent!.trim()).toBe('15');
    });
  });

  describe('Angular Forms', () => {
    it('shows a value written by a reactive form', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      fixture.componentInstance.control.setValue(d(2027, 2, 9));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(title(el)).toBe('March 2027');
      expect(cell(el, '9').classList.contains('chr-selected')).toBe(true);
    });

    it('accepts ISO strings and clears on null (never shifting the day)', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      fixture.componentInstance.control.setValue('2027-03-09' as never);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(cell(el, '9').classList.contains('chr-selected')).toBe(true);
      fixture.componentInstance.control.setValue(null);
      fixture.detectChanges();
      expect(el.querySelector('.chr-selected')).toBeNull();
    });

    it('honours control.disable()', async () => {
      const { fixture, el } = await setup(ReactiveHost);
      fixture.componentInstance.control.disable();
      fixture.detectChanges();
      await fixture.whenStable();
      await click(fixture, cell(el, '20'));
      expect(fixture.componentInstance.control.value).toBeNull();
      expect(cell(el, '20').getAttribute('aria-disabled')).toBe('true');
      expect((el.querySelector('.chr-nav') as HTMLButtonElement).disabled).toBe(true);
    });

    it('reports min/max/disabled validation errors to the control', async () => {
      const { fixture } = await setup(ReactiveHost);
      const host = fixture.componentInstance;
      host.min.set(d(2026, 10, 10));
      fixture.detectChanges();
      host.control.setValue(d(2026, 10, 5));
      expect(host.control.errors).toHaveProperty('chrMinDate');
      host.control.setValue(d(2026, 10, 12));
      expect(host.control.errors).toBeNull();
      host.min.set(d(2026, 10, 13));
      fixture.detectChanges();
      expect(host.control.errors).toHaveProperty('chrMinDate'); // re-validated when the rule changes
    });

    it('works with ngModel', async () => {
      const { fixture, el } = await setup(TemplateHost);
      await click(fixture, cell(el, '18'));
      expect(fixture.componentInstance.date).toEqual(d(2026, 10, 18));
      fixture.componentInstance.date = d(2026, 10, 3);
      fixture.componentInstance.tick.update((n) => n + 1);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve)); // ngModel writes values in a microtask
      await fixture.whenStable();
      fixture.detectChanges();
      expect(cell(el, '3').classList.contains('chr-selected')).toBe(true);
    });
  });

  describe('custom cell template', () => {
    it('renders the template for each cell', async () => {
      @Component({
        imports: [CalendarComponent],
        template: `
          <ng-template #tpl let-cell><b class="custom">{{ cell.label }}!</b></ng-template>
          <chr-calendar [cellTemplate]="tpl" [initialDate]="initial" />`,
      })
      class TplHost {
        initial = d(2026, 10, 15);
      }
      const { el } = await setup(TplHost);
      expect(el.querySelectorAll('.custom').length).toBe(35);
      expect(el.querySelector('.custom')!.textContent).toBe('1!');
    });
  });

  describe('localization', () => {
    it('renders Spanish names and a Monday-first week', async () => {
      await TestBed.configureTestingModule({ imports: [CalendarComponent] }).compileComponents();
      const fixture = TestBed.createComponent(CalendarComponent<Date>);
      fixture.componentRef.setInput('locale', 'es-ES');
      fixture.componentRef.setInput('initialDate', d(2026, 10, 15));
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(title(el).toLowerCase()).toBe('noviembre 2026');
      expect(el.querySelector('th.chr-weekday')!.getAttribute('aria-label')!.toLowerCase()).toBe('lunes');
      expect(el.querySelector('.chr-today-btn')!.textContent!.trim()).toBe('Hoy');
    });
  });
});

describe('Month, year and decade pickers', () => {
  @Component({
    imports: [MonthPickerComponent, YearPickerComponent, DecadePickerComponent, ReactiveFormsModule],
    template: `
      <chr-month-picker class="m" [formControl]="month" />
      <chr-year-picker class="y" [formControl]="year" />
      <chr-decade-picker class="d" [formControl]="decade" />`,
  })
  class PickersHost {
    month = new FormControl<Date | null>(null);
    year = new FormControl<Date | null>(null);
    decade = new FormControl<Date | null>(null);
  }

  it('select a month (first day), a year (1 Jan) and a decade (1 Jan of its first year)', async () => {
    const { fixture, el } = await setup(PickersHost);
    const within = (sel: string) => el.querySelector(sel)!;
    const pick = async (sel: string, label: string) => {
      const target = Array.from(within(sel).querySelectorAll<HTMLButtonElement>('button.chr-cell')).find(
        (c) => c.textContent!.trim() === label,
      )!;
      await click(fixture, target);
    };
    expect(within('.m .chr-title').textContent!.trim()).toBe(String(new Date().getFullYear()));
    await pick('.m', 'Mar');
    expect(fixture.componentInstance.month.value).toEqual(new Date(new Date().getFullYear(), 2, 1));

    const decadeStart = Math.floor(new Date().getFullYear() / 10) * 10;
    await pick('.y', String(decadeStart + 3));
    expect(fixture.componentInstance.year.value).toEqual(new Date(decadeStart + 3, 0, 1));

    const centuryStart = Math.floor(new Date().getFullYear() / 100) * 100;
    await pick('.d', `${centuryStart + 30} – ${centuryStart + 39}`);
    expect(fixture.componentInstance.decade.value).toEqual(new Date(centuryStart + 30, 0, 1));
  });

  it('normalises written values to the start of their period and marks the selection', async () => {
    const { fixture, el } = await setup(PickersHost);
    fixture.componentInstance.month.setValue(new Date(new Date().getFullYear(), 5, 20));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.querySelector('.m .chr-selected')!.textContent!.trim()).toBe('Jun');
  });
});
