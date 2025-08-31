/**
 * @fileoverview Subscription Management System
 * 
 * Centralized subscription management for automatic cleanup and memory leak prevention.
 * Provides utilities for managing multiple store subscriptions with lifecycle management.
 */

import type { Store } from '../core/Store';
import { ErrorHandlers } from './error-handling';

/**
 * Individual subscription entry with metadata
 */
export interface SubscriptionEntry {
  unsubscribe: () => void;
  storeName: string;
  createdAt: number;
  isActive: boolean;
}

/**
 * Subscription statistics for monitoring
 */
export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  averageAge: number;
  oldestSubscription: number;
  subscriptionsByStore: Record<string, number>;
}

/**
 * Enhanced subscription manager for automatic cleanup and monitoring
 * 
 * Provides centralized management of store subscriptions with automatic cleanup,
 * lifecycle tracking, and memory leak prevention. Designed for use in complex
 * components with multiple store dependencies.
 */
export class SubscriptionManager {
  private subscriptions = new Map<string, SubscriptionEntry>();
  private subscriptionCounter = 0;
  private isDisposed = false;

  /**
   * Add a subscription with automatic tracking
   * 
   * @param unsubscribe - Function to call for cleanup
   * @param storeName - Name of the store for debugging
   * @returns Subscription ID for manual management
   */
  add(unsubscribe: () => void, storeName: string = 'unknown'): string {
    if (this.isDisposed) {
      throw new Error('SubscriptionManager has been disposed');
    }

    const subscriptionId = `sub_${++this.subscriptionCounter}_${Date.now()}`;
    
    const entry: SubscriptionEntry = {
      unsubscribe,
      storeName,
      createdAt: Date.now(),
      isActive: true
    };

    this.subscriptions.set(subscriptionId, entry);
    
    return subscriptionId;
  }

  /**
   * Add a store subscription with automatic cleanup
   * 
   * @param store - Store to subscribe to
   * @param listener - Listener function
   * @returns Subscription ID
   */
  addStoreSubscription<T>(store: Store<T>, listener: () => void): string {
    try {
      const unsubscribe = store.subscribe(listener);
      return this.add(unsubscribe, store.name);
    } catch (error) {
      ErrorHandlers.store(
        'Failed to create store subscription',
        { storeName: store.name },
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Remove a specific subscription
   * 
   * @param subscriptionId - ID returned from add()
   * @returns true if subscription was found and removed
   */
  remove(subscriptionId: string): boolean {
    const entry = this.subscriptions.get(subscriptionId);
    if (!entry) {
      return false;
    }

    if (entry.isActive) {
      try {
        entry.unsubscribe();
        entry.isActive = false;
      } catch (error) {
        ErrorHandlers.store(
          'Error during subscription cleanup',
          { 
            subscriptionId,
            storeName: entry.storeName 
          },
          error instanceof Error ? error : undefined
        );
      }
    }

    this.subscriptions.delete(subscriptionId);
    return true;
  }



  /**
   * Clean up all subscriptions
   */
  cleanupAll(): void {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    
    subscriptionIds.forEach(id => {
      this.remove(id);
    });
  }

  /**
   * Get subscription statistics
   */
  getStats(): SubscriptionStats {
    const now = Date.now();
    const activeSubscriptions = Array.from(this.subscriptions.values()).filter(s => s.isActive);
    
    const subscriptionsByStore: Record<string, number> = {};
    let totalAge = 0;
    let oldestTime = now;
    
    activeSubscriptions.forEach(entry => {
      // Count by store
      subscriptionsByStore[entry.storeName] = (subscriptionsByStore[entry.storeName] || 0) + 1;
      
      // Age calculations
      const age = now - entry.createdAt;
      totalAge += age;
      oldestTime = Math.min(oldestTime, entry.createdAt);
    });
    
    return {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: activeSubscriptions.length,
      averageAge: activeSubscriptions.length > 0 ? totalAge / activeSubscriptions.length : 0,
      oldestSubscription: activeSubscriptions.length > 0 ? now - oldestTime : 0,
      subscriptionsByStore
    };
  }


  /**
   * Dispose the manager and cleanup all subscriptions
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.cleanupAll();
    this.subscriptions.clear();
    this.isDisposed = true;
  }

  /**
   * Check if manager is disposed
   */
  isManagerDisposed(): boolean {
    return this.isDisposed;
  }
}

/**
 * React hook for automatic subscription management
 * 
 * Provides automatic cleanup of subscriptions when component unmounts.
 * Useful for components that need to subscribe to multiple stores.
 * 
 * @returns SubscriptionManager instance
 */
export function useSubscriptionManager(): SubscriptionManager {
  // Import React here to avoid module-level import
  const { useRef, useEffect } = require('react');
  
  const managerRef = useRef(null as SubscriptionManager | null);
  
  if (!managerRef.current) {
    managerRef.current = new SubscriptionManager();
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, []);
  
  return managerRef.current;
}

/**
 * Global subscription manager for debugging and monitoring
 */
class GlobalSubscriptionTracker {
  private managers = new Set<SubscriptionManager>();
  
  register(manager: SubscriptionManager): void {
    this.managers.add(manager);
  }
  
  unregister(manager: SubscriptionManager): void {
    this.managers.delete(manager);
  }
  
  getGlobalStats(): {
    totalManagers: number;
    totalSubscriptions: number;
  } {
    let totalSubscriptions = 0;
    
    for (const manager of this.managers) {
      if (!manager.isManagerDisposed()) {
        const stats = manager.getStats();
        totalSubscriptions += stats.activeSubscriptions;
      }
    }
    
    return {
      totalManagers: this.managers.size,
      totalSubscriptions
    };
  }
  
  dispose(): void {
    for (const manager of this.managers) {
      manager.dispose();
    }
    this.managers.clear();
  }
}

export const globalSubscriptionTracker = new GlobalSubscriptionTracker();

// Development-only global leak detection
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__contextActionSubscriptions = globalSubscriptionTracker;
}