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
  type StorePath,
  type StorePathOf,
  type UseStorePathSelectOptions,
  useStorePath,
  useStoreSelectorWithPaths,
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
 * Options for useTimeTravelPath with derived selection
 */
export type UseTimeTravelPathSelectOptions<V, R> = UseStorePathSelectOptions<V, R>;

type LiteralStorePath<P extends readonly (string | number)[]> =
  number extends P['length'] ? never : P;

type DynamicStorePath<P extends readonly (string | number)[]> =
  number extends P['length'] ? P : never;

type ExplicitReturnStorePath<R> = [R] extends [never] ? never : Readonly<StorePath>;

type DynamicPathList<D extends readonly Readonly<StorePath>[]> =
  number extends D[number]['length'] ? unknown : never;

/**
 * Subscribe to a single nested path in a `TimeTravelStore` or `TimelineBackend`.
 *
 * Re-renders only when the subscribed path (or an ancestor containing it) is affected
 * by patches—including undo/redo transitions. For multi-path combinations, prefer
 * `useTimeTravelSelector`.
 *
 * @example
 * ```tsx
 * const store = createTimeTravelStore('app', {
 *   user: { name: 'John', age: 30 },
 *   settings: { theme: 'dark' }
 * });
 *
 * function UserName() {
 *   const name = useTimeTravelPath(store, ['user', 'name']);
 *   const isJohn = useTimeTravelPath(store, ['user', 'name'], {
 *     select: (n) => n === 'John',
 *   });
 *   return <span>{name} ({isJohn ? 'active' : 'other'})</span>;
 * }
 * ```
 */
/** Subscribe to a literal timeline store path and derive a value with `{ select }`. */
export function useTimeTravelPath<
  T,
  const P extends StorePathOf<T>,
  R,
>(
  store: TimeTravelPathStore<T>,
  path: LiteralStorePath<P>,
  options: UseTimeTravelPathSelectOptions<PathValue<T, P>, R>,
): R;
/** Subscribe to a literal timeline store path and infer the value type at `P`. */
export function useTimeTravelPath<
  T,
  const P extends StorePathOf<T>,
>(
  store: TimeTravelPathStore<T>,
  path: LiteralStorePath<P>,
  options?: UseTimeTravelPathOptions<PathValue<T, P>>,
): PathValue<T, P>;
/** Subscribe with explicit `<T, R>` type arguments (legacy escape hatch). */
export function useTimeTravelPath<T, R = never>(
  store: TimeTravelPathStore<T>,
  path: ExplicitReturnStorePath<R>,
  options?: UseTimeTravelPathOptions<R>,
): R;
/** Subscribe to a dynamic runtime path array on a timeline store with `{ select }`. */
export function useTimeTravelPath<
  T,
  const P extends readonly (string | number)[],
  R,
>(
  store: TimeTravelPathStore<T>,
  path: DynamicStorePath<P>,
  options: UseTimeTravelPathSelectOptions<unknown, R>,
): R;
/** Subscribe to a dynamic runtime path array on a timeline store (returns `unknown`). */
export function useTimeTravelPath<
  T,
  const P extends readonly (string | number)[],
>(
  store: TimeTravelPathStore<T>,
  path: DynamicStorePath<P>,
  options?: UseTimeTravelPathOptions<unknown>,
): unknown;
export function useTimeTravelPath<T, R = unknown>(
  store: TimeTravelPathStore<T>,
  path: Readonly<StorePath>,
  options: UseTimeTravelPathOptions<R> & { select?: (value: unknown) => R } = {}
): R {
  return (useStorePath as unknown as (
    s: TimeTravelPathStore<T>,
    p: Readonly<StorePath>,
    o: UseTimeTravelPathOptions<R> & { select?: (value: unknown) => R }
  ) => R)(store, path, options);
}

/**
 * Options for `useTimeTravelSelector`.
 */
export interface UseTimeTravelSelectorOptions<R, T = unknown> {
  /** Compile-time validated paths that the selector depends on */
  dependsOn?: readonly StorePathOf<T>[];
  /** Custom equality function for the derived result */
  equalityFn?: (a: R, b: R) => boolean;
}

/**
 * Hook for subscribing to multiple timeline paths with a selector.
 * For single-path derived values, prefer `useTimeTravelPath(store, path, { select })`.
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
/** Subscribe to a timeline selector guarded by compile-time validated `dependsOn` paths. */
export function useTimeTravelSelector<T, R>(
  store: TimeTravelPathStore<T>,
  selector: (value: T) => R,
  options?: UseTimeTravelSelectorOptions<R, T>,
): R;
/** Subscribe to a timeline selector with dynamically constructed `dependsOn` runtime paths. */
export function useTimeTravelSelector<
  T,
  R,
  const D extends readonly Readonly<StorePath>[],
>(
  store: TimeTravelPathStore<T>,
  selector: (value: T) => R,
  options: {
    dependsOn?: D;
    equalityFn?: (a: R, b: R) => boolean;
  } & DynamicPathList<D>,
): R;
export function useTimeTravelSelector<T, R>(
  store: TimeTravelPathStore<T>,
  selector: (value: T) => R,
  options: {
    dependsOn?: readonly Readonly<StorePath>[];
    equalityFn?: (a: R, b: R) => boolean;
  } = {}
): R {
  return (useStoreSelectorWithPaths as unknown as (
    s: TimeTravelPathStore<T>,
    sel: (value: T) => R,
    o: { dependsOn?: readonly Readonly<StorePath>[]; equalityFn?: (a: R, b: R) => boolean }
  ) => R)(store, selector, options);
}
