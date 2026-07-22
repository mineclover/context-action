const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, realpathSync, symlinkSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  CONTEXT_SCOPE_MANIFEST_SCHEMA,
  ContextScopeHistoryService,
  ContextScopeHistoryReport,
  CONTEXT_SCOPE_HISTORY_SCHEMA,
  ContextScopeHistoryService: HistoryService,
  ContextScopeHistoryRequest,
  ContextScopeManifest,
  ContextScopeDiff,
  ContextScopeWorkContextSource,
  createContextScope,
  createContextScopeFromReports,
  diffContextScopes,
  parseContextScope,
  parseContextScopeManifest,
  compareContextScopeBranches,
  readContextScopeHistoryStream,
  SemClient,
  WorkContextService,
} = require('../dist');

const fakeBinary = path.join(__dirname, 'fixtures', 'fake-sem.cjs');

function createFixtureRepository() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sem-doc-scope-'));
  mkdirSync(path.join(root, 'src'), { recursive: true });
  mkdirSync(path.join(root, 'managed'), { recursive: true });
  writeFileSync(path.join(root, 'src', 'auth.ts'), 'export function authenticateUser() { return true; }\n');
  writeFileSync(path.join(root, 'src', 'secondary.ts'), 'export function secondary() { return true; }\n');
  writeFileSync(path.join(root, 'managed', 'auth.md'), '# authenticateUser\n');
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'sem-doc@example.test'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'sem-doc test'], { cwd: root });
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'initial'], { cwd: root });
  return root;
}

function service() {
  return new WorkContextService({
    client: new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] }),
  });
}

test('validates and combines a multi-anchor manifest with reproducible sources', () => {
  const repositoryRoot = createFixtureRepository();
  const first = service().analyze({ repositoryRoot, entity: 'authenticateUser' });
  const second = service().analyze({ repositoryRoot, entity: 'secondary' });
  const manifest = {
    schemaVersion: CONTEXT_SCOPE_MANIFEST_SCHEMA,
    id: 'checkout-flow',
    kind: 'workflow',
    anchors: [
      { role: 'root', entity: 'authenticateUser' },
      { role: 'trigger', entity: 'secondary' },
    ],
  };
  assert.deepEqual(parseContextScopeManifest(JSON.parse(JSON.stringify(manifest))), manifest);
  const scope = createContextScopeFromReports([first, second], {
    projectId: 'example',
    manifest,
    maxNodes: 32,
    maxEdges: 32,
  });
  assert.equal(scope.context.id, 'checkout-flow');
  assert.equal(scope.anchors.length, 2);
  assert.equal(scope.source.workContexts.length, 2);
  assert.match(scope.source.workContextDigest, /^[a-f0-9]{64}$/u);
  assert.equal(scope.groups[0].id, 'context:checkout-flow');
  assert.equal(scope.documentEvidence.length, 2);
  assert.ok(scope.documentEvidence.every(({ target }) => target.status === 'unresolved'));
  assert.deepEqual(parseContextScope(JSON.parse(JSON.stringify(scope))), scope);
  assert.throws(
    () => parseContextScopeManifest({ ...manifest, anchors: [...manifest.anchors, manifest.anchors[0]] }),
    /manifest\.anchors contains duplicate values/,
  );
});

test('computes deterministic symbol and edge deltas between serialized scopes', () => {
  const repositoryRoot = createFixtureRepository();
  const report = service().analyze({ repositoryRoot, entity: 'authenticateUser' });
  const before = createContextScope(report, { projectId: 'example' });
  const extra = {
    projectId: 'example',
    filePath: 'src/new.ts',
    entityId: 'src/new.ts::function::newSymbol',
  };
  const after = {
    ...before,
    nodes: [...before.nodes, extra],
  };
  const diff = diffContextScopes(before, after);
  assert.deepEqual(diff.summary, {
    addedNodes: 1,
    removedNodes: 0,
    addedEdges: 0,
    removedEdges: 0,
    addedGroups: 0,
    removedGroups: 0,
    changedGroups: 0,
  });
  assert.deepEqual(diff.addedNodes, [extra]);
});

test('materializes bounded scopes for Git commit history and cleans worktrees', async () => {
  const repositoryRoot = createFixtureRepository();
  writeFileSync(path.join(repositoryRoot, 'src', 'change.ts'), 'export const change = true;\n');
  execFileSync('git', ['add', '.'], { cwd: repositoryRoot });
  execFileSync('git', ['commit', '-qm', 'second'], { cwd: repositoryRoot });
  writeFileSync(path.join(repositoryRoot, 'src', 'change.ts'), 'export const change = false;\n');
  execFileSync('git', ['add', '.'], { cwd: repositoryRoot });
  execFileSync('git', ['commit', '-qm', 'third'], { cwd: repositoryRoot });
  const from = execFileSync('git', ['rev-parse', 'HEAD~2'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
  const to = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
  const report = await new ContextScopeHistoryService({
    workContextServiceFactory: () => service(),
  }).analyze({
    repositoryRoot,
    from,
    to,
    entity: 'authenticateUser',
    projectId: 'example',
    maxCommits: 4,
    includeNodeModulesSurface: true,
  });
  assert.equal(report.schemaVersion, CONTEXT_SCOPE_HISTORY_SCHEMA);
  assert.equal(report.entries.length, 2);
  assert.ok(report.entries[0].diff);
  assert.equal(report.entries[0].scope.source.repositoryRoot, realpathSync(repositoryRoot));
  assert.equal(report.entries[0].scope.source.revision.gitHead, report.entries[0].commit);
  assert.ok(report.entries[1].diff);
  assert.equal(report.execution.timeoutMs, 120000);
  assert.ok(report.execution.usedOutputBytes > 0);
  assert.ok(report.execution.usedOutputBytes <= report.execution.maxOutputBytes);
  assert.equal(report.execution.phase, 'context-scope-history');
  assert.equal(report.execution.ownerId, 'sem-doc-history');
  assert.equal(report.execution.state, 'completed');
  assert.ok(Number.isSafeInteger(report.execution.elapsedMs));
  assert.ok(report.base.scope.source.request.impactArgs.includes('--no-default-excludes'));
  assert.ok(report.entries.every((entry) => entry.scope.source.request.contextArgs.includes('--no-default-excludes')));
});

test('streams commit scopes to NDJSON without retaining every entry in memory', async () => {
  const repositoryRoot = createFixtureRepository();
  writeFileSync(path.join(repositoryRoot, 'src', 'change.ts'), 'export const change = true;\n');
  execFileSync('git', ['add', '.'], { cwd: repositoryRoot });
  execFileSync('git', ['commit', '-qm', 'second'], { cwd: repositoryRoot });
  const from = execFileSync('git', ['rev-parse', 'HEAD~1'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
  const to = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
  const outputPath = path.join(repositoryRoot, 'managed', 'history.ndjson');
  const report = await new ContextScopeHistoryService({
    workContextServiceFactory: () => service(),
  }).analyze({
    repositoryRoot,
    from,
    to,
    entity: 'authenticateUser',
    projectId: 'example',
    outputPath,
  });
  assert.equal(report.storage.mode, 'ndjson');
  assert.equal(report.entries.length, 0);
  assert.equal(report.storage.entries, 1);
  assert.equal(readContextScopeHistoryStream(outputPath).length, 2);
});

test('rejects malformed history streams before branch comparison', () => {
  const repositoryRoot = createFixtureRepository();
  const report = service().analyze({ repositoryRoot, entity: 'authenticateUser' });
  const scope = createContextScope(report, { projectId: 'example' });
  const outputPath = path.join(repositoryRoot, 'managed', 'invalid-history.ndjson');
  writeFileSync(outputPath, `${JSON.stringify({
    schemaVersion: 'sem-doc-context-scope-history-stream.v1',
    recordType: 'entry',
    commit: 'entry',
    parent: 'base',
    subject: 'entry',
    scope,
    diff: diffContextScopes(scope, scope),
  })}\n`);
  assert.throws(
    () => readContextScopeHistoryStream(outputPath),
    /must start with one base record/,
  );
});

test('rejects a history output symlink that escapes the repository', async () => {
  const repositoryRoot = createFixtureRepository();
  const outsideRoot = mkdtempSync(path.join(os.tmpdir(), 'sem-doc-history-outside-'));
  const outsidePath = path.join(outsideRoot, 'history.ndjson');
  writeFileSync(outsidePath, 'existing\n');
  const outputPath = path.join(repositoryRoot, 'managed', 'history.ndjson');
  symlinkSync(outsidePath, outputPath);
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
  await assert.rejects(
    () => new ContextScopeHistoryService({ workContextServiceFactory: () => service() }).analyze({
      repositoryRoot,
      from: commit,
      to: commit,
      entity: 'authenticateUser',
      projectId: 'example',
      outputPath,
    }),
    /symlink target must remain inside the repository/u,
  );
});

test('extracts the common changed symbol set from two branch histories', () => {
  const repositoryRoot = createFixtureRepository();
  const report = service().analyze({ repositoryRoot, entity: 'authenticateUser' });
  const base = createContextScope(report, { projectId: 'example', contextId: 'flow' });
  const common = {
    projectId: 'example',
    filePath: 'src/common.ts',
    entityId: 'src/common.ts::function::common',
  };
  const leftOnly = {
    projectId: 'example',
    filePath: 'src/left.ts',
    entityId: 'src/left.ts::function::left',
  };
  const rightOnly = {
    projectId: 'example',
    filePath: 'src/right.ts',
    entityId: 'src/right.ts::function::right',
  };
  const leftScope = { ...base, nodes: [...base.nodes, common, leftOnly] };
  const rightScope = { ...base, nodes: [...base.nodes, common, rightOnly] };
  const comparison = compareContextScopeBranches(
    {
      base: { commit: 'aa', scope: base },
      entries: [{ commit: 'az', parent: 'aa', subject: 'left', scope: leftScope, diff: require('../dist').diffContextScopes(base, leftScope) }],
    },
    {
      base: { commit: 'aa', scope: base },
      entries: [{ commit: 'bz', parent: 'aa', subject: 'right', scope: rightScope, diff: require('../dist').diffContextScopes(base, rightScope) }],
    },
  );
  assert.equal(comparison.summary.commonNodes, 1);
  assert.deepEqual(comparison.intersection.nodes, [common]);
});

test('streams a larger synthetic history without retaining materialized entries', async () => {
  const repositoryRoot = createFixtureRepository();
  const baseReport = service().analyze({ repositoryRoot, entity: 'authenticateUser' });
  const baseCommit = 'a'.repeat(40);
  const commitId = (index) => {
    const prefix = index.toString(16).padStart(2, '0');
    return `${prefix}${'a'.repeat(40 - prefix.length)}`;
  };
  const commits = Array.from({ length: 48 }, (_, index) => ({
    commit: commitId(index + 1),
    parent: index === 0 ? baseCommit : commitId(index),
    subject: `synthetic-${index + 1}`,
  }));
  const historyReader = {
    listRange(options) {
      assert.equal(options.maxCommits, commits.length);
      return commits;
    },
  };
  const worktreeManager = {
    resolveCommit(ref) {
      assert.equal(ref, 'BASE');
      return baseCommit;
    },
    withCommit(_commit, callback) {
      return callback(repositoryRoot);
    },
    async withCommitRange(records, callback, maxCommits) {
      assert.equal(records.length, commits.length);
      assert.equal(maxCommits, commits.length);
      const results = [];
      for (const record of records) results.push(await callback(record, repositoryRoot));
      return results;
    },
  };
  const outputPath = path.join(repositoryRoot, 'managed', 'synthetic-history.ndjson');
  const report = await new ContextScopeHistoryService({
    historyReader,
    worktreeManager,
    workContextServiceFactory: () => ({ analyze: () => baseReport }),
  }).analyze({
    repositoryRoot,
    from: 'BASE',
    to: 'HEAD',
    entity: 'authenticateUser',
    projectId: 'example',
    maxCommits: commits.length,
    outputPath,
  });

  assert.equal(report.storage.mode, 'ndjson');
  assert.equal(report.entries.length, 0);
  assert.equal(report.storage.entries, commits.length);
  assert.equal(report.summary.commits, commits.length);
  assert.equal(report.summary.changedCommits, 0);
  const records = readContextScopeHistoryStream(outputPath);
  assert.equal(records.length, commits.length + 1);
  assert.equal(records[0].recordType, 'base');
  assert.deepEqual(
    records.slice(1, 4).map((record) => record.commit),
    commits.slice(0, 3).map(({ commit }) => commit),
  );
});

test('computes a deterministic intersection for large branch change sets', () => {
  const repositoryRoot = createFixtureRepository();
  const report = service().analyze({ repositoryRoot, entity: 'authenticateUser' });
  const base = createContextScope(report, { projectId: 'example', contextId: 'large-flow' });
  const symbol = (name) => ({
    projectId: 'example',
    filePath: `src/${name}.ts`,
    entityId: `src/${name}.ts::function::${name}`,
  });
  const common = Array.from({ length: 128 }, (_, index) => symbol(`common${index}`));
  const leftOnly = Array.from({ length: 64 }, (_, index) => symbol(`left${index}`));
  const rightOnly = Array.from({ length: 64 }, (_, index) => symbol(`right${index}`));
  const leftScope = { ...base, nodes: [...base.nodes, ...common, ...leftOnly] };
  const rightScope = { ...base, nodes: [...base.nodes, ...common, ...rightOnly] };
  const diff = require('../dist').diffContextScopes;
  const comparison = compareContextScopeBranches(
    {
      base: { commit: 'aa', scope: base },
      entries: [{
        commit: 'az',
        parent: 'aa',
        subject: 'left-large',
        scope: leftScope,
        diff: diff(base, leftScope),
      }],
    },
    {
      base: { commit: 'aa', scope: base },
      entries: [{
        commit: 'bz',
        parent: 'aa',
        subject: 'right-large',
        scope: rightScope,
        diff: diff(base, rightScope),
      }],
    },
  );

  assert.equal(comparison.summary.leftNodes, common.length + leftOnly.length);
  assert.equal(comparison.summary.rightNodes, common.length + rightOnly.length);
  assert.equal(comparison.summary.commonNodes, common.length);
  assert.deepEqual(
    comparison.intersection.nodes.map(({ entityId }) => entityId).sort(),
    common.map(({ entityId }) => entityId).sort(),
  );
  const repeated = compareContextScopeBranches(
    {
      base: { commit: 'aa', scope: base },
      entries: [{
        commit: 'az',
        parent: 'aa',
        subject: 'left-large',
        scope: leftScope,
        diff: diff(base, leftScope),
      }],
    },
    {
      base: { commit: 'aa', scope: base },
      entries: [{
        commit: 'bz',
        parent: 'aa',
        subject: 'right-large',
        scope: rightScope,
        diff: diff(base, rightScope),
      }],
    },
  );
  assert.deepEqual(repeated.intersection.nodes, comparison.intersection.nodes);
});
