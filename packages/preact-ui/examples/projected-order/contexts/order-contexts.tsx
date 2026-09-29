import { createDispatchContext, createSourceContext } from '@context-action/preact';
import type { ActionDispatcher } from '@context-action/core';
import type { ReadonlySignal } from '@preact/signals';
import type { ComponentChildren } from 'preact';
import type { OrderActions, OrderState } from '../business/order-types.js';

export const OrderDispatchContext = createDispatchContext<OrderActions>('OrderDispatch');
export const OrderSourceContext = createSourceContext<OrderState>('OrderSource');

/**
 * Unified Context Provider for Order Workspace.
 * Injects host-owned dispatcher and borrowed ReadonlySignal down the tree.
 */
export function OrderContextProvider(props: {
  dispatch: ActionDispatcher<OrderActions>;
  sourceSignal: ReadonlySignal<OrderState>;
  children?: ComponentChildren;
}) {
  return (
    <OrderDispatchContext.Provider dispatch={props.dispatch}>
      <OrderSourceContext.Provider sourceSignal={props.sourceSignal}>
        {props.children}
      </OrderSourceContext.Provider>
    </OrderDispatchContext.Provider>
  );
}
