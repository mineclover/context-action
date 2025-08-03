/**
 * @fileoverview Store patterns exports - advanced patterns and isolation utilities
 * @implements cross-store-coordination
 * @implements store-factory-functions
 * @implements separation-of-concerns
 * @implements mvvm-pattern
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Advanced store patterns including Context Store Pattern for store isolation,
 * HOC patterns for automatic provider wrapping, and isolation utilities for
 * managing store boundaries and coordination.
 */

// === CONTEXT STORE PATTERN ===
// Main pattern for store isolation and coordination
export { 
  createContextStorePattern,
  PageStores
} from './context-store-pattern';

// === ISOLATION UTILITIES ===
// Store isolation and boundary management
export { 
  generateStoreName,
  getOrCreateRegistryStore
} from './isolation-utils';

// === ISOLATION HOOKS ===
// React hooks for isolation patterns
export { 
  useIsolatedStore
} from './isolation-hooks';