import {
  Directive,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
  type Signal,
} from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { ChronoraFormControl } from '../../core/forms/chronora-form-control';
import { tokenizePattern } from '../../formatting/format-pattern';

/** A field of the pattern (year, month, hour, ...) and where it sits in the displayed text. */
interface TextSegment {
  index: number;
  kind: string;
  start: number;
  end: number;
}

/**
 * Shared behaviour of the text-based controls (date input, date/time/time pickers): the text the
 * user types is parsed against a pattern, and the parsed date is the control's value.
 *
 * - While typing, a successfully parsed value is emitted immediately; unparsable text emits `null`
 *   and the control reports a `chrInvalidDate` (or `chrInvalidTime`) error, so forms see it.
 * - On blur / `Enter` the text is reformatted to the canonical pattern.
 * - `ArrowUp`/`ArrowDown` step the segment under the caret (day, month, year, hour, minute...).
 */
@Directive()
export abstract class ChronoraTextControl<TDate> extends ChronoraFormControl<TDate, TDate | null> {
  /** The value (two-way bindable: `[(value)]`). */
  readonly value = model<TDate | null>(null);
  readonly min = input<TDate | null | undefined>(null);
  readonly max = input<TDate | null | undefined>(null);
  /** Placeholder text. Defaults to the global placeholder, then to the active pattern. */
  readonly placeholder = input<string | null | undefined>(undefined);
  /** Shows the clear button. Defaults to the global setting. */
  readonly showClear = input<boolean | null | undefined, unknown>(undefined, {
    transform: (v) => (v == null ? undefined : booleanAttribute(v)),
  });

  /** Shows increment / decrement buttons (the same step as `ArrowUp` / `ArrowDown`). */
  readonly spinners = input(false, { transform: booleanAttribute });

  /** The text shown in the input. */
  readonly text = signal('');
  protected readonly parseFailed = signal(false);
  protected readonly fieldId = computed(() => this.inputId() ?? `${this.uid}-input`);
  protected readonly errorsId = `${this.uid}-errors`;

  /** The pattern used to format and parse the text. */
  protected abstract readonly pattern: Signal<string>;

  /** Used to fill date fields the pattern does not contain (time pickers). */
  protected parseBase(): TDate | null {
    return null;
  }

  /** Validates a parsed value against min/max and other rules. */
  protected abstract validateValue(value: TDate | null): ValidationErrors | null;

  /** Signals that influence {@link validateValue}, in addition to value/min/max. */
  protected extraValidationDependencies(): unknown {
    return null;
  }

  /** Name of the error reported when the text cannot be parsed. */
  protected readonly parseErrorKey: 'chrInvalidDate' | 'chrInvalidTime' = 'chrInvalidDate';

  private typing = false;
  private readonly textInjector = inject(Injector);
  private readonly fieldEl = viewChild<ElementRef<HTMLInputElement>>('field');

  protected readonly placeholderText = computed(
    () => this.placeholder() ?? this.settings.config.placeholder ?? this.pattern().toLowerCase(),
  );
  protected readonly clearVisible = computed(
    () => (this.showClear() ?? this.settings.config.showClearButton) && this.isInteractive() && this.text() !== '',
  );

  constructor() {
    super();
    // Keep the text in sync when the value, pattern or locale change from outside the input.
    effect(() => {
      this.value();
      this.pattern();
      this.effectiveLocale();
      untracked(() => {
        if (!this.typing) {
          this.syncText();
        }
      });
    });
  }

  // ----------------------------------------------------------------- forms plumbing

  protected override applyExternalValue(value: unknown): void {
    this.typing = false;
    this.parseFailed.set(false);
    this.value.set(this.adapter.deserialize(value));
    this.syncText();
  }

  protected override validationDependencies(): unknown {
    return [this.value(), this.min(), this.max(), this.parseFailed(), this.extraValidationDependencies()];
  }

  protected override computeErrors(): ValidationErrors | null {
    if (this.parseFailed()) {
      return { [this.parseErrorKey]: { value: this.text() } };
    }
    return this.validateValue(this.value());
  }

  protected override formatForMessage(value: unknown): string {
    return this.adapter.isValid(value as TDate) ? this.formatDate(value as TDate) : String(value);
  }

  // ----------------------------------------------------------------- text <-> value

  protected formatDate(date: TDate): string {
    return this.adapter.format(date, this.pattern(), this.effectiveLocale());
  }

  protected syncText(): void {
    const value = this.value();
    this.text.set(value != null && this.adapter.isValid(value) ? this.formatDate(value) : '');
  }

  protected commit(date: TDate | null): void {
    if (!this.adapter.isEqual(this.value(), date)) {
      this.value.set(date);
      this.notifyChange(date);
    }
  }

  /** Handles raw text typed by the user. */
  protected onInput(text: string): void {
    this.typing = true;
    this.text.set(text);
    if (text.trim() === '') {
      this.parseFailed.set(false);
      this.commit(null);
      return;
    }
    const parsed = this.adapter.parse(text, this.pattern(), this.effectiveLocale(), this.parseBase());
    this.parseFailed.set(parsed === null);
    this.commit(parsed);
  }

  /** Reformats valid text to the canonical pattern; leaves unparsable text for the user to fix. */
  protected commitText(): void {
    this.typing = false;
    if (!this.parseFailed()) {
      this.syncText();
    }
  }

  protected onBlur(): void {
    this.commitText();
    this.markTouched();
  }

  protected clear(): void {
    if (!this.isInteractive()) {
      return;
    }
    this.typing = false;
    this.parseFailed.set(false);
    this.commit(null);
    this.text.set('');
    this.markTouched();
    this.afterClear();
  }

  /** Hook: runs after the value was cleared. */
  protected afterClear(): void {
    // no-op by default
  }

  /** Sets the value from a non-text source (popup selection, stepping). */
  protected setFromUi(date: TDate | null): void {
    this.typing = false;
    this.parseFailed.set(false);
    this.commit(date);
    this.syncText();
  }

  // ----------------------------------------------------------------- keyboard

  /** Computes the value after `ArrowUp`/`ArrowDown`. Date inputs step by day (Shift: month, Ctrl: year). */
  protected stepValue(direction: 1 | -1, event: KeyboardEvent): TDate {
    const base = this.value() ?? this.adapter.today();
    if (event.ctrlKey || event.metaKey) {
      return this.adapter.addYears(base, direction);
    }
    return event.shiftKey ? this.adapter.addMonths(base, direction) : this.adapter.addDays(base, direction);
  }

  /** Increment for one step of a segment (`hour`, `minute`, `second`...). Time controls override it. */
  protected unitStep(_kind: string): number {
    return 1;
  }

  /** The pattern's fields with their positions in the current text; null while the text is not canonical. */
  private segments(): TextSegment[] | null {
    const value = this.value();
    if (value == null || !this.adapter.isValid(value) || this.formatDate(value) !== this.text()) {
      return null;
    }
    const out: TextSegment[] = [];
    let pos = 0;
    tokenizePattern(this.pattern()).forEach((token, index) => {
      const length =
        token.kind === 'literal' ? token.text.length : this.adapter.format(value, token.text, this.effectiveLocale()).length;
      if (token.kind !== 'literal') {
        out.push({ index, kind: token.kind, start: pos, end: pos + length });
      }
      pos += length;
    });
    return out;
  }

  /** The segment under the caret, only while the input has focus. */
  private activeSegment(): TextSegment | null {
    const el = this.fieldEl()?.nativeElement;
    if (!el || el.ownerDocument.activeElement !== el) {
      return null;
    }
    const segments = this.segments();
    if (!segments?.length) {
      return null;
    }
    const caret = el.selectionStart ?? 0;
    return (
      segments.find((s) => caret >= s.start && caret <= s.end) ??
      [...segments].reverse().find((s) => s.end <= caret) ??
      segments[0]
    );
  }

  /** Moves the value by `seconds`, carrying into the day only when the pattern shows a date. */
  private shiftSeconds(base: TDate, seconds: number): TDate {
    const a = this.adapter;
    const total = a.secondsOfDay(base) + seconds;
    const dayShift = Math.floor(total / 86400);
    const inDay = total - dayShift * 86400;
    const hasDate = tokenizePattern(this.pattern()).some((t) => t.kind === 'year' || t.kind === 'month' || t.kind === 'day');
    return a.withTime(hasDate ? a.addDays(base, dayShift) : base, Math.floor(inDay / 3600), Math.floor((inDay % 3600) / 60), inDay % 60);
  }

  private stepSegment(kind: string, direction: 1 | -1): TDate {
    const a = this.adapter;
    const base = this.value() ?? a.now();
    const n = direction * this.unitStep(kind);
    switch (kind) {
      case 'year':
        return a.addYears(base, n);
      case 'month':
        return a.addMonths(base, n);
      case 'day':
      case 'weekday':
        return a.addDays(base, n);
      case 'hour24':
      case 'hour12':
        return this.shiftSeconds(base, n * 3600);
      case 'minute':
        return this.shiftSeconds(base, n * 60);
      case 'second':
        return this.shiftSeconds(base, n);
      case 'meridiem':
        return this.shiftSeconds(base, direction * 43200);
      default:
        return base;
    }
  }

  /** Steps the segment under the caret (and keeps it selected). Returns false when there is none. */
  private stepActiveSegment(direction: 1 | -1): boolean {
    const segment = this.activeSegment();
    const el = this.fieldEl()?.nativeElement;
    if (!segment || !el) {
      return false;
    }
    this.setFromUi(this.clampToBounds(this.stepSegment(segment.kind, direction)));
    afterNextRender(
      () => {
        const next = this.segments()?.find((s) => s.index === segment.index);
        if (next) {
          el.setSelectionRange(next.start, next.end);
        }
      },
      { injector: this.textInjector },
    );
    return true;
  }

  /**
   * Spinner button handler. Steps the segment under the caret (day, month, year, hour, minute...);
   * with no caret in the input it steps like a plain `ArrowUp` / `ArrowDown`.
   */
  protected spin(direction: 1 | -1): void {
    if (this.isInteractive() && !this.stepActiveSegment(direction)) {
      this.setFromUi(this.clampToBounds(this.stepValue(direction, new KeyboardEvent('keydown'))));
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.isInteractive()) {
      return;
    }
    if (event.key === 'Enter') {
      this.commitText();
      return;
    }
    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !event.altKey) {
      event.preventDefault();
      if (!event.shiftKey && !event.ctrlKey && !event.metaKey && this.stepActiveSegment(event.key === 'ArrowUp' ? 1 : -1)) {
        return;
      }
      const stepped = this.stepValue(event.key === 'ArrowUp' ? 1 : -1, event);
      this.setFromUi(this.clampToBounds(stepped));
    }
  }

  /** Keeps stepped values inside min/max. */
  protected clampToBounds(date: TDate): TDate {
    const min = this.min();
    const max = this.max();
    return this.adapter.clamp(
      date,
      min && this.adapter.isValid(min) ? min : null,
      max && this.adapter.isValid(max) ? max : null,
    );
  }
}
