import type { Listener, Unsubscribe } from './types';

// 믹스인 임포트
import { StoreBase } from './StoreBase';
import { StoreWithCleanup } from './StoreWithCleanup';
import { StoreWithErrorRecovery } from './StoreWithErrorRecovery';
import { StoreWithSubscriptionManagement } from './StoreWithSubscriptionManagement';

/**
 * Core Store class for centralized state management with memory leak prevention
 * 
 * 믹스인 패턴을 사용하여 기능별로 분리된 Store 구현
 * - StoreBase: 핵심 기능 (~200줄)
 * - StoreWithCleanup: 메모리 관리 (~150줄)
 * - StoreWithErrorRecovery: 에러 복구 (~200줄)
 * - StoreWithSubscriptionManagement: 구독 관리 (~167줄)
 * 
 * @template T - The type of value stored in this store
 * 
 * @example
 * ```typescript
 * const userStore = createStore('user', { name: '', age: 0 });
 * 
 * // Register cleanup tasks
 * const unregister = userStore.registerCleanup(() => {
 *   console.log('Cleaning up user store resources');
 * });
 * 
 * // Automatic cleanup on disposal
 * userStore.dispose();
 * ```
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 * @public
 */
export class Store<T = unknown> extends StoreBase<T> {
  // 믹스인 인스턴스들
  private cleanupMixin = new StoreWithCleanup<T>();
  private errorRecoveryMixin = new StoreWithErrorRecovery<T>();
  private subscriptionMixin = new StoreWithSubscriptionManagement<T>();

  constructor(name: string, initialValue: T) {
    super(name, initialValue);
  }

  /**
   * Enhanced store subscription with metadata tracking and error recovery
   */
  subscribe(listener: Listener): Unsubscribe {
    // Enhanced listener with error handling
    const enhancedListener = this.subscriptionMixin._createEnhancedSubscription(
      listener,
      { name: this.name, listeners: this.listeners }
    );

    this.listeners.add(enhancedListener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(enhancedListener);
    };
  }

  /**
   * Register a cleanup task
   */
  registerCleanup(task: () => void): () => void {
    return this.cleanupMixin.registerCleanup(task);
  }

  /**
   * Dispose the store and clean up resources
   */
  dispose(): void {
    this.cleanupMixin.dispose();
    this.subscriptionMixin.clearSubscriptionMetadata();
  }

  /**
   * Check if store is disposed
   */
  isDisposed(): boolean {
    return this.cleanupMixin.isDisposedStore();
  }

  /**
   * Get comprehensive store statistics
   */
  getComprehensiveStats() {
    const baseStats = this.getStats();
    const errorStats = this.errorRecoveryMixin.getErrorStats();
    const subscriptionStats = this.subscriptionMixin.getSubscriptionStats();
    const cleanupStats = {
      cleanupTaskCount: this.cleanupMixin.getCleanupTaskCount(),
      isDisposed: this.cleanupMixin.isDisposedStore()
    };

    return {
      ...baseStats,
      error: errorStats,
      subscription: subscriptionStats,
      cleanup: cleanupStats
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return this.errorRecoveryMixin.getErrorStats();
  }

  /**
   * Get subscription statistics
   */
  getSubscriptionStats() {
    return this.subscriptionMixin.getSubscriptionStats();
  }

  /**
   * Reset error state
   */
  resetErrorState(): void {
    this.errorRecoveryMixin.resetErrorState();
  }

  /**
   * Check if store is in error state
   */
  isInErrorState(): boolean {
    return this.errorRecoveryMixin.isInErrorState();
  }

  /**
   * Get cleanup task count
   */
  getCleanupTaskCount(): number {
    return this.cleanupMixin.getCleanupTaskCount();
  }

  /**
   * Clear all cleanup tasks
   */
  clearCleanupTasks(): void {
    this.cleanupMixin.clearCleanupTasks();
  }

  /**
   * Get subscription metadata for a specific listener
   */
  getSubscriptionMetadata(listener: Listener) {
    return this.subscriptionMixin.getSubscriptionMetadata(listener);
  }

  /**
   * Get all subscription metadata
   */
  getAllSubscriptionMetadata() {
    return this.subscriptionMixin.getAllSubscriptionMetadata();
  }

  /**
   * Clean up old subscriptions
   */
  cleanupOldSubscriptions(maxAge?: number): void {
    this.subscriptionMixin._cleanupOldSubscriptions(maxAge);
  }

  /**
   * Update store value with function (for functional updates)
   */
  update(updater: (current: T) => T): void {
    this.updateValue(updater);
  }
}

/**
 * Create a new Store instance
 * 
 * @template T - The type of value stored in this store
 * @param name - Unique name for the store
 * @param initialValue - Initial value for the store
 * @returns New Store instance
 * 
 * @example
 * ```typescript
 * const userStore = createStore('user', { name: '', age: 0 });
 * ```
 */
export function createStore<T>(name: string, initialValue: T): Store<T> {
  return new Store<T>(name, initialValue);
}