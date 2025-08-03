import { useStoreSelector } from '../utils/store-selector';
import type { IStore } from '../core/types';

/**
 * Hook to get current value from store with optional selector
 * @implements store-hooks
 * @implements fresh-state-access
 * @implements type-safety
 * @memberof api-terms
 * @since 1.0.0
 * @example
 * ```typescript
 * // Basic store subscription - with defined store
 * const counterStore = createStore(0);
 * const count = useStoreValue(counterStore); // number (never undefined)
 * 
 * // Store that might be undefined (need explicit check)
 * const maybeStore: IStore<number> | undefined = getStoreFromSomewhere();
 * const count = useStoreValue(maybeStore); // number | undefined
 * 
 * // Selective subscription (only re-renders when name changes)
 * const userStore = createStore({ id: '1', name: 'John', email: 'john@example.com' });
 * const userName = useStoreValue(userStore, user => user.name); // string (never undefined)
 * 
 * // Complex selector
 * const cartStore = createStore({ items: [{ id: '1', price: 10 }, { id: '2', price: 20 }] });
 * const totalPrice = useStoreValue(cartStore, cart => 
 *   cart.items.reduce((sum, item) => sum + item.price, 0)
 * ); // number (never undefined)
 * ```
 */
// Store가 확정된 경우 - undefined 없이 안전한 타입
export function useStoreValue<T>(store: IStore<T>): T;
// Store가 undefined일 수 있는 경우 - undefined 가능성 포함
export function useStoreValue<T>(store: IStore<T> | undefined | null): T | undefined;
// Store가 확정된 경우 + selector - undefined 없이 안전한 타입
export function useStoreValue<T, R>(
  store: IStore<T>, 
  selector: (value: T) => R
): R;
// Store가 undefined일 수 있는 경우 + selector - undefined 가능성 포함
export function useStoreValue<T, R>(
  store: IStore<T> | undefined | null, 
  selector: (value: T) => R
): R | undefined;
export function useStoreValue<T, R>(
  store: IStore<T> | undefined | null,
  selector?: (value: T) => R
): T | R | undefined {
  // Store가 null이나 undefined인 경우 런타임 에러 방지
  if (!store) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'useStoreValue: Store is null or undefined. ' +
        'This might indicate that the component is not wrapped in the proper Provider, ' +
        'or the store was not created correctly.'
      );
    }
    return undefined;
  }

  if (selector) {
    return useStoreSelector(store, {
      selector: (snapshot: any) => {
        if (!snapshot?.value && process.env.NODE_ENV === 'development') {
          console.warn(
            `useStoreValue: Store snapshot is empty for store "${store.name}". ` +
            'This might indicate an initialization issue.'
          );
        }
        return snapshot?.value ? selector(snapshot.value) : undefined;
      }
    });
  }
  
  return useStoreSelector(store, {
    selector: (snapshot: any) => {
      if (!snapshot?.value && process.env.NODE_ENV === 'development') {
        console.warn(
          `useStoreValue: Store snapshot is empty for store "${store.name}". ` +
          'This might indicate an initialization issue.'
        );
      }
      return snapshot?.value;
    }
  });
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
  return useStoreSelector(store, {
    selector: (snapshot: any) => {
      if (!snapshot?.value) return undefined;
      
      const result = {} as { [K in keyof S]: ReturnType<S[K]> };
      for (const [key, selector] of Object.entries(selectors)) {
        result[key as keyof S] = selector(snapshot.value);
      }
      return result;
    }
  });
}