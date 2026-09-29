import type { OrderItem, OrderSummary } from './order-types.js';

const TAX_RATE = 0.1; // 10% tax

/**
 * Pure calculation for OrderSummary.
 * Deterministic and cache-friendly for Signal computed projection.
 */
export function calculateOrderSummary(items: readonly OrderItem[]): OrderSummary {
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const grandTotal = subtotal + tax;

  const formattedGrandTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(grandTotal);

  return {
    totalItemCount,
    subtotal,
    tax,
    grandTotal,
    formattedGrandTotal,
  };
}
