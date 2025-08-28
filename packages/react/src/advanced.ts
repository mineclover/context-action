// ==============================================
// ADVANCED INDEX - Advanced APIs
// ==============================================

// Store Registry and Advanced Store Features
export { StoreRegistry } from './stores/core/StoreRegistry';
export { EventBus } from './stores/core/EventBus';
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

// Store Components
export { StoreErrorBoundary } from './stores/components/StoreErrorBoundary';
export type { 
  StoreErrorBoundaryProps 
} from './stores/components/StoreErrorBoundary';

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
  performantSafeGet,
  performantSafeGetWithImmer
} from './stores/utils/immutable';

// Error Handling System
export {
  ContextActionError,
  ContextActionErrorType,
  handleError as handleContextActionError,
  safeAsync,
  safeSync
} from './stores/utils/error-handling';

// All patterns from patterns index
export * from './patterns';

// All available hooks
export * from './hooks';