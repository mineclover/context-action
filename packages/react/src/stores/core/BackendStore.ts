import type { StateBackend, StateMutationMeta, StatePatch } from '@context-action/store-core';
import { ErrorHandlers } from '../utils/error-handling';
import type { IStore, Listener, Snapshot, StoreSetValueOptions, Unsubscribe } from './types';

export type BackendPatchListener<Patch = StatePatch> = (patches: readonly Patch[] | null) => void;

interface PendingPatchNotification<Patch> {
  patches: readonly Patch[] | null;
  resolved: boolean;
}

export interface BackendStoreOptions {
  /** Shared backends remain alive when this wrapper is disposed (default). */
  readonly ownership?: 'shared' | 'owned';
}

export type BackendStoreSetValueOptions<T> = StoreSetValueOptions<T> & {
  /** Mutation metadata is explicit so event/clone options are not misrouted. */
  readonly meta?: StateMutationMeta;
};

/**
 * React-facing Store wrapper for a user-owned state backend.
 *
 * The backend owns immutability, cloning, patches, and persistence semantics.
 * This wrapper only supplies the IStore/useSyncExternalStore boundary.
 */
export class BackendStore<T = unknown, Patch = StatePatch> implements IStore<T> {
  public readonly name: string;
  private readonly backend: StateBackend<T, Patch>;
  private readonly ownership: 'shared' | 'owned';
  private readonly listeners = new Set<Listener>();
  private readonly patchListeners = new Set<BackendPatchListener<Patch>>();
  private readonly unsubscribeBackend: Unsubscribe;
  private readonly unsubscribeBackendPatches: Unsubscribe;
  private backendSnapshot: ReturnType<StateBackend<T>['getSnapshot']>;
  // Keep the scalar snapshot contract separately from the object reference.
  // A user backend may reuse its snapshot object while incrementing `version`;
  // React still needs a fresh wrapper in that case.
  private backendSnapshotVersion: number;
  private backendSnapshotLastUpdate: number;
  private backendSnapshotValue: T;
  private snapshot: Snapshot<T>;
  private disposed = false;
  private lastPatches: readonly Patch[] | null = null;
  private readonly hasPatchChannel: boolean;
  private hasReadFallbackPatches = false;
  private lastFallbackPatches: readonly Patch[] | null = null;
  private readonly pendingPatchNotifications: PendingPatchNotification<Patch>[] = [];
  private readonly orphanPatchNotifications: Array<readonly Patch[] | null> = [];
  private orphanPatchFlushScheduled = false;
  private listenerDispatchDepth = 0;
  private patchFlushScheduled = false;

  constructor(name: string, backend: StateBackend<T, Patch>, options: BackendStoreOptions = {}) {
    this.name = name;
    this.backend = backend;
    this.ownership = options.ownership ?? 'shared';
    this.backendSnapshot = backend.getSnapshot();
    this.backendSnapshotVersion = this.backendSnapshot.version;
    this.backendSnapshotLastUpdate = this.backendSnapshot.lastUpdate;
    this.backendSnapshotValue = this.backendSnapshot.value;
    this.snapshot = this.toSnapshot(this.backendSnapshot);
    const subscribeWithPatches = backend.subscribeWithPatches;
    this.hasPatchChannel = typeof subscribeWithPatches === 'function';
    this.unsubscribeBackendPatches = typeof subscribeWithPatches === 'function'
      ? subscribeWithPatches.call(backend, (patches) => {
          this.capturePatchNotification(patches);
        })
      : (() => {});
    this.unsubscribeBackend = backend.subscribe(() => {
      if (this.disposed) return;
      let nextBackendSnapshot: ReturnType<StateBackend<T>['getSnapshot']>;
      try {
        nextBackendSnapshot = backend.getSnapshot();
      } catch (error) {
        // A malformed backend must not break an already published snapshot
        // or prevent unrelated React subscribers from receiving notifications.
        this.reportListenerError('Backend snapshot read error', error);
        return;
      }
      // Backends should replace snapshots, but accepting a reused object is a
      // useful compatibility guard for small user-owned adapters. Compare the
      // contract fields as well so a monotonically increasing version still
      // invalidates React when the backend mutates its snapshot in place.
      if (
        nextBackendSnapshot !== this.backendSnapshot ||
        nextBackendSnapshot.version !== this.backendSnapshotVersion ||
        nextBackendSnapshot.lastUpdate !== this.backendSnapshotLastUpdate ||
        !Object.is(nextBackendSnapshot.value, this.backendSnapshotValue)
      ) {
        this.backendSnapshot = nextBackendSnapshot;
        this.backendSnapshotVersion = nextBackendSnapshot.version;
        this.backendSnapshotLastUpdate = nextBackendSnapshot.lastUpdate;
        this.backendSnapshotValue = nextBackendSnapshot.value;
        this.snapshot = this.toSnapshot(nextBackendSnapshot);
      }
      let fallbackPatches: readonly Patch[] | null = null;
      if (!this.hasPatchChannel) {
        try {
          const candidate = backend.getLastPatches?.() ?? null;
          // A getLastPatches-only backend has no event channel. Treat a
          // repeated array reference as stale rather than replaying the prior
          // mutation for every subsequent patchless transition.
          if (!this.hasReadFallbackPatches || !Object.is(candidate, this.lastFallbackPatches)) {
            fallbackPatches = candidate;
          }
          this.lastFallbackPatches = candidate;
          this.hasReadFallbackPatches = true;
        } catch (error) {
          this.reportListenerError('Backend patch read error', error);
        }
      }
      const pendingPatchNotification: PendingPatchNotification<Patch> = {
        patches: fallbackPatches,
        // Without a patch channel, null is the authoritative full-invalidation
        // result and can be delivered synchronously for backwards compatibility.
        resolved: !this.hasPatchChannel,
      };
      // Some backends notify the regular channel before the patch channel,
      // while others do the reverse. Pair an already received patch with this
      // transition; otherwise the patch callback can resolve this entry before
      // the microtask flush below.
      if (this.orphanPatchNotifications.length > 0) {
        pendingPatchNotification.patches = this.orphanPatchNotifications.shift() ?? null;
        pendingPatchNotification.resolved = true;
      }
      this.pendingPatchNotifications.push(pendingPatchNotification);
      this.listenerDispatchDepth += 1;
      try {
        for (const listener of [...this.listeners]) {
          try {
            listener();
          } catch (error) {
            this.reportListenerError('Backend store listener error', error);
          }
        }
      } finally {
        this.listenerDispatchDepth -= 1;
      }
      if (pendingPatchNotification.resolved) {
        this.flushPatchNotifications(true);
      } else {
        this.schedulePatchFlush();
      }
    });
  }

  subscribe = (listener: Listener): Unsubscribe => {
    if (typeof listener !== 'function') {
      throw new TypeError('Store subscriber must be a function.');
    }
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  subscribeWithPatches = (listener: BackendPatchListener<Patch>): Unsubscribe => {
    if (typeof listener !== 'function') {
      throw new TypeError('Patch subscriber must be a function.');
    }
    if (this.disposed) return () => {};
    this.patchListeners.add(listener);
    return () => this.patchListeners.delete(listener);
  };

  getSnapshot = (): Snapshot<T> => this.snapshot;

  getValue = (): T => this.backendSnapshot.value;

  getSafeValue = (): T => {
    // Preserve intentional `null`/`undefined` values returned by a backend.
    // The fallback is only for backends that do not expose a safe-read hook.
    return this.backend.getSafeValue
      ? this.backend.getSafeValue()
      : this.backendSnapshot.value;
  };

  getLastPatches = (): readonly Patch[] | null => this.lastPatches;

  setValue = (value: T, options?: BackendStoreSetValueOptions<T>): void => {
    if (this.disposed) return;
    const meta = (options as BackendStoreSetValueOptions<T> | undefined)?.meta;
    this.backend.setValue(value, meta);
  };

  update = (updater: (current: T) => T | undefined, meta?: StateMutationMeta): void => {
    if (this.disposed) return;
    this.backend.update(updater, meta);
  };

  getListenerCount = (): number => this.listeners.size + this.patchListeners.size;

  isStoreDisposed = (): boolean => this.disposed;

  dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    // Cleanup is best effort. A broken backend unsubscribe must not leave the
    // wrapper subscribed, retain listener references, or skip owned disposal.
    try {
      this.unsubscribeBackendPatches();
    } catch (error) {
      this.reportListenerError('Backend patch unsubscribe error', error);
    }
    try {
      this.unsubscribeBackend();
    } catch (error) {
      this.reportListenerError('Backend unsubscribe error', error);
    }
    this.listeners.clear();
    this.patchListeners.clear();
    if (this.ownership === 'owned') {
      try {
        this.backend.dispose?.();
      } catch (error) {
        this.reportListenerError('Owned backend disposal error', error);
      }
    }
  };

  private reportListenerError(message: string, error: unknown): void {
    // ErrorHandlers intentionally throws in some development configurations.
    // Error reporting must never turn a subscriber/backend failure into a
    // failed state transition or incomplete disposal.
    try {
      ErrorHandlers.store(
        message,
        { storeName: this.name },
        error instanceof Error ? error : undefined,
      );
    } catch {
      // The original failure has already been isolated from the store contract.
    }
  }

  private capturePatchNotification(patches: readonly Patch[] | null): void {
    if (this.disposed) return;
    // A regular-first backend can re-enter its writer from a listener. While
    // wrapper listeners are still dispatching, bind the patch to the most
    // recent unresolved transition (the nested one). Once the outer dispatch
    // has returned, a late patch callback belongs to the oldest unresolved
    // transition in the queue.
    let pending: PendingPatchNotification<Patch> | undefined;
    if (this.listenerDispatchDepth > 0) {
      for (let index = this.pendingPatchNotifications.length - 1; index >= 0; index -= 1) {
        const candidate = this.pendingPatchNotifications[index];
        if (candidate && !candidate.resolved) {
          pending = candidate;
          break;
        }
      }
    }
    pending ??= this.pendingPatchNotifications.find((entry) => !entry.resolved);
    if (pending) {
      pending.patches = patches;
      pending.resolved = true;
      this.schedulePatchFlush();
      return;
    }
    // The regular subscription may be invoked after this callback. Keep the
    // event until that transition arrives so patch-first and regular-first
    // backends have identical observable semantics. If no regular transition
    // arrives, flush the patch-only event at the microtask boundary instead of
    // retaining it indefinitely and attaching it to a future transition.
    this.orphanPatchNotifications.push(patches);
    this.scheduleOrphanPatchFlush();
  }

  private scheduleOrphanPatchFlush(): void {
    if (this.orphanPatchFlushScheduled) return;
    this.orphanPatchFlushScheduled = true;
    queueMicrotask(() => {
      this.orphanPatchFlushScheduled = false;
      if (this.disposed) {
        this.orphanPatchNotifications.length = 0;
        return;
      }
      while (this.orphanPatchNotifications.length > 0) {
        this.deliverPatchNotification(this.orphanPatchNotifications.shift() ?? null);
      }
    });
  }

  private schedulePatchFlush(): void {
    if (this.patchFlushScheduled) return;
    this.patchFlushScheduled = true;
    queueMicrotask(() => {
      this.patchFlushScheduled = false;
      if (this.disposed) {
        this.pendingPatchNotifications.length = 0;
        this.orphanPatchNotifications.length = 0;
        this.orphanPatchFlushScheduled = false;
        this.listenerDispatchDepth = 0;
        return;
      }
      this.flushPatchNotifications(false);
    });
  }

  private flushPatchNotifications(onlyResolved: boolean): void {
    if (onlyResolved) {
      // Preserve transition order. A nested transition may resolve before its
      // outer regular-first transition receives its late patch callback; hold
      // the nested notification until the outer entry can be delivered too.
      while (this.pendingPatchNotifications.length > 0) {
        const pending = this.pendingPatchNotifications[0];
        if (!pending?.resolved) return;
        this.pendingPatchNotifications.shift();
        this.deliverPatchNotification(pending.patches);
      }
      return;
    }

    while (this.pendingPatchNotifications.length > 0) {
      const pending = this.pendingPatchNotifications[0];
      if (!pending) return;
      this.pendingPatchNotifications.shift();
      const patches = pending.resolved ? pending.patches : null;
      pending.resolved = true;
      pending.patches = patches;
      this.deliverPatchNotification(patches);
    }
  }

  private deliverPatchNotification(patches: readonly Patch[] | null): void {
    this.lastPatches = patches;
    for (const listener of [...this.patchListeners]) {
      try {
        listener(patches);
      } catch (error) {
        this.reportListenerError('Backend store patch listener error', error);
      }
    }
  }

  private toSnapshot(source: ReturnType<StateBackend<T>['getSnapshot']>): Snapshot<T> {
    return {
      value: source.value,
      name: source.name || this.name,
      version: source.version,
      lastUpdate: source.lastUpdate,
    };
  }
}

export function createBackendStore<T, Patch = StatePatch>(
  name: string,
  backend: StateBackend<T, Patch>,
  options?: BackendStoreOptions,
): BackendStore<T, Patch> {
  return new BackendStore(name, backend, options);
}
