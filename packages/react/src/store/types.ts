/**
 * Core types for the store system
 */

export interface Snapshot<T = any> {
  value: T;
  name: string;
  lastUpdate: number;
}

export type Listener = () => void;
export type Unsubscribe = () => void;
export type Subscribe = (listener: Listener) => Unsubscribe;

export interface IStore<T = any> {
  readonly name: string;
  subscribe: Subscribe;
  getSnapshot: () => Snapshot<T>;
  setValue: (value: T) => void;
  getValue: () => T;
}

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

export interface EventHandler<T = any> {
  (data: T): void;
}

export interface IEventBus {
  on: <T = any>(event: string, handler: EventHandler<T>) => Unsubscribe;
  emit: <T = any>(event: string, data?: T) => void;
  off: (event: string, handler?: EventHandler) => void;
  clear: () => void;
}
