/**
 * @fileoverview Store system exports
 * @implements store-integration-pattern
 * @implements model-layer
 * @implements mvvm-pattern
 * @memberof core-concepts
 * @since 2.0.0
 * 
 * Core store system for Context-Action framework. The recommended approach
 * is to use createDeclarativeStores for type-safe declarative store management
 * similar to Action Registry pattern.
 */

// === RECOMMENDED APPROACH ===
// Declarative Store Pattern for type-safe store management (Primary)
export * from './patterns';

// === CORE STORE SYSTEM ===
// Fundamental store classes and registry
export * from './core';

// === REACT HOOKS ===
// Basic store hooks (prefer Declarative Store Pattern hooks)
export * from './hooks';

// === UTILITIES ===
// Comparison, immutability, and helper functions
export * from './utils';

// === RE-EXPORTS FOR CONVENIENCE ===
// Common imports that users expect from the main store module

// PRIMARY: Declarative Store Pattern (Recommended)
export { createDeclarativeStores, createDeclarativeStorePattern } from './patterns';

// Types for declarative pattern
export type {
  StorePayloadMap,
  StoreSchema,
  StoreConfig
} from './patterns';

// Core types and interfaces
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

// Pre-defined example stores for reference
export { 
  UserStores,
  ShoppingStores, 
  DashboardStores
} from './patterns';

// === LEGACY EXPORTS ===
// @deprecated Use createDeclarativeStores instead
export { createContextStorePattern } from './patterns';

// Legacy pre-defined patterns
export { 
  PageStores, 
  ComponentStores, 
  DemoStores, 
  TestStores 
} from './patterns';