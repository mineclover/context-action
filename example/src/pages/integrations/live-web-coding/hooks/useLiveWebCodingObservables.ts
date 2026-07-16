import { useSyncExternalStore } from 'react';
import type { LiveEditorDocumentManager } from '../../../../lib/live-code-editor-bridge';
import type { LiveEditorWorkspaceManager } from '../../../../lib/live-code-editor-workspace';
import {
  type LiveWebCodingTraceEntry,
  liveWebCodingTraceStore,
} from '../../../../lib/live-web-coding-trace';

export function useLiveWebCodingObservables({
  manager,
  documentManager,
}: {
  manager: LiveEditorWorkspaceManager;
  documentManager: LiveEditorDocumentManager;
}) {
  const trace = useSyncExternalStore(
    liveWebCodingTraceStore.subscribe,
    liveWebCodingTraceStore.getSnapshot,
    liveWebCodingTraceStore.getSnapshot
  );
  const workspace = useSyncExternalStore(
    (listener) => manager.subscribe(() => listener()),
    manager.getSnapshot,
    manager.getSnapshot
  );
  const document = useSyncExternalStore(
    (listener) => documentManager.subscribe(() => listener()),
    documentManager.getSnapshot,
    documentManager.getSnapshot
  );

  return {
    trace: trace as readonly LiveWebCodingTraceEntry[],
    workspace,
    document,
  };
}
