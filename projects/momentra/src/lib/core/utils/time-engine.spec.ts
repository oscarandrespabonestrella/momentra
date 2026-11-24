import {
  applyTimeChoice,
  clampTime,
  fromSeconds,
  hourOptions,
  meridiemOptions,
  minuteOptions,
  normalizeStep,
  resolveTimePattern,
  secondOptions,
  snapToSteps,
  toSeconds,
  type TimeColumnConfig,
} from './time-engine';

const cfg = (over: Partial<TimeColumnConfig> = {}): TimeColumnConfig => ({
  use12Hours: false,
  steps: { hour: 1, minute: 1, second: 1 },
  bounds: { min: null, max: null },
  meridiemLabels: { am: 'AM', pm: 'PM' },
  ...over,
});
const t = (hours: number, minutes = 0, seconds = 0) => ({ hours, minutes, seconds });

describe('time engine', () => {
  it('converts between parts and seconds of day', () => {
    expect(toSeconds(t(1, 2, 3))).toBe(3723);
    expect(fromSeconds(3723)).toEqual(t(1, 2, 3));
    expect(fromSeconds(-5)).toEqual(t(0));
    expect(fromSeconds(999999)).toEqual(t(23, 59, 59));
  });

  describe('options', () => {
    it('lists 24 hours and marks the selected one', () => {
      const hours = hourOptions(cfg(), t(14, 30));
      expect(hours.length).toBe(24);
      expect(hours.find((h) => h.selected)!.label).toBe('14');
    });

    it('lists 12-hour labels starting at 12 and maps them to the current half of the day', () => {
      const am = hourOptions(cfg({ use12Hours: true }), t(9));
      expect(am.map((h) => h.label).slice(0, 3)).toEqual(['12', '1', '2']);
      expect(am[0].value).toBe(0);
      expect(am.find((h) => h.selected)!.label).toBe('9');
      const pm = hourOptions(cfg({ use12Hours: true }), t(15));
      expect(pm[0].value).toBe(12);
      expect(pm.find((h) => h.selected)!.label).toBe('3');
    });

    it('applies steps', () => {
      expect(minuteOptions(cfg({ steps: { hour: 1, minute: 15, second: 1 } }), null).map((o) => o.value)).toEqual([0, 15, 30, 45]);
      expect(hourOptions(cfg({ steps: { hour: 6, minute: 1, second: 1 } }), null).map((o) => o.value)).toEqual([0, 6, 12, 18]);
      expect(secondOptions(cfg({ steps: { hour: 1, minute: 1, second: 30 } }), null).map((o) => o.value)).toEqual([0, 30]);
    });

    it('disables options outside the bounds', () => {
      const bounds = { min: toSeconds(t(9, 30)), max: toSeconds(t(17)) };
      const hours = hourOptions(cfg({ bounds }), null);
      expect(hours.filter((h) => !h.disabled).map((h) => h.value)).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
      const minutesAt9 = minuteOptions(cfg({ bounds }), t(9));
      expect(minutesAt9.find((m) => m.value === 29)!.disabled).toBe(true);
      expect(minutesAt9.find((m) => m.value === 30)!.disabled).toBe(false);
      const minutesAt17 = minuteOptions(cfg({ bounds }), t(17));
      expect(minutesAt17.find((m) => m.value === 0)!.disabled).toBe(false);
      expect(minutesAt17.find((m) => m.value === 1)!.disabled).toBe(true);
      expect(secondOptions(cfg({ bounds }), t(17, 0)).find((s) => s.value === 1)!.disabled).toBe(true);
    });

    it('disables a meridiem that lies fully outside the bounds', () => {
      const options = meridiemOptions(cfg({ bounds: { min: toSeconds(t(13)), max: null } }), null);
      expect(options[0].disabled).toBe(true);
      expect(options[1].disabled).toBe(false);
    });
  });

  describe('choices', () => {
    const none = { min: null, max: null };

    it('sets one field and keeps the others', () => {
      expect(applyTimeChoice('hours', 5, t(14, 20, 10), none)).toEqual(t(5, 20, 10));
      expect(applyTimeChoice('minutes', 45, t(14, 20, 10), none)).toEqual(t(14, 45, 10));
      expect(applyTimeChoice('seconds', 1, t(14, 20, 10), none)).toEqual(t(14, 20, 1));
    });

    it('starts from midnight when there is no value', () => {
      expect(applyTimeChoice('minutes', 30, null, none)).toEqual(t(0, 30));
    });

    it('switches AM/PM without changing the 12-hour reading', () => {
      expect(applyTimeChoice('meridiem', 1, t(9, 15), none)).toEqual(t(21, 15));
      expect(applyTimeChoice('meridiem', 0, t(21, 15), none)).toEqual(t(9, 15));
      expect(applyTimeChoice('meridiem', 1, t(0, 5), none)).toEqual(t(12, 5));
    });

    it('clamps results into the bounds', () => {
      const bounds = { min: toSeconds(t(9, 30)), max: toSeconds(t(17)) };
      expect(applyTimeChoice('hours', 9, t(12, 10), bounds)).toEqual(t(9, 30));
      expect(applyTimeChoice('hours', 17, t(12, 45), bounds)).toEqual(t(17, 0));
      expect(clampTime(t(3), bounds)).toEqual(t(9, 30));
    });

    it('snaps down to steps', () => {
      const steps = { hour: 2, minute: 15, second: 10 };
      expect(snapToSteps(t(15, 44, 59), steps, true)).toEqual(t(14, 30, 50));
      expect(snapToSteps(t(15, 44, 59), steps, false)).toEqual(t(14, 30, 0));
    });

    it('normalises invalid steps to 1', () => {
      expect(normalizeStep(0, 60)).toBe(1);
      expect(normalizeStep(-3, 60)).toBe(1);
      expect(normalizeStep(NaN, 60)).toBe(1);
      expect(normalizeStep(61, 60)).toBe(1);
      expect(normalizeStep(15, 60)).toBe(15);
      expect(normalizeStep(null, 60)).toBe(1);
    });
  });

  describe('resolveTimePattern', () => {
    it('keeps the locale pattern by default', () => {
      expect(resolveTimePattern({ localePattern: 'hh:mm a' })).toBe('hh:mm a');
    });

    it('lets an explicit format win', () => {
      expect(resolveTimePattern({ format: 'H.mm', hourFormat: 12, localePattern: 'hh:mm a' })).toBe('H.mm');
    });

    it('derives from hour format and seconds', () => {
      expect(resolveTimePattern({ hourFormat: 24, localePattern: 'hh:mm a' })).toBe('HH:mm');
      expect(resolveTimePattern({ hourFormat: 12, localePattern: 'HH:mm' })).toBe('hh:mm a');
      expect(resolveTimePattern({ hourFormat: 24, showSeconds: true, localePattern: 'HH:mm' })).toBe('HH:mm:ss');
      expect(resolveTimePattern({ showSeconds: true, localePattern: 'hh:mm a' })).toBe('hh:mm:ss a');
      expect(resolveTimePattern({ showSeconds: false, localePattern: 'HH:mm:ss' })).toBe('HH:mm');
    });
  });
});
