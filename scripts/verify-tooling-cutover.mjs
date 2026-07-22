#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const consumerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolingRoot = path.resolve(
  process.env.DOCUMENTATION_TOOLING_ROOT ?? path.join(consumerRoot, '..', 'context-action-documentation-tooling'),
);
const args = new Set(process.argv.slice(2));

if (args.has('--help')) {
  console.log('Usage: node scripts/verify-tooling-cutover.mjs [--local-only] [--json]');
  console.log('  --local-only  Run local ownership, parity, and tarball boundary checks only.');
  console.log('  --json        Emit a machine-readable readiness report.');
  process.exit(0);
}

const localOnly = args.has('--local-only');
const json = args.has('--json');
const consumerManifest = JSON.parse(
  readFileSync(path.join(consumerRoot, 'source-of-truth.json'), 'utf8'),
);
const toolingManifestPath = path.join(toolingRoot, 'source-of-truth.json');
const toolingManifest = existsSync(toolingManifestPath)
  ? JSON.parse(readFileSync(toolingManifestPath, 'utf8'))
  : null;
const checks = [];

function summarize(error) {
  const output = [error?.stderr, error?.stdout, error?.message]
    .filter((value) => typeof value === 'string' && value.length > 0)
    .join('\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-4)
    .join(' | ');
  return output.slice(-800) || 'check failed without diagnostic output';
}

function addCheck(id, label, external, run) {
  try {
    const detail = run();
    checks.push({ id, label, scope: external ? 'external' : 'local', status: 'pass', detail: detail ?? 'completed' });
  } catch (error) {
    checks.push({
      id,
      label,
      scope: external ? 'external' : 'local',
      status: external ? 'blocked' : 'fail',
      detail: summarize(error),
    });
  }
}

function skipCheck(id, label, external, detail) {
  checks.push({
    id,
    label,
    scope: external ? 'external' : 'local',
    status: 'skipped',
    detail,
  });
}

function run(command, commandArgs, cwd) {
  execFileSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    env: {
      ...process.env,
      CI: '1',
      FORCE_COLOR: '0',
      npm_config_update_notifier: 'false',
    },
  });
  return 'completed';
}

function normalizeRepositoryUrl(value) {
  return String(value ?? '')
    .replace(/^git\+/u, '')
    .replace(/\.git$/u, '')
    .replace(/\/$/u, '');
}

function checkRemote() {
  const actual = execFileSync('git', ['remote', 'get-url', 'origin'], {
    cwd: toolingRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  const expected = normalizeRepositoryUrl(toolingManifest?.repository?.url);
  if (!expected || normalizeRepositoryUrl(actual) !== expected) {
    throw new Error(`origin is ${actual || 'not configured'}; expected ${expected || 'tooling repository URL'}`);
  }
  return actual;
}

const localToolingChecks = [
  ['tooling-source-of-truth', 'tooling source-of-truth',
    () => run(process.execPath, ['scripts/verify-source-of-truth.mjs'], toolingRoot)],
  ['manifest-parity', 'consumer/tooling manifest and package parity',
    () => run(process.execPath, ['scripts/verify-tooling-parity.mjs'], consumerRoot)],
  ['tooling-consumer', 'consumer Architecture Governance tarball smoke',
    () => run('pnpm', ['verify:tooling-consumer'], consumerRoot)],
  ['canonical-consumer', 'canonical tooling tarball smoke',
    () => run('pnpm', ['verify:consumer'], toolingRoot)],
];
const releaseVersionCheck = () => toolingManifest?.phase === 'published'
  ? 'skipped: published release is now the canonical version'
  : run('pnpm', ['verify:release-versions'], toolingRoot);
const externalChecks = [
  ['tooling-remote', 'tooling Git remote', checkRemote],
  ['published-metadata', 'published package metadata', () => run('pnpm', ['verify:published-metadata'], toolingRoot)],
  ['published-consumer', 'published consumer smoke', () => run('pnpm', ['verify:published-consumer'], toolingRoot)],
  ['published-foundation-consumer', 'Architecture Governance with published Foundation versions',
    () => run('pnpm', ['verify:tooling-consumer:published'], consumerRoot)],
  ['release-versions', 'release version state', releaseVersionCheck],
];

addCheck(
  'consumer-source-of-truth',
  'consumer source-of-truth',
  false,
  () => run(process.execPath, ['scripts/verify-source-of-truth.mjs'], consumerRoot),
);

if (!toolingManifest) {
  for (const [id, label] of localToolingChecks) {
    skipCheck(id, label, false, 'tooling checkout is not available');
  }
} else {
  for (const [id, label, check] of localToolingChecks) {
    addCheck(id, label, false, check);
  }
}

if (localOnly) {
  for (const [id, label] of externalChecks) {
    skipCheck(id, label, true, 'skipped by --local-only');
  }
} else if (!toolingManifest) {
  for (const [id, label] of externalChecks) {
    skipCheck(id, label, true, 'tooling checkout is not available');
  }
} else {
  for (const [id, label, check] of externalChecks) {
    addCheck(id, label, true, check);
  }
}

const localReady = checks.filter(({ scope }) => scope === 'local').every(({ status }) => status === 'pass');
const externalReady = checks.filter(({ scope }) => scope === 'external').every(({ status }) => status === 'pass');
const report = {
  schemaVersion: 'context-action/tooling-cutover-readiness.v1',
  ready: localReady && (localOnly || externalReady),
  localReady,
  externalReady,
  localOnly,
  consumerRoot,
  toolingRoot,
  canonicalPackages: consumerManifest.canonicalPackages?.map(({ name, path: relativePath }) => ({
    name,
    path: relativePath,
  })) ?? [],
  checks,
  blockers: checks
    .filter(({ status }) => status !== 'pass')
    .map(({ id, label, status, detail }) => ({ id, label, status, detail })),
};

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const headline = report.ready ? (localOnly ? 'LOCAL-ONLY READY' : 'READY') : 'BLOCKED';
  console.log(`Tooling cutover readiness: ${headline}`);
  for (const check of checks) {
    console.log(`[${check.status}] ${check.label} (${check.scope}) — ${check.detail}`);
  }
  if (report.blockers.length > 0) {
    console.log(localOnly
      ? 'Next action: run the full report after the tooling remote and published gates are available.'
      : 'Next action: resolve the listed blockers before deleting migration copies.');
  }
}

process.exitCode = report.ready ? 0 : 1;
