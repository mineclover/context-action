/**
 * @fileoverview Time Travel Store
 *
 * Store with undo/redo capabilities powered by @context-action/mutative.
 * Provides time-travel functionality through Mutative JSON patches.
 */

import { TimeTravel, createTimeTravel, safeGet, type TimeTravelOptions, type TimeTravelControls, type Patches } from '@context-action/mutative';
import type { IStore, Listener, Snapshot, Unsubscribe, StoreSetValueOptions } from './types';

/**
 * Listener that receives patches information
 */
export type PatchAwareListener = (patches: Patches | null) => void;
import { TypeGuards } from '../utils/type-guards';
import { ErrorHandlers } from '../utils/error-handling';

/**
 * Configuration options for TimeTravelStore
 */
export interface TimeTravelStoreOptions<T> {
  /** Maximum number of history entries */
  maxHistory?: number;
  /**
   * Enable mutable mode for structural sharing (default: true)
   *
   * When true, unchanged parts of state keep the same reference,
   * enabling selective re-rendering with path-based subscriptions.
   */
  mutable?: boolean;
  /** Custom equality function */
  isEqual?: (a: T, b: T) => boolean;
  /** Notification mode: 'batched' uses RAF, 'immediate' notifies synchronously (default: 'immediate') */
  notificationMode?: 'batched' | 'immediate';
}

/**
 * TimeTravelStore - Store with built-in undo/redo functionality
 *
 * @example
 * ```tsx
 * const store = createTimeTravelStore('counter', { count: 0 }, { maxHistory: 50 });
 *
 * // Update state
 * store.setValue({ count: 1 });
 * store.setValue({ count: 2 });
 *
 * // Undo/Redo
 * store.undo(); // count: 1
 * store.redo(); // count: 2
 *
 * // Get controls for UI
 * const { canUndo, canRedo, position, history } = store.getTimeTravelControls();
 * ```
 */
export class TimeTravelStore<T = unknown> implements IStore<T> {
  public readonly name: string;

  private timeTravel: TimeTravel<T, false, true>;
  private listeners = new Set<Listener>();
  private patchAwareListeners = new Set<PatchAwareListener>();
  private _snapshot: Snapshot<T>;
  private _lastPatches: Patches | null = null;
  private isDisposed = false;
  private cleanupTasks = new Set<() => void>();
  private customComparator?: (a: T, b: T) => boolean;
  // Disabled by default to preserve structural sharing for selective re-rendering
  private cloningEnabled = false;

  // RAF-based notification batching
  private notificationMode: 'batched' | 'immediate' = 'immediate';
  private pendingNotification = false;
  private animationFrameId: number | null = null;
  private pendingPatches: Patches | null = null;

  constructor(
    name: string,
    initialValue: T,
    options: TimeTravelStoreOptions<T> = {}
  ) {
    this.name = name;
    this.customComparator = options.isEqual;
    this.notificationMode = options.notificationMode ?? 'immediate';

    // Create TimeTravel instance
    // mutable=true enables structural sharing for selective re-rendering
    const timeTravelOptions: TimeTravelOptions<false, true> = {
      maxHistory: options.maxHistory ?? 50,
      mutable: options.mutable ?? true,
      autoArchive: true,
    };

    this.timeTravel = createTimeTravel(initialValue, timeTravelOptions);

    // Subscribe to TimeTravel changes with patches
    this.timeTravel.subscribe((state, travelPatches, _position, changedPatches) => {
      // Use only the patches from the transition that triggered this
      // notification. The full history remains available through the
      // TimeTravel controls and must not drive path-aware subscriptions.
      this._lastPatches = (changedPatches ?? travelPatches.patches.flat()) as Patches;

      if (process.env.NODE_ENV === 'development') {
        console.log(`[TimeTravelStore:${this.name}] TimeTravel notified - patches:`, this._lastPatches.length, 'listeners:', this.listeners.size);
      }

      this._updateSnapshot();
      this._scheduleNotification();
    });

    // Create initial snapshot
    this._snapshot = this._createSnapshot();
  }

  // ============================================================================
  // IStore Implementation
  // ============================================================================

  subscribe = (listener: Listener): Unsubscribe => {
    if (this.isDisposed) {
      console.warn(`Cannot subscribe to disposed store "${this.name}"`);
      return () => {};
    }

    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /**
   * Subscribe with patches information for path-based optimization
   */
  subscribeWithPatches = (listener: PatchAwareListener): Unsubscribe => {
    if (this.isDisposed) {
      console.warn(`Cannot subscribe to disposed store "${this.name}"`);
      return () => {};
    }

    this.patchAwareListeners.add(listener);
    return () => this.patchAwareListeners.delete(listener);
  };

  /**
   * Get the patches from the last state change. In batched mode this includes
   * every transition accumulated before the notification frame was flushed.
   */
  getLastPatches(): Patches | null {
    return this._lastPatches;
  }

  getSnapshot = (): Snapshot<T> => this._snapshot;

  /**
   * Get current value directly (preserves structural sharing)
   *
   * Returns the state reference directly to maintain structural sharing.
   * This enables selective re-rendering when combined with path-based subscriptions.
   * Use setCloningEnabled(true) if you need defensive copies.
   */
  getValue(): T {
    const value = this.timeTravel.getState();
    // Direct return preserves structural sharing for selective re-rendering
    // Clone only when explicitly enabled for defensive copying
    return this.cloningEnabled ? safeGet(value, true) : value;
  }

  setValue(value: T, options?: StoreSetValueOptions<T>): void {
    if (this.isDisposed) return;

    // Event object detection
    if (TypeGuards.isObject(value)) {
      if (!TypeGuards.isRefState(value) && TypeGuards.isSuspiciousEventObject(value)) {
        const eventHandling = options?.eventHandling || 'block';

        if (eventHandling === 'block') {
          ErrorHandlers.store(
            'Event object detected in TimeTravelStore.setValue',
            { storeName: this.name }
          );
          return;
        }

        if (eventHandling === 'transform' && options?.eventTransform) {
          value = options.eventTransform(value);
        }
      }
    }

    // Skip update if values are equal
    if (!options?.skipComparison) {
      const currentValue = this.timeTravel.getState();
      if (this._areEqual(currentValue, value)) {
        return;
      }
    }

    // Update through TimeTravel
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TimeTravelStore:${this.name}] setValue - position before: ${this.timeTravel.getPosition()}`);
    }
    this.timeTravel.setState(value);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TimeTravelStore:${this.name}] setValue complete - position after: ${this.timeTravel.getPosition()}`);
    }
  }

  update(updater: (current: T) => T | undefined): void {
    if (this.isDisposed) return;

    // Use TimeTravel's draft-based update
    this.timeTravel.setState((draft): T | undefined => {
      const result = updater(draft as T);
      if (result !== undefined) {
        return result;
      }
      // When updater modifies draft in-place, return void (mutative handles this)
      return undefined;
    });
  }

  getListenerCount(): number {
    return this.listeners.size + this.patchAwareListeners.size;
  }

  clearListeners(): void {
    this.listeners.clear();
    this.patchAwareListeners.clear();
  }

  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    // Cancel pending RAF
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.pendingNotification = false;
    this.pendingPatches = null;

    // Execute cleanup tasks
    this.cleanupTasks.forEach((task) => {
      try {
        task();
      } catch {
        ErrorHandlers.store('Cleanup task error', { storeName: this.name });
      }
    });
    this.cleanupTasks.clear();
    this.listeners.clear();
    this.patchAwareListeners.clear();
  }

  registerCleanup(task: () => void): () => void {
    if (this.isDisposed) return () => {};
    this.cleanupTasks.add(task);
    return () => this.cleanupTasks.delete(task);
  }

  isStoreDisposed(): boolean {
    return this.isDisposed;
  }

  // ============================================================================
  // Time Travel API
  // ============================================================================

  /**
   * Undo the last change
   */
  undo(steps = 1): void {
    if (this.isDisposed) return;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TimeTravelStore:${this.name}] undo(${steps}) - position before: ${this.timeTravel.getPosition()}, canBack: ${this.timeTravel.canBack()}`);
    }
    this.timeTravel.back(steps);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TimeTravelStore:${this.name}] undo complete - position after: ${this.timeTravel.getPosition()}`);
    }
  }

  /**
   * Redo the last undone change
   */
  redo(steps = 1): void {
    if (this.isDisposed) return;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TimeTravelStore:${this.name}] redo(${steps}) - position before: ${this.timeTravel.getPosition()}, canForward: ${this.timeTravel.canForward()}`);
    }
    this.timeTravel.forward(steps);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TimeTravelStore:${this.name}] redo complete - position after: ${this.timeTravel.getPosition()}`);
    }
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.timeTravel.canBack();
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.timeTravel.canForward();
  }

  /**
   * Go to a specific position in history
   */
  goTo(position: number): void {
    if (this.isDisposed) return;
    this.timeTravel.go(position);
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    if (this.isDisposed) return;
    this.timeTravel.reset();
  }

  /**
   * Get the complete history of states
   */
  getHistory(): readonly T[] {
    return this.timeTravel.getHistory();
  }

  /**
   * Get current position in history
   */
  getPosition(): number {
    return this.timeTravel.getPosition();
  }

  /**
   * Get time travel controls object
   */
  getTimeTravelControls(): TimeTravelControls<T, false> {
    return this.timeTravel.getControls();
  }

  /**
   * Manually notify path-based subscribers without changing state value
   *
   * Useful for external systems (WebSocket, async operations) that need to
   * trigger UI updates for specific paths without actual state changes.
   *
   * @param path - The path to notify subscribers about
   */
  notifyPath(path: (string | number)[]): void {
    if (this.isDisposed) return;

    const currentValue = this._getValueAtPath(path);
    this._lastPatches = [{
      op: 'replace',
      path: path,
      value: currentValue
    }] as Patches;

    this._scheduleNotification();
  }

  /**
   * Manually notify multiple paths at once
   *
   * @param paths - Array of paths to notify subscribers about
   */
  notifyPaths(paths: (string | number)[][]): void {
    if (this.isDisposed) return;
    if (paths.length === 0) return;

    this._lastPatches = paths.map(path => ({
      op: 'replace' as const,
      path: path,
      value: this._getValueAtPath(path)
    })) as Patches;

    this._scheduleNotification();
  }

  /**
   * Get value at a specific path in the store
   * @private
   */
  private _getValueAtPath(path: (string | number)[]): unknown {
    let current: unknown = this.timeTravel.getState();
    for (const segment of path) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string | number, unknown>)[segment];
    }
    return current;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setCloningEnabled(enabled: boolean): void {
    this.cloningEnabled = enabled;
  }

  isCloningEnabled(): boolean {
    return this.cloningEnabled;
  }

  setCustomComparator(comparator: (a: T, b: T) => boolean): void {
    this.customComparator = comparator;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private _createSnapshot(): Snapshot<T> {
    // Direct reference preserves structural sharing
    // Clone only when explicitly enabled
    const value = this.cloningEnabled
      ? safeGet(this.timeTravel.getState(), true)
      : this.timeTravel.getState();

    return {
      value,
      name: this.name,
      lastUpdate: Date.now(),
    };
  }

  private _updateSnapshot(): void {
    this._snapshot = this._createSnapshot();
  }

  private _scheduleNotification(): void {
    if (this.isDisposed) return;

    if (this.notificationMode === 'immediate') {
      this._executeNotification();
      return;
    }

    if (this._lastPatches) {
      this.pendingPatches = this.pendingPatches
        ? this.pendingPatches.concat(this._lastPatches)
        : this._lastPatches;
    }

    // RAF batching
    if (!this.pendingNotification) {
      this.pendingNotification = true;
      this.animationFrameId = requestAnimationFrame(() => {
        this.pendingNotification = false;
        this.animationFrameId = null;
        this._executeNotification();
      });
    }
  }

  private _executeNotification(): void {
    if (this.isDisposed) return;

    if (this.pendingPatches) {
      this._lastPatches = this.pendingPatches;
      this.pendingPatches = null;
    }

    // Keep the payload stable if a regular listener triggers another update
    // before patch-aware listeners are reached.
    const notifiedPatches = this._lastPatches;

    // Notify regular listeners
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        ErrorHandlers.store('Listener error', { storeName: this.name });
      }
    });

    // Notify patch-aware listeners
    this.patchAwareListeners.forEach((listener) => {
      try {
        listener(notifiedPatches);
      } catch {
        ErrorHandlers.store('Patch-aware listener error', { storeName: this.name });
      }
    });
  }

  private _areEqual(a: T, b: T): boolean {
    if (this.customComparator) {
      return this.customComparator(a, b);
    }
    return Object.is(a, b);
  }
}

/**
 * Factory function to create a TimeTravelStore
 */
export function createTimeTravelStore<T>(
  name: string,
  initialValue: T,
  options?: TimeTravelStoreOptions<T>
): TimeTravelStore<T> {
  return new TimeTravelStore(name, initialValue, options);
}

/**
 * Type guard to check if a store is a TimeTravelStore
 */
export function isTimeTravelStore<T>(store: IStore<T>): store is TimeTravelStore<T> {
  return store instanceof TimeTravelStore;
}
