import type { IStore, Listener, Snapshot, Unsubscribe } from './types';

/**
 * @implements store-integration-pattern
 * @implements model-layer
 * @memberof core-concepts
 */
export class Store<T = any> implements IStore<T> {
  private listeners = new Set<Listener>();
  private _value: T;
  private _snapshot: Snapshot<T>;
  public readonly name: string;

  constructor(name: string, initialValue: T) {
    this.name = name;
    this._value = initialValue;
    this._snapshot = this._createSnapshot();
  }

  /**
   * Subscribe to store changes
   * @implements store-hooks
   * @memberof api-terms
   */
  subscribe = (listener: Listener): Unsubscribe => {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Get current snapshot of the store
   */
  getSnapshot = (): Snapshot<T> => {
    return this._snapshot;
  };

  /**
   * Get current value directly (without snapshot wrapper)
   * @implements lazy-evaluation
   * @memberof architecture-terms
   * 
   * Supports lazy evaluation pattern for fresh state access in action handlers
   */
  getValue(): T {
    return this._value;
  }

  /**
   * Set store value and notify all listeners
   * @implements unidirectional-data-flow
   * @memberof architecture-terms
   * 
   * Updates store state and triggers reactive updates in subscribed components
   */
  setValue(value: T): void {
    if (!Object.is(this._value, value)) {
      this._value = value;
      this._snapshot = this._createSnapshot();
      this._notifyListeners();
    }
  }

  /**
   * Update value using updater function
   */
  update(updater: (current: T) => T): void {
    this.setValue(updater(this._value));
  }

  /**
   * Get number of active listeners
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  private _createSnapshot(): Snapshot<T> {
    return {
      value: this._value,
      name: this.name,
      lastUpdate: Date.now()
    };
  }

  private _notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error(`Error in store listener for "${this.name}":`, error);
      }
    });
  }
}

/**
 * Create a numeric store with increment/decrement methods
 */
export class NumericStore extends Store<number> {
  increment = (amount: number = 1): void => {
    this.setValue(this.getValue() + amount);
  };

  decrement = (amount: number = 1): void => {
    this.setValue(this.getValue() - amount);
  };

  multiply = (factor: number): void => {
    this.setValue(this.getValue() * factor);
  };

  divide = (divisor: number): void => {
    if (divisor !== 0) {
      this.setValue(this.getValue() / divisor);
    }
  };

  reset = (): void => {
    this.setValue(0);
  };
}

/**
 * Store factory function for easier creation
 * @template T - The store value type
 * @param name - Store identifier name
 * @param initialValue - Initial value for the store
 * @returns Store instance
 * 
 * @example
 * ```typescript
 * // Basic store creation
 * const userStore = createStore('user', { id: '', name: '', email: '' });
 * const countStore = createStore('count', 0);
 * 
 * // Using the stores
 * userStore.setValue({ id: '1', name: 'John', email: 'john@example.com' });
 * countStore.increment(); // if NumericStore
 * ```
 */
export function createStore<T>(name: string, initialValue: T): Store<T> {
  if (typeof initialValue === 'number') {
    return new NumericStore(name, initialValue as any) as any;
  }
  return new Store<T>(name, initialValue);
}

/**
 * Store configuration options for HOC patterns
 */
export interface StoreConfig<T = any> {
  name: string;
  initialValue: T;
  registry?: import('./StoreRegistry').StoreRegistry;
  autoRegister?: boolean;
}

/**
 * Enhanced store with auto-registration capability
 */
export class ManagedStore<T> extends Store<T> {
  private registry?: import('./StoreRegistry').StoreRegistry;
  private autoRegister: boolean;

  constructor(config: StoreConfig<T>) {
    super(config.name, config.initialValue);
    this.registry = config.registry;
    this.autoRegister = config.autoRegister ?? true;
    
    if (this.autoRegister && this.registry) {
      this.registry.register(this.name, this);
    }
  }

  /**
   * Dispose store and unregister from registry
   */
  dispose(): void {
    if (this.registry) {
      this.registry.unregister(this.name);
    }
    this.clearListeners();
  }
}

/**
 * Create a managed store with auto-registration
 * @template T - The store value type
 * @param config - Store configuration
 * @returns ManagedStore instance
 * 
 * @example
 * ```typescript
 * const registry = new StoreRegistry();
 * 
 * // Auto-registered store
 * const userStore = createManagedStore({
 *   name: 'user',
 *   initialValue: { id: '', name: '' },
 *   registry,
 *   autoRegister: true
 * });
 * 
 * // The store is automatically available via registry.getStore('user')
 * ```
 */
export function createManagedStore<T>(config: StoreConfig<T>): ManagedStore<T> {
  return new ManagedStore<T>(config);
}
