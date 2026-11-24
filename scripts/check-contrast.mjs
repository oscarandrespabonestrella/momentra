#!/usr/bin/env node
/**
 * Computes WCAG 2.x contrast ratios for the default light and dark palettes
 * (projects/momentra/src/lib/theming/_tokens.scss). Run: `npm run check:contrast`.
 * Text needs >= 4.5:1 (AA); UI components and focus indicators need >= 3:1.
 */
const light = {
  primary: '#3b5bdb', primaryContrast: '#ffffff', primarySoft: '#e7ecff', surface: '#ffffff', surfaceAlt: '#f4f5f8',
  surfaceHover: '#eceef4', text: '#1c2033', textMuted: '#5f6680', border: '#cfd3e1', borderStrong: '#8189a5',
  danger: '#c92a2a', focusRing: '#3b5bdb',
};
const dark = {
  primary: '#7c93ff', primaryContrast: '#0f1226', primarySoft: '#252c58', surface: '#1b1e2e', surfaceAlt: '#242840',
  surfaceHover: '#2d3250', text: '#eceef8', textMuted: '#a6abc6', border: '#3a4064', borderStrong: '#6b74a6',
  danger: '#ff8787', focusRing: '#9db0ff',
};

const channel = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const checks = (t) => [
  ['text on surface', t.text, t.surface, 4.5],
  ['text on hover', t.text, t.surfaceHover, 4.5],
  ['text on surface-alt (read-only)', t.text, t.surfaceAlt, 4.5],
  ['muted text on surface (weekdays, placeholder)', t.textMuted, t.surface, 4.5],
  ['muted text on range fill (adjacent-month days in range)', t.textMuted, t.primarySoft, 4.5],
  ['text on range fill', t.text, t.primarySoft, 4.5],
  ['selected text on primary', t.primaryContrast, t.primary, 4.5],
  ['primary text on surface (Today button, active preset)', t.primary, t.surface, 4.5],
  ['primary text on primary-soft (active preset)', t.primary, t.primarySoft, 4.5],
  ['error text on surface', t.danger, t.surface, 4.5],
  ['input border on surface (non-text)', t.borderStrong, t.surface, 3],
  ['focus ring on surface (non-text)', t.focusRing, t.surface, 3],
  ['today ring (primary) on surface (non-text)', t.primary, t.surface, 3],
];

let failed = 0;
for (const [name, theme] of [['light', light], ['dark', dark]]) {
  console.log(`\n${name} theme`);
  for (const [label, fg, bg, min] of checks(theme)) {
    const r = ratio(fg, bg);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1 (need ${min}:1)  ${label}  ${fg} on ${bg}`);
  }
}
if (failed) {
  console.error(`\n${failed} contrast check(s) failed.`);
  process.exit(1);
}
console.log('\nAll contrast checks passed.');
