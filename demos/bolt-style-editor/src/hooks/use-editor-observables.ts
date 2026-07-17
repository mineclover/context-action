import { useMemo, useSyncExternalStore } from 'react';
import type { PendingToolApproval } from '../tool-approval';
import { toolApprovalStore } from '../tool-approval';
import { type ToolTraceEntry, toolTraceStore } from '../tool-trace';
import type { BrowserWorkspace, WorkspaceSnapshot } from '../workspace';
import type { WorkspaceFileSystemAdapter } from '../workspace-filesystem';

export type EditorObservables = {
  snapshot: WorkspaceSnapshot;
  workspaceDirtyPaths: readonly string[];
  deletedPaths: readonly string[];
  canUndo: boolean;
  canRedo: boolean;
  traceEntries: readonly ToolTraceEntry[];
  pendingApprovals: readonly PendingToolApproval[];
  hasWritableFolder: boolean;
  folderPermission: WorkspaceFileSystemAdapter['folderPermission'];
};

export function useEditorObservables({
  workspace,
  fileSystemAdapter,
}: {
  workspace: BrowserWorkspace;
  fileSystemAdapter: WorkspaceFileSystemAdapter;
}): EditorObservables {
  const snapshot = useSyncExternalStore(
    workspace.subscribe,
    workspace.getSnapshot,
    workspace.getSnapshot
  );
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
  const workspaceDirtyPaths = useMemo(
    () => workspace.getDirtyFiles().map((file) => file.path),
    [snapshot, workspace]
  );
  const deletedPaths = useMemo(
    () => workspace.getDeletedPaths(),
    [snapshot, workspace]
  );
  const canUndo = useMemo(() => workspace.canUndo(), [snapshot, workspace]);
  const canRedo = useMemo(() => workspace.canRedo(), [snapshot, workspace]);

  return {
    snapshot,
    workspaceDirtyPaths,
    deletedPaths,
    canUndo,
    canRedo,
    traceEntries,
    pendingApprovals,
    hasWritableFolder,
    folderPermission,
  };
}
