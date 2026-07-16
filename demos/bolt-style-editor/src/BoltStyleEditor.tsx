import {
  type KeyboardEvent,
  type UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  BoltStyleToolProvider,
  useBoltStyleToolRegistry,
} from './bolt-style-tool-context';
import {
  buildFileTree,
  collectDirectoryPaths,
  type FileTreeEntry,
} from './file-tree';
import {
  type EditorMessage,
  useToolExecution,
} from './hooks/use-tool-execution';
import { type ToolCall } from './local-agent-plan';
import {
  readOpenRouterSettings,
  saveOpenRouterSettings,
  subscribeOpenRouterSettings,
} from './openrouter';
import { resolveToolApproval, toolApprovalStore } from './tool-approval';
import { ToolHandlers } from './tool-handlers';
import { formatToolSuccessMessage } from './tool-result-utils';
import { clearToolTrace, toolTraceStore } from './tool-trace';
import {
  ConfirmationDialog,
  type ConfirmationRequest,
  CreateWorkspaceFileDialog,
  OpenRouterSettingsDialog,
  RenameWorkspaceFileDialog,
  useModalDialog,
} from './views/editor-dialogs';
import {
  type ToolCatalogFilter,
  ToolCatalogPanel,
} from './views/tool-catalog-panel';
import { WorkspaceExplorerPanel } from './views/workspace-explorer-panel';
import {
  BrowserWorkspace,
  buildPreviewDocument,
  collectPreviewDiagnostics,
  MAX_TEXT_SOURCE_LENGTH,
  type PreviewBridgeMessage,
  type WorkspaceFile,
} from './workspace';
import { WorkspaceToolError } from './workspace-errors';
import {
  BrowserWorkspaceFileSystemAdapter,
  type ImportedFolder,
} from './workspace-filesystem';
import { WebCodingWorkspaceRepository } from './workspace-storage';

type FolderRestoreState = 'idle' | 'restoring' | 'restored' | 'unavailable';

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
  const isCss = language === 'css';
  let cursor = 0;
  const parts = isCss
    ? /(\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:important|from|to|and|or|not)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\())/g
    : /(\/\*[\s\S]*?\*\/|\/\/.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|new|true|false|null|undefined|async|await|class|this|import|export|interface|type|enum|public|private|protected|readonly|implements|extends|as|unknown|never|void|any|string|number|boolean)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\())/g;
  const keywordPattern = isCss
    ? /^(important|from|to|and|or|not)$/
    : /^(const|let|var|function|return|if|else|for|while|new|true|false|null|undefined|async|await|class|this|import|export|interface|type|enum|public|private|protected|readonly|implements|extends|as|unknown|never|void|any|string|number|boolean)$/;
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
            : keywordPattern.test(value)
              ? 'syntax-keyword'
              : 'syntax-function';
    tokens.push({ className, value });
    cursor = match.index + value.length;
    match = parts.exec(line);
  }
  pushPlainToken(tokens, line.slice(cursor));
  return tokens;
}

function highlightJsonLine(line: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let cursor = 0;
  const parts =
    /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b/g;
  let match = parts.exec(line);

  while (match) {
    pushPlainToken(tokens, line.slice(cursor, match.index));
    const value = match[0];
    const isKey =
      value.startsWith('"') &&
      /^\s*:/.test(line.slice(match.index + value.length));
    tokens.push({
      className: isKey
        ? 'syntax-attribute'
        : value.startsWith('"')
          ? 'syntax-string'
          : /^(true|false|null)$/.test(value)
            ? 'syntax-keyword'
            : 'syntax-number',
      value,
    });
    cursor = match.index + value.length;
    match = parts.exec(line);
  }
  pushPlainToken(tokens, line.slice(cursor));
  return tokens;
}

function highlightMarkdownLine(line: string): SyntaxToken[] {
  if (/^\s*#{1,6}\s/.test(line)) {
    return [{ className: 'syntax-keyword', value: line }];
  }

  const tokens: SyntaxToken[] = [];
  let cursor = 0;
  const parts = /`[^`]*`|\[[^\]]+\]\([^)]*\)|\*\*[^*]+\*\*|^\s*[-*+]\s+/g;
  let match = parts.exec(line);

  while (match) {
    pushPlainToken(tokens, line.slice(cursor, match.index));
    const value = match[0];
    tokens.push({
      className: value.startsWith('`')
        ? 'syntax-string'
        : value.startsWith('[')
          ? 'syntax-attribute'
          : 'syntax-keyword',
      value,
    });
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
  if (
    language === 'css' ||
    language === 'javascript' ||
    language === 'typescript'
  ) {
    return highlightScriptLine(line, language);
  }
  if (language === 'json') return highlightJsonLine(line);
  if (language === 'markdown') return highlightMarkdownLine(line);
  return [{ value: line }];
}

function thrownErrorText(error: unknown, fallback: string): string {
  if (error instanceof WorkspaceToolError) {
    const details =
      error.details === undefined
        ? ''
        : `\n${JSON.stringify(error.details, null, 2)}`;
    return `[${error.code}] ${error.message}${details}`;
  }
  return error instanceof Error ? error.message : fallback;
}

function downloadTextFile(
  value: string,
  filename: string,
  mimeType = 'application/json'
): void {
  const blob = new Blob([value], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

async function writeClipboardText(value: string): Promise<void> {
  const clipboard = navigator.clipboard;
  if (clipboard?.writeText) {
    try {
      await Promise.race([
        clipboard.writeText(value),
        new Promise<never>((_, reject) => {
          window.setTimeout(
            () => reject(new Error('Clipboard access timed out.')),
            800
          );
        }),
      ]);
      return;
    } catch {
      // Fall through to the synchronous browser copy path.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    textarea.remove();
  }
  if (!copied) throw new Error('Clipboard access is unavailable.');
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
    Number.isSafeInteger(message.revision) &&
    message.revision >= 0 &&
    (message.type === 'context-action.preview.ready' ||
      (message.type === 'context-action.preview.error' &&
        typeof message.message === 'string'))
  );
}

const PREVIEW_ERROR_MESSAGE_LIMIT = 240;

function boundPreviewErrorMessage(message: string): string {
  const normalized = message.trim();
  return (normalized || 'Preview runtime error').slice(
    0,
    PREVIEW_ERROR_MESSAGE_LIMIT
  );
}

function FileTreeEntryView({
  entry,
  depth,
  expandedPaths,
  activePath,
  dirtyPaths,
  disabled,
  focusedPath,
  onFocusItem,
  onItemKeyDown,
  registerItem,
  onToggle,
  onSelect,
}: {
  entry: FileTreeEntry;
  depth: number;
  expandedPaths: ReadonlySet<string>;
  activePath: string;
  dirtyPaths: ReadonlySet<string>;
  disabled: boolean;
  focusedPath: string;
  onFocusItem: (path: string) => void;
  onItemKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    entry: FileTreeEntry
  ) => void;
  registerItem: (path: string, element: HTMLButtonElement | null) => void;
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
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${entry.path}`}
          className="directory-row"
          disabled={disabled}
          aria-level={depth + 1}
          onFocus={() => onFocusItem(entry.path)}
          onKeyDown={(event) => onItemKeyDown(event, entry)}
          onClick={() => onToggle(entry.path)}
          ref={(element) => registerItem(entry.path, element)}
          style={indentation}
          tabIndex={focusedPath === entry.path ? 0 : -1}
          type="button"
          role="treeitem"
        >
          <span className="directory-chevron" aria-hidden="true">
            {expanded ? '⌄' : '›'}
          </span>
          <span className="directory-icon" aria-hidden="true">
            ▱
          </span>
          <span>{entry.name}</span>
        </button>
        {expanded ? (
          <div role="group">
            {entry.children.map((child) => (
              <FileTreeEntryView
                activePath={activePath}
                depth={depth + 1}
                disabled={disabled}
                dirtyPaths={dirtyPaths}
                entry={child}
                expandedPaths={expandedPaths}
                focusedPath={focusedPath}
                key={child.path}
                onFocusItem={onFocusItem}
                onItemKeyDown={onItemKeyDown}
                onSelect={onSelect}
                onToggle={onToggle}
                registerItem={registerItem}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <button
      className={`file-row ${entry.path === activePath ? 'file-row-active' : ''} ${dirtyPaths.has(entry.path) ? 'file-row-dirty' : ''}`}
      disabled={disabled}
      aria-current={entry.path === activePath ? 'page' : undefined}
      aria-label={`Open ${entry.path}`}
      aria-level={depth + 1}
      aria-selected={entry.path === activePath}
      onFocus={() => onFocusItem(entry.path)}
      onKeyDown={(event) => onItemKeyDown(event, entry)}
      onClick={() => onSelect(entry.path)}
      ref={(element) => registerItem(entry.path, element)}
      style={indentation}
      tabIndex={focusedPath === entry.path ? 0 : -1}
      title={entry.path}
      type="button"
      role="treeitem"
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
  const [focusedPath, setFocusedPath] = useState(activePath);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    setExpandedPaths(new Set(directoryPaths));
  }, [directorySignature]);

  useEffect(() => {
    setFocusedPath(activePath);
  }, [activePath]);

  const visibleEntries = useMemo(() => {
    const result: Array<{ entry: FileTreeEntry; depth: number }> = [];
    const visit = (items: readonly FileTreeEntry[], depth: number) => {
      for (const entry of items) {
        result.push({ entry, depth });
        if (entry.kind === 'directory' && expandedPaths.has(entry.path)) {
          visit(entry.children, depth + 1);
        }
      }
    };
    visit(entries, 0);
    return result;
  }, [entries, expandedPaths]);

  const focusPath = (path: string) => {
    if (!visibleEntries.some(({ entry }) => entry.path === path)) return;
    setFocusedPath(path);
    window.requestAnimationFrame(() => itemRefs.current.get(path)?.focus());
  };

  const handleItemKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    entry: FileTreeEntry
  ) => {
    const currentIndex = visibleEntries.findIndex(
      ({ entry: currentEntry }) => currentEntry.path === entry.path
    );
    if (currentIndex < 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next =
        visibleEntries[Math.min(currentIndex + 1, visibleEntries.length - 1)];
      if (next) focusPath(next.entry.path);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const previous = visibleEntries[Math.max(currentIndex - 1, 0)];
      if (previous) focusPath(previous.entry.path);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      const first = visibleEntries[0];
      if (first) focusPath(first.entry.path);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      const last = visibleEntries.at(-1);
      if (last) focusPath(last.entry.path);
      return;
    }
    if (event.key === 'ArrowRight' && entry.kind === 'directory') {
      event.preventDefault();
      if (!expandedPaths.has(entry.path)) {
        toggleDirectory(entry.path);
        const firstChild = entry.children[0];
        if (firstChild) {
          setFocusedPath(firstChild.path);
          window.requestAnimationFrame(() =>
            itemRefs.current.get(firstChild.path)?.focus()
          );
        }
      } else {
        const child = visibleEntries[currentIndex + 1];
        if (child && child.depth > (visibleEntries[currentIndex]?.depth ?? 0)) {
          focusPath(child.entry.path);
        }
      }
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (entry.kind === 'directory' && expandedPaths.has(entry.path)) {
        toggleDirectory(entry.path);
        return;
      }
      const parentPath = entry.path.split('/').slice(0, -1).join('/');
      if (parentPath) focusPath(parentPath);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (entry.kind === 'directory') toggleDirectory(entry.path);
      else onSelect(entry.path);
    }
  };

  const registerItem = useCallback(
    (path: string, element: HTMLButtonElement | null) => {
      if (element) itemRefs.current.set(path, element);
      else itemRefs.current.delete(path);
    },
    []
  );

  const toggleDirectory = (path: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div aria-label="Workspace files" className="file-tree" role="tree">
      {entries.map((entry) => (
        <FileTreeEntryView
          activePath={activePath}
          depth={0}
          disabled={disabled}
          dirtyPaths={dirtyPaths}
          entry={entry}
          expandedPaths={expandedPaths}
          focusedPath={focusedPath}
          key={entry.path}
          onFocusItem={setFocusedPath}
          onItemKeyDown={handleItemKeyDown}
          onSelect={onSelect}
          onToggle={toggleDirectory}
          registerItem={registerItem}
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

function getCursorPosition(source: string, offset: number) {
  const safeOffset = Math.max(0, Math.min(offset, source.length));
  const beforeCursor = source.slice(0, safeOffset);
  const lines = beforeCursor.split('\n');
  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
}

function findTextMatches(source: string, query: string): number[] {
  const normalizedQuery = query.toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const normalizedSource = source.toLocaleLowerCase();
  const matches: number[] = [];
  let cursor = 0;
  while (cursor <= normalizedSource.length - normalizedQuery.length) {
    const index = normalizedSource.indexOf(normalizedQuery, cursor);
    if (index < 0) break;
    matches.push(index);
    cursor = index + Math.max(normalizedQuery.length, 1);
  }
  return matches;
}

type WorkspaceSearchMatch = {
  path: string;
  line: number;
  preview: string;
};

type WorkspaceSearchFocusRequest = {
  path: string;
  line: number;
  requestId: number;
};

function findWorkspaceMatches(
  files: readonly WorkspaceFile[],
  query: string
): WorkspaceSearchMatch[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const matches: WorkspaceSearchMatch[] = [];
  for (const file of files) {
    if (file.kind === 'asset') continue;
    for (const [index, sourceLine] of file.source.split('\n').entries()) {
      if (!sourceLine.toLocaleLowerCase().includes(normalizedQuery)) continue;
      matches.push({
        path: file.path,
        line: index + 1,
        preview: sourceLine.trim().slice(0, 120) || '(blank line)',
      });
      if (matches.length >= 80) return matches;
    }
  }
  return matches;
}

function WorkspaceSearchPanel({
  files,
  onClose,
  onQueryChange,
  onSelect,
  query,
}: {
  files: readonly WorkspaceFile[];
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onSelect: (match: WorkspaceSearchMatch) => void;
  query: string;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const matches = useMemo(
    () => findWorkspaceMatches(files, query),
    [files, query]
  );

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, Math.max(matches.length - 1, 0))
    );
  }, [matches.length]);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) =>
        matches.length ? (current + 1) % matches.length : 0
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        matches.length ? (current - 1 + matches.length) % matches.length : 0
      );
      return;
    }
    if (event.key === 'Enter' && matches[activeIndex]) {
      event.preventDefault();
      onSelect(matches[activeIndex]);
    }
  };

  return (
    <section
      aria-label="Search workspace"
      className="workspace-search-panel"
      id="workspace-search-panel"
    >
      <div className="workspace-search-toolbar">
        <span className="workspace-search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={searchInputRef}
          aria-label="Search workspace files"
          onChange={(event) => {
            setActiveIndex(0);
            onQueryChange(event.target.value);
          }}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search all workspace files…"
          type="search"
          value={query}
        />
        <span
          aria-live="polite"
          className="workspace-search-count"
          role="status"
        >
          {query.trim()
            ? `${matches.length}${matches.length === 80 ? '+' : ''}`
            : 'Type to search'}
        </span>
        <button
          aria-label="Close workspace search"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
      {query.trim() ? (
        <div
          aria-label="Workspace search results"
          className="workspace-search-results"
          id="workspace-search-results"
        >
          {matches.length ? (
            matches.map((match, index) => (
              <button
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`workspace-search-result ${index === activeIndex ? 'workspace-search-result-active' : ''}`}
                key={`${match.path}-${match.line}-${index}`}
                onClick={() => onSelect(match)}
                onMouseEnter={() => setActiveIndex(index)}
                type="button"
              >
                <span>
                  {match.path}:{match.line}
                </span>
                <code>{match.preview}</code>
              </button>
            ))
          ) : (
            <div className="workspace-search-empty">No matching lines</div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function QuickOpenPanel({
  files,
  onClose,
  onSelect,
}: {
  files: readonly WorkspaceFile[];
  onClose: () => void;
  onSelect: (path: string) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useModalDialog<HTMLElement>(onClose);
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return files
      .filter(
        (file) =>
          !normalizedQuery ||
          file.path.toLocaleLowerCase().includes(normalizedQuery)
      )
      .slice(0, 40);
  }, [files, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, Math.max(results.length - 1, 0))
    );
  }, [results.length]);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length ? (current + 1) % results.length : 0
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length ? (current - 1 + results.length) % results.length : 0
      );
      return;
    }
    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      void onSelect(results[activeIndex].path);
    }
  };

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="quick-open-title"
        aria-modal="true"
        className="settings-dialog quick-open-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="settings-heading">
          <div>
            <span className="panel-label">Workspace</span>
            <h2 id="quick-open-title">Quick open file</h2>
          </div>
          <button
            aria-label="Close quick open"
            className="settings-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <label className="settings-field">
          <span>File path</span>
          <input
            ref={inputRef}
            aria-label="Quick open workspace file"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search workspace files…"
            type="search"
            value={query}
          />
        </label>
        <div aria-live="polite" className="quick-open-count" role="status">
          {results.length
            ? `${results.length}${results.length === 40 ? '+' : ''} file${results.length === 1 ? '' : 's'}`
            : 'No matching files'}
        </div>
        <div aria-label="Quick open results" className="quick-open-results">
          {results.length ? (
            results.map((file, index) => (
              <button
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`quick-open-result ${index === activeIndex ? 'quick-open-result-active' : ''}`}
                key={file.path}
                onClick={() => void onSelect(file.path)}
                onMouseEnter={() => setActiveIndex(index)}
                type="button"
              >
                <FileIcon file={file} />
                <span>{file.path}</span>
                {file.kind === 'asset' ? <small>asset</small> : null}
              </button>
            ))
          ) : (
            <div className="quick-open-empty">Try a different file name.</div>
          )}
        </div>
        <p className="quick-open-hint">
          ↑↓ to navigate · Enter to open · Esc to close
        </p>
      </section>
    </div>
  );
}

function overlayEditorDrafts(
  files: readonly WorkspaceFile[],
  editorDrafts: Readonly<Record<string, string>>
): WorkspaceFile[] {
  return files.map((file) => {
    if (file.kind === 'asset' || editorDrafts[file.path] === undefined) {
      return file;
    }
    return { ...file, source: editorDrafts[file.path] };
  });
}

function CodeEditor({
  file,
  source,
  disabled = false,
  focusRequest,
  onFocusRequestConsumed,
  onOpenWorkspaceSearch,
  onBlur,
  onChange,
}: {
  file: WorkspaceFile;
  source: string;
  disabled?: boolean;
  focusRequest?: WorkspaceSearchFocusRequest;
  onFocusRequestConsumed?: () => void;
  onOpenWorkspaceSearch?: () => void;
  onBlur?: () => void;
  onChange: (source: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findIndex, setFindIndex] = useState(0);
  const [cursorOffset, setCursorOffset] = useState(0);
  const highlightedSource = useMemo(
    () =>
      source
        .split('\n')
        .map((line) => highlightSourceLine(line, file.language)),
    [file.language, source]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight) return;
    textarea.scrollTop = 0;
    textarea.scrollLeft = 0;
    highlight.scrollTop = 0;
    highlight.scrollLeft = 0;
    textarea.setSelectionRange(0, 0);
    setCursorOffset(0);
    setFindOpen(false);
    setFindQuery('');
  }, [file.path]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight || !focusRequest) return;

    const lines = source.split('\n');
    const lineIndex = Math.max(
      0,
      Math.min(focusRequest.line - 1, lines.length - 1)
    );
    const lineStart = lines
      .slice(0, lineIndex)
      .reduce((offset, line) => offset + line.length + 1, 0);
    const lineEnd = lineStart + (lines[lineIndex]?.length ?? 0);
    textarea.focus();
    textarea.setSelectionRange(lineStart, lineEnd);
    setCursorOffset(lineStart);
    const lineHeight = Number.parseFloat(
      window.getComputedStyle(textarea).lineHeight
    );
    textarea.scrollTop = Math.max(
      0,
      lineIndex * (Number.isFinite(lineHeight) ? lineHeight : 19) - 38
    );
    highlight.scrollTop = textarea.scrollTop;
    onFocusRequestConsumed?.();
  }, [file.path, focusRequest?.requestId]);

  const matches = useMemo(
    () => findTextMatches(source, findQuery),
    [source, findQuery]
  );
  const cursorPosition = getCursorPosition(source, cursorOffset);
  const sourceLengthLabel = `${source.length.toLocaleString('en-US')} / ${MAX_TEXT_SOURCE_LENGTH.toLocaleString('en-US')} chars`;
  const sourceExceedsLimit = source.length > MAX_TEXT_SOURCE_LENGTH;

  const updateCursor = (textarea: HTMLTextAreaElement) => {
    setCursorOffset(textarea.selectionStart);
  };

  const selectMatch = (requestedIndex: number) => {
    if (!matches.length) return;
    const nextIndex = (requestedIndex + matches.length) % matches.length;
    const start = matches[nextIndex];
    const end = start + findQuery.length;
    setFindIndex(nextIndex);
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(start, end);
    if (textareaRef.current) updateCursor(textareaRef.current);
  };

  const openFind = () => {
    const textarea = textareaRef.current;
    const selectedText = textarea
      ? textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
      : '';
    setFindQuery(selectedText.length <= 80 ? selectedText : '');
    setFindIndex(0);
    setFindOpen(true);
    window.requestAnimationFrame(() => findInputRef.current?.focus());
  };

  const closeFind = () => {
    setFindOpen(false);
    textareaRef.current?.focus();
  };

  const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const highlight = highlightRef.current;
    if (!highlight) return;
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const modifierKey = event.metaKey || event.ctrlKey;
    if (
      modifierKey &&
      event.shiftKey &&
      event.key.toLowerCase() === 'f' &&
      onOpenWorkspaceSearch
    ) {
      event.preventDefault();
      onOpenWorkspaceSearch();
      return;
    }
    if (modifierKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      openFind();
      return;
    }
    if (modifierKey && event.key.toLowerCase() === 'g' && findOpen) {
      event.preventDefault();
      selectMatch(findIndex + (event.shiftKey ? -1 : 1));
      return;
    }
    if (event.key === 'Escape' && findOpen) {
      event.preventDefault();
      closeFind();
      return;
    }
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextSource = `${source.slice(0, start)}  ${source.slice(end)}`;
    onChange(nextSource);
    setCursorOffset(start + 2);
    window.requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(start + 2, start + 2);
    });
  };

  return (
    <>
      <div className="code-header">
        <span>{file.language}</span>
        <span>
          Ln {cursorPosition.line}, Col {cursorPosition.column} ·{' '}
          {source.split('\n').length} lines ·{' '}
          <span
            aria-label={
              sourceExceedsLimit
                ? `${sourceLengthLabel}; save limit exceeded`
                : sourceLengthLabel
            }
            className={`code-source-length ${sourceExceedsLimit ? 'code-source-length-warning' : ''}`}
            title={
              sourceExceedsLimit
                ? 'Reduce this source below the workspace mutation limit before saving.'
                : 'Workspace text mutation limit'
            }
          >
            {sourceLengthLabel}
          </span>
        </span>
      </div>
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
          aria-label={`Edit ${file.path}`}
          aria-keyshortcuts="Control+F Meta+F Control+G Meta+G Control+Shift+F Meta+Shift+F"
          className="code-input"
          disabled={disabled}
          onChange={(event) => {
            updateCursor(event.currentTarget);
            onChange(event.target.value);
          }}
          onClick={(event) => updateCursor(event.currentTarget)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          onKeyUp={(event) => updateCursor(event.currentTarget)}
          onSelect={(event) => updateCursor(event.currentTarget)}
          onScroll={syncScroll}
          spellCheck={false}
          value={source}
          wrap="off"
        />
        {findOpen ? (
          <div className="code-find-bar" role="search">
            <span className="code-find-icon" aria-hidden="true">
              /
            </span>
            <input
              ref={findInputRef}
              aria-label="Find in file"
              onChange={(event) => {
                setFindQuery(event.target.value);
                setFindIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  selectMatch(findIndex + (event.shiftKey ? -1 : 1));
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  closeFind();
                }
              }}
              placeholder="Find"
              value={findQuery}
            />
            <span className="code-find-count">
              {findQuery
                ? `${matches.length ? findIndex + 1 : 0}/${matches.length}`
                : 'Find'}
            </span>
            <button
              aria-label="Find previous"
              disabled={!matches.length}
              onClick={() => selectMatch(findIndex - 1)}
              type="button"
            >
              ↑
            </button>
            <button
              aria-label="Find next"
              disabled={!matches.length}
              onClick={() => selectMatch(findIndex + 1)}
              type="button"
            >
              ↓
            </button>
            <button aria-label="Close find" onClick={closeFind} type="button">
              ×
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

function EditorWorkbench({
  workspace,
  fileSystemAdapter,
  previewRefreshToken,
  folderRestoreState,
}: {
  workspace: BrowserWorkspace;
  fileSystemAdapter: BrowserWorkspaceFileSystemAdapter;
  previewRefreshToken: number;
  folderRestoreState: FolderRestoreState;
}) {
  const registry = useBoltStyleToolRegistry();
  const snapshot = useSyncExternalStore(
    workspace.subscribe,
    workspace.getSnapshot,
    workspace.getSnapshot
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorTabsRef = useRef<HTMLDivElement>(null);
  const workspaceSearchTriggerRef = useRef<HTMLButtonElement>(null);
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
          boundPreviewErrorMessage(event.data.message)
        );
      }
    };

    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, [workspace]);
  const [prompt, setPrompt] = useState(
    '보라색 테마로 바꾸고 기능 카드를 추가해줘'
  );
  const copyFeedbackTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current !== null) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }
      if (editorDraftTimerRef.current !== null) {
        window.clearTimeout(editorDraftTimerRef.current);
      }
    };
  }, []);
  const messageListRef = useRef<HTMLDivElement>(null);
  const firstApprovalButtonRef = useRef<HTMLButtonElement>(null);
  const focusedApprovalIdRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<EditorMessage[]>([
    {
      role: 'assistant',
      text: 'Describe a change and I will turn it into visible workspace tool calls.',
    },
  ]);
  const [openRouterSettings, setOpenRouterSettings] = useState(
    readOpenRouterSettings
  );
  useEffect(() => {
    return subscribeOpenRouterSettings(() => {
      setOpenRouterSettings(readOpenRouterSettings());
    });
  }, []);
  const clearPrompt = useCallback(() => setPrompt(''), []);
  const {
    running,
    providerRetry,
    executionControllerRef,
    flushEditorDraftsRef,
    executePrompt,
    executeQuickTool,
    cancelExecution,
  } = useToolExecution({
    registry,
    workspace,
    fileSystemAdapter,
    openRouterSettings,
    setMessages,
    clearPrompt,
    formatToolSuccessMessage,
  });
  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages.length, running]);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateFile, setShowCreateFile] = useState(false);
  const [showRenameFile, setShowRenameFile] = useState(false);
  const [confirmationRequest, setConfirmationRequest] =
    useState<ConfirmationRequest | null>(null);
  const confirmationResolverRef = useRef<((confirmed: boolean) => void) | null>(
    null
  );
  const requestConfirmation = useCallback(
    (request: ConfirmationRequest) =>
      new Promise<boolean>((resolve) => {
        confirmationResolverRef.current?.(false);
        confirmationResolverRef.current = resolve;
        setConfirmationRequest(request);
      }),
    []
  );
  const resolveConfirmation = useCallback((confirmed: boolean) => {
    const resolve = confirmationResolverRef.current;
    confirmationResolverRef.current = null;
    setConfirmationRequest(null);
    resolve?.(confirmed);
  }, []);
  useEffect(() => {
    return () => {
      confirmationResolverRef.current?.(false);
      confirmationResolverRef.current = null;
    };
  }, []);
  const [workspaceSearchOpen, setWorkspaceSearchOpen] = useState(false);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');
  const workspaceSearchRequestRef = useRef(0);
  const [workspaceSearchFocus, setWorkspaceSearchFocus] =
    useState<WorkspaceSearchFocusRequest | null>(null);
  const [quickOpenOpen, setQuickOpenOpen] = useState(false);
  const [openingFolder, setOpeningFolder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorDrafts, setEditorDrafts] = useState<Record<string, string>>({});
  const editorDraftsRef = useRef(editorDrafts);
  editorDraftsRef.current = editorDrafts;
  const editorDraftTimerRef = useRef<number | null>(null);
  const editorDraftFlushRef = useRef<Promise<boolean> | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
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
  useEffect(() => {
    const firstApproval = pendingApprovals[0];
    if (!firstApproval) {
      focusedApprovalIdRef.current = null;
      return;
    }
    if (focusedApprovalIdRef.current === firstApproval.id) return;
    focusedApprovalIdRef.current = firstApproval.id;
    window.requestAnimationFrame(() => firstApprovalButtonRef.current?.focus());
  }, [pendingApprovals]);
  const hasWritableFolder = useSyncExternalStore(
    fileSystemAdapter.subscribe,
    () => fileSystemAdapter.hasWritableFolder,
    () => false
  );
  const folderPermission = useSyncExternalStore(
    fileSystemAdapter.subscribe,
    () => fileSystemAdapter.folderPermission,
    () => 'disconnected' as const
  );

  const activeFile =
    snapshot.files.find((file) => file.path === snapshot.activePath) ??
    snapshot.files[0];
  const dirtyPaths = useMemo(() => {
    const paths = new Set(workspace.getDirtyFiles().map((file) => file.path));
    for (const [path, source] of Object.entries(editorDrafts)) {
      const file = snapshot.files.find((candidate) => candidate.path === path);
      if (file && file.kind !== 'asset' && file.source !== source) {
        paths.add(path);
      }
    }
    return paths;
  }, [editorDrafts, snapshot, workspace]);
  const deletedPaths = useMemo(
    () => workspace.getDeletedPaths(),
    [snapshot, workspace]
  );
  const hasUnsavedChanges = dirtyPaths.size > 0 || deletedPaths.length > 0;
  const hasUnpersistedEditorDrafts = Object.keys(editorDrafts).some((path) => {
    const file = snapshot.files.find((candidate) => candidate.path === path);
    return Boolean(
      file && file.kind !== 'asset' && file.source !== editorDrafts[path]
    );
  });
  const canRevertActiveFile =
    dirtyPaths.has(activeFile.path) ||
    Boolean(
      activeFile.renamedFrom &&
        !snapshot.files.some((file) => file.path === activeFile.renamedFrom)
    );
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
  const previewDiagnostics = useMemo(
    () => collectPreviewDiagnostics(snapshot.files),
    [snapshot.files]
  );
  const searchableFiles = useMemo(
    () => overlayEditorDrafts(snapshot.files, editorDrafts),
    [editorDrafts, snapshot.files]
  );
  const toolNames = registry.getToolNames().map(String);
  const [selectedToolName, setSelectedToolName] = useState(
    () => toolNames[0] ?? ''
  );
  const [toolFilter, setToolFilter] = useState('');
  const [toolCatalogFilter, setToolCatalogFilter] =
    useState<ToolCatalogFilter>('all');
  const [toolArgumentsText, setToolArgumentsText] = useState('{}');
  const toolArgumentsSampleRef = useRef(true);
  const [toolArgumentsError, setToolArgumentsError] = useState<string | null>(
    null
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showAllTrace, setShowAllTrace] = useState(false);
  const toolCatalogCounts = useMemo(() => {
    const counts: Record<ToolCatalogFilter, number> = {
      all: toolNames.length,
      read: 0,
      workspace: 0,
      preview: 0,
    };
    for (const name of toolNames) {
      if (
        registry.getToolDefinition(name)?.annotations?.readOnlyHint === true
      ) {
        counts.read += 1;
      }
      if (name.startsWith('workspace.')) counts.workspace += 1;
      if (name.startsWith('preview.')) counts.preview += 1;
    }
    return counts;
  }, [registry, toolNames]);
  const visibleToolNames = useMemo(() => {
    const query = toolFilter.trim().toLowerCase();
    return toolNames.filter((name) => {
      const definition = registry.getToolDefinition(name);
      const matchesCatalog =
        toolCatalogFilter === 'all' ||
        (toolCatalogFilter === 'read' &&
          definition?.annotations?.readOnlyHint === true) ||
        (toolCatalogFilter === 'workspace' && name.startsWith('workspace.')) ||
        (toolCatalogFilter === 'preview' && name.startsWith('preview.'));
      return matchesCatalog && (!query || name.toLowerCase().includes(query));
    });
  }, [registry, toolCatalogFilter, toolFilter, toolNames]);
  useEffect(() => {
    if (visibleToolNames.includes(selectedToolName)) return;
    setSelectedToolName(visibleToolNames[0] ?? '');
  }, [selectedToolName, visibleToolNames]);
  const selectedToolDefinition = selectedToolName
    ? registry.getToolDefinition(selectedToolName)
    : undefined;
  const isStorageReady =
    snapshot.storageMode !== 'loading' && folderRestoreState !== 'restoring';
  const storageLabel =
    snapshot.storageMode === 'indexed-db'
      ? 'Dexie · IndexedDB'
      : snapshot.storageMode === 'loading'
        ? 'Loading workspace'
        : 'Memory fallback';
  const storageErrorLabel = snapshot.storageError
    ? 'browser persistence unavailable'
    : null;
  const previewStatusLabel =
    snapshot.preview.status === 'synced'
      ? 'synced'
      : snapshot.preview.status === 'error'
        ? 'runtime error'
        : 'waiting';
  const folderPermissionNeedsAction =
    hasWritableFolder && folderPermission !== 'granted';
  const folderRestoreUnavailable =
    folderRestoreState === 'unavailable' && !hasWritableFolder;
  const folderPermissionLabel = hasWritableFolder
    ? folderPermission === 'denied'
      ? 'folder access denied'
      : folderPermission === 'prompt'
        ? 'folder access needed'
        : folderPermission === 'unknown'
          ? 'folder access unknown'
          : 'folder sync'
    : folderRestoreState === 'restoring'
      ? 'restoring folder'
      : folderRestoreUnavailable
        ? 'folder link unavailable'
        : 'folder sync';
  const studioStatus = running
    ? 'Running tool chain'
    : snapshot.storageMode === 'loading'
      ? 'Loading workspace'
      : folderRestoreState === 'restoring'
        ? 'Restoring folder link'
        : snapshot.storageError
          ? 'Browser persistence unavailable'
          : folderRestoreUnavailable
            ? 'Folder link unavailable'
            : snapshot.preview.status === 'error'
              ? 'Preview error'
              : hasWritableFolder && folderPermission === 'denied'
                ? 'Folder access denied'
                : folderPermissionNeedsAction
                  ? 'Folder access needed'
                  : hasUnsavedChanges
                    ? hasWritableFolder
                      ? 'Unsaved folder changes'
                      : 'Unsaved browser changes'
                    : 'Ready';
  const studioStatusTone =
    running ||
    snapshot.storageMode === 'loading' ||
    folderRestoreState === 'restoring'
      ? 'running'
      : snapshot.storageError
        ? 'error'
        : folderRestoreUnavailable
          ? 'dirty'
          : snapshot.preview.status === 'error'
            ? 'error'
            : hasWritableFolder && folderPermission === 'denied'
              ? 'error'
              : folderPermissionNeedsAction
                ? 'dirty'
                : hasUnsavedChanges
                  ? 'dirty'
                  : 'ready';
  const persistenceFooterLabel =
    folderRestoreState === 'restoring'
      ? 'Restoring local folder link'
      : snapshot.storageError
        ? 'Session-only workspace · download changes before leaving'
        : folderRestoreUnavailable
          ? 'Browser workspace · folder link unavailable'
          : snapshot.storageMode === 'indexed-db'
            ? 'Persistent browser workspace'
            : snapshot.storageMode === 'memory'
              ? 'Session-only memory workspace'
              : 'Preparing browser workspace';

  const runningTraceEntry = traceEntries.find(
    (entry) => entry.status === 'running'
  );
  const executionStatusLabel = pendingApprovals.length
    ? `approval required · ${pendingApprovals[0].name}`
    : providerRetry
      ? `retrying ${providerRetry.reason} request ${providerRetry.attempt}/${providerRetry.maxAttempts}`
      : runningTraceEntry?.kind === 'call'
        ? `calling ${runningTraceEntry.name}`
        : runningTraceEntry?.kind === 'agent'
          ? 'waiting for model response'
          : 'executing typed tool call';

  useEffect(() => {
    if (
      !hasUnsavedChanges ||
      (!hasWritableFolder && !hasUnpersistedEditorDrafts)
    ) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, hasUnpersistedEditorDrafts, hasWritableFolder]);

  const refreshPreview = () => {
    if (!isStorageReady) return;
    void executeQuickTool({ name: 'preview.refresh', arguments: {} });
  };

  useEffect(() => {
    folderInputRef.current?.setAttribute('webkitdirectory', '');
  }, []);

  const importFolder = async (imported: ImportedFolder, verb = 'Opened') => {
    await workspace.importFolder(imported);
    setEditorDrafts({});
    const skippedPreview = imported.skipped.slice(0, 3).join(' · ');
    const skippedOverflow = imported.skipped.length - 3;
    const skippedMessage = imported.skipped.length
      ? ` Skipped ${imported.skipped.length} unsupported, oversized, or invalid file(s).${skippedPreview ? ` ${skippedPreview}${skippedOverflow > 0 ? ` · +${skippedOverflow} more` : ''}` : ''}`
      : '';
    const syncMessage = fileSystemAdapter.hasWritableFolder
      ? ' Folder sync is enabled for Save.'
      : ' Changes are saved to the browser workspace.';
    setMessages((current) => [
      ...current,
      {
        role: 'assistant',
        text: `${verb} ${imported.rootName} with ${imported.files.length} file(s).${syncMessage}${skippedMessage}`,
      },
    ]);
  };

  const handleFolderInput = async (fileList: FileList | null) => {
    if (!fileList) return;
    if (
      hasUnsavedChanges &&
      !(await requestConfirmation({
        title: 'Open selected folder?',
        message:
          'Unsaved browser workspace changes will be discarded before the selected folder is opened.',
        confirmLabel: 'Open folder',
        tone: 'warning',
      }))
    ) {
      if (folderInputRef.current) folderInputRef.current.value = '';
      return;
    }
    setOpeningFolder(true);
    try {
      await importFolder(await fileSystemAdapter.importFileList(fileList));
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          tone: 'error',
          text: thrownErrorText(error, 'Folder import failed.'),
        },
      ]);
    } finally {
      setOpeningFolder(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleOpenFolder = async () => {
    if (openingFolder || !isStorageReady) return;
    if (
      hasUnsavedChanges &&
      !(await requestConfirmation({
        title: 'Open a new folder?',
        message:
          'Unsaved browser workspace changes will be discarded before the new folder is opened.',
        confirmLabel: 'Open folder',
        tone: 'warning',
      }))
    ) {
      return;
    }
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
          tone: 'error',
          text: thrownErrorText(error, 'Folder import failed.'),
        },
      ]);
    } finally {
      setOpeningFolder(false);
    }
  };

  const handleReloadFolder = async () => {
    if (openingFolder || !isStorageReady || !hasWritableFolder) {
      return;
    }
    if (
      hasUnsavedChanges &&
      !(await requestConfirmation({
        title: 'Reload connected folder?',
        message:
          'The browser workspace will be replaced with the connected folder contents. Unsaved changes will be discarded.',
        confirmLabel: 'Reload folder',
        tone: 'warning',
      }))
    ) {
      return;
    }

    setOpeningFolder(true);
    try {
      setEditorDrafts({});
      await executeQuickTool(
        {
          name: 'workspace.reloadFolder',
          arguments: {
            expectedRevision: workspace.getSnapshot().revision,
          },
        },
        { skipDraftFlush: true }
      );
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          tone: 'error',
          text: thrownErrorText(error, 'Folder reload failed.'),
        },
      ]);
    } finally {
      setOpeningFolder(false);
    }
  };

  const handleDisconnectFolder = async () => {
    if (openingFolder || !isStorageReady || !hasWritableFolder) {
      return;
    }
    if (
      hasUnsavedChanges &&
      !(await requestConfirmation({
        title: 'Disconnect folder?',
        message:
          'The folder connection will be removed. Current changes will remain only in the browser workspace.',
        confirmLabel: 'Disconnect',
        tone: 'warning',
      }))
    ) {
      return;
    }

    await executeQuickTool({
      name: 'workspace.disconnectFolder',
      arguments: {},
    });
  };

  const handleGrantFolderAccess = async () => {
    if (openingFolder || !isStorageReady || !hasWritableFolder) return;
    setOpeningFolder(true);
    try {
      const permission = await fileSystemAdapter.requestWritePermission();
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            permission === 'granted'
              ? 'Write access restored for the connected folder.'
              : `Folder write access is ${permission}. Use the browser permission prompt to continue saving.`,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            error instanceof Error
              ? error.message
              : 'Folder permission request failed.',
        },
      ]);
    } finally {
      setOpeningFolder(false);
    }
  };

  const resetDemoWorkspace = async () => {
    if (running || !isStorageReady || hasWritableFolder) {
      return;
    }
    if (
      hasUnsavedChanges &&
      !(await requestConfirmation({
        title: 'Reset demo workspace?',
        message:
          'The browser workspace will return to the demo seed. Current changes will be discarded.',
        confirmLabel: 'Reset workspace',
        tone: 'danger',
      }))
    ) {
      return;
    }

    setEditorDrafts({});
    await executeQuickTool(
      {
        name: 'workspace.reset',
        arguments: { expectedRevision: workspace.getSnapshot().revision },
      },
      { skipDraftFlush: true }
    );
  };

  const saveWorkspace = async () => {
    if (saving || running || !isStorageReady) return;
    if (!(await flushEditorDrafts()) || !workspace.isDirty()) return;
    setSaving(true);
    try {
      if (fileSystemAdapter.hasWritableFolder) {
        await executeQuickTool({
          name: 'workspace.saveAll',
          arguments: {
            expectedRevision: workspace.getSnapshot().revision,
          },
        });
      } else {
        await executeQuickTool({
          name: 'workspace.saveCheckpoint',
          arguments: { expectedRevision: workspace.getSnapshot().revision },
        });
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
    void executeQuickTool({
      name: 'workspace.downloadFile',
      arguments: { path: activeFile.path },
    });
  };

  useEffect(() => {
    const handleSaveShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== 's' ||
        showSettings ||
        showCreateFile ||
        showRenameFile ||
        confirmationRequest ||
        quickOpenOpen ||
        workspaceSearchOpen
      ) {
        return;
      }
      event.preventDefault();
      void saveWorkspace();
    };

    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [
    isStorageReady,
    running,
    saving,
    showCreateFile,
    showRenameFile,
    showSettings,
    confirmationRequest,
    quickOpenOpen,
    workspaceSearchOpen,
    workspace,
  ]);

  useEffect(() => {
    const handleQuickOpenShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.key.toLowerCase() !== 'p' ||
        showSettings ||
        showCreateFile ||
        showRenameFile ||
        confirmationRequest ||
        workspaceSearchOpen
      ) {
        return;
      }
      event.preventDefault();
      setQuickOpenOpen(true);
    };

    window.addEventListener('keydown', handleQuickOpenShortcut);
    return () => window.removeEventListener('keydown', handleQuickOpenShortcut);
  }, [
    confirmationRequest,
    showCreateFile,
    showRenameFile,
    showSettings,
    workspaceSearchOpen,
  ]);

  useEffect(() => {
    if (
      !running ||
      showSettings ||
      showCreateFile ||
      showRenameFile ||
      confirmationRequest ||
      quickOpenOpen ||
      workspaceSearchOpen
    ) {
      return;
    }
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      cancelExecution();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [
    cancelExecution,
    confirmationRequest,
    quickOpenOpen,
    running,
    showCreateFile,
    showRenameFile,
    showSettings,
    workspaceSearchOpen,
  ]);

  useEffect(() => {
    const handleHistoryShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        showSettings ||
        showCreateFile ||
        showRenameFile ||
        confirmationRequest ||
        quickOpenOpen ||
        workspaceSearchOpen ||
        running ||
        executionControllerRef.current ||
        saving ||
        !isStorageReady
      ) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const undo = key === 'z' && !event.shiftKey;
      const redo =
        (key === 'z' && event.shiftKey) || (key === 'y' && !event.shiftKey);
      if (!undo && !redo) return;
      if (undo && !workspace.canUndo() && !hasUnsavedChanges) return;
      if (redo && !workspace.canRedo()) return;

      event.preventDefault();
      void executeQuickTool({
        name: redo ? 'workspace.redo' : 'workspace.undo',
        arguments: { expectedRevision: workspace.getSnapshot().revision },
      });
    };

    window.addEventListener('keydown', handleHistoryShortcut);
    return () => window.removeEventListener('keydown', handleHistoryShortcut);
  }, [
    confirmationRequest,
    executeQuickTool,
    hasUnsavedChanges,
    isStorageReady,
    quickOpenOpen,
    running,
    saving,
    showCreateFile,
    showRenameFile,
    showSettings,
    workspace,
    workspaceSearchOpen,
  ]);

  const flushEditorDrafts = async (): Promise<boolean> => {
    if (editorDraftTimerRef.current !== null) {
      window.clearTimeout(editorDraftTimerRef.current);
      editorDraftTimerRef.current = null;
    }
    if (editorDraftFlushRef.current) return editorDraftFlushRef.current;

    const promise = (async () => {
      let allFlushed = true;
      const drafts = Object.entries(editorDraftsRef.current);
      for (const [path, source] of drafts) {
        if (editorDraftsRef.current[path] !== source) continue;
        const file = workspace
          .getSnapshot()
          .files.find((candidate) => candidate.path === path);
        if (!file || file.kind === 'asset' || file.source === source) {
          setEditorDrafts((current) => {
            if (current[path] !== source) return current;
            const next = { ...current };
            delete next[path];
            return next;
          });
          continue;
        }

        const outcome = await executeQuickTool(
          {
            name: 'workspace.writeFile',
            arguments: {
              path,
              source,
              expectedRevision: workspace.getSnapshot().revision,
            },
          },
          { announce: false, skipDraftFlush: true }
        );
        if (!outcome.ok) {
          allFlushed = false;
          continue;
        }
        setEditorDrafts((current) => {
          if (current[path] !== source) return current;
          const next = { ...current };
          delete next[path];
          return next;
        });
      }
      return allFlushed;
    })();
    const trackedPromise = promise.finally(() => {
      if (editorDraftFlushRef.current === trackedPromise) {
        editorDraftFlushRef.current = null;
      }
    });
    editorDraftFlushRef.current = trackedPromise;
    return trackedPromise;
  };
  flushEditorDraftsRef.current = flushEditorDrafts;

  const updateEditorDraft = (path: string, source: string) => {
    setEditorDrafts((current) => {
      if (current[path] === source) return current;
      return { ...current, [path]: source };
    });
    if (editorDraftTimerRef.current !== null) {
      window.clearTimeout(editorDraftTimerRef.current);
    }
    editorDraftTimerRef.current = window.setTimeout(() => {
      editorDraftTimerRef.current = null;
      void flushEditorDrafts();
    }, 650);
  };

  const createWorkspaceFile = (path: string, source: string) =>
    executeQuickTool({
      name: 'workspace.createFile',
      arguments: { path, source, expectedRevision: snapshot.revision },
    });

  const openWorkspaceFile = (path: string) =>
    executeQuickTool({
      name: 'workspace.openFile',
      arguments: { path },
    });

  const handleEditorTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (!snapshot.files.length) return;
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % snapshot.files.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + snapshot.files.length) % snapshot.files.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = snapshot.files.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextFile = snapshot.files[nextIndex];
    if (!nextFile) return;
    void openWorkspaceFile(nextFile.path).then(() => {
      editorTabsRef.current
        ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
        .item(nextIndex)
        ?.focus();
    });
  };

  const renameWorkspaceFile = (fromPath: string, toPath: string) =>
    executeQuickTool({
      name: 'workspace.renameFile',
      arguments: {
        fromPath,
        toPath,
        expectedRevision: snapshot.revision,
      },
    });

  const deleteActiveFile = async () => {
    if (!canDeleteActiveFile || running) return;
    if (
      !(await requestConfirmation({
        title: 'Delete active file?',
        message: `${activeFile.path} will be removed from this browser workspace. This action can be recovered with Undo during this session.`,
        confirmLabel: 'Delete file',
        tone: 'danger',
      }))
    ) {
      return;
    }
    await executeQuickTool({
      name: 'workspace.deleteFile',
      arguments: {
        path: activeFile.path,
        expectedRevision: snapshot.revision,
      },
    });
  };

  const revertActiveFile = async () => {
    if (!canRevertActiveFile || running) return;
    if (
      !(await requestConfirmation({
        title: 'Revert active file?',
        message: `Unsaved changes in ${activeFile.path} will be discarded. Undo can restore this session's edit.`,
        confirmLabel: 'Revert file',
        tone: 'warning',
      }))
    ) {
      return;
    }
    await executeQuickTool({
      name: 'workspace.revertFile',
      arguments: {
        path: activeFile.path,
        expectedRevision: snapshot.revision,
      },
    });
  };

  const paletteCallFor = (name: string): ToolCall | null => {
    const activeSource = editorDrafts[activeFile.path] ?? activeFile.source;
    switch (name) {
      case 'workspace.getStatus':
      case 'workspace.listFiles':
      case 'preview.getStatus':
      case 'preview.refresh':
        return { name, arguments: {} };
      case 'workspace.readFile':
        return { name, arguments: { path: activeFile.path } };
      case 'workspace.downloadFile':
        return { name, arguments: { path: activeFile.path } };
      case 'workspace.openFile':
        return { name, arguments: { path: activeFile.path } };
      case 'workspace.createFile':
        return {
          name,
          arguments: {
            path: 'notes.md',
            source: '# Created from the tool palette\n',
            expectedRevision: snapshot.revision,
          },
        };
      case 'workspace.renameFile': {
        const filename = activeFile.path.split('/').pop() ?? activeFile.path;
        return {
          name,
          arguments: {
            fromPath: activeFile.path,
            toPath: `renamed-${filename}`,
            expectedRevision: snapshot.revision,
          },
        };
      }
      case 'workspace.deleteFile':
        return {
          name,
          arguments: { path: 'README.md', expectedRevision: snapshot.revision },
        };
      case 'workspace.writeFile':
        return {
          name,
          arguments: {
            path: activeFile.path,
            source: activeSource,
            expectedRevision: snapshot.revision,
          },
        };
      case 'workspace.saveAll':
        return {
          name,
          arguments: { expectedRevision: snapshot.revision },
        };
      case 'workspace.saveCheckpoint':
        return {
          name,
          arguments: { expectedRevision: snapshot.revision },
        };
      case 'workspace.reset':
        return {
          name,
          arguments: { expectedRevision: snapshot.revision },
        };
      case 'workspace.reloadFolder':
        return {
          name,
          arguments: { expectedRevision: snapshot.revision },
        };
      case 'workspace.disconnectFolder':
        return { name, arguments: {} };
      case 'workspace.applyPatch': {
        if (activeFile.kind === 'asset') return null;
        const line = activeSource.split('\n').find((value) => value.trim());
        if (!line) return null;
        return {
          name,
          arguments: {
            path: activeFile.path,
            search: line,
            replace: `${line}  `,
            occurrence: 'first',
            expectedRevision: snapshot.revision,
          },
        };
      }
      case 'workspace.revertFile':
        return {
          name,
          arguments: {
            path: activeFile.path,
            expectedRevision: snapshot.revision,
          },
        };
      case 'workspace.undo':
      case 'workspace.redo':
        return { name, arguments: { expectedRevision: snapshot.revision } };
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

  const resetSelectedToolArguments = () => {
    const sample = selectedToolName ? paletteCallFor(selectedToolName) : null;
    toolArgumentsSampleRef.current = true;
    setToolArgumentsText(JSON.stringify(sample?.arguments ?? {}, null, 2));
    setToolArgumentsError(null);
  };

  useEffect(() => {
    resetSelectedToolArguments();
  }, [selectedToolName, activeFile.path]);

  useEffect(() => {
    if (toolArgumentsSampleRef.current) resetSelectedToolArguments();
  }, [snapshot.revision]);

  const parseToolArguments = (): Record<string, unknown> | null => {
    try {
      const parsed: unknown = JSON.parse(toolArgumentsText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Arguments must be a JSON object.');
      }
      setToolArgumentsError(null);
      return parsed as Record<string, unknown>;
    } catch (error) {
      setToolArgumentsError(
        error instanceof Error ? error.message : 'Invalid JSON arguments.'
      );
      return null;
    }
  };

  const runSelectedTool = async () => {
    if (!selectedToolName || !selectedToolDefinition) return;
    const argumentsValue = parseToolArguments();
    if (!argumentsValue) return;
    if (
      selectedToolDefinition.annotations?.destructiveHint === true &&
      !(await requestConfirmation({
        title: 'Run destructive tool sample?',
        message: `${selectedToolName} can change or remove workspace data. Review the arguments and confirm before running it.`,
        confirmLabel: 'Run tool',
        tone: 'danger',
      }))
    ) {
      return;
    }
    await executeQuickTool({
      name: selectedToolName,
      arguments: argumentsValue,
    });
  };

  const showCopyFeedback = (message: string) => {
    if (copyFeedbackTimerRef.current !== null) {
      window.clearTimeout(copyFeedbackTimerRef.current);
    }
    setCopyFeedback(message);
    copyFeedbackTimerRef.current = window.setTimeout(() => {
      copyFeedbackTimerRef.current = null;
      setCopyFeedback(null);
    }, 1800);
  };

  const copyJson = async (label: string, value: unknown) => {
    try {
      await writeClipboardText(JSON.stringify(value, null, 2));
      showCopyFeedback(`${label} copied`);
    } catch (error) {
      showCopyFeedback(
        `${error instanceof Error ? error.message : 'Copy failed.'} Use Download instead.`
      );
    }
  };

  const downloadJson = (label: string, value: unknown, filename: string) => {
    downloadTextFile(JSON.stringify(value, null, 2), filename);
    showCopyFeedback(`${label} downloaded`);
  };

  const downloadToolList = () => {
    downloadJson(
      'tools/list result',
      registry.listTools({ method: 'tools/list' }),
      'context-action-tools-list.json'
    );
  };

  const copySelectedToolCall = async () => {
    if (!selectedToolName) return;
    const argumentsValue = parseToolArguments();
    if (!argumentsValue) return;
    await copyJson('tools/call request', {
      method: 'tools/call',
      params: { name: selectedToolName, arguments: argumentsValue },
    });
  };

  const downloadSelectedToolDefinition = () => {
    if (!selectedToolDefinition) return;
    downloadJson(
      'Tool definition',
      selectedToolDefinition,
      `context-action-${selectedToolDefinition.name.replaceAll('.', '-')}-definition.json`
    );
  };

  const downloadSelectedToolCall = () => {
    if (!selectedToolName) return;
    const argumentsValue = parseToolArguments();
    if (!argumentsValue) return;
    downloadJson(
      'tools/call request',
      {
        method: 'tools/call',
        params: { name: selectedToolName, arguments: argumentsValue },
      },
      `context-action-${selectedToolName.replaceAll('.', '-')}-call.json`
    );
  };

  const downloadExecutionTrace = () => {
    if (!traceEntries.length) return;
    downloadTextFile(
      JSON.stringify(traceEntries, null, 2),
      'context-action-studio-trace.json'
    );
  };

  const closeWorkspaceSearch = (restoreFocus = true) => {
    setWorkspaceSearchOpen(false);
    setWorkspaceSearchQuery('');
    if (restoreFocus) {
      window.requestAnimationFrame(() =>
        workspaceSearchTriggerRef.current?.focus()
      );
    }
  };

  const closeQuickOpen = () => {
    setQuickOpenOpen(false);
  };

  const selectQuickOpenFile = async (path: string) => {
    const outcome = await openWorkspaceFile(path);
    if (outcome.ok) closeQuickOpen();
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
          <span
            className="storage-chip"
            title={snapshot.storageError ?? undefined}
          >
            {storageLabel}
          </span>
          {storageErrorLabel ? (
            <span
              aria-label={`${storageErrorLabel}: ${snapshot.storageError}`}
              className="storage-error-chip"
              role="status"
              title={snapshot.storageError}
            >
              {storageErrorLabel}
            </span>
          ) : null}
          {hasWritableFolder ||
          folderRestoreState === 'restoring' ||
          folderRestoreUnavailable ? (
            <span
              className={`folder-sync-chip folder-sync-${folderPermission} folder-sync-restore-${folderRestoreState}`}
              title={
                folderRestoreState === 'restoring'
                  ? 'Restoring the persisted folder connection'
                  : folderRestoreUnavailable
                    ? 'The browser workspace is available; open the folder again to reconnect'
                    : 'Writable folder permission status'
              }
            >
              {folderPermissionLabel}
            </span>
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
          <a
            href="https://mineclover.github.io/context-action/example/catalog/integrations/mcp-function-calling"
            target="_blank"
            rel="noreferrer"
          >
            MCP catalog ↗
          </a>
        </div>
      </header>

      <div className="studio-workspace">
        <aside className="studio-sidebar">
          <WorkspaceExplorerPanel
            fileTree={
              <FileTree
                activePath={snapshot.activePath}
                disabled={!isStorageReady || running}
                dirtyPaths={dirtyPaths}
                files={snapshot.files}
                onSelect={(path) => void openWorkspaceFile(path)}
              />
            }
            folderInputRef={folderInputRef}
            folderPermission={folderPermission}
            folderPermissionNeedsAction={folderPermissionNeedsAction}
            hasWritableFolder={hasWritableFolder}
            isStorageReady={isStorageReady}
            onCreateFile={() => setShowCreateFile(true)}
            onDisconnectFolder={() => void handleDisconnectFolder()}
            onFolderInputChange={(files) => void handleFolderInput(files)}
            onGrantFolderAccess={() => void handleGrantFolderAccess()}
            onOpenFolder={() => void handleOpenFolder()}
            onReloadFolder={() => void handleReloadFolder()}
            onResetWorkspace={() => void resetDemoWorkspace()}
            openingFolder={openingFolder}
            rootName={snapshot.rootName}
            running={running}
          />
          <ToolCatalogPanel
            copyFeedback={copyFeedback}
            getToolDefinition={(name) => registry.getToolDefinition(name)}
            isStorageReady={isStorageReady}
            onClearToolFilter={() => setToolFilter('')}
            onCopyCall={() => void copySelectedToolCall()}
            onCopyDefinition={() =>
              void copyJson('Tool definition', selectedToolDefinition)
            }
            onCopyToolsList={() =>
              void copyJson(
                'tools/list result',
                registry.listTools({ method: 'tools/list' })
              )
            }
            onDownloadCall={downloadSelectedToolCall}
            onDownloadDefinition={downloadSelectedToolDefinition}
            onDownloadToolsList={downloadToolList}
            onResetToolArguments={resetSelectedToolArguments}
            onRunSelectedTool={() => void runSelectedTool()}
            onSelectTool={setSelectedToolName}
            onToolArgumentsChange={(value) => {
              toolArgumentsSampleRef.current = false;
              setToolArgumentsText(value);
              if (toolArgumentsError) setToolArgumentsError(null);
            }}
            onToolCatalogFilterChange={(value) => setToolCatalogFilter(value)}
            onToolFilterChange={setToolFilter}
            running={running}
            selectedToolDefinition={selectedToolDefinition}
            selectedToolName={selectedToolName}
            toolArgumentsError={toolArgumentsError}
            toolArgumentsText={toolArgumentsText}
            toolCatalogCounts={toolCatalogCounts}
            toolCatalogFilter={toolCatalogFilter}
            toolFilter={toolFilter}
            toolNames={toolNames}
            visibleToolNames={visibleToolNames}
          />
          <div className="trace-section">
            <div className="sidebar-section-heading">
              <span>Execution trace</span>
              <span className="trace-heading-actions">
                <button
                  aria-label="Clear execution trace"
                  className="trace-clear-button"
                  disabled={!traceEntries.length || running}
                  onClick={clearToolTrace}
                  title={
                    running
                      ? 'Finish the current execution before clearing the trace'
                      : 'Clear execution trace'
                  }
                  type="button"
                >
                  Clear
                </button>
                <button
                  aria-label="Copy execution trace"
                  className="trace-copy-button"
                  disabled={!traceEntries.length || running}
                  onClick={() => void copyJson('Execution trace', traceEntries)}
                  type="button"
                >
                  Copy
                </button>
                <button
                  aria-label="Download execution trace"
                  className="trace-copy-button"
                  disabled={!traceEntries.length || running}
                  onClick={downloadExecutionTrace}
                  type="button"
                >
                  Download
                </button>
                {traceEntries.length > 8 ? (
                  <button
                    aria-controls="trace-list"
                    aria-expanded={showAllTrace}
                    aria-label={
                      showAllTrace
                        ? 'Show recent execution trace'
                        : 'Show all execution trace'
                    }
                    className="trace-copy-button"
                    onClick={() => setShowAllTrace((current) => !current)}
                    type="button"
                  >
                    {showAllTrace ? 'Recent' : 'All'}
                  </button>
                ) : null}
                <span className="count-badge">{traceEntries.length}</span>
              </span>
            </div>
            <div
              aria-label="Tool execution trace"
              aria-live="polite"
              className="trace-list"
              id="trace-list"
              role="log"
            >
              {traceEntries.length ? (
                traceEntries
                  .slice(0, showAllTrace ? traceEntries.length : 8)
                  .map((entry) => (
                    <div
                      className={`trace-row trace-row-${entry.status}`}
                      key={entry.id}
                      title={
                        entry.kind === 'call'
                          ? `${entry.toolCallId ? `toolCallId ${entry.toolCallId}` : `traceId ${entry.id}`} · traceId ${entry.id}${entry.sessionId ? ` · sessionId ${entry.sessionId}` : ''}`
                          : entry.kind === 'agent'
                            ? `agent request · ${entry.source}${entry.sessionId ? ` · sessionId ${entry.sessionId}` : ''}`
                            : 'tools/list discovery'
                      }
                    >
                      <span className="trace-mark" aria-hidden="true">
                        {entry.status === 'running'
                          ? '…'
                          : entry.status === 'failed'
                            ? '!'
                            : entry.status === 'cancelled'
                              ? '↶'
                              : '✓'}
                      </span>
                      <span className="trace-copy">
                        <strong>{entry.name}</strong>
                        <small>
                          {entry.kind === 'discovery'
                            ? [
                                entry.summary,
                                entry.sessionId
                                  ? `session ${formatTraceId(entry.sessionId)}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')
                            : [
                                entry.kind === 'agent'
                                  ? 'agent'
                                  : entry.toolCallId
                                    ? `call ${formatTraceId(entry.toolCallId)}`
                                    : formatTraceId(entry.id),
                                entry.source,
                                entry.sessionId
                                  ? `session ${formatTraceId(entry.sessionId)}`
                                  : null,
                                `${entry.durationMs ?? 0}ms`,
                                entry.retryable === true
                                  ? 'retryable'
                                  : entry.retryable === false
                                    ? 'terminal'
                                    : null,
                                entry.summary,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                        </small>
                        {entry.kind === 'call' &&
                        (entry.argumentsText || entry.resultText) ? (
                          <details className="trace-details">
                            <summary>Inspect tools/call</summary>
                            <div className="trace-detail-block">
                              <span>arguments</span>
                              <pre>{entry.argumentsText ?? '{}'}</pre>
                            </div>
                            {entry.resultText ? (
                              <div className="trace-detail-block">
                                <span>tool result</span>
                                <pre>{entry.resultText}</pre>
                              </div>
                            ) : null}
                          </details>
                        ) : null}
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
            <div
              aria-label="Open workspace files"
              className="editor-tabs"
              ref={editorTabsRef}
              role="tablist"
            >
              {snapshot.files.map((file, index) => (
                <button
                  aria-selected={file.path === snapshot.activePath}
                  aria-controls="workspace-source-panel"
                  className={`editor-tab ${file.path === snapshot.activePath ? 'editor-tab-active' : ''}`}
                  disabled={!isStorageReady || running}
                  id={`workspace-tab-${index}`}
                  key={file.path}
                  onClick={() => void openWorkspaceFile(file.path)}
                  onKeyDown={(event) => handleEditorTabKeyDown(event, index)}
                  role="tab"
                  tabIndex={file.path === snapshot.activePath ? 0 : -1}
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
                aria-keyshortcuts="Control+P Meta+P"
                aria-label="Quick open workspace file"
                className="editor-action"
                disabled={!isStorageReady || running}
                onClick={() => setQuickOpenOpen(true)}
                title="Quick open a workspace file (⌘/Ctrl+P)"
                type="button"
              >
                Quick open
              </button>
              <button
                aria-keyshortcuts="Control+Shift+F Meta+Shift+F"
                aria-label={
                  workspaceSearchOpen
                    ? 'Close workspace search'
                    : 'Search workspace'
                }
                aria-controls="workspace-search-panel"
                aria-expanded={workspaceSearchOpen}
                className={`editor-action editor-search ${workspaceSearchOpen ? 'editor-search-active' : ''}`}
                disabled={!isStorageReady || running}
                onClick={() => {
                  if (workspaceSearchOpen) {
                    closeWorkspaceSearch();
                  } else {
                    setWorkspaceSearchOpen(true);
                    setWorkspaceSearchQuery('');
                  }
                }}
                ref={workspaceSearchTriggerRef}
                title="Search all workspace files (⌘/Ctrl+Shift+F)"
                type="button"
              >
                {workspaceSearchOpen ? 'Close search' : 'Search'}
              </button>
              <button
                aria-label="Undo last edit"
                aria-keyshortcuts="Control+Z Meta+Z"
                className="editor-action"
                disabled={
                  !isStorageReady ||
                  running ||
                  (!workspace.canUndo() && !hasUnsavedChanges)
                }
                onClick={() =>
                  void executeQuickTool({
                    name: 'workspace.undo',
                    arguments: { expectedRevision: snapshot.revision },
                  })
                }
                title="Undo through workspace.undo"
                type="button"
              >
                ↶ Undo
              </button>
              <button
                aria-label="Redo last edit"
                aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y Meta+Y"
                className="editor-action"
                disabled={!isStorageReady || running || !workspace.canRedo()}
                onClick={() =>
                  void executeQuickTool({
                    name: 'workspace.redo',
                    arguments: { expectedRevision: snapshot.revision },
                  })
                }
                title="Redo through workspace.redo"
                type="button"
              >
                ↷ Redo
              </button>
              <button
                aria-label={`Rename ${activeFile.path}`}
                className="editor-action"
                disabled={!isStorageReady || running}
                onClick={() => setShowRenameFile(true)}
                title="Rename the active file through workspace.renameFile"
                type="button"
              >
                Rename
              </button>
              <button
                aria-label={`Delete ${activeFile.path}`}
                className="editor-delete"
                disabled={!isStorageReady || running || !canDeleteActiveFile}
                onClick={() => void deleteActiveFile()}
                title="Delete the active file through workspace.deleteFile"
                type="button"
              >
                Delete
              </button>
              <button
                aria-label={`Revert ${activeFile.path}`}
                className="editor-revert"
                disabled={!isStorageReady || running || !canRevertActiveFile}
                onClick={() => void revertActiveFile()}
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
                disabled={
                  !isStorageReady ||
                  running ||
                  saving ||
                  !hasUnsavedChanges ||
                  hasUnpersistedEditorDrafts
                }
                onClick={() => void saveWorkspace()}
                title={
                  hasUnpersistedEditorDrafts
                    ? 'Syncing the editor draft before saving'
                    : hasWritableFolder
                      ? 'Write dirty files to the selected folder and IndexedDB'
                      : 'Mark the current browser workspace checkpoint as saved'
                }
                type="button"
              >
                {saving
                  ? 'Saving…'
                  : hasUnpersistedEditorDrafts
                    ? 'Syncing…'
                    : hasWritableFolder
                      ? 'Save to folder'
                      : 'Save'}
              </button>
              <span
                aria-live="polite"
                className={`save-status ${hasUnsavedChanges ? 'save-status-dirty' : ''}`}
                role="status"
              >
                <span className="status-dot" />
                {hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
              </span>
              <span className="revision-label">
                revision {snapshot.revision}
              </span>
            </div>
          </div>
          {quickOpenOpen ? (
            <QuickOpenPanel
              files={snapshot.files}
              onClose={closeQuickOpen}
              onSelect={selectQuickOpenFile}
            />
          ) : null}
          {workspaceSearchOpen ? (
            <WorkspaceSearchPanel
              files={searchableFiles}
              onClose={closeWorkspaceSearch}
              onQueryChange={setWorkspaceSearchQuery}
              onSelect={(match) => {
                void (async () => {
                  const outcome = await openWorkspaceFile(match.path);
                  if (!outcome.ok) return;
                  workspaceSearchRequestRef.current += 1;
                  setWorkspaceSearchFocus({
                    path: match.path,
                    line: match.line,
                    requestId: workspaceSearchRequestRef.current,
                  });
                  closeWorkspaceSearch(false);
                })();
              }}
              query={workspaceSearchQuery}
            />
          ) : null}
          <section
            aria-label="Workspace source"
            aria-labelledby={`workspace-tab-${Math.max(
              0,
              snapshot.files.findIndex(
                (file) => file.path === snapshot.activePath
              )
            )}`}
            className="code-editor"
            id="workspace-source-panel"
            role="tabpanel"
            tabIndex={0}
          >
            {activeFile.kind === 'asset' ? (
              <>
                <div className="code-header">
                  <span>{activeFile.language}</span>
                  <span>preview asset · read-only</span>
                </div>
                <div className="asset-placeholder">
                  <div className="asset-placeholder-icon">◇</div>
                  <strong>{activeFile.path}</strong>
                  <span>
                    {activeFile.mimeType ?? 'binary asset'} ·{' '}
                    {formatFileSize(activeFile.blob?.size ?? 0)}
                  </span>
                  <p>
                    This Blob is preserved in the browser workspace and
                    available to the sandbox preview. Binary assets are not
                    edited as text.
                  </p>
                </div>
              </>
            ) : (
              <CodeEditor
                disabled={!isStorageReady || running}
                file={activeFile}
                focusRequest={
                  activeFile.path === workspaceSearchFocus?.path
                    ? workspaceSearchFocus
                    : undefined
                }
                onFocusRequestConsumed={() => setWorkspaceSearchFocus(null)}
                onOpenWorkspaceSearch={() => {
                  setWorkspaceSearchOpen(true);
                  setWorkspaceSearchQuery('');
                }}
                onBlur={() => void flushEditorDrafts()}
                onChange={(source) =>
                  updateEditorDraft(activeFile.path, source)
                }
                source={editorDrafts[activeFile.path] ?? activeFile.source}
              />
            )}
          </section>

          <section className="chat-panel">
            <div className="chat-heading">
              <div>
                <span className="panel-label">Agent</span>
                <strong>What should we change?</strong>
              </div>
              <span className="agent-badge">
                {openRouterSettings.apiKey
                  ? 'OPENROUTER / TOOL CALLING'
                  : 'LOCAL / TOOL CALLING'}
              </span>
            </div>
            {pendingApprovals.length ? (
              <section
                aria-label="Pending tool approvals"
                aria-live="assertive"
                className="approval-panel"
                role="region"
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
                      {approval.sessionId
                        ? ` · session ${formatTraceId(approval.sessionId)}`
                        : ''}
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
                        ref={
                          approval.id === pendingApprovals[0]?.id
                            ? firstApprovalButtonRef
                            : undefined
                        }
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
            <div
              aria-label="Agent conversation"
              aria-live="polite"
              className="message-list"
              ref={messageListRef}
              role="log"
            >
              {messages.map((message, index) => (
                <div
                  className={`message message-${message.role}${message.tone ? ` message-${message.tone}` : ''}`}
                  key={`${message.role}-${index}`}
                >
                  <span className="message-avatar">
                    {message.role === 'assistant' ? '✦' : 'You'}
                  </span>
                  <div>
                    <p>{message.text}</p>
                    {message.tools?.length ? (
                      <div className="message-tools">
                        {message.tools.map((tool, toolIndex) => (
                          <span key={`${tool}-${toolIndex}`}>{tool}</span>
                        ))}
                      </div>
                    ) : null}
                    {!running && (message.retryPrompt || message.retryTool) ? (
                      <button
                        className="message-retry"
                        onClick={() => {
                          if (message.retryPrompt) {
                            void executePrompt(message.retryPrompt);
                          } else if (message.retryTool) {
                            void executeQuickTool(message.retryTool);
                          }
                        }}
                        type="button"
                      >
                        {message.retryLabel ?? 'Retry'}
                      </button>
                    ) : null}
                    {!running && message.folderAction === 'reconnect' ? (
                      <button
                        className="message-reconnect"
                        onClick={() => void handleOpenFolder()}
                        type="button"
                      >
                        Reconnect folder
                      </button>
                    ) : null}
                    {!running && message.folderAction === 'grant' ? (
                      <button
                        className="message-reconnect"
                        onClick={() => void handleGrantFolderAccess()}
                        type="button"
                      >
                        Grant folder access
                      </button>
                    ) : null}
                    {!running && message.previewAction ? (
                      <button
                        className="message-reconnect"
                        onClick={refreshPreview}
                        type="button"
                      >
                        Refresh preview
                      </button>
                    ) : null}
                    {!running && message.openSettings ? (
                      <button
                        className="message-settings"
                        onClick={() => setShowSettings(true)}
                        type="button"
                      >
                        Open provider settings
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {running ? (
                <div aria-live="polite" className="running-line" role="status">
                  <span className="pulse-dot" /> {executionStatusLabel}…
                  {pendingApprovals.length ? (
                    <span className="running-hint">
                      Choose Approve or Deny above
                    </span>
                  ) : null}
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
                aria-keyshortcuts={running ? 'Escape' : undefined}
                className={`send-button ${running ? 'send-button-cancel' : ''}`}
                disabled={!isStorageReady}
                onClick={() =>
                  running ? cancelExecution() : void executePrompt(prompt)
                }
                title={
                  running
                    ? 'Cancel current agent execution (Escape)'
                    : undefined
                }
                type="button"
              >
                {running ? 'Cancel' : 'Send'} <span>{running ? '×' : '↗'}</span>
              </button>
            </div>
            <div className="prompt-recipes-heading">
              Try a tool-chain recipe
            </div>
            <div
              aria-label="Tool-chain prompt recipes"
              className="prompt-chips"
            >
              {[
                'Make it emerald',
                'Add a feature card',
                'Update the hero',
                'Show workspace status',
                'Create notes.md',
                'Rename index.html to landing.html',
                'Download current file',
                'Save to folder',
                'Reload folder',
                'Disconnect folder',
                'Reset demo workspace',
              ].map((example) => (
                <button
                  disabled={!isStorageReady || running}
                  key={example}
                  onClick={() => setPrompt(example)}
                  type="button"
                >
                  {example}
                </button>
              ))}
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
              aria-live="polite"
              className={`preview-status preview-status-${snapshot.preview.status}`}
              role="status"
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
                disabled={!isStorageReady || running}
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
          {snapshot.preview.status === 'error' ? (
            <div
              aria-label="Preview runtime error"
              aria-live="assertive"
              className="preview-error-panel"
              role="alert"
            >
              <div className="preview-error-heading">
                <strong>Preview runtime error</strong>
                <button
                  aria-label="Refresh preview after runtime error"
                  className="preview-error-refresh"
                  disabled={!isStorageReady || running}
                  onClick={refreshPreview}
                  type="button"
                >
                  Refresh
                </button>
              </div>
              <code>
                {snapshot.preview.message ?? 'The preview failed to load.'}
              </code>
            </div>
          ) : null}
          {previewDiagnostics.length ? (
            <section
              aria-label="Preview diagnostics"
              aria-live="polite"
              className="preview-diagnostics"
            >
              <div className="preview-diagnostics-heading">
                <strong>Preview diagnostics</strong>
                <span>{previewDiagnostics.length}</span>
              </div>
              <ul>
                {previewDiagnostics.slice(0, 6).map((diagnostic) => (
                  <li
                    key={`${diagnostic.kind}:${diagnostic.sourcePath}:${diagnostic.requestedPath}`}
                  >
                    <code>{diagnostic.sourcePath}</code>
                    <span>{diagnostic.message}</span>
                  </li>
                ))}
              </ul>
              {previewDiagnostics.length > 6 ? (
                <small>
                  +{previewDiagnostics.length - 6} more diagnostic(s)
                </small>
              ) : null}
            </section>
          ) : null}
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
        <span className={`statusbar-state statusbar-state-${studioStatusTone}`}>
          <span className="status-dot" /> {studioStatus}
        </span>
        <span>
          {openRouterSettings.apiKey
            ? `OpenRouter · ${openRouterSettings.model}`
            : `Context-Action ToolContext · ${storageLabel}`}
        </span>
        <span>{persistenceFooterLabel}</span>
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
      {showRenameFile ? (
        <RenameWorkspaceFileDialog
          initialPath={activeFile.path}
          onClose={() => setShowRenameFile(false)}
          onRename={renameWorkspaceFile}
        />
      ) : null}
      {confirmationRequest ? (
        <ConfirmationDialog
          onResolve={resolveConfirmation}
          request={confirmationRequest}
        />
      ) : null}
    </div>
  );
}

function ToolRuntime() {
  const [repository] = useState(() => new WebCodingWorkspaceRepository());
  const [workspace] = useState(() => new BrowserWorkspace(repository));
  const [folderRestoreState, setFolderRestoreState] =
    useState<FolderRestoreState>('restoring');
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0);
  const requestPreviewRefresh = useCallback(() => {
    setPreviewRefreshToken((current) => current + 1);
  }, []);
  const [fileSystemAdapter] = useState(
    () =>
      new BrowserWorkspaceFileSystemAdapter({
        getDirectoryHandle: () => repository.getDirectoryHandle(),
        setDirectoryHandle: (handle) => repository.setDirectoryHandle(handle),
        clearDirectoryHandle: () => repository.clearDirectoryHandle(),
      })
  );
  useEffect(() => {
    let disposed = false;
    void (async () => {
      await workspace.hydrate();
      if (disposed) return;
      if (workspace.getSnapshot().storageMode === 'indexed-db') {
        try {
          const persistedHandle = await repository.getDirectoryHandle();
          if (disposed) return;
          if (!persistedHandle) {
            if (!disposed) setFolderRestoreState('idle');
            return;
          }
          const restored = await fileSystemAdapter.restorePersistedFolder();
          if (!disposed) {
            setFolderRestoreState(restored ? 'restored' : 'unavailable');
          }
        } catch {
          if (!disposed) setFolderRestoreState('unavailable');
        }
      } else if (!disposed) {
        setFolderRestoreState('idle');
      }
    })();
    return () => {
      disposed = true;
    };
  }, [fileSystemAdapter, repository, workspace]);
  return (
    <ToolHandlers
      workspace={workspace}
      fileSystemAdapter={fileSystemAdapter}
      onPreviewRefresh={requestPreviewRefresh}
    >
      <EditorWorkbench
        folderRestoreState={folderRestoreState}
        workspace={workspace}
        fileSystemAdapter={fileSystemAdapter}
        previewRefreshToken={previewRefreshToken}
      />
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
