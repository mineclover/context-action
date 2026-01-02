/**
 * Action Dispatch & Callbacks Layer (5-Layer Architecture)
 *
 * This layer:
 * - Provides action dispatching functions
 * - Handles action results and callbacks
 * - Manages async action coordination
 * - Abstracts action complexities from views
 */

import { useCallback } from 'react';
import {
  type CartItem,
  useCartActionWithResult,
} from '../contexts/CartContexts';

/**
 * Cart Actions Hook
 *
 * Provides typed action dispatching functions with result handling.
 * Each action returns a Promise that can be used for UI feedback.
 */
export function useCartActions() {
  const { dispatchWithResult } = useCartActionWithResult();

  // 🎯 Validate Cart Action
  const validateCart = useCallback(
    async (items: CartItem[]) => {
      try {
        await dispatchWithResult('validateCart', { items });
        return { success: true };
      } catch (error) {
        console.error('Cart validation failed:', error);
        return { success: false, error };
      }
    },
    [dispatchWithResult]
  );

  // 🎯 Calculate Total Action
  const calculateTotal = useCallback(
    async (items: CartItem[], discountCode?: string) => {
      try {
        await dispatchWithResult('calculateTotal', { items, discountCode });
        return { success: true };
      } catch (error) {
        console.error('Total calculation failed:', error);
        return { success: false, error };
      }
    },
    [dispatchWithResult]
  );

  // 🎯 Process Order Action
  const processOrder = useCallback(
    async (items: CartItem[], paymentMethod: string) => {
      try {
        await dispatchWithResult('processOrder', { items, paymentMethod });
        return { success: true };
      } catch (error) {
        console.error('Order processing failed:', error);
        return { success: false, error };
      }
    },
    [dispatchWithResult]
  );

  // 🎯 Clear Cart Action
  const clearCart = useCallback(async () => {
    try {
      await dispatchWithResult('clearCart');
      return { success: true };
    } catch (error) {
      console.error('Clear cart failed:', error);
      return { success: false, error };
    }
  }, [dispatchWithResult]);

  // 🎯 Convenience Actions (Composite Operations)
  const validateAndCalculate = useCallback(
    async (items: CartItem[], discountCode?: string) => {
      try {
        // Sequential operations with error handling
        const validationResult = await validateCart(items);
        if (!validationResult.success) {
          return validationResult;
        }

        const calculationResult = await calculateTotal(items, discountCode);
        return calculationResult;
      } catch (error) {
        console.error('Validate and calculate failed:', error);
        return { success: false, error };
      }
    },
    [validateCart, calculateTotal]
  );

  const completeCheckout = useCallback(
    async (items: CartItem[], paymentMethod: string, discountCode?: string) => {
      try {
        // Multi-step checkout process
        const validationResult = await validateCart(items);
        if (!validationResult.success) {
          return {
            success: false,
            error: 'Validation failed',
            step: 'validation',
          };
        }

        const calculationResult = await calculateTotal(items, discountCode);
        if (!calculationResult.success) {
          return {
            success: false,
            error: 'Calculation failed',
            step: 'calculation',
          };
        }

        const orderResult = await processOrder(items, paymentMethod);
        if (!orderResult.success) {
          return {
            success: false,
            error: 'Order processing failed',
            step: 'order',
          };
        }


        // NOTE: clearCart is intentionally NOT called here
        // This allows the user to see the final validation, calculation, and order results
        // Users can manually clear the cart using the "Clear Cart" button

        return { success: true, step: 'completed' };
      } catch (error) {
        console.error('Complete checkout failed:', error);
        return { success: false, error, step: 'unknown' };
      }
    },
    [validateCart, calculateTotal, processOrder]
  );

  return {
    // Basic actions
    validateCart,
    calculateTotal,
    processOrder,
    clearCart,

    // Convenience actions
    validateAndCalculate,
    completeCheckout,
  };
}

/**
 * Cart Action Callbacks Hook
 *
 * Provides callback-based action functions for scenarios where
 * you need to handle success/error cases explicitly with UI feedback.
 */
export function useCartActionCallbacks() {
  const actions = useCartActions();

  // 🎯 Validate Cart with Callbacks
  const validateCartWithCallbacks = useCallback(
    async (
      items: CartItem[],
      callbacks?: {
        onSuccess?: () => void;
        onError?: (error: any) => void;
        onFinally?: () => void;
      }
    ) => {
      try {
        const result = await actions.validateCart(items);
        if (result.success) {
          callbacks?.onSuccess?.();
        } else {
          callbacks?.onError?.(result.error);
        }
        return result;
      } catch (error) {
        callbacks?.onError?.(error);
        return { success: false, error };
      } finally {
        callbacks?.onFinally?.();
      }
    },
    [actions]
  );

  // 🎯 Calculate Total with Callbacks
  const calculateTotalWithCallbacks = useCallback(
    async (
      items: CartItem[],
      discountCode: string | undefined,
      callbacks?: {
        onSuccess?: () => void;
        onError?: (error: any) => void;
        onFinally?: () => void;
      }
    ) => {
      try {
        const result = await actions.calculateTotal(items, discountCode);
        if (result.success) {
          callbacks?.onSuccess?.();
        } else {
          callbacks?.onError?.(result.error);
        }
        return result;
      } catch (error) {
        callbacks?.onError?.(error);
        return { success: false, error };
      } finally {
        callbacks?.onFinally?.();
      }
    },
    [actions]
  );

  // 🎯 Process Order with Callbacks
  const processOrderWithCallbacks = useCallback(
    async (
      items: CartItem[],
      paymentMethod: string,
      callbacks?: {
        onSuccess?: () => void;
        onError?: (error: any) => void;
        onFinally?: () => void;
      }
    ) => {
      try {
        const result = await actions.processOrder(items, paymentMethod);
        if (result.success) {
          callbacks?.onSuccess?.();
        } else {
          callbacks?.onError?.(result.error);
        }
        return result;
      } catch (error) {
        callbacks?.onError?.(error);
        return { success: false, error };
      } finally {
        callbacks?.onFinally?.();
      }
    },
    [actions]
  );

  // 🎯 Complete Checkout with Progress Callbacks
  const completeCheckoutWithCallbacks = useCallback(
    async (
      items: CartItem[],
      paymentMethod: string,
      discountCode: string | undefined,
      callbacks?: {
        onValidationStart?: () => void;
        onValidationComplete?: () => void;
        onCalculationStart?: () => void;
        onCalculationComplete?: () => void;
        onOrderStart?: () => void;
        onOrderComplete?: () => void;
        onSuccess?: () => void;
        onError?: (error: any, step: string) => void;
        onFinally?: () => void;
      }
    ) => {
      try {
        // Step 1: Validation
        callbacks?.onValidationStart?.();
        const validationResult = await actions.validateCart(items);
        callbacks?.onValidationComplete?.();

        if (!validationResult.success) {
          callbacks?.onError?.(validationResult.error, 'validation');
          return validationResult;
        }

        // Step 2: Calculation
        callbacks?.onCalculationStart?.();
        const calculationResult = await actions.calculateTotal(
          items,
          discountCode
        );
        callbacks?.onCalculationComplete?.();

        if (!calculationResult.success) {
          callbacks?.onError?.(calculationResult.error, 'calculation');
          return calculationResult;
        }

        // Step 3: Order Processing
        callbacks?.onOrderStart?.();
        const orderResult = await actions.processOrder(items, paymentMethod);
        callbacks?.onOrderComplete?.();

        if (!orderResult.success) {
          callbacks?.onError?.(orderResult.error, 'order');
          return orderResult;
        }

        // NOTE: clearCart is intentionally NOT called here
        // This allows the user to see the final validation, calculation, and order results
        // Users can manually clear the cart using the "Clear Cart" button


        callbacks?.onSuccess?.();
        return { success: true, step: 'completed' };
      } catch (error) {
        callbacks?.onError?.(error, 'unknown');
        return { success: false, error, step: 'unknown' };
      } finally {
        callbacks?.onFinally?.();
      }
    },
    [actions]
  );

  return {
    ...actions,
    validateCartWithCallbacks,
    calculateTotalWithCallbacks,
    processOrderWithCallbacks,
    completeCheckoutWithCallbacks,
  };
}
