/**
 * Domain Models for Projected Order Reference Implementation
 * Follows Context-Layered Architecture Tier 1 & Tier 2 specifications.
 */

export interface OrderItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderDraft {
  customerName: string;
  shippingAddress: string;
  items: OrderItem[];
  notes: string;
}

export type OrderSubmissionPhase = 'idle' | 'validating' | 'submitting' | 'success' | 'failed';

export interface OrderSubmission {
  phase: OrderSubmissionPhase;
  orderId?: string;
  errorMessage?: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: number;
  message: string;
}

export interface OrderState {
  draft: OrderDraft;
  submission: OrderSubmission;
  validationIssues: ValidationIssue[];
  activityLog: ActivityEntry[];
}

export interface OrderSummary {
  totalItemCount: number;
  subtotal: number;
  tax: number;
  grandTotal: number;
  formattedGrandTotal: string;
}

export interface OrderActions {
  updateCustomerName: { name: string };
  updateShippingAddress: { address: string };
  addItem: { item: OrderItem };
  removeItem: { itemId: string };
  updateItemQuantity: { itemId: string; quantity: number };
  submitOrder: void;
  resetDraft: void;
  retrySubmission: void;
}
