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
export { useStoreSelector } from './stores/hooks/useStoreSelector';
export { usePersistedStore } from './stores/hooks/usePersistedStore';
export { useLocalStore } from './stores/hooks/useLocalStore';



// Provider Composition Utilities
export { 
  composeProviders
} from './stores/utils/provider-composition';
export type {
  ProviderComponent
} from './stores/utils/provider-composition';

// Immutability Utils (with dynamic Immer loading)
export { 
  deepClone,
  deepCloneWithImmer,
  preloadImmer,
  ImmerUtils,
  safeGet,
  safeSet,
} from './stores/utils/immutable';

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

// All patterns from patterns index
export * from './patterns';

// All available hooks
export * from './hooks';