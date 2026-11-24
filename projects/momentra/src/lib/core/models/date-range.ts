/**
 * A date range. While the user is selecting, either end may still be `null`
 * (an *incomplete* range); a complete range has both ends set.
 */
export interface DateRange<TDate = Date> {
  readonly start: TDate | null;
  readonly end: TDate | null;
}

/** A complete range: both ends are present. */
export interface CompleteDateRange<TDate = Date> {
  readonly start: TDate;
  readonly end: TDate;
}

/** A named shortcut shown by the range picker. `range` may be computed lazily (e.g. "last 7 days"). */
export interface DateRangePreset<TDate = Date> {
  readonly label: string;
  readonly range: CompleteDateRange<TDate> | (() => CompleteDateRange<TDate>);
}

/** Creates an empty range. */
export function emptyRange<TDate = Date>(): DateRange<TDate> {
  return { start: null, end: null };
}

/** Type guard: both ends are set. */
export function isCompleteRange<TDate>(range: DateRange<TDate> | null | undefined): range is CompleteDateRange<TDate> {
  return !!range && range.start !== null && range.end !== null;
}
