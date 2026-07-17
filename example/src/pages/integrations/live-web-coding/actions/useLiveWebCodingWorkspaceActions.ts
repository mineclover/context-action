import { useCallback, useEffect, useState } from 'react';
import type { LiveEditorDocument } from '../../../../lib/live-code-editor-bridge';
import type { WorkspaceBlobFile } from '../../../../lib/live-code-editor-filesystem';
import type { LiveEditorWorkspaceRepository } from '../../../../lib/live-code-editor-storage';
import type {
  LiveEditorWorkspaceFile,
  LiveEditorWorkspaceManager,
} from '../../../../lib/live-code-editor-workspace';

export function useLiveWebCodingWorkspaceActions({
  manager,
  updateDocument,
  repository,
  workspaceId,
  rootName,
  seedFiles,
  createResetFiles,
  entryPath,
  exampleId,
  onResetConversation,
  onClearTrace,
}: {
  manager: LiveEditorWorkspaceManager;
  updateDocument: (patch: Partial<LiveEditorDocument>) => void;
  repository: LiveEditorWorkspaceRepository;
  workspaceId: string;
  rootName: string;
  seedFiles: readonly LiveEditorWorkspaceFile[];
  createResetFiles: () => readonly WorkspaceBlobFile[];
  entryPath: string;
  exampleId: string;
  onResetConversation: () => void;
  onClearTrace: () => void;
}) {
  const [status, setStatus] = useState('IndexedDB workspace loading…');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void repository
      .ensureWorkspace(workspaceId, seedFiles, rootName)
      .then((persisted) => {
        if (!active) return;
        manager.replaceFiles(persisted.files, {
          rootName: persisted.metadata.rootName,
          storageMode: 'indexed-db',
          activePath: persisted.metadata.activePath || entryPath,
        });
        const entry = persisted.files.find((file) => file.path === entryPath);
        if (entry) {
          updateDocument({
            file: entryPath,
            source: entry.source,
            exampleId,
          });
        }
        setError('');
        setStatus(`${persisted.files.length} files persisted · iframe ready`);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Workspace load failed.'
        );
      });
    return () => {
      active = false;
    };
  }, [
    entryPath,
    exampleId,
    manager,
    repository,
    rootName,
    seedFiles,
    updateDocument,
    workspaceId,
  ]);

  const selectFile = useCallback(
    (path: string) => {
      const file = manager
        .getSnapshot()
        .files.find((candidate) => candidate.path === path);
      if (!file?.isText) return;
      manager.setActivePath(path);
      updateDocument({ file: path, source: file.source });
    },
    [manager, updateDocument]
  );

  const reset = useCallback(async () => {
    if (isResetting || manager.getSnapshot().storageMode !== 'indexed-db') {
      return;
    }

    setIsResetting(true);
    setError('');
    try {
      const persisted = await repository.replaceWorkspace(
        workspaceId,
        createResetFiles(),
        { rootName }
      );
      manager.replaceFiles(persisted.files, {
        rootName: persisted.metadata.rootName,
        storageMode: 'indexed-db',
        activePath: entryPath,
      });
      const entry = persisted.files.find((file) => file.path === entryPath);
      if (entry) {
        updateDocument({
          file: entry.path,
          source: entry.source,
          exampleId,
          scenario: 'success',
        });
      }
      onClearTrace();
      onResetConversation();
      setStatus(`${persisted.files.length} demo files restored · iframe ready`);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : 'Demo workspace reset failed.'
      );
    } finally {
      setIsResetting(false);
    }
  }, [
    createResetFiles,
    entryPath,
    exampleId,
    isResetting,
    manager,
    onClearTrace,
    onResetConversation,
    repository,
    rootName,
    updateDocument,
    workspaceId,
  ]);

  return {
    status,
    isResetting,
    error,
    canReset:
      !isResetting && manager.getSnapshot().storageMode === 'indexed-db',
    commands: { selectFile, reset },
  };
}
