import { createToolContext, type ToolRegistry } from '@context-action/react';
import { type ReactNode, useMemo, useState, useSyncExternalStore } from 'react';
import { type BoltStyleToolSchema, boltStyleToolSchema } from './tool-schema';
import {
  BrowserWorkspace,
  buildPreviewDocument,
  type WorkspaceFile,
} from './workspace';

const {
  Provider: BoltStyleToolProvider,
  useToolHandler: useBoltStyleToolHandler,
  useToolRegistry: useBoltStyleToolRegistry,
} = createToolContext('BoltStyleWebEditor', {
  schema: boltStyleToolSchema,
  debug: true,
});

type BoltStyleRegistry = ToolRegistry<BoltStyleToolSchema>;

type Message = {
  role: 'user' | 'assistant';
  text: string;
  tools?: string[];
};

type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

const themeTokens = {
  violet: { accent: '#8b5cf6', soft: '#f0eaff' },
  emerald: { accent: '#10b981', soft: '#e7fbf3' },
  amber: { accent: '#f59e0b', soft: '#fff5dc' },
  rose: { accent: '#f43f5e', soft: '#ffedf0' },
} as const;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] ?? character;
  });
}

function resultText(result: {
  isError?: boolean;
  error?: { message?: string };
  structuredContent?: unknown;
}): string {
  if (result.isError) return result.error?.message ?? 'Tool call failed.';
  return JSON.stringify(result.structuredContent ?? {}, null, 2);
}

function promptToToolCalls(prompt: string): ToolCall[] {
  const normalized = prompt.toLowerCase();
  const calls: ToolCall[] = [];

  const theme =
    normalized.includes('emerald') || normalized.includes('green')
      ? 'emerald'
      : normalized.includes('amber') || normalized.includes('orange')
        ? 'amber'
        : normalized.includes('rose') || normalized.includes('pink')
          ? 'rose'
          : normalized.includes('violet') ||
              normalized.includes('purple') ||
              prompt.includes('보라')
            ? 'violet'
            : null;

  if (theme) {
    calls.push({ name: 'preview.setTheme', arguments: { theme } });
  }

  if (/(feature|card|section|기능|카드)/i.test(prompt)) {
    calls.push({
      name: 'preview.addFeature',
      arguments: {
        title: 'Conversation-driven feature',
        description:
          'A new card was added through a typed Context-Action tool call.',
      },
    });
  }

  if (/(hero|title|landing|제목|랜딩)/i.test(prompt)) {
    calls.push({
      name: 'preview.updateHero',
      arguments: {
        title: 'A page shaped by conversation.',
        subtitle:
          'The agent selected tools, changed the workspace, and refreshed the preview.',
      },
    });
  }

  return calls.length > 0
    ? calls
    : [{ name: 'workspace.listFiles', arguments: {} }];
}

async function runLocalAgent(
  registry: BoltStyleRegistry,
  prompt: string
): Promise<{ toolNames: string[]; response: string }> {
  const calls = promptToToolCalls(prompt);
  const toolNames: string[] = [];

  for (const call of calls) {
    const result = await registry.executeModelToolCall(
      {
        id: `local-${Date.now()}-${call.name}`,
        name: call.name,
        arguments: call.arguments,
      },
      { context: { source: 'model' } }
    );
    toolNames.push(call.name);
    if (result.isError) {
      return { toolNames, response: resultText(result) };
    }
  }

  return {
    toolNames,
    response: `Local agent called ${toolNames.join(', ')} and refreshed the sandbox preview.`,
  };
}

function ToolHandlers({
  workspace,
  children,
}: {
  workspace: BrowserWorkspace;
  children: ReactNode;
}) {
  useBoltStyleToolHandler('workspace.listFiles', () => {
    const snapshot = workspace.getSnapshot();
    return {
      activePath: snapshot.activePath,
      revision: snapshot.revision,
      files: snapshot.files.map(({ path, language, source }) => ({
        path,
        language,
        size: source.length,
      })),
    };
  });

  useBoltStyleToolHandler('workspace.readFile', ({ path }) => {
    const file = workspace.getFile(path);
    return { path, source: file.source };
  });

  useBoltStyleToolHandler('workspace.writeFile', ({ path, source }) => {
    const snapshot = workspace.updateFile(path, source);
    return { path, revision: snapshot.revision, preview: 'synced' };
  });

  useBoltStyleToolHandler('preview.setTheme', ({ theme }) => {
    const file = workspace.getFile('styles.css');
    const tokens = themeTokens[theme];
    const source = file.source
      .replace(/--accent:\s*#[0-9a-f]+;/i, `--accent: ${tokens.accent};`)
      .replace(
        /--accent-soft:\s*#[0-9a-f]+;/i,
        `--accent-soft: ${tokens.soft};`
      );
    const snapshot = workspace.updateFile('styles.css', source);
    return { theme, revision: snapshot.revision, preview: 'synced' };
  });

  useBoltStyleToolHandler('preview.addFeature', ({ title, description }) => {
    const file = workspace.getFile('index.html');
    const card = `<article class="feature-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></article>`;
    const source = file.source.replace(
      '<!-- feature-slot -->',
      `${card}\n        <!-- feature-slot -->`
    );
    const snapshot = workspace.updateFile('index.html', source);
    return { title, revision: snapshot.revision, preview: 'synced' };
  });

  useBoltStyleToolHandler('preview.updateHero', ({ title, subtitle }) => {
    const file = workspace.getFile('index.html');
    const source = file.source
      .replace(
        /(<h1 id="hero-title">)[\s\S]*?(<\/h1>)/,
        `$1${escapeHtml(title)}$2`
      )
      .replace(
        /(<p id="hero-subtitle">)[\s\S]*?(<\/p>)/,
        `$1${escapeHtml(subtitle)}$2`
      );
    const snapshot = workspace.updateFile('index.html', source);
    return { title, revision: snapshot.revision, preview: 'synced' };
  });

  useBoltStyleToolHandler('preview.getStatus', () => {
    const snapshot = workspace.getSnapshot();
    return {
      revision: snapshot.revision,
      status: 'synced',
      runtime: 'sandbox iframe',
    };
  });

  return <>{children}</>;
}

function FileIcon({ file }: { file: WorkspaceFile }) {
  const color =
    file.language === 'html'
      ? 'orange'
      : file.language === 'css'
        ? 'blue'
        : file.language === 'javascript'
          ? 'yellow'
          : 'gray';
  return <span className={`file-icon file-icon-${color}`} aria-hidden="true" />;
}

function EditorWorkbench({ workspace }: { workspace: BrowserWorkspace }) {
  const registry = useBoltStyleToolRegistry();
  const snapshot = useSyncExternalStore(
    workspace.subscribe,
    workspace.getSnapshot,
    workspace.getSnapshot
  );
  const [prompt, setPrompt] = useState(
    '보라색 테마로 바꾸고 기능 카드를 추가해줘'
  );
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Describe a change and I will turn it into visible workspace tool calls.',
    },
  ]);

  const activeFile =
    snapshot.files.find((file) => file.path === snapshot.activePath) ??
    snapshot.files[0];
  const previewDocument = useMemo(
    () => buildPreviewDocument(snapshot.files),
    [snapshot.files]
  );
  const toolNames = registry.getToolNames().map(String);

  const executePrompt = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || running) return;
    setPrompt('');
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setRunning(true);
    try {
      const result = await runLocalAgent(registry, trimmed);
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: result.response, tools: result.toolNames },
      ]);
    } finally {
      setRunning(false);
    }
  };

  const executeQuickTool = async (call: ToolCall) => {
    if (running) return;
    setRunning(true);
    try {
      const result = await registry.executeModelToolCall(
        {
          id: `palette-${Date.now()}`,
          name: call.name,
          arguments: call.arguments,
        },
        { context: { source: 'local' } }
      );
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: result.isError
            ? resultText(result)
            : `Executed ${call.name}. Preview revision acknowledged.`,
          tools: [call.name],
        },
      ]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="studio-shell">
      <header className="studio-topbar">
        <div className="brand-lockup">
          <span className="brand-mark">✦</span>
          <span>Context-Action</span>
          <span className="brand-divider">/</span>
          <strong>Web Studio</strong>
        </div>
        <div className="topbar-center">
          <span className="workspace-name">canvas-landing</span>
          <span className="mode-chip">
            <span className="status-dot" /> Local agent
          </span>
          <span className="contract-chip">tools/list · {toolNames.length}</span>
        </div>
        <div className="topbar-actions">
          <a
            href="https://github.com/mineclover/context-action"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://mineclover.github.io/context-action/example/integrations/live-web-coding"
            target="_blank"
            rel="noreferrer"
          >
            Full demo ↗
          </a>
        </div>
      </header>

      <div className="studio-workspace">
        <aside className="studio-sidebar">
          <div className="panel-label">Explorer</div>
          <div className="tree-root">
            <span>⌄</span> canvas-landing
          </div>
          <div className="file-tree">
            {snapshot.files.map((file) => (
              <button
                className={`file-row ${file.path === snapshot.activePath ? 'file-row-active' : ''}`}
                key={file.path}
                onClick={() => workspace.setActivePath(file.path)}
                type="button"
              >
                <FileIcon file={file} />
                <span>{file.path}</span>
              </button>
            ))}
          </div>

          <div className="sidebar-section-heading">
            <span>Tools</span>
            <span className="count-badge">{toolNames.length}</span>
          </div>
          <div className="tool-palette">
            {toolNames.map((name) => (
              <button
                className="tool-row"
                data-tool-name={name}
                key={name}
                onClick={() => {
                  if (name === 'preview.setTheme') {
                    void executeQuickTool({
                      name,
                      arguments: { theme: 'violet' },
                    });
                  } else if (name === 'preview.addFeature') {
                    void executeQuickTool({
                      name,
                      arguments: {
                        title: 'Palette feature',
                        description: 'Added from the visible tool palette.',
                      },
                    });
                  } else if (
                    name === 'preview.getStatus' ||
                    name === 'workspace.listFiles'
                  ) {
                    void executeQuickTool({ name, arguments: {} });
                  }
                }}
                type="button"
              >
                <span className="tool-glyph">
                  {name.startsWith('preview') ? '◈' : '◇'}
                </span>
                <span>{name}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="studio-main">
          <div className="editor-toolbar">
            <div className="editor-tabs">
              {snapshot.files.map((file) => (
                <button
                  className={`editor-tab ${file.path === snapshot.activePath ? 'editor-tab-active' : ''}`}
                  key={file.path}
                  onClick={() => workspace.setActivePath(file.path)}
                  type="button"
                >
                  <FileIcon file={file} />
                  {file.path}
                </button>
              ))}
            </div>
            <span className="revision-label">revision {snapshot.revision}</span>
          </div>
          <section className="code-editor" aria-label="Workspace source">
            <div className="code-header">
              <span>{activeFile.language}</span>
              <span>read/write through tools</span>
            </div>
            <div className="code-scroll">
              {activeFile.source.split('\n').map((line, index) => (
                <div className="code-line" key={`${activeFile.path}-${index}`}>
                  <span className="line-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <code>{line || ' '}</code>
                </div>
              ))}
            </div>
          </section>

          <section className="chat-panel">
            <div className="chat-heading">
              <div>
                <span className="panel-label">Agent</span>
                <strong>What should we change?</strong>
              </div>
              <span className="agent-badge">LOCAL / TOOL CALLING</span>
            </div>
            <div className="message-list">
              {messages.map((message, index) => (
                <div
                  className={`message message-${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <span className="message-avatar">
                    {message.role === 'assistant' ? '✦' : 'You'}
                  </span>
                  <div>
                    <p>{message.text}</p>
                    {message.tools?.length ? (
                      <div className="message-tools">
                        {message.tools.map((tool) => (
                          <span key={tool}>{tool}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {running ? (
                <div className="running-line">
                  <span className="pulse-dot" /> executing typed tool call…
                </div>
              ) : null}
            </div>
            <div className="composer-wrap">
              <textarea
                aria-label="Web studio prompt"
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void executePrompt(prompt);
                  }
                }}
                placeholder="Ask the local agent to change the page…"
                value={prompt}
              />
              <button
                className="send-button"
                disabled={running}
                onClick={() => void executePrompt(prompt)}
                type="button"
              >
                {running ? 'Running…' : 'Send'} <span>↗</span>
              </button>
            </div>
            <div className="prompt-chips">
              {['Make it emerald', 'Add a feature card', 'Update the hero'].map(
                (example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                    type="button"
                  >
                    {example}
                  </button>
                )
              )}
            </div>
          </section>
        </main>

        <aside className="preview-panel">
          <div className="preview-toolbar">
            <div>
              <span className="panel-label">Preview</span>
              <strong>localhost · sandbox</strong>
            </div>
            <span className="preview-status">
              <span className="status-dot" /> synced
            </span>
          </div>
          <div className="browser-frame">
            <div className="browser-chrome">
              <div className="browser-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="address-bar">
                preview://canvas-landing/index.html
              </div>
              <span className="refresh-icon">↻</span>
            </div>
            <iframe
              className="preview-iframe"
              sandbox="allow-scripts"
              srcDoc={previewDocument}
              title="Live generated web preview"
            />
          </div>
          <div className="preview-footer">
            <div>
              <span className="panel-label">Runtime</span>
              <strong>Parent registry → iframe</strong>
            </div>
            <div className="sync-row">
              <span className="status-dot" /> revision {snapshot.revision}{' '}
              acknowledged
            </div>
          </div>
        </aside>
      </div>

      <footer className="studio-statusbar">
        <span>
          <span className="status-dot" /> Ready
        </span>
        <span>Context-Action ToolContext</span>
        <span>Browser-local workspace</span>
        <span className="statusbar-spacer" />
        <span>HTML · CSS · JS</span>
      </footer>
    </div>
  );
}

function ToolRuntime() {
  const [workspace] = useState(() => new BrowserWorkspace());
  return (
    <ToolHandlers workspace={workspace}>
      <EditorWorkbench workspace={workspace} />
    </ToolHandlers>
  );
}

export function BoltStyleEditor() {
  return (
    <BoltStyleToolProvider>
      <ToolRuntime />
    </BoltStyleToolProvider>
  );
}
