/**
 * Core types for the store system
 */

// Base subscription types
export type Listener = () => void;
export type Unsubscribe = () => void;
export type Subscribe = (listener: Listener) => Unsubscribe;

// Store snapshot interface
export interface Snapshot<T = any> {
  value: T;
  name: string;
  lastUpdate: number;
}

// Core store interface
export interface IStore<T = any> {
  readonly name: string;
  subscribe: Subscribe;
  getSnapshot: () => Snapshot<T>;
  setValue: (value: T) => void;
  getValue: () => T;
  getListenerCount?: () => number;
}

// Store registry interface
export interface IStoreRegistry {
  readonly name: string;
  subscribe: Subscribe;
  getSnapshot: () => Array<[string, IStore]>;
  register: (name: string, store: IStore) => void;
  unregister: (name: string) => void;
  getStore: (name: string) => IStore | undefined;
  getAllStores: () => Map<string, IStore>;
  hasStore: (name: string) => boolean;
}

// Event system types
export interface EventHandler<T = any> {
  (data: T): void;
}

export interface IEventBus {
  on: <T = any>(event: string, handler: EventHandler<T>) => Unsubscribe;
  emit: <T = any>(event: string, data?: T) => void;
  off: (event: string, handler?: EventHandler) => void;
  clear: () => void;
}

// Hook configuration types
export interface StoreSyncConfig<T, R = Snapshot<T>> {
  defaultValue?: T;
  selector?: (snapshot: Snapshot<T>) => R;
}

export interface HookOptions<T> {
  defaultValue?: T;
  onError?: (error: Error) => void;
  dependencies?: React.DependencyList;
}

// Context types
export interface StoreContextType {
  storeRegistryRef: React.RefObject<IStoreRegistry>;
}

export interface StoreContextReturn {
  Provider: React.FC<{ children: React.ReactNode }>;
  useStoreContext: () => StoreContextType;
  useStoreRegistry: () => IStoreRegistry;
}

// Registry sync types
export interface RegistryStoreMap {
  [key: string]: any;
}

export interface DynamicStoreOptions<T> {
  defaultValue?: T;
  createIfNotExists?: boolean;
  onNotFound?: (storeName: string) => void;
}
