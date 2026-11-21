import type React from 'react';
import { useInsertionEffect, useMemo, useRef } from 'react';
import { StoreRegistry } from '../core/StoreRegistry';

/**
 * Metadata recorded when registering a lazily instantiated store in `StoreRegistry`.
 */
export interface ManagedStoreMetadata {
  name: string;
  tags?: string[];
  description?: string;
  debug?: boolean;
  version?: string;
}

/**
 * Outcome of adapting or validating an injected external store entry.
 */
export interface ExternalStoreResolution<TStore> {
  store: TStore;
  adapted: boolean;
}

/**
 * Shared lifecycle, external store ownership tracking, registry coordination,
 * and batched metadata notification mechanics for store pattern managers.
 */
export abstract class BaseStoreManager<
  T extends Record<string, unknown>,
  TInitial extends object,
  TStore extends { dispose?: () => void },
> {
  public readonly registry: StoreRegistry;
  public readonly initialStores: TInitial;
  public readonly stores = new Map<keyof T, TStore>();
  protected readonly externalStoreKeys = new Set<keyof T>();
  protected readonly adaptedExternalStores = new Set<keyof T>();
  protected readonly externalOwnership: 'shared' | 'owned';
  protected lifecycle: 'active' | 'disposed' = 'active';
  protected version = 0;
  protected infoVersion = 0;
  protected readonly listeners = new Set<() => void>();
  protected readonly infoListeners = new Set<() => void>();
  protected infoNotificationScheduled = false;

  protected constructor(
    public readonly name: string,
    initialStores: TInitial,
    externalOwnership: 'shared' | 'owned' = 'shared',
    private readonly managerLabel: string = 'StoreManager'
  ) {
    this.registry = new StoreRegistry(name);
    this.initialStores = initialStores;
    this.externalOwnership = externalOwnership;
  }

  protected assertActive(): void {
    if (this.lifecycle === 'disposed') {
      throw new Error(`${this.managerLabel} "${this.name}" is disposed`);
    }
  }

  protected registerExternalStores(
    externalStores: Partial<Record<keyof T, unknown>> | undefined,
    resolveExternalStore: (
      key: keyof T,
      externalStore: unknown,
      externalOwnership: 'shared' | 'owned'
    ) => ExternalStoreResolution<TStore>
  ): void {
    if (!externalStores) return;

    for (const [rawKey, externalStore] of Object.entries(externalStores)) {
      if (!externalStore) continue;
      const key = rawKey as keyof T;
      this.externalStoreKeys.add(key);

      const { store, adapted } = resolveExternalStore(
        key,
        externalStore,
        this.externalOwnership
      );
      if (adapted) {
        this.adaptedExternalStores.add(key);
      }

      this.stores.set(key, store);
      this.registry.register(
        String(key),
        store as unknown as Parameters<StoreRegistry['register']>[1],
        {
          name: String(key),
        }
      );
    }

    if (this.externalStoreKeys.size > 0) {
      this.infoVersion += 1;
    }
  }

  protected registerCreatedStore(
    storeName: keyof T,
    store: TStore,
    metadata: ManagedStoreMetadata
  ): TStore {
    this.registry.register(
      String(storeName),
      store as unknown as Parameters<StoreRegistry['register']>[1],
      metadata
    );
    this.stores.set(storeName, store);
    this.infoVersion += 1;
    this.scheduleInfoNotification();
    return store;
  }

  /**
   * Clear manager-owned stores while keeping shared external stores alive.
   */
  clear(): void {
    this.assertActive();

    const keysToDispose: Array<keyof T> = [];
    this.stores.forEach((_store, key) => {
      const isSharedExternal =
        this.externalOwnership === 'shared' && this.externalStoreKeys.has(key);
      if (!isSharedExternal) {
        keysToDispose.push(key);
      }
    });

    for (const key of keysToDispose) {
      const store = this.stores.get(key);
      store?.dispose?.();
      this.registry.unregister(String(key));
      this.stores.delete(key);
      this.externalStoreKeys.delete(key);
      this.adaptedExternalStores.delete(key);
    }

    this.version += 1;
    this.infoVersion += 1;
    this.listeners.forEach(listener => listener());
    this.scheduleInfoNotification();
  }

  /**
   * Dispose manager-owned stores and registry resources; preserve shared external stores.
   */
  dispose(): void {
    if (this.lifecycle === 'disposed') return;
    this.lifecycle = 'disposed';
    this.stores.forEach((store, key) => {
      // Adapted BackendStore wrappers must always dispose to detach listeners from
      // external backends; BackendStore itself forwards disposal only when owned.
      if (
        this.adaptedExternalStores.has(key) ||
        this.externalOwnership === 'owned' ||
        !this.externalStoreKeys.has(key)
      ) {
        store.dispose?.();
      }
    });
    this.stores.clear();
    this.externalStoreKeys.clear();
    this.adaptedExternalStores.clear();
    this.listeners.clear();
    this.infoListeners.clear();
    this.registry.dispose();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getVersion(): number {
    return this.version;
  }

  subscribeInfo(listener: () => void): () => void {
    this.infoListeners.add(listener);
    return () => this.infoListeners.delete(listener);
  }

  getInfoVersion(): number {
    return this.infoVersion;
  }

  /**
   * Store creation can happen during render through useStore(). Defer the
   * metadata notification so one component never synchronously updates a
   * sibling that is still rendering.
   */
  protected scheduleInfoNotification(): void {
    if (this.infoNotificationScheduled) return;
    this.infoNotificationScheduled = true;
    queueMicrotask(() => {
      this.infoNotificationScheduled = false;
      if (this.lifecycle === 'disposed') return;
      this.infoListeners.forEach(listener => listener());
    });
  }

  /**
   * Get registry info.
   */
  getInfo() {
    return {
      name: this.name,
      storeCount: this.stores.size,
      availableStores: Object.keys(this.initialStores),
    };
  }
}

/**
 * Configuration passed to `useManagedStoreProvider` to reconcile owned,
 * injected-stores, and externally supplied manager lifecycles.
 */
export interface UseManagedStoreProviderOptions<
  TManager extends { dispose(): void },
  TStoresMap,
> {
  registryId?: string;
  contextName: string;
  externalManager?: TManager;
  externalStores?: TStoresMap;
  ownership?: 'shared' | 'owned';
  areExternalStoresEqual: (prev: TStoresMap, next: TStoresMap) => boolean;
  createOwnedManager: (effectiveRegistryId: string) => TManager;
  createExternalStoresManager: (
    effectiveRegistryId: string,
    stores: TStoresMap,
    ownership: 'shared' | 'owned'
  ) => TManager;
}

/**
 * Manage `Provider` store-manager selection, external store diffing, React
 * `<Activity>` hide/reveal survival, and `useInsertionEffect` cleanup policy.
 */
export function useManagedStoreProvider<
  TManager extends { dispose(): void },
  TStoresMap,
>({
  registryId,
  contextName,
  externalManager,
  externalStores,
  ownership,
  areExternalStoresEqual,
  createOwnedManager,
  createExternalStoresManager,
}: UseManagedStoreProviderOptions<TManager, TStoresMap>): {
  managerRef: React.RefObject<TManager | null>;
} {
  const effectiveRegistryId = registryId || contextName;
  const ownedManagerRef = useRef<TManager | null>(null);
  const ownedStoresEntryRef = useRef<{
    stores: TStoresMap;
    registryId: string;
    ownership: 'shared' | 'owned';
    manager: TManager;
  } | null>(null);

  let activeManager: TManager;
  if (externalManager) {
    activeManager = externalManager;
  } else if (externalStores) {
    const resolvedExternalOwnership: 'shared' | 'owned' = ownership ?? 'shared';
    const currentEntry = ownedStoresEntryRef.current;
    if (
      !currentEntry ||
      currentEntry.registryId !== effectiveRegistryId ||
      currentEntry.ownership !== resolvedExternalOwnership ||
      !areExternalStoresEqual(currentEntry.stores, externalStores)
    ) {
      ownedStoresEntryRef.current = {
        stores: externalStores,
        registryId: effectiveRegistryId,
        ownership: resolvedExternalOwnership,
        manager: createExternalStoresManager(
          effectiveRegistryId,
          externalStores,
          resolvedExternalOwnership
        ),
      };
    }
    activeManager = ownedStoresEntryRef.current!.manager;
  } else {
    if (!ownedManagerRef.current) {
      ownedManagerRef.current = createOwnedManager(effectiveRegistryId);
    }
    activeManager = ownedManagerRef.current;
  }

  // Track current disposal policy in an insertion effect so swapping from
  // a shared external manager to an owned one disposes the outgoing manager
  // under its own policy before the new effect commits.
  const shouldDisposeManager = externalManager ? ownership === 'owned' : true;
  const disposeOnUnmountRef = useRef(shouldDisposeManager);
  useInsertionEffect(() => {
    disposeOnUnmountRef.current = shouldDisposeManager;
  }, [shouldDisposeManager]);

  const activeManagerRef = useRef<TManager | null>(activeManager);
  activeManagerRef.current = activeManager;

  // Hidden Activities clean up passive effects. Use insertion-effect
  // ownership so store instances survive a hide/reveal cycle.
  useInsertionEffect(() => {
    return () => {
      const shouldDispose = disposeOnUnmountRef.current;
      if (shouldDispose) {
        activeManager.dispose();
      }
      if (ownedManagerRef.current === activeManager && shouldDispose) {
        ownedManagerRef.current = null;
      }
      if (ownedStoresEntryRef.current?.manager === activeManager) {
        ownedStoresEntryRef.current = null;
      }
      if (activeManagerRef.current === activeManager && shouldDispose) {
        activeManagerRef.current = null;
      }
    };
  }, [activeManager]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Recreate context value when activeManager swaps so consumers re-read from the new manager.
  return useMemo(
    () => ({ managerRef: activeManagerRef }),
    [activeManager]
  );
}
