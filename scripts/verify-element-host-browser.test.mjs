import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createBrowserEvidenceDirectory, parseElementHostBrowserResult } from './verify-element-host-browser.mjs';

const checks = [
  'untouched-default', 'property-identity', 'semantic-handle', 'trusted-shadow-click', 'request-not-commit',
  'invalid-input-preserves-state', 'imperative-event', 'stable-listener', 'no-input-echo',
  'handler-replacement', 'object-receiver', 'omission', 'ownership-release', 'unmount-cleanup',
  'detached-handle', 'remount-isolation', 'final-cleanup',
];
const result = () => ({
  status: 'passed', errors: [], userAgent: 'Unit-test browser metadata', versions: { vue: '3.5.44', svelte: '5.57.2', angular: '20.3.34' },
  results: ['vue', 'svelte', 'angular'].map(framework => ({ framework, passed: true, trustedClicks: 1, checks: [...checks] })),
});
const marker = value => `ELEMENT_HOST_BROWSER_RESULT ${JSON.stringify(value)}`;

test('accepts browser evidence on either stdout or stderr', () => {
  const expected = result();
  assert.deepEqual(parseElementHostBrowserResult(marker(expected), 'diagnostics'), expected);
  assert.deepEqual(parseElementHostBrowserResult('snapshot', marker(expected)), expected);
});

test('rejects missing, duplicated or malformed browser evidence', () => {
  assert.throws(() => parseElementHostBrowserResult('no result', ''), /exactly one/);
  assert.throws(() => parseElementHostBrowserResult(marker(result()), marker(result())), /exactly one/);
  assert.throws(() => parseElementHostBrowserResult('ELEMENT_HOST_BROWSER_RESULT {broken', ''), SyntaxError);
});

test('rejects partial framework evidence and omitted checks', () => {
  const partial = result(); partial.results.pop();
  assert.throws(() => parseElementHostBrowserResult(marker(partial), ''));
  const incomplete = result(); incomplete.results[0].checks.pop();
  assert.throws(() => parseElementHostBrowserResult(marker(incomplete), ''));
});

test('requires exactly one real trusted click per framework', () => {
  for (const trustedClicks of [0, 2]) {
    const untrusted = result(); untrusted.results[0].trustedClicks = trustedClicks;
    assert.throws(() => parseElementHostBrowserResult(marker(untrusted), ''));
  }
});

test('rejects browser errors, failed status and changed version pins', () => {
  const errored = result(); errored.errors.push('uncaught error');
  assert.throws(() => parseElementHostBrowserResult(marker(errored), ''));
  const failed = result(); failed.status = 'failed';
  assert.throws(() => parseElementHostBrowserResult(marker(failed), ''));
  const changed = result(); changed.versions.vue = 'unreviewed';
  assert.throws(() => parseElementHostBrowserResult(marker(changed), ''));
  const itemFailed = result(); itemFailed.results[0].passed = false;
  assert.throws(() => parseElementHostBrowserResult(marker(itemFailed), ''));
  const missingBrowser = result(); delete missingBrowser.userAgent;
  assert.throws(() => parseElementHostBrowserResult(marker(missingBrowser), ''), /user-agent evidence/);
});

test('refuses to mix new evidence with files from a previous run', () => {
  const directory = mkdtempSync(join(tmpdir(), 'element-browser-receipt-test-'));
  try {
    assert.equal(createBrowserEvidenceDirectory(directory), directory);
    writeFileSync(join(directory, 'previous-result.json'), '{}');
    assert.throws(() => createBrowserEvidenceDirectory(directory), /must be empty/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
