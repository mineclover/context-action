/**
 * @fileoverview Store system exports - comprehensive store functionality
 * @implements store-integration-pattern
 * @implements model-layer
 * @implements mvvm-pattern
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Complete store system including core classes, React hooks, utility functions,
 * advanced patterns, and integration helpers. This module provides everything
 * needed for store management in the Context-Action framework.
 */

// === CORE STORE SYSTEM ===
// Fundamental store classes and registry
export * from './core';

// === REACT HOOKS ===
// All store-related React hooks
export * from './hooks';

// === UTILITIES ===
// Comparison, immutability, and helper functions
export * from './utils';

// === ADVANCED PATTERNS ===
// Context Store Pattern and isolation utilities
export * from './patterns';

// === RE-EXPORTS FOR CONVENIENCE ===
// Common imports that users expect from the main store module

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

// Main factory functions  
export { createContextStorePattern } from './patterns';