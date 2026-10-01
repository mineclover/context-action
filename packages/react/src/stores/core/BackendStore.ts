import type { StateBackend, StateMutationMeta, StatePatch } from '@context-action/store-core';
import { ErrorHandlers } from '../utils/error-handling';
import type { IStore, Listener, Snapshot, StoreSetValueOptions, Unsubscribe } from './types';

export type BackendPatchListener<Patch = StatePatch> = (patches: readonly Patch[] | null) => void;

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

  constructor(name: string, backend: StateBackend<T, Patch>, options: BackendStoreOptions = {}) {
    this.name = name;
    this.backend = backend;
    this.ownership = options.ownership ?? 'shared';
    this.backendSnapshot = backend.getSnapshot();
    this.backendSnapshotVersion = this.backendSnapshot.version;
    this.backendSnapshotLastUpdate = this.backendSnapshot.lastUpdate;
    this.backendSnapshotValue = this.backendSnapshot.value;
    this.snapshot = this.toSnapshot(this.backendSnapshot);
    this.unsubscribeBackendPatches = backend.subscribeWithPatches?.((patches) => {
      this.lastPatches = patches;
    }) ?? (() => {});
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
      const patches = this.lastPatches ?? backend.getLastPatches?.() ?? null;
      this.lastPatches = null;
      for (const listener of [...this.listeners]) {
        try {
          listener();
        } catch (error) {
          this.reportListenerError('Backend store listener error', error);
        }
      }
      for (const listener of [...this.patchListeners]) {
        try {
          listener(patches);
        } catch (error) {
          this.reportListenerError('Backend store patch listener error', error);
        }
      }
    });
  }

  subscribe = (listener: Listener): Unsubscribe => {
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  subscribeWithPatches = (listener: BackendPatchListener<Patch>): Unsubscribe => {
    if (this.disposed) return () => {};
    this.patchListeners.add(listener);
    return () => this.patchListeners.delete(listener);
  };

  getSnapshot = (): Snapshot<T> => this.snapshot;

  getValue = (): T => this.backendSnapshot.value;

  getSafeValue = (): T => this.backend.getSafeValue?.() ?? this.backendSnapshot.value;

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
