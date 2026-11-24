import type { DateAdapter } from '../adapters/date-adapter';

/** Dates that cannot be selected: a predicate, or an explicit list of days. */
export type DisabledDates<TDate> = ((date: TDate) => boolean) | readonly TDate[];

/** Normalises {@link DisabledDates} into a predicate (`null` when nothing is disabled). */
export function createDisabledPredicate<TDate>(
  adapter: DateAdapter<TDate>,
  disabled: DisabledDates<TDate> | null | undefined,
): ((date: TDate) => boolean) | null {
  if (!disabled) {
    return null;
  }
  if (typeof disabled === 'function') {
    return disabled;
  }
  return (date: TDate) => disabled.some((d) => adapter.isSameDay(d, date));
}
