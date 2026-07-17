import { useSyncExternalStore } from 'react';
import type {
  LiveEditorDocumentManager,
  LiveEditorDocumentSnapshot,
} from '../../../../lib/live-code-editor-bridge';
import type { WorkspaceFileSystemAdapter } from '../../../../lib/live-code-editor-filesystem';
import type {
  LiveEditorWorkspaceManager,
  LiveEditorWorkspaceSnapshot,
} from '../../../../lib/live-code-editor-workspace';

interface LiveEditorWorkspaceObservableSources {
  workspaceManager: LiveEditorWorkspaceManager;
  documentManager: LiveEditorDocumentManager;
  filesystemAdapter: WorkspaceFileSystemAdapter;
}

export function useLiveEditorWorkspaceObservables({
  workspaceManager,
  documentManager,
  filesystemAdapter,
}: LiveEditorWorkspaceObservableSources): {
  workspace: LiveEditorWorkspaceSnapshot;
  document: LiveEditorDocumentSnapshot;
  filesystem: {
    isSupported: boolean;
    isWritable: boolean;
    supportsDirectoryPicker: boolean;
  };
} {
  const workspace = useSyncExternalStore(
    workspaceManager.subscribe,
    workspaceManager.getSnapshot,
    workspaceManager.getSnapshot
  );
  const document = useSyncExternalStore(
    documentManager.subscribe,
    documentManager.getSnapshot,
    documentManager.getSnapshot
  );
  const isWritable = useSyncExternalStore(
    filesystemAdapter.subscribe,
    () => filesystemAdapter.isWritable,
    () => false
  );

  return {
    workspace,
    document,
    filesystem: {
      isSupported: filesystemAdapter.isSupported,
      isWritable,
      supportsDirectoryPicker: filesystemAdapter.supportsDirectoryPicker,
    },
  };
}
