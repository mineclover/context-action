import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  inspectDurableOperationWorkflow,
  REQUIRED_FILES,
} from './verify-durable-operation-workflow.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('durable-operation workflow references the local evidence contract', () => {
  const result = inspectDurableOperationWorkflow();
  assert.equal(result.workflowPath, '.github/workflows/verify-durable-operations.yml');
  assert.equal(result.requiredFiles, 9);
  assert.ok(result.requiredMarkers >= 20);
  assert.equal(result.requiredScripts, 10);
});

test('rejects a workflow when a referenced package script is missing', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'durable-workflow-contract-'));
  try {
    const workflow = '.github/workflows/verify-durable-operations.yml';
    for (const file of REQUIRED_FILES) {
      const source = path.join(repositoryRoot, file);
      const target = path.join(fixtureRoot, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
    const workflowTarget = path.join(fixtureRoot, workflow);
    fs.mkdirSync(path.dirname(workflowTarget), { recursive: true });
    fs.copyFileSync(path.join(repositoryRoot, workflow), workflowTarget);
    const packagePath = path.join(fixtureRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    delete packageJson.scripts['tool-durable:verify:queue'];
    fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

    assert.throws(
      () => inspectDurableOperationWorkflow({ rootDirectory: fixtureRoot }),
      /package\.json#tool-durable:verify:queue/
    );
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
