import { NativeDateAdapter } from '../adapters/native-date-adapter';
import { EN_US_LOCALE } from '../../localization/locale';
import {
  buildDayView,
  buildDecadeView,
  buildMonthView,
  buildYearView,
  moveFocus,
  shiftView,
  drillDownView,
  drillUpView,
  clampToRules,
  type CalendarContext,
} from './calendar-engine';

const adapter = new NativeDateAdapter();
const d = (y: number, m: number, day: number) => adapter.create(y, m, day);

function ctx(over: Partial<CalendarContext<Date>> = {}): CalendarContext<Date> {
  return { adapter, locale: EN_US_LOCALE, firstDayOfWeek: 0, rules: {}, selected: null, ...over };
}

describe('calendar engine', () => {
  describe('day view', () => {
    it('lays out November 2026 with leading and trailing days', () => {
      const vm = buildDayView(ctx(), d(2026, 10, 15));
      expect(vm.title).toBe('November 2026');
      expect(vm.weekdays.map((w) => w.short).join('')).toBe('SMTWTFS');
      expect(vm.rows.length).toBe(5);
      expect(vm.rows[0][0].label).toBe('1');
      expect(vm.rows[0][0].outside).toBe(false);
      expect(vm.rows[4][6].outside).toBe(true); // 5 December
    });

    it('rotates weekday headers and grid for a Monday week start', () => {
      const vm = buildDayView(ctx({ firstDayOfWeek: 1 }), d(2026, 10, 15));
      expect(vm.weekdays[0].long).toBe('Monday');
      expect(vm.rows[0][0].outside).toBe(true); // 26 October
      expect(vm.rows[0][0].date).toEqual(d(2026, 9, 26));
    });

    it('marks selected and today cells', () => {
      const today = adapter.today();
      const vm = buildDayView(ctx({ selected: d(2026, 10, 20) }), today);
      const flat = vm.rows.flat();
      expect(flat.filter((c) => c.selected).length).toBe(adapter.isSameMonth(today, d(2026, 10, 1)) ? 1 : 0);
      expect(flat.filter((c) => c.today).length).toBe(1);
    });

    it('disables dates outside min/max and via the predicate', () => {
      const vm = buildDayView(
        ctx({ rules: { min: d(2026, 10, 10), max: d(2026, 10, 20), isDisabled: (x) => x.getDay() === 0 } }),
        d(2026, 10, 15),
      );
      const byDay = new Map(vm.rows.flat().filter((c) => !c.outside).map((c) => [Number(c.label), c]));
      expect(byDay.get(9)!.disabled).toBe(true);
      expect(byDay.get(10)!.disabled).toBe(false);
      expect(byDay.get(15)!.disabled).toBe(true); // Sunday 15th
      expect(byDay.get(20)!.disabled).toBe(false);
      expect(byDay.get(21)!.disabled).toBe(true);
    });

    it('treats min/max as whole days even when they carry a time of day', () => {
      const min = adapter.create(2026, 10, 10, 15, 0);
      const vm = buildDayView(ctx({ rules: { min } }), d(2026, 10, 15));
      expect(vm.rows.flat().find((c) => c.key === '2026-11-10')!.disabled).toBe(false);
      expect(vm.rows.flat().find((c) => c.key === '2026-11-09')!.disabled).toBe(true);
    });

    it('highlights a range, including a reversed one and an open-ended one', () => {
      const flat = (range: CalendarContext<Date>['range']) => buildDayView(ctx({ range }), d(2026, 10, 15)).rows.flat();
      const inRange = (cells: ReturnType<typeof flat>) => cells.filter((c) => c.inRange).map((c) => c.label);
      expect(inRange(flat({ start: d(2026, 10, 10), end: d(2026, 10, 12) }))).toEqual(['10', '11', '12']);
      expect(inRange(flat({ start: d(2026, 10, 12), end: d(2026, 10, 10) }))).toEqual(['10', '11', '12']);
      const open = flat({ start: d(2026, 10, 10), end: null });
      expect(inRange(open)).toEqual(['10']);
      expect(open.find((c) => c.rangeStart)!.label).toBe('10');
      expect(flat({ start: d(2026, 10, 10), end: d(2026, 10, 12) }).find((c) => c.rangeEnd)!.label).toBe('12');
    });

    it('gives each cell a descriptive aria label', () => {
      const cell = buildDayView(ctx(), d(2026, 10, 15)).rows.flat().find((c) => c.key === '2026-11-23')!;
      expect(cell.ariaLabel).toBe('Monday, November 23, 2026');
    });

    it('can render a fixed six weeks', () => {
      expect(buildDayView(ctx({ fixedWeeks: true }), d(2026, 1, 1)).rows.length).toBe(6);
    });
  });

  describe('month, year and decade views', () => {
    it('shows 12 months and selects the right one', () => {
      const vm = buildMonthView(ctx({ selected: d(2026, 4, 9) }), d(2026, 10, 15));
      expect(vm.title).toBe('2026');
      expect(vm.rows.flat().length).toBe(12);
      expect(vm.rows.flat().find((c) => c.selected)!.label).toBe('May');
    });

    it('disables months fully outside bounds but not partially covered ones', () => {
      const vm = buildMonthView(ctx({ rules: { min: d(2026, 5, 20), max: d(2026, 8, 3) } }), d(2026, 0, 1));
      const disabled = vm.rows.flat().map((c) => c.disabled);
      expect(disabled).toEqual([true, true, true, true, true, false, false, false, false, true, true, true]);
    });

    it('shows a decade of years padded with neighbours', () => {
      const vm = buildYearView(ctx({ selected: d(2026, 0, 1) }), d(2026, 5, 1));
      expect(vm.title).toBe('2020 – 2029');
      expect(vm.rows.flat().map((c) => c.label)).toEqual([
        '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030',
      ]);
      expect(vm.rows.flat()[0].outside).toBe(true);
      expect(vm.rows.flat()[11].outside).toBe(true);
      expect(vm.rows.flat().find((c) => c.selected)!.label).toBe('2026');
    });

    it('shows a century of decades', () => {
      const vm = buildDecadeView(ctx({ selected: d(2026, 0, 1) }), d(2026, 5, 1));
      expect(vm.title).toBe('2000 – 2099');
      expect(vm.rows.flat()[1].label).toBe('2000 – 2009');
      expect(vm.rows.flat().find((c) => c.selected)!.label).toBe('2020 – 2029');
    });
  });

  describe('navigation', () => {
    const move = (view: Parameters<typeof moveFocus>[1], date: Date, key: Parameters<typeof moveFocus>[3], shift = false) =>
      moveFocus(adapter, view, date, key, { firstDayOfWeek: 0, shift });

    it('moves by days and weeks in the day view', () => {
      expect(move('day', d(2026, 10, 15), 'ArrowRight')).toEqual(d(2026, 10, 16));
      expect(move('day', d(2026, 10, 15), 'ArrowLeft')).toEqual(d(2026, 10, 14));
      expect(move('day', d(2026, 10, 15), 'ArrowDown')).toEqual(d(2026, 10, 22));
      expect(move('day', d(2026, 10, 1), 'ArrowUp')).toEqual(d(2026, 9, 25));
    });

    it('pages by month, and by year with Shift', () => {
      expect(move('day', d(2026, 0, 31), 'PageDown')).toEqual(d(2026, 1, 28));
      expect(move('day', d(2026, 0, 15), 'PageUp')).toEqual(d(2025, 11, 15));
      expect(move('day', d(2026, 0, 15), 'PageDown', true)).toEqual(d(2027, 0, 15));
    });

    it('jumps to the start and end of the week', () => {
      expect(move('day', d(2026, 10, 25), 'Home')).toEqual(d(2026, 10, 22));
      expect(move('day', d(2026, 10, 25), 'End')).toEqual(d(2026, 10, 28));
    });

    it('navigates the month, year and decade grids by their own units', () => {
      expect(move('month', d(2026, 10, 1), 'ArrowRight')).toEqual(d(2026, 11, 1));
      expect(move('month', d(2026, 10, 1), 'ArrowUp')).toEqual(d(2026, 7, 1));
      expect(move('month', d(2026, 10, 1), 'PageDown')).toEqual(d(2027, 10, 1));
      expect(move('year', d(2026, 0, 1), 'ArrowDown')).toEqual(d(2030, 0, 1));
      expect(move('year', d(2026, 0, 1), 'Home')).toEqual(d(2020, 0, 1));
      expect(move('year', d(2026, 0, 1), 'End')).toEqual(d(2029, 0, 1));
      expect(move('decade', d(2020, 0, 1), 'ArrowRight')).toEqual(d(2030, 0, 1));
      expect(move('decade', d(2020, 0, 1), 'PageUp')).toEqual(d(1920, 0, 1));
    });

    it('shifts the displayed page', () => {
      expect(shiftView(adapter, 'day', d(2026, 0, 31), 1)).toEqual(d(2026, 1, 28));
      expect(shiftView(adapter, 'month', d(2026, 5, 1), -1)).toEqual(d(2025, 5, 1));
      expect(shiftView(adapter, 'year', d(2026, 5, 1), 1)).toEqual(d(2036, 5, 1));
      expect(shiftView(adapter, 'decade', d(2026, 5, 1), -1)).toEqual(d(1926, 5, 1));
    });

    it('drills between views', () => {
      expect(drillUpView('day')).toBe('month');
      expect(drillUpView('decade')).toBeNull();
      expect(drillDownView('decade')).toBe('year');
      expect(drillDownView('day')).toBeNull();
    });

    it('clamps focus to the allowed range', () => {
      const rules = { min: d(2026, 5, 10), max: d(2026, 5, 20) };
      expect(clampToRules(adapter, d(2026, 0, 1), rules)).toEqual(d(2026, 5, 10));
      expect(clampToRules(adapter, d(2027, 0, 1), rules)).toEqual(d(2026, 5, 20));
    });
  });
});
