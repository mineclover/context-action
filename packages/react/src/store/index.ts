/**
 * Core store system exports
 */

// Types
export type {
  Snapshot,
  Listener,
  Unsubscribe,
  Subscribe,
  IStore,
  IStoreRegistry,
  EventHandler,
  IEventBus
} from './types';

// Classes
export { Store, NumericStore } from './Store';
export { StoreRegistry } from './StoreRegistry';
export { EventBus, ScopedEventBus } from './EventBus';

// Utilities
export { StoreUtils } from './utils';

// React Hooks
export {
  useStore,
  useStoreValue,
  useRegistry,
  useRegistryStore,
  useDynamicStore,
  useLocalStore,
  useStoreActions,
  useStoreSync,
  useComputedStore,
  usePersistedStore
} from './hooks';

// Store Context API
export { createStoreContext, StoreProvider, useStoreContext, useStoreRegistry } from './StoreContext';
export type { StoreContextType, StoreContextReturn } from './StoreContext';

// Store Sync Utilities
export { useStoreSync as useStoreSyncUtil, createStoreSync, createTypedStoreHooks, useBatchStoreSync } from './store-sync';
export type { StoreSyncConfig } from './store-sync';

// Registry Sync Utilities
export { createRegistrySync, RegistryUtils, useDynamicStore as useDynamicStoreFromRegistry, useDynamicStoreWithDefault, useDynamicStoreSnapshot, useDynamicStores } from './registry-sync';

// Version
export const VERSION = '1.0.0';
