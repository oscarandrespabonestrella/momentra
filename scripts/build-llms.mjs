// Concatenates the Markdown docs into projects/docs/public/llms-full.txt (llmstxt.org convention),
// so the docs site serves the whole manual as one plain-text file for LLMs and coding agents.
//   node scripts/build-llms.mjs          write llms-full.txt for the docs site
//   node scripts/build-llms.mjs --copy   also ship llms.txt, llms-full.txt and LICENSE in dist/momentra
// ponytail: plain concatenation in a fixed order, no Markdown rewriting; relative links stay as-is.
import { copyFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const files = [
  'README.md',
  'docs/components.md',
  'docs/styling-and-themes.md',
  'docs/localization.md',
  'docs/dates-and-time-zones.md',
  'docs/date-adapters.md',
  'docs/validation.md',
  'docs/accessibility.md',
  'docs/architecture.md',
];
const out = 'projects/docs/public/llms-full.txt';

const body = files.map((f) => `<!-- source: ${f} -->\n\n${readFileSync(f, 'utf8').trim()}\n`).join('\n\n---\n\n');
mkdirSync('projects/docs/public', { recursive: true });
writeFileSync(out, body);
console.log(`wrote ${out} (${files.length} files, ${body.length} chars)`);

if (process.argv.includes('--copy')) {
  // After `ng build`: consumers' agents find the docs in node_modules/@momentra/angular/.
  const dist = 'dist/momentra';
  if (!existsSync(dist)) {
    console.error(`${dist} not found: build the library first.`);
    process.exit(1);
  }
  copyFileSync('projects/docs/public/llms.txt', `${dist}/llms.txt`);
  writeFileSync(`${dist}/llms-full.txt`, body);
  copyFileSync('LICENSE', `${dist}/LICENSE`); // MIT requires shipping the license
  console.log(`copied llms.txt, llms-full.txt and LICENSE into ${dist}`);
}
