/**
 * @fileoverview Store patterns exports
 * @implements cross-store-coordination
 * @implements store-factory-functions
 * @implements separation-of-concerns
 * @implements mvvm-pattern
 * @memberof core-concepts
 * @since 2.0.0
 * 
 * Declarative Store Pattern provides type-safe store management with Action Registry-style 
 * schema definition. Offers compile-time type inference and singleton behavior for 
 * consistent data management.
 * 
 * @example
 * // ✅ Declarative Store Pattern - Type-safe and clean
 * interface AppStores {
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
 */

// === DECLARATIVE STORE PATTERN V2 (Simplified) ===
// Unified and simplified store management with excellent type inference
export { 
  createDeclarativeStorePattern,
  type InitialStores,
  type StoreSchema,  // Deprecated alias for backward compatibility
  type StoreConfig,
  type InferInitialStores,
  type StoreValues,
  type WithProviderConfig
} from './declarative-store-pattern-v2';

// === LEGACY DECLARATIVE STORE PATTERN (Deprecated) ===
// @deprecated Use the new simplified createDeclarativeStorePattern from v2
export { 
  createDeclarativeStores,
  createDeclarativeStorePattern as createDeclarativeStorePatternLegacy,
  DeclarativeStoreRegistry,
  type StoreSchema as StoreSchemaLegacy,
  type StoreConfig as StoreConfigLegacy,
  type StoreAccess,
  type StoreCreation
} from './declarative-store-registry';

// === EXAMPLES ===
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