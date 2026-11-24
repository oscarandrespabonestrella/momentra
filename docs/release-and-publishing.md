# Release and publishing

The published artifact is the output of `ng build` in `dist/chronora`: an Angular Package Format package named **`@chronora/angular`** with three entry points.

| Import | Entry |
| --- | --- |
| `@chronora/angular` | primary |
| `@chronora/angular/date-fns` | optional (needs `date-fns@^4`) |
| `@chronora/angular/luxon` | optional (needs `luxon@^3`) |

The build uses `@angular/build:library` in `partial` compilation mode (the default for the production configuration), so consumers' Angular compiler links the components. Secondary entry points are declared in `projects/chronora/package.json` → `exports`.

## Package metadata checklist

`projects/chronora/package.json` is the source of the published manifest:

- `name: @chronora/angular`, `version`, `description`, `keywords`, `license: MIT`, `repository`.
- `peerDependencies`: `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/cdk` (all `^22.3.0`); `date-fns` and `luxon` with `peerDependenciesMeta.optional: true`.
- `dependencies`: only `tslib`.
- `sideEffects: false`.
- `LICENSE` and `README.md` are copied into the package.

Before the first publish replace the placeholder `repository.url` with the real repository URL, and create the `@chronora` npm scope/organisation (or choose another scope and rename everywhere — `grep -r "@chronora/angular"`).

## Release procedure

1. **Update the version** in `projects/chronora/package.json` (semver: breaking public API → major; features → minor; fixes → patch; while `0.x`, breaking changes bump the minor).
2. **Update `CHANGELOG.md`**: move *Unreleased* entries under the new version and date.
3. **Verify everything:**
   ```bash
   npm ci
   npm run check          # tests, examples, build
   npm run test:tz        # time zones
   npm run check:contrast
   npm run verify:package # pack → fresh Angular app → install → build
   ```
4. **Inspect the tarball** — `npm pack ./dist/chronora --dry-run` should list only `package.json`, `README.md`, `LICENSE`, `fesm2022/` and `types/` (12 files, ≈120 kB packed for 0.1.0). There must be no `src`, spec files, or `examples`.
5. **Publish** from the build output (never from the workspace root, which is `private`):
   ```bash
   cd dist/chronora
   npm publish --access public            # add --tag next for pre-releases
   ```
   Enable npm provenance (`--provenance`) when publishing from CI.
6. **Tag and push:** `git tag v0.1.0 && git push --tags`; create release notes from the changelog.
7. **Smoke test the published package** by installing it into a fresh app (`npm i @chronora/angular@<version>`), as `verify:package` does with the tarball.

## Compatibility policy

- Chronora `0.x` supports Angular `^22.3.0`. When a new Angular major ships, widen the peer range only after running the test suite and `verify:package` against it.
- Public API = everything exported from `public-api.ts` of each entry point, the `chr-*` selectors, their inputs/outputs, the `--chr-*` CSS custom properties and the error keys (`chr*`). Internal class names in styles and DOM structure are not public.

## Suggested CI

Run on every push/PR: `npm ci && npm run check && npm run test:tz && npm run check:contrast`. Run `npm run verify:package` on release branches. Publish from a tag build with provenance.

## Status of this repository

At the time of writing nothing has been published to npm, no git history exists in this workspace, and no CI configuration is included. The steps above are the intended process, not a record of a past release.
