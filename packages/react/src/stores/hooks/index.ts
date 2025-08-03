/**
 * @fileoverview Store hooks exports - React hooks for store interaction
 * @implements store-hooks
 * @implements fresh-state-access
 * @implements view-layer
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Provides React hooks for interacting with stores, including subscription hooks,
 * registry hooks, and specialized patterns like local and persisted stores.
 */

// === CORE STORE HOOKS ===
// Essential hooks for store management
export { useStoreSelector as useStore } from '../utils/store-selector';
export { useStoreValue, useStoreValues } from './useStoreValue';
export { useStoreActions } from './useStoreActions';

// === REGISTRY HOOKS ===
// For dynamic store management
export { useRegistry } from './useRegistry';
export { useRegistryStore } from './useRegistryStore';

// === SPECIALIZED HOOKS ===
// Optional but useful patterns
export { useLocalStore } from './useLocalStore';
export { usePersistedStore } from './usePersistedStore';