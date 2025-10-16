/**
 * Handler Logic Layer (5-Layer Architecture)
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
import { type CartItem, useCartActionHandler } from '../contexts/CartContexts';

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
  // 🎯 Validate Cart Handler
  useCartActionHandler(
    'validateCart',
    useCallback(
      async (payload) => {
        try {
          logger?.info(`[${moduleId}] Validating cart`, {
            itemCount: payload.items.length,
          });

          // Step 1: Read current state (if needed)
          const _currentValidation = validationStore.getValue();

          // Step 2: Execute business logic
          const validationResult = validateCartItems(payload.items);

          // Step 3: Update store
          validationStore.setValue(validationResult);

          // Side effects
          logger?.info(`[${moduleId}] Cart validation completed`, {
            isValid: validationResult.isValid,
            errorCount: validationResult.errors.length,
          });

          onCartValidated?.(validationResult);
        } catch (error) {
          logger?.error(`[${moduleId}] Cart validation failed`, error);
          validationStore.setValue({
            isValid: false,
            errors: ['Validation process failed'],
            validatedBy: 'error-handler',
          });
        }
      },
      [moduleId, validationStore, logger, onCartValidated]
    )
  );

  // 🎯 Calculate Total Handler
  useCartActionHandler(
    'calculateTotal',
    useCallback(
      async (payload) => {
        try {
          logger?.info(`[${moduleId}] Calculating cart total`, {
            itemCount: payload.items.length,
            hasDiscount: !!payload.discountCode,
          });

          // Step 1: Read current state
          const _currentCalculation = calculationStore.getValue();

          // Step 2: Execute business logic
          let discountCode = payload.discountCode;

          // Optional: Validate discount code with external API
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

          // Step 3: Update store
          calculationStore.setValue(calculationResult);

          // Side effects
          logger?.info(`[${moduleId}] Calculation completed`, {
            total: calculationResult.total,
            itemCount: calculationResult.itemCount,
          });

          onCalculationCompleted?.(calculationResult);
        } catch (error) {
          logger?.error(`[${moduleId}] Calculation failed`, error);
          calculationStore.setValue({
            subtotal: 0,
            tax: 0,
            total: 0,
            itemCount: 0,
            timestamp: Date.now(),
            calculatedBy: 'error-handler',
          });
        }
      },
      [moduleId, calculationStore, apiClient, logger, onCalculationCompleted]
    )
  );

  // 🎯 Process Order Handler
  useCartActionHandler(
    'processOrder',
    useCallback(
      async (payload) => {
        try {
          logger?.info(`[${moduleId}] Processing order`, {
            itemCount: payload.items.length,
            paymentMethod: payload.paymentMethod,
          });

          // Step 1: Read current state
          const _currentOrder = orderStore.getValue();

          // Step 2: Execute business logic
          const orderResult = processOrderData(
            payload.items,
            payload.paymentMethod
          );

          // Step 3: Update store
          orderStore.setValue(orderResult);

          // Side effects: Save to API
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
            } catch (error) {
              logger?.error(`[${moduleId}] Failed to save order to API`, error);
              // Update order status to reflect API failure
              orderStore.update((current) => ({
                ...current!,
                status: 'failed' as const,
              }));
            }
          }

          // Update inventory if needed
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
        } catch (error) {
          logger?.error(`[${moduleId}] Order processing failed`, error);
          orderStore.setValue({
            orderId: '',
            status: 'failed',
            processedBy: 'error-handler',
            timestamp: Date.now(),
          });
        }
      },
      [moduleId, orderStore, apiClient, logger, onOrderProcessed]
    )
  );

  // 🎯 Clear Cart Handler
  useCartActionHandler(
    'clearCart',
    useCallback(async () => {
      try {
        logger?.info(`[${moduleId}] Clearing cart`);

        // Step 1: Read current state
        const currentCart = cartStore.getValue();
        const itemCount = currentCart.length;

        // Step 2: Execute business logic
        const emptyCart = clearCartItems();

        // Step 3: Update store
        cartStore.setValue(emptyCart);

        // Side effects: Reset related stores
        validationStore.setValue({
          isValid: true,
          errors: [],
          validatedBy: 'cart-cleared',
        });

        calculationStore.setValue({
          subtotal: 0,
          tax: 0,
          total: 0,
          itemCount: 0,
          timestamp: Date.now(),
          calculatedBy: 'cart-cleared',
        });

        orderStore.setValue({
          orderId: '',
          status: 'processing',
          processedBy: 'cart-cleared',
          timestamp: Date.now(),
        });

        logger?.info(`[${moduleId}] Cart cleared`, {
          previousItemCount: itemCount,
        });
        onCartCleared?.();
      } catch (error) {
        logger?.error(`[${moduleId}] Failed to clear cart`, error);
      }
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
