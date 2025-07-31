/**
 * @fileoverview ActionHandler utilities for MVVM architecture
 * Provides helpers for multi-store coordination patterns
 */

import { ActionRegister, ActionHandler, HandlerConfig } from '@context-action/core';
import { StoreRegistry } from './StoreRegistry';
import type { IStore } from './types';

/**
 * Store snapshot interface for rollback strategies
 */
export interface StoreSnapshot {
  name: string;
  value: any;
}

/**
 * Multi-store operation context
 */
export interface MultiStoreContext {
  stores: Record<string, IStore>;
  snapshots: Record<string, any>;
  registry: StoreRegistry;
}

/**
 * Create a multi-store action handler with automatic rollback support
 * Following ARCHITECTURE.md patterns for cross-store coordination
 * 
 * @template T - Action payload type
 * @param storeNames - Names of stores to coordinate
 * @param handler - Handler function with multi-store context
 * @param config - Handler configuration
 * @returns Action handler with rollback capability
 * 
 * @example
 * ```typescript
 * const checkoutHandler = createMultiStoreHandler(
 *   ['cart', 'inventory', 'user', 'order'],
 *   async (payload, controller, context) => {
 *     const { cart, inventory, user } = context.stores;
 *     
 *     // Business validation (ViewModel logic)
 *     const cartData = cart.getValue();
 *     const inventoryData = inventory.getValue();
 *     const userData = user.getValue();
 *     
 *     if (cartData.items.length === 0) {
 *       controller.abort('Cart is empty');
 *       return;
 *     }
 *     
 *     // Check inventory availability
 *     const unavailableItems = cartData.items.filter(item => 
 *       inventoryData[item.id] < item.quantity
 *     );
 *     
 *     if (unavailableItems.length > 0) {
 *       controller.abort('Some items are no longer available');
 *       return;
 *     }
 *     
 *     // Execute coordinated updates (Model layer updates)
 *     const order = {
 *       id: generateOrderId(),
 *       userId: userData.id,
 *       items: cartData.items,
 *       total: calculateTotal(cartData.items),
 *       status: 'processing',
 *       createdAt: Date.now()
 *     };
 *     
 *     // Atomic-like updates
 *     context.stores.order.setValue(order);
 *     context.stores.cart.setValue({ items: [] });
 *     context.stores.inventory.update(inv => updateInventory(inv, cartData.items));
 *     
 *     // Async operation that might fail
 *     try {
 *       await api.processOrder(order);
 *       context.stores.order.update(o => ({ ...o, status: 'confirmed' }));
 *     } catch (error) {
 *       // Rollback is handled automatically
 *       controller.abort('Payment processing failed');
 *     }
 *   }
 * );
 * ```
 */
export function createMultiStoreHandler<T>(
  storeNames: string[],
  handler: (
    payload: T,
    controller: Parameters<ActionHandler<T>>[1],
    context: MultiStoreContext
  ) => void | Promise<void>,
  config?: HandlerConfig
): ActionHandler<T> {
  return async (payload, controller) => {
    // This will be filled when used with useMultiStoreAction hook
    const registry = (global as any).__contextActionRegistry as StoreRegistry;
    
    if (!registry) {
      controller.abort('StoreRegistry not available. Make sure to use within StoreProvider.');
      return;
    }

    // Capture initial snapshots for rollback
    const snapshots: Record<string, any> = {};
    const stores: Record<string, IStore> = {};
    
    for (const storeName of storeNames) {
      const store = registry.getStore(storeName);
      if (store) {
        stores[storeName] = store;
        snapshots[storeName] = store.getValue();
      }
    }

    const context: MultiStoreContext = {
      stores,
      snapshots,
      registry
    };

    const originalAbort = controller.abort.bind(controller);
    
    // Wrap abort to include rollback
    controller.abort = (reason?: string) => {
      // Rollback all stores to their original state
      for (const storeName of storeNames) {
        const store = stores[storeName];
        const originalValue = snapshots[storeName];
        if (store && originalValue !== undefined) {
          store.setValue(originalValue);
        }
      }
      
      originalAbort(reason);
    };

    try {
      await handler(payload, controller, context);
    } catch (error) {
      // Auto-rollback on any error
      controller.abort(error instanceof Error ? error.message : 'Handler execution failed');
    }
  };
}

/**
 * Create a transaction-like action handler
 * Provides explicit transaction boundaries with commit/rollback
 * 
 * @template T - Action payload type
 * @param storeNames - Names of stores to include in transaction
 * @param handler - Handler function with transaction context
 * @param config - Handler configuration
 * @returns Transaction-aware action handler
 * 
 * @example
 * ```typescript
 * const transferFundsHandler = createTransactionHandler(
 *   ['accounts', 'transactions'],
 *   async (payload, controller, context) => {
 *     const { fromAccount, toAccount, amount } = payload;
 *     const accounts = context.stores.accounts.getValue();
 *     
 *     if (accounts[fromAccount].balance < amount) {
 *       controller.abort('Insufficient funds');
 *       return;
 *     }
 *     
 *     // Begin transaction
 *     context.begin();
 *     
 *     try {
 *       // Update accounts
 *       context.stores.accounts.update(accs => ({
 *         ...accs,
 *         [fromAccount]: { ...accs[fromAccount], balance: accs[fromAccount].balance - amount },
 *         [toAccount]: { ...accs[toAccount], balance: accs[toAccount].balance + amount }
 *       }));
 *       
 *       // Record transaction
 *       const transaction = {
 *         id: generateId(),
 *         fromAccount,
 *         toAccount,
 *         amount,
 *         timestamp: Date.now()
 *       };
 *       
 *       context.stores.transactions.update(txns => [...txns, transaction]);
 *       
 *       // Commit changes
 *       await context.commit();
 *       
 *     } catch (error) {
 *       context.rollback();
 *       controller.abort('Transfer failed');
 *     }
 *   }
 * );
 * ```
 */
export interface TransactionContext extends MultiStoreContext {
  begin(): void;
  commit(): Promise<void>;
  rollback(): void;
  isInTransaction(): boolean;
}

export function createTransactionHandler<T>(
  storeNames: string[],
  handler: (
    payload: T,
    controller: Parameters<ActionHandler<T>>[1],
    context: TransactionContext
  ) => void | Promise<void>,
  config?: HandlerConfig
): ActionHandler<T> {
  return async (payload, controller) => {
    const registry = (global as any).__contextActionRegistry as StoreRegistry;
    
    if (!registry) {
      controller.abort('StoreRegistry not available. Make sure to use within StoreProvider.');
      return;
    }

    let transactionActive = false;
    const snapshots: Record<string, any> = {};
    const stores: Record<string, IStore> = {};
    
    for (const storeName of storeNames) {
      const store = registry.getStore(storeName);
      if (store) {
        stores[storeName] = store;
      }
    }

    const context: TransactionContext = {
      stores,
      snapshots,
      registry,
      
      begin() {
        if (transactionActive) {
          throw new Error('Transaction already active');
        }
        
        // Capture snapshots
        for (const storeName of storeNames) {
          const store = stores[storeName];
          if (store) {
            snapshots[storeName] = store.getValue();
          }
        }
        
        transactionActive = true;
      },
      
      async commit() {
        if (!transactionActive) {
          throw new Error('No active transaction to commit');
        }
        
        // In a real implementation, you might want to:
        // 1. Validate all changes
        // 2. Persist to external storage
        // 3. Clear snapshots
        
        transactionActive = false;
      },
      
      rollback() {
        if (!transactionActive) {
          return;
        }
        
        // Restore all stores to their snapshot state
        for (const storeName of storeNames) {
          const store = stores[storeName];
          const originalValue = snapshots[storeName];
          if (store && originalValue !== undefined) {
            store.setValue(originalValue);
          }
        }
        
        transactionActive = false;
      },
      
      isInTransaction() {
        return transactionActive;
      }
    };

    try {
      await handler(payload, controller, context);
      
      // Auto-rollback if transaction was started but not committed
      if (transactionActive) {
        context.rollback();
        controller.abort('Transaction was not properly committed');
      }
    } catch (error) {
      if (transactionActive) {
        context.rollback();
      }
      throw error;
    }
  };
}

/**
 * Helper for creating action handlers with validation patterns
 * Following ARCHITECTURE.md business logic validation patterns
 * 
 * @template T - Action payload type
 * @param validators - Array of validation functions
 * @param handler - Main handler function
 * @param config - Handler configuration
 * @returns Validated action handler
 */
export function createValidatedHandler<T>(
  validators: Array<(payload: T, context: MultiStoreContext) => string | null>,
  handler: ActionHandler<T>,
  config?: HandlerConfig
): ActionHandler<T> {
  return async (payload, controller) => {
    const registry = (global as any).__contextActionRegistry as StoreRegistry;
    
    if (!registry) {
      controller.abort('StoreRegistry not available. Make sure to use within StoreProvider.');
      return;
    }

    const context: MultiStoreContext = {
      stores: {} as Record<string, IStore>,
      snapshots: {},
      registry
    };

    // Run all validators
    for (const validator of validators) {
      const error = validator(payload, context);
      if (error) {
        controller.abort(error);
        return;
      }
    }

    // If all validators pass, execute the handler
    await handler(payload, controller);
  };
}

/**
 * Utility functions for common store coordination patterns
 */
export class ActionHandlerUtils {
  /**
   * Create a master-detail synchronization handler
   */
  static createMasterDetailSync<TMaster, TDetail>(
    masterStoreName: string,
    detailStoreName: string,
    syncFn: (master: TMaster) => TDetail
  ): ActionHandler<{ masterId: string }> {
    return createMultiStoreHandler(
      [masterStoreName, detailStoreName],
      async (payload, controller, context) => {
        const masterStore = context.stores[masterStoreName];
        const detailStore = context.stores[detailStoreName];
        
        const masterData = masterStore.getValue();
        const syncedDetail = syncFn(masterData);
        
        detailStore.setValue(syncedDetail);
      }
    );
  }

  /**
   * Create a cache invalidation handler
   */
  static createCacheInvalidation(
    sourceStoreName: string,
    cacheStoreNames: string[]
  ): ActionHandler<any> {
    return createMultiStoreHandler(
      [sourceStoreName, ...cacheStoreNames],
      async (payload, controller, context) => {
        // Clear all cache stores when source changes
        for (const cacheStoreName of cacheStoreNames) {
          const cacheStore = context.stores[cacheStoreName];
          if (cacheStore) {
            cacheStore.setValue(null);
          }
        }
      }
    );
  }
}