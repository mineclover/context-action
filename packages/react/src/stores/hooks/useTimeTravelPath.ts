/**
 * @fileoverview Path-based Time Travel Subscription Hook
 *
 * Optimized hook that only triggers re-renders when specific paths change.
 * Uses JSON patches from TimeTravelStore to determine if subscribed paths are affected.
 */

import { useSyncExternalStore, useCallback, useRef, useMemo } from 'react';
import { TimeTravelStore } from '../core/TimeTravelStore';
import type { Patches } from '@context-action/mutative';

/**
 * Path type for store subscription
 */
export type StorePath = (string | number)[];

/**
 * Options for useTimeTravelPath
 */
export interface UseTimeTravelPathOptions<R> {
  /** Custom equality function for the selected value */
  equalityFn?: (a: R, b: R) => boolean;
}

/**
 * Check if patches affect the target path
 * A patch affects a path if:
 * 1. The patch path is a prefix of target path (parent changed)
 * 2. The target path is a prefix of patch path (descendant changed)
 * 3. The paths are equal
 */
function patchesAffectPath(patches: Patches | null, targetPath: StorePath): boolean {
  if (!patches || patches.length === 0) return true; // No patches = full update

  return patches.some(patch => {
    const patchPath = patch.path as StorePath;

    // Empty patch path means root replacement
    if (patchPath.length === 0) return true;

    const minLen = Math.min(patchPath.length, targetPath.length);

    // Check if paths share a common prefix
    for (let i = 0; i < minLen; i++) {
      if (patchPath[i] !== targetPath[i]) return false;
    }

    // Paths share common prefix - affected
    return true;
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
 * Hook for subscribing to a specific path in TimeTravelStore
 *
 * Only triggers re-renders when the value at the specified path changes,
 * determined by analyzing JSON patches from state updates.
 *
 * @example
 * ```tsx
 * const store = createTimeTravelStore('app', {
 *   user: { name: 'John', age: 30 },
 *   settings: { theme: 'dark' }
 * });
 *
 * function UserName() {
 *   // Only re-renders when user.name changes
 *   const name = useTimeTravelPath(store, ['user', 'name']);
 *   return <span>{name}</span>;
 * }
 *
 * function Theme() {
 *   // Only re-renders when settings.theme changes
 *   const theme = useTimeTravelPath(store, ['settings', 'theme']);
 *   return <span>{theme}</span>;
 * }
 * ```
 */
export function useTimeTravelPath<T, R = unknown>(
  store: TimeTravelStore<T>,
  path: StorePath,
  options: UseTimeTravelPathOptions<R> = {}
): R {
  const { equalityFn } = options;

  // Memoize path key for stable comparison
  const pathKey = useMemo(() => path.join('.'), [path]);

  // Cache for value comparison
  const cacheRef = useRef<{ value: R; initialized: boolean }>({
    value: undefined as R,
    initialized: false,
  });

  // Subscribe with patch awareness
  const subscribe = useCallback(
    (callback: () => void) => {
      return store.subscribeWithPatches((patches) => {
        // Check if patches affect our path
        if (patchesAffectPath(patches, path)) {
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
      cacheRef.current = { value: currentValue, initialized: true };
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
 * const fullName = useTimeTravelSelector(
 *   store,
 *   (state) => `${state.user.firstName} ${state.user.lastName}`,
 *   { dependsOn: [['user', 'firstName'], ['user', 'lastName']] }
 * );
 * ```
 */
export interface UseTimeTravelSelectorOptions<R> {
  /** Paths that the selector depends on */
  dependsOn?: StorePath[];
  /** Custom equality function */
  equalityFn?: (a: R, b: R) => boolean;
}

export function useTimeTravelSelector<T, R>(
  store: TimeTravelStore<T>,
  selector: (value: T) => R,
  options: UseTimeTravelSelectorOptions<R> = {}
): R {
  const { dependsOn, equalityFn } = options;

  // Cache for value comparison
  const cacheRef = useRef<R>();

  // Create stable path key for dependencies
  const depsKey = useMemo(
    () => (dependsOn ? dependsOn.map(p => p.join('.')).sort().join('|') : null),
    [dependsOn]
  );

  // Subscribe with patch awareness
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!dependsOn) {
        // No path hints - subscribe to all changes
        return store.subscribe(callback);
      }

      return store.subscribeWithPatches((patches) => {
        // Check if any dependent path is affected
        const affected = dependsOn.some(path => patchesAffectPath(patches, path));
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
    if (cacheRef.current !== undefined) {
      const prevValue = cacheRef.current;

      if (equalityFn) {
        if (equalityFn(prevValue, currentValue)) {
          return prevValue;
        }
      } else if (Object.is(prevValue, currentValue)) {
        return prevValue;
      }
    }

    cacheRef.current = currentValue;
    return currentValue;
  }, [store, selector, equalityFn]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
