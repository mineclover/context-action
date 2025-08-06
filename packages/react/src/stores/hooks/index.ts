/**
 * @fileoverview Store hooks exports - React hooks for store interaction
 * @implements store-hooks
 * @implements fresh-state-access
 * @implements view-layer
 * @memberof api-terms
 * @since 2.0.0
 * 
 * React hooks for store interaction. For new development, prefer using
 * createDeclarativeStores() which provides type-safe store access.
 * 
 * @example
 * // ✅ Recommended approach - Declarative Store Pattern
 * const AppStores = createDeclarativeStores('App', {
 *   user: { initialValue: { id: '', name: '' } }
 * });
 * 
 * const userStore = AppStores.useStore('user'); // Type: Store<{id: string, name: string}>
 * const user = useStoreValue(userStore);
 */

// === CORE STORE HOOKS ===
// Essential hooks for store management
export { useStoreSelector as useStore } from '../utils/store-selector';
export { useStoreValue, useStoreValues } from './useStoreValue';
export { useStoreValueSafe, assertStoreValue } from './useStoreValueSafe';
export { useStoreActions } from './useStoreActions';

// === REGISTRY HOOKS ===
// For dynamic store management
export { useRegistry } from './useRegistry';
export { useRegistryStore } from './useRegistryStore';

// === SPECIALIZED HOOKS ===
// Optional but useful patterns
export { useLocalStore } from './useLocalStore';
export { usePersistedStore } from './usePersistedStore';