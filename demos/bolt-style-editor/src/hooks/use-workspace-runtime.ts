import { useCallback, useEffect, useState } from 'react';
import { BrowserWorkspace } from '../workspace';
import {
  BrowserWorkspaceFileSystemAdapter,
  type WorkspaceFileSystemAdapter,
} from '../workspace-filesystem';
import { WebCodingWorkspaceRepository } from '../workspace-storage';

export type FolderRestoreState =
  | 'idle'
  | 'restoring'
  | 'restored'
  | 'unavailable';

export type WorkspaceRuntime = {
  workspace: BrowserWorkspace;
  fileSystemAdapter: WorkspaceFileSystemAdapter;
  folderRestoreState: FolderRestoreState;
  previewRefreshToken: number;
  requestPreviewRefresh: () => void;
};

/** Owns browser workspace hydration and the persisted local-folder boundary. */
export function useWorkspaceRuntime(): WorkspaceRuntime {
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
            setFolderRestoreState('idle');
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

  return {
    workspace,
    fileSystemAdapter,
    folderRestoreState,
    previewRefreshToken,
    requestPreviewRefresh,
  };
}
