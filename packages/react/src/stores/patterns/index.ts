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
 */

// === DECLARATIVE STORE PATTERN ===
// Type-safe declarative store management
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