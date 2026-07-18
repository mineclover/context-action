import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalEntityId,
  compareSymbolContexts,
  createSymbolSnapshotEntry,
  entitySymbol,
  MAX_SYMBOL_SNAPSHOT_ENTRIES,
  normalizeRepositoryPath,
  normalizeSemEntity,
  normalizeSymbolSnapshotEntries,
  createSymbolSnapshot,
  diffSymbolSnapshots,
  parseSymbolSnapshot,
  SEM_ADVISORY_SCHEMA,
  SYMBOL_SNAPSHOT_CONTRACT_ID,
  SYMBOL_SNAPSHOT_CONTRACT_VERSION,
  symbolRefKey,
  symbolSetKey,
} from '../dist/index.js';

test('normalizes shared SEM identity and repository paths', () => {
  assert.equal(SEM_ADVISORY_SCHEMA, 'sem-advisory.v1');
  assert.equal(normalizeRepositoryPath('./src\\auth.ts'), 'src/auth.ts');
  const entity = normalizeSemEntity({
    name: 'authenticateUser',
    type: 'function',
    file: './src/auth.ts',
    startLine: 2,
    endLine: 4,
  });
  assert.equal(entity.id, 'src/auth.ts::function::authenticateUser');
  assert.equal(entitySymbol(entity.id, entity.file), 'function::authenticateUser');
});

test('preserves parent-scoped IDs and rejects root escapes', () => {
  assert.equal(
    canonicalEntityId({
      id: undefined,
      parentId: 'src/auth.ts::class::AuthController',
      name: 'authenticate',
      type: 'method',
      file: 'src/auth.ts',
    }),
    'src/auth.ts::class::AuthController::authenticate'
  );
  assert.throws(() => normalizeRepositoryPath('../outside.ts'), /escapes its root/);
  assert.throws(
    () => normalizeSemEntity({ name: 'broken', type: 'function', file: 'src/a.ts', startLine: 4, endLine: 2 }),
    /endLine must not precede startLine/
  );
});

test('converts SEM entities into shared complete snapshot entries', () => {
  assert.deepEqual(
    createSymbolSnapshotEntry({
      parentId: 'src/auth.ts::class::AuthController',
      name: 'authenticate',
      type: 'method',
      file: './src/auth.ts',
      startLine: 4,
      endLine: 9,
    }, 'core'),
    {
      projectId: 'core',
      entityId: 'src/auth.ts::class::AuthController::authenticate',
      filePath: 'src/auth.ts',
      symbol: 'class::AuthController::authenticate',
      kind: 'method',
      name: 'authenticate',
      startLine: 4,
      endLine: 9,
      parentId: 'src/auth.ts::class::AuthController',
    },
  );
  assert.throws(
    () => createSymbolSnapshotEntry({
      name: 'missingRange',
      type: 'function',
      file: 'src/auth.ts',
    }, 'core'),
    /startLine and endLine/,
  );
  assert.throws(
    () => createSymbolSnapshotEntry({
      name: 'validEntity',
      type: 'function',
      file: 'src/auth.ts',
      startLine: 1,
      endLine: 1,
    }, ''),
    /projectId must be non-empty text/,
  );
});

test('compares project-qualified symbol contexts deterministically', () => {
  const authenticate = {
    projectId: 'core',
    entityId: 'src/auth.ts::function::authenticateUser',
    filePath: 'src/auth.ts',
    symbol: 'function::authenticateUser',
    kind: 'function',
  };
  const repository = {
    projectId: 'core',
    entityId: 'src/repository.ts::class::UserRepository',
    filePath: 'src/repository.ts',
    symbol: 'class::UserRepository',
    kind: 'class',
  };
  const result = compareSymbolContexts(
    { id: 'business', symbols: [repository, authenticate, authenticate] },
    { id: 'validation', symbols: [authenticate] },
  );
  assert.equal(symbolSetKey(authenticate), 'core\0src/auth.ts\0src/auth.ts::function::authenticateUser');
  assert.equal(symbolRefKey(authenticate).includes('\0'), false);
  assert.deepEqual(result.intersection, [authenticate]);
  assert.deepEqual(result.onlyLeft, [repository]);
  assert.deepEqual(result.onlyRight, []);
  assert.deepEqual(
    compareSymbolContexts(
      { id: 'left', symbols: [{ ...authenticate, filePath: './src/auth.ts' }] },
      { id: 'right', symbols: [authenticate] },
    ).intersection,
    [authenticate],
  );
  assert.throws(
    () => compareSymbolContexts(
      { id: 'left', symbols: [authenticate, { ...authenticate, kind: 'method' }] },
      { id: 'right', symbols: [] },
    ),
    /conflicting entries/,
  );
});

test('creates and parses deterministic complete symbol snapshots', () => {
  const symbol = {
    projectId: 'core',
    entityId: 'src/auth.ts::function::authenticateUser',
    filePath: './src/auth.ts',
    symbol: 'function::authenticateUser',
    kind: 'function',
    name: 'authenticateUser',
    startLine: 2,
    endLine: 4,
  };
  const snapshot = createSymbolSnapshot({
    repositoryRoot: '/repo',
    revision: { commit: 'abc1234' },
    projects: [{ id: 'core', root: './packages/core' }],
    symbols: [symbol, symbol],
  });
  assert.equal(snapshot.contractId, SYMBOL_SNAPSHOT_CONTRACT_ID);
  assert.equal(snapshot.contractVersion, SYMBOL_SNAPSHOT_CONTRACT_VERSION);
  assert.equal(snapshot.symbols.length, 1);
  assert.equal(snapshot.symbols[0]?.filePath, 'src/auth.ts');
  assert.deepEqual(parseSymbolSnapshot(snapshot), snapshot);
  assert.throws(
    () => createSymbolSnapshot({
      repositoryRoot: '/repo',
      revision: { commit: 'abc1234' },
      projects: [{ id: 'core', root: '.' }],
      symbols: [symbol, { ...symbol, endLine: 9 }],
    }),
    /conflicting entries/,
  );
});

test('bounds complete snapshot input before deduplication', () => {
  const symbol = {
    projectId: 'core',
    entityId: 'src/auth.ts::function::authenticateUser',
    filePath: 'src/auth.ts',
    symbol: 'function::authenticateUser',
    kind: 'function',
    name: 'authenticateUser',
    startLine: 2,
    endLine: 4,
  };
  assert.throws(
    () => normalizeSymbolSnapshotEntries(
      Array.from({ length: MAX_SYMBOL_SNAPSHOT_ENTRIES + 1 }, () => symbol),
    ),
    /symbol snapshot symbols exceeds 65536 entries/,
  );
});

test('allows complete snapshot cardinality to be raised by an explicit limit', () => {
  const first = {
    projectId: 'core',
    entityId: 'src/a.ts::function::a',
    filePath: 'src/a.ts',
    symbol: 'function::a',
    kind: 'function',
    name: 'a',
    startLine: 1,
    endLine: 1,
  };
  const second = { ...first, entityId: 'src/b.ts::function::b', filePath: 'src/b.ts', symbol: 'function::b', name: 'b' };
  assert.throws(
    () => createSymbolSnapshot({
      repositoryRoot: '/repo',
      revision: { commit: 'abc1234' },
      projects: [{ id: 'core', root: '.' }],
      symbols: [first, second],
      limits: { maxSymbolSnapshotEntries: 1 },
    }),
    /symbol snapshot symbols exceeds 1 entries/,
  );
  assert.equal(
    createSymbolSnapshot({
      repositoryRoot: '/repo',
      revision: { commit: 'abc1234' },
      projects: [{ id: 'core', root: '.' }],
      symbols: [first, second],
      limits: { maxSymbolSnapshotEntries: 2 },
    }).symbols.length,
    2,
  );
});

test('diffs complete snapshots by stable symbol identity', () => {
  const base = createSymbolSnapshot({
    repositoryRoot: '/repo',
    revision: { commit: 'base123' },
    projects: [{ id: 'core', root: '.' }],
    symbols: [{
      projectId: 'core',
      entityId: 'src/a.ts::function::a',
      filePath: 'src/a.ts',
      symbol: 'function::a',
      kind: 'function',
      name: 'a',
      startLine: 1,
      endLine: 2,
    }, {
      projectId: 'core',
      entityId: 'src/b.ts::function::b',
      filePath: 'src/b.ts',
      symbol: 'function::b',
      kind: 'function',
      name: 'b',
      startLine: 1,
      endLine: 2,
    }],
  });
  const next = createSymbolSnapshot({
    repositoryRoot: '/repo',
    revision: { commit: 'next123' },
    projects: [{ id: 'core', root: '.' }],
    symbols: [{
      projectId: 'core',
      entityId: 'src/a.ts::function::a',
      filePath: 'src/a.ts',
      symbol: 'function::a',
      kind: 'function',
      name: 'a',
      startLine: 1,
      endLine: 4,
    }, {
      projectId: 'core',
      entityId: 'src/c.ts::function::c',
      filePath: 'src/c.ts',
      symbol: 'function::c',
      kind: 'function',
      name: 'c',
      startLine: 1,
      endLine: 2,
    }],
  });
  const diff = diffSymbolSnapshots(base, next);
  assert.deepEqual(diff.added.map((entry) => entry.symbol), ['function::c']);
  assert.deepEqual(diff.removed.map((entry) => entry.symbol), ['function::b']);
  assert.equal(diff.modified.length, 1);
  assert.equal(diff.modified[0]?.before.endLine, 2);
  assert.equal(diff.modified[0]?.after.endLine, 4);
});
