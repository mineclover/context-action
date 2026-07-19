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
  assert.equal(readContextScopeHistoryStream(outputPath).length, 2);
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
