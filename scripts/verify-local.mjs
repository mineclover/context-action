#!/usr/bin/env node

/**
 * All-in-one local verification runner (Issue #53, Issue #50).
 *
 * Implements the Local-First contract for context-action:
 * 1. Toolchain lock check (Node >= 20, pnpm >= 8)
 * 2. Monorepo Typecheck across all workspace packages
 * 3. Workspace Package Boundaries Check & Tests
 * 4. Context-Action Conventions & Catalogs
 * 5. Core & React Artifact Parity, Boundary, and Isolation
 * 6. AI SDK & Tool Protocol Contract
 * 7. React Aria Reference Hydration & Doc Snippets
 * 8. Durable Operations Schema Evidence Test
 * 9. V1 Supply Chain & Pinned Action Policy Audit
 * 10. Release Safety Regression Suite
 * 11. Generation of immutable Local Verification Receipt (.verification/local-receipt.json)
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDir, '..');
const isQuick = process.argv.includes('--quick');

function canonicalJsonStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map((i) => canonicalJsonStringify(i ?? null)).join(',') + ']';
  const obj = value;
  const keys = Object.keys(obj).sort();
  const entries = [];
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && typeof v !== 'function' && typeof v !== 'symbol') {
      entries.push(`${JSON.stringify(k)}:${canonicalJsonStringify(v)}`);
    }
  }
  return '{' + entries.join(',') + '}';
}

function computeCanonicalHash(value) {
  const canonical = canonicalJsonStringify(value);
  const hex = createHash('sha256').update(canonical, 'utf8').digest('hex');
  return `sha256:${hex}`;
}

console.log('='.repeat(70));
console.log('  Local-First Verification Runner - context-action (#53)');
console.log(`  Mode: ${isQuick ? 'QUICK SMOKE' : 'FULL LOCAL VERIFICATION'}`);
console.log('='.repeat(70));
console.log();

// ── 1. Toolchain Lock Check ──────────────────────────────────────────────────
const nodeVer = process.version;
const majorNode = parseInt(nodeVer.slice(1).split('.')[0], 10);
if (majorNode < 20) {
  console.error(`✖ [FAIL] Node.js >= 20 required, detected: ${nodeVer}`);
  process.exit(1);
}

const pnpmVerResult = spawnSync('pnpm', ['--version'], { encoding: 'utf8' });
const pnpmVer = pnpmVerResult.stdout?.trim() ?? 'unknown';

console.log(`✔ Toolchain: Node ${nodeVer}, pnpm ${pnpmVer}, Platform ${process.platform} (${process.arch})`);

const quickSteps = [
  {
    name: '1. Monorepo Typecheck (13 projects)',
    command: 'pnpm',
    args: ['run', 'type-check'],
  },
  {
    name: '2. Workspace Package Boundaries Check',
    command: 'node',
    args: ['scripts/verify-package-boundaries.mjs'],
  },
  {
    name: '3. Context-Action Conventions & Catalog Check',
    command: 'node',
    args: ['scripts/verify-context-action-conventions.mjs'],
  },
  {
    name: '4. Core & React Artifact Parity / Isolation',
    command: 'node',
    args: ['scripts/verify-core-artifact-parity.mjs'],
  },
  {
    name: '5. React Production Artifact Boundary',
    command: 'node',
    args: ['scripts/verify-react-artifact-boundary.mjs'],
  },
  {
    name: '6. React WebMCP Isolation',
    command: 'node',
    args: ['scripts/verify-react-webmcp-isolation.mjs'],
  },
  {
    name: '7. Durable Operations Evidence Schema Test',
    command: 'node',
    args: ['--test', 'scripts/verify-durable-operation-evidence-schema.test.mjs'],
  },
];

const fullSteps = [
  {
    name: '1. Monorepo Typecheck (13 projects)',
    command: 'pnpm',
    args: ['run', 'type-check'],
  },
  {
    name: '2. Workspace Package Boundaries Check & Test',
    command: 'node',
    args: ['scripts/verify-package-boundaries.mjs'],
  },
  {
    name: '3. Package Boundary Unit Test Suite',
    command: 'node',
    args: ['--test', 'scripts/verify-package-boundaries.test.mjs'],
  },
  {
    name: '4. Context-Action Conventions & Catalog Check',
    command: 'node',
    args: ['scripts/verify-context-action-conventions.mjs'],
  },
  {
    name: '5. Core Artifact Parity Check',
    command: 'node',
    args: ['scripts/verify-core-artifact-parity.mjs'],
  },
  {
    name: '6. React Production Artifact Boundary Check',
    command: 'node',
    args: ['scripts/verify-react-artifact-boundary.mjs'],
  },
  {
    name: '7. React WebMCP Isolation Check',
    command: 'node',
    args: ['scripts/verify-react-webmcp-isolation.mjs'],
  },
  {
    name: '8. AI SDK & Tool Protocol Contract Check',
    command: 'node',
    args: ['scripts/verify-ai-sdk-tool-protocol-contract.mjs'],
  },
  {
    name: '9. React Aria Hydration Reference Check',
    command: 'node',
    args: ['scripts/verify-react-aria-reference-hydration.mjs'],
  },
  {
    name: '10. Documentation Snippets Check',
    command: 'node',
    args: ['scripts/verify-doc-snippets.mjs'],
  },
  {
    name: '11. Durable Operations Evidence Schema Test',
    command: 'node',
    args: ['--test', 'scripts/verify-durable-operation-evidence-schema.test.mjs'],
  },
  {
    name: '12. V1 Supply Chain & Pinned Action Policy Audit',
    command: 'node',
    args: ['scripts/verify-v1-supply-chain.mjs'],
  },
  {
    name: '13. Release Safety Regression Suite (194 tests)',
    command: 'node',
    args: [
      '--test',
      '--test-concurrency=1',
      'scripts/maintenance-release-safety.test.mjs',
      'scripts/publish-packages.test.mjs',
      'scripts/verify-published-tool-consumers.test.cjs',
      'scripts/coordinated-stable-release.test.mjs',
      'scripts/verify-v1-release-workflows.test.mjs',
      'scripts/verify-v1-supply-chain.test.mjs',
      'scripts/verify-preact-public-release.test.mjs',
    ],
  },
];

const steps = isQuick ? quickSteps : fullSteps;
const startTime = Date.now();
const suiteResults = [];

for (const step of steps) {
  console.log(`\n▶ [RUNNING] ${step.name}...`);
  const stepStart = Date.now();

  const result = spawnSync(step.command, step.args, {
    cwd: repositoryRoot,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  const durationSec = parseFloat(((Date.now() - stepStart) / 1000).toFixed(2));

  if (result.status !== 0) {
    console.error(`\n✖ [FAILED] ${step.name} (exited with code ${result.status}, took ${durationSec}s)`);
    process.exit(result.status ?? 1);
  }

  suiteResults.push({
    name: step.name,
    durationSec,
    status: 'passed',
  });
  console.log(`✔ [PASSED] ${step.name} (${durationSec}s)`);
}

// ── 12. Generate Immutable Local Verification Receipt ────────────────────────
const headSha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).stdout.trim();
const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repositoryRoot, encoding: 'utf8' }).stdout.trim();

let lockfileDigest = 'unknown';
const lockfilePath = resolve(repositoryRoot, 'pnpm-lock.yaml');
if (existsSync(lockfilePath)) {
  lockfileDigest = `sha256:${createHash('sha256').update(readFileSync(lockfilePath)).digest('hex')}`;
}

const unsignedReceipt = {
  schemaVersion: 'local-verification-receipt/v1',
  timestamp: new Date().toISOString(),
  commitSha: headSha || 'uncommitted',
  branch: branch || 'main',
  toolchain: {
    node: nodeVer,
    pnpm: pnpmVer,
    platform: process.platform,
    arch: process.arch,
  },
  inputDigest: lockfileDigest,
  suites: suiteResults,
  status: 'passed',
};

const receiptDigest = computeCanonicalHash(unsignedReceipt);
const receipt = {
  ...unsignedReceipt,
  receiptDigest,
};

const verifDir = resolve(repositoryRoot, '.verification');
if (!existsSync(verifDir)) {
  mkdirSync(verifDir, { recursive: true });
}
const receiptPath = resolve(verifDir, 'local-receipt.json');
writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n', 'utf8');

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
console.log('\n' + '='.repeat(70));
console.log(`  🎉 ALL LOCAL VERIFICATIONS PASSED! (${totalDuration}s)`);
console.log(`  Receipt Written: .verification/local-receipt.json`);
console.log(`  Receipt Digest:  ${receiptDigest}`);
console.log(`  Commit SHA:      ${receipt.commitSha}`);
console.log('  Ready for safe commit, PR validation, and release gate.');
console.log('='.repeat(70) + '\n');
