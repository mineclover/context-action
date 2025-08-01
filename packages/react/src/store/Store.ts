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

  reset = (): void => {
    this.setValue(0);
  };
}
