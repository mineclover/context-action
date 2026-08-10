#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

function option(name) {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (index !== -1 && (!value || value.startsWith('--'))) throw new Error(`${name} requires a value`);
  return value;
}

function parsePatchVersion(value, label) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/u.exec(value ?? '');
  if (!match) throw new Error(`${label} must be a non-prerelease semantic version`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), value };
}

const packageName = option('--package');
const next = parsePatchVersion(option('--version'), '--version');
const allowInitial = process.argv.includes('--allow-initial');
if (!/^@context-action\/[a-z0-9-]+$/u.test(packageName ?? '')) {
  throw new Error('--package must be a Context-Action package name');
}

let latest;
try {
  latest = parsePatchVersion(
    execFileSync('npm', ['view', packageName, 'dist-tags.latest', '--registry=https://registry.npmjs.org'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, npm_config_loglevel: 'error' },
    }).trim(),
    'npm latest version',
  );
} catch (error) {
  if (!allowInitial || next.value !== '0.1.0') throw error;
  console.log(JSON.stringify({ status: 'ok', package: packageName, latest: null, next: next.value, initial: true }));
  process.exit(0);
}

if (next.major !== latest.major || next.minor !== latest.minor || next.patch <= latest.patch) {
  throw new Error(
    `Maintenance patch must stay within ${latest.major}.${latest.minor}.x and increase ${latest.value}; received ${next.value}`,
  );
}

console.log(JSON.stringify({ status: 'ok', package: packageName, latest: latest.value, next: next.value }));
