export type WorkspaceFile = {
  path: string;
  language: string;
  source: string;
};

export type WorkspaceSnapshot = {
  files: WorkspaceFile[];
  activePath: string;
  revision: number;
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
  private snapshot: WorkspaceSnapshot = {
    files: createInitialFiles(),
    activePath: 'index.html',
    revision: 1,
  };

  private listeners = new Set<() => void>();

  getSnapshot = (): WorkspaceSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

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
    this.notify();
  }

  updateFile(path: string, source: string): WorkspaceSnapshot {
    const nextFiles = this.snapshot.files.map((file) =>
      file.path === path ? { ...file, source } : file
    );
    if (!nextFiles.some((file) => file.path === path)) {
      throw new Error(`Workspace file not found: ${path}`);
    }
    this.snapshot = {
      ...this.snapshot,
      files: nextFiles,
      revision: this.snapshot.revision + 1,
    };
    this.notify();
    return this.getSnapshot();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

export function buildPreviewDocument(files: WorkspaceFile[]): string {
  const html = files.find((file) => file.path === 'index.html')?.source ?? '';
  const css = files.find((file) => file.path === 'styles.css')?.source ?? '';
  const javascript = files.find((file) => file.path === 'app.js')?.source ?? '';

  return html
    .replace(
      '<link rel="stylesheet" href="styles.css" />',
      `<style>${css}</style>`
    )
    .replace(
      '<script src="app.js"></script>',
      `<script>${javascript}</script>`
    );
}
