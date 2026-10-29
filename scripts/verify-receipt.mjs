#!/usr/bin/env node

/**
 * Receipt Verification Utility (Issue #53)
 *
 * Verifies that `.verification/local-receipt.json`:
 * 1. Exists and contains schemaVersion: 'local-verification-receipt/v1'
 * 2. Has status: 'passed'
 * 3. Matches current git HEAD commit SHA (or HEAD is an ancestor/same tree)
 * 4. Has authentic RFC 8785 canonical digest (receiptDigest)
 *
 * Fails closed with exit code 1 if receipt is missing, stale, or tampered.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDir, '..');
const receiptPath = resolve(repositoryRoot, '.verification/local-receipt.json');

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

function gitOutput(args) {
  const result = spawnSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr?.trim() || `exit ${result.status}`}`);
  }
  return result.stdout ?? '';
}

function sourceTreeFiles() {
  return gitOutput(['ls-files', '--cached', '--others', '--exclude-standard', '-z'])
    .split('\0')
    .filter(Boolean)
    .filter(file => !file.startsWith('.verification/'))
    .sort();
}

function computeWorkingTreeDigest() {
  const digest = createHash('sha256');
  digest.update('context-action-working-tree/v1\0', 'utf8');
  for (const relativePath of sourceTreeFiles()) {
    const absolutePath = resolve(repositoryRoot, relativePath);
    let entry;
    try {
      const stat = lstatSync(absolutePath);
      if (stat.isSymbolicLink()) {
        entry = `symlink:${readlinkSync(absolutePath)}`;
      } else if (stat.isFile()) {
        entry = readFileSync(absolutePath);
      } else {
        entry = `mode:${stat.mode.toString(8)}`;
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      entry = 'missing';
    }
    digest.update(relativePath, 'utf8');
    digest.update('\0', 'utf8');
    digest.update(entry);
    digest.update('\0', 'utf8');
  }
  return `sha256:${digest.digest('hex')}`;
}

function getWorkingTreeStatus() {
  const status = gitOutput(['status', '--porcelain=v1', '--untracked-files=all']);
  const sourceChanges = status
    .split('\n')
    .filter(Boolean)
    .filter(line => {
      const paths = line.slice(3).trim().split(' -> ');
      return paths.some(path => !path.replace(/^"|"$/g, '').startsWith('.verification/'));
    });
  return sourceChanges.length === 0 ? 'clean' : 'dirty';
}

console.log('='.repeat(70));
console.log('  Local Verification Receipt Audit (#53)');
console.log('='.repeat(70));

if (!existsSync(receiptPath)) {
  console.error('\n✖ [FAIL-CLOSED] No local verification receipt found at .verification/local-receipt.json');
  console.error('  Please run `pnpm verify` or `pnpm verify:quick` locally before submitting/releasing.');
  process.exit(1);
}

let receipt;
try {
  receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
} catch (err) {
  console.error('\n✖ [FAIL-CLOSED] Malformed receipt JSON:', err.message);
  process.exit(1);
}

if (receipt.schemaVersion !== 'local-verification-receipt/v1') {
  console.error(`\n✖ [FAIL-CLOSED] Invalid schemaVersion: expected 'local-verification-receipt/v1', got '${receipt.schemaVersion}'`);
  process.exit(1);
}

if (receipt.status !== 'passed') {
  console.error(`\n✖ [FAIL-CLOSED] Local verification receipt status is '${receipt.status}'. Only 'passed' receipts are release-eligible.`);
  process.exit(1);
}

if (!/^sha256:[0-9a-f]{64}$/u.test(receipt.treeDigest ?? '')) {
  console.error('\n✖ [FAIL-CLOSED] Receipt is missing a valid working-tree digest.');
  console.error('  Run `pnpm verify` or `pnpm verify:quick` to mint a current receipt.');
  process.exit(1);
}

if (!['clean', 'dirty'].includes(receipt.workingTree)) {
  console.error(`\n✖ [FAIL-CLOSED] Receipt has invalid workingTree state: '${receipt.workingTree}'.`);
  process.exit(1);
}

const currentTreeDigest = computeWorkingTreeDigest();
if (receipt.treeDigest !== currentTreeDigest) {
  console.error('\n✖ [FAIL-CLOSED] Working-tree digest mismatch:');
  console.error(`  Receipt tree: ${receipt.treeDigest}`);
  console.error(`  Current tree: ${currentTreeDigest}`);
  console.error('  Source files changed since verification. Run `pnpm verify` to update the receipt.');
  process.exit(1);
}

const currentWorkingTree = getWorkingTreeStatus();
if (receipt.workingTree !== currentWorkingTree) {
  console.error('\n✖ [FAIL-CLOSED] Working-tree state mismatch:');
  console.error(`  Receipt state: ${receipt.workingTree}`);
  console.error(`  Current state: ${currentWorkingTree}`);
  process.exit(1);
}

// Check commit SHA and code identity
const headSha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).stdout.trim();
let commitMatches = receipt.commitSha === headSha;

if (!commitMatches && receipt.commitSha && receipt.commitSha !== 'uncommitted') {
  // Check if code outside of .verification is 100% identical between receipt commit and HEAD
  const diffCheck = spawnSync('git', ['diff', receipt.commitSha, headSha, '--', ':(exclude).verification'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  if (diffCheck.status === 0 && diffCheck.stdout.trim().length === 0) {
    commitMatches = true;
  }
}

if (!commitMatches) {
  console.error(`\n✖ [FAIL-CLOSED] Stale receipt commit SHA:`);
  console.error(`  Receipt commit: ${receipt.commitSha}`);
  console.error(`  Current HEAD:   ${headSha}`);
  console.error('  Code has drifted since receipt was minted. Run `pnpm verify` to update the verification receipt.');
  process.exit(1);
}

// Verify RFC 8785 receiptDigest
const { receiptDigest, ...unsignedReceipt } = receipt;
const expectedDigest = computeCanonicalHash(unsignedReceipt);

if (receiptDigest !== expectedDigest) {
  console.error('\n✖ [FAIL-CLOSED] Receipt cryptographic tamper detected:');
  console.error(`  Recorded: ${receiptDigest}`);
  console.error(`  Computed: ${expectedDigest}`);
  process.exit(1);
}

console.log(`\n✔ [VALID] Receipt verified successfully!`);
console.log(`  Commit SHA:    ${receipt.commitSha}`);
console.log(`  Timestamp:     ${receipt.timestamp}`);
console.log(`  ReceiptDigest: ${receipt.receiptDigest}`);
console.log(`  Suites passed: ${receipt.suites?.length ?? 0}`);
console.log('='.repeat(70) + '\n');
process.exit(0);
