/**
 * @fileoverview Store utilities exports - comparison, immutability, and helper functions
 * @implements computed-store
 * @implements performance-optimization
 * @implements store-immutability
 * @memberof core-concepts
 * 
 * Utility functions for store operations including value comparison strategies,
 * immutability helpers, store selectors, and action handler utilities.
 */

// === COMPARISON UTILITIES ===
// Value comparison strategies for optimal re-rendering
export { 
  compareValues,
  setGlobalComparisonOptions,
  getGlobalComparisonOptions,
  type ComparisonOptions, 
  type ComparisonStrategy,
  type CustomComparator 
} from './comparison';

// === IMMUTABILITY UTILITIES ===
// Safe mutation and immutability helpers (powered by @context-action/mutative)
export {
  safeGet,
  safeSet,
  deepClone,
  getGlobalImmutabilityOptions,
} from '@context-action/mutative';

// === STORE SELECTORS ===
// Store selector utilities - useStoreSelector moved to hooks for consistency

// === GENERAL UTILITIES ===
// Common store helper functions (createStore removed - use core/Store.createStore instead)

// === ACTION HANDLER UTILITIES ===
// Moved to actions/utils - use import from '@context-action/react/actions'

// === PROVIDER COMPOSITION ===
// Provider composition utilities for managing multiple contexts
export { 
  composeProviders,
  type ProviderComponent
} from './provider-composition';

// === TYPE HELPERS ===
// Enhanced type utilities and helpers
export type {
  StoreValue,
  StoresValues,
  StoreRecordValues,
  StoreSelector,
  EqualityFunction,
  StoreListener,
  StoreUpdater,
  DeepReadonly,
  StoreInitConfig,
  PartialBy,
  RequiredBy
} from './type-helpers';

// === JSON POINTER UTILITIES ===
// RFC 6901 compliant path utilities for patch-based subscriptions
export {
  escapeSegment,
  unescapeSegment,
  pathToPointer,
  pointerToPath,
  isPointerPrefix,
  arePointersRelated,
  pathToKey, // Alias for pathToPointer
  isPathPrefix, // Alias for isPointerPrefix
  type JsonPointerPath
} from './json-pointer';
