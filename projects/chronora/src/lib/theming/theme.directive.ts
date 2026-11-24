import { Directive, computed, inject, input } from '@angular/core';
import type { ChronoraTheme } from '../core/config/chronora-config';
import { ChronoraSettings } from '../core/services/chronora-settings';

/**
 * Applies the effective theme (`light`, `dark` or `auto`) to a component host as
 * `data-chr-theme`, which the component stylesheets key off. Every Chronora component uses this as a
 * host directive, so `theme` is available as an input on all of them.
 */
@Directive({
  selector: '[chrTheme]',
  host: { '[attr.data-chr-theme]': 'resolved()' },
})
export class ChrThemeDirective {
  private readonly settings = inject(ChronoraSettings);

  /** Overrides the globally configured theme for this component. */
  readonly theme = input<ChronoraTheme | null | undefined>(undefined);

  /** The theme in effect: the input if set, otherwise the global theme. */
  readonly resolved = computed<ChronoraTheme>(() => this.theme() ?? this.settings.theme());
}
