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

import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
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
