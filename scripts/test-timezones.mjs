#!/usr/bin/env node
/**
 * Runs the unit-test suite once per time zone, to exercise DST transitions, half-hour offsets and
 * extreme offsets. Usage: `npm run test:tz` (optionally pass zones: `npm run test:tz -- UTC Asia/Tokyo`).
 */
import { spawnSync } from 'node:child_process';

const DEFAULT_ZONES = [
  'UTC',
  'America/New_York', // DST in March/November
  'America/Sao_Paulo', // negative offset, no DST
  'Europe/Madrid', // DST in March/October
  'Asia/Kolkata', // +05:30
  'Pacific/Auckland', // DST in the southern hemisphere
  'Pacific/Kiritimati', // +14:00
  'Pacific/Pago_Pago', // -11:00
];

const zones = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ZONES;
const failures = [];

for (const zone of zones) {
  console.log(`\n=== TZ=${zone} ===`);
  const result = spawnSync('npx', ['ng', 'test', '--watch=false'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, TZ: zone },
  });
  if (result.status !== 0) {
    failures.push(zone);
  }
}

if (failures.length) {
  console.error(`\nTests failed in: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`\nAll ${zones.length} time zones passed.`);
