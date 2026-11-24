// Concatenates the Markdown docs into projects/docs/public/llms-full.txt (llmstxt.org convention),
// so the docs site serves the whole manual as one plain-text file for LLMs and coding agents.
// ponytail: plain concatenation in a fixed order, no Markdown rewriting; relative links stay as-is.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

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
