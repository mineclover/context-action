import { type ReactNode, useCallback } from 'react';
import {
  createAuditRecord,
  validateQuantity,
} from '../business/orderCalculation';
import {
  initialOrderItems,
  LitWebComponentsActionsContext,
  LitWebComponentsStoresContext,
} from '../contexts/LitWebComponentsContexts';

export function LitWebComponentsHandlerRegistry({
  children,
}: {
  children: ReactNode;
}) {
  const itemsStore = LitWebComponentsStoresContext.useStore('items');
  const discountStore =
    LitWebComponentsStoresContext.useStore('discountEnabled');
  const ticketStore = LitWebComponentsStoresContext.useStore('submittedTicket');
  const auditStore = LitWebComponentsStoresContext.useStore('auditLog');

  const appendAudit = useCallback(
    (message: string) => {
      const current = auditStore.getValue();
      auditStore.setValue(
        [createAuditRecord(message), ...current].slice(0, 10)
      );
    },
    [auditStore]
  );

  LitWebComponentsActionsContext.useActionHandler(
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
        appendAudit(
          `Quantity updated: ${productId} → ${quantity} ea (StoreController notification dispatched)`
        );
      },
      [appendAudit, itemsStore]
    ),
    { id: 'lit-wc-quantity-update', priority: 100 }
  );

  LitWebComponentsActionsContext.useActionHandler(
    'discountToggled',
    useCallback(
      ({ enabled }) => {
        discountStore.setValue(enabled);
        appendAudit(
          `10% VIP Special Discount ${enabled ? 'applied' : 'cancelled'}.`
        );
      },
      [appendAudit, discountStore]
    ),
    { id: 'lit-wc-discount-toggle', priority: 100 }
  );

  LitWebComponentsActionsContext.useActionHandler(
    'cartReset',
    useCallback(() => {
      itemsStore.setValue([...initialOrderItems]);
      discountStore.setValue(false);
      ticketStore.setValue(null);
      appendAudit('Lit Cart & Form restored to baseline values.');
    }, [appendAudit, discountStore, itemsStore, ticketStore]),
    { id: 'lit-wc-cart-reset', priority: 100 }
  );

  LitWebComponentsActionsContext.useActionHandler(
    'ticketSubmitted',
    useCallback(
      ({ attendeeName, ticketTier, ticketCount, notes }) => {
        const now = new Date();
        const submittedAt = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        ticketStore.setValue({
          attendeeName,
          ticketTier,
          ticketCount,
          notes,
          submittedAt,
        });
        appendAudit(
          `Form-Associated Lit Custom Element (FACE) received: ${attendeeName} reserved ${ticketCount}x [${ticketTier}]`
        );
      },
      [appendAudit, ticketStore]
    ),
    { id: 'lit-wc-ticket-submit', priority: 100 }
  );

  return <>{children}</>;
}
