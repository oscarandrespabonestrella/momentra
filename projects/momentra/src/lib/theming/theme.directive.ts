import { Directive, computed, inject, input } from '@angular/core';
import type { MomentraTheme } from '../core/config/momentra-config';
import { MomentraSettings } from '../core/services/momentra-settings';

/**
 * Applies the effective theme (`light`, `dark` or `auto`) to a component host as
 * `data-mtr-theme`, which the component stylesheets key off. Every Momentra component uses this as a
 * host directive, so `theme` is available as an input on all of them.
 */
@Directive({
  selector: '[mtrTheme]',
  host: { '[attr.data-mtr-theme]': 'resolved()' },
})
export class MtrThemeDirective {
  private readonly settings = inject(MomentraSettings);

  /** Overrides the globally configured theme for this component. */
  readonly theme = input<MomentraTheme | null | undefined>(undefined);

  /** The theme in effect: the input if set, otherwise the global theme. */
  readonly resolved = computed<MomentraTheme>(() => this.theme() ?? this.settings.theme());
}
