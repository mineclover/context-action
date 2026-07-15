import { findPreviewHtmlFile } from './preview-document';
import type { ImportedFolder } from './workspace-filesystem';
import {
  DEMO_WORKSPACE_ID,
  WebCodingWorkspaceRepository,
} from './workspace-storage';

export type {
  PreviewBridgeMessage,
  WorkspaceAssetUrls,
} from './preview-document';
export {
  buildPreviewDocument,
  findPreviewHtmlFile,
  findPreviewStylesheetFile,
} from './preview-document';

export type WorkspaceFile = {
  path: string;
  renamedFrom?: string;
  language: string;
  source: string;
  kind?: 'text' | 'asset';
  mimeType?: string;
  blob?: Blob;
};

export type WorkspaceSnapshot = {
  rootName: string;
  files: WorkspaceFile[];
  activePath: string;
  revision: number;
  preview: PreviewSnapshot;
  storageMode: WorkspaceStorageMode;
  storageError?: string;
};

export type WorkspaceStorageMode = 'loading' | 'indexed-db' | 'memory';

export type PreviewSnapshot = {
  revision: number;
  status: 'waiting' | 'synced' | 'error';
  message?: string;
};

type WorkspaceCheckpoint = Pick<WorkspaceSnapshot, 'files' | 'activePath'> & {
  deletedPaths: string[];
  preserveActivePath?: boolean;
};

type UpdateFileOptions = {
  coalesce?: boolean;
};

type WorkspaceImportOptions = {
  expectedRevision?: number;
};

const languageByWorkspaceExtension: Record<string, string> = {
  '.css': 'css',
  '.htm': 'html',
  '.html': 'html',
  '.js': 'javascript',
  '.json': 'json',
  '.mjs': 'javascript',
  '.md': 'markdown',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.txt': 'text',
};

const binaryWorkspaceExtensions = new Set([
  '.avif',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.otf',
  '.png',
  '.svg',
  '.ttf',
  '.wasm',
  '.webp',
  '.woff',
  '.woff2',
]);
const MAX_HISTORY_CHECKPOINTS = 100;

export function normalizeWorkspacePath(path: string): string {
  if (path.includes('\0'))
    throw new Error('Workspace path cannot contain NUL.');
  const segments = path.replaceAll('\\', '/').split('/');
  if (segments.some((segment) => segment === '..')) {
    throw new Error('Workspace path cannot traverse a parent directory.');
  }
  const normalized = segments.filter(
    (segment) => segment.length > 0 && segment !== '.'
  );
  if (normalized.length === 0) throw new Error('Workspace path is required.');
  return normalized.join('/');
}

function assertExpectedRevision(
  currentRevision: number,
  expectedRevision?: number
): void {
  if (expectedRevision === undefined || expectedRevision === currentRevision) {
    return;
  }
  throw new Error(
    `Workspace revision mismatch: expected ${expectedRevision}, current ${currentRevision}. Re-read the workspace before applying the mutation.`
  );
}

function storageErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message.trim() : '';
  return (message || fallback).slice(0, 240);
}

export function languageForWorkspacePath(path: string): string {
  const extension = `.${path.split('.').pop()?.toLowerCase() ?? ''}`;
  return languageByWorkspaceExtension[extension] ?? 'text';
}

function mimeTypeForWorkspaceLanguage(language: string): string {
  switch (language) {
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'javascript':
      return 'text/javascript';
    case 'json':
      return 'application/json';
    case 'markdown':
      return 'text/markdown';
    default:
      return 'text/plain';
  }
}

const initialFiles: WorkspaceFile[] = [
  {
    path: 'index.html',
    language: 'html',
    source: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Canvas landing page</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="page-shell">
      <nav class="eyebrow">CONTEXT-ACTION / WEB STUDIO</nav>
      <section class="hero">
        <div>
          <span class="kicker">A small surface for big ideas</span>
          <h1 id="hero-title">Ship a page from a conversation.</h1>
          <p id="hero-subtitle">Every edit is a typed tool call, then a visible preview revision.</p>
        </div>
        <button id="hero-button" type="button">Try the interaction</button>
      </section>
      <section class="feature-grid">
        <article class="feature-card"><strong>Typed tools</strong><span>Zod contracts keep edits explicit.</span></article>
        <article class="feature-card"><strong>Live preview</strong><span>The iframe is refreshed from workspace state.</span></article>
        <!-- feature-slot -->
      </section>
      <section class="cta"><strong>Ready for the next instruction?</strong><span id="cta-copy">Ask the agent to change the page.</span></section>
    </main>
    <script src="app.js"></script>
  </body>
</html>
`,
  },
  {
    path: 'styles.css',
    language: 'css',
    source: `:root { --accent: #8b5cf6; --accent-soft: #f0eaff; --ink: #171522; --muted: #706b82; }
* { box-sizing: border-box; }
body { margin: 0; color: var(--ink); background: radial-gradient(circle at top right, var(--accent-soft), #ffffff 48%); font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
.page-shell { max-width: 900px; margin: 0 auto; padding: 54px 28px; }
.eyebrow, .kicker { color: var(--accent); font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.hero { display: flex; align-items: end; justify-content: space-between; gap: 32px; padding: 72px 0 56px; }
h1 { max-width: 650px; margin: 14px 0; font-size: clamp(40px, 8vw, 82px); letter-spacing: -.065em; line-height: .95; }
p, .feature-card span, .cta span { color: var(--muted); line-height: 1.6; }
.hero p { max-width: 540px; font-size: 18px; }
button { border: 0; border-radius: 999px; background: var(--accent); color: white; cursor: pointer; font: inherit; font-weight: 750; padding: 13px 18px; box-shadow: 0 12px 28px color-mix(in srgb, var(--accent) 26%, transparent); }
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.feature-card, .cta { border: 1px solid color-mix(in srgb, var(--accent) 18%, #ffffff); border-radius: 20px; background: rgb(255 255 255 / 70%); padding: 22px; }
.feature-card { display: grid; gap: 12px; min-height: 160px; }
.feature-card strong { font-size: 17px; }
.cta { display: flex; justify-content: space-between; gap: 20px; margin-top: 12px; }
@media (max-width: 720px) { .hero, .cta { align-items: start; flex-direction: column; } .feature-grid { grid-template-columns: 1fr; } }
`,
  },
  {
    path: 'app.js',
    language: 'javascript',
    source: `const button = document.querySelector('#hero-button');
const copy = document.querySelector('#cta-copy');
button?.addEventListener('click', () => {
  copy.textContent = 'The generated page received a real click.';
  button.textContent = 'Interaction received';
});
`,
  },
  {
    path: 'README.md',
    language: 'markdown',
    source: `# Web Studio

This tiny workspace is edited through Context-Action tools and rendered in a sandboxed iframe.
`,
  },
];

export function createInitialFiles(): WorkspaceFile[] {
  return initialFiles.map((file) => ({ ...file }));
}

export class BrowserWorkspace {
  private snapshot: WorkspaceSnapshot;
  private listeners = new Set<() => void>();
  private history: WorkspaceCheckpoint[];
  private historyIndex = 0;
  private savedFiles: WorkspaceFile[];
  private deletedPaths: string[] = [];
  private lastEdit: { path: string; timestamp: number } | null = null;
  private persistQueue = Promise.resolve();
  private hydrated = false;

  constructor(
    private readonly repository = new WebCodingWorkspaceRepository(
      undefined,
      DEMO_WORKSPACE_ID
    )
  ) {
    this.snapshot = {
      rootName: 'canvas-landing',
      files: createInitialFiles(),
      activePath: 'index.html',
      revision: 1,
      preview: { revision: 1, status: 'waiting' },
      storageMode: 'loading',
    };
    this.history = [this.createCheckpoint()];
    this.savedFiles = this.snapshot.files.map((file) => ({ ...file }));
  }

  getSnapshot = (): WorkspaceSnapshot => this.snapshot;

  async waitForPersistence(): Promise<void> {
    await this.persistQueue;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async hydrate(): Promise<void> {
    if (this.hydrated) return;
    this.hydrated = true;
    try {
      const persisted = await this.repository.ensureWorkspace(
        createInitialFiles()
      );
      const revision = this.snapshot.revision + 1;
      this.snapshot = {
        ...this.snapshot,
        rootName: persisted.rootName,
        files: persisted.files,
        activePath: persisted.activePath,
        preview: { revision, status: 'waiting' },
        revision,
        storageMode: 'indexed-db',
        storageError: undefined,
      };
      this.deletedPaths = [...(persisted.deletedPaths ?? [])];
      this.history = [this.createCheckpoint()];
      this.historyIndex = 0;
      this.savedFiles = this.snapshot.files.map((file) => ({ ...file }));
    } catch (error) {
      this.snapshot = {
        ...this.snapshot,
        storageMode: 'memory',
        storageError: storageErrorMessage(
          error,
          'IndexedDB could not restore the browser workspace.'
        ),
      };
    }
    this.notify();
  }

  async importFolder(
    folder: ImportedFolder,
    options: WorkspaceImportOptions = {}
  ): Promise<void> {
    if (folder.files.length === 0) {
      throw new Error(
        'No supported HTML, CSS, JS, text, or preview asset files were found.'
      );
    }

    await this.persistQueue;
    assertExpectedRevision(this.snapshot.revision, options.expectedRevision);
    const activePath =
      folder.files.find((file) => file.path === 'index.html')?.path ??
      folder.files.find((file) => file.language === 'html')?.path ??
      folder.files.find((file) => file.kind !== 'asset')?.path ??
      folder.files[0].path;

    try {
      const persisted = await this.repository.replaceWorkspace(
        folder.files,
        activePath,
        folder.rootName
      );
      this.snapshot = {
        ...this.snapshot,
        rootName: persisted.rootName,
        files: persisted.files,
        activePath: persisted.activePath,
        storageMode: 'indexed-db',
        revision: this.snapshot.revision + 1,
        preview: {
          revision: this.snapshot.revision + 1,
          status: 'waiting',
        },
        storageError: undefined,
      };
    } catch (error) {
      this.snapshot = {
        ...this.snapshot,
        rootName: folder.rootName || 'workspace',
        files: folder.files.map((file) => ({ ...file })),
        activePath,
        storageMode: 'memory',
        revision: this.snapshot.revision + 1,
        preview: {
          revision: this.snapshot.revision + 1,
          status: 'waiting',
        },
        storageError: storageErrorMessage(
          error,
          'IndexedDB could not persist the imported workspace.'
        ),
      };
    }

    this.deletedPaths = [];
    this.history = [this.createCheckpoint()];
    this.historyIndex = 0;
    this.savedFiles = this.snapshot.files.map((file) => ({ ...file }));
    this.lastEdit = null;
    this.notify();
  }

  async resetToSeed(options: WorkspaceImportOptions = {}): Promise<void> {
    await this.importFolder(
      {
        rootName: 'canvas-landing',
        files: createInitialFiles(),
        skipped: [],
      },
      options
    );
  }

  getFile(path: string): WorkspaceFile {
    const normalizedPath = normalizeWorkspacePath(path);
    const file = this.snapshot.files.find(
      (candidate) => candidate.path === normalizedPath
    );
    if (!file) throw new Error(`Workspace file not found: ${normalizedPath}`);
    return file;
  }

  setPreviewStatus(
    revision: number,
    status: PreviewSnapshot['status'],
    message?: string
  ): void {
    if (
      revision !== this.snapshot.revision ||
      revision < this.snapshot.preview.revision
    ) {
      return;
    }
    this.snapshot = {
      ...this.snapshot,
      preview: { revision, status, ...(message ? { message } : {}) },
    };
    this.notify();
  }

  waitForPreviewRevision(
    revision: number,
    timeoutMs = 2500,
    signal?: AbortSignal
  ): Promise<PreviewSnapshot> {
    if (signal?.aborted) {
      return Promise.reject(
        signal.reason instanceof Error
          ? signal.reason
          : new DOMException('Preview wait cancelled.', 'AbortError')
      );
    }
    const current = this.snapshot.preview;
    if (current.revision === revision && current.status === 'synced') {
      return Promise.resolve(current);
    }
    if (current.revision === revision && current.status === 'error') {
      return Promise.reject(
        new Error(current.message ?? `Preview revision ${revision} failed.`)
      );
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      let unsubscribe = () => {};
      let removeAbortListener = () => {};
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        if (timeoutId) clearTimeout(timeoutId);
        unsubscribe();
        removeAbortListener();
        callback();
      };
      const inspect = () => {
        const preview = this.snapshot.preview;
        if (preview.revision > revision) {
          finish(() =>
            reject(
              new Error(
                `Preview revision ${revision} was superseded by ${preview.revision}.`
              )
            )
          );
        } else if (preview.revision === revision) {
          if (preview.status === 'synced') finish(() => resolve(preview));
          if (preview.status === 'error') {
            finish(() =>
              reject(
                new Error(
                  preview.message ?? `Preview revision ${revision} failed.`
                )
              )
            );
          }
        }
      };

      unsubscribe = this.subscribe(inspect);
      if (signal) {
        const abort = () =>
          finish(() =>
            reject(
              signal.reason instanceof Error
                ? signal.reason
                : new DOMException('Preview wait cancelled.', 'AbortError')
            )
          );
        signal.addEventListener('abort', abort, { once: true });
        removeAbortListener = () => signal.removeEventListener('abort', abort);
        if (signal.aborted) {
          abort();
          return;
        }
      }
      timeoutId = setTimeout(() => {
        finish(() =>
          reject(
            new Error(
              `Preview revision ${revision} was not acknowledged within ${timeoutMs}ms.`
            )
          )
        );
      }, timeoutMs);
      inspect();
    });
  }

  setActivePath(path: string): void {
    const normalizedPath = normalizeWorkspacePath(path);
    this.getFile(normalizedPath);
    this.snapshot = { ...this.snapshot, activePath: normalizedPath };
    if (this.snapshot.storageMode === 'indexed-db') {
      this.enqueuePersistence(() =>
        this.repository.setActivePath(normalizedPath)
      );
    }
    this.notify();
  }

  updateFile(
    path: string,
    source: string,
    options: UpdateFileOptions = {}
  ): WorkspaceSnapshot {
    const normalizedPath = normalizeWorkspacePath(path);
    if (this.getFile(normalizedPath).kind === 'asset') {
      throw new Error(
        `Binary asset cannot be edited as text: ${normalizedPath}`
      );
    }
    const nextFiles = this.snapshot.files.map((file) =>
      file.path === normalizedPath ? { ...file, source } : file
    );
    if (!nextFiles.some((file) => file.path === normalizedPath)) {
      throw new Error(`Workspace file not found: ${normalizedPath}`);
    }
    const checkpoint: WorkspaceCheckpoint = {
      activePath: this.snapshot.activePath,
      files: nextFiles,
      deletedPaths: [...this.deletedPaths],
      preserveActivePath: true,
    };
    const now = Date.now();
    const shouldCoalesce =
      options.coalesce !== false &&
      this.lastEdit?.path === normalizedPath &&
      now - this.lastEdit.timestamp < 750;

    if (shouldCoalesce) {
      this.history[this.historyIndex] = checkpoint;
    } else {
      this.pushHistoryCheckpoint(checkpoint);
    }

    this.lastEdit = { path: normalizedPath, timestamp: now };
    this.applyCheckpoint(checkpoint);
    if (this.snapshot.storageMode === 'indexed-db') {
      const persistedFile = nextFiles.find(
        (file) => file.path === normalizedPath
      );
      if (persistedFile) {
        this.enqueuePersistence(() => this.repository.saveFile(persistedFile));
      }
    }
    this.notify();
    return this.getSnapshot();
  }

  revertFile(path: string): WorkspaceSnapshot {
    const normalizedPath = normalizeWorkspacePath(path);
    const currentFile = this.getFile(normalizedPath);
    const savedFile = this.savedFiles.find(
      (file) => file.path === normalizedPath
    );
    if (
      currentFile.renamedFrom &&
      !this.snapshot.files.some((file) => file.path === currentFile.renamedFrom)
    ) {
      const restored = this.renameFile(normalizedPath, currentFile.renamedFrom);
      const originalSavedFile = this.savedFiles.find(
        (file) => file.path === currentFile.renamedFrom
      );
      const sourceToRestore = originalSavedFile?.source ?? savedFile?.source;
      const restoredFile = restored.files.find(
        (file) => file.path === currentFile.renamedFrom
      );
      if (
        sourceToRestore !== undefined &&
        restoredFile?.source !== sourceToRestore
      ) {
        return this.updateFile(currentFile.renamedFrom, sourceToRestore, {
          coalesce: false,
        });
      }
      return restored;
    }
    if (!savedFile) {
      return this.deleteFile(normalizedPath);
    }
    if (currentFile.source === savedFile.source) {
      return this.getSnapshot();
    }
    return this.updateFile(normalizedPath, savedFile.source, {
      coalesce: false,
    });
  }

  createFile(path: string, source: string): WorkspaceSnapshot {
    const normalizedPath = normalizeWorkspacePath(path);
    const extension = `.${normalizedPath.split('.').pop()?.toLowerCase() ?? ''}`;
    if (binaryWorkspaceExtensions.has(extension)) {
      throw new Error(
        `Binary assets cannot be created as text files: ${normalizedPath}`
      );
    }
    if (this.snapshot.files.some((file) => file.path === normalizedPath)) {
      throw new Error(`Workspace file already exists: ${normalizedPath}`);
    }

    const language = languageForWorkspacePath(normalizedPath);
    const file: WorkspaceFile = {
      path: normalizedPath,
      language,
      source,
      kind: 'text',
      mimeType: mimeTypeForWorkspaceLanguage(language),
    };
    const checkpoint: WorkspaceCheckpoint = {
      activePath: normalizedPath,
      files: [...this.snapshot.files, file],
      deletedPaths: this.deletedPaths.filter(
        (deletedPath) => deletedPath !== normalizedPath
      ),
    };
    this.pushHistoryCheckpoint(checkpoint);
    this.lastEdit = { path: normalizedPath, timestamp: Date.now() };
    this.applyCheckpoint(checkpoint);
    if (this.snapshot.storageMode === 'indexed-db') {
      this.enqueuePersistence(async () => {
        await this.repository.saveFile(file);
        await this.repository.setActivePath(normalizedPath);
      });
    }
    this.notify();
    return this.getSnapshot();
  }

  renameFile(fromPath: string, toPath: string): WorkspaceSnapshot {
    const normalizedFromPath = normalizeWorkspacePath(fromPath);
    const normalizedToPath = normalizeWorkspacePath(toPath);
    if (normalizedFromPath === normalizedToPath) {
      throw new Error('The new workspace path must be different.');
    }
    const file = this.getFile(normalizedFromPath);
    if (
      this.snapshot.files.some(
        (candidate) => candidate.path === normalizedToPath
      )
    ) {
      throw new Error(`Workspace file already exists: ${normalizedToPath}`);
    }

    const targetExtension = `.${normalizedToPath.split('.').pop()?.toLowerCase() ?? ''}`;
    const targetIsBinary = binaryWorkspaceExtensions.has(targetExtension);
    if (file.kind === 'asset' && !targetIsBinary) {
      throw new Error(
        `Binary assets must keep a supported asset extension: ${normalizedToPath}`
      );
    }
    if (file.kind !== 'asset' && targetIsBinary) {
      throw new Error(
        `Text files cannot be renamed to a binary asset path: ${normalizedToPath}`
      );
    }

    const nextLanguage =
      file.kind === 'asset'
        ? 'asset'
        : languageForWorkspacePath(normalizedToPath);
    if (
      file.language === 'html' &&
      nextLanguage !== 'html' &&
      !this.snapshot.files.some(
        (candidate) =>
          candidate.path !== normalizedFromPath && candidate.language === 'html'
      )
    ) {
      throw new Error('The workspace must keep an HTML preview entry.');
    }

    const renamedFile: WorkspaceFile = {
      ...file,
      path: normalizedToPath,
      language: nextLanguage,
      renamedFrom:
        file.renamedFrom === normalizedToPath
          ? undefined
          : (file.renamedFrom ?? normalizedFromPath),
      ...(file.kind === 'asset'
        ? {}
        : { mimeType: mimeTypeForWorkspaceLanguage(nextLanguage) }),
    };
    const nextFiles = this.snapshot.files.map((candidate) =>
      candidate.path === normalizedFromPath ? renamedFile : candidate
    );
    const nextActivePath =
      this.snapshot.activePath === normalizedFromPath
        ? normalizedToPath
        : this.snapshot.activePath;
    const wasSaved = this.savedFiles.some(
      (savedFile) => savedFile.path === normalizedFromPath
    );
    const nextDeletedPaths = this.deletedPaths.filter(
      (deletedPath) => deletedPath !== normalizedToPath
    );
    if (wasSaved) nextDeletedPaths.push(normalizedFromPath);

    const checkpoint: WorkspaceCheckpoint = {
      activePath: nextActivePath,
      files: nextFiles,
      deletedPaths: [...new Set(nextDeletedPaths)],
    };
    this.pushHistoryCheckpoint(checkpoint);
    this.lastEdit = null;
    this.applyCheckpoint(checkpoint);
    if (this.snapshot.storageMode === 'indexed-db') {
      this.enqueuePersistence(async () => {
        await this.repository.deleteFile(normalizedFromPath, {
          trackPendingDeletion: wasSaved,
        });
        await this.repository.saveFile(renamedFile);
        await this.repository.setActivePath(nextActivePath);
      });
    }
    this.notify();
    return this.getSnapshot();
  }

  deleteFile(path: string): WorkspaceSnapshot {
    const normalizedPath = normalizeWorkspacePath(path);
    const file = this.getFile(normalizedPath);
    if (this.snapshot.files.length <= 1) {
      throw new Error('The workspace must keep at least one file.');
    }

    const nextFiles = this.snapshot.files.filter(
      (candidate) => candidate.path !== file.path
    );
    if (file.language === 'html' && !findPreviewHtmlFile(nextFiles)) {
      throw new Error('The workspace must keep an HTML preview entry.');
    }
    const nextActivePath =
      this.snapshot.activePath === file.path
        ? (findPreviewHtmlFile(nextFiles)?.path ?? nextFiles[0]?.path)
        : this.snapshot.activePath;
    if (!nextActivePath) throw new Error('The workspace has no active file.');

    const wasPersisted = this.savedFiles.some(
      (savedFile) => savedFile.path === file.path
    );
    const checkpoint: WorkspaceCheckpoint = {
      activePath: nextActivePath,
      files: nextFiles,
      deletedPaths: wasPersisted
        ? [...this.deletedPaths, file.path].filter(
            (deletedPath, index, paths) => paths.indexOf(deletedPath) === index
          )
        : this.deletedPaths.filter((deletedPath) => deletedPath !== file.path),
    };
    this.pushHistoryCheckpoint(checkpoint);
    this.lastEdit = null;
    this.applyCheckpoint(checkpoint);
    if (this.snapshot.storageMode === 'indexed-db') {
      this.enqueuePersistence(async () => {
        await this.repository.deleteFile(file.path, {
          trackPendingDeletion: wasPersisted,
        });
        await this.repository.setActivePath(nextActivePath);
      });
    }
    this.notify();
    return this.getSnapshot();
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  isDirty(): boolean {
    return this.getDirtyFiles().length > 0 || this.deletedPaths.length > 0;
  }

  getDirtyFiles(): WorkspaceFile[] {
    return this.snapshot.files.filter((file) => {
      const savedFile = this.savedFiles.find(
        (candidate) => candidate.path === file.path
      );
      return !savedFile || savedFile.source !== file.source;
    });
  }

  getDeletedPaths(): string[] {
    return [...this.deletedPaths];
  }

  undo(): WorkspaceSnapshot {
    if (!this.canUndo()) return this.getSnapshot();
    this.historyIndex -= 1;
    this.lastEdit = null;
    const checkpoint = this.resolveHistoryCheckpoint(
      this.history[this.historyIndex]
    );
    const rootName = this.snapshot.rootName;
    this.applyCheckpoint(checkpoint);
    if (this.snapshot.storageMode === 'indexed-db') {
      this.enqueuePersistence(() =>
        this.repository
          .replaceWorkspace(
            checkpoint.files,
            checkpoint.activePath,
            rootName,
            checkpoint.deletedPaths
          )
          .then(() => undefined)
      );
    }
    this.notify();
    return this.getSnapshot();
  }

  redo(): WorkspaceSnapshot {
    if (!this.canRedo()) return this.getSnapshot();
    this.historyIndex += 1;
    this.lastEdit = null;
    const checkpoint = this.resolveHistoryCheckpoint(
      this.history[this.historyIndex]
    );
    const rootName = this.snapshot.rootName;
    this.applyCheckpoint(checkpoint);
    if (this.snapshot.storageMode === 'indexed-db') {
      this.enqueuePersistence(() =>
        this.repository
          .replaceWorkspace(
            checkpoint.files,
            checkpoint.activePath,
            rootName,
            checkpoint.deletedPaths
          )
          .then(() => undefined)
      );
    }
    this.notify();
    return this.getSnapshot();
  }

  async markSaved(): Promise<void> {
    await this.persistQueue;
    if (this.snapshot.storageMode === 'indexed-db') {
      await this.repository.clearDeletedPaths();
    }
    this.savedFiles = this.snapshot.files.map((file) => ({ ...file }));
    this.deletedPaths = [];
    this.snapshot = { ...this.snapshot };
    this.notify();
  }

  async markFileSavedIfRevision(
    path: string,
    expectedRevision: number
  ): Promise<boolean> {
    await this.persistQueue;
    if (this.snapshot.revision !== expectedRevision) return false;
    const file = this.getFile(path);
    const savedIndex = this.savedFiles.findIndex(
      (candidate) => candidate.path === file.path
    );
    this.savedFiles =
      savedIndex >= 0
        ? this.savedFiles.map((candidate, index) =>
            index === savedIndex ? { ...file } : candidate
          )
        : [...this.savedFiles, { ...file }];
    this.snapshot = { ...this.snapshot };
    this.notify();
    return true;
  }

  async markDeletedPathSavedIfRevision(
    path: string,
    expectedRevision: number
  ): Promise<boolean> {
    await this.persistQueue;
    if (this.snapshot.revision !== expectedRevision) return false;
    if (!this.deletedPaths.includes(path)) return true;
    this.deletedPaths = this.deletedPaths.filter(
      (deletedPath) => deletedPath !== path
    );
    this.snapshot = { ...this.snapshot };
    this.notify();
    return true;
  }

  async markSavedIfRevision(expectedRevision: number): Promise<boolean> {
    await this.persistQueue;
    if (this.snapshot.revision !== expectedRevision) return false;
    if (this.snapshot.storageMode === 'indexed-db') {
      try {
        await this.repository.clearDeletedPaths();
      } catch (error) {
        this.markStorageUnavailable(
          error,
          'IndexedDB could not update the browser checkpoint.'
        );
        throw error;
      }
    }
    if (this.snapshot.revision !== expectedRevision) return false;
    this.savedFiles = this.snapshot.files.map((file) => ({ ...file }));
    this.deletedPaths = [];
    this.snapshot = { ...this.snapshot };
    this.notify();
    return true;
  }

  private createCheckpoint(): WorkspaceCheckpoint {
    return {
      activePath: this.snapshot.activePath,
      files: this.snapshot.files,
      deletedPaths: [...this.deletedPaths],
    };
  }

  private pushHistoryCheckpoint(checkpoint: WorkspaceCheckpoint): void {
    const nextHistory = [
      ...this.history.slice(0, this.historyIndex + 1),
      checkpoint,
    ];
    const overflow = Math.max(0, nextHistory.length - MAX_HISTORY_CHECKPOINTS);
    this.history = overflow ? nextHistory.slice(overflow) : nextHistory;
    this.historyIndex = this.history.length - 1;
  }

  private resolveHistoryCheckpoint(
    checkpoint: WorkspaceCheckpoint
  ): WorkspaceCheckpoint {
    if (!checkpoint.preserveActivePath) return checkpoint;
    const currentActivePath = this.snapshot.activePath;
    if (!checkpoint.files.some((file) => file.path === currentActivePath)) {
      return checkpoint;
    }
    return { ...checkpoint, activePath: currentActivePath };
  }

  private applyCheckpoint(checkpoint: WorkspaceCheckpoint): void {
    const revision = this.snapshot.revision + 1;
    this.deletedPaths = [...checkpoint.deletedPaths];
    this.snapshot = {
      ...this.snapshot,
      files: checkpoint.files,
      activePath: checkpoint.activePath,
      rootName: this.snapshot.rootName,
      storageMode: this.snapshot.storageMode,
      preview: { revision, status: 'waiting' },
      revision,
    };
  }

  private enqueuePersistence(task: () => Promise<void>): void {
    this.persistQueue = this.persistQueue.then(task).catch((error) => {
      if (this.snapshot.storageMode === 'indexed-db') {
        this.markStorageUnavailable(
          error,
          'IndexedDB could not persist the latest browser workspace change.'
        );
      }
    });
  }

  private markStorageUnavailable(error: unknown, fallback: string): void {
    this.snapshot = {
      ...this.snapshot,
      storageMode: 'memory',
      storageError: storageErrorMessage(error, fallback),
    };
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
