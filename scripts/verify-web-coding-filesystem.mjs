import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const adapterPath = path.join(
  rootDirectory,
  'demos/bolt-style-editor/src/workspace-filesystem.ts'
);
const errorsPath = path.join(
  rootDirectory,
  'packages/live-code-editor/src/workspace-errors.ts'
);
const modelPath = path.join(
  rootDirectory,
  'packages/live-code-editor/src/workspace-model.ts'
);
const require = createRequire(import.meta.url);
const typescript = require('typescript');
const compilerOptions = {
  module: typescript.ModuleKind.ESNext,
  target: typescript.ScriptTarget.ES2022,
};
const errorsSource = await readFile(errorsPath, 'utf8');
const { outputText: errorsOutput } = typescript.transpileModule(
  errorsSource,
  { compilerOptions, fileName: errorsPath }
);
const errorsModuleUrl =
  'data:text/javascript;base64,' + Buffer.from(errorsOutput).toString('base64');
const modelSource = await readFile(modelPath, 'utf8');
const { outputText: modelOutput } = typescript.transpileModule(
  modelSource.replaceAll("from './workspace-errors'", `from '${errorsModuleUrl}'`),
  { compilerOptions, fileName: modelPath }
);
const modelModuleUrl =
  'data:text/javascript;base64,' + Buffer.from(modelOutput).toString('base64');
const source = await readFile(adapterPath, 'utf8');
const { outputText } = typescript.transpileModule(
  source
    .replaceAll("from './workspace-errors'", `from '${errorsModuleUrl}'`)
    .replaceAll(
      "from '@context-action/live-code-editor'",
      `from '${modelModuleUrl}'`
    ),
  {
    compilerOptions,
    fileName: adapterPath,
  }
);
const filesystem = await import(
  'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64')
);

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function expectEqual(actual, expected, message) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw new Error(
      message + '\nexpected: ' + expectedText + '\nactual: ' + actualText
    );
  }
}

function createTextFile(name, text, type) {
  return new File([text], name, { type });
}

function createRelativeFile(name, relativePath, text, type) {
  const file = createTextFile(name, text, type);
  Object.defineProperty(file, 'webkitRelativePath', {
    configurable: true,
    value: relativePath,
  });
  return file;
}

class MockWritable {
  constructor(fileHandle) {
    this.fileHandle = fileHandle;
    this.chunks = [];
  }

  async write(data) {
    this.chunks.push(data);
  }

  async close() {
    const data = this.chunks.map((chunk) =>
      typeof chunk === 'string' ? chunk : awaitBlobText(chunk)
    );
    const values = [];
    for (const value of data) values.push(await value);
    const blob = new Blob(values, { type: this.fileHandle.type });
    this.fileHandle.file = new File([blob], this.fileHandle.name, {
      type: this.fileHandle.type,
    });
  }
}

async function awaitBlobText(value) {
  return value;
}

class MockFileHandle {
  kind = 'file';

  constructor(name, file = new File([], name), type = file.type) {
    this.name = name;
    this.file = file;
    this.type = type;
  }

  async getFile() {
    return this.file;
  }

  async createWritable() {
    return new MockWritable(this);
  }
}

class MockDirectoryHandle {
  kind = 'directory';
  children = new Map();
  permission = 'granted';
  failEntries = false;

  constructor(name) {
    this.name = name;
  }

  addFile(relativePath, text, type) {
    const parts = relativePath.split('/').filter(Boolean);
    const name = parts.pop();
    let directory = this;
    for (const part of parts) {
      let child = directory.children.get(part);
      if (!child) {
        child = new MockDirectoryHandle(part);
        directory.children.set(part, child);
      }
      directory = child;
    }
    directory.children.set(
      name,
      new MockFileHandle(name, createTextFile(name, text, type), type)
    );
  }

  getFile(relativePath) {
    const parts = relativePath.split('/').filter(Boolean);
    let entry = this;
    for (const part of parts) entry = entry.children.get(part);
    return entry?.kind === 'file' ? entry.file : undefined;
  }

  async getDirectoryHandle(name, options = {}) {
    const existing = this.children.get(name);
    if (existing?.kind === 'directory') return existing;
    if (existing) throw new Error(`Expected directory: ${name}`);
    if (!options.create) {
      throw Object.assign(new Error(`Missing directory: ${name}`), {
        name: 'NotFoundError',
      });
    }
    const directory = new MockDirectoryHandle(name);
    this.children.set(name, directory);
    return directory;
  }

  async getFileHandle(name, options = {}) {
    const existing = this.children.get(name);
    if (existing?.kind === 'file') return existing;
    if (existing) throw new Error(`Expected file: ${name}`);
    if (!options.create) {
      throw Object.assign(new Error(`Missing file: ${name}`), {
        name: 'NotFoundError',
      });
    }
    const file = new MockFileHandle(name);
    this.children.set(name, file);
    return file;
  }

  async *entries() {
    if (this.failEntries) {
      throw Object.assign(new Error('Folder disappeared during reload.'), {
        name: 'NotFoundError',
      });
    }
    for (const entry of this.children.entries()) yield entry;
  }

  async removeEntry(name, options = {}) {
    const entry = this.children.get(name);
    if (!entry) {
      throw Object.assign(new Error(`Missing entry: ${name}`), {
        name: 'NotFoundError',
      });
    }
    if (entry.kind === 'directory' && !options.recursive && entry.children.size) {
      throw new Error('Directory is not empty.');
    }
    this.children.delete(name);
  }

  async queryPermission() {
    return this.permission;
  }

  async requestPermission() {
    return this.permission;
  }
}

const root = new MockDirectoryHandle('demo-folder');
root.addFile(
  'index.html',
  '<!doctype html><html><body><h1>Folder proof</h1></body></html>',
  'text/html'
);
root.addFile('src/app.js', "document.body.dataset.loaded = 'yes';", 'text/javascript');
root.addFile('assets/logo.svg', '<svg></svg>', 'image/svg+xml');
root.addFile('ignored.bin', '\u0000\u0001', 'application/octet-stream');

let persistedHandle;
let clearedHandle = false;
const persistence = {
  getDirectoryHandle: async () => persistedHandle,
  setDirectoryHandle: async (handle) => {
    persistedHandle = handle;
    clearedHandle = false;
  },
  clearDirectoryHandle: async () => {
    persistedHandle = undefined;
    clearedHandle = true;
  },
};
const adapter = new filesystem.BrowserWorkspaceFileSystemAdapter(persistence);
globalThis.window = {
  showDirectoryPicker: async () => root,
};

const imported = await adapter.pickFolder();
expectEqual(
  imported.files.map((file) => file.path),
  ['index.html', 'assets/logo.svg', 'src/app.js'],
  'Directory import must recursively retain supported nested text and asset files.'
);
expectEqual(imported.rootName, 'demo-folder', 'Directory root name must be preserved.');
expectEqual(imported.skipped, ['ignored.bin · unsupported file type'], 'Unsupported files must be reported.');
expect(persistedHandle === root, 'Successful directory import must persist the folder handle.');
expect(adapter.hasWritableFolder, 'A directory import must keep the folder linked for save.');
expectEqual(adapter.folderPermission, 'granted', 'The adapter must surface write permission.');

await adapter.writeFiles([
  {
    path: 'src/generated.css',
    language: 'css',
    source: 'body { color: red; }',
    kind: 'text',
  },
  {
    path: 'assets/generated.txt',
    language: 'asset',
    source: '',
    kind: 'asset',
    blob: new Blob(['asset-content'], { type: 'text/plain' }),
  },
]);
expectEqual(
  await root.getFile('src/generated.css')?.text(),
  'body { color: red; }',
  'Saving a nested text file must create the required directory path.'
);
expectEqual(
  await root.getFile('assets/generated.txt')?.text(),
  'asset-content',
  'Saving an asset must write its Blob payload.'
);

await adapter.removeFiles(['src/generated.css']);
expect(
  root.getFile('src/generated.css') === undefined,
  'Removing a workspace file must delete the matching local file.'
);

const fallbackAdapter = new filesystem.BrowserWorkspaceFileSystemAdapter();
const fallbackFiles = await fallbackAdapter.importFileList([
  createRelativeFile('index.html', 'uploaded/index.html', '<main />', 'text/html'),
  createRelativeFile('styles.css', 'uploaded/styles.css', 'body {}', 'text/css'),
  createRelativeFile('notes.md', 'uploaded/notes.md', '# notes', 'text/markdown'),
]);
expectEqual(
  fallbackFiles.files.map((file) => file.path),
  ['index.html', 'styles.css', 'notes.md'],
  'Directory-upload fallback must strip the selected root directory from paths.'
);
expectEqual(
  fallbackFiles.rootName,
  'uploaded',
  'Directory-upload fallback must preserve its selected root name.'
);
expect(!fallbackAdapter.hasWritableFolder, 'Directory-upload fallback must stay browser-only.');
let disconnectedFolderError;
try {
  await fallbackAdapter.writeFiles([fallbackFiles.files[0]]);
} catch (error) {
  disconnectedFolderError = error;
}
expect(
  disconnectedFolderError?.code === 'WORKSPACE_FOLDER_NOT_CONNECTED' &&
    disconnectedFolderError?.retryable === true &&
    disconnectedFolderError?.details?.operation === 'write',
  'A browser-only workspace save must return a reconnectable structured error.'
);

root.permission = 'denied';
let deniedFolderError;
try {
  await adapter.writeFiles([fallbackFiles.files[0]]);
} catch (error) {
  deniedFolderError = error;
}
expect(
  deniedFolderError?.code === 'WORKSPACE_FOLDER_PERMISSION_DENIED' &&
    deniedFolderError?.retryable === true &&
    deniedFolderError?.details?.operation === 'write' &&
    deniedFolderError?.details?.permission === 'denied',
  'A denied folder permission must return a retryable structured error.'
);
root.permission = 'granted';

const duplicateFallback = await fallbackAdapter.importFileList([
  createRelativeFile('index.html', 'uploaded/index.html', '<main />', 'text/html'),
  createRelativeFile('index.html', 'uploaded/index.html', '<main />', 'text/html'),
]);
expectEqual(
  duplicateFallback.files.map((file) => file.path),
  ['index.html'],
  'Directory-upload fallback must reject duplicate workspace paths.'
);
expect(
  duplicateFallback.skipped.includes('index.html · duplicate workspace path'),
  'Duplicate workspace paths must be reported as skipped input.'
);

const unsupportedOverflow = await fallbackAdapter.importFileList(
  Array.from({ length: 2_005 }, (_, index) =>
    createRelativeFile(
      `ignored-${index}.bin`,
      `uploaded/ignored-${index}.bin`,
      '\u0000\u0001',
      'application/octet-stream'
    )
  )
);
expect(
  unsupportedOverflow.skipped.includes('. · scan limit reached'),
  'Directory-upload fallback must stop scanning after the bounded entry limit.'
);
expect(
  unsupportedOverflow.skipped.length <= 2_001,
  'Directory-upload fallback skipped diagnostics must remain bounded.'
);

const restoredAdapter = new filesystem.BrowserWorkspaceFileSystemAdapter(persistence);
expect(await restoredAdapter.restorePersistedFolder(), 'Persisted folder handle must restore.');
expect(restoredAdapter.hasWritableFolder, 'Restored adapter must reconnect the folder.');
expectEqual(restoredAdapter.folderPermission, 'granted', 'Restored permission must be observable.');
root.failEntries = true;
let reloadUnavailableFolderError;
try {
  await restoredAdapter.reloadFolder();
} catch (error) {
  reloadUnavailableFolderError = error;
}
expect(
  reloadUnavailableFolderError?.message.includes('connected folder is no longer available'),
  'A missing folder during reload must return a reconnectable filesystem error.'
);
expect(
  reloadUnavailableFolderError?.code === 'WORKSPACE_FOLDER_STALE' &&
    reloadUnavailableFolderError?.retryable === true &&
    reloadUnavailableFolderError?.details?.operation === 'reload',
  'A missing folder during reload must preserve a retryable structured error.'
);
expect(
  !restoredAdapter.hasWritableFolder && clearedHandle,
  'A missing folder during reload must clear the stale writable handle.'
);
root.failEntries = false;
persistedHandle = root;
clearedHandle = false;
const reconnectedAdapter = new filesystem.BrowserWorkspaceFileSystemAdapter(persistence);
expect(await reconnectedAdapter.restorePersistedFolder(), 'The folder must be restorable after a stale reload.');
root.children.delete('src');
let unavailableFolderError;
try {
  await reconnectedAdapter.removeFiles(['src/app.js']);
} catch (error) {
  unavailableFolderError = error;
}
expect(
  unavailableFolderError?.message.includes('connected folder is no longer available'),
  'A missing folder during deletion must return a reconnectable filesystem error.'
);
expect(
  unavailableFolderError?.code === 'WORKSPACE_FOLDER_STALE' &&
    unavailableFolderError?.retryable === true &&
    unavailableFolderError?.details?.operation === 'delete',
  'A missing folder during deletion must preserve a retryable structured error.'
);
expect(
  !reconnectedAdapter.hasWritableFolder && clearedHandle,
  'A missing folder during deletion must clear the stale writable handle.'
);
await reconnectedAdapter.disconnectFolder();
expect(clearedHandle, 'Disconnecting a folder must clear its persisted handle.');
expect(!reconnectedAdapter.hasWritableFolder, 'Disconnecting must remove the in-memory folder link.');

console.log('Verified standalone filesystem adapter contracts.');
