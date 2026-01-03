/**
 * @fileoverview Path-based Store Subscription Hook
 *
 * Optimized hook that only triggers re-renders when specific paths change.
 * Uses JSON patches from Store to determine if subscribed paths are affected.
 */

import { useSyncExternalStore, useCallback, useRef, useMemo } from 'react';
import type { Patches } from '@context-action/mutative';
import type { Unsubscribe } from '../core/types';
import { pathToPointer, isPointerPrefix } from '../utils/json-pointer';

/**
 * Store interface that supports patch-aware subscriptions
 * Compatible with Store and TimeTravelStore
 */
export interface PatchAwareStore<T> {
  getValue(): T;
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

// Use JSON Pointer utilities
const pathToKey = pathToPointer;
const isPathPrefix = isPointerPrefix;

/**
 * Check if patches affect the target path
 * A patch affects a path if:
 * 1. The patch path is a prefix of target path (parent/ancestor changed)
 * 2. The target path is a prefix of patch path (descendant changed)
 * 3. The paths are exactly equal
 *
 * Uses JSON Pointer string comparison with proper boundary handling
 */
function patchesAffectPath(patches: Patches | null, targetPath: StorePath, targetPathKey?: string): boolean {
  if (!patches || patches.length === 0) return true; // No patches = full update

  // Use pre-computed key if available, otherwise compute
  const targetKey = targetPathKey ?? pathToKey(targetPath);

  return patches.some(patch => {
    const patchPath = patch.path as StorePath;

    // Empty patch path means root replacement
    if (patchPath.length === 0) return true;

    const patchKey = pathToKey(patchPath);

    // Check path relationship (either direction) with proper boundary handling
    // isPathPrefix(patchKey, targetKey) = parent/ancestor changed
    // isPathPrefix(targetKey, patchKey) = descendant changed
    return isPathPrefix(patchKey, targetKey) || isPathPrefix(targetKey, patchKey);
  });
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

  // Memoize path key for stable comparison and optimized patch matching
  // Using JSON.stringify for stable dependency (path array reference may change)
  const pathKey = useMemo(() => pathToKey(path), [JSON.stringify(path)]);

  // Cache for value comparison with path tracking for invalidation
  const cacheRef = useRef<{ value: R; initialized: boolean; pathKey: string }>({
    value: undefined as R,
    initialized: false,
    pathKey: '',
  });

  // Invalidate cache when path changes
  if (cacheRef.current.pathKey !== pathKey) {
    cacheRef.current = { value: undefined as R, initialized: false, pathKey };
  }

  // Subscribe with patch awareness
  const subscribe = useCallback(
    (callback: () => void) => {
      return store.subscribeWithPatches((patches) => {
        // Check if patches affect our path (using pre-computed key)
        if (patchesAffectPath(patches, path, pathKey)) {
          callback();
        }
      });
    },
    [store, pathKey]
  );

  // Get snapshot of value at path
  const getSnapshot = useCallback((): R => {
    const storeValue = store.getValue();
    const currentValue = getValueAtPath<T, R>(storeValue, path);

    // First access - initialize cache
    if (!cacheRef.current.initialized) {
      cacheRef.current = { value: currentValue, initialized: true, pathKey };
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
  }, [store, pathKey, equalityFn]);

  // Server snapshot
  const getServerSnapshot = useCallback((): R => {
    return getValueAtPath<T, R>(store.getValue(), path);
  }, [store, pathKey]);

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

  // Stable serialization of dependsOn for dependency tracking
  const dependsOnKey = useMemo(
    () => (dependsOn ? JSON.stringify(dependsOn) : null),
    [dependsOn ? JSON.stringify(dependsOn) : null]
  );

  // Cache for value comparison with dependency tracking
  const cacheRef = useRef<{ value: R | undefined; depsKey: string | null }>({
    value: undefined,
    depsKey: null,
  });

  // Pre-compute path keys for all dependencies (optimized matching)
  const pathKeys = useMemo(
    () => (dependsOn ? dependsOn.map(p => ({ path: p, key: pathToKey(p) })) : null),
    [dependsOnKey]
  );

  // Create stable dependency key for memoization
  const depsKey = useMemo(
    () => (pathKeys ? pathKeys.map(pk => pk.key).sort().join('|') : null),
    [pathKeys]
  );

  // Invalidate cache when dependencies change
  if (cacheRef.current.depsKey !== depsKey) {
    cacheRef.current = { value: undefined, depsKey };
  }

  // Subscribe with patch awareness
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!pathKeys) {
        // No path hints - subscribe to all changes
        return store.subscribe(callback);
      }

      return store.subscribeWithPatches((patches) => {
        // Check if any dependent path is affected (using pre-computed keys)
        const affected = pathKeys.some(({ path, key }) => patchesAffectPath(patches, path, key));
        if (affected) {
          callback();
        }
      });
    },
    [store, depsKey]
  );

  // Get snapshot using selector
  const getSnapshot = useCallback((): R => {
    const storeValue = store.getValue();
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
