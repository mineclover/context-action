import { useCallback } from 'react';
import type { OrderDraft } from '../business/orderDraft';
import {
  useOrderBusinessDispatch,
  useOrderLayoutDispatch,
} from '../contexts/OrderContexts';

export function useOrderActions() {
  const businessDispatch = useOrderBusinessDispatch();
  const layoutDispatch = useOrderLayoutDispatch();

  const updateDraft = useCallback(
    (updates: Partial<OrderDraft>) => businessDispatch('updateDraft', updates),
    [businessDispatch]
  );

  const resetDraft = useCallback(
    () => businessDispatch('resetDraft'),
    [businessDispatch]
  );

  const submitOrder = useCallback(
    () => businessDispatch('submitOrder'),
    [businessDispatch]
  );

  const retrySubmission = useCallback(
    () => businessDispatch('retrySubmission'),
    [businessDispatch]
  );

  const focusField = useCallback(
    (field: keyof OrderDraft) => layoutDispatch('focusField', { field }),
    [layoutDispatch]
  );

  return {
    updateDraft,
    resetDraft,
    submitOrder,
    retrySubmission,
    focusField,
  };
}
