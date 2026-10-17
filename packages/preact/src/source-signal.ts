/**
 * @module source-signal
 *
 * Purpose:
 *   Bridges any snapshot-based `ReadableSource<T>` into a Preact `ReadonlySignal<T>`
 *   managed by an explicit, deterministic `SignalConnection<T>` lifecycle.
 *
 * Invariants:
 *   - Reads `source.getSnapshot()` inside `untracked()` so external getter logic
 *     cannot accidentally capture ambient Preact signal tracking contexts.
 *   - Closes the read-to-subscribe race window by re-reading immediately after
 *     `source.subscribe(refresh)` and rolling back subscription on error.
 *   - `dispose()` is idempotent and permanently silences subsequent notifications.
 */
import { computed, signal, untracked } from '@preact/signals';
import type { ReadonlySignal } from '@preact/signals';

/** Immutable, cached snapshots; notifications are synchronous invalidations. */
export interface ReadableSource<T> {
  getSnapshot(): T;
  subscribe(notify: () => void): () => void;
}

export interface SignalConnection<T> {
  readonly signal: ReadonlySignal<T>;
  readonly disposed: boolean;
  dispose(): void;
}

/** Connect outside render, then dispose with the owning UI/session. */
export function connectSourceSignal<T>(source: ReadableSource<T>): SignalConnection<T> {
  let disposed = false;
  const current = signal(untracked(() => source.getSnapshot()));
  const value = computed(() => current.value);
  const refresh = () => {
    if (!disposed) current.value = untracked(() => source.getSnapshot());
  };
  const unsubscribe = source.subscribe(refresh);

  // Close the read/subscribe gap, including sources which notify during subscribe.
  try {
    refresh();
  } catch (error) {
    disposed = true;
    try {
      unsubscribe();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'Source connection failed');
    }
    throw error;
  }

  return {
    signal: value,
    get disposed() { return disposed; },
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribe();
    },
  };
}
