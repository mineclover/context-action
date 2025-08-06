/**
 * @fileoverview Store patterns exports
 * @implements cross-store-coordination
 * @implements store-factory-functions
 * @implements separation-of-concerns
 * @implements mvvm-pattern
 * @memberof core-concepts
 * @since 2.0.0
 * 
 * Declarative Store Pattern is the recommended approach for type-safe store
 * management with Action Registry-style schema definition. Provides compile-time
 * type inference and singleton behavior for consistent data management.
 * 
 * @example
 * // ✅ Recommended: Declarative Store Pattern (v2.0+)
 * interface AppStores extends StorePayloadMap {
 *   user: { id: string; name: string };
 *   settings: { theme: 'light' | 'dark' };
 * }
 * 
 * const AppStores = createDeclarativeStores('App', {
 *   user: { initialValue: { id: '', name: '' } },
 *   settings: { initialValue: { theme: 'light' } }
 * });
 * 
 * const userStore = AppStores.useStore('user'); // Type: Store<{id: string, name: string}>
 * 
 * // ❌ Legacy: Context Store Pattern (deprecated)
 * const { useStore } = createContextStorePattern('myDomain');
 * const store = useStore('user'); // Type: any
 */

// === DECLARATIVE STORE PATTERN (PRIMARY) ===
// Recommended pattern for type-safe declarative store management
export { 
  createDeclarativeStores,
  createDeclarativeStorePattern,
  DeclarativeStoreRegistry,
  type StorePayloadMap,
  type StoreSchema,
  type StoreConfig,
  type StoreAccess,
  type StoreCreation
} from './declarative-store-registry';

// === DECLARATIVE EXAMPLES ===
// Usage examples and best practices
export {
  UserStores,
  ShoppingStores,
  DashboardStores,
  UserProfile,
  ShoppingCart,
  AnalyticsDashboard,
  TypeSafetyExample
} from './declarative-examples';

// === LEGACY CONTEXT STORE PATTERN ===
// @deprecated Use createDeclarativeStores instead
export { 
  createContextStorePattern,
  PageStores,
  ComponentStores,
  DemoStores,
  TestStores
} from './context-store-pattern';

// === ISOLATION UTILITIES ===
// Store isolation and boundary management (used by legacy patterns)
export { 
  generateStoreName,
  getOrCreateRegistryStore
} from './isolation-utils';

// === LEGACY ISOLATION HOOKS ===
// @deprecated Use Declarative Store Pattern instead
export { 
  useIsolatedStore
} from './isolation-hooks';