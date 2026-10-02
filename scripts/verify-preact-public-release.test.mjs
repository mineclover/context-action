import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verifier = path.join(repositoryRoot, 'scripts', 'verify-preact-public-release.mjs');

async function runVerifier(root) {
  try {
    const result = await execFileAsync(process.execPath, [verifier, '--root', root]);
    return { code: 0, ...result };
  } catch (error) {
    return { code: error.code, ...error };
  }
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'context-action-preact-release-'));
  await Promise.all([
    mkdir(path.join(root, 'packages', 'core'), { recursive: true }),
    mkdir(path.join(root, 'packages', 'preact'), { recursive: true }),
    mkdir(path.join(root, 'packages', 'preact-ui'), { recursive: true }),
  ]);
  const readManifest = relativePath => readFile(path.join(repositoryRoot, relativePath), 'utf8').then(JSON.parse);
  const [core, preact, preactUi] = await Promise.all([
    readManifest('packages/core/package.json'),
    readManifest('packages/preact/package.json'),
    readManifest('packages/preact-ui/package.json'),
  ]);
  await Promise.all([
    writeFile(path.join(root, 'packages', 'core', 'package.json'), `${JSON.stringify(core)}\n`),
    writeFile(path.join(root, 'packages', 'preact', 'package.json'), `${JSON.stringify(preact)}\n`),
    writeFile(path.join(root, 'packages', 'preact-ui', 'package.json'), `${JSON.stringify(preactUi)}\n`),
    ...['preact', 'preact-ui'].flatMap(directory => [
      writeFile(path.join(root, 'packages', directory, 'README.md'), '# fixture\n'),
      writeFile(path.join(root, 'packages', directory, 'LICENSE'), 'Apache License 2.0\n'),
    ]),
  ]);
  return root;
}

test('accepts the current public Preact cohort', async () => {
  const result = await runVerifier(repositoryRoot);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /"currentSource":"not-required"/u);
});

test('fails closed when a Preact package remains private', async () => {
  const root = await createFixture();
  try {
    const packagePath = path.join(root, 'packages', 'preact', 'package.json');
    const manifest = JSON.parse(await readFile(packagePath, 'utf8'));
    manifest.private = true;
    await writeFile(packagePath, `${JSON.stringify(manifest)}\n`);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /@context-action\/preact must explicitly set private=false/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
