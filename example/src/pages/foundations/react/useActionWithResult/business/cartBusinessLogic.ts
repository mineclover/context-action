/**
 * Business Logic Layer (5-Layer Architecture)
 *
 * This layer contains pure business functions with no side effects:
 * - Cart validation logic
 * - Price calculation algorithms
 * - Order processing logic
 * - All functions are testable and framework-agnostic
 */

import type { CartItem, ValidationResult, CalculationResult, ProcessingResult } from '../contexts/CartContexts';

// 🎯 Cart Validation Business Logic
export function validateCartItems(items: CartItem[]): ValidationResult {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('Cart cannot be empty');
  }

  for (const item of items) {
    if (!item.name.trim()) {
      errors.push(`Item ${item.id} must have a name`);
    }
    if (item.price <= 0) {
      errors.push(`Item ${item.name} must have a positive price`);
    }
    if (item.quantity <= 0) {
      errors.push(`Item ${item.name} must have a positive quantity`);
    }
    if (item.quantity > 99) {
      errors.push(`Item ${item.name} quantity cannot exceed 99`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedBy: 'cart-validator-v1.0',
  };
}

// 🎯 Price Calculation Business Logic
export function calculateCartTotal(
  items: CartItem[],
  discountCode?: string
): CalculationResult {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );

  // Apply discount based on code
  let discountRate = 0;
  if (discountCode) {
    switch (discountCode.toUpperCase()) {
      case 'SAVE10':
        discountRate = 0.1; // 10% discount
        break;
      case 'SAVE20':
        discountRate = 0.2; // 20% discount
        break;
      case 'WELCOME':
        discountRate = 0.15; // 15% discount
        break;
    }
  }

  const discountAmount = subtotal * discountRate;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const tax = subtotalAfterDiscount * 0.08; // 8% tax rate
  const total = subtotalAfterDiscount + tax;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal: Number(subtotalAfterDiscount.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
    itemCount,
    timestamp: Date.now(),
    calculatedBy: 'cart-calculator-v2.1',
  };
}

// 🎯 Order Processing Business Logic
export function processOrderData(
  items: CartItem[],
  paymentMethod: string
): ProcessingResult {
  // Generate order ID
  const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Determine processing status based on payment method and items
  let status: ProcessingResult['status'] = 'processing';

  // Business rules for order processing
  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (paymentMethod === 'credit_card' && totalValue > 1000) {
    status = 'processing'; // Requires manual verification for high-value orders
  } else if (paymentMethod === 'paypal' || paymentMethod === 'stripe') {
    status = 'completed'; // Instant processing for trusted payment methods
  } else if (paymentMethod === 'bank_transfer') {
    status = 'processing'; // Pending payment confirmation
  } else {
    status = 'failed'; // Unknown payment method
  }

  return {
    orderId,
    status,
    processedBy: 'order-processor-v3.0',
    timestamp: Date.now(),
  };
}

// 🎯 Cart Item Management Business Logic
export function addItemToCart(
  currentCart: CartItem[],
  newItem: Omit<CartItem, 'id'>
): CartItem[] {
  // Check if item already exists
  const existingItemIndex = currentCart.findIndex(
    item => item.name === newItem.name && item.price === newItem.price
  );

  if (existingItemIndex >= 0) {
    // Update existing item quantity
    const updatedCart = [...currentCart];
    const existingItem = updatedCart[existingItemIndex];
    if (existingItem) {
      updatedCart[existingItemIndex] = {
        ...existingItem,
        quantity: Math.min(existingItem.quantity + newItem.quantity, 99)
      };
    }
    return updatedCart;
  } else {
    // Add new item
    const cartItem: CartItem = {
      ...newItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      quantity: Math.min(newItem.quantity, 99)
    };
    return [...currentCart, cartItem];
  }
}

export function removeItemFromCart(
  currentCart: CartItem[],
  itemId: string
): CartItem[] {
  return currentCart.filter(item => item.id !== itemId);
}

export function updateItemQuantity(
  currentCart: CartItem[],
  itemId: string,
  newQuantity: number
): CartItem[] {
  if (newQuantity <= 0) {
    return removeItemFromCart(currentCart, itemId);
  }

  return currentCart.map(item =>
    item.id === itemId
      ? { ...item, quantity: Math.min(Math.max(newQuantity, 1), 99) }
      : item
  );
}

export function clearCart(): CartItem[] {
  return [];
}

// 🎯 Cart Statistics Business Logic
export function getCartStatistics(items: CartItem[]) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const averageItemPrice = items.length > 0
    ? totalValue / totalItems
    : 0;

  const mostExpensiveItem = items.length > 0
    ? items.reduce((max, item) => item.price > max.price ? item : max)
    : null;

  return {
    totalItems,
    totalValue: Number(totalValue.toFixed(2)),
    averageItemPrice: Number(averageItemPrice.toFixed(2)),
    uniqueItems: items.length,
    mostExpensiveItem,
  };
}