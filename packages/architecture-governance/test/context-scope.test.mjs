import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { symbolRefKey } from '@context-action/sem-foundation-contracts';
import {
  createContextScope,
  parseContextManifest,
} from '../dist/index.js';

const revision = { gitHead: 'a'.repeat(40) };
const root = {
  projectId: 'example',
  filePath: 'src/Dashboard.tsx',
  entityId: 'src/Dashboard.tsx::function::Dashboard',
};
const child = {
  projectId: 'example',
  filePath: 'src/ProfileCard.tsx',
  entityId: 'src/ProfileCard.tsx::function::ProfileCard',
};

function snapshot() {
  return {
    contractId: 'context-action/symbol-snapshot',
    contractVersion: '1.1',
    repositoryRoot: '/repo',
    revision,
    projects: [{ id: 'example', root: '.' }],
    projectStatuses: [{ projectId: 'example', root: '.', status: 'analyzed' }],
    symbols: [
      { ...root, symbol: 'function::Dashboard', kind: 'function', name: 'Dashboard', startLine: 1, endLine: 5 },
      { ...child, symbol: 'function::ProfileCard', kind: 'function', name: 'ProfileCard', startLine: 1, endLine: 5 },
    ],
  };
}

function manifest() {
  return parseContextManifest({
    schemaVersion: 1,
    revision,
    contexts: [{
      id: 'dashboard',
      kind: 'screen',
      label: 'Dashboard',
      anchors: [{ role: 'root', symbol: root }],
      declaredEdges: [{ id: 'dashboard-renders-card', from: root, to: child, kind: 'renders' }],
    }],
  });
}

test('projects a revision-bound manifest context with explicit and SEM dependency edges', () => {
  const scope = createContextScope({
    snapshot: snapshot(),
    manifest: manifest(),
    contextId: 'dashboard',
    manifestPath: 'architecture/contexts.json',
    manifestDigest: 'digest',
    maxDepth: 1,
    semAnalyses: [{
      projectId: 'example',
      root: '/repo',
      entities: snapshot().symbols.map(({ entityId, filePath, name, kind, startLine, endLine }) => ({
        id: entityId,
        file: filePath,
        name,
        kind,
        startLine,
        endLine,
      })),
      impacts: [{
        entity: { entityId: root.entityId, file: root.filePath, name: 'Dashboard', kind: 'function' },
        dependencies: [{ entityId: child.entityId, file: child.filePath, name: 'ProfileCard', kind: 'function' }],
        dependents: [],
        tests: [],
      }],
    }],
  });

  assert.equal(scope.status.kind, 'complete');
  assert.deepEqual(scope.nodes.map(symbolRefKey), [symbolRefKey(root), symbolRefKey(child)].sort());
  assert.equal(scope.edges.length, 2);
  assert.ok(scope.edges.some((edge) => edge.evidence.provider === 'manifest'));
  assert.ok(scope.edges.some((edge) => edge.evidence.provider === 'sem'));
  assert.equal(scope.groups.some((group) => group.kind === 'project'), true);
});

test('returns invalid scope for unresolved anchors and revision mismatch', () => {
  const unresolved = parseContextManifest({
    schemaVersion: 1,
    revision,
    contexts: [{
      id: 'missing',
      kind: 'screen',
      anchors: [{ role: 'root', symbol: { ...root, entityId: 'missing' } }],
    }],
  });
  assert.deepEqual(
    createContextScope({
      snapshot: snapshot(),
      manifest: unresolved,
      contextId: 'missing',
      manifestPath: 'architecture/contexts.json',
      manifestDigest: 'digest',
    }).status,
    { kind: 'invalid', errors: ['anchor-unresolved'] },
  );

  const mismatch = parseContextManifest({
    schemaVersion: 1,
    revision: { commit: 'b'.repeat(40) },
    contexts: [{ id: 'dashboard', kind: 'screen', anchors: [{ role: 'root', symbol: root }] }],
  });
  assert.deepEqual(
    createContextScope({
      snapshot: snapshot(),
      manifest: mismatch,
      contextId: 'dashboard',
      manifestPath: 'architecture/contexts.json',
      manifestDigest: 'digest',
    }).status,
    { kind: 'invalid', errors: ['manifest-revision-mismatch'] },
  );
});

test('keeps non-screen profiles explicit until their adapters are implemented', () => {
  const apiManifest = parseContextManifest({
    schemaVersion: 1,
    revision,
    contexts: [{ id: 'api', kind: 'api', anchors: [{ role: 'endpoint', symbol: root }] }],
  });
  assert.deepEqual(
    createContextScope({
      snapshot: snapshot(),
      manifest: apiManifest,
      contextId: 'api',
      manifestPath: 'architecture/contexts.json',
      manifestDigest: 'digest',
    }).status,
    { kind: 'invalid', errors: ['unsupported-profile'] },
  );
});

test('context-scope CLI reads bounded snapshot and manifest files', async () => {
  const rootPath = await mkdtemp(path.join(tmpdir(), 'context-scope-'));
  const snapshotPath = path.join(rootPath, 'snapshot.json');
  const manifestPath = path.join(rootPath, 'manifest.json');
  await writeFile(snapshotPath, JSON.stringify(snapshot()));
  await writeFile(manifestPath, JSON.stringify({
    schemaVersion: 1,
    revision,
    contexts: [{ id: 'dashboard', kind: 'screen', anchors: [{ role: 'root', symbol: root }] }],
  }));
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'context-scope',
    '--root', rootPath,
    '--snapshot', 'snapshot.json',
    '--manifest', 'manifest.json',
    '--context', 'dashboard',
    '--format', 'json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.contractId, 'context-action/context-scope');
  assert.equal(report.status.kind, 'complete');
  assert.equal(report.source.manifest.path, 'manifest.json');
  assert.equal((await readFile(manifestPath)).length > 0, true);
});
