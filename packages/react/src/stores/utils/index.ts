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
// Safe mutation and immutability helpers
export { 
  safeGet, 
  safeSet, 
  deepClone,
  getGlobalImmutabilityOptions,
 
} from './immutable';

// === STORE SELECTORS ===
// Store selector utilities - useStoreSelector moved to hooks for consistency

// === GENERAL UTILITIES ===
// Common store helper functions (createStore removed - use core/Store.createStore instead)

// === ACTION HANDLER UTILITIES ===
// Moved to actions/utils - use import from '@context-action/react/actions'

// === REGISTRY SYNC ===
// Store registry synchronization utilities
export { createRegistrySync, RegistryUtils } from './registry-sync';

// === PROVIDER COMPOSITION ===
// Provider composition utilities for managing multiple contexts
export { 
  composeProviders,
  type ProviderComponent
} from './provider-composition';

// === SUBSCRIPTION MANAGEMENT ===
// Enhanced subscription management for memory leak prevention
export {
  SubscriptionManager,
  useSubscriptionManager,
  globalSubscriptionTracker,
  type SubscriptionEntry,
  type SubscriptionStats
} from './subscription-manager';


// === TYPE HELPERS ===
// Enhanced type utilities and helpers
export {
  isStore,
  isValidStoreValue,
  extractStoreValue,
  extractStoreValues,
  createSafeEqualityFn,
  createStoreConfig,
  TypeUtils,
  type StoreValue,
  type StoresValues,
  type StoreRecordValues,
  type StoreSelector,
  type EqualityFunction,
  type StoreListener,
  type StoreUpdater,
  type DeepReadonly,
  type StoreInitConfig,
  type PartialBy,
  type RequiredBy
} from './type-helpers';

