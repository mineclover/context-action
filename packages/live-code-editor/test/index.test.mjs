import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertWorkspaceTextSourceLength,
  BrowserWorkspaceFileSystemAdapter,
  isPreviewBridgeMessage,
  languageForWorkspacePath,
  MAX_TEXT_SOURCE_LENGTH,
  normalizeWorkspacePath,
  selectWorkspaceActivePath,
  WorkspaceDocumentManager,
  WorkspaceToolError,
} from '../dist/index.js';

test('accepts a ready preview acknowledgement', () => {
  assert.equal(
    isPreviewBridgeMessage({
      type: 'context-action.preview.ready',
      revision: 4,
    }),
    true
  );
});

test('accepts an error preview acknowledgement', () => {
  assert.equal(
    isPreviewBridgeMessage({
      type: 'context-action.preview.error',
      revision: 4,
      message: 'Script failed',
    }),
    true
  );
});

test('rejects stale or malformed bridge payloads', () => {
  assert.equal(
    isPreviewBridgeMessage({
      type: 'context-action.preview.ready',
      revision: -1,
    }),
    false
  );
  assert.equal(
    isPreviewBridgeMessage({
      type: 'context-action.preview.error',
      revision: 4,
    }),
    false
  );
  assert.equal(isPreviewBridgeMessage(null), false);
});

test('normalizes workspace paths and rejects traversal', () => {
  assert.equal(normalizeWorkspacePath('src\\./main.js'), 'src/main.js');
  assert.throws(
    () => normalizeWorkspacePath('../main.js'),
    (error) =>
      error instanceof WorkspaceToolError &&
      error.code === 'WORKSPACE_PATH_INVALID'
  );
});

test('keeps source limits and active-file selection framework-neutral', () => {
  assert.equal(languageForWorkspacePath('styles.css'), 'css');
  assert.equal(
    selectWorkspaceActivePath([
      { path: 'README.md', language: 'markdown', source: '' },
      { path: 'app.js', language: 'javascript', source: '' },
    ]),
    'README.md'
  );
  assert.throws(
    () => assertWorkspaceTextSourceLength('x'.repeat(MAX_TEXT_SOURCE_LENGTH + 1)),
    (error) =>
      error instanceof WorkspaceToolError &&
      error.code === 'WORKSPACE_SOURCE_LIMIT'
  );
});

function createMemoryRepository() {
  let files = [];
  let activePath = 'index.html';
  let rootName = 'memory';
  let deletedPaths = [];

  const snapshot = () => ({
    rootName,
    activePath,
    files: files.map((file) => ({ ...file })),
    deletedPaths: [...deletedPaths],
  });

  return {
    ensureWorkspace(seedFiles) {
      if (files.length === 0) {
        files = seedFiles.map((file) => ({ ...file }));
      }
      return Promise.resolve(snapshot());
    },
    replaceWorkspace(nextFiles, nextActivePath, nextRootName, nextDeletedPaths = []) {
      files = nextFiles.map((file) => ({ ...file }));
      activePath = nextActivePath;
      rootName = nextRootName;
      deletedPaths = [...nextDeletedPaths];
      return Promise.resolve(snapshot());
    },
    saveFile(file) {
      files = [...files.filter((candidate) => candidate.path !== file.path), { ...file }];
      deletedPaths = deletedPaths.filter((path) => path !== file.path);
      return Promise.resolve();
    },
    deleteFile(path, options = {}) {
      files = files.filter((file) => file.path !== path);
      deletedPaths = options.trackPendingDeletion === false
        ? deletedPaths.filter((candidate) => candidate !== path)
        : [...new Set([...deletedPaths, path])];
      return Promise.resolve();
    },
    clearDeletedPaths() {
      deletedPaths = [];
      return Promise.resolve();
    },
    setActivePath(nextActivePath) {
      activePath = nextActivePath;
      return Promise.resolve();
    },
  };
}

test('workspace document manager is independently consumable through a repository', async () => {
  const repository = createMemoryRepository();
  const manager = new WorkspaceDocumentManager({
    repository,
    rootName: 'test-workspace',
    seedFiles: [
      { path: 'index.html', language: 'html', source: '<h1>Seed</h1>' },
      { path: 'app.js', language: 'javascript', source: 'console.log(1);' },
    ],
  });

  assert.equal(manager.getSnapshot().storageMode, 'loading');
  await manager.hydrate();
  assert.equal(manager.getSnapshot().storageMode, 'indexed-db');
  assert.equal(manager.getSnapshot().rootName, 'memory');

  const revision = manager.getSnapshot().revision;
  manager.updateFile('index.html', '<h1>Updated</h1>');
  await manager.waitForPersistence();
  assert.equal(manager.getFile('index.html').source, '<h1>Updated</h1>');
  assert.equal(manager.isDirty(), true);
  assert.equal(manager.getSnapshot().revision > revision, true);

  manager.undo();
  await manager.waitForPersistence();
  assert.equal(manager.getFile('index.html').source, '<h1>Seed</h1>');
});

test('rejects an empty folder and stale import revision before replacing the repository', async () => {
  const repository = createMemoryRepository();
  const manager = new WorkspaceDocumentManager({
    repository,
    seedFiles: [
      { path: 'index.html', language: 'html', source: '<h1>Seed</h1>' },
    ],
  });

  await manager.hydrate();
  await assert.rejects(
    manager.importFolder({ rootName: 'empty', files: [], skipped: ['image.exe'] }),
    (error) =>
      error instanceof WorkspaceToolError &&
      error.code === 'WORKSPACE_NO_SUPPORTED_FILES'
  );

  const observedRevision = manager.getSnapshot().revision;
  manager.updateFile('index.html', '<h1>Changed</h1>');
  await assert.rejects(
    manager.importFolder(
      {
        rootName: 'replacement',
        files: [
          { path: 'index.html', language: 'html', source: '<h1>Replacement</h1>' },
        ],
        skipped: [],
      },
      { expectedRevision: observedRevision }
    ),
    (error) =>
      error instanceof WorkspaceToolError &&
      error.code === 'WORKSPACE_REVISION_CONFLICT' &&
      error.retryable === true
  );

  assert.equal(manager.getSnapshot().rootName, 'memory');
  assert.equal(manager.getFile('index.html').source, '<h1>Changed</h1>');
});

test('waits for the matching preview revision before resolving', async () => {
  const manager = new WorkspaceDocumentManager({
    repository: createMemoryRepository(),
    seedFiles: [
      { path: 'index.html', language: 'html', source: '<h1>Seed</h1>' },
    ],
  });

  await manager.hydrate();
  const next = manager.updateFile('index.html', '<h1>Preview me</h1>');
  const previewWait = manager.waitForPreviewRevision(next.revision, 100);
  manager.setPreviewStatus(next.revision, 'synced');

  assert.deepEqual(await previewWait, {
    revision: next.revision,
    status: 'synced',
  });
});

test('returns typed preview failures when a revision errors or is superseded', async () => {
  const manager = new WorkspaceDocumentManager({
    repository: createMemoryRepository(),
    seedFiles: [
      { path: 'index.html', language: 'html', source: '<h1>Seed</h1>' },
    ],
  });

  await manager.hydrate();
  const failedRevision = manager.updateFile(
    'index.html',
    '<h1>Runtime failure</h1>'
  );
  const failedWait = manager.waitForPreviewRevision(failedRevision.revision, 100);
  manager.setPreviewStatus(
    failedRevision.revision,
    'error',
    'Script failed in preview.'
  );
  await assert.rejects(
    failedWait,
    (error) =>
      error instanceof WorkspaceToolError &&
      error.code === 'PREVIEW_RUNTIME_ERROR' &&
      error.retryable === false
  );

  const supersededRevision = manager.updateFile(
    'index.html',
    '<h1>Superseded</h1>'
  );
  const supersededWait = manager.waitForPreviewRevision(
    supersededRevision.revision,
    100
  );
  manager.updateFile('index.html', '<h1>Latest</h1>');
  await assert.rejects(
    supersededWait,
    (error) =>
      error instanceof WorkspaceToolError &&
      error.code === 'PREVIEW_REVISION_SUPERSEDED' &&
      error.retryable === true
  );
});

test('publishes the browser filesystem adapter from the package entrypoint', () => {
  const adapter = new BrowserWorkspaceFileSystemAdapter();
  assert.equal(adapter.hasWritableFolder, false);
  assert.equal(adapter.folderPermission, 'disconnected');
});
