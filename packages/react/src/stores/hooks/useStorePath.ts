/**
 * @fileoverview Path-based Store Subscription Hook
 *
 * Optimized hook that only triggers re-renders when specific paths change.
 * Uses JSON patches from Store to determine if subscribed paths are affected.
 */

import type { Patches } from '@context-action/mutative';
import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { Snapshot, Unsubscribe } from '../core/types';
import { patchesAffectPath } from '../utils/patch-affects-path';
import { createPathSignature, createPathsSignature } from '../utils/path-signature';

/**
 * Store interface that supports patch-aware subscriptions
 * Compatible with Store and TimeTravelStore
 */
export interface PatchAwareStore<T> {
  getValue(): T;
  /** Stable external-store snapshot; custom legacy stores may omit it. */
  getSnapshot?: () => Snapshot<T>;
  subscribe(listener: () => void): Unsubscribe;
  subscribeWithPatches(listener: (patches: Patches | null) => void): Unsubscribe;
}

/**
 * Path type for store subscription
 */
export type StorePath = (string | number)[];

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
function getValueAtPath<T, R>(obj: T, path: StorePath): R {
  let current: unknown = obj;

  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined as R;
    }
    current = (current as Record<string | number, unknown>)[key];
  }

  return current as R;
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
export function useStorePath<T, R = unknown>(
  store: PatchAwareStore<T>,
  path: StorePath,
  options: UseStorePathOptions<R> = {}
): R {
  const { equalityFn } = options;

  const pathSignature = createPathSignature(path);
  const stablePathRef = useRef<{ signature: string; path: StorePath }>({
    signature: pathSignature,
    path: [...path],
  });

  if (stablePathRef.current.signature !== pathSignature) {
    stablePathRef.current = { signature: pathSignature, path: [...path] };
  }

  const stablePath = stablePathRef.current.path;

  // Cache for value comparison with path tracking for invalidation
  const cacheRef = useRef<{ value: R; initialized: boolean; pathSignature: string }>({
    value: undefined as R,
    initialized: false,
    pathSignature: '',
  });

  // Invalidate cache when path changes
  if (cacheRef.current.pathSignature !== pathSignature) {
    cacheRef.current = { value: undefined as R, initialized: false, pathSignature };
  }

  // Subscribe with patch awareness
  const subscribe = useCallback(
    (callback: () => void) => {
      return store.subscribeWithPatches((patches) => {
        // Check if patches affect our path
        if (patchesAffectPath(patches, stablePath)) {
          callback();
        }
      });
    },
    [store, stablePath]
  );

  // Get snapshot of value at path
  const getSnapshot = useCallback((): R => {
    const storeValue = store.getSnapshot?.().value ?? store.getValue();
    const currentValue = getValueAtPath<T, R>(storeValue, stablePath);

    // First access - initialize cache
    if (!cacheRef.current.initialized) {
      cacheRef.current = { value: currentValue, initialized: true, pathSignature };
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
    return getValueAtPath<T, R>(store.getSnapshot?.().value ?? store.getValue(), stablePath);
  }, [store, stablePath]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
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
  dependsOn?: StorePath[];
  /** Custom equality function */
  equalityFn?: (a: R, b: R) => boolean;
}

export function useStoreSelectorWithPaths<T, R>(
  store: PatchAwareStore<T>,
  selector: (value: T) => R,
  options: UseStoreSelectorWithPathsOptions<R> = {}
): R {
  const { dependsOn, equalityFn } = options;

  const depsKey = createPathsSignature(dependsOn);
  const stablePathsRef = useRef<{
    signature: string | null;
    paths: StorePath[] | undefined;
  }>({
    signature: depsKey,
    paths: dependsOn?.map((path) => [...path]),
  });

  if (stablePathsRef.current.signature !== depsKey) {
    stablePathsRef.current = {
      signature: depsKey,
      paths: dependsOn?.map((path) => [...path]),
    };
  }

  const stablePaths = stablePathsRef.current.paths;

  // Cache for value comparison with dependency tracking
  const cacheRef = useRef<{ value: R | undefined; depsKey: string | null }>({
    value: undefined,
    depsKey: null,
  });

  // Invalidate cache when dependencies change
  if (cacheRef.current.depsKey !== depsKey) {
    cacheRef.current = { value: undefined, depsKey };
  }

  // Subscribe with patch awareness
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!stablePaths) {
        // No path hints - subscribe to all changes
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
    const storeValue = store.getSnapshot?.().value ?? store.getValue();
    const currentValue = selector(storeValue);

    // Compare with cached value
    if (cacheRef.current.value !== undefined) {
      const prevValue = cacheRef.current.value;

      if (equalityFn) {
        if (equalityFn(prevValue, currentValue)) {
          return prevValue;
        }
      } else if (Object.is(prevValue, currentValue)) {
        return prevValue;
      }
    }

    cacheRef.current.value = currentValue;
    return currentValue;
  }, [store, selector, equalityFn]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
