const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  createSemExecutionBudget,
  MAX_SEM_CLIENT_BUFFER_BYTES,
  MAX_SEM_CLIENT_TIMEOUT_MS,
  SemAdvisoryProvider,
  SemClient,
  SemConfigurationError,
  SemExecutionError,
} = require('../dist');

const fakeBinary = path.join(__dirname, 'fixtures', 'fake-sem.cjs');
const client = () => new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] });

test('captures sem version and parses JSON output through the external process boundary', () => {
  const sem = client();
  assert.equal(sem.version(), '0.21.0');
  const result = sem.runJson('entities', ['--json']);
  assert.equal(result.length, 3);
  assert.equal(result[0].name, 'authenticateUser');
});

test('resolves the workspace sem binary when analysis changes cwd', () => {
  const previous = process.env.SEM_BIN;
  delete process.env.SEM_BIN;
  try {
    const sem = new SemClient();
    const repositoryRoot = path.resolve(__dirname, '..', '..');
    assert.equal(sem.version({ cwd: repositoryRoot }), '0.21.0');
  } finally {
    if (previous === undefined) delete process.env.SEM_BIN;
    else process.env.SEM_BIN = previous;
  }
});

test('typed advisory provider validates and envelopes sem entity output', () => {
  const envelope = new SemAdvisoryProvider(client()).analyzeEntities({
    args: ['--json'],
    repositoryRoot: process.cwd(),
    revision: { gitHead: 'abc123', workingTreeDigest: 'digest' },
    engineVersion: '0.21.0',
  });

  assert.equal(envelope.command, 'entities');
  assert.deepEqual(envelope.args, ['--json']);
  assert.equal(envelope.payload[0].name, 'authenticateUser');
});

test('rejects unsafe process configuration instead of delegating invalid limits to spawnSync', () => {
  assert.throws(() => new SemClient({ binary: '   ' }), SemConfigurationError);
  assert.throws(() => new SemClient({ timeoutMs: 0 }), SemConfigurationError);
  assert.throws(() => new SemClient({ maxBufferBytes: Number.NaN }), SemConfigurationError);
  assert.throws(() => new SemClient({ timeoutMs: MAX_SEM_CLIENT_TIMEOUT_MS + 1 }), SemConfigurationError);
  assert.throws(() => new SemClient({ maxBufferBytes: MAX_SEM_CLIENT_BUFFER_BYTES + 1 }), SemConfigurationError);
  assert.throws(
    () => createSemExecutionBudget({ timeoutMs: MAX_SEM_CLIENT_TIMEOUT_MS + 1, maxOutputBytes: 1024 }),
    SemConfigurationError,
  );
  assert.throws(
    () => createSemExecutionBudget({ timeoutMs: 1000, maxOutputBytes: MAX_SEM_CLIENT_BUFFER_BYTES + 1 }),
    SemConfigurationError,
  );
});

test('enforces one aggregate output budget across composed sem calls', () => {
  const sem = client();
  const budget = createSemExecutionBudget({ timeoutMs: 30_000, maxOutputBytes: 16 });
  assert.throws(() => sem.runJson('entities', ['--json'], { budget }), SemExecutionError);
  assert.ok(budget.usedOutputBytes > budget.maxOutputBytes);
});
