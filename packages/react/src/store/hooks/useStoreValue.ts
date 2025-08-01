import { useStoreSync } from '../store-sync';
import type { IStore } from '../types';

/**
 * Hook to get current value from store with optional selector
 * @implements store-hooks
 * @memberof api-terms
 * @example
 * ```typescript
 * // Basic store subscription
 * const counterStore = createStore(0);
 * const count = useStoreValue(counterStore); // number | undefined
 * 
 * // Selective subscription (only re-renders when name changes)
 * const userStore = createStore({ id: '1', name: 'John', email: 'john@example.com' });
 * const userName = useStoreValue(userStore, user => user.name); // string | undefined
 * 
 * // Complex selector
 * const cartStore = createStore({ items: [{ id: '1', price: 10 }, { id: '2', price: 20 }] });
 * const totalPrice = useStoreValue(cartStore, cart => 
 *   cart.items.reduce((sum, item) => sum + item.price, 0)
 * ); // number | undefined
 * ```
 */
export function useStoreValue<T>(store: IStore<T> | undefined | null): T | undefined;
export function useStoreValue<T, R>(
  store: IStore<T> | undefined | null, 
  selector: (value: T) => R
): R | undefined;
export function useStoreValue<T, R>(
  store: IStore<T> | undefined | null,
  selector?: (value: T) => R
): T | R | undefined {
  if (selector) {
    return useStoreSync(store, {
      selector: snapshot => selector(snapshot.value)
    });
  }
  
  return useStoreSync(store, {
    selector: snapshot => snapshot.value
  }) as R | undefined;
}

/**
 * Hook to get multiple values from a store using selectors
 * @implements selective-subscription
 * @memberof api-terms
 * 
 * Optimizes re-renders by only updating when selected values change
 * 
 * @template T - Type of the store value
 * @template S - Type of the selectors object
 * @param store - The store to subscribe to
 * @param selectors - Object with selector functions
 * @returns Object with selected values
 * 
 * @example
 * ```typescript
 * const userStore = createStore({ 
 *   id: '1', 
 *   name: 'John', 
 *   email: 'john@example.com',
 *   settings: { theme: 'dark', notifications: true }
 * });
 * 
 * const { name, theme } = useStoreValues(userStore, {
 *   name: user => user.name,
 *   theme: user => user.settings.theme
 * });
 * // Only re-renders when name or theme changes
 * ```
 */
export function useStoreValues<T, S extends Record<string, (value: T) => any>>(
  store: IStore<T> | undefined | null,
  selectors: S
): { [K in keyof S]: ReturnType<S[K]> } | undefined {
  return useStoreSync(store, {
    selector: snapshot => {
      if (!snapshot?.value) return undefined;
      
      const result = {} as { [K in keyof S]: ReturnType<S[K]> };
      for (const [key, selector] of Object.entries(selectors)) {
        result[key as keyof S] = selector(snapshot.value);
      }
      return result;
    }
  });
}