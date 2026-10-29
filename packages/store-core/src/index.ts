/**
 * Framework-neutral state contracts and a deliberately small reference store.
 *
 * This package owns no immutable-update, draft, clone, React, or DOM runtime.
 * A backend owns its value semantics; consumers must only rely on the
 * snapshot/subscription and capability contracts below.
 */

import type { ReadonlyStateSnapshot, StateBackend } from './contracts';
export type {
  StateMutationOrigin, StateMutationMeta, StatePatch, HistoryEntryId,
  StateSnapshot, ReadonlyStateSnapshot, StateReader, StateWriter, StateBackend,
  TimelineBackend, TransactionBatchControl, TransactionBackend, StateTransition,
} from './contracts';
export type {
  TransactionParticipantBackend, TransactionMeta, TransactionOptions,
  TransactionParticipant, TransactionHandle, TransactionCoordinatorPort,
} from './transaction-contracts';

export interface StateStoreOptions {
  readonly now?: () => number;
}

/**
 * A trusted-reference backend for applications that already own immutability.
 * No clone, freeze, draft, or patch generation is performed.
 */
export function createStateStore<T>(
  name: string,
  initialValue: T,
  options: StateStoreOptions = {},
): StateBackend<T> {
  const now = options.now ?? Date.now;
  let value = initialValue;
  let version = 0;
  let disposed = false;
  let snapshot: ReadonlyStateSnapshot<T> = { value, name, version, lastUpdate: now() };
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch {
        // A subscriber cannot prevent other subscribers from observing a commit.
      }
    }
  };

  const publish = (next: T): void => {
    if (disposed || Object.is(value, next)) return;
    // Resolve the timestamp before mutating the backend.  A caller-provided
    // clock is part of the store boundary and may throw (for example, when a
    // deterministic test clock is exhausted); a failed timestamp must not
    // leave the value and snapshot out of sync.
    const updatedAt = now();
    value = next;
    version += 1;
    snapshot = { value, name, version, lastUpdate: updatedAt };
    notify();
  };

  const backend: StateBackend<T> = {
    name,
    capabilities: { patches: false, timeline: false, immutableSnapshots: false },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('Store subscriber must be a function.');
      }
      if (disposed) return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setValue(next) {
      publish(next);
    },
    update(updater) {
      if (disposed) return;
      const next = updater(value);
      if (next !== undefined) publish(next);
    },
    isDisposed: () => disposed,
    dispose() {
      if (disposed) return;
      disposed = true;
      listeners.clear();
    },
  };
  return backend;
}
