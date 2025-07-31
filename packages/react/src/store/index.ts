/**
 * Store system exports - centralized and standardized
 * Organized by category for better tree-shaking and clarity
 */

// === CORE TYPES ===
export type {
  // Base types
  Snapshot,
  Listener,
  Unsubscribe,
  Subscribe,
  
  // Store interfaces
  IStore,
  IStoreRegistry,
  
  // Event system
  EventHandler,
  IEventBus,
  
  // Hook configuration
  StoreSyncConfig,
  HookOptions,
  
  // Context types
  StoreContextType,
  StoreContextReturn,
  
  // Registry types
  RegistryStoreMap,
  DynamicStoreOptions
} from './types';

// === CORE CLASSES ===
export { Store, NumericStore } from './Store';
export { StoreRegistry } from './StoreRegistry';
export { EventBus, ScopedEventBus } from './EventBus';

// === UTILITIES ===
export { StoreUtils, createStore, createComputedStore } from './utils';

// === MVVM ARCHITECTURE UTILITIES ===
export { 
  createMultiStoreHandler, 
  createTransactionHandler, 
  createValidatedHandler,
  ActionHandlerUtils 
} from './ActionHandlerUtils';

export type {
  StoreSnapshot,
  MultiStoreContext,
  TransactionContext
} from './ActionHandlerUtils';

// === REACT HOOKS ===
// Primary hooks
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
  usePersistedStore,
  // MVVM Architecture hooks
  useMultiStoreAction,
  useTransactionAction,
  useActionWithStores
} from './hooks';

// === CONTEXT API ===
export { 
  createStoreContext, 
  StoreProvider, 
  useStoreContext, 
  useStoreRegistry 
} from './StoreContext';

// === SYNC UTILITIES ===
// Store sync
export { 
  createStoreSync, 
  createTypedStoreHooks, 
  useBatchStoreSync 
} from './store-sync';

// Registry sync
export { 
  createRegistrySync, 
  RegistryUtils,
  useDynamicStoreWithDefault,
  useDynamicStoreSnapshot,
  useDynamicStores
} from './registry-sync';

// === METADATA ===
export const VERSION = '1.0.0';
