#!/usr/bin/env node
/**
 * Verifies the publishable package the way a consumer would use it:
 *
 *  1. builds the library (`ng build`),
 *  2. runs `npm pack` on the build output,
 *  3. creates a fresh Angular application in a temporary directory,
 *  4. installs the generated tarball (plus the optional peer dependencies) into it,
 *  5. compiles an app that uses every public component and both optional adapters.
 *
 * Usage: `npm run verify:package` (add `-- --keep` to keep the temporary app for inspection).
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const keep = process.argv.includes('--keep');

function run(command, args, cwd) {
  console.log(`\n$ ${command} ${args.join(' ')}   (in ${cwd})`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

const work = mkdtempSync(join(tmpdir(), 'momentra-verify-'));
try {
  // 1. build
  run('npx', ['ng', 'build', 'momentra'], root);
  const dist = join(root, 'dist', 'momentra');

  // 2. pack
  const packDir = join(work, 'pack');
  mkdirSync(packDir);
  run('npm', ['pack', dist, '--pack-destination', packDir], root);
  const tarball = readdirSync(packDir).find((f) => f.endsWith('.tgz'));
  if (!tarball) {
    throw new Error('npm pack did not produce a tarball');
  }

  // 3. fresh consumer app
  const ngVersion = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).dependencies['@angular/core'];
  run(
    'npx',
    [
      `@angular/cli@${ngVersion.replace(/^[\^~]/, '')}`,
      'new',
      'consumer',
      '--defaults',
      '--skip-git',
      '--style=scss',
      '--ai-config=none',
      '--package-manager=npm',
      '--skip-install',
    ],
    work,
  );
  const app = join(work, 'consumer');

  // 4. install the tarball and the optional peers
  run('npm', ['install', '--no-audit', '--no-fund', `"${join(packDir, tarball)}"`, '@angular/cdk@' + ngVersion, 'date-fns@4', 'luxon@3', '@types/luxon'], app);

  // 5. compile an app that uses the whole public surface
  cpSync(join(root, 'scripts', 'consumer-template', 'app.ts'), join(app, 'src', 'app', 'app.ts'));
  cpSync(join(root, 'scripts', 'consumer-template', 'app.config.ts'), join(app, 'src', 'app', 'app.config.ts'));
  for (const stale of ['app.html', 'app.scss', 'app.css', 'app.spec.ts']) {
    rmSync(join(app, 'src', 'app', stale), { force: true });
  }
  run('npx', ['ng', 'build'], app);

  const installed = join(app, 'node_modules', '@momentra', 'angular');
  if (!existsSync(join(installed, 'package.json'))) {
    throw new Error('momentra was not installed');
  }
  const manifest = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'));
  console.log(`\nVerified @momentra/angular@${manifest.version}: installs, type-checks and builds in a fresh Angular app.`);
  writeFileSync(join(work, 'RESULT.txt'), 'ok');
} finally {
  if (keep) {
    console.log(`\nTemporary app kept at ${work}`);
  } else {
    rmSync(work, { recursive: true, force: true });
  }
}
