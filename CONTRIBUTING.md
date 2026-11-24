# Contributing to Chronora

Thanks for helping. This guide covers the workflow and the rules the codebase follows.

## Setup

```bash
git clone <repository-url> chronora
cd chronora
npm install
npm test
```

Requirements: a Node.js version supported by Angular 22 (`^22.22.3`, `^24.15.0` or `>=26`; developed on 24) and npm. The workspace uses Angular 22 and TypeScript in strict mode.

## Commands

| Command | Purpose |
| --- | --- |
| `npm test` | Unit tests once (Vitest + jsdom, through `ng test`) |
| `npm run test:watch` | Watch mode |
| `npm run test:tz` | Tests in eight time zones — run it when touching date logic |
| `npm run examples:check` | Compile `examples/` with the Angular compiler (strict templates) |
| `npm run check:contrast` | WCAG contrast check of the default palette |
| `npm run build` | Production library build to `dist/chronora` |
| `npm run verify:package` | Build, `npm pack`, install into a fresh Angular app, build it |
| `npm run check` | Tests + examples + build |

Before opening a pull request, `npm run check` must pass; for changes to public API, packaging or styles also run `npm run verify:package`.

## Engineering rules

1. **TypeScript strict, no `any`.** Use `unknown` and narrow.
2. **Date logic lives in the core.** Components never call `Date` methods; they use the injected `DateAdapter`. Do not duplicate logic between components — add it to `core/` (adapter, `calendar-engine`, `time-engine`, `range-utils`, `validation`) and test it there.
3. **Core is framework-free.** Files under `core/utils`, `core/validators/validation.ts` and `formatting/` must not import Angular. Avoid circular dependencies; types flow downward (see [Architecture](docs/architecture.md)).
4. **Angular style:** standalone components, `ChangeDetectionStrategy.OnPush`, `input()`/`model()`/`output()`, signals and `computed()`, `inject()`. Angular 22 makes OnPush the default for test hosts too — drive test hosts with signals.
5. **Forms behaviour is implemented once**, in `ChronoraFormControl` / `ChronoraTextControl` / `ChronoraPopupControl`. Do not add per-component CVA logic.
6. **Accessibility is part of the feature.** New interactive UI needs semantic markup, keyboard support, focus handling and tests (the axe suite in `testing/a11y.spec.ts`). Do not rely on colour alone.
7. **No hard-coded UI strings.** Add a field to `ChronoraLabels` (and to the English and Spanish sets) instead.
8. **Styling uses the tokens** in `theming/_tokens.scss`; add new public properties to `docs/styling-and-themes.md`.
9. **Tests go with the change.** Date logic: unit tests incl. edge cases (month ends, leap years, DST). Components: rendering, interaction, keyboard, forms. Adapters: extend `describeAdapterContract`.
10. **Document what exists.** Do not document features that are not implemented; list gaps under *Known limitations*.
11. **Public API.** Everything exported from `projects/chronora/src/public-api.ts` is public and semver-governed. Internal building blocks (`ChrFieldShell`, `ChrTimeSelector`, engines' internals) stay unexported.
12. **Dependencies.** The primary package depends only on Angular, the CDK and `tslib`. Do not add runtime dependencies; optional integrations go in their own entry point.

## Project layout

See the layout in the [README](README.md#development) and [Architecture](docs/architecture.md).

## Adding a component

1. Decide what core logic it needs and put that in `core/` first, with tests.
2. Extend `ChronoraFormControl` (or `ChronoraTextControl`/`ChronoraPopupControl`) if it edits a value; register with `provideChronoraControl(() => YourComponent)`; add `ChrThemeDirective` as a host directive.
3. Include the SCSS tokens (`@include chr.theme;`) in its stylesheet; popups need `@include field.popup;`.
4. Export it from `public-api.ts`, document its inputs in `docs/components.md`, add an example under `examples/` if it introduces a new usage pattern.
5. Add component, forms and accessibility tests.

## Commit and PR conventions

Use clear imperative commit subjects (`Fix range preview when hovering before start`). One logical change per PR; describe the behaviour change and how it was tested. Update `CHANGELOG.md` under *Unreleased*.

## Reporting issues

Include: Angular and Chronora versions, the adapter in use, the time zone and locale, a minimal reproduction, and expected vs actual behaviour. Date bugs are very often zone- or DST-dependent — please state the time zone.
