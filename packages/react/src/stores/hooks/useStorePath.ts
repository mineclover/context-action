/**
 * @fileoverview Path-based Store Subscription Hook
 *
 * Optimized hook that only triggers re-renders when specific paths change.
 * Uses JSON patches from Store to determine if subscribed paths are affected.
 */

import type { StateSnapshot } from '@context-action/store-core';
import { useCallback, useDebugValue, useRef, useSyncExternalStore } from 'react';
import type { Unsubscribe } from '../core/types';
import { patchesAffectPath, type StorePathPatch } from '../utils/patch-affects-path';
import { createPathSignature, createPathsSignature } from '../utils/path-signature';
import { defaultEqualityFn } from './useStoreSelector';

function formatStorePathDebugValue([key, value]: readonly [string, unknown]): string {
  return `${key || '(root)'}: ${typeof value === 'object' && value !== null ? 'object' : String(value)}`;
}

export type { StorePathPatch } from '../utils/patch-affects-path';

/**
 * Store interface that supports patch-aware subscriptions
 * Compatible with Store, TimeTravelStore and structurally typed backend stores.
 * Patch payloads are observed, never mutated or copied by this boundary.
 */
export interface PatchAwareStore<T> {
  getValue?(): T;
  /** Stable external-store snapshot; custom legacy stores may omit it. */
  getSnapshot?: () => StateSnapshot<T>;
  subscribe(listener: () => void): Unsubscribe;
  subscribeWithPatches?(listener: (patches: readonly StorePathPatch[] | null) => void): Unsubscribe;
  subscribePaths?(paths: readonly Readonly<StorePath>[], listener: () => void): Unsubscribe;
}

/**
 * Path type for store subscription
 */
export type StorePath = (string | number)[];

/**
 * Recursively resolves the value type at a literal path tuple `P` within state `T`.
 */
export type PathValue<
  T,
  P extends readonly (string | number)[],
> = P extends readonly []
  ? T
  : P extends readonly [infer Head, ...infer Tail extends readonly (string | number)[]]
    ? T extends null | undefined
      ? undefined
      : T extends readonly (infer Elem)[]
        ? Head extends number
          ? PathValue<Elem | undefined, Tail>
          : Head extends keyof T
            ? PathValue<T[Head], Tail>
            : unknown
        : Head extends keyof NonNullable<T>
          ? T extends NonNullable<T>
            ? PathValue<NonNullable<T>[Head], Tail>
            : PathValue<NonNullable<T>[Head], Tail> | undefined
          : Head extends `${number}`
            ? NonNullable<T> extends readonly (infer Elem)[]
              ? PathValue<Elem | undefined, Tail>
              : unknown
            : unknown
    : unknown;

/**
 * Options for useStorePath
 */
export interface UseStorePathOptions<R> {
  /** Custom equality function for the selected value */
  equalityFn?: (a: R, b: R) => boolean;
}

/**
 * Get value at a specific path
 */
function getValueAtPath<T, R>(obj: T, path: Readonly<StorePath>): R {
  let current: unknown = obj;

  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined as R;
    }
    current = (current as Record<string | number, unknown>)[key];
  }

  return current as R;
}

function readStoreValue<T>(store: PatchAwareStore<T>): T {
  // null/undefined can be intentional state, not a missing snapshot capability.
  if (typeof store.getSnapshot === 'function') {
    return store.getSnapshot().value;
  }
  if (typeof store.getValue === 'function') {
    return store.getValue();
  }
  throw new Error('Store must implement getSnapshot() or getValue()');
}

function arePathSegmentsEqual(
  left: Readonly<StorePath>,
  right: Readonly<StorePath>
): boolean {
  if (left === right) return true;
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (!Object.is(left[index], right[index])) {
      return false;
    }
  }
  return true;
}

function arePathListsEqual(
  left: readonly StorePath[] | undefined,
  right: readonly Readonly<StorePath>[] | undefined
): boolean {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (!arePathSegmentsEqual(left[index]!, right[index]!)) {
      return false;
    }
  }
  return true;
}

/**
 * Hook for subscribing to a specific path in Store
 *
 * Only triggers re-renders when the value at the specified path changes,
 * determined by analyzing JSON patches from state updates.
 *
 * @example
 * ```tsx
 * const store = createStore('app', {
 *   user: { name: 'John', age: 30 },
 *   settings: { theme: 'dark' }
 * });
 *
 * function UserName() {
 *   // Only re-renders when user.name changes
 *   const name = useStorePath(store, ['user', 'name']);
 *   return <span>{name}</span>;
 * }
 *
 * function Theme() {
 *   // Only re-renders when settings.theme changes
 *   const theme = useStorePath(store, ['settings', 'theme']);
 *   return <span>{theme}</span>;
 * }
 * ```
 */
export function useStorePath<
  T,
  const P extends readonly (string | number)[],
>(
  store: PatchAwareStore<T>,
  path: number extends P['length'] ? never : P,
  options?: UseStorePathOptions<PathValue<T, P>>,
): PathValue<T, P>;
export function useStorePath<T, R = unknown>(
  store: PatchAwareStore<T>,
  path: Readonly<StorePath>,
  options?: UseStorePathOptions<R>,
): R;
export function useStorePath<T, R = unknown>(
  store: PatchAwareStore<T>,
  path: Readonly<StorePath>,
  options: UseStorePathOptions<R> = {}
): R {
  const { equalityFn } = options;

  const stablePathRef = useRef<{ signature: string; path: StorePath } | null>(null);

  if (stablePathRef.current === null || !arePathSegmentsEqual(stablePathRef.current.path, path)) {
    stablePathRef.current = {
      signature: createPathSignature(path),
      path: [...path],
    };
  }

  const pathSignature = stablePathRef.current.signature;
  const stablePath = stablePathRef.current.path;

  // Cache for value comparison with path tracking for invalidation
  const cacheRef = useRef<{ value: R; initialized: boolean; pathSignature: string; store: PatchAwareStore<T> }>({
    value: undefined as R,
    initialized: false,
    pathSignature: '',
    store,
  });

  // Invalidate cache when path changes
  if (cacheRef.current.pathSignature !== pathSignature || cacheRef.current.store !== store) {
    cacheRef.current = { value: undefined as R, initialized: false, pathSignature, store };
  }

  // Prefer prefix-trie indexed subscription when available; fall back to patch scanning
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof store.subscribePaths === 'function') {
        return store.subscribePaths([stablePath], callback);
      }
      if (typeof store.subscribeWithPatches === 'function') {
        return store.subscribeWithPatches((patches) => {
          // Check if patches affect our path
          if (patchesAffectPath(patches, stablePath)) {
            callback();
          }
        });
      }
      return store.subscribe(callback);
    },
    [store, stablePath]
  );

  // Get snapshot of value at path
  const getSnapshot = useCallback((): R => {
    const storeValue = readStoreValue(store);
    const currentValue = getValueAtPath<T, R>(storeValue, stablePath);

    // First access - initialize cache
    if (!cacheRef.current.initialized) {
      cacheRef.current = { value: currentValue, initialized: true, pathSignature, store };
      return currentValue;
    }

    // Compare with cached value
    const prevValue = cacheRef.current.value;

    if (equalityFn) {
      if (equalityFn(prevValue, currentValue)) {
        return prevValue;
      }
    } else {
      // Default: reference equality for objects, value equality for primitives
      if (Object.is(prevValue, currentValue)) {
        return prevValue;
      }
    }

    cacheRef.current.value = currentValue;
    return currentValue;
  }, [store, stablePath, pathSignature, equalityFn]);

  // Server snapshot
  const getServerSnapshot = useCallback((): R => {
    return getValueAtPath<T, R>(readStoreValue(store), stablePath);
  }, [store, stablePath]);

  const selectedValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useDebugValue([pathSignature, selectedValue] as const, formatStorePathDebugValue);
  return selectedValue;
}

/**
 * Hook for subscribing to multiple paths with a selector
 *
 * @example
 * ```tsx
 * const fullName = useStoreSelector(
 *   store,
 *   (state) => `${state.user.firstName} ${state.user.lastName}`,
 *   { dependsOn: [['user', 'firstName'], ['user', 'lastName']] }
 * );
 * ```
 */
export interface UseStoreSelectorWithPathsOptions<R> {
  /** Paths that the selector depends on */
  dependsOn?: readonly Readonly<StorePath>[];
  /** Custom equality function */
  equalityFn?: (a: R, b: R) => boolean;
}

export function useStoreSelectorWithPaths<T, R>(
  store: PatchAwareStore<T>,
  selector: (value: T) => R,
  options: UseStoreSelectorWithPathsOptions<R> = {}
): R {
  const { dependsOn, equalityFn = defaultEqualityFn } = options;

  const stablePathsRef = useRef<{
    signature: string | null;
    paths: StorePath[] | undefined;
  } | null>(null);

  if (stablePathsRef.current === null || !arePathListsEqual(stablePathsRef.current.paths, dependsOn)) {
    stablePathsRef.current = {
      signature: createPathsSignature(dependsOn),
      paths: dependsOn?.map((path) => [...path]),
    };
  }

  const depsKey = stablePathsRef.current.signature;
  const stablePaths = stablePathsRef.current.paths;

  // Cache for value comparison with dependency tracking
  const cacheRef = useRef<{
    value: R;
    depsKey: string | null;
    store: PatchAwareStore<T>;
  } | undefined>(undefined);

  // Invalidate cache when dependencies change
  if (cacheRef.current && (cacheRef.current.depsKey !== depsKey || cacheRef.current.store !== store)) {
    cacheRef.current = undefined;
  }

  // Prefer prefix-trie indexed subscription when path hints & index are available
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!stablePaths) {
        return store.subscribe(callback);
      }
      if (typeof store.subscribePaths === 'function') {
        return store.subscribePaths(stablePaths, callback);
      }
      if (typeof store.subscribeWithPatches !== 'function') {
        return store.subscribe(callback);
      }

      return store.subscribeWithPatches((patches) => {
        // Check if any dependent path is affected
        const affected = stablePaths.some(path => patchesAffectPath(patches, path));
        if (affected) {
          callback();
        }
      });
    },
    [store, stablePaths]
  );

  // Get snapshot using selector
  const getSnapshot = useCallback((): R => {
    const storeValue = readStoreValue(store);
    const currentValue = selector(storeValue);

    // Compare with cached value
    const cached = cacheRef.current;
    if (cached?.store === store && cached.depsKey === depsKey) {
      const prevValue = cached.value;

      if (equalityFn(prevValue, currentValue)) {
        return prevValue;
      }
    }

    cacheRef.current = { value: currentValue, depsKey, store };
    return currentValue;
  }, [store, selector, equalityFn, depsKey]);

  const selected = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useDebugValue([depsKey ?? '(all)', selected] as const, formatStorePathDebugValue);
  return selected;
}
