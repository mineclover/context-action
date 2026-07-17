const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, unlinkSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  GIT_DIFF_SCHEMA,
  GitDiffError,
  GitDiffService,
  MAX_GIT_DIFF_BUFFER_BYTES,
  MAX_GIT_DIFF_CONTEXT_LINES,
  MAX_GIT_DIFF_PATHS,
} = require('../dist');

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

function createFixtureRepository() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sem-doc-git-diff-'));
  mkdirSync(path.join(root, 'src'), { recursive: true });
  writeFileSync(path.join(root, 'src', 'tracked.ts'), 'first\nkeep\nold\n');
  writeFileSync(path.join(root, 'src', 'staged.ts'), 'base\n');
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'sem-doc@example.test']);
  git(root, ['config', 'user.name', 'sem-doc test']);
  git(root, ['add', '.']);
  git(root, ['commit', '-qm', 'fixture']);
  return root;
}

test('creates a revision-pinned working-tree diff with untracked files and hunks', () => {
  const root = createFixtureRepository();
  writeFileSync(path.join(root, 'src', 'tracked.ts'), 'first\nkeep\nnew\nadded\n');
  writeFileSync(path.join(root, 'src', 'new.ts'), 'export const created = true;\n');

  const report = new GitDiffService().analyze({ repositoryRoot: root, contextLines: 1 });
  const tracked = report.files.find((file) => file.path === 'src/tracked.ts');
  const untracked = report.files.find((file) => file.path === 'src/new.ts');

  assert.equal(report.schemaVersion, GIT_DIFF_SCHEMA);
  assert.equal(report.source, 'git');
  assert.equal(report.scope, 'working-tree');
  assert.equal(report.includeUntracked, true);
  assert.equal(report.summary.modified, 1);
  assert.equal(report.summary.untracked, 1);
  assert.equal(tracked.change, 'modified');
  assert.equal(tracked.additions, 2);
  assert.equal(tracked.deletions, 1);
  assert.equal(tracked.hunks.length, 1);
  assert.ok(
    tracked.hunks[0].lines.some((line) => line.kind === 'deleted' && line.content === 'old')
  );
  assert.ok(
    tracked.hunks[0].lines.some((line) => line.kind === 'added' && line.content === 'added')
  );
  assert.equal(untracked.change, 'untracked');
  assert.equal(untracked.additions, 1);
  assert.equal(untracked.deletions, 0);
  assert.match(report.revision.workingTreeDigest, /^[a-f0-9]{64}$/);
});

test('staged mode reads the index and excludes untracked files by default', () => {
  const root = createFixtureRepository();
  writeFileSync(path.join(root, 'src', 'staged.ts'), 'index-value\n');
  git(root, ['add', 'src/staged.ts']);
  writeFileSync(path.join(root, 'src', 'staged.ts'), 'working-tree-value\n');
  writeFileSync(path.join(root, 'src', 'untracked.ts'), 'ignored-in-staged\n');

  const report = new GitDiffService().analyze({ repositoryRoot: root, staged: true });
  assert.equal(report.scope, 'staged');
  assert.equal(report.includeUntracked, false);
  assert.deepEqual(
    report.files.map((file) => file.path),
    ['src/staged.ts']
  );
  assert.ok(
    report.files[0].hunks.some((hunk) => hunk.lines.some((line) => line.content === 'index-value'))
  );
  assert.ok(
    !report.files[0].hunks.some((hunk) =>
      hunk.lines.some((line) => line.content === 'working-tree-value')
    )
  );
});

test('supports staged and working-tree diffs before the first commit', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sem-doc-git-diff-unborn-'));
  mkdirSync(path.join(root, 'src'), { recursive: true });
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'sem-doc@example.test']);
  git(root, ['config', 'user.name', 'sem-doc test']);
  writeFileSync(path.join(root, 'src', 'staged.ts'), 'staged\n');
  git(root, ['add', 'src/staged.ts']);
  writeFileSync(path.join(root, 'src', 'working.ts'), 'working\n');

  const staged = new GitDiffService().analyze({ repositoryRoot: root, staged: true });
  assert.deepEqual(staged.files.map((file) => file.path), ['src/staged.ts']);
  assert.equal(staged.files[0].change, 'added');
  assert.ok(staged.files[0].hunks.some((hunk) =>
    hunk.lines.some((line) => line.content === 'staged')));

  const working = new GitDiffService().analyze({ repositoryRoot: root });
  assert.deepEqual(
    working.files.map((file) => file.path).sort(),
    ['src/staged.ts', 'src/working.ts'],
  );
  assert.equal(working.files.find((file) => file.path === 'src/staged.ts').change, 'added');
  assert.equal(working.files.find((file) => file.path === 'src/working.ts').change, 'untracked');

  unlinkSync(path.join(root, 'src', 'staged.ts'));
  const deleted = new GitDiffService().analyze({ repositoryRoot: root });
  const deletedFile = deleted.files.find((file) => file.path === 'src/staged.ts');
  assert.equal(deletedFile.change, 'deleted');
  assert.equal(deletedFile.additions, 0);
  assert.equal(deletedFile.deletions, 0);
});

test('does not turn Git show failures into empty content', () => {
  const root = createFixtureRepository();
  assert.throws(
    () => new GitDiffService().readGitContent(root, 'HEAD:src/does-not-exist.ts'),
    (error) => error instanceof GitDiffError && /Git show failed/.test(error.message),
  );
});

test('rejects paths outside the repository and stale repository reads', () => {
  const root = createFixtureRepository();
  assert.throws(
    () => new GitDiffService().analyze({ repositoryRoot: root, paths: ['../outside.ts'] }),
    GitDiffError
  );

  let reads = 0;
  const initial = { repositoryRoot: root, gitHead: 'fixture', workingTreeDigest: 'a'.repeat(64) };
  const changed = { ...initial, workingTreeDigest: 'b'.repeat(64) };
  assert.throws(
    () =>
      new GitDiffService({
        revisionReader: {
          read() {
            reads += 1;
            return reads === 1 ? initial : changed;
          },
        },
      }).analyze({ repositoryRoot: root }),
    /Repository changed while Git diff was running/
  );
  assert.equal(reads, 2);
});

test('bounds Git subprocess buffers and diff request cardinality', () => {
  const root = createFixtureRepository();
  assert.throws(
    () => new GitDiffService({ maxBufferBytes: MAX_GIT_DIFF_BUFFER_BYTES + 1 }),
    /maxBufferBytes must be a safe integer/,
  );
  assert.throws(
    () => new GitDiffService().analyze({
      repositoryRoot: root,
      contextLines: MAX_GIT_DIFF_CONTEXT_LINES + 1,
    }),
    /contextLines must be an integer between 0 and 4096/,
  );
  assert.throws(
    () => new GitDiffService().analyze({
      repositoryRoot: root,
      paths: Array.from({ length: MAX_GIT_DIFF_PATHS + 1 }, () => 'src'),
    }),
    /paths exceeds 4096 items/,
  );
  assert.throws(
    () => new GitDiffService().analyze({ repositoryRoot: root, paths: [123] }),
    /Diff path must be text/,
  );
});
