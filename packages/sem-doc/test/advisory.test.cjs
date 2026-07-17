const assert = require('node:assert/strict');
const test = require('node:test');

const { createSemAdvisoryEnvelope, SEM_ADVISORY_SCHEMA } = require('../dist');

test('creates a sem advisory envelope without changing the canonical graph', () => {
  const envelope = createSemAdvisoryEnvelope(
    {
      command: 'impact',
      args: ['authenticateUser', '--json'],
      repositoryRoot: '/workspace/example',
      revision: { gitHead: 'abc123' },
      engineVersion: '0.21.0',
    },
    { entities: ['authenticateUser'] }
  );

  assert.deepEqual(envelope, {
    schemaVersion: SEM_ADVISORY_SCHEMA,
    source: 'sem',
    command: 'impact',
    args: ['authenticateUser', '--json'],
    repositoryRoot: '/workspace/example',
    revision: { gitHead: 'abc123' },
    engine: { name: 'sem', version: '0.21.0' },
    payload: { entities: ['authenticateUser'] },
  });
});
