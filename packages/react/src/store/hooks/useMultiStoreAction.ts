/**
 * @fileoverview useMultiStoreAction hook for MVVM architecture
 * Provides multi-store coordination for action handlers
 */

import { useEffect } from 'react';
import { ActionPayloadMap } from '@context-action/core';
import { useActionRegister } from '../../ActionProvider';
import { useStoreRegistry } from '../../StoreProvider';
import { createMultiStoreHandler, createTransactionHandler, MultiStoreContext, TransactionContext } from '../ActionHandlerUtils';

/**
 * Hook to register action handlers with multi-store coordination
 * Following ARCHITECTURE.md patterns for cross-store operations
 * 
 * @template T - Action payload map type
 * @template K - Action key type
 * @param action - Action name to register handler for
 * @param storeNames - Names of stores to coordinate
 * @param handler - Handler function with multi-store context
 * @param dependencies - Dependencies array for effect
 * 
 * @example
 * ```typescript
 * function useCartActions() {
 *   useMultiStoreAction(
 *     'processCheckout',
 *     ['cart', 'inventory', 'user', 'order'],
 *     async (payload, controller, context) => {
 *       const { cart, inventory, user } = context.stores;
 *       
 *       // Read from multiple stores (Model layer)
 *       const cartData = cart.getValue();
 *       const inventoryData = inventory.getValue();
 *       const userData = user.getValue();
 *       
 *       // Business validation (ViewModel logic)
 *       if (cartData.items.length === 0) {
 *         controller.abort('Cart is empty');
 *         return;
 *       }
 *       
 *       // Create order and update stores atomically
 *       const order = createOrder(cartData, userData);
 *       
 *       context.stores.order.setValue(order);
 *       context.stores.cart.setValue({ items: [] });
 *       context.stores.inventory.update(inv => updateInventory(inv, cartData.items));
 *       
 *       // Async operations with automatic rollback on failure
 *       await api.processOrder(order);
 *     },
 *     []
 *   );
 * }
 * ```
 */
export function useMultiStoreAction<
  T extends ActionPayloadMap,
  K extends keyof T
>(
  action: K,
  storeNames: string[],
  handler: (
    payload: T[K],
    controller: Parameters<Parameters<typeof createMultiStoreHandler>[1]>[1],
    context: MultiStoreContext
  ) => void | Promise<void>,
  dependencies: React.DependencyList = []
): void {
  const actionRegister = useActionRegister<T>();
  const registry = useStoreRegistry();

  useEffect(() => {
    // Make registry available globally for the handler
    (global as any).__contextActionRegistry = registry;

    const multiStoreHandler = createMultiStoreHandler(
      storeNames,
      handler as any
    );

    const unregister = actionRegister.register(action, multiStoreHandler);

    return () => {
      unregister();
      // Clean up global registry reference
      delete (global as any).__contextActionRegistry;
    };
  }, [action, ...storeNames, ...dependencies]);
}

/**
 * Hook to register transaction-based action handlers
 * Provides explicit transaction boundaries with commit/rollback
 * 
 * @template T - Action payload map type
 * @template K - Action key type
 * @param action - Action name to register handler for
 * @param storeNames - Names of stores to include in transaction
 * @param handler - Handler function with transaction context
 * @param dependencies - Dependencies array for effect
 * 
 * @example
 * ```typescript
 * function useAccountActions() {
 *   useTransactionAction(
 *     'transferFunds',
 *     ['accounts', 'transactions'],
 *     async (payload, controller, context) => {
 *       const { fromAccount, toAccount, amount } = payload;
 *       const accounts = context.stores.accounts.getValue();
 *       
 *       if (accounts[fromAccount].balance < amount) {
 *         controller.abort('Insufficient funds');
 *         return;
 *       }
 *       
 *       // Begin explicit transaction
 *       context.begin();
 *       
 *       try {
 *         // Update accounts atomically
 *         context.stores.accounts.update(accs => ({
 *           ...accs,
 *           [fromAccount]: { ...accs[fromAccount], balance: accs[fromAccount].balance - amount },
 *           [toAccount]: { ...accs[toAccount], balance: accs[toAccount].balance + amount }
 *         }));
 *         
 *         // Record transaction
 *         const transaction = { id: generateId(), fromAccount, toAccount, amount, timestamp: Date.now() };
 *         context.stores.transactions.update(txns => [...txns, transaction]);
 *         
 *         // Commit all changes
 *         await context.commit();
 *         
 *       } catch (error) {
 *         context.rollback();
 *         controller.abort('Transfer failed');
 *       }
 *     },
 *     []
 *   );
 * }
 * ```
 */
export function useTransactionAction<
  T extends ActionPayloadMap,
  K extends keyof T
>(
  action: K,
  storeNames: string[],
  handler: (
    payload: T[K],
    controller: Parameters<Parameters<typeof createTransactionHandler>[1]>[1],
    context: TransactionContext
  ) => void | Promise<void>,
  dependencies: React.DependencyList = []
): void {
  const actionRegister = useActionRegister<T>();
  const registry = useStoreRegistry();

  useEffect(() => {
    // Make registry available globally for the handler
    (global as any).__contextActionRegistry = registry;

    const transactionHandler = createTransactionHandler(
      storeNames,
      handler as any
    );

    const unregister = actionRegister.register(action, transactionHandler);

    return () => {
      unregister();
      // Clean up global registry reference
      delete (global as any).__contextActionRegistry;
    };
  }, [action, ...storeNames, ...dependencies]);
}

/**
 * Hook to register action handlers with automatic store setup
 * Creates stores if they don't exist and provides type-safe access
 * 
 * @template T - Action payload map type
 * @template K - Action key type
 * @param action - Action name to register handler for
 * @param storeSetup - Store setup configuration
 * @param handler - Handler function with setup stores
 * @param dependencies - Dependencies array for effect
 * 
 * @example
 * ```typescript
 * function useUserActions() {
 *   useActionWithStores(
 *     'updateUser',
 *     {
 *       user: () => createStore({ id: '', name: '', email: '' }),
 *       settings: () => createStore({ theme: 'light', notifications: true }),
 *       activity: () => createStore([])
 *     },
 *     async (payload, controller, stores) => {
 *       const currentUser = stores.user.getValue();
 *       const settings = stores.settings.getValue();
 *       
 *       // Business logic validation
 *       if (settings.validateNames && !isValidName(payload.name)) {
 *         controller.abort('Invalid name format');
 *         return;
 *       }
 *       
 *       // Update user with business logic
 *       const updatedUser = {
 *         ...currentUser,
 *         ...payload,
 *         lastModified: Date.now(),
 *         version: currentUser.version + 1
 *       };
 *       
 *       stores.user.setValue(updatedUser);
 *       
 *       // Log activity
 *       stores.activity.update(activities => [...activities, {
 *         type: 'user_updated',
 *         userId: payload.id,
 *         timestamp: Date.now()
 *       }]);
 *     },
 *     []
 *   );
 * }
 * ```
 */
export function useActionWithStores<
  T extends ActionPayloadMap,
  K extends keyof T,
  S extends Record<string, () => any>
>(
  action: K,
  storeSetup: S,
  handler: (
    payload: T[K],
    controller: Parameters<Parameters<typeof createMultiStoreHandler>[1]>[1],
    stores: { [P in keyof S]: ReturnType<S[P]> }
  ) => void | Promise<void>,
  dependencies: React.DependencyList = []
): void {
  const actionRegister = useActionRegister<T>();
  const registry = useStoreRegistry();

  useEffect(() => {
    // Setup stores if they don't exist
    const stores: { [P in keyof S]: ReturnType<S[P]> } = {} as any;
    
    for (const [storeName, storeFactory] of Object.entries(storeSetup)) {
      let store = registry.getStore(storeName);
      if (!store) {
        store = storeFactory();
        registry.register(storeName, store);
      }
      stores[storeName as keyof S] = store;
    }

    const wrappedHandler = async (
      payload: T[K],
      controller: Parameters<Parameters<typeof createMultiStoreHandler>[1]>[1]
    ) => {
      await handler(payload, controller, stores);
    };

    const unregister = actionRegister.register(action, wrappedHandler);

    return unregister;
  }, [action, ...Object.keys(storeSetup), ...dependencies]);
}