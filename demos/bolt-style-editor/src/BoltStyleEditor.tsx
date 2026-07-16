import {
  type KeyboardEvent,
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
import { useWorkspaceEditorActions } from './hooks/use-workspace-editor-actions';
import { useWorkspaceFolderActions } from './hooks/use-workspace-folder-actions';
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
import { AgentChatPanel } from './views/agent-chat-panel';
import {
  CodeEditor,
  type WorkspaceSearchFocusRequest,
} from './views/code-editor';
import {
  ConfirmationDialog,
  type ConfirmationRequest,
  CreateWorkspaceFileDialog,
  OpenRouterSettingsDialog,
  RenameWorkspaceFileDialog,
} from './views/editor-dialogs';
import { FileIcon } from './views/file-icon';
import { PreviewPanel } from './views/preview-panel';
import { StudioStatusBar, StudioTopbar } from './views/studio-chrome';
import {
  type ToolCatalogFilter,
  ToolCatalogPanel,
} from './views/tool-catalog-panel';
import { WorkspaceExplorerPanel } from './views/workspace-explorer-panel';
import {
  QuickOpenPanel,
  WorkspaceSearchPanel,
} from './views/workspace-search-panels';
import {
  BrowserWorkspace,
  buildPreviewDocument,
  collectPreviewDiagnostics,
  type PreviewBridgeMessage,
  type WorkspaceFile,
} from './workspace';
import { BrowserWorkspaceFileSystemAdapter } from './workspace-filesystem';
import { WebCodingWorkspaceRepository } from './workspace-storage';

type FolderRestoreState = 'idle' | 'restoring' | 'restored' | 'unavailable';

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

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTraceId(id: string): string {
  return id.length > 18 ? `…${id.slice(-17)}` : id;
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
  const [saving, setSaving] = useState(false);
  const [editorDrafts, setEditorDrafts] = useState<Record<string, string>>({});
  const editorDraftsRef = useRef(editorDrafts);
  editorDraftsRef.current = editorDrafts;
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

  const {
    openingFolder,
    refreshPreview,
    handleFolderInput,
    handleOpenFolder,
    handleReloadFolder,
    handleDisconnectFolder,
    handleGrantFolderAccess,
    resetDemoWorkspace,
  } = useWorkspaceFolderActions({
    workspace,
    fileSystemAdapter,
    folderInputRef,
    isStorageReady,
    hasWritableFolder,
    hasUnsavedChanges,
    running,
    requestConfirmation,
    executeQuickTool,
    setMessages,
    setEditorDrafts,
  });
  const {
    flushEditorDrafts,
    updateEditorDraft,
    createWorkspaceFile,
    openWorkspaceFile,
    renameWorkspaceFile,
    deleteActiveFile,
    revertActiveFile,
    saveWorkspace,
    downloadActiveFile,
  } = useWorkspaceEditorActions({
    workspace,
    snapshotRevision: snapshot.revision,
    activeFile,
    isStorageReady,
    hasWritableFolder,
    canDeleteActiveFile,
    canRevertActiveFile,
    running,
    saving,
    editorDraftsRef,
    setEditorDrafts,
    setMessages,
    setSaving,
    flushEditorDraftsRef,
    requestConfirmation,
    executeQuickTool,
  });

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
      <StudioTopbar
        agentLabel={openRouterSettings.apiKey ? 'OpenRouter' : 'Local agent'}
        folderLinkUnavailable={folderRestoreUnavailable}
        onOpenSettings={() => setShowSettings(true)}
        permission={folderPermission}
        permissionLabel={folderPermissionLabel}
        restoreState={folderRestoreState}
        rootName={snapshot.rootName}
        showFolderSync={
          hasWritableFolder ||
          folderRestoreState === 'restoring' ||
          folderRestoreUnavailable
        }
        storageError={snapshot.storageError}
        storageErrorLabel={storageErrorLabel}
        storageLabel={storageLabel}
        toolCount={toolNames.length}
      />
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

          <AgentChatPanel
            agentMode={openRouterSettings.apiKey ? 'openrouter' : 'local'}
            executionStatusLabel={executionStatusLabel}
            firstApprovalButtonRef={firstApprovalButtonRef}
            formatSessionId={formatTraceId}
            isStorageReady={isStorageReady}
            messageListRef={messageListRef}
            messages={messages}
            onCancel={cancelExecution}
            onExecutePrompt={executePrompt}
            onExecuteQuickTool={(call) => executeQuickTool(call)}
            onGrantFolderAccess={() => void handleGrantFolderAccess()}
            onOpenSettings={() => setShowSettings(true)}
            onPromptChange={setPrompt}
            onReconnectFolder={() => void handleOpenFolder()}
            onRefreshPreview={refreshPreview}
            onResolveApproval={(id, decision) =>
              resolveToolApproval(id, decision)
            }
            pendingApprovals={pendingApprovals}
            prompt={prompt}
            running={running}
          />
        </main>

        <PreviewPanel
          activePath={activeFile.path}
          diagnostics={previewDiagnostics}
          iframeRef={iframeRef}
          onRefresh={refreshPreview}
          preview={snapshot.preview}
          previewDocument={previewDocument}
          previewStatusLabel={previewStatusLabel}
          refreshDisabled={!isStorageReady || running}
          refreshToken={previewRefreshToken}
          revision={snapshot.revision}
          rootName={snapshot.rootName}
        />
      </div>

      <StudioStatusBar
        persistenceLabel={persistenceFooterLabel}
        providerStatusLabel={
          openRouterSettings.apiKey
            ? `OpenRouter · ${openRouterSettings.model}`
            : `Context-Action ToolContext · ${storageLabel}`
        }
        status={studioStatus}
        statusTone={studioStatusTone}
      />
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
