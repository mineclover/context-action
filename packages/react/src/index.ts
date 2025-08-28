// ==============================================
// MAIN INDEX - Essential APIs Only
// ==============================================

// Action System (Core functionality)
export { createActionContext } from './actions/ActionContext';
export type { 
  ActionContextConfig,
  ActionContextReturn
} from './actions/ActionContext.types';

// Store System (Core functionality)
export { createStore, Store } from './stores/core/Store';
export { useStoreValue } from './stores/hooks/useStoreValue';
export type { IStore, Snapshot } from './stores/core/types';

// Store Error Boundary (Essential for production apps)
export { StoreErrorBoundary } from './stores/components/StoreErrorBoundary';
export type { StoreErrorBoundaryProps } from './stores/components/StoreErrorBoundary';

// Declarative Store Pattern (Most commonly used)
export { createStoreContext } from './stores/patterns/declarative-store-pattern-v2';

// Ref System (Core functionality)
export { createRefContext } from './refs/createRefContext';
export type { RefContextReturn, CreateRefContextOptions } from './refs/createRefContext';

// Core types from @context-action/core
export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  PipelineController,
  ActionRegisterConfig,
  ExecutionMode,
  UnregisterFunction
} from '@context-action/core';

export { ActionRegister } from '@context-action/core';