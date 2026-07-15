import type { ImportedFolder } from './workspace-filesystem';
import {
  DEMO_WORKSPACE_ID,
  WebCodingWorkspaceRepository,
} from './workspace-storage';

export type WorkspaceFile = {
  path: string;
  language: string;
  source: string;
};

export type WorkspaceSnapshot = {
  rootName: string;
  files: WorkspaceFile[];
  activePath: string;
  revision: number;
  storageMode: WorkspaceStorageMode;
};

export type WorkspaceStorageMode = 'loading' | 'indexed-db' | 'memory';

type WorkspaceCheckpoint = Pick<WorkspaceSnapshot, 'files' | 'activePath'>;

type UpdateFileOptions = {
  coalesce?: boolean;
};

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
      this.snapshot = {
        ...this.snapshot,
        rootName: persisted.rootName,
        files: persisted.files,
        activePath: persisted.activePath,
        storageMode: 'indexed-db',
      };
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
      throw new Error('No supported HTML, CSS, JS, or text files were found.');
    }

    await this.persistQueue;
    const activePath =
      folder.files.find((file) => file.path === 'index.html')?.path ??
      folder.files.find((file) => file.language === 'html')?.path ??
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
      };
    } catch {
      this.snapshot = {
        ...this.snapshot,
        rootName: folder.rootName || 'workspace',
        files: folder.files.map((file) => ({ ...file })),
        activePath,
        storageMode: 'memory',
        revision: this.snapshot.revision + 1,
      };
    }

    this.history = [this.createCheckpoint()];
    this.historyIndex = 0;
    this.savedFiles = this.snapshot.files.map((file) => ({ ...file }));
    this.lastEdit = null;
    this.notify();
  }

  getFile(path: string): WorkspaceFile {
    const file = this.snapshot.files.find(
      (candidate) => candidate.path === path
    );
    if (!file) throw new Error(`Workspace file not found: ${path}`);
    return file;
  }

  setActivePath(path: string): void {
    this.getFile(path);
    this.snapshot = { ...this.snapshot, activePath: path };
    if (this.snapshot.storageMode === 'indexed-db') {
      this.enqueuePersistence(() => this.repository.setActivePath(path));
    }
    this.notify();
  }

  updateFile(
    path: string,
    source: string,
    options: UpdateFileOptions = {}
  ): WorkspaceSnapshot {
    const nextFiles = this.snapshot.files.map((file) =>
      file.path === path ? { ...file, source } : file
    );
    if (!nextFiles.some((file) => file.path === path)) {
      throw new Error(`Workspace file not found: ${path}`);
    }
    const checkpoint: WorkspaceCheckpoint = {
      activePath: this.snapshot.activePath,
      files: nextFiles,
    };
    const now = Date.now();
    const shouldCoalesce =
      options.coalesce !== false &&
      this.lastEdit?.path === path &&
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

    this.lastEdit = { path, timestamp: now };
    this.applyCheckpoint(checkpoint);
    if (this.snapshot.storageMode === 'indexed-db') {
      this.enqueuePersistence(() =>
        this.repository.saveFile(this.getFile(path))
      );
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
    return this.snapshot.files.some((file) => {
      const savedFile = this.savedFiles.find(
        (candidate) => candidate.path === file.path
      );
      return !savedFile || savedFile.source !== file.source;
    });
  }

  undo(): WorkspaceSnapshot {
    if (!this.canUndo()) return this.getSnapshot();
    this.historyIndex -= 1;
    this.lastEdit = null;
    this.applyCheckpoint(this.history[this.historyIndex]);
    this.notify();
    return this.getSnapshot();
  }

  redo(): WorkspaceSnapshot {
    if (!this.canRedo()) return this.getSnapshot();
    this.historyIndex += 1;
    this.lastEdit = null;
    this.applyCheckpoint(this.history[this.historyIndex]);
    this.notify();
    return this.getSnapshot();
  }

  markSaved(): void {
    this.savedFiles = this.snapshot.files.map((file) => ({ ...file }));
    this.snapshot = { ...this.snapshot };
    this.notify();
  }

  private createCheckpoint(): WorkspaceCheckpoint {
    return {
      activePath: this.snapshot.activePath,
      files: this.snapshot.files,
    };
  }

  private applyCheckpoint(checkpoint: WorkspaceCheckpoint): void {
    this.snapshot = {
      ...checkpoint,
      rootName: this.snapshot.rootName,
      storageMode: this.snapshot.storageMode,
      revision: this.snapshot.revision + 1,
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

export function buildPreviewDocument(files: WorkspaceFile[]): string {
  const htmlFile =
    files.find((file) => file.path === 'index.html') ??
    files.find((file) => file.language === 'html');
  const html = htmlFile?.source ?? '';
  const directory = htmlFile?.path.includes('/')
    ? htmlFile.path.slice(0, htmlFile.path.lastIndexOf('/'))
    : '';
  const css =
    files.find((file) => file.path === 'styles.css') ??
    files.find(
      (file) =>
        file.language === 'css' && file.path === `${directory}/styles.css`
    ) ??
    files.find((file) => file.language === 'css');
  const javascript =
    files.find((file) => file.path === 'app.js') ??
    files.find(
      (file) =>
        file.language === 'javascript' && file.path === `${directory}/app.js`
    ) ??
    files.find((file) => file.language === 'javascript');

  return html
    .replace(
      /<link\s+[^>]*href=["'][^"']+["'][^>]*>/i,
      css ? `<style>${css.source}</style>` : ''
    )
    .replace(
      /<script\s+[^>]*src=["'][^"']+["'][^>]*><\/script>/i,
      javascript ? `<script>${javascript.source}</script>` : ''
    );
}
