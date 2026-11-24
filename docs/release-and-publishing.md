# Release and publishing

The published artifact is the output of `npm run build` in `dist/momentra`: an Angular Package Format package named **`@momentra/angular`** with three entry points.

| Import | Entry |
| --- | --- |
| `@momentra/angular` | primary |
| `@momentra/angular/date-fns` | optional (needs `date-fns@^4`) |
| `@momentra/angular/luxon` | optional (needs `luxon@^3`) |

The build uses `@angular/build:library` in `partial` compilation mode (the default for the production configuration), so consumers' Angular compiler links the components. Secondary entry points are declared in `projects/momentra/package.json` → `exports`. After the build, `scripts/build-llms.mjs --copy` adds `LICENSE`, `llms.txt` and `llms-full.txt` to the package, so coding agents in consumer projects find the docs in `node_modules/@momentra/angular/`.

## Package metadata checklist

`projects/momentra/package.json` is the source of the published manifest:

- `name: @momentra/angular`, `version`, `description`, `keywords`, `license: MIT`, `repository`, `bugs`, `homepage` (the [docs site](https://oscarandrespabonestrella.github.io/momentra/)), `publishConfig.access: public`.
- `peerDependencies`: `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/cdk` (all `^22.3.0`); `date-fns` and `luxon` with `peerDependenciesMeta.optional: true`.
- `dependencies`: only `tslib`.
- `sideEffects: false`.

`npm run pack:lib` builds and writes the tarball to `dist/`. `npm pack ./dist/momentra --dry-run` should list only `package.json`, `README.md`, `LICENSE`, `llms.txt`, `llms-full.txt`, `fesm2022/` and `types/` (14 files, ≈170 kB packed for 0.1.0-alpha.0). There must be no `src`, spec files or `examples`.

## Releasing (GitHub Actions, trusted publishing)

Releases run from the **Release** workflow (`.github/workflows/release.yml`). It publishes with npm [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) and provenance, so no npm token is stored in the repository. Versions with a pre-release suffix (`-alpha.1`, `-rc.0`) go to the `next` dist-tag; the rest go to `latest`.

1. **Bump the version** in `projects/momentra/package.json` (semver: breaking public API → major; features → minor; fixes → patch; while `0.x`, breaking changes bump the minor).
2. **Update `CHANGELOG.md`**: move *Unreleased* entries under the new version and date.
3. **Merge to `main`**, then tag that commit: `git tag vX.Y.Z && git push origin vX.Y.Z`.
4. **Run the workflow from the tag**: `gh workflow run release.yml --ref vX.Y.Z`. It refuses to publish if the tag does not match the package version, then runs `npm run check`, `test:tz` and `check:contrast` before `npm publish`.
5. **Create the GitHub release** from the tag with the changelog entry, and smoke test: `npm i @momentra/angular@<version>` in a fresh app (what `npm run verify:package` does with the local tarball).

Before a release that changes public API, packaging or styles, also run `npm run verify:package` locally (pack → fresh Angular app → install → build).

## First publish (one time)

Trusted publishing is configured in the package's settings on npmjs.com, so the package has to exist first. The first version is published by hand:

1. On npmjs.com, create the free organization **momentra** (avatar → **Add an Organization**, public packages only). The GitHub repository stays under your personal account; npm organizations are independent of GitHub.
2. `npm login` (with 2FA) as a member of the `momentra` organization.
3. Build and publish from the build output — never from the workspace root, which is `private`:
   ```bash
   npm ci
   npm run check
   cd dist/momentra
   npm publish --access public --tag next
   ```
4. On npmjs.com → **@momentra/angular** → **Settings** → **Trusted publishing**, add GitHub Actions with organization/user `oscarandrespabonestrella` (your personal GitHub account), repository `momentra`, workflow `release.yml`, and allow **npm publish** (configurations created after 3 Sep 2026 only allow `npm stage publish` unless you tick it).
5. A new trusted publisher configuration expires if it is not used for a successful publish within **2 days**. Add it right before the next release, or delete and recreate it if it expired.
6. Optionally, in **Settings** → **Publishing access**, require 2FA and disallow tokens, so only the workflow can publish.

## Compatibility policy

- Momentra `0.x` supports Angular `^22.3.0`. When a new Angular major ships, widen the peer range only after running the test suite and `verify:package` against it.
- Public API = everything exported from `public-api.ts` of each entry point, the `mtr-*` selectors, their inputs/outputs, the `--mtr-*` CSS custom properties and the error keys (`mtr*`). Internal class names in styles and DOM structure are not public.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and every pull request: `npm run check` (tests, examples, library build), `test:tz`, `check:contrast`, packs the library (uploaded as the `momentra-package` artifact) and builds the docs app.

`.github/workflows/docs.yml` deploys the docs app to GitHub Pages on every push to `main`: <https://oscarandrespabonestrella.github.io/momentra/>. The published package is <https://www.npmjs.com/package/@momentra/angular>.
