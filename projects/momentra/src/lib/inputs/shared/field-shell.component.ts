import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, inject, input, output } from '@angular/core';
import type { MomentraTheme } from '../../core/config/momentra-config';

/**
 * The bordered box around a Momentra text input: focus ring, invalid/disabled states and the
 * optional clear and popup-toggle buttons. The `<input>` itself is projected by the host component.
 * Internal building block; not part of the public API.
 */
@Component({
  selector: 'mtr-field',
  template: `
    <div
      class="mtr-box"
      [class.mtr-invalid]="invalid()"
      [class.mtr-disabled]="disabled()"
      [class.mtr-readonly]="readonly()"
    >
      <ng-content />
      @if (showClear()) {
        <button
          type="button"
          class="mtr-icon-btn mtr-clear"
          [attr.aria-label]="clearLabel()"
          [attr.aria-controls]="inputId()"
          (click)="clear.emit()"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 4 8 8M12 4l-8 8" /></svg>
        </button>
      }
      @if (toggleIcon(); as icon) {
        <button
          type="button"
          class="mtr-icon-btn mtr-toggle"
          [attr.aria-label]="toggleLabel()"
          aria-haspopup="dialog"
          [attr.aria-expanded]="expanded()"
          [attr.aria-controls]="expanded() ? popupId() : null"
          [disabled]="disabled() || readonly()"
          (click)="toggle.emit()"
        >
          @if (icon === 'calendar') {
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <rect x="2" y="3" width="12" height="11" rx="2" />
              <path d="M2 6.5h12M5 1.75v2.5M11 1.75v2.5" />
            </svg>
          } @else {
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 4.5V8l2.5 1.5" />
            </svg>
          }
        </button>
      }
    </div>
  `,
  styleUrl: './field-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-mtr-theme]': 'theme()' },
})
export class MtrFieldShell {
  /** The element the popup anchors to. */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  readonly theme = input<MomentraTheme | null | undefined>(undefined);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly showClear = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly inputId = input<string | null>(null);
  readonly toggleIcon = input<'calendar' | 'clock' | null>(null);
  readonly toggleLabel = input('Open');
  readonly expanded = input(false, { transform: booleanAttribute });
  readonly popupId = input<string | null>(null);

  readonly clear = output<void>();
  readonly toggle = output<void>();
}
