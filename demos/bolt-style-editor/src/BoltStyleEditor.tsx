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
import { recordToolCall, recordToolList, toolTraceStore } from './tool-trace';
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
    if (
      context?.source !== 'model' ||
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
  structuredContent?: unknown;
}): string {
  if (result.isError) return result.error?.message ?? 'Tool call failed.';
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

function promptToToolCalls(prompt: string): ToolCall[] {
  const normalized = prompt.toLowerCase();
  const calls: ToolCall[] = [];

  if (/(create|new|생성|만들)/i.test(prompt) && /(file|파일)/i.test(prompt)) {
    calls.push({
      name: 'workspace.createFile',
      arguments: {
        path: 'notes.md',
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
      { context: { source: 'local' }, signal }
    );
    throwIfAborted(signal);
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
      files: snapshot.files.map(
        ({ path, language, source, kind, mimeType, blob }) => ({
          path,
          language,
          size: blob?.size ?? source.length,
          kind: kind ?? 'text',
          mimeType,
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
    }
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
    }
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
    }
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
    }
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
    }
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
  disabled,
  onToggle,
  onSelect,
}: {
  entry: FileTreeEntry;
  depth: number;
  expandedPaths: ReadonlySet<string>;
  activePath: string;
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
      className={`file-row ${entry.path === activePath ? 'file-row-active' : ''}`}
      disabled={disabled}
      onClick={() => onSelect(entry.path)}
      style={indentation}
      title={entry.path}
      type="button"
    >
      <FileIcon file={entry.file} />
      <span>{entry.name}</span>
    </button>
  );
}

function FileTree({
  files,
  activePath,
  disabled,
  onSelect,
}: {
  files: readonly WorkspaceFile[];
  activePath: string;
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
    setSaving(true);
    try {
      if (fileSystemAdapter.hasWritableFolder) {
        await fileSystemAdapter.writeFiles(dirtyFiles);
        workspace.markSaved();
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            text: `Saved ${dirtyFiles.length} file(s) to the selected folder and browser workspace.`,
          },
        ]);
      } else {
        workspace.markSaved();
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

  const executeQuickTool = async (call: ToolCall) => {
    if (running) return;
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
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: controller.signal.aborted
            ? 'Execution cancelled.'
            : error instanceof Error
              ? error.message
              : 'Tool execution failed.',
          tools: [call.name],
        },
      ]);
    } finally {
      if (executionControllerRef.current === controller) {
        executionControllerRef.current = null;
      }
      setRunning(false);
    }
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
      case 'workspace.writeFile':
        return {
          name,
          arguments: { path: activeFile.path, source: activeFile.source },
        };
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
            <button
              className="open-folder-button"
              disabled={openingFolder || !isStorageReady}
              onClick={() => void handleOpenFolder()}
              type="button"
            >
              {openingFolder ? 'Opening…' : 'Open folder'}
            </button>
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
            files={snapshot.files}
            onSelect={(path) => workspace.setActivePath(path)}
          />

          <div className="sidebar-section-heading">
            <span>Tools</span>
            <span className="count-badge">{toolNames.length}</span>
          </div>
          <div className="tool-palette">
            {toolNames.map((name) => (
              <button
                className={`tool-row ${name === selectedToolName ? 'tool-row-selected' : ''}`}
                data-tool-name={name}
                disabled={!isStorageReady || running}
                key={name}
                onClick={() => {
                  setSelectedToolName(name);
                  const call = paletteCallFor(name);
                  if (call) void executeQuickTool(call);
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
              <pre>
                {JSON.stringify(selectedToolDefinition.inputSchema, null, 2)}
              </pre>
            </section>
          ) : null}
          <div className="trace-section">
            <div className="sidebar-section-heading">
              <span>Execution trace</span>
              <span className="count-badge">{traceEntries.length}</span>
            </div>
            <div aria-label="Tool execution trace" className="trace-list">
              {traceEntries.length ? (
                traceEntries.slice(0, 8).map((entry) => (
                  <div
                    className={`trace-row trace-row-${entry.status}`}
                    key={entry.id}
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
                          : `${entry.source} · ${entry.durationMs ?? 0}ms`}
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
              <span className="refresh-icon">↻</span>
            </div>
            <iframe
              className="preview-iframe"
              ref={iframeRef}
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
