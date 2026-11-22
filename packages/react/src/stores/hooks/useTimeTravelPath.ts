/**
 * @fileoverview Path-based Time Travel Subscription Hook
 *
 * Thin specialization delegating to the canonical patch-aware subscription hooks
 * (`useStorePath` and `useStoreSelectorWithPaths`).
 */

import type { StateSnapshot } from '@context-action/store-core';
import {
  type PatchAwareStore,
  type PathValue,
  useStorePath,
  useStoreSelectorWithPaths,
  type StorePath,
} from './useStorePath';

/** Structural external store contract accepted by `useTimeTravelPath` and `useTimeTravelSelector`. */
export type TimeTravelPathStore<T> = PatchAwareStore<T> & {
  getSnapshot(): StateSnapshot<T>;
};

export type { StorePath };

/**
 * Options for useTimeTravelPath
 */
export interface UseTimeTravelPathOptions<R> {
  /** Custom equality function for the selected value */
  equalityFn?: (a: R, b: R) => boolean;
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
export function useTimeTravelPath<
  T,
  const P extends readonly (string | number)[],
>(
  store: TimeTravelPathStore<T>,
  path: number extends P['length'] ? never : P,
  options?: UseTimeTravelPathOptions<PathValue<T, P>>,
): PathValue<T, P>;
export function useTimeTravelPath<T, R = unknown>(
  store: TimeTravelPathStore<T>,
  path: Readonly<StorePath>,
  options?: UseTimeTravelPathOptions<R>,
): R;
export function useTimeTravelPath<T, R = unknown>(
  store: TimeTravelPathStore<T>,
  path: Readonly<StorePath>,
  options: UseTimeTravelPathOptions<R> = {}
): R {
  return useStorePath<T, R>(store, path, options);
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
  dependsOn?: readonly Readonly<StorePath>[];
  /** Custom equality function */
  equalityFn?: (a: R, b: R) => boolean;
}

export function useTimeTravelSelector<T, R>(
  store: TimeTravelPathStore<T>,
  selector: (value: T) => R,
  options: UseTimeTravelSelectorOptions<R> = {}
): R {
  return useStoreSelectorWithPaths<T, R>(store, selector, options);
}
