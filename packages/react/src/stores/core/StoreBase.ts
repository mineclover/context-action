import type { IStore, Listener, Snapshot, Unsubscribe, StoreSetValueOptions } from './types';
import { produce } from '../utils/immutable';
import { compareValues, ComparisonOptions } from '../utils/comparison';
import { measureStorePerformance } from '../../utils/performance';

/**
 * @fileoverview StoreBase - 핵심 Store 기능
 * 
 * 기본적인 상태 관리 기능만 포함
 * 크기: ~200줄 (기존 717줄의 28%)
 */

/**
 * 기본 Store 클래스 - 핵심 기능만 포함
 * 
 * @template T - The type of value stored in this store
 */
export class StoreBase<T = unknown> implements IStore<T> {
  // Subscriber list - Set for duplicate prevention and O(1) deletion
  protected listeners = new Set<Listener>();
  // Actual state value - Single Source of Truth
  protected _value: T;
  // Immutable snapshot - Compatible with React's useSyncExternalStore
  protected _snapshot: Snapshot<T>;
  
  // Copy-on-Write optimization
  private _lastClonedValue: T | null = null;
  private _lastClonedVersion = 0;
  private _version = 0;

  // State for concurrency protection
  private isUpdating = false;
  private updateQueue: Array<() => void> = [];
  
  // Notification mode settings
  private notificationMode: 'batched' | 'immediate' = 'batched';
  private pendingNotification = false;
  
  // 🚀 requestAnimationFrame 기반 알림 시스템
  private animationFrameId: number | null = null;
  private pendingUpdatesCount = 0; // 누적된 업데이트 수 추적

  public readonly name: string;
  // Custom comparator function per store
  private customComparator: ((oldValue: T, newValue: T) => boolean) | undefined;
  // Comparison options per store
  private comparisonOptions: Partial<ComparisonOptions<T>> | undefined;
  // Performance optimization: disable cloning for this store
  private cloningEnabled: boolean = true;

  constructor(name: string, initialValue: T) {
    this.name = name;
    this._value = initialValue;
    // Create initial snapshot - make immediately subscribable
    this._snapshot = this._createSnapshot();
  }

  /**
   * Enhanced store subscription with metadata tracking and error recovery
   */
  subscribe(listener: Listener): Unsubscribe {
    // Enhanced listener with error handling
    const enhancedListener = () => {
      try {
        listener();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Store '${this.name}' listener error:`, error);
        }
        // Continue execution - don't let one listener break others
      }
    };

    this.listeners.add(enhancedListener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(enhancedListener);
    };
  }

  /**
   * Get current store value
   */
  getValue(): T {
    return this._value;
  }

  /**
   * Get current snapshot for React integration
   */
  getSnapshot(): Snapshot<T> {
    return this._snapshot;
  }

  /**
   * Set store value with options
   */
  setValue(newValue: T, options?: StoreSetValueOptions<T>): void {
    measureStorePerformance(this.name, () => {
      if (this.isUpdating) {
        // Queue the update to prevent race conditions
        this.updateQueue.push(() => this.setValue(newValue, options));
        return;
      }

      this.isUpdating = true;

      try {
        const oldValue = this._value;
        
        // Check if value actually changed
        if (this._hasValueChanged(oldValue, newValue)) {
          this._value = newValue;
          this._version++;
          this._snapshot = this._createSnapshot();
          this._notifyListeners();
        }
      } finally {
        this.isUpdating = false;
        this._processUpdateQueue();
      }
    });
  }

  /**
   * Update store value using a function
   */
  updateValue(updater: (currentValue: T) => T, options?: StoreSetValueOptions<T>): void {
    measureStorePerformance(this.name, () => {
      const newValue = updater(this._value);
      this.setValue(newValue, options);
    });
  }

  /**
   * Check if value has changed using custom comparator
   */
  private _hasValueChanged(oldValue: T, newValue: T): boolean {
    if (this.customComparator) {
      return !this.customComparator(oldValue, newValue);
    }

    if (this.comparisonOptions) {
      return !compareValues(oldValue, newValue, this.comparisonOptions);
    }

    return !Object.is(oldValue, newValue);
  }

  /**
   * Create immutable snapshot
   */
  private _createSnapshot(): Snapshot<T> {
    if (!this.cloningEnabled) {
      return this._value as Snapshot<T>;
    }

    // Copy-on-Write optimization
    if (this._lastClonedValue !== null && this._lastClonedVersion === this._version) {
      return this._lastClonedValue as Snapshot<T>;
    }

    try {
      const cloned = produce(this._value, (_draft) => {
        // Empty producer for copy-on-write optimization
      });
      this._lastClonedValue = cloned;
      this._lastClonedVersion = this._version;
      return cloned as Snapshot<T>;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Store '${this.name}' cloning failed, using original value:`, error);
      }
      return this._value as Snapshot<T>;
    }
  }

  /**
   * Notify all listeners
   */
  private _notifyListeners(): void {
    if (this.notificationMode === 'immediate') {
      this._executeNotifications();
    } else {
      this._scheduleNotification();
    }
  }

  /**
   * Schedule notification using requestAnimationFrame
   */
  private _scheduleNotification(): void {
    if (this.animationFrameId !== null) {
      return; // Already scheduled
    }

    this.pendingUpdatesCount++;
    
    this.animationFrameId = requestAnimationFrame(() => {
      this._executeNotifications();
      this.animationFrameId = null;
      this.pendingUpdatesCount = 0;
    });
  }

  /**
   * Execute notifications immediately
   */
  private _executeNotifications(): void {
    this.pendingNotification = false;
    
    // Create a copy of listeners to avoid issues with listeners modifying the set
    const listenersToNotify = Array.from(this.listeners);
    
    for (const listener of listenersToNotify) {
      try {
        listener();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Store '${this.name}' listener error:`, error);
        }
      }
    }
  }

  /**
   * Process queued updates
   */
  private _processUpdateQueue(): void {
    if (this.updateQueue.length === 0) {
      return;
    }

    const updates = this.updateQueue.splice(0);
    for (const update of updates) {
      try {
        update();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Store '${this.name}' queued update error:`, error);
        }
      }
    }
  }

  /**
   * Set custom comparator function
   */
  setComparator(comparator: (oldValue: T, newValue: T) => boolean): void {
    this.customComparator = comparator;
  }

  /**
   * Set comparison options
   */
  setComparisonOptions(options: Partial<ComparisonOptions<T>>): void {
    this.comparisonOptions = options;
  }

  /**
   * Enable/disable cloning
   */
  setCloningEnabled(enabled: boolean): void {
    this.cloningEnabled = enabled;
  }

  /**
   * Set notification mode
   */
  setNotificationMode(mode: 'batched' | 'immediate'): void {
    this.notificationMode = mode;
  }

  /**
   * Update store value with function (for functional updates)
   */
  update(updater: (current: T) => T): void {
    this.updateValue(updater);
  }

  /**
   * Check if cloning is enabled
   */
  isCloningEnabled(): boolean {
    return this.cloningEnabled;
  }

  /**
   * Get listener count
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

  /**
   * Get store statistics
   */
  getStats() {
    return {
      listenerCount: this.listeners.size,
      version: this._version,
      isUpdating: this.isUpdating,
      pendingUpdates: this.updateQueue.length,
      pendingNotifications: this.pendingNotification,
    };
  }
}
