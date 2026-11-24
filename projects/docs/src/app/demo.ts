import { Component, input, signal } from '@angular/core';

/** Example block from the design: live demo on a panel, options/output bar, then a dark code figure. */
@Component({
  selector: 'doc-demo',
  styles: `
    :host { display:flex; flex-direction:column; gap:12px; margin:12px 0 32px; }
    .box { border:1px solid var(--doc-line); border-radius:12px; overflow:hidden; }
    .live { padding:28px 24px; background:var(--doc-panel); display:flex; flex-wrap:wrap; gap:24px; align-items:flex-start; }
    .opts, .out { padding:10px 16px; border-top:1px solid var(--doc-line); background:var(--doc-surface); font-size:13px; color:var(--doc-muted); }
    .opts { display:flex; flex-wrap:wrap; gap:8px 0; align-items:center; }
    .out { font-family:var(--doc-mono); color:var(--doc-fg); }
    .opts:empty, .out:empty { display:none; }
    figure { margin:0; border-radius:10px; overflow:hidden; background:var(--doc-code); border:1px solid var(--doc-line); }
    figcaption { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:6px 6px 6px 14px; border-bottom:1px solid rgba(255,255,255,.08); font:12px var(--doc-mono); color:var(--doc-code-muted); }
    button { display:flex; align-items:center; gap:6px; height:30px; padding:0 10px; border:1px solid rgba(255,255,255,.14); border-radius:6px; background:transparent; color:var(--doc-code-fg); font:500 12px Inter,sans-serif; cursor:pointer; }
    button:hover { background:rgba(255,255,255,.06); }
    pre { margin:0; border-radius:0; }
  `,
  template: `
    <div class="box">
      <div class="live"><ng-content /></div>
      <div class="opts"><ng-content select="[options]" /></div>
      <div class="out" aria-live="polite"><ng-content select="[output]" /></div>
    </div>
    <figure>
      <figcaption>
        Example code
        <button type="button" aria-label="Copy example code" (click)="copy()">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"></rect><path d="M10.5 3.5v-.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5"></path></svg>
          {{ copied() ? 'Copied' : 'Copy' }}
        </button>
      </figcaption>
      <pre tabindex="0" aria-label="Example code"><code>{{ code() }}</code></pre>
    </figure>
  `,
})
export class Demo {
  readonly code = input.required<string>();
  protected readonly copied = signal(false);

  protected copy(): void {
    navigator.clipboard?.writeText(this.code()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    });
  }
}
