/**
 * @fileoverview Store utilities exports - comparison, immutability, and helper functions
 * @implements computed-store
 * @implements performance-optimization
 * @implements store-immutability
 * @memberof core-concepts
 * @since 1.0.0
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
// Safe mutation and immutability helpers
export { 
  safeGet, 
  safeSet, 
  deepClone,
  getGlobalImmutabilityOptions,
  performantSafeGet 
} from './immutable';

// === STORE SELECTORS ===
// Store selector utilities - useStoreSelector moved to hooks for consistency

// === GENERAL UTILITIES ===
// Common store helper functions (createStore removed - use core/Store.createStore instead)
// export { createStore } from './utils';

// === ACTION HANDLER UTILITIES ===
// Moved to actions/utils - use import from '@context-action/react/actions'

// === REGISTRY SYNC ===
// Store registry synchronization utilities
export { createRegistrySync, RegistryUtils } from './registry-sync';

// NOTE: withStore HOC pattern is deprecated - use useLocalStore hook instead