/**
 * @fileoverview Store system exports
 * @implements store-integration-pattern
 * @implements model-layer
 * @implements mvvm-pattern
 * @memberof core-concepts
 * 
 * Core store system for Context-Action framework using Declarative Store Pattern
 * for type-safe store management similar to Action Registry pattern.
 */

// === DECLARATIVE STORE PATTERN ===
// Primary pattern for type-safe store management
export * from './patterns';

// === CORE STORE SYSTEM ===
// Fundamental store classes and registry
export * from './core';

// === REACT HOOKS ===
// Store hooks for React integration
export * from './hooks';

// === UTILITIES ===
// Comparison, immutability, and helper functions
export * from './utils';

// === RE-EXPORTS FOR CONVENIENCE ===
// Common imports expected from the main store module

// Primary factory functions
export { createDeclarativeStorePattern, createDeclarativeStores } from './patterns';

// Declarative Store Pattern types
export type {
  StoreConfig,
  StoreSchema,
  InitialStores,
  StoreDefinitions,
  InferStoreTypes,
  InferInitialStores,
  StoreValues,
  WithProviderConfig
} from './patterns';

// Core types
export type {
  IStore,
  IStoreRegistry,
  Snapshot
} from './core';

// Utility types
export type {
  ComparisonOptions,
  ComparisonStrategy
} from './utils';