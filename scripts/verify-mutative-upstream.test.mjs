import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildInventory,
  compareManifest,
  normalizeSource,
  parseArgs,
  sourceComparison,
  sourceInventory,
  sourceTreeHash,
  validateManifestShape,
} from './verify-mutative-upstream.mjs';

test('normalizeSource canonicalizes CRLF and CR line endings only', () => {
  assert.equal(normalizeSource('a\r\nb\rc\n'), 'a\nb\nc\n');
});

test('sourceInventory hashes normalized source and has a deterministic tree digest', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'verify-mutative-source-'));
  try {
    mkdirSync(path.join(root, 'utils'));
    writeFileSync(path.join(root, 'z.ts'), 'z\r\n');
    writeFileSync(path.join(root, 'utils', 'a.ts'), 'a\n');
    const inventory = sourceInventory(root);
    assert.deepEqual(Object.keys(inventory.files), ['utils/a.ts', 'z.ts']);
    assert.equal(inventory.files['z.ts'], inventory.files['z.ts']);
    assert.equal(inventory.sourceTreeSha256, sourceTreeHash(new Map(Object.entries(inventory.files))));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('sourceComparison assigns explicit categories and preserves hashes', () => {
  const comparison = sourceComparison(
    {
      sourceTreeSha256: 'upstream-tree',
      files: { same: 'same-hash', changed: 'upstream-hash', removed: 'removed-hash' },
    },
    {
      sourceTreeSha256: 'local-tree',
      files: { same: 'same-hash', changed: 'local-hash', added: 'added-hash' },
    },
  );
  assert.deepEqual(comparison, {
    added: { category: 'added', upstreamSha256: null, localSha256: 'added-hash' },
    changed: { category: 'modified', upstreamSha256: 'upstream-hash', localSha256: 'local-hash' },
    removed: { category: 'removed', upstreamSha256: 'removed-hash', localSha256: null },
    same: { category: 'unchanged', upstreamSha256: 'same-hash', localSha256: 'same-hash' },
  });
});

function digest(value) {
  return value.repeat(64).slice(0, 64);
}

function validManifest() {
  const upstreamFiles = { 'a.ts': digest('a'), 'b.ts': digest('b') };
  const localFiles = {
    'a.ts': { category: 'modified', upstreamSha256: upstreamFiles['a.ts'], localSha256: digest('c') },
    'b.ts': { category: 'unchanged', upstreamSha256: upstreamFiles['b.ts'], localSha256: upstreamFiles['b.ts'] },
    'extra.ts': { category: 'added', upstreamSha256: null, localSha256: digest('d') },
  };
  return {
    schemaVersion: 'context-action-mutative-upstream-lock.v1',
    upstream: {
      name: 'mutative',
      version: '1.3.0',
      sourceRoot: 'src',
      tarballIntegrity: `sha512-${'A'.repeat(43)}=`,
      sourceTreeSha256: digest('e'),
      files: upstreamFiles,
    },
    local: {
      sourceRoot: 'src',
      sourceTreeSha256: digest('f'),
      files: localFiles,
    },
  };
}

test('validateManifestShape requires every source path to have a category', () => {
  const manifest = validManifest();
  validateManifestShape(manifest);
  delete manifest.local.files['b.ts'];
  assert.throws(() => validateManifestShape(manifest), /missing explicit entries: b\.ts/u);
});

test('compareManifest reports upstream and local source drift', () => {
  const manifest = validManifest();
  const actual = {
    upstream: {
      tarballIntegrity: manifest.upstream.tarballIntegrity,
      sourceTreeSha256: manifest.upstream.sourceTreeSha256,
      files: manifest.upstream.files,
    },
    local: {
      sourceTreeSha256: manifest.local.sourceTreeSha256,
      files: Object.fromEntries(
        Object.entries(manifest.local.files).map(([filePath, entry]) => [filePath, { ...entry }]),
      ),
    },
  };
  assert.deepEqual(compareManifest(manifest, actual), []);
  actual.local.files['a.ts'] = { ...actual.local.files['a.ts'], localSha256: digest('z') };
  const errors = compareManifest(manifest, actual);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /local\.files\.a\.ts\.localSha256 drift/u);
});

test('parseArgs defaults to a check and refuses source mutation', () => {
  assert.equal(parseArgs([]).mode, 'check');
  assert.equal(parseArgs(['--inventory', '--version', '1.3.0']).mode, 'inventory');
  assert.throws(() => parseArgs(['--update']), /Source update is intentionally disabled/u);
});

test('buildInventory emits explicit patch categories without changing files', () => {
  const inventory = buildInventory({
    name: 'mutative',
    version: '1.3.0',
    archiveIntegrity: `sha512-${'A'.repeat(43)}=`,
    registry: 'https://registry.npmjs.org',
    upstreamInventory: {
      sourceTreeSha256: digest('a'),
      files: { 'a.ts': digest('a') },
    },
    localInventory: {
      sourceTreeSha256: digest('b'),
      files: { 'a.ts': digest('b'), 'array.ts': digest('c') },
    },
  });
  assert.equal(inventory.schemaVersion, 'context-action-mutative-upstream-lock.v1');
  assert.deepEqual(inventory.local.files['array.ts'], {
    category: 'added',
    upstreamSha256: null,
    localSha256: digest('c'),
  });
});
