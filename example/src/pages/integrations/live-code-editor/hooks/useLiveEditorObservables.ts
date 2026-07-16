import { useSyncExternalStore } from 'react';
import {
  type LiveEditorTraceEntry,
  liveEditorTraceStore,
} from '../../../../lib/live-editor-trace';

export function useLiveEditorTrace(): readonly LiveEditorTraceEntry[] {
  return useSyncExternalStore(
    liveEditorTraceStore.subscribe,
    liveEditorTraceStore.getSnapshot,
    liveEditorTraceStore.getSnapshot
  );
}
