/**
 * Store Subscriptions Layer (5-Layer Architecture)
 *
 * This layer:
 * - Provides store value subscriptions
 * - Manages computed values and derived state
 * - Handles store references and data access
 * - Abstracts store complexities from views
 */

import { useStoreValue } from '@context-action/react';
import { useMemo } from 'react';
import { getCartStatistics } from '../business/cartBusinessLogic';
import { useCartStore } from '../contexts/CartContexts';

/**
 * Cart Data Hook
 *
 * Provides reactive subscriptions to all cart-related stores
 * with computed values and statistics.
 */
export function useCartData() {
  // 🎯 Store References
  const cartStore = useCartStore('cart');
  const validationStore = useCartStore('validation');
  const calculationStore = useCartStore('calculation');
  const orderStore = useCartStore('order');

  // 🎯 Store Values (Reactive Subscriptions)
  const cart = useStoreValue(cartStore);
  const validation = useStoreValue(validationStore);
  const calculation = useStoreValue(calculationStore);
  const order = useStoreValue(orderStore);

  // 🎯 Computed Values
  const cartStatistics = useMemo(() => {
    return getCartStatistics(cart);
  }, [cart]);

  const sortedCart = useMemo(() => {
    return [...cart].sort((a, b) => {
      // Sort by name, then by price
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return a.price - b.price;
    });
  }, [cart]);

  const expensiveItems = useMemo(() => {
    return cart.filter((item) => item.price > 50);
  }, [cart]);

  const isCartEmpty = useMemo(() => {
    return cart.length === 0;
  }, [cart]);

  const isCartValid = useMemo(() => {
    // validation이 null이면 아직 검증하지 않은 상태로 간주 (유효한 것으로 처리)
    // validation이 있으면 isValid 값 확인
    return validation === null ? true : validation.isValid;
  }, [validation]);

  const hasValidationErrors = useMemo(() => {
    return validation ? validation.errors.length > 0 : false;
  }, [validation]);

  const totalValue = useMemo(() => {
    return calculation?.total ?? 0;
  }, [calculation]);

  const isOrderProcessing = useMemo(() => {
    return order?.status === 'processing';
  }, [order]);

  const isOrderCompleted = useMemo(() => {
    return order?.status === 'completed';
  }, [order]);

  const isOrderFailed = useMemo(() => {
    return order?.status === 'failed';
  }, [order]);

  // 🎯 Derived State for UI
  const canCheckout = useMemo(() => {
    return !isCartEmpty && isCartValid && !isOrderProcessing;
  }, [isCartEmpty, isCartValid, isOrderProcessing]);

  const cartSummary = useMemo(() => {
    return {
      itemCount: cartStatistics.totalItems,
      uniqueItems: cartStatistics.uniqueItems,
      totalValue: cartStatistics.totalValue,
      averagePrice: cartStatistics.averageItemPrice,
      isEmpty: isCartEmpty,
      isValid: isCartValid,
      canCheckout,
    };
  }, [cartStatistics, isCartEmpty, isCartValid, canCheckout]);

  return {
    // Store references (for dependency injection)
    stores: {
      cartStore,
      validationStore,
      calculationStore,
      orderStore,
    },

    // Raw store values
    cart,
    validation,
    calculation,
    order,

    // Computed values
    cartStatistics,
    sortedCart,
    expensiveItems,
    cartSummary,

    // Boolean flags
    isCartEmpty,
    isCartValid,
    hasValidationErrors,
    canCheckout,
    isOrderProcessing,
    isOrderCompleted,
    isOrderFailed,

    // Convenience values
    totalValue,
    itemCount: cartStatistics.totalItems,
    uniqueItems: cartStatistics.uniqueItems,
    validationErrors: validation?.errors ?? [],
    orderId: order?.orderId ?? '',
    orderStatus: order?.status ?? 'processing',
  };
}

/**
 * Cart Form Data Hook
 *
 * Specialized hook for form-related cart data and validation state.
 */
export function useCartFormData() {
  const {
    validation,
    hasValidationErrors,
    validationErrors,
    isOrderProcessing,
    canCheckout,
  } = useCartData();

  // 🎯 Form-specific computed values
  const isSubmitting = useMemo(() => {
    return isOrderProcessing;
  }, [isOrderProcessing]);

  const formErrors = useMemo(() => {
    return validationErrors.map((error, index) => ({
      id: index,
      message: error,
      type: 'validation' as const,
    }));
  }, [validationErrors]);

  const formValidation = useMemo(() => {
    return {
      isValid: !hasValidationErrors,
      errors: formErrors,
      hasErrors: hasValidationErrors,
      isSubmitting,
      canSubmit: canCheckout && !isSubmitting,
    };
  }, [hasValidationErrors, formErrors, isSubmitting, canCheckout]);

  return {
    validation,
    formValidation,
    formErrors,
    isSubmitting,
    canSubmit: formValidation.canSubmit,
    hasErrors: hasValidationErrors,
  };
}

/**
 * Cart Statistics Hook
 *
 * Specialized hook for cart statistics and analytics data.
 */
export function useCartStatistics() {
  const { cart, calculation } = useCartData();

  // 🎯 Enhanced statistics
  const detailedStatistics = useMemo(() => {
    const basic = getCartStatistics(cart);

    return {
      // Basic statistics (matches CartStatisticsView interface)
      totalItems: basic.totalItems,
      totalValue: basic.totalValue,
      averageItemPrice: basic.averageItemPrice,
      uniqueItems: basic.uniqueItems,
      mostExpensiveItem: basic.mostExpensiveItem ?? null,

      // Extended statistics
      subtotal: calculation?.subtotal ?? 0,
      tax: calculation?.tax ?? 0,
      finalTotal: calculation?.total ?? basic.totalValue,

      // Category analysis
      priceRanges: {
        under10: cart.filter((item) => item.price < 10).length,
        between10And50: cart.filter(
          (item) => item.price >= 10 && item.price <= 50
        ).length,
        over50: cart.filter((item) => item.price > 50).length,
      },

      // Quantity analysis
      quantityStats: {
        single: cart.filter((item) => item.quantity === 1).length,
        multiple: cart.filter((item) => item.quantity > 1).length,
        averageQuantity:
          cart.length > 0
            ? cart.reduce((sum, item) => sum + item.quantity, 0) / cart.length
            : 0,
      },
    };
  }, [cart, calculation]);

  return {
    statistics: detailedStatistics,
    priceRanges: detailedStatistics.priceRanges,
    quantityStats: detailedStatistics.quantityStats,
  };
}

/**
 * Cart Item Management Hook
 *
 * Specialized hook for individual cart item operations and state.
 */
export function useCartItemData(itemId?: string) {
  const { cart, sortedCart } = useCartData();

  // 🎯 Item-specific data
  const selectedItem = useMemo(() => {
    return itemId ? cart.find((item) => item.id === itemId) : null;
  }, [cart, itemId]);

  const itemIndex = useMemo(() => {
    return itemId ? cart.findIndex((item) => item.id === itemId) : -1;
  }, [cart, itemId]);

  const itemExists = useMemo(() => {
    return itemIndex >= 0;
  }, [itemIndex]);

  const similarItems = useMemo(() => {
    if (!selectedItem) return [];

    return cart.filter(
      (item) =>
        item.id !== selectedItem.id &&
        (item.name.toLowerCase().includes(selectedItem.name.toLowerCase()) ||
          Math.abs(item.price - selectedItem.price) < 5)
    );
  }, [cart, selectedItem]);

  return {
    selectedItem,
    itemIndex,
    itemExists,
    similarItems,
    allItems: cart,
    sortedItems: sortedCart,
  };
}

