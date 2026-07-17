const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  RepositoryStateError,
  MAX_SEM_CLIENT_BUFFER_BYTES,
  MAX_SEM_CLIENT_TIMEOUT_MS,
  SemClient,
  WorkContextInputError,
  WORK_CONTEXT_SCHEMA,
  WorkContextService,
  renderWorkContextText,
  selectWorkContextHops,
} = require('../dist');

const fakeBinary = path.join(__dirname, 'fixtures', 'fake-sem.cjs');

function createFixtureRepository() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sem-doc-work-context-'));
  mkdirSync(path.join(root, 'src'), { recursive: true });
  mkdirSync(path.join(root, 'managed'), { recursive: true });
  writeFileSync(
    path.join(root, 'src', 'auth.ts'),
    'export function authenticateUser() { return true; }\n'
  );
  writeFileSync(
    path.join(root, 'managed', 'authentication.md'),
    [
      '---',
      'semEntityId: src/auth.ts::function::authenticateUser',
      'semEntityName: authenticateUser',
      'semEntityType: function',
      'semEntityFile: src/auth.ts',
      '---',
      '# [[authenticateUser]]',
      '',
      'Authentication behavior.',
      '',
    ].join('\n')
  );
  writeFileSync(
    path.join(root, 'managed', 'architecture.md'),
    '# [[Architecture]]\n\nThe flow uses [[authenticateUser]].\n'
  );
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'sem-doc@example.test'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'sem-doc test'], { cwd: root });
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: root });
  return root;
}

test('composes sem impact/context with canonical document definitions and backlinks', () => {
  const repositoryRoot = createFixtureRepository();
  const report = new WorkContextService({
    client: new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] }),
  }).analyze({
    repositoryRoot,
    entity: 'authenticateUser',
    docsRoot: 'managed',
  });

  assert.equal(report.schemaVersion, WORK_CONTEXT_SCHEMA);
  assert.equal(report.engine.version, '0.21.0');
  assert.equal(report.sem.impact.payload.entity.name, 'authenticateUser');
  assert.equal(report.sem.context.payload.entries.length, 2);
  assert.equal(report.symbols.maxHops, 2);
  assert.equal(report.symbols.complete, true);
  assert.deepEqual(
    report.symbols.entries.map(({ entity, hop }) => [entity.name, hop]),
    [
      ['authenticateUser', 0],
      ['UserRepository', 1],
      ['AuthController', 2],
    ]
  );
  assert.deepEqual(
    report.affectedTests.entries.map((entity) => entity.name),
    ['authenticateUserTest']
  );
  assert.equal(report.affectedTests.complete, true);
  assert.deepEqual(report.usageFiles, ['src/repository.ts']);
  assert.deepEqual(report.sem.impact.args.slice(0, 3), ['authenticateUser', '--depth', '2']);
  assert.deepEqual(report.sem.context.args.slice(-3), ['--hops', '2', '--json']);
  assert.equal(report.documents.target.definitions[0].documentPath, 'authentication.md');
  assert.equal(report.documents.target.status, 'resolved');
  assert.equal(report.documents.target.symbol, 'authenticateUser');
  assert.deepEqual(report.documents.target.backlinks.sort(), [
    'architecture.md',
    'authentication.md',
  ]);
  const text = renderWorkContextText(report);
  assert.match(text, /Affected tests: 1/);
  for (const symbol of [
    'authenticateUser',
    'UserRepository',
    'authenticateUserTest',
    'AuthController',
  ]) {
    assert.match(text, new RegExp(symbol));
  }
  assert.match(text, /Symbols \(3, complete through 2 hops\)/);
  assert.match(text, /Affected Tests \(1, complete; hop only when listed above\)/);
  assert.match(report.revision.workingTreeDigest, /^[a-f0-9]{64}$/);
});

test('keeps the symbol inventory complete when content is token-truncated', () => {
  const repositoryRoot = createFixtureRepository();
  const report = new WorkContextService({
    client: new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] }),
  }).analyze({
    repositoryRoot,
    entity: 'authenticateUser',
    docsRoot: 'managed',
    budget: 1,
  });

  assert.equal(report.sem.context.payload.truncated, true);
  assert.equal(report.sem.context.payload.entries.length, 0);
  assert.equal(report.symbols.complete, true);
  assert.deepEqual(
    report.symbols.entries.map(({ entity }) => entity.name),
    ['authenticateUser', 'UserRepository', 'AuthController']
  );
  assert.deepEqual(
    report.affectedTests.entries.map(({ name }) => name),
    ['authenticateUserTest']
  );
});

test('does not attach a same-named document with different entity provenance', () => {
  const repositoryRoot = createFixtureRepository();
  writeFileSync(
    path.join(repositoryRoot, 'managed', 'authentication.md'),
    [
      '---',
      'semEntityId: src/other.ts::function::authenticateUser',
      'semEntityName: authenticateUser',
      'semEntityType: function',
      'semEntityFile: src/other.ts',
      '---',
      '# [[Other Authentication Entry]]',
      '',
    ].join('\n')
  );
  const report = new WorkContextService({
    client: new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] }),
  }).analyze({ repositoryRoot, entity: 'authenticateUser', docsRoot: 'managed' });

  assert.equal(report.documents.target.status, 'unresolved');
  assert.equal(report.documents.target.definitions.length, 0);
  assert.deepEqual(
    report.documents.target.candidates.map(({ symbol }) => symbol),
    ['Other Authentication Entry']
  );
  assert.match(renderWorkContextText(report), /Same-name candidate: authentication\.md/);
});

test('limits work-context traversal to one or two hops', () => {
  const repositoryRoot = createFixtureRepository();
  const client = new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] });
  const oneHop = new WorkContextService({ client }).analyze({
    repositoryRoot,
    entity: 'authenticateUser',
    docsRoot: 'managed',
    depth: 1,
  });

  assert.equal(oneHop.symbols.maxHops, 1);
  assert.deepEqual(
    oneHop.symbols.entries.map(({ entity }) => entity.name),
    ['authenticateUser', 'UserRepository']
  );
  assert.deepEqual(
    oneHop.affectedTests.entries.map(({ name }) => name),
    ['authenticateUserTest']
  );
  assert.deepEqual(oneHop.sem.impact.args.slice(0, 3), ['authenticateUser', '--depth', '1']);
  assert.deepEqual(oneHop.sem.context.args.slice(-3), ['--hops', '1', '--json']);
  for (const depth of [0, 3]) {
    assert.throws(
      () =>
        new WorkContextService({ client }).analyze({
          repositoryRoot,
          entity: 'authenticateUser',
          depth,
        }),
      /depth must be either 1 or 2/
    );
  }
});

test('derives a one-hop view from one cached two-hop inventory', () => {
  const repositoryRoot = createFixtureRepository();
  const report = new WorkContextService({
    client: new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] }),
  }).analyze({ repositoryRoot, entity: 'authenticateUser', docsRoot: 'managed', depth: 2 });

  const oneHop = selectWorkContextHops(report.symbols, 1);
  assert.equal(oneHop.maxHops, 1);
  assert.equal(oneHop.complete, true);
  assert.deepEqual(
    oneHop.entries.map(({ entity }) => entity.name),
    ['authenticateUser', 'UserRepository']
  );
  assert.throws(() => selectWorkContextHops(oneHop, 2), /cannot derive 2-hop view/);
});

test('adds a test role only when sem impact reports a bounded hop for that entity', () => {
  const repositoryRoot = createFixtureRepository();
  const report = new WorkContextService({
    client: new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] }),
  }).analyze({
    repositoryRoot,
    entity: 'testInImpact',
    docsRoot: 'managed',
  });

  const testSymbol = report.symbols.entries.find(
    ({ entity }) => entity.name === 'authenticateUserTest'
  );
  assert.equal(testSymbol.hop, 2);
  assert.deepEqual(testSymbol.roles, ['test', 'transitive']);
  assert.deepEqual(
    report.affectedTests.entries.map(({ name }) => name),
    ['authenticateUserTest']
  );
});

test('rejects a truncated test entity list instead of returning partial symbols', () => {
  const repositoryRoot = createFixtureRepository();
  const client = new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] });

  assert.throws(
    () =>
      new WorkContextService({ client }).analyze({
        repositoryRoot,
        entity: 'truncatedTests',
        docsRoot: 'managed',
      }),
    /truncated the test entity list/
  );
});

test('rejects repository-outside inputs before running sem', () => {
  const repositoryRoot = createFixtureRepository();
  const client = new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] });
  assert.throws(
    () =>
      new WorkContextService({ client }).analyze({
        repositoryRoot,
        entity: 'authenticateUser',
        file: '../outside.ts',
      }),
    WorkContextInputError
  );
});

test('bounds aggregate work-context execution options before running sem', () => {
  const repositoryRoot = createFixtureRepository();
  const client = new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] });
  for (const options of [
    { timeoutMs: MAX_SEM_CLIENT_TIMEOUT_MS + 1 },
    { maxOutputBytes: MAX_SEM_CLIENT_BUFFER_BYTES + 1 },
  ]) {
    assert.throws(
      () => new WorkContextService({ client }).analyze({
        repositoryRoot,
        entity: 'authenticateUser',
        docsRoot: 'managed',
        ...options,
      }),
      WorkContextInputError,
    );
  }
});

test('rejects a report when the repository changes during sem analysis', () => {
  const repositoryRoot = createFixtureRepository();
  const base = {
    repositoryRoot,
    gitHead: 'fixture',
    workingTreeDigest: 'a'.repeat(64),
  };
  const changed = { ...base, workingTreeDigest: 'b'.repeat(64) };
  let reads = 0;
  const revisionReader = {
    read() {
      reads += 1;
      return reads === 1 ? base : changed;
    },
  };
  const client = new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] });
  assert.throws(
    () =>
      new WorkContextService({ client, revisionReader }).analyze({
        repositoryRoot,
        entity: 'authenticateUser',
        docsRoot: 'managed',
      }),
    RepositoryStateError
  );
  assert.equal(reads, 2);
});
