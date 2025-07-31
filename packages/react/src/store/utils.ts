import type { IStore, IStoreRegistry } from "./types";
import { Store } from ".";

/**
 * Create a new store with the given initial value
 * Following ARCHITECTURE.md pattern for store creation
 * 
 * @template T - Type of the store value
 * @param initialValue - Initial value for the store
 * @param name - Optional name for the store (auto-generated if not provided)
 * @returns New Store instance
 * 
 * @example
 * ```typescript
 * // Simple store creation
 * const userStore = createStore<User>({
 *   id: '', 
 *   name: '', 
 *   email: '',
 *   updatedAt: 0
 * });
 * 
 * // Store with custom name
 * const counterStore = createStore(0, 'counter');
 * ```
 */
export function createStore<T>(initialValue: T, name?: string): Store<T> {
  const storeName = name || `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return new Store(storeName, initialValue);
}

/**
 * Create a computed store that derives its value from other stores
 * Following ARCHITECTURE.md pattern for computed stores
 * 
 * @template T - Type of the computed store value  
 * @template D - Array type of dependency stores
 * @param dependencies - Array of stores to depend on
 * @param compute - Function to compute the derived value
 * @param name - Optional name for the computed store
 * @returns New computed Store instance
 * 
 * @example
 * ```typescript
 * const cartSummaryStore = createComputedStore(
 *   [cartStore, inventoryStore, userStore],
 *   (cart, inventory, user) => {
 *     const validItems = cart.items.filter(item => 
 *       inventory[item.productId] && inventory[item.productId].stock >= item.quantity
 *     );
 *     const subtotal = validItems.reduce((sum, item) => 
 *       sum + (item.price * item.quantity), 0
 *     );
 *     const discount = calculateDiscount(user.membershipLevel, subtotal);
 *     const tax = calculateTax(subtotal - discount, user.location);
 *     
 *     return {
 *       itemCount: validItems.length,
 *       subtotal,
 *       discount,
 *       tax,
 *       total: subtotal - discount + tax
 *     };
 *   }
 * );
 * ```
 */
export function createComputedStore<T, D extends readonly IStore[]>(
  dependencies: D,
  compute: (...values: { [K in keyof D]: D[K] extends IStore<infer V> ? V : never }) => T,
  name?: string
): Store<T> {
  const storeName = name || `computed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Initial computation
  const initialValues = dependencies.map(store => store.getValue()) as any;
  const initialValue = compute(...initialValues);
  
  const computedStore = new Store(storeName, initialValue);
  
  // Subscribe to all dependencies
  const unsubscribes = dependencies.map(store => 
    store.subscribe(() => {
      const currentValues = dependencies.map(dep => dep.getValue()) as any;
      const newValue = compute(...currentValues);
      computedStore.setValue(newValue);
    })
  );
  
  // Store cleanup function for proper resource management
  (computedStore as any)._cleanup = () => {
    unsubscribes.forEach(unsub => unsub());
  };
  
  return computedStore;
}

/**
 * Utility functions for store operations
 */
export class StoreUtils {
	/**
	 * Copy value from source store to target store
	 */
	static copyStore(sourceStore: IStore, targetStore: IStore): void {
		const { value } = sourceStore.getSnapshot();
		targetStore.setValue(value);
	}

	/**
	 * Sync all matching stores between registries
	 */
	static syncRegistries(
		sourceRegistry: IStoreRegistry,
		targetRegistry: IStoreRegistry,
		options?: {
			filter?: (name: string, store: IStore) => boolean;
			createMissing?: boolean;
		},
	): void {
		const sourceStores = sourceRegistry.getAllStores();

		sourceStores.forEach((store, name) => {
			// Apply filter if provided
			if (options?.filter && !options.filter(name, store)) {
				return;
			}

			const targetStore = targetRegistry.getStore(name);

			if (targetStore) {
				this.copyStore(store, targetStore);
			} else if (options?.createMissing) {
				// Clone and register the store
				const clonedStore = this.cloneStore(store);
				targetRegistry.register(name, clonedStore);
			}
		});
	}

	/**
	 * Create a clone of a store
	 */
	static cloneStore<T = any>(store: IStore<T>): Store<T> {
		const { value, name } = store.getSnapshot();
		return new Store(name, value);
	}

	/**
	 * Create auto-sync between two stores
	 */
	static createAutoSync(
		sourceStore: IStore,
		targetStore: IStore,
		options?: {
			immediate?: boolean;
			transform?: (value: any) => any;
		},
	): () => void {
		// Sync immediately if requested
		if (options?.immediate) {
			const { value } = sourceStore.getSnapshot();
			const transformedValue = options.transform
				? options.transform(value)
				: value;
			targetStore.setValue(transformedValue);
		}

		// Set up continuous sync
		const unsubscribe = sourceStore.subscribe(() => {
			const { value } = sourceStore.getSnapshot();
			const transformedValue = options?.transform
				? options.transform(value)
				: value;
			targetStore.setValue(transformedValue);
		});

		return unsubscribe;
	}

	/**
	 * Create bidirectional sync between stores
	 */
	static createBidirectionalSync(
		storeA: IStore,
		storeB: IStore,
		options?: {
			immediate?: boolean;
			transformAtoB?: (value: any) => any;
			transformBtoA?: (value: any) => any;
		},
	): () => void {
		let syncing = false;

		const syncAtoB = () => {
			if (syncing) return;
			syncing = true;

			const { value } = storeA.getSnapshot();
			const transformedValue = options?.transformAtoB
				? options.transformAtoB(value)
				: value;
			storeB.setValue(transformedValue);

			syncing = false;
		};

		const syncBtoA = () => {
			if (syncing) return;
			syncing = true;

			const { value } = storeB.getSnapshot();
			const transformedValue = options?.transformBtoA
				? options.transformBtoA(value)
				: value;
			storeA.setValue(transformedValue);

			syncing = false;
		};

		// Initial sync if requested
		if (options?.immediate) {
			syncAtoB();
		}

		const unsubscribeA = storeA.subscribe(syncAtoB);
		const unsubscribeB = storeB.subscribe(syncBtoA);

		return () => {
			unsubscribeA();
			unsubscribeB();
		};
	}

	/**
	 * Merge multiple registries into one
	 */
	static mergeRegistries(
		targetRegistry: IStoreRegistry,
		...sourceRegistries: IStoreRegistry[]
	): void {
		sourceRegistries.forEach((sourceRegistry) => {
			sourceRegistry.getAllStores().forEach((store, name) => {
				if (!targetRegistry.hasStore(name)) {
					targetRegistry.register(name, this.cloneStore(store));
				}
			});
		});
	}

	/**
	 * Create a computed store that derives its value from other stores
	 */
	static createComputedStore<T>(
		name: string,
		dependencies: IStore[],
		compute: (...values: any[]) => T,
	): Store<T> {
		// Get initial values
		const initialValues = dependencies.map(
			(store) => store.getSnapshot().value,
		);
		const computedStore = new Store(name, compute(...initialValues));

		// Update when any dependency changes
		const update = () => {
			const values = dependencies.map((store) => store.getSnapshot().value);
			computedStore.setValue(compute(...values));
		};

		// Subscribe to all dependencies
		dependencies.forEach((store) => {
			store.subscribe(update);
		});

		return computedStore;
	}

	/**
	 * Create a debounced store that delays updates
	 */
	static createDebouncedStore<T>(
		name: string,
		sourceStore: IStore<T>,
		delay: number,
	): Store<T> {
		const debouncedStore = new Store(name, sourceStore.getSnapshot().value);
		let timeoutId: any;

		sourceStore.subscribe(() => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				const { value } = sourceStore.getSnapshot();
				debouncedStore.setValue(value);
			}, delay);
		});

		return debouncedStore;
	}
}
