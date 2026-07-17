import {
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BoltStyleToolProvider,
  useBoltStyleToolRegistry,
} from './bolt-style-tool-context';
import { useConfirmationRequest } from './hooks/use-confirmation-request';
import { useEditorObservables } from './hooks/use-editor-observables';
import { usePanelLayout } from './hooks/use-panel-layout';
import { usePreviewBridge } from './hooks/use-preview-bridge';
import { useStudioExportActions } from './hooks/use-studio-export-actions';
import { useToolCatalogActions } from './hooks/use-tool-catalog-actions';
import { useToolCatalogModel } from './hooks/use-tool-catalog-model';
import { useToolChainSimulation } from './hooks/use-tool-chain-simulation';
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
import { useWorkspaceVersionHistory } from './hooks/use-workspace-version-history';
import {
  readOpenRouterSettings,
  saveOpenRouterSettings,
  subscribeOpenRouterSettings,
} from './openrouter';
import { resolveToolApproval } from './tool-approval';
import { standaloneToolChainSimulationSnapshots } from './tool-chain-simulation-catalog';
import { standaloneToolChainRecipes } from './tool-command-catalog';
import { ToolHandlers } from './tool-handlers';
import { formatToolSuccessMessage } from './tool-result-utils';
import { clearToolTrace } from './tool-trace';
import { AgentChatPanel } from './views/agent-chat-panel';
import { type WorkspaceSearchFocusRequest } from './views/code-editor';
import {
  ConfirmationDialog,
  CreateWorkspaceFileDialog,
  OpenRouterSettingsDialog,
  RenameWorkspaceFileDialog,
} from './views/editor-dialogs';
import { PanelResizeHandle } from './views/panel-resize-handle';
import { PreviewPanel } from './views/preview-panel';
import { StudioStatusBar, StudioTopbar } from './views/studio-chrome';
import {
  type ToolCatalogFilter,
  ToolCatalogPanel,
} from './views/tool-catalog-panel';
import { ToolChainSimulationPanel } from './views/tool-chain-simulation-panel';
import { ToolTracePanel } from './views/tool-trace-panel';
import { VersionDiffDialog } from './views/version-diff-dialog';
import { VersionHistoryPanel } from './views/version-history-panel';
import { WorkspaceEditorToolbar } from './views/workspace-editor-toolbar';
import { WorkspaceExplorerPanel } from './views/workspace-explorer-panel';
import { WorkspaceFileTree } from './views/workspace-file-tree';
import {
  QuickOpenPanel,
  WorkspaceSearchPanel,
} from './views/workspace-search-panels';
import { WorkspaceSourcePanel } from './views/workspace-source-panel';
import {
  BrowserWorkspace,
  buildPreviewDocument,
  collectPreviewDiagnostics,
  type WorkspaceFile,
} from './workspace';
import type { WorkspaceFileSystemAdapter } from './workspace-filesystem';

function formatTraceId(id: string): string {
  return id.length > 18 ? `…${id.slice(-17)}` : id;
}

const INITIAL_PROMPT_MAX_LENGTH = 4_000;
const standaloneToolChainSimulationSnapshot =
  standaloneToolChainSimulationSnapshots[0]!;

/** Read one catalog deep-link prompt without executing it. */
function readInitialPrompt(): string {
  if (typeof window === 'undefined') return '';
  try {
    const url = new URL(window.location.href);
    const prompt = url.searchParams.get('prompt')?.trim() ?? '';
    if (!prompt) return '';
    url.searchParams.delete('prompt');
    window.history.replaceState(window.history.state, '', url);
    return prompt.slice(0, INITIAL_PROMPT_MAX_LENGTH);
  } catch {
    return '';
  }
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
  fileSystemAdapter: WorkspaceFileSystemAdapter;
  previewRefreshToken: number;
  folderRestoreState: FolderRestoreState;
}) {
  const registry = useBoltStyleToolRegistry();
  const {
    previewCollapsed,
    previewWidth,
    resizePreview,
    resizeSidebar,
    sidebarCollapsed,
    sidebarWidth,
    togglePreview,
    toggleSidebar,
  } = usePanelLayout();
  const {
    snapshot,
    workspaceDirtyPaths,
    deletedPaths,
    canUndo,
    canRedo,
    traceEntries,
    pendingApprovals,
    hasWritableFolder,
    folderPermission,
  } = useEditorObservables({ workspace, fileSystemAdapter });
  const { versions } = useWorkspaceVersionHistory(snapshot);
  const [diffVersionId, setDiffVersionId] = useState<string | null>(null);
  const selectedDiffVersion = versions.find(
    (version) => version.id === diffVersionId
  );
  const selectedDiffVersionIndex = selectedDiffVersion
    ? versions.findIndex((version) => version.id === selectedDiffVersion.id)
    : -1;
  const previousDiffVersion =
    selectedDiffVersionIndex > 0
      ? versions[selectedDiffVersionIndex - 1]
      : undefined;
  useEffect(() => {
    if (diffVersionId && !selectedDiffVersion) setDiffVersionId(null);
  }, [diffVersionId, selectedDiffVersion]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorTabsRef = useRef<HTMLDivElement>(null);
  const workspaceSearchTriggerRef = useRef<HTMLButtonElement>(null);
  usePreviewBridge({
    workspace,
    iframeRef,
    revision: snapshot.revision,
  });
  const [prompt, setPrompt] = useState(readInitialPrompt);
  const [chatOpen, setChatOpen] = useState(() => Boolean(prompt));
  const [simulationOpen, setSimulationOpen] = useState(false);
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
    activeAgentMode,
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
  const {
    state: simulationState,
    runSnapshot,
    resetSimulation,
  } = useToolChainSimulation({ executeQuickTool, running });
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
  const activeFile =
    snapshot.files.find((file) => file.path === snapshot.activePath) ??
    snapshot.files[0];
  const dirtyPaths = useMemo(() => {
    const paths = new Set(workspaceDirtyPaths);
    for (const [path, source] of Object.entries(editorDrafts)) {
      const file = snapshot.files.find((candidate) => candidate.path === path);
      if (file && file.kind !== 'asset' && file.source !== source) {
        paths.add(path);
      }
    }
    return paths;
  }, [editorDrafts, snapshot.files, workspaceDirtyPaths]);
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
  const [selectedToolName, setSelectedToolName] = useState('');
  const [toolFilter, setToolFilter] = useState('');
  const [toolCatalogFilter, setToolCatalogFilter] =
    useState<ToolCatalogFilter>('all');
  const [toolArgumentsText, setToolArgumentsText] = useState('{}');
  const [toolArgumentsError, setToolArgumentsError] = useState<string | null>(
    null
  );
  const [showAllTrace, setShowAllTrace] = useState(false);
  const [traceSessionFilter, setTraceSessionFilter] = useState('all');
  const traceSessionOptions = useMemo(() => {
    const sourceBySession = new Map<string, string>();
    for (const entry of traceEntries) {
      if (!entry.sessionId || sourceBySession.has(entry.sessionId)) continue;
      sourceBySession.set(entry.sessionId, entry.source);
    }
    return Array.from(sourceBySession, ([value, source]) => ({
      value,
      label: `${source} · ${formatTraceId(value)}`,
    }));
  }, [traceEntries]);
  useEffect(() => {
    if (
      traceSessionFilter === 'all' ||
      traceSessionOptions.some((option) => option.value === traceSessionFilter)
    ) {
      return;
    }
    setTraceSessionFilter('all');
  }, [traceSessionFilter, traceSessionOptions]);
  const visibleTraceEntries = useMemo(
    () =>
      traceSessionFilter === 'all'
        ? traceEntries
        : traceEntries.filter(
            (entry) => entry.sessionId === traceSessionFilter
          ),
    [traceEntries, traceSessionFilter]
  );
  const {
    getToolDefinition,
    selectedToolDefinition,
    toolCatalogCounts,
    toolNames,
    toolsList,
    visibleToolNames,
  } = useToolCatalogModel({
    registry,
    selectedToolName,
    toolFilter,
    toolCatalogFilter,
  });
  useEffect(() => {
    if (visibleToolNames.includes(selectedToolName)) return;
    setSelectedToolName(visibleToolNames[0] ?? '');
  }, [selectedToolName, visibleToolNames]);
  const activeSource = editorDrafts[activeFile.path] ?? activeFile.source;
  const {
    parseToolArguments,
    resetSelectedToolArguments,
    handleToolArgumentsChange,
    runSelectedTool,
  } = useToolCatalogActions({
    activeFile,
    activeSource,
    workspaceFiles: snapshot.files,
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
    copyToolsList,
    downloadToolList,
    downloadSelectedToolDefinition,
    downloadSelectedToolCall,
    downloadExecutionTrace,
    downloadPreview,
    previewExporting,
  } = useStudioExportActions({
    previewFiles: searchableFiles,
    previewRootName: snapshot.rootName,
    toolsList,
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

  const workspaceLayoutStyle = {
    '--preview-width': `${previewCollapsed ? 34 : previewWidth}px`,
    '--sidebar-width': `${sidebarCollapsed ? 34 : sidebarWidth}px`,
  } as CSSProperties;

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
      <div className="studio-workspace" style={workspaceLayoutStyle}>
        <aside
          aria-label="Workspace panels"
          className={`studio-sidebar ${sidebarCollapsed ? 'studio-sidebar-collapsed' : ''}`}
        >
          {sidebarCollapsed ? (
            <button
              aria-label="Expand workspace panel"
              className="panel-collapse-rail-button"
              onClick={toggleSidebar}
              title="Expand workspace panel"
              type="button"
            >
              ›
            </button>
          ) : (
            <>
              <button
                aria-label="Collapse workspace panel"
                className="panel-collapse-button sidebar-collapse-button"
                onClick={toggleSidebar}
                title="Collapse workspace panel"
                type="button"
              >
                ‹
              </button>
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
                getToolDefinition={getToolDefinition}
                isStorageReady={isStorageReady}
                onClearToolFilter={() => setToolFilter('')}
                onCopyCall={() => void copySelectedToolCall()}
                onCopyDefinition={() =>
                  void copyJson('Tool definition', selectedToolDefinition)
                }
                onCopyToolsList={() => void copyToolsList()}
                onDownloadCall={downloadSelectedToolCall}
                onDownloadDefinition={downloadSelectedToolDefinition}
                onDownloadToolsList={downloadToolList}
                onResetToolArguments={resetSelectedToolArguments}
                onRunSelectedTool={() => void runSelectedTool()}
                onSelectTool={setSelectedToolName}
                onToolArgumentsChange={handleToolArgumentsChange}
                onToolCatalogFilterChange={(value) =>
                  setToolCatalogFilter(value)
                }
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
                onTraceSessionFilterChange={(value) => {
                  setTraceSessionFilter(value);
                  setShowAllTrace(false);
                }}
                onToggleShowAll={() => setShowAllTrace((current) => !current)}
                running={running}
                showAllTrace={showAllTrace}
                traceEntries={visibleTraceEntries}
                traceSessionFilter={traceSessionFilter}
                traceSessionOptions={traceSessionOptions}
              />
              <VersionHistoryPanel
                isStorageReady={isStorageReady}
                onOpenDiff={setDiffVersionId}
                versions={versions}
              />
            </>
          )}
          {!sidebarCollapsed ? (
            <PanelResizeHandle
              label="Resize workspace panel"
              max={420}
              min={190}
              onResize={resizeSidebar}
              value={sidebarWidth}
            />
          ) : null}
        </aside>

        <main className="studio-main">
          <WorkspaceEditorToolbar
            activeFile={activeFile}
            activePath={snapshot.activePath}
            canDelete={canDeleteActiveFile}
            canRedo={canRedo}
            canRevert={canRevertActiveFile}
            canUndo={canUndo || hasUnsavedChanges}
            dirtyPaths={dirtyPaths}
            editorTabsRef={editorTabsRef}
            files={snapshot.files}
            hasUnsavedChanges={hasUnsavedChanges}
            hasUnpersistedEditorDrafts={hasUnpersistedEditorDrafts}
            hasWritableFolder={hasWritableFolder}
            isStorageReady={isStorageReady}
            onDelete={() => void deleteActiveFile()}
            onDownload={downloadActiveFile}
            onOpenFile={(path) => void openWorkspaceFile(path)}
            onQuickOpen={() => setQuickOpenOpen(true)}
            onRedo={() =>
              void executeQuickTool({
                name: 'workspace.redo',
                arguments: { expectedRevision: snapshot.revision },
              })
            }
            onRename={() => setShowRenameFile(true)}
            onRevert={() => void revertActiveFile()}
            onSave={() => void saveWorkspace()}
            onTabKeyDown={handleEditorTabKeyDown}
            onToggleSearch={() => {
              if (workspaceSearchOpen) {
                closeWorkspaceSearch();
              } else {
                setWorkspaceSearchOpen(true);
                setWorkspaceSearchQuery('');
              }
            }}
            onUndo={() =>
              void executeQuickTool({
                name: 'workspace.undo',
                arguments: { expectedRevision: snapshot.revision },
              })
            }
            revision={snapshot.revision}
            running={running}
            saving={saving}
            workspaceSearchOpen={workspaceSearchOpen}
            workspaceSearchTriggerRef={workspaceSearchTriggerRef}
          />
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
          <WorkspaceSourcePanel
            activeFile={activeFile}
            activeTabId={`workspace-tab-${Math.max(
              0,
              snapshot.files.findIndex(
                (file) => file.path === snapshot.activePath
              )
            )}`}
            disabled={!isStorageReady || running}
            focusRequest={
              activeFile.path === workspaceSearchFocus?.path
                ? workspaceSearchFocus
                : undefined
            }
            onBlur={() => void flushEditorDrafts()}
            onChange={(source) => updateEditorDraft(activeFile.path, source)}
            onFocusRequestConsumed={() => setWorkspaceSearchFocus(null)}
            onOpenWorkspaceSearch={() => {
              setWorkspaceSearchOpen(true);
              setWorkspaceSearchQuery('');
            }}
            source={editorDrafts[activeFile.path] ?? activeFile.source}
          />
        </main>

        <PreviewPanel
          activePath={activeFile.path}
          diagnostics={previewDiagnostics}
          exportDisabled={previewExporting || !isStorageReady}
          iframeRef={iframeRef}
          onOpenFile={openWorkspaceFile}
          onExport={() => void downloadPreview()}
          onRefresh={refreshPreview}
          preview={snapshot.preview}
          previewDocument={previewDocument}
          previewStatusLabel={previewStatusLabel}
          refreshDisabled={!isStorageReady || running}
          refreshToken={previewRefreshToken}
          revision={snapshot.revision}
          rootName={snapshot.rootName}
          collapsed={previewCollapsed}
          onResize={resizePreview}
          onToggleCollapsed={togglePreview}
          previewWidth={previewWidth}
        />
      </div>

      {chatOpen ? (
        <AgentChatPanel
          agentMode={
            activeAgentMode ??
            (openRouterSettings.apiKey ? 'openrouter' : 'local')
          }
          executionStatusLabel={executionStatusLabel}
          firstApprovalButtonRef={firstApprovalButtonRef}
          formatSessionId={formatTraceId}
          isStorageReady={isStorageReady}
          messageListRef={messageListRef}
          messages={messages}
          onCancel={cancelExecution}
          onClose={() => setChatOpen(false)}
          onExecutePrompt={executePrompt}
          onExecuteQuickTool={(call) => executeQuickTool(call)}
          onGrantFolderAccess={() => void handleGrantFolderAccess()}
          onOpenSettings={() => setShowSettings(true)}
          onOpenSimulation={() => setSimulationOpen(true)}
          onPromptChange={setPrompt}
          onReconnectFolder={() => void handleOpenFolder()}
          onRefreshPreview={refreshPreview}
          onResolveApproval={(id, decision) =>
            resolveToolApproval(id, decision)
          }
          pendingApprovals={pendingApprovals}
          prompt={prompt}
          promptRecipes={standaloneToolChainRecipes}
          running={running}
        />
      ) : null}
      <button
        aria-controls="agent-chat-panel"
        aria-expanded={chatOpen}
        aria-label={chatOpen ? 'Close agent chat panel' : 'Open agent chat'}
        className={`chat-bubble ${chatOpen ? 'chat-bubble-open' : ''}`}
        onClick={() => setChatOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true" className="chat-bubble-icon">
          {chatOpen ? '×' : '✦'}
        </span>
        <span>{chatOpen ? 'Close' : 'Chat'}</span>
        {pendingApprovals.length ? (
          <span className="chat-bubble-count">{pendingApprovals.length}</span>
        ) : running ? (
          <span aria-label="Agent is running" className="chat-bubble-running" />
        ) : null}
      </button>
      {simulationOpen ? (
        <ToolChainSimulationPanel
          isStorageReady={isStorageReady}
          onClose={() => setSimulationOpen(false)}
          onReset={resetSimulation}
          onRun={() => void runSnapshot(standaloneToolChainSimulationSnapshot)}
          snapshot={standaloneToolChainSimulationSnapshot}
          state={simulationState}
          workspaceRevision={snapshot.revision}
        />
      ) : null}
      {selectedDiffVersion ? (
        <VersionDiffDialog
          onClose={() => setDiffVersionId(null)}
          previousVersion={previousDiffVersion}
          version={selectedDiffVersion}
        />
      ) : null}

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
