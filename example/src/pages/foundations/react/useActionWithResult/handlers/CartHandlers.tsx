/**
 * Handler Logic Layer (6-Layer Context-Layered Architecture)
 *
 * This layer:
 * - Implements action handlers with dependency injection
 * - Coordinates between business logic and stores
 * - Handles side effects like API calls and logging
 * - Uses props-based dependency injection for testability
 */

import type { Store } from '@context-action/react';
import { type ReactNode, useCallback } from 'react';
import {
  calculateCartTotal,
  clearCart as clearCartItems,
  processOrderData,
  validateCartItems,
} from '../business/cartBusinessLogic';
import {
  type CartItem,
  useCartActionGuard,
  useCartActionObserver,
  useCartResultHandler,
} from '../contexts/CartContexts';

// 🎯 Handler Props Interface (Dependency Injection)
export interface CartHandlersProps {
  children: ReactNode;
  moduleId: string;

  // Store Dependencies (Injected)
  cartStore: Store<CartItem[]>;
  validationStore: Store<any>;
  calculationStore: Store<any>;
  orderStore: Store<any>;

  // External Dependencies (Injected)
  apiClient?: {
    saveOrder?: (orderData: any) => Promise<void>;
    updateInventory?: (items: CartItem[]) => Promise<void>;
    applyDiscountCode?: (
      code: string
    ) => Promise<{ valid: boolean; rate: number }>;
  };
  logger?: {
    info: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
  };

  // Event Callbacks (Injected)
  onCartValidated?: (result: any) => void;
  onOrderProcessed?: (result: any) => void;
  onCalculationCompleted?: (result: any) => void;
  onCartCleared?: () => void;
}

/**
 * Cart Handlers Component
 *
 * This component registers all cart-related action handlers.
 * It uses dependency injection through props for testability and flexibility.
 */
export function CartHandlers({
  children,
  moduleId,
  cartStore,
  validationStore,
  calculationStore,
  orderStore,
  apiClient,
  logger,
  onCartValidated,
  onOrderProcessed,
  onCalculationCompleted,
  onCartCleared,
}: CartHandlersProps) {
  // 🛡️ Guard: reject empty cart orders before execution
  useCartActionGuard(
    'processOrder',
    useCallback(
      (payload, controller) => {
        if (payload.items.length === 0) {
          logger?.info(`[${moduleId}] Blocked empty order submission`);
          controller.abort('Cannot process an empty cart');
        }
      },
      [moduleId, logger]
    ),
    { id: 'cart-process-order-guard', priority: 100 }
  );

  // 🔍 Post-outcome observer for order lifecycle logging
  useCartActionObserver(
    'processOrder',
    useCallback(
      (event) => {
        logger?.info(`[${moduleId}] processOrder settled`, {
          outcome: event.outcome,
          itemCount: event.payload.items.length,
        });
      },
      [moduleId, logger]
    ),
    { id: 'cart-process-order-observer', when: 'always', priority: 10 }
  );

  // 🎯 Validate Cart Result Handler
  useCartResultHandler(
    'validateCart',
    useCallback(
      async (payload) => {
        try {
          logger?.info(`[${moduleId}] Validating cart`, {
            itemCount: payload.items.length,
          });

          const validationResult = validateCartItems(payload.items);
          validationStore.setValue(validationResult);

          logger?.info(`[${moduleId}] Cart validation completed`, {
            isValid: validationResult.isValid,
            errorCount: validationResult.errors.length,
          });

          onCartValidated?.(validationResult);
          return validationResult;
        } catch (error) {
          logger?.error(`[${moduleId}] Cart validation failed`, error);
          const fallback = {
            isValid: false,
            errors: ['Validation process failed'],
            validatedBy: 'error-handler',
          };
          validationStore.setValue(fallback);
          return fallback;
        }
      },
      [moduleId, validationStore, logger, onCartValidated]
    )
  );

  // 🎯 Calculate Total Result Handler
  useCartResultHandler(
    'calculateTotal',
    useCallback(
      async (payload) => {
        try {
          logger?.info(`[${moduleId}] Calculating cart total`, {
            itemCount: payload.items.length,
            hasDiscount: !!payload.discountCode,
          });

          let discountCode = payload.discountCode;

          if (discountCode && apiClient?.applyDiscountCode) {
            try {
              const discountValidation =
                await apiClient.applyDiscountCode(discountCode);
              if (!discountValidation.valid) {
                discountCode = undefined;
                logger?.info(
                  `[${moduleId}] Invalid discount code: ${payload.discountCode}`
                );
              }
            } catch (error) {
              logger?.error(`[${moduleId}] Discount validation failed`, error);
              discountCode = undefined;
            }
          }

          const calculationResult = calculateCartTotal(
            payload.items,
            discountCode
          );
          calculationStore.setValue(calculationResult);

          logger?.info(`[${moduleId}] Calculation completed`, {
            total: calculationResult.total,
            itemCount: calculationResult.itemCount,
          });

          onCalculationCompleted?.(calculationResult);
          return calculationResult;
        } catch (error) {
          logger?.error(`[${moduleId}] Calculation failed`, error);
          const fallback = {
            subtotal: 0,
            tax: 0,
            total: 0,
            itemCount: 0,
            timestamp: Date.now(),
            calculatedBy: 'error-handler',
          };
          calculationStore.setValue(fallback);
          return fallback;
        }
      },
      [moduleId, calculationStore, apiClient, logger, onCalculationCompleted]
    )
  );

  // 🎯 Process Order Result Handler
  useCartResultHandler(
    'processOrder',
    useCallback(
      async (payload) => {
        try {
          logger?.info(`[${moduleId}] Processing order`, {
            itemCount: payload.items.length,
            paymentMethod: payload.paymentMethod,
          });

          const orderResult = processOrderData(
            payload.items,
            payload.paymentMethod
          );
          orderStore.setValue(orderResult);

          if (apiClient?.saveOrder) {
            try {
              await apiClient.saveOrder({
                orderId: orderResult.orderId,
                items: payload.items,
                paymentMethod: payload.paymentMethod,
                status: orderResult.status,
                timestamp: orderResult.timestamp,
              });

              logger?.info(`[${moduleId}] Order saved to API`, {
                orderId: orderResult.orderId,
              });

              orderStore.update((current) => ({
                ...current!,
                status: 'completed' as const,
              }));
            } catch (error) {
              logger?.error(`[${moduleId}] Failed to save order to API`, error);
              orderStore.update((current) => ({
                ...current!,
                status: 'failed' as const,
              }));
            }
          } else {
            orderStore.update((current) => ({
              ...current!,
              status: 'completed' as const,
            }));
          }

          if (
            orderResult.status === 'completed' &&
            apiClient?.updateInventory
          ) {
            try {
              await apiClient.updateInventory(payload.items);
              logger?.info(`[${moduleId}] Inventory updated`, {
                orderId: orderResult.orderId,
              });
            } catch (error) {
              logger?.error(`[${moduleId}] Failed to update inventory`, error);
            }
          }

          onOrderProcessed?.(orderResult);
          return orderStore.getValue() ?? orderResult;
        } catch (error) {
          logger?.error(`[${moduleId}] Order processing failed`, error);
          const fallback = {
            orderId: '',
            status: 'failed' as const,
            processedBy: 'error-handler',
            timestamp: Date.now(),
          };
          orderStore.setValue(fallback);
          return fallback;
        }
      },
      [moduleId, orderStore, apiClient, logger, onOrderProcessed]
    )
  );

  // 🎯 Clear Cart Result Handler
  useCartResultHandler(
    'clearCart',
    useCallback(async () => {
      try {
        logger?.info(`[${moduleId}] Clearing cart`);

        const currentCart = cartStore.getValue();
        const itemCount = currentCart.length;
        const emptyCart = clearCartItems();

        cartStore.setValue(emptyCart);
        validationStore.setValue(null);
        calculationStore.setValue(null);
        orderStore.setValue(null);

        logger?.info(`[${moduleId}] Cart cleared`, {
          previousItemCount: itemCount,
        });
        onCartCleared?.();
      } catch (error) {
        logger?.error(`[${moduleId}] Failed to clear cart`, error);
      }
      return { cleared: true as const };
    }, [
      moduleId,
      cartStore,
      validationStore,
      calculationStore,
      orderStore,
      logger,
      onCartCleared,
    ])
  );

  return <>{children}</>;
}
