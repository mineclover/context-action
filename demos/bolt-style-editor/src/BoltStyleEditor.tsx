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
  DEFAULT_OPENROUTER_SETTINGS,
  type OpenRouterSettings,
  readOpenRouterSettings,
  runOpenRouterAgent,
  saveOpenRouterSettings,
} from './openrouter';
import { type BoltStyleToolSchema, boltStyleToolSchema } from './tool-schema';
import {
  BrowserWorkspace,
  buildPreviewDocument,
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
    const snapshot = workspace.updateFile(path, source, { coalesce: false });
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
    const snapshot = workspace.updateFile('styles.css', source, {
      coalesce: false,
    });
    return { theme, revision: snapshot.revision, preview: 'synced' };
  });

  useBoltStyleToolHandler('preview.addFeature', ({ title, description }) => {
    const file = workspace.getFile('index.html');
    const card = `<article class="feature-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></article>`;
    const source = file.source.replace(
      '<!-- feature-slot -->',
      `${card}\n        <!-- feature-slot -->`
    );
    const snapshot = workspace.updateFile('index.html', source, {
      coalesce: false,
    });
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
    const snapshot = workspace.updateFile('index.html', source, {
      coalesce: false,
    });
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

  const activeFile =
    snapshot.files.find((file) => file.path === snapshot.activePath) ??
    snapshot.files[0];
  const previewDocument = useMemo(
    () => buildPreviewDocument(snapshot.files),
    [snapshot.files]
  );
  const toolNames = registry.getToolNames().map(String);
  const isStorageReady = snapshot.storageMode !== 'loading';
  const storageLabel =
    snapshot.storageMode === 'indexed-db'
      ? 'Dexie · IndexedDB'
      : snapshot.storageMode === 'loading'
        ? 'Loading workspace'
        : 'Memory fallback';

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

  const executePrompt = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || running) return;
    setPrompt('');
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setRunning(true);
    try {
      const result = openRouterSettings.apiKey
        ? await runOpenRouterAgent(registry, trimmed, openRouterSettings)
        : await runLocalAgent(registry, trimmed);
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: result.response, tools: result.toolNames },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: error instanceof Error ? error.message : 'Request failed.',
        },
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

  const paletteCallFor = (name: string): ToolCall | null => {
    switch (name) {
      case 'workspace.listFiles':
      case 'preview.getStatus':
        return { name, arguments: {} };
      case 'workspace.readFile':
        return { name, arguments: { path: activeFile.path } };
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
              accept=".css,.htm,.html,.js,.json,.mjs,.md,.ts,.tsx,.txt"
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
          <div className="file-tree">
            {snapshot.files.map((file) => (
              <button
                className={`file-row ${file.path === snapshot.activePath ? 'file-row-active' : ''}`}
                disabled={!isStorageReady}
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
                disabled={!isStorageReady || running}
                key={name}
                onClick={() => {
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
              <span>editable source · auto-sync preview</span>
            </div>
            <CodeEditor
              disabled={!isStorageReady}
              file={activeFile}
              onChange={(source) =>
                workspace.updateFile(activeFile.path, source)
              }
            />
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
                className="send-button"
                disabled={running || !isStorageReady}
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
                preview://{snapshot.rootName}/{activeFile.path}
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
