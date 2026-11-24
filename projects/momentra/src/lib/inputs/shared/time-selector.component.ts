import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type { MomentraTheme } from '../../core/config/momentra-config';
import { MomentraSettings } from '../../core/services/momentra-settings';
import type { MomentraLocale } from '../../localization/locale';
import {
  applyTimeChoice,
  hourOptions,
  meridiemOptions,
  minuteOptions,
  normalizeStep,
  secondOptions,
  type TimeBounds,
  type TimeColumnConfig,
  type TimeColumnId,
  type TimeOption,
  type TimeParts,
} from '../../core/utils/time-engine';

interface TimeColumn {
  readonly id: TimeColumnId;
  readonly label: string;
  readonly options: readonly TimeOption[];
  /** The option that is in the tab order (roving tabindex). */
  readonly tabValue: number | null;
}

let nextId = 0;

/**
 * Scrollable hour / minute / second / AM-PM lists. Internal building block of the time and
 * date-time pickers; not part of the public API.
 *
 * Each column is a `listbox`: `ArrowUp`/`ArrowDown`/`Home`/`End` move *and* select, `ArrowLeft`/
 * `ArrowRight` move between columns, `Tab` leaves the control.
 */
@Component({
  selector: 'mtr-time-selector',
  templateUrl: './time-selector.component.html',
  styleUrl: './time-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-mtr-theme]': 'theme()', '[class.mtr-disabled]': 'disabled()' },
})
export class MtrTimeSelector<TDate = Date> {
  private readonly settings = inject(MomentraSettings);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly adapter = this.settings.adapter<TDate>();
  protected readonly uid = `mtr-time-${nextId++}`;

  readonly value = input<TDate | null>(null);
  /** Supplies the date part when `value` is empty. Defaults to today. */
  readonly baseDate = input<TDate | null | undefined>(null);
  readonly locale = input.required<MomentraLocale>();
  readonly use12Hours = input(false, { transform: booleanAttribute });
  readonly showSeconds = input(false, { transform: booleanAttribute });
  readonly hourStep = input(1);
  readonly minuteStep = input(1);
  readonly secondStep = input(1);
  /** Earliest selectable time of day (date part ignored). */
  readonly min = input<TDate | null | undefined>(null);
  /** Latest selectable time of day (date part ignored). */
  readonly max = input<TDate | null | undefined>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly theme = input<MomentraTheme | null | undefined>(undefined);

  /** Emits the new date-time when the user picks a value. The date part comes from `value`/`baseDate`. */
  readonly valueChange = output<TDate>();

  protected readonly labels = computed(() => this.locale().labels);

  private readonly parts = computed<TimeParts | null>(() => {
    const v = this.value();
    if (v == null || !this.adapter.isValid(v)) {
      return null;
    }
    return { hours: this.adapter.getHours(v), minutes: this.adapter.getMinutes(v), seconds: this.adapter.getSeconds(v) };
  });

  private readonly bounds = computed<TimeBounds>(() => {
    const min = this.min();
    const max = this.max();
    return {
      min: min && this.adapter.isValid(min) ? this.adapter.secondsOfDay(min) : null,
      max: max && this.adapter.isValid(max) ? this.adapter.secondsOfDay(max) : null,
    };
  });

  private readonly config = computed<TimeColumnConfig>(() => ({
    use12Hours: this.use12Hours(),
    steps: {
      hour: normalizeStep(this.hourStep(), this.use12Hours() ? 12 : 24),
      minute: normalizeStep(this.minuteStep(), 60),
      second: normalizeStep(this.secondStep(), 60),
    },
    bounds: this.bounds(),
    meridiemLabels: this.locale().meridiem,
  }));

  protected readonly columns = computed<readonly TimeColumn[]>(() => {
    const cfg = this.config();
    const current = this.parts();
    const l = this.labels();
    const make = (id: TimeColumnId, label: string, options: TimeOption[]): TimeColumn => ({
      id,
      label,
      options,
      tabValue: (options.find((o) => o.selected) ?? options.find((o) => !o.disabled))?.value ?? null,
    });
    const columns = [
      make('hours', l.hours, hourOptions(cfg, current)),
      make('minutes', l.minutes, minuteOptions(cfg, current)),
    ];
    if (this.showSeconds()) {
      columns.push(make('seconds', l.seconds, secondOptions(cfg, current)));
    }
    if (this.use12Hours()) {
      columns.push(make('meridiem', l.meridiem, meridiemOptions(cfg, current)));
    }
    return columns;
  });

  constructor() {
    // Keep the selected option visible whenever the lists change.
    afterRenderEffect(() => {
      this.columns();
      this.host.querySelectorAll<HTMLElement>('.mtr-time-col').forEach((column) => {
        const selected = column.querySelector<HTMLElement>('.mtr-selected');
        if (selected) {
          const top = selected.offsetTop;
          const bottom = top + selected.offsetHeight;
          if (top < column.scrollTop) {
            column.scrollTop = top;
          } else if (bottom > column.scrollTop + column.clientHeight) {
            column.scrollTop = bottom - column.clientHeight;
          }
        }
      });
    });
  }

  /** Moves focus to the first column's tabbable option. */
  focusFirst(): void {
    this.host.querySelector<HTMLElement>('.mtr-time-opt[tabindex="0"]')?.focus();
  }

  protected optionId(column: TimeColumn, option: TimeOption): string {
    return `${this.uid}-${column.id}-${option.value}`;
  }

  protected choose(column: TimeColumn, option: TimeOption): void {
    if (this.disabled() || this.readonly() || option.disabled) {
      return;
    }
    const next = applyTimeChoice(column.id, option.value, this.parts(), this.bounds());
    const base = this.value() ?? this.baseDate() ?? this.adapter.today();
    this.valueChange.emit(this.adapter.withTime(base, next.hours, next.minutes, next.seconds));
  }

  protected onKeydown(event: KeyboardEvent, column: TimeColumn): void {
    const target = event.target as HTMLElement;
    const enabled = column.options.filter((o) => !o.disabled);
    const focusedValue = Number(target.dataset['value']);
    const index = enabled.findIndex((o) => o.value === focusedValue);
    let next: TimeOption | undefined;
    switch (event.key) {
      case 'ArrowDown':
        next = enabled[Math.min(index + 1, enabled.length - 1)];
        break;
      case 'ArrowUp':
        next = enabled[Math.max(index - 1, 0)];
        break;
      case 'Home':
        next = enabled[0];
        break;
      case 'End':
        next = enabled[enabled.length - 1];
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        event.preventDefault();
        this.focusSibling(column.id, event.key === 'ArrowRight' ? 1 : -1);
        return;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const option = column.options.find((o) => o.value === focusedValue);
        if (option) {
          this.choose(column, option);
        }
        return;
      }
      default:
        return;
    }
    event.preventDefault();
    if (next) {
      this.choose(column, next);
      this.host.querySelector<HTMLElement>(`[data-col="${column.id}"] [data-value="${next.value}"]`)?.focus();
    }
  }

  private focusSibling(id: TimeColumnId, delta: 1 | -1): void {
    const ids = this.columns().map((c) => c.id);
    const target = ids[ids.indexOf(id) + delta];
    if (target) {
      this.host.querySelector<HTMLElement>(`[data-col="${target}"] .mtr-time-opt[tabindex="0"]`)?.focus();
    }
  }
}
