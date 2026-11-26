// ==============================================
// ADVANCED INDEX - Advanced APIs
// ==============================================

// Store Registry and Advanced Store Features
export { StoreRegistry } from './stores/core/StoreRegistry';
export type { 
  DynamicStoreOptions,
  HookOptions,
  StoreSyncConfig
} from './stores/core/types';

// Advanced Store Hooks
export { useComputedStore } from './stores/hooks/useComputedStore';
export { useLocalStore } from './stores/hooks/useLocalStore';
export { useStoreInstance } from './stores/hooks/useStoreInstance';
export { useControlledStoreSync } from './stores/hooks/useControlledStoreSync';
export type { UseControlledStoreSyncOptions } from './stores/hooks/useControlledStoreSync';

// Synchronous Element UI Hooks & Core/Element Re-exports
export {
  useDismissLayer,
  useSyncActionPipeline,
  useRovingFocus,
  usePointerGesture,
} from './element/element-hooks';
export type { UseDismissLayerOptions } from './element/element-hooks';
export {
  createSyncActionPipeline,
  toReactPartProps,
} from '@context-action/core/element';
export type {
  SyncActionPipeline,
  SyncDispatchOutcome,
  SyncGuardController,
  SyncHandlerConfig,
  SyncObserverConfig,
  SyncObserverMeta,
  SyncResultController,
} from '@context-action/core/element';
export {
  createDismissLayer,
  createPointerGestureSession,
  createRovingFocusController,
} from '@context-action/interactions';
export type {
  DismissLayerHandle,
  DismissLayerOptions,
  DismissReason,
  PointerCaptureTargetLike,
  PointerGestureEventLike,
  PointerGestureKeyEventLike,
  PointerGestureModifiers,
  PointerGestureOptions,
  PointerGestureSession,
  PointerGestureSnapshot,
  RovingFocusController,
  RovingFocusDirection,
  RovingFocusItem,
  RovingFocusKeyEventLike,
  RovingFocusOptions,
  RovingFocusOrientation,
} from '@context-action/interactions';



// Utilities (for convenience - prefer importing from utils.ts)
export * from './utils';

// Error Handling System
export {
  ContextActionError,
  ContextActionErrorType,
  handleError as handleContextActionError
} from './stores/utils/error-handling';

// Error Boundary Components
export {
  StoreErrorBoundary,
  withStoreErrorBoundary,
  createStoreErrorBoundary
} from './stores/components/StoreErrorBoundary';
export type {
  StoreErrorBoundaryProps,
  StoreErrorBoundaryState
} from './stores/components/StoreErrorBoundary';

// Additional patterns and hooks (for convenience)
// Note: For better tree shaking, import specific items from their respective modules
export { createActionContext } from './actions/ActionContext';
export type { ActionContextConfig, ActionContextReturn } from './actions/ActionContext.types';
export { createScopedContext } from './actions/createScopedContext';
export type { ScopedContextReturn, ScopedProviderProps } from './actions/createScopedContext';
export { useRefRegistry } from './refs/useRefRegistry';
export type { RefRegistry, UseRefRegistryOptions } from './refs/useRefRegistry';
export { useRefCollection } from './refs/createRefCollection';
export type { RefCollection } from './refs/createRefCollection';
