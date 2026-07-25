import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verifier = path.join(repositoryRoot, 'scripts/verify-durable-operation-evidence-schema.mjs');

function completeEvidence() {
  const check = {
    outcome: 'success',
    available: true,
    status: 'ok',
    result: { status: 'ok' },
  };
  return {
    schemaVersion: 'context-action/durable-operation-verification@1',
    generatedAt: '2026-07-25T00:00:00.000Z',
    target: {
      environment: 'staging',
      commitSha: 'test-commit',
      runId: 'test-run',
      operator: 'evidence-test',
    },
    credentialPolicy: 'host-only; endpoint credentials and raw command output omitted',
    checks: {
      preflight: check,
      redis: check,
      integration: check,
      postgres: check,
      queue: check,
    },
  };
}

async function runVerifier(file, ...args) {
  try {
    const result = await execFileAsync(process.execPath, [verifier, '--file', file, ...args], {
      cwd: repositoryRoot,
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      code: typeof error.status === 'number' ? error.status : Number(error.code),
      stdout: error.stdout,
      stderr: error.stderr,
    };
  }
}

test('complete evidence passes the strict deployment gate', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'context-action-evidence-'));
  try {
    const file = path.join(directory, 'evidence.json');
    await writeFile(file, `${JSON.stringify(completeEvidence())}\n`, 'utf8');
    const result = await runVerifier(file, '--require-success');
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /"status":"ok"/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('schema-valid incomplete evidence is rejected by the strict gate', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'context-action-evidence-'));
  try {
    const file = path.join(directory, 'evidence.json');
    const evidence = completeEvidence();
    evidence.checks.queue = {
      outcome: 'unknown',
      available: false,
      status: 'unknown',
    };
    await writeFile(file, `${JSON.stringify(evidence)}\n`, 'utf8');

    const schemaOnly = await runVerifier(file);
    assert.equal(schemaOnly.code, 0, schemaOnly.stderr);
    const strict = await runVerifier(file, '--require-success');
    assert.equal(strict.code, 3);
    assert.match(strict.stderr, /"status": "incomplete"/);
    assert.match(strict.stderr, /"name": "queue"/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
