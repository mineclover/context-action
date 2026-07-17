const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { DocumentIndexError, indexDocuments } = require('../dist');

test('keeps sem-style case-sensitive entity names separate in document links', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sem-doc-index-'));
  mkdirSync(path.join(root, 'nested'));
  writeFileSync(path.join(root, 'Foo.MD'), '# [[Foo]]\n');
  writeFileSync(path.join(root, 'nested', 'lower.md'), 'Uses [[foo]].\n');

  const index = indexDocuments(root);
  assert.equal(index.files, 2);
  assert.deepEqual(index.lookup('Foo').backlinks, ['Foo.MD']);
  assert.deepEqual(index.lookup('foo').backlinks, ['nested/lower.md']);
  assert.equal(index.missingReferences.length, 1);
});

test('binds a unique document checkpoint to exact sem entity provenance', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sem-doc-index-binding-'));
  writeFileSync(
    path.join(root, 'imported-a.md'),
    [
      '---',
      'semEntityId: src/a.ts::variable::a',
      'semEntityName: a',
      'semEntityType: variable',
      'semEntityFile: src/a.ts',
      '---',
      '# [[Imported A Constant]]',
      '',
      'Explains the source of [[Imported A Constant]].',
      '',
    ].join('\n')
  );

  const index = indexDocuments(root);
  const resolved = index.lookupEntity({
    id: 'src/a.ts::variable::a',
    name: 'a',
    type: 'variable',
    file: 'src/a.ts',
  });
  const sameNameElsewhere = index.lookupEntity({
    id: 'src/b.ts::variable::a',
    name: 'a',
    type: 'variable',
    file: 'src/b.ts',
  });

  assert.equal(resolved.status, 'resolved');
  assert.equal(resolved.symbol, 'Imported A Constant');
  assert.deepEqual(resolved.backlinks, ['imported-a.md']);
  assert.equal(sameNameElsewhere.status, 'unresolved');
  assert.equal(sameNameElsewhere.definitions.length, 0);
  assert.deepEqual(
    sameNameElsewhere.candidates.map(({ documentPath }) => documentPath),
    ['imported-a.md']
  );
});

test('rejects incomplete and duplicate SSOT bindings', () => {
  const incompleteRoot = mkdtempSync(path.join(os.tmpdir(), 'sem-doc-index-incomplete-'));
  writeFileSync(
    path.join(incompleteRoot, 'incomplete.md'),
    '---\nsemEntityId: entity-a\n---\n# [[Entity A]]\n'
  );
  assert.throws(() => indexDocuments(incompleteRoot), DocumentIndexError);

  const duplicateRoot = mkdtempSync(path.join(os.tmpdir(), 'sem-doc-index-duplicate-'));
  writeFileSync(path.join(duplicateRoot, 'one.md'), '# [[Duplicate]]\n');
  writeFileSync(path.join(duplicateRoot, 'two.md'), '# [[Duplicate]]\n');
  assert.throws(() => indexDocuments(duplicateRoot), /Duplicate canonical document definition/);

  const duplicateEntityRoot = mkdtempSync(
    path.join(os.tmpdir(), 'sem-doc-index-duplicate-entity-')
  );
  const binding = [
    '---',
    'semEntityId: src/a.ts::variable::a',
    'semEntityName: a',
    'semEntityType: variable',
    'semEntityFile: src/a.ts',
    '---',
  ];
  writeFileSync(
    path.join(duplicateEntityRoot, 'one.md'),
    [...binding, '# [[First A]]', ''].join('\n')
  );
  writeFileSync(
    path.join(duplicateEntityRoot, 'two.md'),
    [...binding, '# [[Second A]]', ''].join('\n')
  );
  assert.throws(() => indexDocuments(duplicateEntityRoot), /Duplicate sem entity binding/);
});

test('ignores checkpoint examples inside fenced code blocks', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sem-doc-index-fence-'));
  writeFileSync(
    path.join(root, 'real.md'),
    '# [[Real Checkpoint]]\n\n```markdown\n# [[Example Only]]\nUses [[Missing Example]].\n```\n'
  );

  const index = indexDocuments(root);
  assert.deepEqual(
    index.definitions.map(({ symbol }) => symbol),
    ['Real Checkpoint']
  );
  assert.equal(index.lookup('Example Only').definitions.length, 0);
  assert.equal(index.missingReferences.length, 0);
});
