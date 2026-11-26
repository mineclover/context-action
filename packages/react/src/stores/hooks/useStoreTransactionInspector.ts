import { useCallback, useDebugValue, useSyncExternalStore } from 'react';
import type {
  StoreTransactionCoordinator,
  StoreTransactionInspectorSnapshot,
} from '../core/StoreTransactionCoordinator';

function formatTransactionInspectorDebugValue(
  snapshot: StoreTransactionInspectorSnapshot,
): string {
  return `v${snapshot.version} ${snapshot.position}/${snapshot.historyLength} (undo=${snapshot.canUndo}, redo=${snapshot.canRedo})`;
}

/** React subscription boundary for DevTools/audit transaction metadata. */
export function useStoreTransactionInspector(
  coordinator: StoreTransactionCoordinator,
): StoreTransactionInspectorSnapshot {
  const subscribe = useCallback(
    (callback: () => void) => coordinator.subscribe(() => callback()),
    [coordinator],
  );
  const getSnapshot = useCallback(
    () => coordinator.getInspectorSnapshot(),
    [coordinator],
  );
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useDebugValue(snapshot, formatTransactionInspectorDebugValue);
  return snapshot;
}
