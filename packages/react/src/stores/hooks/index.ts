/**
 * @fileoverview Store hooks exports - React hooks for store interaction
 * @implements store-hooks
 * @implements fresh-state-access
 * @implements view-layer
 * @memberof api-terms
 * @since 2.0.0
 * 
 * React hooks for store interaction. For new development, prefer using
 * createDeclarativeStores() which provides type-safe store access similar
 * to Action Registry pattern with compile-time type inference.
 * 
 * @example
 * // ✅ Recommended approach (v2.0+)
 * interface AppStores extends StorePayloadMap {
 *   user: { id: string; name: string };
 * }
 * 
 * const AppStores = createDeclarativeStores('App', {
 *   user: { initialValue: { id: '', name: '' } }
 * });
 * 
 * const userStore = AppStores.useStore('user'); // Type: Store<{id: string, name: string}>
 * 
 * // ❌ Legacy approach (limited type inference)
 * const { useStore } = createContextStorePattern('myDomain');
 * const store = useStore('user'); // Type: any
 * 
 * // ❌ Direct import (no domain isolation)
 * import { useStore } from '@context-action/react';
 */

// === CORE STORE HOOKS ===
// Essential hooks for store management (consider Context Store Pattern instead)
export { useStoreSelector as useStore } from '../utils/store-selector';
export { useStoreValue, useStoreValues } from './useStoreValue';
export { useStoreValueSafe, assertStoreValue } from './useStoreValueSafe';
export { useStoreActions } from './useStoreActions';

// === REGISTRY HOOKS ===
// For dynamic store management (prefer Context Store Pattern hooks)
export { useRegistry } from './useRegistry';
export { useRegistryStore } from './useRegistryStore';

// === SPECIALIZED HOOKS ===
// Optional but useful patterns
export { useLocalStore } from './useLocalStore';
export { usePersistedStore } from './usePersistedStore';