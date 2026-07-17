import { useSyncExternalStore } from 'react';
import { liveEditorToolApprovalStore } from '../../../../lib/live-editor-tool-approval';

export function useLiveEditorToolApprovalObservables() {
  const pendingApprovals = useSyncExternalStore(
    liveEditorToolApprovalStore.subscribe,
    liveEditorToolApprovalStore.getSnapshot,
    liveEditorToolApprovalStore.getSnapshot
  );

  return { pendingApprovals };
}
