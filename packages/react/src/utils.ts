// ==============================================
// UTILS INDEX - Utility Functions
// ==============================================

// Immutability utilities (powered by @context-action/mutative)
export {
  deepClone,
  safeGet,
  safeSet,
  MutativeUtils,
  produce
} from '@context-action/mutative';

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