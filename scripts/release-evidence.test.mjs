import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const writer = path.join(repositoryRoot, 'scripts', 'write-release-evidence.mjs');
const verifier = path.join(repositoryRoot, 'scripts', 'verify-release-evidence.mjs');

async function run(file, args) {
  try {
    const result = await execFileAsync(process.execPath, [file, ...args], { cwd: repositoryRoot });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

test('writer records hashed logs and copied artifacts that pass strict verification', async () => {
  const stage = `v1.0.0-test-${Date.now()}`;
  const output = path.join('release-evidence', stage);
  const source = path.join('release-evidence', `${stage}-input.txt`);
  try {
    await writeFile(path.join(repositoryRoot, source), 'release artifact\n', 'utf8');
    const written = await run(writer, [
      '--release', 'context-action-v1.0.0', '--stage', stage,
      '--command', `node-version=${process.execPath} --version`,
      '--artifact', source,
    ]);
    assert.equal(written.code, 0, written.stderr);
    const manifest = JSON.parse(await readFile(path.join(repositoryRoot, output, 'manifest.json'), 'utf8'));
    assert.equal(manifest.status, 'recorded');
    assert.equal(manifest.commands[0].status, 'passed');
    assert.match(manifest.commands[0].log.sha256, /^[a-f0-9]{64}$/);
    assert.equal(manifest.artifacts[0].path, 'artifacts/01-' + path.basename(source));
    const verified = await run(verifier, ['--file', path.join(output, 'manifest.json')]);
    assert.equal(verified.code, 0, verified.stderr);
    const strict = await run(verifier, ['--file', path.join(output, 'manifest.json'), '--require-success']);
    assert.equal(strict.code, 1);
    assert.match(strict.stderr, /clean working tree/);
  } finally {
    await rm(path.join(repositoryRoot, output), { recursive: true, force: true });
    await rm(path.join(repositoryRoot, source), { force: true });
  }
});

test('verifier detects evidence tampering', async () => {
  const directory = await mkdtemp(path.join(repositoryRoot, 'release-evidence', 'v1.0.0-tamper-'));
  try {
    const logDirectory = path.join(directory, 'logs');
    await mkdir(logDirectory, { recursive: true });
    await writeFile(path.join(logDirectory, 'test.log'), 'original\n', 'utf8');
    const manifest = {
      schemaVersion: 'context-action-release-evidence.v1', release: 'context-action-v1.0.0', stage: path.basename(directory), commit: 'test', roadmapRevision: 'v1-r3', status: 'recorded', generatedAt: '2026-08-09T00:00:00.000Z',
      workingTree: 'clean', environment: { node: 'v24', pnpm: '10', typescript: '6' },
      commands: [{ id: 'test', command: 'true', startedAt: '2026-08-09T00:00:00.000Z', completedAt: '2026-08-09T00:00:00.000Z', durationMs: 0, exitCode: 0, status: 'passed', log: { path: 'logs/test.log', sha256: '0'.repeat(64) } }],
      artifacts: [], notes: ['test'],
    };
    await writeFile(path.join(directory, 'manifest.json'), `${JSON.stringify(manifest)}\n`, 'utf8');
    const result = await run(verifier, ['--file', path.join(path.relative(repositoryRoot, directory), 'manifest.json')]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /hash does not match/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
