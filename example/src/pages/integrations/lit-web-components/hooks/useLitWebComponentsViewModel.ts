import {
  createLitElementBridge,
  LitCartBadge,
  LitQuantityStepper,
} from '@context-action/lit-ui';
import { useStoreValue } from '@context-action/react';
import { useCallback, useMemo } from 'react';
import { calculateOrderSummary } from '../business/orderCalculation';
import {
  LitWebComponentsActionsContext,
  LitWebComponentsStoresContext,
} from '../contexts/LitWebComponentsContexts';

// Ensure custom elements are evaluated and registered
if (typeof globalThis.customElements !== 'undefined') {
  void LitQuantityStepper;
  void LitCartBadge;
}

export interface QuantityStepperBridgeProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onQuantityChange?: (event: CustomEvent<{ value: number }>) => void;
  className?: string;
  id?: string;
}

export interface CartBadgeBridgeProps {
  count?: number;
  label?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  onCartBadgeClick?: (event: CustomEvent<{ count: number }>) => void;
  className?: string;
  id?: string;
}

export const LitQuantityStepperBridge =
  createLitElementBridge<QuantityStepperBridgeProps>({
    tagName: 'lit-quantity-stepper',
    properties: ['value', 'min', 'max', 'step', 'name', 'disabled', 'readOnly'],
    events: {
      onQuantityChange: 'quantity-change',
    },
  });

export const LitCartBadgeBridge = createLitElementBridge<CartBadgeBridgeProps>({
  tagName: 'lit-cart-badge',
  properties: ['count', 'label', 'variant'],
  events: {
    onCartBadgeClick: 'cart-badge-click',
  },
});

export function useLitWebComponentsViewModel() {
  const itemsStore = LitWebComponentsStoresContext.useStore('items');
  const discountStore =
    LitWebComponentsStoresContext.useStore('discountEnabled');
  const ticketStore = LitWebComponentsStoresContext.useStore('submittedTicket');
  const auditStore = LitWebComponentsStoresContext.useStore('auditLog');

  const items = useStoreValue(itemsStore);
  const discountEnabled = useStoreValue(discountStore);
  const submittedTicket = useStoreValue(ticketStore);
  const auditLog = useStoreValue(auditStore);

  const dispatch = LitWebComponentsActionsContext.useActionDispatch();

  const summary = useMemo(() => {
    return calculateOrderSummary(items, discountEnabled, 10);
  }, [items, discountEnabled]);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      void dispatch('quantityUpdated', { productId, quantity });
    },
    [dispatch]
  );

  const toggleDiscount = useCallback(
    (enabled: boolean) => {
      void dispatch('discountToggled', { enabled });
    },
    [dispatch]
  );

  const resetCart = useCallback(() => {
    void dispatch('cartReset');
  }, [dispatch]);

  const submitTicketForm = useCallback(
    (
      attendeeName: string,
      ticketTier: string,
      ticketCount: number,
      notes: string
    ) => {
      void dispatch('ticketSubmitted', {
        attendeeName,
        ticketTier,
        ticketCount,
        notes,
      });
    },
    [dispatch]
  );

  return {
    items,
    discountEnabled,
    submittedTicket,
    auditLog,
    summary,
    updateQuantity,
    toggleDiscount,
    resetCart,
    submitTicketForm,
    LitQuantityStepperBridge,
    LitCartBadgeBridge,
  };
}
