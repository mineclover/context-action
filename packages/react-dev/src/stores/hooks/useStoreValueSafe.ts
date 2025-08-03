import { useStoreSelector } from '../utils/store-selector';
import type { IStore } from '../core/types';

/**
 * Type-safe hook to get current value from a guaranteed non-null store
 * 
 * This hook provides strict type safety by only accepting non-null stores,
 * ensuring the returned value is never undefined when the store has an initial value.
 * 
 * @implements store-hooks
 * @implements type-safety
 * @memberof api-terms
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // Always safe - never returns undefined
 * const counterStore = createStore(0);
 * const count = useStoreValueSafe(counterStore); // number (never undefined)
 * 
 * // With selector - also always safe
 * const userStore = createStore({ name: 'John', age: 30 });
 * const userName = useStoreValueSafe(userStore, user => user.name); // string (never undefined)
 * ```
 */

// Store가 확정된 경우 - undefined 없이 안전한 타입
export function useStoreValueSafe<T>(store: IStore<T>): T;
export function useStoreValueSafe<T, R>(
  store: IStore<T>, 
  selector: (value: T) => R
): R;
export function useStoreValueSafe<T, R>(
  store: IStore<T>,
  selector?: (value: T) => R
): T | R {
  // Store null 검증
  if (!store) {
    throw new Error(
      'useStoreValueSafe: Store cannot be null or undefined. ' +
      'This hook guarantees type safety by requiring a valid store instance.'
    );
  }

  if (selector) {
    return useStoreSelector(store, {
      selector: (snapshot: any) => {
        const value = snapshot?.value;
        if (value === undefined && process.env.NODE_ENV === 'development') {
          console.warn(
            `useStoreValueSafe: Store "${store.name}" returned undefined value. ` +
            'This might indicate an initialization issue.'
          );
        }
        return selector(value);
      }
    });
  }
  
  return useStoreSelector(store, {
    selector: (snapshot: any) => {
      const value = snapshot?.value;
      if (value === undefined && process.env.NODE_ENV === 'development') {
        console.warn(
          `useStoreValueSafe: Store "${store.name}" returned undefined value. ` +
          'This might indicate an initialization issue.'
        );
      }
      return value;
    }
  });
}

/**
 * Create a type assertion helper for stores created with initial values
 */
export function assertStoreValue<T>(value: T | undefined, storeName: string): T {
  if (value === undefined) {
    throw new Error(
      `Store "${storeName}" returned undefined value. ` +
      'This should not happen with properly initialized stores.'
    );
  }
  return value;
}