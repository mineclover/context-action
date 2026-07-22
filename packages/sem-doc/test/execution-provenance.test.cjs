const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createExecutionProvenance,
  parseExecutionProvenance,
} = require('../dist');

test('creates and parses canonical execution provenance', () => {
  const provenance = createExecutionProvenance({
    phase: 'work-context',
    ownerId: 'editor-session',
    state: 'completed',
    timeoutMs: 120000,
    maxOutputBytes: 1024,
    usedOutputBytes: 512,
    elapsedMs: 17,
  });
  assert.deepEqual(parseExecutionProvenance(JSON.parse(JSON.stringify(provenance))), provenance);
});

test('rejects malformed or contradictory provenance records', () => {
  const base = {
    phase: 'context-scope-history',
    ownerId: 'history-run',
    state: 'completed',
    timeoutMs: 120000,
    maxOutputBytes: 1024,
    usedOutputBytes: 512,
    elapsedMs: 0,
  };
  assert.throws(() => parseExecutionProvenance({ ...base, usedOutputBytes: 1025 }), /must not exceed/);
  assert.throws(() => parseExecutionProvenance({ ...base, phase: 'other' }), /phase is invalid/);
  assert.throws(() => parseExecutionProvenance({ ...base, extra: true }), /unknown field: extra/);
  assert.throws(() => parseExecutionProvenance({ ...base, ownerId: ' history-run' }), /canonical text/);
  assert.throws(() => createExecutionProvenance({ ...base, elapsedMs: -1 }), /elapsedMs must be/);
});
