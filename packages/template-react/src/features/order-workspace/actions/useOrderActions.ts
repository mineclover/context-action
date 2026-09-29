import { useOrderActionDispatch } from '../contexts/OrderContexts';
import type { OrderDraft } from '../business/orderDraft';

export function useOrderActions() {
  const dispatch = useOrderActionDispatch();

  return {
    updateDraft: (updates: Partial<OrderDraft>) => dispatch('updateDraft', updates),
    resetDraft: () => dispatch('resetDraft'),
    submitOrder: () => dispatch('submitOrder'),
    retrySubmission: () => dispatch('retrySubmission'),
  };
}
