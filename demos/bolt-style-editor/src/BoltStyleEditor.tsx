import { createToolContext, type ToolRegistry } from '@context-action/react';
import {
  type KeyboardEvent,
  type ReactNode,
  type UIEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  buildFileTree,
  collectDirectoryPaths,
  type FileTreeEntry,
} from './file-tree';
import {
  DEFAULT_OPENROUTER_SETTINGS,
  type OpenRouterSettings,
  readOpenRouterSettings,
  runOpenRouterAgent,
  saveOpenRouterSettings,
} from './openrouter';
import {
  denyPendingToolApprovals,
  requestToolApproval,
  resolveToolApproval,
  toolApprovalStore,
} from './tool-approval';
import { type BoltStyleToolSchema, boltStyleToolSchema } from './tool-schema';
import {
  clearToolTrace,
  recordToolCall,
  recordToolList,
  toolTraceStore,
} from './tool-trace';
import {
  BrowserWorkspace,
  buildPreviewDocument,
  findPreviewHtmlFile,
  findPreviewStylesheetFile,
  type PreviewBridgeMessage,
  type WorkspaceFile,
} from './workspace';
import { BrowserWorkspaceFileSystemAdapter } from './workspace-filesystem';

const {
  Provider: BoltStyleToolProvider,
  useToolHandler: useBoltStyleToolHandler,
  useToolRegistry: useBoltStyleToolRegistry,
} = createToolContext('BoltStyleWebEditor', {
  schema: boltStyleToolSchema,
  debug: true,
  onToolCall: recordToolCall,
  toolPolicy: ({ context, definition, request }) => {
    const isPromptAgentCall = context?.metadata?.interaction === 'prompt';
    if (
      (!isPromptAgentCall && context?.source !== 'model') ||
      definition.annotations?.readOnlyHint === true
    ) {
      return 'allow';
    }
    return requestToolApproval({ request, definition, context });
  },
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

type ToolExecutionOutcome = {
  ok: boolean;
  message?: string;
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

type SyntaxToken = {
  className?: string;
  value: string;
};

function pushPlainToken(tokens: SyntaxToken[], value: string) {
  if (value) tokens.push({ value });
}

function tokenizeHtmlTag(tag: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let tagNameSeen = false;
  let cursor = 0;
  const parts = /(<\/?|\/?>|[A-Za-z][\w:-]*|=|"[^"\n]*"|'[^'\n]*')/g;
  let match = parts.exec(tag);

  while (match) {
    pushPlainToken(tokens, tag.slice(cursor, match.index));
    const value = match[0];
    const className =
      value.startsWith('"') || value.startsWith("'")
        ? 'syntax-string'
        : value.startsWith('<') || value.endsWith('>')
          ? 'syntax-tag'
          : !tagNameSeen && value !== '=' && !value.startsWith('/')
            ? 'syntax-tag'
            : value === '='
              ? undefined
              : 'syntax-attribute';
    if (className === 'syntax-tag' && /^[A-Za-z]/.test(value)) {
      tagNameSeen = true;
    }
    tokens.push({ className, value });
    cursor = match.index + value.length;
    match = parts.exec(tag);
  }
  pushPlainToken(tokens, tag.slice(cursor));
  return tokens;
}

function highlightHtmlLine(line: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let cursor = 0;
  const parts = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g;
  let match = parts.exec(line);

  while (match) {
    pushPlainToken(tokens, line.slice(cursor, match.index));
    if (match[0].startsWith('<!--')) {
      tokens.push({ className: 'syntax-comment', value: match[0] });
    } else {
      tokens.push(...tokenizeHtmlTag(match[0]));
    }
    cursor = match.index + match[0].length;
    match = parts.exec(line);
  }
  pushPlainToken(tokens, line.slice(cursor));
  return tokens;
}

function highlightScriptLine(
  line: string,
  language: WorkspaceFile['language']
): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let cursor = 0;
  const parts =
    language === 'css'
      ? /(\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:important|from|to|and|or|not)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\())/g
      : /(\/\*[\s\S]*?\*\/|\/\/.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|new|true|false|null|undefined|async|await|class|this|import|export)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\())/g;
  let match = parts.exec(line);

  while (match) {
    pushPlainToken(tokens, line.slice(cursor, match.index));
    const value = match[0];
    const className =
      value.startsWith('/*') || value.startsWith('//')
        ? 'syntax-comment'
        : value.startsWith('"') ||
            value.startsWith("'") ||
            value.startsWith('`')
          ? 'syntax-string'
          : /^\d/.test(value)
            ? 'syntax-number'
            : /^(const|let|var|function|return|if|else|for|while|new|true|false|null|undefined|async|await|class|this|import|export|important|from|to|and|or|not)$/.test(
                  value
                )
              ? 'syntax-keyword'
              : 'syntax-function';
    tokens.push({ className, value });
    cursor = match.index + value.length;
    match = parts.exec(line);
  }
  pushPlainToken(tokens, line.slice(cursor));
  return tokens;
}

function highlightSourceLine(
  line: string,
  language: WorkspaceFile['language']
): SyntaxToken[] {
  if (language === 'html') return highlightHtmlLine(line);
  if (language === 'css' || language === 'javascript') {
    return highlightScriptLine(line, language);
  }
  return [{ value: line }];
}

function resultText(result: {
  isError?: boolean;
  error?: { message?: string };
  content?: Array<{ text?: string }>;
  structuredContent?: unknown;
}): string {
  if (result.isError) {
    const message =
      result.error?.message?.trim() ||
      result.content
        ?.map((block) => block.text?.trim())
        .find((text): text is string => Boolean(text));
    return message || 'Tool call failed.';
  }
  return JSON.stringify(result.structuredContent ?? {}, null, 2);
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const reason = signal.reason;
  throw reason instanceof Error
    ? reason
    : new DOMException('Execution cancelled.', 'AbortError');
}

function isPreviewBridgeMessage(value: unknown): value is PreviewBridgeMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as {
    type?: unknown;
    revision?: unknown;
    message?: unknown;
  };
  return (
    typeof message.revision === 'number' &&
    (message.type === 'context-action.preview.ready' ||
      (message.type === 'context-action.preview.error' &&
        typeof message.message === 'string'))
  );
}

function OpenRouterSettingsDialog({
  initialSettings,
  onClose,
  onSave,
}: {
  initialSettings: OpenRouterSettings;
  onClose: () => void;
  onSave: (settings: OpenRouterSettings) => void;
}) {
  const [draft, setDraft] = useState(initialSettings);
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="settings-backdrop" role="presentation">
      <section
        aria-labelledby="openrouter-settings-title"
        aria-modal="true"
        className="settings-dialog"
        role="dialog"
      >
        <div className="settings-heading">
          <div>
            <span className="panel-label">Provider settings</span>
            <h2 id="openrouter-settings-title">OpenRouter API</h2>
          </div>
          <button
            aria-label="Close OpenRouter settings"
            className="settings-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <p className="settings-intro">
          Save a user-owned key for direct browser requests. The local agent
          remains available when no key is configured.
        </p>

        <label className="settings-field">
          <span>OpenRouter API key</span>
          <div className="secret-input-wrap">
            <input
              autoFocus
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  apiKey: event.target.value,
                }))
              }
              placeholder="sk-or-v1-…"
              type={showKey ? 'text' : 'password'}
              value={draft.apiKey}
            />
            <button
              className="reveal-button"
              onClick={() => setShowKey((current) => !current)}
              type="button"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <label className="settings-field">
          <span>Model ID</span>
          <input
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                model: event.target.value,
              }))
            }
            placeholder="openai/gpt-4o-mini"
            value={draft.model}
          />
        </label>

        <label className="settings-field">
          <span>Chat completions endpoint</span>
          <input
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                endpoint: event.target.value,
              }))
            }
            value={draft.endpoint}
          />
        </label>

        <div className="settings-note">
          <span className="status-dot" />
          Stored in this browser origin and sent directly to the configured
          endpoint. It is not committed to the repository.
        </div>

        <div className="settings-actions">
          <button
            className="settings-reset"
            onClick={() =>
              setDraft({
                ...DEFAULT_OPENROUTER_SETTINGS,
                apiKey: '',
              })
            }
            type="button"
          >
            Clear key
          </button>
          <div>
            <button className="settings-cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="settings-save"
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              type="button"
            >
              Save settings
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CreateWorkspaceFileDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (path: string, source: string) => Promise<ToolExecutionOutcome>;
}) {
  const [path, setPath] = useState('notes.md');
  const [source, setSource] = useState('# New workspace file\n');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !path.trim()) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const outcome = await onCreate(path, source);
      if (outcome.ok) onClose();
      else setErrorMessage(outcome.message?.trim() || 'File creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="settings-backdrop" role="presentation">
      <form
        aria-labelledby="create-file-title"
        aria-modal="true"
        className="settings-dialog create-file-dialog"
        onSubmit={(event) => void handleSubmit(event)}
        role="dialog"
      >
        <div className="settings-heading">
          <div>
            <span className="panel-label">Workspace</span>
            <h2 id="create-file-title">New file</h2>
          </div>
          <button
            aria-label="Close new file dialog"
            className="settings-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <p className="settings-intro">
          Create a text file in the browser workspace. The new file becomes the
          active tab and is included in the next folder save.
        </p>
        <label className="settings-field">
          <span>File path</span>
          <input
            autoFocus
            aria-label="New file path"
            onChange={(event) => setPath(event.target.value)}
            placeholder="src/notes.md"
            value={path}
          />
        </label>
        <label className="settings-field">
          <span>Initial source</span>
          <textarea
            aria-label="Initial file source"
            className="create-file-source"
            onChange={(event) => setSource(event.target.value)}
            rows={8}
            value={source}
          />
        </label>
        {errorMessage ? (
          <p className="create-file-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="settings-note">
          <span className="status-dot" />
          Text files only · paths are normalized by workspace.createFile.
        </div>
        <div className="settings-actions">
          <span />
          <div>
            <button className="settings-cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="settings-save"
              disabled={submitting || !path.trim()}
              type="submit"
            >
              {submitting ? 'Creating…' : 'Create file'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function inferWorkspacePath(prompt: string): string | null {
  const explicitPath = prompt.match(
    /(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:html?|css|m?js|json|md|txt|tsx?|jsx?)(?=\b|[^A-Za-z0-9_.-])/i
  )?.[0];
  if (explicitPath) return explicitPath;
  if (/\breadme\b/i.test(prompt)) return 'README.md';
  if (/\bindex\b/i.test(prompt)) return 'index.html';
  if (/\bstyles?\b/i.test(prompt)) return 'styles.css';
  if (/\bapp\b/i.test(prompt)) return 'app.js';
  if (/\bnotes?\b/i.test(prompt)) return 'notes.md';
  return null;
}

function promptToToolCalls(prompt: string): ToolCall[] {
  const normalized = prompt.toLowerCase();
  const calls: ToolCall[] = [];
  const deleteRequest =
    /(delete|remove|삭제|지워)/i.test(prompt) && /(file|파일)/i.test(prompt);
  const requestedPath = inferWorkspacePath(prompt);

  if (deleteRequest && requestedPath) {
    calls.push({
      name: 'workspace.deleteFile',
      arguments: { path: requestedPath },
    });
  }

  if (deleteRequest && !requestedPath) {
    return [{ name: 'workspace.listFiles', arguments: {} }];
  }

  if (/(create|new|생성|만들)/i.test(prompt) && /(file|파일)/i.test(prompt)) {
    calls.push({
      name: 'workspace.createFile',
      arguments: {
        path: requestedPath ?? 'notes.md',
        source:
          '# New workspace file\n\nCreated through the typed workspace.createFile tool.\n',
      },
    });
  }

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
  prompt: string,
  signal?: AbortSignal
): Promise<{ toolNames: string[]; response: string }> {
  const listedTools = registry.listTools({ method: 'tools/list' });
  recordToolList(listedTools.tools.length, 'local');
  const calls = promptToToolCalls(prompt);
  const toolNames: string[] = [];

  for (const call of calls) {
    throwIfAborted(signal);
    const result = await registry.callTool(
      {
        id: `local-${Date.now()}-${call.name}`,
        method: 'tools/call',
        params: { name: call.name, arguments: call.arguments },
      },
      {
        context: { source: 'local', metadata: { interaction: 'prompt' } },
        signal,
      }
    );
    throwIfAborted(signal);
    toolNames.push(call.name);
    if (result.isError) {
      return { toolNames, response: resultText(result) };
    }
  }

  return {
    toolNames,
    response:
      toolNames.length === 1 &&
      toolNames[0] === 'workspace.listFiles' &&
      /(delete|remove|삭제|지워)/i.test(prompt) &&
      /(file|파일)/i.test(prompt) &&
      !inferWorkspacePath(prompt)
        ? 'Which file should I delete? Include a path such as README.md.'
        : `Local agent called ${toolNames.join(', ')} and refreshed the sandbox preview.`,
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
    const dirtyPaths = new Set(
      workspace.getDirtyFiles().map((file) => file.path)
    );
    return {
      activePath: snapshot.activePath,
      revision: snapshot.revision,
      dirty: workspace.isDirty(),
      deletedPaths: workspace.getDeletedPaths(),
      files: snapshot.files.map(
        ({ path, language, source, kind, mimeType, blob }) => ({
          path,
          language,
          size: blob?.size ?? source.length,
          kind: kind ?? 'text',
          mimeType,
          dirty: dirtyPaths.has(path),
        })
      ),
    };
  });

  useBoltStyleToolHandler('workspace.readFile', ({ path }) => {
    const file = workspace.getFile(path);
    if (file.kind === 'asset') {
      throw new Error(`Binary asset cannot be returned as text: ${path}`);
    }
    return { path, source: file.source };
  });

  useBoltStyleToolHandler<'workspace.createFile', unknown>(
    'workspace.createFile',
    async ({ path, source }, controller) => {
      const snapshot = workspace.createFile(path, source);
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        path: snapshot.activePath,
        language: workspace.getFile(snapshot.activePath).language,
        revision: snapshot.revision,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.deleteFile', unknown>(
    'workspace.deleteFile',
    async ({ path }, controller) => {
      const snapshot = workspace.deleteFile(path);
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        path,
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.writeFile', unknown>(
    'workspace.writeFile',
    async ({ path, source }, controller) => {
      if (workspace.getFile(path).kind === 'asset') {
        throw new Error(`Binary asset cannot be replaced as text: ${path}`);
      }
      const snapshot = workspace.updateFile(path, source, { coalesce: false });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return { path, revision: snapshot.revision, preview: 'synced' };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.revertFile', unknown>(
    'workspace.revertFile',
    async ({ path }, controller) => {
      const snapshot = workspace.revertFile(path);
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        path,
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'preview.setTheme', unknown>(
    'preview.setTheme',
    async ({ theme }, controller) => {
      const file = findPreviewStylesheetFile(workspace.getSnapshot().files);
      if (!file)
        throw new Error('No CSS stylesheet was found in the workspace.');
      const tokens = themeTokens[theme];
      const source = file.source
        .replace(/--accent:\s*#[0-9a-f]+;/i, `--accent: ${tokens.accent};`)
        .replace(
          /--accent-soft:\s*#[0-9a-f]+;/i,
          `--accent-soft: ${tokens.soft};`
        );
      const snapshot = workspace.updateFile(file.path, source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return { theme, revision: snapshot.revision, preview: 'synced' };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'preview.addFeature', unknown>(
    'preview.addFeature',
    async ({ title, description }, controller) => {
      const file = findPreviewHtmlFile(workspace.getSnapshot().files);
      if (!file)
        throw new Error('No HTML entry file was found in the workspace.');
      const card = `<article class="feature-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></article>`;
      if (!file.source.includes('<!-- feature-slot -->')) {
        throw new Error(
          `The HTML entry file does not expose a feature slot: ${file.path}`
        );
      }
      const source = file.source.replace(
        '<!-- feature-slot -->',
        () => `${card}\n        <!-- feature-slot -->`
      );
      const snapshot = workspace.updateFile(file.path, source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return { title, revision: snapshot.revision, preview: 'synced' };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'preview.updateHero', unknown>(
    'preview.updateHero',
    async ({ title, subtitle }, controller) => {
      const file = findPreviewHtmlFile(workspace.getSnapshot().files);
      if (!file)
        throw new Error('No HTML entry file was found in the workspace.');
      if (!/<h1\b[^>]*id=["']hero-title["'][^>]*>/i.test(file.source)) {
        throw new Error(
          `The HTML entry file has no hero title target: ${file.path}`
        );
      }
      if (!/<p\b[^>]*id=["']hero-subtitle["'][^>]*>/i.test(file.source)) {
        throw new Error(
          `The HTML entry file has no hero subtitle target: ${file.path}`
        );
      }
      const source = file.source
        .replace(
          /(<h1\b[^>]*id=["']hero-title["'][^>]*>)[\s\S]*?(<\/h1>)/i,
          (_match, opening, closing) =>
            `${opening}${escapeHtml(title)}${closing}`
        )
        .replace(
          /(<p\b[^>]*id=["']hero-subtitle["'][^>]*>)[\s\S]*?(<\/p>)/i,
          (_match, opening, closing) =>
            `${opening}${escapeHtml(subtitle)}${closing}`
        );
      const snapshot = workspace.updateFile(file.path, source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return { title, revision: snapshot.revision, preview: 'synced' };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler('preview.getStatus', () => {
    const snapshot = workspace.getSnapshot();
    return {
      revision: snapshot.revision,
      status: snapshot.preview.status,
      message: snapshot.preview.message,
      runtime: 'sandbox iframe',
    };
  });

  return <>{children}</>;
}

function FileTreeEntryView({
  entry,
  depth,
  expandedPaths,
  activePath,
  dirtyPaths,
  disabled,
  onToggle,
  onSelect,
}: {
  entry: FileTreeEntry;
  depth: number;
  expandedPaths: ReadonlySet<string>;
  activePath: string;
  dirtyPaths: ReadonlySet<string>;
  disabled: boolean;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}) {
  const indentation = { paddingLeft: `${12 + depth * 15}px` };

  if (entry.kind === 'directory') {
    const expanded = expandedPaths.has(entry.path);
    return (
      <div key={entry.path}>
        <button
          aria-expanded={expanded}
          className="directory-row"
          disabled={disabled}
          onClick={() => onToggle(entry.path)}
          style={indentation}
          type="button"
        >
          <span className="directory-chevron" aria-hidden="true">
            {expanded ? '⌄' : '›'}
          </span>
          <span className="directory-icon" aria-hidden="true">
            ▱
          </span>
          <span>{entry.name}</span>
        </button>
        {expanded
          ? entry.children.map((child) => (
              <FileTreeEntryView
                activePath={activePath}
                depth={depth + 1}
                disabled={disabled}
                dirtyPaths={dirtyPaths}
                entry={child}
                expandedPaths={expandedPaths}
                key={child.path}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            ))
          : null}
      </div>
    );
  }

  return (
    <button
      className={`file-row ${entry.path === activePath ? 'file-row-active' : ''} ${dirtyPaths.has(entry.path) ? 'file-row-dirty' : ''}`}
      disabled={disabled}
      onClick={() => onSelect(entry.path)}
      style={indentation}
      title={entry.path}
      type="button"
    >
      <FileIcon file={entry.file} />
      <span>{entry.name}</span>
      {dirtyPaths.has(entry.path) ? (
        <span
          aria-label="Unsaved changes"
          className="file-dirty-dot"
          title="Unsaved changes"
        >
          •
        </span>
      ) : null}
    </button>
  );
}

function FileTree({
  files,
  activePath,
  dirtyPaths,
  disabled,
  onSelect,
}: {
  files: readonly WorkspaceFile[];
  activePath: string;
  dirtyPaths: ReadonlySet<string>;
  disabled: boolean;
  onSelect: (path: string) => void;
}) {
  const entries = useMemo(() => buildFileTree(files), [files]);
  const directoryPaths = collectDirectoryPaths(entries);
  const directorySignature = directoryPaths.join('\u0000');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(directoryPaths)
  );

  useEffect(() => {
    setExpandedPaths(new Set(directoryPaths));
  }, [directorySignature]);

  const toggleDirectory = (path: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="file-tree">
      {entries.map((entry) => (
        <FileTreeEntryView
          activePath={activePath}
          depth={0}
          disabled={disabled}
          dirtyPaths={dirtyPaths}
          entry={entry}
          expandedPaths={expandedPaths}
          key={entry.path}
          onSelect={onSelect}
          onToggle={toggleDirectory}
        />
      ))}
    </div>
  );
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

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTraceId(id: string): string {
  return id.length > 18 ? `…${id.slice(-17)}` : id;
}

function CodeEditor({
  file,
  disabled = false,
  onChange,
}: {
  file: WorkspaceFile;
  disabled?: boolean;
  onChange: (source: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const highlightedSource = useMemo(
    () =>
      file.source
        .split('\n')
        .map((line) => highlightSourceLine(line, file.language)),
    [file.language, file.source]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight) return;
    textarea.scrollTop = 0;
    textarea.scrollLeft = 0;
    highlight.scrollTop = 0;
    highlight.scrollLeft = 0;
  }, [file.path]);

  const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const highlight = highlightRef.current;
    if (!highlight) return;
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextSource = `${file.source.slice(0, start)}  ${file.source.slice(end)}`;
    onChange(nextSource);
    window.requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(start + 2, start + 2);
    });
  };

  return (
    <div className="code-scroll">
      <pre ref={highlightRef} aria-hidden="true" className="code-highlight">
        {highlightedSource.map((line, index) => (
          <span className="code-line" key={`${file.path}-highlight-${index}`}>
            <span className="line-number">
              {String(index + 1).padStart(2, '0')}
            </span>
            <code>
              {line.length > 0
                ? line.map((token, tokenIndex) => (
                    <span
                      className={token.className}
                      key={`${file.path}-${index}-${tokenIndex}`}
                    >
                      {token.value}
                    </span>
                  ))
                : ' '}
            </code>
          </span>
        ))}
      </pre>
      <textarea
        ref={textareaRef}
        aria-label="Editable workspace source"
        className="code-input"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        spellCheck={false}
        value={file.source}
        wrap="off"
      />
    </div>
  );
}

function EditorWorkbench({ workspace }: { workspace: BrowserWorkspace }) {
  const registry = useBoltStyleToolRegistry();
  const snapshot = useSyncExternalStore(
    workspace.subscribe,
    workspace.getSnapshot,
    workspace.getSnapshot
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const expectedPreviewRevisionRef = useRef(snapshot.revision);
  useEffect(() => {
    expectedPreviewRevisionRef.current = snapshot.revision;
  }, [snapshot.revision]);
  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent<unknown>) => {
      const iframeWindow = iframeRef.current?.contentWindow;
      if (!iframeWindow || event.source !== iframeWindow) return;
      if (!isPreviewBridgeMessage(event.data)) return;
      if (event.data.revision !== expectedPreviewRevisionRef.current) return;

      if (event.data.type === 'context-action.preview.ready') {
        workspace.setPreviewStatus(event.data.revision, 'synced');
      } else {
        workspace.setPreviewStatus(
          event.data.revision,
          'error',
          event.data.message
        );
      }
    };

    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, [workspace]);
  const [prompt, setPrompt] = useState(
    '보라색 테마로 바꾸고 기능 카드를 추가해줘'
  );
  const [running, setRunning] = useState(false);
  const executionControllerRef = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Describe a change and I will turn it into visible workspace tool calls.',
    },
  ]);
  const [openRouterSettings, setOpenRouterSettings] = useState(
    readOpenRouterSettings
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateFile, setShowCreateFile] = useState(false);
  const [openingFolder, setOpeningFolder] = useState(false);
  const [saving, setSaving] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileSystemAdapter = useMemo(
    () => new BrowserWorkspaceFileSystemAdapter(),
    []
  );
  const traceEntries = useSyncExternalStore(
    toolTraceStore.subscribe,
    toolTraceStore.getSnapshot,
    toolTraceStore.getSnapshot
  );
  const pendingApprovals = useSyncExternalStore(
    toolApprovalStore.subscribe,
    toolApprovalStore.getSnapshot,
    toolApprovalStore.getSnapshot
  );

  const activeFile =
    snapshot.files.find((file) => file.path === snapshot.activePath) ??
    snapshot.files[0];
  const dirtyPaths = useMemo(
    () => new Set(workspace.getDirtyFiles().map((file) => file.path)),
    [snapshot, workspace]
  );
  const canRevertActiveFile = dirtyPaths.has(activeFile.path);
  const canDeleteActiveFile =
    snapshot.files.length > 1 &&
    (activeFile.language !== 'html' ||
      snapshot.files.some(
        (file) => file.path !== activeFile.path && file.language === 'html'
      ));
  const assetUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    for (const file of snapshot.files) {
      if (file.kind === 'asset' && file.blob) {
        urls[file.path] = URL.createObjectURL(file.blob);
      }
    }
    return urls;
  }, [snapshot.files]);
  useEffect(() => {
    return () => {
      for (const url of Object.values(assetUrls)) URL.revokeObjectURL(url);
    };
  }, [assetUrls]);
  const previewDocument = useMemo(
    () => buildPreviewDocument(snapshot.files, assetUrls, snapshot.revision),
    [assetUrls, snapshot.files, snapshot.revision]
  );
  const toolNames = registry.getToolNames().map(String);
  const [selectedToolName, setSelectedToolName] = useState(
    () => toolNames[0] ?? ''
  );
  const [toolFilter, setToolFilter] = useState('');
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0);
  const visibleToolNames = useMemo(() => {
    const query = toolFilter.trim().toLowerCase();
    return query
      ? toolNames.filter((name) => name.toLowerCase().includes(query))
      : toolNames;
  }, [toolFilter, toolNames]);
  useEffect(() => {
    if (visibleToolNames.includes(selectedToolName)) return;
    setSelectedToolName(visibleToolNames[0] ?? '');
  }, [selectedToolName, visibleToolNames]);
  const selectedToolDefinition = selectedToolName
    ? registry.getToolDefinition(selectedToolName)
    : undefined;
  const isStorageReady = snapshot.storageMode !== 'loading';
  const storageLabel =
    snapshot.storageMode === 'indexed-db'
      ? 'Dexie · IndexedDB'
      : snapshot.storageMode === 'loading'
        ? 'Loading workspace'
        : 'Memory fallback';
  const previewStatusLabel =
    snapshot.preview.status === 'synced'
      ? 'synced'
      : snapshot.preview.status === 'error'
        ? 'runtime error'
        : 'waiting';

  const refreshPreview = () => {
    if (!isStorageReady) return;
    workspace.setPreviewStatus(snapshot.revision, 'waiting');
    setPreviewRefreshToken((current) => current + 1);
  };

  useEffect(() => {
    folderInputRef.current?.setAttribute('webkitdirectory', '');
  }, []);

  const importFolder = async (
    imported: Awaited<
      ReturnType<BrowserWorkspaceFileSystemAdapter['importFileList']>
    >
  ) => {
    await workspace.importFolder(imported);
    const skippedMessage = imported.skipped.length
      ? ` Skipped ${imported.skipped.length} unsupported or oversized file(s).`
      : '';
    const syncMessage = fileSystemAdapter.hasWritableFolder
      ? ' Folder sync is enabled for Save.'
      : ' Changes are saved to the browser workspace.';
    setMessages((current) => [
      ...current,
      {
        role: 'assistant',
        text: `Opened ${imported.rootName} with ${imported.files.length} file(s).${syncMessage}${skippedMessage}`,
      },
    ]);
  };

  const handleFolderInput = async (fileList: FileList | null) => {
    if (!fileList) return;
    setOpeningFolder(true);
    try {
      await importFolder(await fileSystemAdapter.importFileList(fileList));
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            error instanceof Error ? error.message : 'Folder import failed.',
        },
      ]);
    } finally {
      setOpeningFolder(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleOpenFolder = async () => {
    if (openingFolder || !isStorageReady) return;
    const picker = (
      window as Window & {
        showDirectoryPicker?: unknown;
      }
    ).showDirectoryPicker;
    if (!picker) {
      folderInputRef.current?.click();
      return;
    }

    setOpeningFolder(true);
    try {
      await importFolder(await fileSystemAdapter.pickFolder());
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            error instanceof Error ? error.message : 'Folder import failed.',
        },
      ]);
    } finally {
      setOpeningFolder(false);
    }
  };

  const saveWorkspace = async () => {
    if (saving || !isStorageReady || !workspace.isDirty()) return;
    const dirtyFiles = workspace.getDirtyFiles();
    const deletedPaths = workspace.getDeletedPaths();
    setSaving(true);
    try {
      if (fileSystemAdapter.hasWritableFolder) {
        await fileSystemAdapter.writeFiles(dirtyFiles);
        await fileSystemAdapter.removeFiles(deletedPaths);
        await workspace.markSaved();
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            text: `Saved ${dirtyFiles.length} file(s)${deletedPaths.length ? ` and deleted ${deletedPaths.length} file(s)` : ''} in the selected folder and browser workspace.`,
          },
        ]);
      } else {
        await workspace.markSaved();
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: error instanceof Error ? error.message : 'Save failed.',
        },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const downloadActiveFile = () => {
    const blob =
      activeFile.kind === 'asset' && activeFile.blob
        ? activeFile.blob
        : new Blob([activeFile.source], {
            type: activeFile.mimeType ?? 'text/plain',
          });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = activeFile.path.split('/').pop() ?? 'workspace-file';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => {
      anchor.remove();
      URL.revokeObjectURL(url);
    }, 0);
    setMessages((current) => [
      ...current,
      { role: 'assistant', text: `Downloaded ${activeFile.path}.` },
    ]);
  };

  useEffect(() => {
    const handleSaveShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== 's' ||
        showSettings ||
        showCreateFile
      ) {
        return;
      }
      event.preventDefault();
      void saveWorkspace();
    };

    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [isStorageReady, saving, showCreateFile, showSettings, workspace]);

  const cancelExecution = () => {
    denyPendingToolApprovals();
    const controller = executionControllerRef.current;
    if (controller && !controller.signal.aborted) controller.abort();
  };

  const executePrompt = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || running) return;
    const controller = new AbortController();
    executionControllerRef.current = controller;
    setPrompt('');
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setRunning(true);
    try {
      const result = openRouterSettings.apiKey
        ? await runOpenRouterAgent(
            registry,
            trimmed,
            openRouterSettings,
            controller.signal
          )
        : await runLocalAgent(registry, trimmed, controller.signal);
      throwIfAborted(controller.signal);
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: result.response, tools: result.toolNames },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: controller.signal.aborted
            ? 'Execution cancelled.'
            : error instanceof Error
              ? error.message
              : 'Request failed.',
        },
      ]);
    } finally {
      if (executionControllerRef.current === controller) {
        executionControllerRef.current = null;
      }
      setRunning(false);
    }
  };

  const executeQuickTool = async (
    call: ToolCall
  ): Promise<ToolExecutionOutcome> => {
    if (running) {
      return {
        ok: false,
        message: 'Another tool execution is already running.',
      };
    }
    const controller = new AbortController();
    executionControllerRef.current = controller;
    setRunning(true);
    try {
      const result = await registry.callTool(
        {
          id: `palette-${Date.now()}`,
          method: 'tools/call',
          params: { name: call.name, arguments: call.arguments },
        },
        { context: { source: 'local' }, signal: controller.signal }
      );
      throwIfAborted(controller.signal);
      const message = result.isError
        ? resultText(result)
        : `Executed ${call.name}. Preview revision acknowledged.`;
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: message,
          tools: [call.name],
        },
      ]);
      return result.isError ? { ok: false, message } : { ok: true };
    } catch (error) {
      const message = controller.signal.aborted
        ? 'Execution cancelled.'
        : error instanceof Error && error.message.trim()
          ? error.message
          : 'Tool execution failed.';
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: message,
          tools: [call.name],
        },
      ]);
      return { ok: false, message };
    } finally {
      if (executionControllerRef.current === controller) {
        executionControllerRef.current = null;
      }
      setRunning(false);
    }
  };

  const createWorkspaceFile = (path: string, source: string) =>
    executeQuickTool({
      name: 'workspace.createFile',
      arguments: { path, source },
    });

  const deleteActiveFile = () => {
    if (!canDeleteActiveFile || running) return;
    if (!window.confirm(`Delete ${activeFile.path} from this workspace?`)) {
      return;
    }
    void executeQuickTool({
      name: 'workspace.deleteFile',
      arguments: { path: activeFile.path },
    });
  };

  const revertActiveFile = () => {
    if (!canRevertActiveFile || running) return;
    if (
      !window.confirm(
        `Discard unsaved changes in ${activeFile.path}? Undo can restore this session's edit.`
      )
    ) {
      return;
    }
    void executeQuickTool({
      name: 'workspace.revertFile',
      arguments: { path: activeFile.path },
    });
  };

  const paletteCallFor = (name: string): ToolCall | null => {
    switch (name) {
      case 'workspace.listFiles':
      case 'preview.getStatus':
        return { name, arguments: {} };
      case 'workspace.readFile':
        return { name, arguments: { path: activeFile.path } };
      case 'workspace.createFile':
        return {
          name,
          arguments: {
            path: 'notes.md',
            source: '# Created from the tool palette\n',
          },
        };
      case 'workspace.deleteFile':
        return { name, arguments: { path: 'README.md' } };
      case 'workspace.writeFile':
        return {
          name,
          arguments: { path: activeFile.path, source: activeFile.source },
        };
      case 'workspace.revertFile':
        return { name, arguments: { path: activeFile.path } };
      case 'preview.setTheme':
        return { name, arguments: { theme: 'violet' } };
      case 'preview.addFeature':
        return {
          name,
          arguments: {
            title: 'Palette feature',
            description: 'Added from the visible tool palette.',
          },
        };
      case 'preview.updateHero':
        return {
          name,
          arguments: {
            title: 'A page shaped by a tool call.',
            subtitle: 'The visible registry can update the hero copy directly.',
          },
        };
      default:
        return null;
    }
  };

  const runSelectedTool = async () => {
    if (!selectedToolName || !selectedToolDefinition) return;
    const call = paletteCallFor(selectedToolName);
    if (!call) return;
    if (
      selectedToolDefinition.annotations?.destructiveHint === true &&
      !window.confirm(`Run the destructive sample for ${selectedToolName}?`)
    ) {
      return;
    }
    await executeQuickTool(call);
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
          <span className="workspace-name">{snapshot.rootName}</span>
          <span className="mode-chip">
            <span className="status-dot" />
            {openRouterSettings.apiKey ? 'OpenRouter' : 'Local agent'}
          </span>
          <span className="storage-chip">{storageLabel}</span>
          {fileSystemAdapter.hasWritableFolder ? (
            <span className="folder-sync-chip">folder sync</span>
          ) : null}
          <span className="contract-chip">tools/list · {toolNames.length}</span>
        </div>
        <div className="topbar-actions">
          <button
            aria-label="Open OpenRouter settings"
            className="settings-trigger"
            onClick={() => setShowSettings(true)}
            type="button"
          >
            ⚙ Settings
          </button>
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
          <div className="explorer-heading">
            <div className="panel-label">Explorer</div>
            <div className="explorer-actions">
              <button
                aria-label="Create new workspace file"
                className="new-file-button"
                disabled={openingFolder || !isStorageReady || running}
                onClick={() => setShowCreateFile(true)}
                title="Create a new text file"
                type="button"
              >
                + New
              </button>
              <button
                className="open-folder-button"
                disabled={openingFolder || !isStorageReady || running}
                onClick={() => void handleOpenFolder()}
                type="button"
              >
                {openingFolder ? 'Opening…' : 'Open'}
              </button>
            </div>
            <input
              ref={folderInputRef}
              accept=".avif,.css,.gif,.htm,.html,.ico,.jpeg,.jpg,.js,.json,.mjs,.md,.otf,.png,.svg,.ts,.tsx,.ttf,.txt,.wasm,.webp,.woff,.woff2"
              aria-label="Choose workspace folder"
              className="folder-input"
              multiple
              onChange={(event) => void handleFolderInput(event.target.files)}
              type="file"
            />
          </div>
          <div className="tree-root">
            <span>⌄</span> {snapshot.rootName}
          </div>
          <FileTree
            activePath={snapshot.activePath}
            disabled={!isStorageReady}
            dirtyPaths={dirtyPaths}
            files={snapshot.files}
            onSelect={(path) => workspace.setActivePath(path)}
          />

          <div className="sidebar-section-heading">
            <span>Tools</span>
            <span className="count-badge">
              {visibleToolNames.length === toolNames.length
                ? toolNames.length
                : `${visibleToolNames.length}/${toolNames.length}`}
            </span>
          </div>
          <label className="tool-filter">
            <span className="sr-only">Filter tools</span>
            <input
              aria-label="Filter tools"
              disabled={!isStorageReady}
              onChange={(event) => setToolFilter(event.target.value)}
              placeholder="Filter tools…"
              type="search"
              value={toolFilter}
            />
            {toolFilter ? (
              <button
                aria-label="Clear tool filter"
                onClick={() => setToolFilter('')}
                type="button"
              >
                ×
              </button>
            ) : null}
          </label>
          <div className="tool-palette">
            {visibleToolNames.length ? (
              visibleToolNames.map((name) => (
                <button
                  className={`tool-row ${name === selectedToolName ? 'tool-row-selected' : ''}`}
                  data-tool-name={name}
                  disabled={!isStorageReady || running}
                  key={name}
                  onClick={() => setSelectedToolName(name)}
                  type="button"
                >
                  <span className="tool-glyph">
                    {name.startsWith('preview') ? '◈' : '◇'}
                  </span>
                  <span>{name}</span>
                </button>
              ))
            ) : (
              <div className="tool-filter-empty">No matching tools</div>
            )}
          </div>
          {selectedToolDefinition ? (
            <section
              aria-label="Selected tool definition"
              className="tool-inspector"
            >
              <div className="tool-inspector-heading">
                <span>Definition</span>
                <span className="tool-inspector-format">MCP</span>
              </div>
              <strong>{selectedToolDefinition.name}</strong>
              <p>{selectedToolDefinition.description}</p>
              <div className="tool-annotations">
                {Object.entries(selectedToolDefinition.annotations ?? {})
                  .filter(([, value]) => Boolean(value))
                  .map(([key]) => (
                    <span key={key}>{key}</span>
                  ))}
              </div>
              <button
                className="tool-run-button"
                disabled={
                  !isStorageReady ||
                  running ||
                  !paletteCallFor(selectedToolName)
                }
                onClick={() => void runSelectedTool()}
                type="button"
              >
                {selectedToolDefinition.annotations?.destructiveHint
                  ? 'Run destructive sample'
                  : 'Run sample'}
              </button>
              <pre>
                {JSON.stringify(selectedToolDefinition.inputSchema, null, 2)}
              </pre>
            </section>
          ) : null}
          <div className="trace-section">
            <div className="sidebar-section-heading">
              <span>Execution trace</span>
              <span className="trace-heading-actions">
                <button
                  aria-label="Clear execution trace"
                  className="trace-clear-button"
                  disabled={!traceEntries.length}
                  onClick={clearToolTrace}
                  type="button"
                >
                  Clear
                </button>
                <span className="count-badge">{traceEntries.length}</span>
              </span>
            </div>
            <div aria-label="Tool execution trace" className="trace-list">
              {traceEntries.length ? (
                traceEntries.slice(0, 8).map((entry) => (
                  <div
                    className={`trace-row trace-row-${entry.status}`}
                    key={entry.id}
                    title={
                      entry.kind === 'call'
                        ? `toolCallId ${entry.id}`
                        : 'tools/list discovery'
                    }
                  >
                    <span className="trace-mark" aria-hidden="true">
                      {entry.status === 'running'
                        ? '…'
                        : entry.status === 'failed'
                          ? '!'
                          : '✓'}
                    </span>
                    <span className="trace-copy">
                      <strong>{entry.name}</strong>
                      <small>
                        {entry.kind === 'discovery'
                          ? entry.summary
                          : [
                              formatTraceId(entry.id),
                              entry.source,
                              `${entry.durationMs ?? 0}ms`,
                              entry.summary,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                      </small>
                    </span>
                  </div>
                ))
              ) : (
                <div className="trace-empty">
                  tools/list ready · waiting for a call
                </div>
              )}
            </div>
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
                  {dirtyPaths.has(file.path) ? (
                    <span
                      aria-label="Unsaved changes"
                      className="tab-dirty-dot"
                      title="Unsaved changes"
                    >
                      •
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="editor-controls">
              <button
                aria-label="Undo last edit"
                className="editor-action"
                disabled={!isStorageReady || !workspace.canUndo()}
                onClick={() => workspace.undo()}
                type="button"
              >
                ↶ Undo
              </button>
              <button
                aria-label="Redo last edit"
                className="editor-action"
                disabled={!isStorageReady || !workspace.canRedo()}
                onClick={() => workspace.redo()}
                type="button"
              >
                ↷ Redo
              </button>
              <button
                aria-label={`Delete ${activeFile.path}`}
                className="editor-delete"
                disabled={!isStorageReady || running || !canDeleteActiveFile}
                onClick={deleteActiveFile}
                title="Delete the active file through workspace.deleteFile"
                type="button"
              >
                Delete
              </button>
              <button
                aria-label={`Revert ${activeFile.path}`}
                className="editor-revert"
                disabled={!isStorageReady || running || !canRevertActiveFile}
                onClick={revertActiveFile}
                title="Discard active file changes through workspace.revertFile"
                type="button"
              >
                Revert
              </button>
              <button
                aria-label={`Download ${activeFile.path}`}
                className="editor-download"
                disabled={!isStorageReady || running}
                onClick={downloadActiveFile}
                title="Download the active source or Blob asset"
                type="button"
              >
                Download
              </button>
              <button
                aria-keyshortcuts="Control+S Meta+S"
                className="editor-save"
                disabled={!isStorageReady || saving || !workspace.isDirty()}
                onClick={() => void saveWorkspace()}
                title={
                  fileSystemAdapter.hasWritableFolder
                    ? 'Write dirty files to the selected folder and IndexedDB'
                    : 'Mark the current browser workspace checkpoint as saved'
                }
                type="button"
              >
                {saving
                  ? 'Saving…'
                  : fileSystemAdapter.hasWritableFolder
                    ? 'Save to folder'
                    : 'Save'}
              </button>
              <span
                className={`save-status ${workspace.isDirty() ? 'save-status-dirty' : ''}`}
              >
                <span className="status-dot" />
                {workspace.isDirty() ? 'Unsaved changes' : 'Saved'}
              </span>
              <span className="revision-label">
                revision {snapshot.revision}
              </span>
            </div>
          </div>
          <section className="code-editor" aria-label="Workspace source">
            <div className="code-header">
              <span>{activeFile.language}</span>
              <span>
                {activeFile.kind === 'asset'
                  ? 'preview asset · read-only'
                  : 'editable source · auto-sync preview'}
              </span>
            </div>
            {activeFile.kind === 'asset' ? (
              <div className="asset-placeholder">
                <div className="asset-placeholder-icon">◇</div>
                <strong>{activeFile.path}</strong>
                <span>
                  {activeFile.mimeType ?? 'binary asset'} ·{' '}
                  {formatFileSize(activeFile.blob?.size ?? 0)}
                </span>
                <p>
                  This Blob is preserved in the browser workspace and available
                  to the sandbox preview. Binary assets are not edited as text.
                </p>
              </div>
            ) : (
              <CodeEditor
                disabled={!isStorageReady}
                file={activeFile}
                onChange={(source) =>
                  workspace.updateFile(activeFile.path, source)
                }
              />
            )}
          </section>

          <section className="chat-panel">
            <div className="chat-heading">
              <div>
                <span className="panel-label">Agent</span>
                <strong>What should we change?</strong>
              </div>
              <span className="agent-badge">LOCAL / TOOL CALLING</span>
            </div>
            {pendingApprovals.length ? (
              <section
                aria-label="Pending tool approvals"
                className="approval-panel"
              >
                <div className="approval-heading">
                  <span className="approval-dot" />
                  <strong>Approval required</strong>
                  <span>{pendingApprovals.length}</span>
                </div>
                {pendingApprovals.map((approval) => (
                  <div className="approval-request" key={approval.id}>
                    <strong>{approval.name}</strong>
                    <p>{approval.description}</p>
                    <small>
                      {approval.argumentKeys.length
                        ? `arguments · ${approval.argumentKeys.join(', ')}`
                        : 'no arguments'}{' '}
                      · {approval.source}
                    </small>
                    {approval.safeArgumentPreview ? (
                      <code className="approval-argument-preview">
                        {approval.safeArgumentPreview}
                      </code>
                    ) : null}
                    <div className="approval-actions">
                      <button
                        aria-label={`Deny ${approval.name}`}
                        className="approval-deny"
                        onClick={() => resolveToolApproval(approval.id, 'deny')}
                        type="button"
                      >
                        Deny
                      </button>
                      <button
                        aria-label={`Approve ${approval.name}`}
                        className="approval-allow"
                        onClick={() =>
                          resolveToolApproval(approval.id, 'allow')
                        }
                        type="button"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            ) : null}
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
                disabled={!isStorageReady}
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
                className={`send-button ${running ? 'send-button-cancel' : ''}`}
                disabled={!isStorageReady}
                onClick={() =>
                  running ? cancelExecution() : void executePrompt(prompt)
                }
                type="button"
              >
                {running ? 'Cancel' : 'Send'} <span>{running ? '×' : '↗'}</span>
              </button>
            </div>
            <div className="prompt-chips">
              {['Make it emerald', 'Add a feature card', 'Update the hero'].map(
                (example) => (
                  <button
                    disabled={!isStorageReady || running}
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
            <span
              className={`preview-status preview-status-${snapshot.preview.status}`}
            >
              <span className="status-dot" /> {previewStatusLabel}
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
                preview://{snapshot.rootName}/{activeFile.path}
              </div>
              <button
                aria-label="Refresh preview"
                className="refresh-button"
                disabled={!isStorageReady}
                onClick={refreshPreview}
                title="Reload the current workspace revision"
                type="button"
              >
                ↻
              </button>
            </div>
            <iframe
              className="preview-iframe"
              ref={iframeRef}
              sandbox="allow-scripts"
              srcDoc={previewDocument}
              title="Live generated web preview"
              key={previewRefreshToken}
            />
          </div>
          <div className="preview-footer">
            <div>
              <span className="panel-label">Runtime</span>
              <strong>Parent registry → iframe</strong>
            </div>
            <div className={`sync-row sync-row-${snapshot.preview.status}`}>
              <span className="status-dot" /> revision {snapshot.revision}{' '}
              {snapshot.preview.status === 'synced'
                ? 'acknowledged'
                : snapshot.preview.status === 'error'
                  ? (snapshot.preview.message ?? 'failed')
                  : 'pending acknowledgement'}
            </div>
          </div>
        </aside>
      </div>

      <footer className="studio-statusbar">
        <span>
          <span className="status-dot" /> Ready
        </span>
        <span>
          {openRouterSettings.apiKey
            ? `OpenRouter · ${openRouterSettings.model}`
            : `Context-Action ToolContext · ${storageLabel}`}
        </span>
        <span>Persistent browser workspace</span>
        <span className="statusbar-spacer" />
        <span>HTML · CSS · JS</span>
      </footer>
      {showSettings ? (
        <OpenRouterSettingsDialog
          initialSettings={openRouterSettings}
          onClose={() => setShowSettings(false)}
          onSave={(settings) =>
            setOpenRouterSettings(saveOpenRouterSettings(settings))
          }
        />
      ) : null}
      {showCreateFile ? (
        <CreateWorkspaceFileDialog
          onClose={() => setShowCreateFile(false)}
          onCreate={createWorkspaceFile}
        />
      ) : null}
    </div>
  );
}

function ToolRuntime() {
  const [workspace] = useState(() => new BrowserWorkspace());
  useEffect(() => {
    void workspace.hydrate();
  }, [workspace]);
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
