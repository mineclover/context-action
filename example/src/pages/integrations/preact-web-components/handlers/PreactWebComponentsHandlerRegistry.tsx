import { type ReactNode, useCallback } from 'react';
import {
  createAuditRecord,
  validateQuantity,
} from '../business/orderCalculation';
import {
  initialOrderItems,
  PreactWebComponentsActionsContext,
  PreactWebComponentsStoresContext,
} from '../contexts/PreactWebComponentsContexts';

export function PreactWebComponentsHandlerRegistry({
  children,
}: {
  children: ReactNode;
}) {
  const itemsStore = PreactWebComponentsStoresContext.useStore('items');
  const discountStore =
    PreactWebComponentsStoresContext.useStore('discountEnabled');
  const ticketStore =
    PreactWebComponentsStoresContext.useStore('submittedTicket');
  const auditStore = PreactWebComponentsStoresContext.useStore('auditLog');

  const appendAudit = useCallback(
    (message: string) => {
      const current = auditStore.getValue();
      auditStore.setValue(
        [createAuditRecord(message), ...current].slice(0, 10)
      );
    },
    [auditStore]
  );

  PreactWebComponentsActionsContext.useActionHandler(
    'quantityUpdated',
    useCallback(
      ({ productId, quantity }) => {
        const validation = validateQuantity(quantity, 1, 99);
        if (!validation.isValid) {
          appendAudit(
            `Quantity update rejected for ${productId}: ${validation.message}`
          );
          return;
        }

        const currentItems = itemsStore.getValue();
        const updated = currentItems.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        );
        itemsStore.setValue(updated);
        appendAudit(`Quantity updated: ${productId} → ${quantity} ea`);
      },
      [appendAudit, itemsStore]
    ),
    { id: 'preact-wc-quantity-update', priority: 100 }
  );

  PreactWebComponentsActionsContext.useActionHandler(
    'discountToggled',
    useCallback(
      ({ enabled }) => {
        discountStore.setValue(enabled);
        appendAudit(`10% VIP Coupon ${enabled ? 'applied' : 'removed'}.`);
      },
      [appendAudit, discountStore]
    ),
    { id: 'preact-wc-discount-toggle', priority: 100 }
  );

  PreactWebComponentsActionsContext.useActionHandler(
    'cartReset',
    useCallback(() => {
      itemsStore.setValue([...initialOrderItems]);
      discountStore.setValue(false);
      ticketStore.setValue(null);
      appendAudit('Cart & Form restored to initial state.');
    }, [appendAudit, discountStore, itemsStore, ticketStore]),
    { id: 'preact-wc-cart-reset', priority: 100 }
  );

  PreactWebComponentsActionsContext.useActionHandler(
    'ticketSubmitted',
    useCallback(
      ({ attendeeName, ticketType, count, specialRequest }) => {
        const now = new Date();
        const submittedAt = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        ticketStore.setValue({
          attendeeName,
          ticketType,
          count,
          specialRequest,
          submittedAt,
        });
        appendAudit(
          `Form-Associated Custom Element submission received: ${attendeeName} reserved ${count}x [${ticketType}]`
        );
      },
      [appendAudit, ticketStore]
    ),
    { id: 'preact-wc-ticket-submit', priority: 100 }
  );

  return <>{children}</>;
}
