/**
 * Computed Store Pattern - Automated derived state management
 * 
 * Manages automatically computed derived state based on one or more stores.
 * Optimizes performance by recalculating only when dependencies change.
 * Essential for complex applications with derived data relationships.
 * 
 * @module stores/hooks/useComputedStore
 */

import { useRef, useCallback } from 'react';
import type { Store } from '../core/Store';
import { defaultEqualityFn } from './useStoreSelector';
import { useSafeStoreSubscription } from '../utils/sync-external-store-utils';

/**
 * Configuration options for computed store hooks
 * 
 * Comprehensive configuration interface for controlling computed store behavior,
 * including performance optimizations, debugging, error handling, and caching strategies.
 * 
 * @template R - Type of the computed value
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#performance-optimized-with-caching
 * 
 * @public
 */
export interface ComputedStoreConfig<R> {
  /** Equality comparison function for computed values */
  equalityFn?: (a: R, b: R) => boolean;
  
  /** Enable debug logging for computation tracking */
  debug?: boolean;
  
  /** Name identifier for the computed store (used in debugging) */
  name?: string;
  
  /** Initial value used before first computation */
  initialValue?: R;
  
  /** Error handler for computation failures */
  onError?: (error: Error) => void;
  
  /** Debounce delay for computation in milliseconds */
  debounceMs?: number;
  
  /** Enable result caching for performance optimization */
  enableCache?: boolean;
  
  /** Maximum number of cached results to maintain */
  cacheSize?: number;
}

/**
 * Hook for computed store based on a single source store
 * 
 * Creates a derived value that automatically recalculates when the source store changes.
 * Includes performance optimizations like caching, debouncing, and intelligent re-computation
 * to prevent unnecessary work. Perfect for derived state patterns.
 * 
 * @template T - Type of the source store value
 * @template R - Type of the computed result
 * 
 * @param store - Source store to derive from
 * @param compute - Function to compute derived value from store value
 * @param config - Optional configuration for performance and debugging
 * 
 * @returns The computed value that updates when source store changes
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#usecomputedstore-patterns
 * 
 * @public
 */
export function useComputedStore<T, R>(
  store: Store<T>,
  compute: (value: T) => R,
  config: ComputedStoreConfig<R> = {}
): R {
  const {
    equalityFn = defaultEqualityFn,
    debug = false,
    name = 'computed',
    onError,
    debounceMs,
    enableCache = false,
    cacheSize = 10,
    initialValue
  } = config;

  // Refs for stable references
  const computeRef = useRef(compute);
  const cacheRef = useRef<Map<T, R>>(new Map());
  const lastComputedRef = useRef<R | undefined>(undefined);
  const lastInputRef = useRef<T | undefined>(undefined);

  // Update compute function ref on every render
  computeRef.current = compute;

  // Cache management functions
  const getCachedValue = useCallback((input: T): R | undefined => {
    if (!enableCache) return undefined;

    // Check if we have exact same input reference
    if (lastInputRef.current === input && lastComputedRef.current !== undefined) {
      return lastComputedRef.current;
    }

    // Check cache map
    for (const [cachedInput, cachedOutput] of cacheRef.current) {
      if (defaultEqualityFn(cachedInput, input)) {
        if (debug) {
          console.debug(`useComputedStore [${name}]: Using cached value`);
        }
        return cachedOutput;
      }
    }

    return undefined;
  }, [enableCache, debug, name]);

  const setCachedValue = useCallback((input: T, output: R) => {
    if (!enableCache) return;

    // Update last computed values
    lastInputRef.current = input;
    lastComputedRef.current = output;

    // Update cache map
    cacheRef.current.set(input, output);

    // Limit cache size
    if (cacheRef.current.size > cacheSize) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey !== undefined) {
        cacheRef.current.delete(firstKey);
      }
    }

    if (debug) {
      console.debug(`useComputedStore [${name}]: Cache updated`, {
        cacheSize: cacheRef.current.size,
        input,
        output
      });
    }
  }, [enableCache, cacheSize, debug, name]);

  // Computation selector function for useSyncExternalStore
  const computeSelector = useCallback((value: T): R => {
    try {
      // Check cache first
      const cached = getCachedValue(value);
      if (cached !== undefined) {
        return cached;
      }

      // Perform computation
      const startTime = debug ? performance.now() : 0;
      const result = computeRef.current(value);

      if (debug) {
        const duration = performance.now() - startTime;
        console.debug(`useComputedStore [${name}]: Computed in ${duration.toFixed(2)}ms`, {
          input: value,
          result
        });
      }

      // Cache the result and update last computed
      setCachedValue(value, result);
      lastComputedRef.current = result;

      return result;
    } catch (error) {
      if (onError) {
        onError(error as Error);
        // Return last valid value or initial value on error
        const fallbackValue = lastComputedRef.current !== undefined
          ? lastComputedRef.current
          : initialValue as R;
        return fallbackValue;
      }

      if (debug) {
        console.error(`useComputedStore [${name}]: Error in computation:`, error);
      }

      // Re-throw if no error handler
      throw error;
    }
  }, [getCachedValue, setCachedValue, debug, name, onError, initialValue]);

  // Use optimized subscription with selector
  const computedValue = useSafeStoreSubscription(
    store,
    computeSelector,
    {
      equalityFn,
      debounce: debounceMs,
      debug,
      name: `computed-${name}`,
      initialValue
    }
  );

  return computedValue as R;
}
