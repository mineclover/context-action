import { useSyncExternalStore } from 'react';
import type {
  StoreTransactionCoordinator,
  StoreTransactionInspectorSnapshot,
} from '../core/StoreTransactionCoordinator';

/** React subscription boundary for DevTools/audit transaction metadata. */
export function useStoreTransactionInspector(
  coordinator: StoreTransactionCoordinator,
): StoreTransactionInspectorSnapshot {
  return useSyncExternalStore(
    callback => coordinator.subscribe(() => callback()),
    () => coordinator.getInspectorSnapshot(),
    () => coordinator.getInspectorSnapshot(),
  );
}
