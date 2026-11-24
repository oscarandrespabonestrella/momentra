import { patternHasSeconds, patternUses12Hours } from '../../formatting/format-pattern';

/**
 * Pure time-of-day calculations for the time selector. Times are expressed as a 24-hour
 * {@link TimeParts}; "seconds of day" (0–86399) is used for comparisons.
 */
export interface TimeParts {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

/** Inclusive limits in seconds of day; `null` means unbounded. */
export interface TimeBounds {
  readonly min: number | null;
  readonly max: number | null;
}

export interface TimeSteps {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

export interface TimeOption {
  /** 24-hour hour for hour options; minute/second value; `0` (AM) or `1` (PM) for meridiem. */
  readonly value: number;
  readonly label: string;
  readonly selected: boolean;
  readonly disabled: boolean;
}

export type TimeColumnId = 'hours' | 'minutes' | 'seconds' | 'meridiem';

export const toSeconds = (t: TimeParts): number => t.hours * 3600 + t.minutes * 60 + t.seconds;

export function fromSeconds(total: number): TimeParts {
  const clamped = Math.max(0, Math.min(86399, Math.round(total)));
  return { hours: Math.floor(clamped / 3600), minutes: Math.floor((clamped % 3600) / 60), seconds: clamped % 60 };
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

function outside(from: number, to: number, bounds: TimeBounds): boolean {
  return (bounds.min !== null && to < bounds.min) || (bounds.max !== null && from > bounds.max);
}

/** Restricts a time to the bounds (a time before `min` becomes `min`, and so on). */
export function clampTime(time: TimeParts, bounds: TimeBounds): TimeParts {
  let total = toSeconds(time);
  if (bounds.min !== null && total < bounds.min) {
    total = bounds.min;
  }
  if (bounds.max !== null && total > bounds.max) {
    total = bounds.max;
  }
  return fromSeconds(total);
}

export interface TimeColumnConfig {
  readonly use12Hours: boolean;
  readonly steps: TimeSteps;
  readonly bounds: TimeBounds;
  readonly meridiemLabels: { readonly am: string; readonly pm: string };
}

/** Hour options. In 12-hour mode the labels run 12, 1 … 11 and map to the current AM/PM half. */
export function hourOptions(cfg: TimeColumnConfig, current: TimeParts | null): TimeOption[] {
  const pm = (current?.hours ?? 0) >= 12;
  const count = cfg.use12Hours ? 12 : 24;
  const options: TimeOption[] = [];
  for (let index = 0; index < count; index += cfg.steps.hour) {
    const hour24 = cfg.use12Hours ? index + (pm ? 12 : 0) : index;
    const label = cfg.use12Hours ? String(index === 0 ? 12 : index) : pad2(index);
    options.push({
      value: hour24,
      label,
      selected: current !== null && current.hours === hour24,
      disabled: outside(hour24 * 3600, hour24 * 3600 + 3599, cfg.bounds),
    });
  }
  return options;
}

export function minuteOptions(cfg: TimeColumnConfig, current: TimeParts | null): TimeOption[] {
  const hour = current?.hours ?? 0;
  const options: TimeOption[] = [];
  for (let minute = 0; minute < 60; minute += cfg.steps.minute) {
    const from = hour * 3600 + minute * 60;
    options.push({
      value: minute,
      label: pad2(minute),
      selected: current !== null && current.minutes === minute,
      disabled: outside(from, from + 59, cfg.bounds),
    });
  }
  return options;
}

export function secondOptions(cfg: TimeColumnConfig, current: TimeParts | null): TimeOption[] {
  const base = (current?.hours ?? 0) * 3600 + (current?.minutes ?? 0) * 60;
  const options: TimeOption[] = [];
  for (let second = 0; second < 60; second += cfg.steps.second) {
    options.push({
      value: second,
      label: pad2(second),
      selected: current !== null && current.seconds === second,
      disabled: outside(base + second, base + second, cfg.bounds),
    });
  }
  return options;
}

export function meridiemOptions(cfg: TimeColumnConfig, current: TimeParts | null): TimeOption[] {
  return [0, 1].map((value) => ({
    value,
    label: value === 0 ? cfg.meridiemLabels.am : cfg.meridiemLabels.pm,
    selected: current !== null && (current.hours >= 12 ? 1 : 0) === value,
    disabled: value === 0 ? outside(0, 12 * 3600 - 1, cfg.bounds) : outside(12 * 3600, 86399, cfg.bounds),
  }));
}

/** Applies a choice in one column and keeps the result inside the bounds. */
export function applyTimeChoice(
  column: TimeColumnId,
  value: number,
  current: TimeParts | null,
  bounds: TimeBounds,
): TimeParts {
  const base = current ?? { hours: 0, minutes: 0, seconds: 0 };
  let next: TimeParts;
  switch (column) {
    case 'hours':
      next = { ...base, hours: value };
      break;
    case 'minutes':
      next = { ...base, minutes: value };
      break;
    case 'seconds':
      next = { ...base, seconds: value };
      break;
    case 'meridiem':
      next = { ...base, hours: (base.hours % 12) + (value === 1 ? 12 : 0) };
      break;
  }
  return clampTime(next, bounds);
}

/** Snaps a time down to the configured steps (minute step applies to minutes, and so on). */
export function snapToSteps(time: TimeParts, steps: TimeSteps, showSeconds: boolean): TimeParts {
  return {
    hours: time.hours - (time.hours % steps.hour),
    minutes: time.minutes - (time.minutes % steps.minute),
    seconds: showSeconds ? time.seconds - (time.seconds % steps.second) : 0,
  };
}

/** Sanitises a step value: an integer ≥ 1 that divides the range sensibly; falls back to 1. */
export function normalizeStep(step: number | null | undefined, max: number): number {
  const value = Math.floor(step ?? 1);
  return Number.isFinite(value) && value >= 1 && value <= max ? value : 1;
}

export interface TimeFormatOptions {
  /** Explicit pattern; wins over everything else. */
  readonly format?: string | null;
  readonly hourFormat?: 12 | 24 | null;
  readonly showSeconds?: boolean | null;
  /** The locale's default time pattern. */
  readonly localePattern: string;
}

/**
 * Chooses the pattern a time picker formats with. An explicit `format` wins; otherwise the locale's
 * pattern is adjusted for the requested hour format and seconds.
 */
export function resolveTimePattern(options: TimeFormatOptions): string {
  if (options.format) {
    return options.format;
  }
  const twelve = options.hourFormat != null ? options.hourFormat === 12 : patternUses12Hours(options.localePattern);
  const seconds = options.showSeconds != null ? options.showSeconds : patternHasSeconds(options.localePattern);
  if (options.hourFormat == null && options.showSeconds == null) {
    return options.localePattern;
  }
  return `${twelve ? 'hh' : 'HH'}:mm${seconds ? ':ss' : ''}${twelve ? ' a' : ''}`;
}
