import { useCallback, useSyncExternalStore } from 'react';
import type {
  StoreTransactionCoordinator,
  StoreTransactionInspectorSnapshot,
} from '../core/StoreTransactionCoordinator';

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
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
