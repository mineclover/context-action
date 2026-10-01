import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

test('Mutative upstream lock records the 1.3.0 baseline and local patch contracts', () => {
  const output = execFileSync(process.execPath, ['scripts/verify-mutative-upstream.mjs'], { encoding: 'utf8' });
  const result = JSON.parse(output);
  assert.equal(result.status, 'ok');
  assert.equal(result.upstream, 'mutative@1.3.0');
  assert.equal(result.adapterVersionLine, '0.8.x');
  assert.equal(result.localPatchContracts, 5);
});
