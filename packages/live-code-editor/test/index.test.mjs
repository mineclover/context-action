import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertWorkspaceTextSourceLength,
  BrowserWorkspaceFileSystemAdapter,
  createWorkspaceSavePlan,
  createWorkspaceSaveUnknownDetails,
  hashWorkspaceSource,
  isPreviewBridgeMessage,
  languageForWorkspacePath,
  MAX_TEXT_SOURCE_LENGTH,
  normalizeWorkspacePath,
  readWorkspaceSavePlanDetails,
  selectWorkspaceActivePath,
  verifyWorkspaceSavePlan,
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

test('creates bounded per-file save digests without persisting source text', async () => {
  const plan = await createWorkspaceSavePlan([
    { path: 'styles.css', source: 'body { color: red; }' },
    { path: 'index.html', source: '<h1>Hello</h1>' },
  ], 'editor.saveAll');

  assert.deepEqual(plan.map(file => file.path), ['index.html', 'styles.css']);
  assert.equal(plan[0].sourceLength, '<h1>Hello</h1>'.length);
  assert.match(plan[0].sourceHash, /^(sha256|fnv1a32):/);
  assert.notEqual(plan[0].sourceHash, plan[1].sourceHash);
  assert.equal(await hashWorkspaceSource('<h1>Hello</h1>'), plan[0].sourceHash);
});

test('parses and validates ambiguous multi-file save details', async () => {
  const plannedFiles = await createWorkspaceSavePlan([
    { path: 'index.html', source: '<h1>Hello</h1>' },
    { path: 'styles.css', source: 'body {}' },
  ], 'editor.saveAll');
  const details = createWorkspaceSaveUnknownDetails({
    operation: 'editor.saveAll',
    plannedFiles,
    completedPaths: ['index.html'],
    reason: 'folder write ended after the first file',
  });

  assert.deepEqual(readWorkspaceSavePlanDetails(details), details);
  assert.equal(
    readWorkspaceSavePlanDetails({
      ...details,
      plannedFiles: [{ ...details.plannedFiles[0], sourceLength: -1 }],
    }),
    undefined
  );
  assert.equal(
    readWorkspaceSavePlanDetails({
      ...details,
      completedPaths: ['not-planned.txt'],
    }),
    undefined
  );

  await assert.doesNotReject(
    verifyWorkspaceSavePlan(details, async path =>
      path === 'index.html' ? '<h1>Hello</h1>' : 'body {}'
    )
  );
  await assert.rejects(
    verifyWorkspaceSavePlan(details, async path =>
      path === 'index.html' ? '<h1>Changed</h1>' : 'body {}'
    ),
    /does not match the external files/
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

  manager.setActivePath('app.js');
  await manager.waitForPersistence();
  assert.equal(manager.getSnapshot().activePath, 'app.js');

  const restoredManager = new WorkspaceDocumentManager({
    repository,
    rootName: 'restored-default',
    seedFiles: [
      { path: 'index.html', language: 'html', source: '<h1>Other seed</h1>' },
      { path: 'app.js', language: 'javascript', source: 'console.log(2);' },
    ],
  });
  await restoredManager.hydrate();
  assert.equal(restoredManager.getSnapshot().rootName, 'memory');
  assert.equal(restoredManager.getSnapshot().activePath, 'app.js');
  assert.equal(
    restoredManager.getFile('index.html').source,
    '<h1>Seed</h1>'
  );
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

test('imports a readonly File array for non-DOM consumers', async () => {
  const adapter = new BrowserWorkspaceFileSystemAdapter();
  const imported = await adapter.importFileList([
    new File(['<h1>Imported</h1>'], 'index.html', { type: 'text/html' }),
  ]);

  assert.equal(imported.rootName, 'workspace');
  assert.deepEqual(imported.files, [
    {
      path: 'index.html',
      language: 'html',
      source: '<h1>Imported</h1>',
      kind: 'text',
      mimeType: 'text/html',
    },
  ]);
});

test('reads a connected folder file for external operation reconciliation', async () => {
  const files = new Map([
    ['index.html', new File(['<h1>Saved</h1>'], 'index.html', { type: 'text/html' })],
  ]);
  const fileHandle = name => ({
    kind: 'file',
    name,
    async getFile() {
      const file = files.get(name);
      if (!file) {
        const error = new Error(`Missing file: ${name}`);
        error.name = 'NotFoundError';
        throw error;
      }
      return file;
    },
  });
  const directoryHandle = {
    kind: 'directory',
    name: 'workspace',
    async *entries() {
      for (const [name] of files) yield [name, fileHandle(name)];
    },
    async getDirectoryHandle(name) {
      const error = new Error(`Missing directory: ${name}`);
      error.name = 'NotFoundError';
      throw error;
    },
    async getFileHandle(name) {
      return fileHandle(name);
    },
  };
  const adapter = new BrowserWorkspaceFileSystemAdapter();
  await adapter.importDirectoryHandle(directoryHandle);

  assert.equal((await adapter.readFile('index.html')).source, '<h1>Saved</h1>');
  assert.equal(await adapter.readFile('missing.html'), undefined);
});

test('persists a destination scope across folder restore and clears it on disconnect', async () => {
  let persistedHandle;
  let persistedScopeId;
  const persistence = {
    async getDirectoryHandle() {
      return persistedHandle;
    },
    async setDirectoryHandle(handle) {
      persistedHandle = handle;
    },
    async clearDirectoryHandle() {
      persistedHandle = undefined;
    },
    async getDirectoryScopeId() {
      return persistedScopeId;
    },
    async setDirectoryScopeId(scopeId) {
      persistedScopeId = scopeId;
    },
    async clearDirectoryScopeId() {
      persistedScopeId = undefined;
    },
  };
  const directoryHandle = {
    kind: 'directory',
    name: 'scoped-workspace',
    async *entries() {
      yield [
        'index.html',
        {
          kind: 'file',
          name: 'index.html',
          async getFile() {
            return new File(['<h1>Scoped</h1>'], 'index.html', {
              type: 'text/html',
            });
          },
        },
      ];
    },
    async getDirectoryHandle(name) {
      throw new Error(`Missing directory: ${name}`);
    },
    async getFileHandle(name) {
      throw new Error(`Missing file: ${name}`);
    },
  };

  const firstAdapter = new BrowserWorkspaceFileSystemAdapter(persistence);
  await firstAdapter.importDirectoryHandle(directoryHandle);
  assert.match(firstAdapter.folderScopeId, /^folder:/);
  assert.equal(persistedScopeId, firstAdapter.folderScopeId);
  const firstScopeId = firstAdapter.folderScopeId;

  await firstAdapter.importDirectoryHandle({
    ...directoryHandle,
    name: 'other-workspace',
  });
  assert.notEqual(firstAdapter.folderScopeId, firstScopeId);

  const restoredAdapter = new BrowserWorkspaceFileSystemAdapter(persistence);
  assert.equal(await restoredAdapter.restorePersistedFolder(), true);
  assert.equal(restoredAdapter.folderScopeId, firstAdapter.folderScopeId);

  await restoredAdapter.disconnectFolder();
  assert.equal(restoredAdapter.folderScopeId, undefined);
  assert.equal(persistedScopeId, undefined);
});
