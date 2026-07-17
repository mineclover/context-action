import { useSyncExternalStore } from 'react';
import type {
  LiveEditorDocumentManager,
  LiveEditorDocumentSnapshot,
} from '../../../../lib/live-code-editor-bridge';
import type {
  LiveEditorWorkspaceManager,
  LiveEditorWorkspaceSnapshot,
} from '../../../../lib/live-code-editor-workspace';

interface LiveEditorWorkspaceObservableSources {
  workspaceManager: LiveEditorWorkspaceManager;
  documentManager: LiveEditorDocumentManager;
}

export function useLiveEditorWorkspaceObservables({
  workspaceManager,
  documentManager,
}: LiveEditorWorkspaceObservableSources): {
  workspace: LiveEditorWorkspaceSnapshot;
  document: LiveEditorDocumentSnapshot;
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

  return { workspace, document };
}
