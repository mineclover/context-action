// ==============================================
// UTILS INDEX - Utility Functions
// ==============================================

// Immutability utilities
export { 
  deepClone,
  deepCloneWithImmer,
  safeGet,
  safeSet,
  ImmerUtils,
  preloadImmer,
  produce
} from './stores/utils/immutable';

// Comparison utilities
export { 
  compareValues,
  setGlobalComparisonOptions,
  getGlobalComparisonOptions
} from './stores/utils/comparison';
export type {
  ComparisonOptions,
  ComparisonStrategy,
  CustomComparator
} from './stores/utils/comparison';

// Type utilities
export {
  isStore,
  isValidStoreValue,
  extractStoreValue,
  extractStoreValues,
  createSafeEqualityFn,
  createStoreConfig,
  TypeUtils
} from './stores/utils/type-helpers';
export type {
  StoreValue,
  StoresValues,
  StoreRecordValues,
  StoreSelector,
  EqualityFunction,
  StoreListener,
  StoreUpdater,
  DeepReadonly,
  StoreInitConfig,
  PartialBy,
  RequiredBy
} from './stores/utils/type-helpers';

// Provider composition
export { 
  composeProviders
} from './stores/utils/provider-composition';
export type {
  ProviderComponent
} from './stores/utils/provider-composition';

// Subscription management
export {
  SubscriptionManager,
  useSubscriptionManager
} from './stores/utils/subscription-manager';
export type {
  SubscriptionEntry,
  SubscriptionStats
} from './stores/utils/subscription-manager';