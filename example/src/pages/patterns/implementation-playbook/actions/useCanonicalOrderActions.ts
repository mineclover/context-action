import React from 'react';
import type { OrderDraft, OrderPlan } from '../business/orderBusiness';
import {
  type CanonicalOrderInspectorTab,
  useCanonicalOrderDispatch,
  useCanonicalOrderLayoutDispatch,
} from '../contexts/CanonicalOrderContexts';

type DraftStringField = 'customerName' | 'email' | 'notes';

export function useCanonicalOrderActions() {
  const dispatch = useCanonicalOrderDispatch();
  const dispatchLayout = useCanonicalOrderLayoutDispatch();

  const setInspectorTab = React.useCallback(
    (tab: CanonicalOrderInspectorTab) =>
      dispatchLayout('setInspectorTab', { tab }),
    [dispatchLayout]
  );

  const updateTextField = React.useCallback(
    (field: DraftStringField, value: string) => {
      return dispatch('updateDraft', { [field]: value } as Partial<OrderDraft>);
    },
    [dispatch]
  );

  const updateQuantity = React.useCallback(
    (quantity: number) => dispatch('updateDraft', { quantity }),
    [dispatch]
  );

  const updatePlan = React.useCallback(
    (plan: OrderPlan) => dispatch('updateDraft', { plan }),
    [dispatch]
  );

  const setOnboarding = React.useCallback(
    (onboarding: boolean) => dispatch('updateDraft', { onboarding }),
    [dispatch]
  );

  const submitOrder = React.useCallback(
    () => dispatch('submitOrder'),
    [dispatch]
  );

  const prefillExample = React.useCallback(
    () => dispatch('prefillExample'),
    [dispatch]
  );

  const resetDemo = React.useCallback(() => dispatch('resetDemo'), [dispatch]);

  return {
    updateTextField,
    updateQuantity,
    updatePlan,
    setOnboarding,
    submitOrder,
    prefillExample,
    resetDemo,
    setInspectorTab,
  };
}
