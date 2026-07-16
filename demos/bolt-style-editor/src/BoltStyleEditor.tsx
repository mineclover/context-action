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
import { useConfirmationRequest } from './hooks/use-confirmation-request';
import { usePreviewBridge } from './hooks/use-preview-bridge';
import { useStudioExportActions } from './hooks/use-studio-export-actions';
import { useToolCatalogActions } from './hooks/use-tool-catalog-actions';
import {
  type EditorMessage,
  useToolExecution,
} from './hooks/use-tool-execution';
import { useWorkspaceEditorActions } from './hooks/use-workspace-editor-actions';
import { useWorkspaceFolderActions } from './hooks/use-workspace-folder-actions';
import { useWorkspaceKeyboardShortcuts } from './hooks/use-workspace-keyboard-shortcuts';
import {
  type FolderRestoreState,
  useWorkspaceRuntime,
} from './hooks/use-workspace-runtime';
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
import { ToolTracePanel } from './views/tool-trace-panel';
import { WorkspaceExplorerPanel } from './views/workspace-explorer-panel';
import { WorkspaceFileTree } from './views/workspace-file-tree';
import {
  QuickOpenPanel,
  WorkspaceSearchPanel,
} from './views/workspace-search-panels';
import {
  BrowserWorkspace,
  buildPreviewDocument,
  collectPreviewDiagnostics,
  type WorkspaceFile,
} from './workspace';
import { BrowserWorkspaceFileSystemAdapter } from './workspace-filesystem';

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
  usePreviewBridge({
    workspace,
    iframeRef,
    revision: snapshot.revision,
  });
  const [prompt, setPrompt] = useState(
    '보라색 테마로 바꾸고 기능 카드를 추가해줘'
  );
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
  const { confirmationRequest, requestConfirmation, resolveConfirmation } =
    useConfirmationRequest();
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
  const [toolArgumentsError, setToolArgumentsError] = useState<string | null>(
    null
  );
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
  const activeSource = editorDrafts[activeFile.path] ?? activeFile.source;
  const {
    parseToolArguments,
    resetSelectedToolArguments,
    handleToolArgumentsChange,
    runSelectedTool,
  } = useToolCatalogActions({
    activeFile,
    activeSource,
    snapshotRevision: snapshot.revision,
    selectedToolName,
    selectedToolDefinition,
    toolArgumentsText,
    toolArgumentsError,
    setToolArgumentsText,
    setToolArgumentsError,
    requestConfirmation,
    executeQuickTool,
  });
  const {
    copyFeedback,
    copyJson,
    copySelectedToolCall,
    downloadToolList,
    downloadSelectedToolDefinition,
    downloadSelectedToolCall,
    downloadExecutionTrace,
  } = useStudioExportActions({
    registry,
    traceEntries,
    selectedToolName,
    selectedToolDefinition,
    parseToolArguments,
  });
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
  useWorkspaceKeyboardShortcuts({
    showSettings,
    showCreateFile,
    showRenameFile,
    confirmationRequest,
    quickOpenOpen,
    workspaceSearchOpen,
    running,
    saving,
    isStorageReady,
    hasUnsavedChanges,
    workspace,
    executionControllerRef,
    setQuickOpenOpen,
    cancelExecution,
    saveWorkspace,
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
              <WorkspaceFileTree
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
            onToolArgumentsChange={handleToolArgumentsChange}
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
          <ToolTracePanel
            formatTraceId={formatTraceId}
            onClear={clearToolTrace}
            onCopy={() => void copyJson('Execution trace', traceEntries)}
            onDownload={downloadExecutionTrace}
            onToggleShowAll={() => setShowAllTrace((current) => !current)}
            running={running}
            showAllTrace={showAllTrace}
            traceEntries={traceEntries}
          />
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
  const {
    workspace,
    fileSystemAdapter,
    folderRestoreState,
    previewRefreshToken,
    requestPreviewRefresh,
  } = useWorkspaceRuntime();
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
