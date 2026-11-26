import { useInsertionEffect, useMemo, useRef } from 'react';
import type { RefController } from './createRefContext';
import {
  disposeRefState,
  executeRefOperation,
  getOrCreateRefState,
  type InternalRefState,
  refDisposedError,
  runIfRefMounted,
  waitForRefMount,
} from './ref-state';
import type {
  RefOperation,
  RefOperationOptions,
  RefOperationResult,
  RefTarget,
} from './types';

export interface UseRefRegistryOptions {
  /** Default timeout (ms) applied by `waitForMount` / `waitForRefs` when omitted */
  defaultMountTimeout?: number;
  /** Disable wait timeouts even when `defaultMountTimeout` or per-call timeouts exist */
  disableTimeout?: boolean;
}

/**
 * Component-local typed registry for managing a fixed set of named imperative refs
 * without `createRefContext` validators or React re-renders.
 *
 * Choose among the 3 ref primitives by scope & key shape:
 * - `useRefRegistry<TRefs>()`: fixed compile-time named keys, component/scope-local, 0 re-renders.
 * - `useRefCollection<TTarget>()`: dynamic string-keyed lists (menus/rows), local, 0 re-renders.
 * - `createRefContext<TRefs>()`: fixed named keys shared across a React Context subtree (with optional mount-state hooks).
 */
export interface RefRegistry<TRefs extends object> {
  /** Return a referentially stable callback ref setter for key `name`. */
  setRef<K extends keyof TRefs>(name: K): (node: TRefs[K] | null) => void;
  /** Synchronously read the currently mounted target for `name`, or `null` if unmounted. */
  get<K extends keyof TRefs>(name: K): TRefs[K] | null;
  /** Return `true` when key `name` currently holds a non-null mounted target. */
  has<K extends keyof TRefs>(name: K): boolean;
  /** Synchronously run `operation` only when `name` is mounted; returns `null` otherwise. */
  executeIfMounted<K extends keyof TRefs, R>(
    name: K,
    operation: (target: TRefs[K]) => R,
  ): R | null;
  /** Return a cached `RefController<TRefs[K]>` handle (`setRef`, `withTarget`, `onMount`, `checkMountState`) for key `name`. */
  controller<K extends keyof TRefs>(name: K): RefController<TRefs[K]>;
  /** Resolve with `TRefs[K]` when `name` mounts (rejects on optional `timeoutMs` or unmount). */
  waitForMount<K extends keyof TRefs>(name: K, timeoutMs?: number): Promise<TRefs[K]>;
  /** Wait until all `names` are mounted (defaults to `options.defaultMountTimeout ?? 1000` ms unless `disableTimeout: true`). */
  waitForRefs<K extends keyof TRefs>(...names: K[]): Promise<Pick<TRefs, K>>;
  /** Return a shallow snapshot of all currently mounted ref targets. */
  getAll(): Partial<TRefs>;
  /** Reject pending mount waits and release all tracked ref entries immediately. */
  clear(): void;
}

function updateSlotTarget<T>(
  state: InternalRefState<T>,
  target: T | null,
): void {
  if (target === null) {
    state.target = null;
    state.isMounted = false;
    [...state.listeners].forEach(listener => listener());
    return;
  }

  state.target = target;
  state.isMounted = true;

  state.mountResolvers.forEach(resolve => resolve(target));
  state.mountResolvers.clear();
  state.mountRejectors.clear();
  state.mountPromise = null;

  [...state.mountCallbacks].forEach(callback => {
    try {
      callback(target);
    } catch (error) {
      console.error('[ContextAction] Error in ref mount callback.', error);
    }
  });

  [...state.listeners].forEach(listener => listener());
}

/**
 * Creates a component-local typed ref registry with cached `setRef` callbacks and
 * zero React re-renders when refs attach, update, or detach.
 *
 * Pair with `createScopedContext()` for self-contained widgets; use `useRefCollection()`
 * for dynamically keyed lists, or `createRefContext()` when sharing refs across distant descendants.
 */
export function useRefRegistry<TRefs extends object>(
  options?: UseRefRegistryOptions,
): RefRegistry<TRefs> {
  const statesRef = useRef<Map<string, InternalRefState<RefTarget>>>(new Map());
  const settersRef = useRef<Map<string, (node: RefTarget | null) => void>>(new Map());
  const controllersRef = useRef<Map<string, RefController<RefTarget>>>(new Map());
  const disposedRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useInsertionEffect(() => {
    disposedRef.current = false;
    const states = statesRef.current;
    return () => {
      disposedRef.current = true;
      states.forEach(disposeRefState);
      states.clear();
    };
  }, []);

  return useMemo<RefRegistry<TRefs>>(() => {
    const resolveTimeout = (explicitMs?: number): number | undefined => {
      const opts = optionsRef.current;
      if (opts?.disableTimeout) return undefined;
      const ms = explicitMs ?? opts?.defaultMountTimeout;
      return ms !== undefined && ms > 0 ? ms : undefined;
    };

    const getLiveState = (key: string): InternalRefState<RefTarget> | null => {
      if (disposedRef.current) return null;
      return getOrCreateRefState(statesRef.current, key);
    };

    const getExistingState = (key: string): InternalRefState<RefTarget> | undefined => {
      if (disposedRef.current) return undefined;
      return statesRef.current.get(key);
    };

    const makeSetter = <K extends keyof TRefs>(name: K): ((node: TRefs[K] | null) => void) => {
      const key = String(name);
      let cached = settersRef.current.get(key);
      if (!cached) {
        cached = (node: RefTarget | null) => {
          const state = getLiveState(key);
          if (!state) return;
          updateSlotTarget(state, node);
        };
        settersRef.current.set(key, cached);
      }
      return cached as (node: TRefs[K] | null) => void;
    };

    const waitSlot = <K extends keyof TRefs>(
      name: K,
      timeoutMs?: number,
      signal?: AbortSignal,
    ): Promise<TRefs[K]> => {
      const key = String(name);
      const state = getLiveState(key);
      if (!state) {
        const rejected = Promise.reject<TRefs[K]>(refDisposedError());
        void rejected.catch(() => {});
        return rejected;
      }
      return waitForRefMount(
        state as InternalRefState<TRefs[K]>,
        key,
        resolveTimeout(timeoutMs),
        signal,
      );
    };

    return {
      setRef<K extends keyof TRefs>(name: K) {
        return makeSetter(name);
      },

      get<K extends keyof TRefs>(name: K): TRefs[K] | null {
        const state = getExistingState(String(name));
        if (!state?.isMounted) return null;
        return state.target as TRefs[K] | null;
      },

      has<K extends keyof TRefs>(name: K): boolean {
        const state = getExistingState(String(name));
        return Boolean(state?.isMounted && state.target !== null);
      },

      executeIfMounted<K extends keyof TRefs, R>(
        name: K,
        operation: (target: TRefs[K]) => R,
      ): R | null {
        const state = getExistingState(String(name));
        if (!state) return null;
        return runIfRefMounted(
          state as InternalRefState<TRefs[K]>,
          operation as (target: TRefs[K] & RefTarget) => R,
        );
      },

      controller<K extends keyof TRefs>(name: K): RefController<TRefs[K]> {
        const key = String(name);
        let cached = controllersRef.current.get(key);
        if (!cached) {
          const setRef = makeSetter(name);
          const ctrl: RefController<TRefs[K]> = {
            setRef,
            get target(): TRefs[K] | null {
              const state = getExistingState(key);
              if (!state?.isMounted) return null;
              return state.target as TRefs[K] | null;
            },
            waitForMount: () => waitSlot(name),
            withTarget: <Result>(
              operation: RefOperation<TRefs[K] & RefTarget, Result>,
              opOptions?: RefOperationOptions,
            ): Promise<RefOperationResult<Result>> => {
              const state = getLiveState(key);
              if (!state) {
                return Promise.resolve({
                  success: false,
                  error: refDisposedError(),
                  timestamp: Date.now(),
                });
              }
              return executeRefOperation(
                state as InternalRefState<TRefs[K]>,
                operation,
                opOptions,
              );
            },
            onMount: (callback: (target: TRefs[K]) => void) => {
              const state = getLiveState(key);
              if (!state || state.disposed) return () => {};
              const typedCallback = callback as (target: RefTarget) => void;
              state.mountCallbacks.add(typedCallback);
              if (state.isMounted && state.target !== null) {
                typedCallback(state.target);
              }
              return () => {
                state.mountCallbacks.delete(typedCallback);
              };
            },
            executeIfMounted: <Result>(
              operation: (target: TRefs[K] & RefTarget) => Result,
            ): Result | null => {
              const state = getExistingState(key);
              if (!state) return null;
              return runIfRefMounted(
                state as InternalRefState<TRefs[K]>,
                operation,
              );
            },
            checkMountState: () => {
              const state = getExistingState(key);
              if (!state) {
                return {
                  isMounted: false,
                  isWaitingForMount: false,
                  target: null,
                };
              }
              return {
                isMounted: state.isMounted,
                isWaitingForMount: !state.isMounted && state.mountPromise !== null,
                target: (state.isMounted ? state.target : null) as TRefs[K] | null,
              };
            },
          };
          cached = ctrl as RefController<RefTarget>;
          controllersRef.current.set(key, cached);
        }
        return cached as RefController<TRefs[K]>;
      },

      waitForMount<K extends keyof TRefs>(
        name: K,
        timeoutMs?: number,
      ): Promise<TRefs[K]> {
        return waitSlot(name, timeoutMs);
      },

      async waitForRefs<K extends keyof TRefs>(...names: K[]): Promise<Pick<TRefs, K>> {
        const group = new AbortController();
        const timeoutMs = optionsRef.current?.disableTimeout
          ? undefined
          : (optionsRef.current?.defaultMountTimeout ?? 1000);
        try {
          const results = await Promise.all(
            names.map(async name => {
              const key = String(name);
              const state = getLiveState(key);
              if (!state) {
                throw refDisposedError();
              }
              const resolved = await waitForRefMount(
                state as InternalRefState<TRefs[K]>,
                key,
                timeoutMs,
                group.signal,
              );
              return [name, resolved] as const;
            }),
          );
          return Object.fromEntries(results) as Pick<TRefs, K>;
        } finally {
          group.abort();
        }
      },

      getAll(): Partial<TRefs> {
        const result: Partial<TRefs> = {};
        if (disposedRef.current) return result;
        statesRef.current.forEach((state, key) => {
          if (state.isMounted && state.target !== null) {
            (result as Record<string, unknown>)[key] = state.target;
          }
        });
        return result;
      },

      clear(): void {
        statesRef.current.forEach(disposeRefState);
        statesRef.current.clear();
      },
    };
  }, []);
}
