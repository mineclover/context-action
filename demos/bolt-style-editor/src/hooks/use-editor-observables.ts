import { useSyncExternalStore } from 'react';
import type { PendingToolApproval } from '../tool-approval';
import { toolApprovalStore } from '../tool-approval';
import { type ToolTraceEntry, toolTraceStore } from '../tool-trace';
import type { BrowserWorkspace, WorkspaceSnapshot } from '../workspace';
import type { BrowserWorkspaceFileSystemAdapter } from '../workspace-filesystem';

export type EditorObservables = {
  snapshot: WorkspaceSnapshot;
  traceEntries: readonly ToolTraceEntry[];
  pendingApprovals: readonly PendingToolApproval[];
  hasWritableFolder: boolean;
  folderPermission: BrowserWorkspaceFileSystemAdapter['folderPermission'];
};

export function useEditorObservables({
  workspace,
  fileSystemAdapter,
}: {
  workspace: BrowserWorkspace;
  fileSystemAdapter: BrowserWorkspaceFileSystemAdapter;
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

  return {
    snapshot,
    traceEntries,
    pendingApprovals,
    hasWritableFolder,
    folderPermission,
  };
}
