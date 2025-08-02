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
export { Store, ManagedStore } from './Store';
export { StoreRegistry } from './StoreRegistry';
export { EventBus, ScopedEventBus } from './EventBus';

// === UTILITIES ===
export { StoreUtils } from './utils';

// === STORE FACTORIES ===
export { 
  createStore, 
  createManagedStore,
  type StoreConfig 
} from './Store';

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
export {
  // Core store hooks
  useStore,
  useStoreValue,
  useStoreValues,
  useStoreActions,
  // Registry hooks
  useRegistry,
  useRegistryStore,
  // Specialized hooks
  useLocalStore,
  usePersistedStore
} from './hooks';

// === CONTEXT API ===
export { 
  createStoreContext, 
  StoreProvider, 
  useStoreContext, 
  useStoreRegistry 
} from './StoreContext';

// === HOC PATTERNS ===
// Store HOCs have been removed - use hooks instead:
// - withStore → useLocalStore + useStoreValue  
// - withManagedStore → useRegistryStore + useStoreValue
// - withStoreData → useStoreValue with multiple stores

// === SYNC UTILITIES ===
// Store sync
export { 
  useStoreSelector,
  createTypedStoreHooks
} from './store-selector';

// Registry sync
export { 
  createRegistrySync, 
  RegistryUtils
} from './registry-sync';

// === IMMUTABILITY UTILITIES ===
export {
  // Core immutability functions
  deepClone,
  verifyImmutability,
  safeGet,
  safeSet,
  performantSafeGet,
  
  // Configuration
  setGlobalImmutabilityOptions,
  getGlobalImmutabilityOptions,
  
  // Performance monitoring
  getPerformanceProfile,
  
  // Types
  type ImmutabilityOptions,
  type PerformanceProfile
} from './immutable';

// === METADATA ===
export const VERSION = '1.0.0';
