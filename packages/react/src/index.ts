// ==============================================
// MAIN INDEX - Essential React Surface (v5)
// Specialized subpaths live at /refs, /time-travel, /transactions, /backend, /advanced, /utils, /webmcp
// ==============================================

// Action System (Core functionality)
export { createActionContext } from './actions/ActionContext';
export type { 
  ActionContextConfig,
  ActionContextReturn,
  ActionContextType,
  ActionProviderProps,
  ActionScopeReturn,
  ProviderShutdownOptions,
} from './actions/ActionContext.types';

// Store System (Core functionality)
export {
  createStore,
  Store,
  type PatchAwareListener,
  type StoreNotificationMode,
  type StoreOptions,
} from './stores/core/Store';
export { useStoreValue } from './stores/hooks/useStoreValue';
export type { SubscribableStore } from './stores/utils/sync-external-store-utils';
export { useStoreSelector } from './stores/hooks/useStoreSelector';
export { useStorePath, useStoreSelectorWithPaths } from './stores/hooks/useStorePath';
export type { PatchAwareStore, StorePathPatch, StorePath, UseStorePathOptions, UseStoreSelectorWithPathsOptions } from './stores/hooks/useStorePath';
export type { IStore, Snapshot } from './stores/core/types';
export type { StoreReader, StoreWriter } from './stores/core/contracts';

// Re-export Patches type from mutative for subscribeWithPatches users
export type { Patches, TravelPatches } from '@context-action/mutative';

// Store Error Boundary (Essential for production apps)
export { StoreErrorBoundary } from './stores/components/StoreErrorBoundary';
export type { StoreErrorBoundaryProps } from './stores/components/StoreErrorBoundary';

// Declarative Store Pattern (Most commonly used)
export { createStoreContext, StoreManager, asStoreValue } from './stores/patterns/declarative-store-pattern-v2';
export type {
  InitialStores,
  StoreConfig,
  ExplicitStoreValue,
  WithProviderConfig,
  ExternalStoreInput,
  ExternalStoresMap,
  StoreManagerOptions,
  StoreProviderProps,
  StoreContextReturn,
} from './stores/patterns/declarative-store-pattern-v2';

// Core types from @context-action/core
export type {
  ActionCommandController,
  ActionCommandHandler,
  ActionPayloadMap,
  ActionHandler,
  CommandConfig,
  HandlerConfig,
  PipelineController,
  ActionRegisterConfig,
  ExecutionMode,
  UnregisterFunction
} from '@context-action/core';

export { ActionRegister } from '@context-action/core';

// React-specific lifecycle helpers belong to the React adapter, not core.
export {
  createActionHandler,
  ReactDevUtils,
  ReactActionError,
  isReactActionError,
} from './actions/react-helpers';

// ToolContext remains a source-only development track and is intentionally not
// re-exported by the public @context-action/react entry.
