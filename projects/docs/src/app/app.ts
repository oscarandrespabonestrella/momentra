import { Component, computed, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ChronoraSettings } from '@chronora/angular';
import { PAGES } from './routes';

const THEME_KEY = 'chronora-docs-theme';

/** Docs shell from the design artifact: top bar, grouped side nav, centred 860px content column. */
@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styles: `
    :host { display:flex; flex-direction:column; min-height:100vh; }
    .skip { position:absolute; left:16px; top:-60px; z-index:20; padding:10px 14px; border-radius:8px; background:var(--doc-primary); color:var(--doc-on-primary); font-weight:600; text-decoration:none; }
    .skip:focus { top:12px; }
    header { position:sticky; top:0; z-index:10; display:flex; align-items:center; gap:12px; min-height:60px; padding:8px 24px; background:var(--doc-surface); border-bottom:1px solid var(--doc-line); }
    .brand { display:flex; align-items:center; gap:10px; color:var(--doc-fg); text-decoration:none; font:700 18px 'Inter Tight',Inter,sans-serif; }
    .spacer { flex:1; }
    .icon { width:40px; height:40px; padding:0; border:1px solid var(--doc-line); border-radius:8px; background:var(--doc-surface); color:var(--doc-fg); display:flex; align-items:center; justify-content:center; cursor:pointer; }
    .icon:hover { background:var(--doc-hover); }
    .pill { font:600 12px Inter,sans-serif; padding:2px 8px; border-radius:999px; background:var(--doc-soft); color:var(--doc-soft-fg); }
    .body { display:flex; flex-wrap:wrap; align-items:flex-start; width:100%; max-width:1440px; margin:0 auto; flex:1; }
    nav { flex:0 0 248px; padding:28px 12px 40px 24px; position:sticky; top:60px; max-height:calc(100vh - 60px); overflow-y:auto; }
    nav h2 { margin:0 0 6px; padding:0 10px; font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--doc-subtle); }
    .group { display:flex; flex-direction:column; gap:2px; margin-bottom:22px; }
    nav a { display:flex; align-items:center; min-height:34px; padding:0 10px; border-radius:6px; text-decoration:none; font-size:14px; color:var(--doc-fg); }
    nav a:hover { background:var(--doc-hover); }
    nav a.active { background:var(--doc-soft); color:var(--doc-soft-fg); font-weight:600; }
    main { flex:999 1 560px; min-width:0; padding:36px clamp(20px,4vw,56px) 72px; outline:none; }
    .content { max-width:860px; margin:0 auto; }
    footer { border-top:1px solid var(--doc-line); background:var(--doc-surface); padding:20px 24px; font-size:13px; color:var(--doc-muted); }
    @media (max-width:959px) { nav { flex-basis:100%; position:static; max-height:none; padding:16px 20px 0; } }
  `,
  template: `
    <!-- <base href="/"> would turn a bare #main into a navigation, so focus it directly. -->
    <a href="#main" class="skip" (click)="$event.preventDefault(); main.focus()">Skip to content</a>
    <header>
      <a class="brand" routerLink="/overview">
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="8" fill="#4C5BD4"></rect><path d="M22.5 11.2A8 8 0 1 0 24 16" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"></path><path d="M16 11v5l3 2" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="24.2" cy="9.8" r="2.2" fill="#F2B544"></circle></svg>
        Chronora <span class="pill">Docs</span>
      </a>
      <span class="spacer"></span>
      <button type="button" class="icon" aria-label="Dark theme" [attr.aria-pressed]="dark()" (click)="toggleTheme()">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="5.75"></circle><path d="M8 2.25v11.5"></path><path d="M8 2.25a5.75 5.75 0 0 1 0 11.5z" fill="currentColor"></path></svg>
      </button>
    </header>
    <div class="body">
      <nav aria-label="Documentation">
        @for (g of groups; track g.title) {
          <div class="group">
            <h2>{{ g.title }}</h2>
            @for (p of g.pages; track p.path) {
              <a [routerLink]="p.path" routerLinkActive="active" ariaCurrentWhenActive="page">{{ p.title }}</a>
            }
          </div>
        }
      </nav>
      <main #main id="main" tabindex="-1"><div class="content"><router-outlet /></div></main>
    </div>
    <footer>Chronora — The Angular Date &amp; Time Toolkit</footer>
  `,
})
export class App {
  private readonly settings = inject(ChronoraSettings);
  protected readonly dark = computed(() => this.settings.theme() === 'dark');

  constructor() {
    const saved = localStorage.getItem(THEME_KEY);
    const dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    // Docs pages and every component without its own `theme` input follow this one signal.
    effect(() => {
      document.documentElement.dataset['theme'] = this.settings.theme();
    });
    this.settings.theme.set(dark ? 'dark' : 'light');
  }

  protected toggleTheme(): void {
    const next = this.dark() ? 'light' : 'dark';
    this.settings.theme.set(next);
    localStorage.setItem(THEME_KEY, next);
  }

  // ponytail: groups derived from PAGES order; pages of one group must stay contiguous in routes.ts.
  readonly groups = PAGES.reduce<{ title: string; pages: typeof PAGES }[]>((acc, p) => {
    const last = acc.at(-1);
    if (last?.title === p.group) last.pages.push(p);
    else acc.push({ title: p.group, pages: [p] });
    return acc;
  }, []);
}
