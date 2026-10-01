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
  private snapshot: Snapshot<T>;
  private disposed = false;
  private lastPatches: readonly Patch[] | null = null;

  constructor(name: string, backend: StateBackend<T, Patch>, options: BackendStoreOptions = {}) {
    this.name = name;
    this.backend = backend;
    this.ownership = options.ownership ?? 'shared';
    this.backendSnapshot = backend.getSnapshot();
    this.snapshot = this.toSnapshot(this.backendSnapshot);
    this.unsubscribeBackendPatches = backend.subscribeWithPatches?.((patches) => {
      this.lastPatches = patches;
    }) ?? (() => {});
    this.unsubscribeBackend = backend.subscribe(() => {
      if (this.disposed) return;
      const nextBackendSnapshot = backend.getSnapshot();
      // A backend must replace its snapshot object whenever it publishes. A
      // duplicate notification therefore cannot invalidate useSyncExternalStore.
      if (nextBackendSnapshot !== this.backendSnapshot) {
        this.backendSnapshot = nextBackendSnapshot;
        this.snapshot = this.toSnapshot(nextBackendSnapshot);
      }
      const patches = this.lastPatches ?? backend.getLastPatches?.() ?? null;
      this.lastPatches = null;
      for (const listener of [...this.listeners]) {
        try {
          listener();
        } catch (error) {
          ErrorHandlers.store('Backend store listener error', { storeName: this.name }, error instanceof Error ? error : undefined);
        }
      }
      for (const listener of [...this.patchListeners]) {
        try {
          listener(patches);
        } catch (error) {
          ErrorHandlers.store('Backend store patch listener error', { storeName: this.name }, error instanceof Error ? error : undefined);
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
    this.unsubscribeBackendPatches();
    this.unsubscribeBackend();
    this.listeners.clear();
    this.patchListeners.clear();
    if (this.ownership === 'owned') this.backend.dispose?.();
  };

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
