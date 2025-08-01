import type { IStore, Listener, Snapshot, Unsubscribe } from './types';
import { createLogger } from '@context-action/logger';

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
  protected logger = createLogger();

  constructor(name: string, initialValue: T) {
    this.name = name;
    this._value = initialValue;
    this._snapshot = this._createSnapshot();
    this.logger.debug(`Store created: ${name}`, { initialValue });
  }

  /**
   * Subscribe to store changes
   * @implements store-hooks
   * @memberof api-terms
   */
  subscribe = (listener: Listener): Unsubscribe => {
    this.listeners.add(listener);
    this.logger.trace(`Subscriber added to store: ${this.name}`, { 
      listenerCount: this.listeners.size 
    });
    
    return () => {
      this.listeners.delete(listener);
      this.logger.trace(`Subscriber removed from store: ${this.name}`, { 
        listenerCount: this.listeners.size 
      });
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
    const oldValue = this._value;
    if (!Object.is(this._value, value)) {
      this._value = value;
      this._snapshot = this._createSnapshot();
      this.logger.debug(`Store value updated: ${this.name}`, { 
        oldValue, 
        newValue: value,
        listenerCount: this.listeners.size 
      });
      this._notifyListeners();
    } else {
      this.logger.trace(`Store value unchanged: ${this.name}`, { value });
    }
  }

  /**
   * Update value using updater function
   */
  update(updater: (current: T) => T): void {
    this.logger.trace(`Store update called: ${this.name}`, { currentValue: this._value });
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
    const count = this.listeners.size;
    this.listeners.clear();
    this.logger.debug(`Cleared all listeners from store: ${this.name}`, { clearedCount: count });
  }

  private _createSnapshot(): Snapshot<T> {
    return {
      value: this._value,
      name: this.name,
      lastUpdate: Date.now()
    };
  }

  private _notifyListeners(): void {
    this.logger.trace(`Notifying listeners for store: ${this.name}`, { 
      listenerCount: this.listeners.size 
    });
    
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        this.logger.error(`Error in store listener for "${this.name}"`, error);
      }
    });
  }
}

/**
 * Create a numeric store with increment/decrement methods
 */
export class NumericStore extends Store<number> {
  increment = (amount: number = 1): void => {
    const oldValue = this.getValue();
    this.setValue(oldValue + amount);
    this.logger.debug(`NumericStore increment: ${this.name}`, { 
      amount, oldValue, newValue: this.getValue() 
    });
  };

  decrement = (amount: number = 1): void => {
    const oldValue = this.getValue();
    this.setValue(oldValue - amount);
    this.logger.debug(`NumericStore decrement: ${this.name}`, { 
      amount, oldValue, newValue: this.getValue() 
    });
  };

  multiply = (factor: number): void => {
    const oldValue = this.getValue();
    this.setValue(oldValue * factor);
    this.logger.debug(`NumericStore multiply: ${this.name}`, { 
      factor, oldValue, newValue: this.getValue() 
    });
  };

  divide = (divisor: number): void => {
    if (divisor !== 0) {
      const oldValue = this.getValue();
      this.setValue(oldValue / divisor);
      this.logger.debug(`NumericStore divide: ${this.name}`, { 
        divisor, oldValue, newValue: this.getValue() 
      });
    } else {
      this.logger.warn(`NumericStore divide by zero prevented: ${this.name}`, { divisor });
    }
  };

  reset = (): void => {
    const oldValue = this.getValue();
    this.setValue(0);
    this.logger.debug(`NumericStore reset: ${this.name}`, { oldValue });
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
