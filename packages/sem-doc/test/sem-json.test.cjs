const assert = require('node:assert/strict');
const test = require('node:test');

const {
  foundationSymbolSnapshotEntry,
  MAX_SEM_JSON_ARRAY_ITEMS,
  parseSemDiff,
  parseSemEntities,
  parseSemImpact,
  SemSchemaError,
} = require('../dist');

test('derives canonical IDs from top-level sem entities JSON rows', () => {
  const entities = parseSemEntities([
    {
      name: 'authenticateUser',
      type: 'function',
      start_line: 1,
      end_line: 4,
      file: 'src/auth.ts',
    },
  ]);

  assert.equal(entities[0].name, 'authenticateUser');
  assert.equal(entities[0].file, 'src/auth.ts');
  assert.equal(entities[0].startLine, 1);
  assert.equal(entities[0].endLine, 4);
  assert.equal(entities[0].id, 'src/auth.ts::function::authenticateUser');
});

test('derives scoped canonical IDs from parent_id', () => {
  const entities = parseSemEntities([
    {
      name: 'analyze',
      type: 'method',
      file: 'src/validator.ts',
      parent_id: 'src/validator.ts::class::Validator',
      start_line: 8,
      end_line: 12,
    },
  ]);

  assert.equal(entities[0].id, 'src/validator.ts::class::Validator::analyze');
  assert.equal(entities[0].parentId, 'src/validator.ts::class::Validator');
});

test('adapts parsed SEM entities to complete snapshot entries', () => {
  const entity = parseSemEntities([{
    name: 'authenticateUser',
    type: 'function',
    file: './src/auth.ts',
    start_line: 2,
    end_line: 4,
  }])[0];
  assert.deepEqual(foundationSymbolSnapshotEntry(entity, 'core'), {
    projectId: 'core',
    entityId: 'src/auth.ts::function::authenticateUser',
    filePath: 'src/auth.ts',
    symbol: 'function::authenticateUser',
    kind: 'function',
    name: 'authenticateUser',
    startLine: 2,
    endLine: 4,
  });
});

test('normalizes diff JSON while preserving change provenance fields', () => {
  const diff = parseSemDiff({
    summary: { fileCount: 1, added: 0, modified: 1, deleted: 0, total: 1 },
    changes: [
      {
        entityId: 'src/auth.ts::function::authenticateUser',
        entityName: 'authenticateUser',
        entityType: 'function',
        filePath: 'src/auth.ts',
        startLine: 1,
        endLine: 4,
        changeType: 'modified',
        commitSha: 'abc123',
        structuralChange: true,
      },
    ],
  });

  assert.equal(diff.summary.modified, 1);
  assert.equal(diff.changes[0].id, 'src/auth.ts::function::authenticateUser');
  assert.equal(diff.changes[0].structuralChange, true);
});

test('rejects malformed sem entity JSON instead of treating it as evidence', () => {
  assert.throws(
    () => parseSemEntities([{ name: 'missing-file', type: 'function' }]),
    SemSchemaError
  );
});

test('rejects empty explicit and parent identities', () => {
  for (const entity of [
    { id: '', name: 'Broken', type: 'function', file: 'src/broken.ts' },
    { entityId: '   ', name: 'Broken', type: 'function', file: 'src/broken.ts' },
    {
      name: 'Broken',
      type: 'method',
      parent_id: '',
      file: 'src/broken.ts',
    },
  ]) {
    assert.throws(() => parseSemEntities([entity]), SemSchemaError);
  }
});

test('omits invalid catalog ranges while rejecting invalid evidence counters', () => {
  const entities = parseSemEntities([
    { name: 'BrokenRange', type: 'property', file: 'config.json', start_line: 8, end_line: 3 },
  ]);
  assert.equal(entities[0].startLine, undefined);
  assert.equal(entities[0].endLine, undefined);
  assert.throws(
    () =>
      parseSemImpact({
        entity: { name: 'Broken', type: 'function', file: 'src/broken.ts' },
        dependencies: [],
        dependents: [],
        impact: { depth: 1, total: -1, entities: [] },
        tests: [],
      }),
    SemSchemaError
  );
});

test('normalizes snake-case impact truncation metadata', () => {
  const impact = parseSemImpact({
    entity: { name: 'Target', type: 'function', file: 'src/target.ts' },
    dependencies: [],
    dependents: [],
    impact: { depth: 1, total: 0, entities: [] },
    tests: [],
    tests_truncated: true,
  });

  assert.equal(impact.testsTruncated, true);
});

test('requires an explicit depth for every bounded impact entity', () => {
  assert.throws(
    () =>
      parseSemImpact({
        entity: { name: 'Target', type: 'function', file: 'src/target.ts' },
        dependencies: [],
        dependents: [],
        impact: {
          depth: 2,
          total: 1,
          entities: [{ name: 'Caller', type: 'function', file: 'src/caller.ts' }],
        },
        tests: [],
      }),
    SemSchemaError
  );
});

test('bounds SEM JSON collections before mapping their items', () => {
  assert.throws(
    () => parseSemEntities(Array.from({ length: MAX_SEM_JSON_ARRAY_ITEMS + 1 }, () => ({
      name: 'TooMany', type: 'function', file: 'src/too-many.ts',
    }))),
    (error) => error instanceof SemSchemaError
      && error.message.includes(`${MAX_SEM_JSON_ARRAY_ITEMS} items`),
  );
});
