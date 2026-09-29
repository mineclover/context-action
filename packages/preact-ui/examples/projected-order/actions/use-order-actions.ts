import { useCallback } from 'preact/hooks';
import type { OrderItem } from '../business/order-types.js';
import { OrderDispatchContext } from '../contexts/order-contexts.js';

export interface OrderActionsHook {
  setCustomerName: (name: string) => Promise<void>;
  setShippingAddress: (address: string) => Promise<void>;
  addItem: (item: OrderItem) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  submitOrder: () => Promise<void>;
  resetDraft: () => Promise<void>;
  retrySubmission: () => Promise<void>;
}

/**
 * Business Logic Hook: Encapsulates all action dispatches and user intent
 * behind a strongly typed business interface.
 * 
 * View components call these semantic methods rather than using raw dispatch strings.
 */
export function useOrderActions(): OrderActionsHook {
  const dispatch = OrderDispatchContext.useDispatch();

  const setCustomerName = useCallback(
    (name: string) => dispatch('updateCustomerName', { name }),
    [dispatch],
  );

  const setShippingAddress = useCallback(
    (address: string) => dispatch('updateShippingAddress', { address }),
    [dispatch],
  );

  const addItem = useCallback(
    (item: OrderItem) => dispatch('addItem', { item }),
    [dispatch],
  );

  const removeItem = useCallback(
    (itemId: string) => dispatch('removeItem', { itemId }),
    [dispatch],
  );

  const updateItemQuantity = useCallback(
    (itemId: string, quantity: number) =>
      dispatch('updateItemQuantity', { itemId, quantity }),
    [dispatch],
  );

  const submitOrder = useCallback(() => dispatch('submitOrder'), [dispatch]);

  const resetDraft = useCallback(() => dispatch('resetDraft'), [dispatch]);

  const retrySubmission = useCallback(() => dispatch('retrySubmission'), [dispatch]);

  return {
    setCustomerName,
    setShippingAddress,
    addItem,
    removeItem,
    updateItemQuantity,
    submitOrder,
    resetDraft,
    retrySubmission,
  };
}
