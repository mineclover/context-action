/**
 * @fileoverview Store patterns exports
 * @implements cross-store-coordination
 * @implements store-factory-functions
 * @implements separation-of-concerns
 * @implements mvvm-pattern
 * @memberof core-concepts
 * 
 * Store Context Pattern provides type-safe store management with Action Registry-style 
 * schema definition. Offers compile-time type inference and singleton behavior for 
 * consistent data management.
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 */

// === UNIFIED STORE CONTEXT PATTERN ===
// Simplified and unified store management with excellent type inference
export { 
  createStoreContext,
  type InitialStores,
  type StoreConfig,
  type StoreDefinitions,
  type InferStoreTypes,
  type InferInitialStores,
  type StoreValues,
  type WithProviderConfig
} from './declarative-store-pattern-v2';

// === TYPE ALIASES ===
// For consistency
export { 
  type StoreConfig as StoreSchema
} from './declarative-store-pattern-v2';

