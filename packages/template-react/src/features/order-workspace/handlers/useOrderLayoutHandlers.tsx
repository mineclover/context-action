import { useCallback } from 'react';
import {
  type OrderLayoutActions,
  useOrderLayoutActionCommandHandler,
  useOrderRefHandler,
} from '../contexts/OrderContexts';

export function useOrderLayoutHandlers() {
  const productIdRef = useOrderRefHandler('productId');
  const quantityRef = useOrderRefHandler('quantity');
  const shippingAddressRef = useOrderRefHandler('shippingAddress');

  useOrderLayoutActionCommandHandler(
    'focusField',
    useCallback(
      ({ field }: OrderLayoutActions['focusField']) => {
        if (field === 'productId') {
          productIdRef.executeIfMounted((element) => element.focus());
        } else if (field === 'quantity') {
          quantityRef.executeIfMounted((element) => element.focus());
        } else if (field === 'shippingAddress') {
          shippingAddressRef.executeIfMounted((element) => element.focus());
        }
      },
      [productIdRef, quantityRef, shippingAddressRef]
    ),
    { id: 'order-focus-field-command' }
  );
}
