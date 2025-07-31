// Re-export core types for convenience
export type { ActionPayloadMap, ActionHandler, HandlerConfig, PipelineController } from '@context-action/core';
export { ActionRegister } from '@context-action/core';

// React-specific exports
export * from './ActionContext';

// Store exports (tree-shakeable)
export {
  // Core store classes
  Store,
  NumericStore,
  StoreRegistry,
  EventBus,
  ScopedEventBus,
  
  // Store utilities
  StoreUtils,
  
  // React hooks
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
  
  // Store Context API
  createStoreContext,
  StoreProvider,
  useStoreContext,
  useStoreRegistry,
  
  // Store Sync Utilities
  useStoreSyncUtil,
  createStoreSync,
  createTypedStoreHooks,
  useBatchStoreSync,
  
  // Registry Sync Utilities
  createRegistrySync,
  RegistryUtils,
  useDynamicStoreFromRegistry,
  useDynamicStoreWithDefault,
  useDynamicStoreSnapshot,
  useDynamicStores
} from './store';

// Store types
export type {
  Snapshot,
  Listener,
  Unsubscribe,
  Subscribe,
  IStore,
  IStoreRegistry,
  EventHandler,
  IEventBus,
  StoreContextType,
  StoreContextReturn,
  StoreSyncConfig
} from './store';

// 로거 관련 타입들 export
export type { Logger, LogLevel, OtelContext } from '@context-action/core'
export { ConsoleLogger, OtelConsoleLogger, getLogLevelFromEnv } from '@context-action/core'