import type { StateBackend, StateMutationMeta } from '@context-action/store-core';
import { ErrorHandlers } from '../utils/error-handling';
import type { IStore, Listener, Snapshot, StoreSetValueOptions, Unsubscribe } from './types';

/**
 * React-facing Store wrapper for a user-owned state backend.
 *
 * The backend owns immutability, cloning, patches, and persistence semantics.
 * This wrapper only supplies the IStore/useSyncExternalStore boundary.
 */
export class BackendStore<T = unknown> implements IStore<T> {
  public readonly name: string;
  private readonly backend: StateBackend<T>;
  private readonly listeners = new Set<Listener>();
  private readonly unsubscribeBackend: Unsubscribe;
  private snapshot: Snapshot<T>;
  private disposed = false;

  constructor(name: string, backend: StateBackend<T>) {
    this.name = name;
    this.backend = backend;
    this.snapshot = this.toSnapshot();
    this.unsubscribeBackend = backend.subscribe(() => {
      this.snapshot = this.toSnapshot();
      for (const listener of this.listeners) {
        try {
          listener();
        } catch (error) {
          ErrorHandlers.store('Backend store listener error', { storeName: this.name }, error instanceof Error ? error : undefined);
        }
      }
    });
  }

  subscribe = (listener: Listener): Unsubscribe => {
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): Snapshot<T> => this.snapshot;

  getValue = (): T => this.backend.getSnapshot().value;

  setValue = (value: T, options?: StoreSetValueOptions<T>): void => {
    if (this.disposed) return;
    const meta = options && typeof options === 'object'
      ? (Object.fromEntries(
        ['transactionId', 'actionId', 'origin', 'label']
          .filter(key => key in options)
          .map(key => [key, (options as Record<string, unknown>)[key]]),
      ) as StateMutationMeta)
      : undefined;
    this.backend.setValue(value, meta);
  };

  update = (updater: (current: T) => T | undefined): void => {
    if (this.disposed) return;
    this.backend.update(updater);
  };

  getListenerCount = (): number => this.listeners.size;

  isStoreDisposed = (): boolean => this.disposed;

  dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribeBackend();
    this.listeners.clear();
  };

  private toSnapshot(): Snapshot<T> {
    const snapshot = this.backend.getSnapshot();
    return {
      value: snapshot.value,
      name: snapshot.name || this.name,
      version: snapshot.version,
      lastUpdate: snapshot.lastUpdate,
    };
  }
}

export function createBackendStore<T>(name: string, backend: StateBackend<T>): BackendStore<T> {
  return new BackendStore(name, backend);
}
