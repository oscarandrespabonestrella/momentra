# AGENTS.md

Guidance for AI coding agents (Codex, Copilot, Cursor, Gemini, Claude Code, …) working in this repository. Humans: see [CONTRIBUTING.md](CONTRIBUTING.md), which this file summarises.

## What this is

Chronora (`@chronora/angular`) — an Angular 22 date and time component library. Angular CLI workspace with two projects:

- `projects/chronora` — the library (primary entry plus `date-fns/` and `luxon/` secondary entry points).
- `projects/docs` — the documentation app (live demos per component). Static files in `projects/docs/public` are served at the site root (`llms.txt`, generated `llms-full.txt`).

Markdown docs live in `docs/`; compiled examples in `examples/`.

## Commands

| Command | When |
| --- | --- |
| `npm test` | Unit tests (Vitest + jsdom via `ng test`). Run after any change. |
| `npm run test:tz` | Tests in eight time zones. Run when touching date logic. |
| `npm run examples:check` | Strict-template compile of `examples/`. |
| `npm run check` | Tests + examples + library build. Must pass before a PR. |
| `npm run verify:package` | Pack and install into a fresh app. For public API, packaging or style changes. |
| `npm run docs:serve` | Docs app on a dev server. |
| `npm run llms` | Regenerate `projects/docs/public/llms-full.txt` from the Markdown docs. |

## Rules

1. TypeScript strict, no `any` — use `unknown` and narrow.
2. Components never call `Date` methods; all date logic goes through the injected `DateAdapter` and lives in `core/` with tests.
3. `core/utils`, `core/validators/validation.ts` and `formatting/` are framework-free: no Angular imports.
4. Angular style: standalone, `OnPush`, `input()` / `model()` / `output()`, signals, `computed()`, `inject()`.
5. Forms behaviour lives only in `ChronoraFormControl` / `ChronoraTextControl` / `ChronoraPopupControl`. No per-component CVA code.
6. Accessibility is part of every feature: semantic markup, keyboard, focus, and an axe test in `testing/a11y.spec.ts`.
7. No hard-coded UI strings — add a field to `ChronoraLabels` (English and Spanish sets).
8. Styles use the tokens in `theming/_tokens.scss`. A new public `--chr-*` property must be documented in `docs/styling-and-themes.md` **and** the docs page `projects/docs/src/app/pages/css-variables.ts`.
9. Everything exported from `projects/chronora/src/public-api.ts` is semver-governed public API.
10. No new runtime dependencies (only Angular, CDK, `tslib`).
11. Document only what exists; update `CHANGELOG.md` under *Unreleased*.
12. Commits: imperative subjects, one logical change per PR.

## Docs app conventions

- One page per file in `projects/docs/src/app/pages/`, registered in `routes.ts` (pages of a nav group must be contiguous).
- Live examples use `<doc-demo [code]="...">`; API tables use `<doc-api [rows]="...">`.
- Docs colours use `--doc-*` variables from `projects/docs/src/styles.css`; components follow `ChronoraSettings.theme`.

## Using the library (for agents writing app code)

Read [`projects/docs/public/llms.txt`](projects/docs/public/llms.txt) for the short version, or `llms-full.txt` (served by the docs site, built with `npm run llms`) for everything.
