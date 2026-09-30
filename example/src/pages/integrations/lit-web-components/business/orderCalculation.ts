export interface OrderItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderSummary {
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
}

export interface AuditRecord {
  id: string;
  message: string;
  timestamp: string;
}

export function calculateItemTotal(
  unitPrice: number,
  quantity: number
): number {
  return Math.max(0, unitPrice) * Math.max(0, quantity);
}

export function calculateOrderSubtotal(items: readonly OrderItem[]): number {
  return items.reduce(
    (sum, item) => sum + calculateItemTotal(item.unitPrice, item.quantity),
    0
  );
}

export function calculateDiscountAmount(
  subtotal: number,
  discountPercent: number
): number {
  if (discountPercent <= 0 || subtotal <= 0) return 0;
  return Math.round(subtotal * (discountPercent / 100));
}

export function calculateOrderSummary(
  items: readonly OrderItem[],
  discountEnabled: boolean,
  discountPercent = 10
): OrderSummary {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = calculateOrderSubtotal(items);
  const discountAmount = discountEnabled
    ? calculateDiscountAmount(subtotal, discountPercent)
    : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  return {
    itemCount,
    subtotal,
    discountAmount,
    grandTotal,
  };
}

export function validateQuantity(
  quantity: number,
  min = 1,
  max = 99
): { isValid: boolean; message?: string } {
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity)) {
    return { isValid: false, message: '수량은 정수여야 합니다.' };
  }
  if (quantity < min) {
    return { isValid: false, message: `최소 수량은 ${min}개입니다.` };
  }
  if (quantity > max) {
    return { isValid: false, message: `최대 수량은 ${max}개입니다.` };
  }
  return { isValid: true };
}

let auditSequence = 0;

export function createAuditRecord(message: string): AuditRecord {
  auditSequence += 1;
  const now = new Date();
  const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  return {
    id: `lit-audit-${auditSequence}`,
    message,
    timestamp: timeString,
  };
}
