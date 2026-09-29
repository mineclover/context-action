import type { OrderDraft, ValidationIssue } from './order-types.js';

/**
 * Pure domain validation for OrderDraft.
 * Free from DOM, framework hooks, or side effects.
 */
export function validateOrderDraft(draft: OrderDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!draft.customerName.trim()) {
    issues.push({ field: 'customerName', message: 'Customer name is required' });
  } else if (draft.customerName.trim().length < 2) {
    issues.push({ field: 'customerName', message: 'Customer name must be at least 2 characters' });
  }

  if (!draft.shippingAddress.trim()) {
    issues.push({ field: 'shippingAddress', message: 'Shipping address is required' });
  }

  if (draft.items.length === 0) {
    issues.push({ field: 'items', message: 'At least one item must be added to the order' });
  }

  for (const item of draft.items) {
    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      issues.push({ field: `item_${item.id}`, message: `Item "${item.name}" must have a positive integer quantity` });
    }
  }

  return issues;
}
