import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { LiveEditorDocumentManager } from '../../../../lib/live-code-editor-bridge';
import {
  type WorkspaceBlobFile,
  type WorkspaceFileSystemAdapter,
} from '../../../../lib/live-code-editor-filesystem';
import {
  LIVE_EDITOR_WORKSPACE_ID,
  LiveEditorWorkspaceRepository,
} from '../../../../lib/live-code-editor-storage';
import type {
  LiveEditorWorkspaceFile,
  LiveEditorWorkspaceManager,
  LiveEditorWorkspaceSnapshot,
} from '../../../../lib/live-code-editor-workspace';

interface LiveEditorWorkspaceActionOptions {
  workspaceManager: LiveEditorWorkspaceManager;
  documentManager: LiveEditorDocumentManager;
  workspaceRepository: LiveEditorWorkspaceRepository;
  filesystemAdapter: WorkspaceFileSystemAdapter;
  workspaceSnapshot: LiveEditorWorkspaceSnapshot;
  isShowcaseWorkspace: boolean;
  workspaceRoot: string;
  seedFiles: readonly LiveEditorWorkspaceFile[];
  createResetFiles: () => readonly WorkspaceBlobFile[];
  findEntryPath: (
    files: readonly { path: string }[],
    storageMode: 'memory' | 'indexed-db'
  ) => string | undefined;
  getExampleIdForPath: (path: string) => string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useLiveEditorWorkspaceActions({
  workspaceManager,
  documentManager,
  workspaceRepository,
  filesystemAdapter,
  workspaceSnapshot,
  isShowcaseWorkspace,
  workspaceRoot,
  seedFiles,
  createResetFiles,
  findEntryPath,
  getExampleIdForPath,
}: LiveEditorWorkspaceActionOptions) {
  const [workspaceMessage, setWorkspaceMessage] = useState(
    'Loading IndexedDB workspace…'
  );
  const [isResetting, setIsResetting] = useState(false);
  const pendingPersistenceRef = useRef<{
    path: string;
    source: string;
    mimeType?: string;
  } | null>(null);
  const persistenceTimerRef = useRef<number | null>(null);
  const persistenceQueueRef = useRef<Promise<void>>(Promise.resolve());

  const enqueueTextPersistence = useCallback(
    (pending: { path: string; source: string; mimeType?: string }) => {
      persistenceQueueRef.current = persistenceQueueRef.current
        .catch(() => undefined)
        .then(() =>
          workspaceRepository.saveTextFile(
            LIVE_EDITOR_WORKSPACE_ID,
            pending.path,
            pending.source,
            pending.mimeType
          )
        )
        .catch((error: unknown) => {
          const current = documentManager.getSnapshot();
          if (
            current.file === pending.path &&
            current.source === pending.source
          ) {
            setWorkspaceMessage(
              error instanceof Error
                ? `IndexedDB save failed: ${error.message}`
                : 'IndexedDB save failed.'
            );
          }
        });
      return persistenceQueueRef.current;
    },
    [documentManager, workspaceRepository]
  );

  const scheduleTextPersistence = useCallback(
    (pending: { path: string; source: string; mimeType?: string }) => {
      pendingPersistenceRef.current = pending;
      if (persistenceTimerRef.current !== null) {
        window.clearTimeout(persistenceTimerRef.current);
      }
      persistenceTimerRef.current = window.setTimeout(() => {
        persistenceTimerRef.current = null;
        const nextPending = pendingPersistenceRef.current;
        pendingPersistenceRef.current = null;
        if (nextPending) void enqueueTextPersistence(nextPending);
      }, 220);
    },
    [enqueueTextPersistence]
  );

  const flushPendingPersistence = useCallback(async () => {
    if (persistenceTimerRef.current !== null) {
      window.clearTimeout(persistenceTimerRef.current);
      persistenceTimerRef.current = null;
    }
    const pending = pendingPersistenceRef.current;
    pendingPersistenceRef.current = null;
    if (pending) await enqueueTextPersistence(pending);
    await persistenceQueueRef.current;
  }, [enqueueTextPersistence]);

  useEffect(() => {
    let cancelled = false;
    void workspaceRepository
      .ensureWorkspace(LIVE_EDITOR_WORKSPACE_ID, seedFiles, workspaceRoot)
      .then((persisted) => {
        if (cancelled) return;
        workspaceManager.replaceFiles(persisted.files, {
          rootName: persisted.metadata.rootName,
          storageMode: 'indexed-db',
          activePath: persisted.metadata.activePath,
        });
        setWorkspaceMessage(
          `${persisted.metadata.rootName} · ${persisted.files.length} files persisted · IndexedDB auto-save`
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setWorkspaceMessage(
          getErrorMessage(error, 'IndexedDB workspace could not be opened.')
        );
      });
    return () => {
      cancelled = true;
    };
  }, [seedFiles, workspaceManager, workspaceRepository, workspaceRoot]);

  useEffect(
    () => () => {
      void flushPendingPersistence();
    },
    [flushPendingPersistence]
  );

  useEffect(() => {
    if (
      !filesystemAdapter.isWritable ||
      workspaceSnapshot.dirtyPaths.length === 0
    ) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [filesystemAdapter, workspaceSnapshot.dirtyPaths.length]);

  useEffect(() => {
    const unsubscribe = documentManager.subscribe((snapshot) => {
      const file = workspaceManager
        .getSnapshot()
        .files.find((candidate) => candidate.path === snapshot.file);
      if (!file || file.source !== snapshot.source) {
        workspaceManager.updateFile(snapshot.file, snapshot.source);
        scheduleTextPersistence({
          path: snapshot.file,
          source: snapshot.source,
          ...(file?.mimeType ? { mimeType: file.mimeType } : {}),
        });
      }
    });
    return unsubscribe;
  }, [documentManager, scheduleTextPersistence, workspaceManager]);

  useEffect(() => {
    const activeFile = workspaceSnapshot.files.find(
      (file) => file.path === workspaceSnapshot.activePath
    );
    if (!activeFile) return;
    const snapshot = documentManager.getSnapshot();
    const nextExampleId = getExampleIdForPath(activeFile.path);
    if (
      snapshot.file !== activeFile.path ||
      snapshot.source !== activeFile.source ||
      snapshot.exampleId !== nextExampleId
    ) {
      documentManager.update({
        exampleId: nextExampleId,
        file: activeFile.path,
        source: activeFile.source,
      });
    }
    if (workspaceSnapshot.storageMode === 'indexed-db') {
      void workspaceRepository.setActivePath(
        LIVE_EDITOR_WORKSPACE_ID,
        activeFile.path
      );
    }
  }, [
    documentManager,
    getExampleIdForPath,
    workspaceRepository,
    workspaceSnapshot,
  ]);

  const importWorkspace = useCallback(
    async (result: {
      readonly files: readonly WorkspaceBlobFile[];
      readonly rootName: string;
    }) => {
      const persisted = await workspaceRepository.replaceWorkspace(
        LIVE_EDITOR_WORKSPACE_ID,
        result.files,
        { rootName: result.rootName, kind: 'filesystem' }
      );
      workspaceManager.replaceFiles(persisted.files, {
        rootName: persisted.metadata.rootName,
        activePath: persisted.metadata.activePath,
        storageMode: 'indexed-db',
      });
      const entryPath = findEntryPath(persisted.files, 'indexed-db');
      setWorkspaceMessage(
        `${persisted.metadata.rootName} imported · ${persisted.files.length} files${
          entryPath ? ` · ${entryPath} ready` : ''
        } · folder writable`
      );
    },
    [findEntryPath, workspaceManager, workspaceRepository]
  );

  const openWorkspace = useCallback(async () => {
    try {
      await flushPendingPersistence();
      const result = await filesystemAdapter.openDirectory();
      await importWorkspace(result);
      return true;
    } catch (error) {
      setWorkspaceMessage(
        getErrorMessage(error, 'Workspace could not be opened.')
      );
      return false;
    }
  }, [filesystemAdapter, flushPendingPersistence, importWorkspace]);

  const handleDirectoryInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.currentTarget.files ?? []);
      event.currentTarget.value = '';
      if (files.length === 0) return false;
      try {
        await flushPendingPersistence();
        const result = await filesystemAdapter.openFileList(files);
        await importWorkspace(result);
        return true;
      } catch (error) {
        setWorkspaceMessage(
          getErrorMessage(error, 'Workspace could not be imported.')
        );
        return false;
      }
    },
    [filesystemAdapter, flushPendingPersistence, importWorkspace]
  );

  const requestResetWorkspace = useCallback(
    () =>
      isShowcaseWorkspace &&
      workspaceSnapshot.storageMode === 'indexed-db' &&
      !isResetting,
    [isResetting, isShowcaseWorkspace, workspaceSnapshot.storageMode]
  );

  const resetWorkspace = useCallback(async () => {
    if (!requestResetWorkspace()) return false;
    setIsResetting(true);
    try {
      await flushPendingPersistence();
      const persisted = await workspaceRepository.replaceWorkspace(
        LIVE_EDITOR_WORKSPACE_ID,
        createResetFiles(),
        { rootName: workspaceRoot, kind: 'showcase' }
      );
      workspaceManager.replaceFiles(persisted.files, {
        rootName: persisted.metadata.rootName,
        activePath: persisted.metadata.activePath,
        storageMode: 'indexed-db',
      });
      const entryPath = persisted.metadata.activePath;
      const entryFile = persisted.files.find((file) => file.path === entryPath);
      if (entryFile) {
        documentManager.update({
          exampleId: getExampleIdForPath(entryFile.path),
          file: entryFile.path,
          source: entryFile.source,
          scenario: 'success',
        });
      }
      setWorkspaceMessage(
        `${persisted.metadata.rootName} restored · ${persisted.files.length} example files · IndexedDB auto-save`
      );
      return true;
    } catch (error) {
      setWorkspaceMessage(
        getErrorMessage(error, 'Showcase workspace could not be restored.')
      );
      return false;
    } finally {
      setIsResetting(false);
    }
  }, [
    createResetFiles,
    documentManager,
    flushPendingPersistence,
    getExampleIdForPath,
    requestResetWorkspace,
    workspaceManager,
    workspaceRepository,
    workspaceRoot,
  ]);

  const selectPath = useCallback(
    (path: string) => workspaceManager.setActivePath(path),
    [workspaceManager]
  );

  const saveWorkspaceFile = useCallback(async () => {
    const activeFile = workspaceManager.getActiveFile();
    if (!activeFile?.isText) {
      setWorkspaceMessage('Binary files cannot be edited or saved here.');
      return false;
    }
    if (!filesystemAdapter.isWritable) {
      setWorkspaceMessage(
        `${activeFile.path} is already saved in IndexedDB · open a folder to write it back`
      );
      return false;
    }
    try {
      await flushPendingPersistence();
      const blob = new Blob([activeFile.source], { type: activeFile.mimeType });
      await workspaceRepository.saveTextFile(
        LIVE_EDITOR_WORKSPACE_ID,
        activeFile.path,
        activeFile.source,
        activeFile.mimeType
      );
      await filesystemAdapter.saveFile(activeFile.path, blob);
      const latestFile = workspaceManager.getActiveFile();
      if (latestFile?.source === activeFile.source) {
        workspaceManager.markSaved(activeFile.path, activeFile.source);
        setWorkspaceMessage(`${activeFile.path} saved to filesystem`);
      } else {
        setWorkspaceMessage(
          `${activeFile.path} was written, but newer editor changes remain pending`
        );
      }
      return true;
    } catch (error) {
      setWorkspaceMessage(getErrorMessage(error, 'File could not be saved.'));
      return false;
    }
  }, [
    filesystemAdapter,
    flushPendingPersistence,
    workspaceManager,
    workspaceRepository,
  ]);

  const saveAllWorkspaceFiles = useCallback(async () => {
    if (!filesystemAdapter.isWritable) {
      setWorkspaceMessage(
        'No writable folder is open. Open a local folder before saving files.'
      );
      return false;
    }

    const initialSnapshot = workspaceManager.getSnapshot();
    const dirtyFiles = initialSnapshot.files.filter(
      (file) => initialSnapshot.dirtyPaths.includes(file.path) && file.isText
    );
    if (dirtyFiles.length === 0) {
      setWorkspaceMessage('No unsaved text files are pending for the folder.');
      return false;
    }

    const savedPaths: string[] = [];
    try {
      await flushPendingPersistence();
      for (const file of dirtyFiles) {
        const latestFile = workspaceManager
          .getSnapshot()
          .files.find((candidate) => candidate.path === file.path);
        if (!latestFile?.isText) continue;
        await workspaceRepository.saveTextFile(
          LIVE_EDITOR_WORKSPACE_ID,
          latestFile.path,
          latestFile.source,
          latestFile.mimeType
        );
        await filesystemAdapter.saveFile(
          latestFile.path,
          new Blob([latestFile.source], { type: latestFile.mimeType })
        );
        const currentFile = workspaceManager
          .getSnapshot()
          .files.find((candidate) => candidate.path === latestFile.path);
        if (currentFile?.source === latestFile.source) {
          workspaceManager.markSaved(latestFile.path, latestFile.source);
          savedPaths.push(latestFile.path);
        }
      }
      const remaining = workspaceManager.getSnapshot().dirtyPaths;
      setWorkspaceMessage(
        `${savedPaths.length} file${savedPaths.length === 1 ? '' : 's'} saved to filesystem${
          remaining.length ? ` · ${remaining.length} still pending` : ''
        }`
      );
      return true;
    } catch (error) {
      const remaining = workspaceManager.getSnapshot().dirtyPaths;
      setWorkspaceMessage(
        `${savedPaths.length} file${savedPaths.length === 1 ? '' : 's'} saved before failure${
          remaining.length ? ` · ${remaining.length} still pending` : ''
        } · ${getErrorMessage(error, 'File could not be saved.')}`
      );
      return false;
    }
  }, [
    filesystemAdapter,
    flushPendingPersistence,
    workspaceManager,
    workspaceRepository,
  ]);

  const reconcileRecoveredPaths = useCallback(
    (paths: readonly string[]) => {
      for (const path of paths) {
        const file = workspaceManager
          .getSnapshot()
          .files.find((candidate) => candidate.path === path);
        workspaceManager.markSaved(path, file?.source);
      }
    },
    [workspaceManager]
  );

  const activeFile = workspaceSnapshot.files.find(
    (file) => file.path === workspaceSnapshot.activePath
  );

  return {
    activeFile,
    workspaceMessage,
    isResetting,
    commands: {
      openWorkspace,
      handleDirectoryInputChange,
      requestResetWorkspace,
      resetWorkspace,
      selectPath,
      saveWorkspaceFile,
      saveAllWorkspaceFiles,
      reconcileRecoveredPaths,
      flushPendingPersistence,
    },
  };
}
