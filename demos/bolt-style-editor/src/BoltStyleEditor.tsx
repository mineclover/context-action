import {
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
import { usePreviewBridge } from './hooks/use-preview-bridge';
import { useStudioExportActions } from './hooks/use-studio-export-actions';
import { useToolCatalogActions } from './hooks/use-tool-catalog-actions';
import { useToolCatalogModel } from './hooks/use-tool-catalog-model';
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
import { resolveToolApproval } from './tool-approval';
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
import { PreviewPanel } from './views/preview-panel';
import { StudioStatusBar, StudioTopbar } from './views/studio-chrome';
import {
  type ToolCatalogFilter,
  ToolCatalogPanel,
} from './views/tool-catalog-panel';
import { ToolTracePanel } from './views/tool-trace-panel';
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorTabsRef = useRef<HTMLDivElement>(null);
  const workspaceSearchTriggerRef = useRef<HTMLButtonElement>(null);
  usePreviewBridge({
    workspace,
    iframeRef,
    revision: snapshot.revision,
  });
  const [prompt, setPrompt] = useState('');
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
  } = useStudioExportActions({
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
