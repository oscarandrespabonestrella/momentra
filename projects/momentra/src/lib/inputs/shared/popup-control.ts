import { Directive, booleanAttribute, input, model, output, viewChild } from '@angular/core';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { MomentraTextControl } from './text-control';
import { MtrFieldShell } from './field-shell.component';

/** Preferred popup positions: below the field, flipping above or aligning to the end edge when space is short. */
export const POPUP_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
];

/**
 * Adds an overlay popup to a text control: open/close state, outside-click and Escape handling,
 * and `Alt+ArrowDown` to open. The host template must contain one `<mtr-field>` (the anchor) and
 * render its popup with `cdkConnectedOverlay`.
 */
@Directive()
export abstract class MomentraPopupControl<TDate> extends MomentraTextControl<TDate> {
  /** Whether the popup is open (two-way bindable: `[(open)]`). */
  readonly open = model(false);
  /** Closes the popup right after a selection. Defaults to the global setting. */
  readonly closeOnSelect = input<boolean | null | undefined, unknown>(undefined, {
    transform: (v) => (v == null ? undefined : booleanAttribute(v)),
  });

  /** Emits when the popup opens. */
  readonly opened = output<void>();
  /** Emits when the popup closes. */
  readonly closed = output<void>();

  protected readonly shell = viewChild.required(MtrFieldShell);
  protected readonly popupId = `${this.uid}-popup`;
  protected readonly positions = POPUP_POSITIONS;

  protected get shouldCloseOnSelect(): boolean {
    return this.closeOnSelect() ?? this.settings.config.closeOnSelect;
  }

  openPopup(): void {
    if (!this.isInteractive() || this.open()) {
      return;
    }
    this.commitText();
    this.open.set(true);
    this.opened.emit();
  }

  /** Closes the popup. `restoreFocus` returns focus to the input (use for Escape and selections). */
  closePopup(restoreFocus = false): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.syncText();
    this.markTouched();
    this.closed.emit();
    if (restoreFocus) {
      this.focusInput();
    }
  }

  /** Moves focus to the text input. */
  focusInput(): void {
    this.shell().element.querySelector('input')?.focus();
  }

  protected togglePopup(): void {
    if (this.open()) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  /** Called by the overlay when it detaches for any reason (e.g. scrolled away). */
  protected onDetach(): void {
    this.closePopup();
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!this.shell().element.contains(event.target as Node)) {
      this.closePopup();
    }
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closePopup(true);
    }
  }

  protected override onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      event.stopPropagation();
      this.closePopup(true);
      return;
    }
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.openPopup();
      return;
    }
    super.onKeydown(event);
  }

  /** Blur of the input: only counts as "touched" when the popup is not taking over focus. */
  protected override onBlur(): void {
    this.commitText();
    if (!this.open()) {
      this.markTouched();
    }
  }

  protected override afterClear(): void {
    this.closePopup();
    this.focusInput();
  }
}
