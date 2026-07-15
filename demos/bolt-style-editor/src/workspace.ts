import type { ImportedFolder } from './workspace-filesystem';
import {
  DEMO_WORKSPACE_ID,
  WebCodingWorkspaceRepository,
} from './workspace-storage';

export type WorkspaceFile = {
  path: string;
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
};

export type WorkspaceStorageMode = 'loading' | 'indexed-db' | 'memory';

export type PreviewSnapshot = {
  revision: number;
  status: 'waiting' | 'synced' | 'error';
  message?: string;
};

type WorkspaceCheckpoint = Pick<WorkspaceSnapshot, 'files' | 'activePath'> & {
  deletedPaths: string[];
};

type UpdateFileOptions = {
  coalesce?: boolean;
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
      };
      this.deletedPaths = [...(persisted.deletedPaths ?? [])];
      this.history = [this.createCheckpoint()];
      this.historyIndex = 0;
      this.savedFiles = this.snapshot.files.map((file) => ({ ...file }));
    } catch {
      this.snapshot = { ...this.snapshot, storageMode: 'memory' };
    }
    this.notify();
  }

  async importFolder(folder: ImportedFolder): Promise<void> {
    if (folder.files.length === 0) {
      throw new Error(
        'No supported HTML, CSS, JS, text, or preview asset files were found.'
      );
    }

    await this.persistQueue;
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
      };
    } catch {
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
      };
    }

    this.deletedPaths = [];
    this.history = [this.createCheckpoint()];
    this.historyIndex = 0;
    this.savedFiles = this.snapshot.files.map((file) => ({ ...file }));
    this.lastEdit = null;
    this.notify();
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
    };
    const now = Date.now();
    const shouldCoalesce =
      options.coalesce !== false &&
      this.lastEdit?.path === normalizedPath &&
      now - this.lastEdit.timestamp < 750;

    if (shouldCoalesce) {
      this.history[this.historyIndex] = checkpoint;
    } else {
      this.history = [
        ...this.history.slice(0, this.historyIndex + 1),
        checkpoint,
      ];
      this.historyIndex += 1;
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
    this.history = [
      ...this.history.slice(0, this.historyIndex + 1),
      checkpoint,
    ];
    this.historyIndex += 1;
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
    this.history = [
      ...this.history.slice(0, this.historyIndex + 1),
      checkpoint,
    ];
    this.historyIndex += 1;
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
    this.history = [
      ...this.history.slice(0, this.historyIndex + 1),
      checkpoint,
    ];
    this.historyIndex += 1;
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
    const checkpoint = this.history[this.historyIndex];
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
    const checkpoint = this.history[this.historyIndex];
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

  async markSavedIfRevision(expectedRevision: number): Promise<boolean> {
    await this.persistQueue;
    if (this.snapshot.revision !== expectedRevision) return false;
    if (this.snapshot.storageMode === 'indexed-db') {
      await this.repository.clearDeletedPaths();
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
    this.persistQueue = this.persistQueue.then(task).catch(() => {
      if (this.snapshot.storageMode === 'indexed-db') {
        this.snapshot = { ...this.snapshot, storageMode: 'memory' };
        this.notify();
      }
    });
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

function attributeValue(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  );
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function resolveLocalPath(
  fromPath: string,
  requestedPath: string
): string | null {
  const path = requestedPath.trim().split(/[?#]/, 1)[0];
  if (!path || /^(?:[a-z][a-z\d+.-]*:|\/\/|#|data:)/i.test(path)) {
    return null;
  }

  const base = fromPath.split('/');
  base.pop();
  const segments = (path.startsWith('/') ? [] : base).concat(path.split('/'));
  const normalized: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      normalized.pop();
    } else {
      normalized.push(segment);
    }
  }
  return normalized.join('/') || null;
}

function findReferencedFile(
  files: readonly WorkspaceFile[],
  fromPath: string,
  requestedPath: string,
  language: WorkspaceFile['language']
): WorkspaceFile | undefined {
  const resolvedPath = resolveLocalPath(fromPath, requestedPath);
  return resolvedPath
    ? files.find(
        (file) => file.path === resolvedPath && file.language === language
      )
    : undefined;
}

export type WorkspaceAssetUrls = Readonly<Record<string, string>>;

export type PreviewBridgeMessage =
  | { type: 'context-action.preview.ready'; revision: number }
  | {
      type: 'context-action.preview.error';
      revision: number;
      message: string;
    };

function appendPreviewBridge(html: string, revision: number): string {
  const bridge = `<script>(function(){const revision=${revision};let failed=false;const send=function(message){window.parent.postMessage(Object.assign({revision:revision},message),'*')};const reportError=function(message){if(failed)return;failed=true;send({type:'context-action.preview.error',message:message||'Preview runtime error'})};window.addEventListener('error',function(event){reportError(event.message||'Preview runtime error')});window.addEventListener('unhandledrejection',function(event){const reason=event.reason;reportError(reason&&reason.message?String(reason.message):String(reason||'Unhandled preview rejection'))});window.addEventListener('DOMContentLoaded',function(){if(!failed)send({type:'context-action.preview.ready'})})})();</script>`;
  if (/<head\b[^>]*>/i.test(html)) {
    return html.replace(
      /<head\b[^>]*>/i,
      (openingTag) => `${openingTag}${bridge}`
    );
  }
  if (/<body\b[^>]*>/i.test(html)) {
    return html.replace(
      /<body\b[^>]*>/i,
      (openingTag) => `${bridge}${openingTag}`
    );
  }
  return `${bridge}${html}`;
}

function buildMissingPreviewDocument(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HTML entry required</title>
    <style>
      :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, sans-serif; }
      body { display: grid; min-height: 100vh; margin: 0; place-items: center; background: #0d1016; color: #e7e9ef; }
      main { max-width: 420px; padding: 28px; border: 1px solid #3b315f; border-radius: 16px; background: #171326; box-shadow: 0 18px 48px rgb(0 0 0 / 28%); }
      span { color: #b9a9ff; font: 700 11px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; text-transform: uppercase; }
      h1 { margin: 12px 0 8px; font-size: 22px; letter-spacing: -.03em; }
      p { margin: 0; color: #a4aabd; font-size: 13px; line-height: 1.6; }
      code { color: #e4dfff; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    </style>
  </head>
  <body>
    <main>
      <span>Preview waiting</span>
      <h1>Add an HTML entry file</h1>
      <p>The workspace has no HTML file to render. Add <code>index.html</code> or another <code>.html</code> file, then refresh the preview.</p>
    </main>
  </body>
</html>`;
}

export function findPreviewHtmlFile(
  files: readonly WorkspaceFile[]
): WorkspaceFile | undefined {
  return (
    files.find((file) => file.path === 'index.html') ??
    files.find((file) => file.language === 'html')
  );
}

export function findPreviewStylesheetFile(
  files: readonly WorkspaceFile[]
): WorkspaceFile | undefined {
  return (
    files.find((file) => file.path === 'styles.css') ??
    files.find((file) => file.language === 'css')
  );
}

function rewriteCssAssetUrls(
  source: string,
  cssPath: string,
  assetUrls: WorkspaceAssetUrls
): string {
  return source.replace(
    /url\(\s*(["']?)([^)"']+)\1\s*\)/gi,
    (match, _quote: string, requestedPath: string) => {
      const resolvedPath = resolveLocalPath(cssPath, requestedPath);
      const assetUrl = resolvedPath ? assetUrls[resolvedPath] : undefined;
      return assetUrl ? `url("${assetUrl}")` : match;
    }
  );
}

function inlineStylesheets(
  html: string,
  htmlPath: string,
  files: readonly WorkspaceFile[],
  assetUrls: WorkspaceAssetUrls
): string {
  return html.replace(/<link\b[^>]*>/gi, (tag) => {
    const href = attributeValue(tag, 'href');
    const rel = attributeValue(tag, 'rel')?.toLowerCase() ?? '';
    if (
      !href ||
      (!rel.includes('stylesheet') && !/\.css(?:[?#]|$)/i.test(href))
    ) {
      return tag;
    }

    const css = findReferencedFile(files, htmlPath, href, 'css');
    return css
      ? `<style data-workspace-source="${css.path}">${rewriteCssAssetUrls(css.source, css.path, assetUrls)}</style>`
      : '';
  });
}

function inlineScripts(
  html: string,
  htmlPath: string,
  files: readonly WorkspaceFile[]
): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) => {
    const src = attributeValue(tag, 'src');
    if (!src) return tag;

    const javascript = findReferencedFile(files, htmlPath, src, 'javascript');
    if (!javascript) return '';

    const openingTag = tag.match(/^<script\b([^>]*)>/i)?.[1] ?? '';
    const attributes = openingTag.replace(
      /\s+src\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
      ''
    );
    return `<script${attributes}>${javascript.source}</script>`;
  });
}

function rewriteHtmlAssetReferences(
  html: string,
  htmlPath: string,
  assetUrls: WorkspaceAssetUrls
): string {
  const assetTags = new Set([
    'audio',
    'embed',
    'image',
    'img',
    'link',
    'object',
    'source',
    'track',
    'video',
  ]);
  return html.replace(/<([a-z][\w:-]*)\b[^>]*>/gi, (tag, tagName: string) => {
    if (!assetTags.has(tagName.toLowerCase())) return tag;
    return tag.replace(
      /(\s(?:data|href|poster|src)\s*=\s*)(["']?)([^"'\s>]+)\2/gi,
      (attribute, prefix: string, quote: string, requestedPath: string) => {
        const resolvedPath = resolveLocalPath(htmlPath, requestedPath);
        const assetUrl = resolvedPath ? assetUrls[resolvedPath] : undefined;
        return assetUrl ? `${prefix}${quote}${assetUrl}${quote}` : attribute;
      }
    );
  });
}

export function buildPreviewDocument(
  files: WorkspaceFile[],
  assetUrls: WorkspaceAssetUrls = {},
  previewRevision?: number
): string {
  const htmlFile = findPreviewHtmlFile(files);
  if (!htmlFile) {
    const diagnostic = buildMissingPreviewDocument();
    return previewRevision === undefined
      ? diagnostic
      : appendPreviewBridge(diagnostic, previewRevision);
  }

  const withStyles = inlineStylesheets(
    htmlFile.source,
    htmlFile.path,
    files,
    assetUrls
  );
  const withScripts = inlineScripts(withStyles, htmlFile.path, files);
  const withAssets = rewriteHtmlAssetReferences(
    withScripts,
    htmlFile.path,
    assetUrls
  );
  return previewRevision === undefined
    ? withAssets
    : appendPreviewBridge(withAssets, previewRevision);
}
