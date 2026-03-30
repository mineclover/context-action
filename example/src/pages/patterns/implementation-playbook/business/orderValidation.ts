import type { OrderDraft } from './orderDraft';

export interface OrderFieldErrors {
  customerName?: string;
  email?: string;
  quantity?: string;
}

export type OrderValidationCode =
  | 'customer_name_required'
  | 'email_required'
  | 'email_invalid'
  | 'quantity_min';

export type OrderValidationField = keyof OrderFieldErrors;

export interface OrderValidationIssue {
  field: OrderValidationField;
  code: OrderValidationCode;
}

export interface OrderValidationResult {
  isValid: boolean;
  issues: OrderValidationIssue[];
}

export function validateOrderDraft(draft: OrderDraft): OrderValidationResult {
  const issues: OrderValidationIssue[] = [];

  if (!draft.customerName.trim()) {
    issues.push({
      field: 'customerName',
      code: 'customer_name_required',
    });
  }

  if (!draft.email.trim()) {
    issues.push({
      field: 'email',
      code: 'email_required',
    });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
    issues.push({
      field: 'email',
      code: 'email_invalid',
    });
  }

  if (!Number.isFinite(draft.quantity) || draft.quantity < 1) {
    issues.push({
      field: 'quantity',
      code: 'quantity_min',
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
