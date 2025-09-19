/**
 * @fileoverview Enhanced Type Helpers
 * 
 * Advanced type utilities for improved type inference and type safety
 * throughout the Context-Action framework.
 */

import type { Store } from '../core/Store';

/**
 * Extract the value type from a Store
 */
export type StoreValue<S> = S extends Store<infer T> ? T : never;

/**
 * Extract value types from multiple stores
 */
export type StoresValues<S extends readonly Store<any>[]> = {
  [K in keyof S]: StoreValue<S[K]>
};

/**
 * Extract value types from a record of stores
 */
export type StoreRecordValues<S extends Record<string, Store<any>>> = {
  [K in keyof S]: StoreValue<S[K]>
};

/**
 * Type-safe store selector function type
 */
export type StoreSelector<T, R> = (value: T) => R;

/**
 * Type-safe equality function type
 */
export type EqualityFunction<T> = (a: T, b: T) => boolean;

/**
 * Store listener function type
 */
export type StoreListener = () => void;

/**
 * Store updater function type
 */
export type StoreUpdater<T> = (current: T) => T;

/**
 * Type guard for checking if a value is a Store
 */
export function isStore<T = unknown>(value: unknown): value is Store<T> {
  return (
    value != null &&
    typeof value === 'object' &&
    'subscribe' in value &&
    'getSnapshot' in value &&
    'setValue' in value &&
    'getValue' in value &&
    'name' in value &&
    typeof value.subscribe === 'function' &&
    typeof value.getSnapshot === 'function' &&
    typeof value.setValue === 'function' &&
    typeof value.getValue === 'function' &&
    typeof value.name === 'string'
  );
}

/**
 * Type guard for checking if a value is a valid store value
 */
export function isValidStoreValue<T>(value: unknown): value is T {
  // Basic validation - can be extended based on requirements
  return value !== undefined;
}

/**
 * Utility type for making certain properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for making certain properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Deep readonly type for immutable store values
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? DeepReadonlyArray<U>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

/**
 * Type for store initialization configuration
 */
export interface StoreInitConfig<T> {
  name: string;
  initialValue: T;
  validateValue?: (value: unknown) => value is T;
  transformValue?: (value: unknown) => T;
}

/**
 * Utility function for creating type-safe store configurations
 */
export function createStoreConfig<T>(config: StoreInitConfig<T>): StoreInitConfig<T> {
  return {
    ...config,
    validateValue: config.validateValue || isValidStoreValue,
  };
}

/**
 * Type-safe store value extractor
 */
export function extractStoreValue<T>(store: Store<T> | undefined | null): T | undefined {
  if (!store || !isStore(store)) {
    return undefined;
  }
  
  try {
    return store.getValue();
  } catch {
    return undefined;
  }
}

/**
 * Type-safe multiple store value extractor
 */
export function extractStoreValues<S extends Record<string, Store<any>>>(
  stores: S
): Partial<StoreRecordValues<S>> {
  const result = {} as Partial<StoreRecordValues<S>>;
  
  for (const [key, store] of Object.entries(stores)) {
    const value = extractStoreValue(store);
    if (value !== undefined) {
      (result as any)[key] = value;
    }
  }
  
  return result;
}

/**
 * Create a type-safe equality function with fallback
 */
export function createSafeEqualityFn<T>(
  customFn?: EqualityFunction<T>
): EqualityFunction<T> {
  return (a: T, b: T) => {
    try {
      return customFn ? customFn(a, b) : Object.is(a, b);
    } catch {
      // Fallback to reference equality on error
      return Object.is(a, b);
    }
  };
}

/**
 * Type utilities for store configuration validation
 */
export const TypeUtils = {
  /**
   * Validate store configuration at runtime
   */
  validateStoreConfig<T>(config: unknown): config is StoreInitConfig<T> {
    return (
      config != null &&
      typeof config === 'object' &&
      'name' in config &&
      typeof (config as Record<string, unknown>).name === 'string' &&
      (config as Record<string, unknown>).name !== '' &&
      'initialValue' in config
    );
  },

  /**
   * Validate store instance
   */
  validateStore<T>(store: unknown): store is Store<T> {
    return isStore(store);
  },

  /**
   * Get safe value with type checking
   */
  getSafeValue<T>(value: unknown, fallback: T): T {
    return value !== undefined && value !== null ? value as T : fallback;
  }
} as const;