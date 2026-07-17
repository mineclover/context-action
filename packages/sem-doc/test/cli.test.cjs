const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');
const cliPath = path.join(repositoryRoot, 'dist', 'cli.js');

function runCli(args, binary = path.join(repositoryRoot, 'node_modules', '.bin', 'sem')) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      SEM_BIN: binary,
    },
  });
}

test('CLI exposes the pinned sem version', () => {
  const result = runCli(['version']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), '0.21.0');
  assert.equal(result.stderr, '');
});

test('CLI help exposes the current work-context contract', () => {
  const result = runCli(['help']);
  assert.equal(result.status, 0);
  assert.match(result.stderr, /work-context <entity>/u);
  assert.match(result.stderr, /--no-cache/u);
  assert.match(result.stderr, /docs validate-bindings/u);
});

test('CLI rejects unknown commands with its stable input status', () => {
  const result = runCli(['unknown-command']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage:/u);
});

test('CLI composes a JSON work-context report through the current contract', () => {
  const result = runCli([
    'work-context',
    'SemClient',
    '--file',
    'src/sem-client.ts',
    '--depth',
    '1',
    '--json',
  ]);
  assert.equal(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.schemaVersion, 'sem-doc-work-context.v4');
  assert.equal(report.target.entity.id, 'packages/sem-doc/src/sem-client.ts::class::SemClient');
  assert.equal(report.symbols.maxHops, 1);
  assert.equal(report.affectedTests.complete, true);
  assert.ok(Array.isArray(report.usageFiles));
});
