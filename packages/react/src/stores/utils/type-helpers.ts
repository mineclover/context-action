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
