import { definePreactElement } from '../../src/custom-element.js';
import type { PreactCustomElementConstructor } from '../../src/custom-element.js';
import type { OrderItem, OrderState } from './business/order-types.js';
import { OrderContextProvider } from './contexts/order-contexts.js';
import { createOrderModel } from './handlers/order-handlers.js';
import {
  createOrderWorkspaceHandle,
  ORDER_WORKSPACE_HANDLE_KEYS,
} from './order-contract.js';
import type {
  OrderPublicActionMethods,
  OrderSubmitEventDetail,
  OrderWorkspaceElement,
  OrderWorkspaceHandle,
  OrderWorkspaceInput,
  OrderWorkspaceSnapshot,
} from './order-contract.js';
import { createOrderWorkspaceOwnerSession } from './order-session.js';
import type { OrderWorkspaceOwnerSession } from './order-session.js';
import { OrderWorkspaceView } from './views/OrderWorkspaceView.js';

export { createOrderWorkspaceHandle, ORDER_WORKSPACE_HANDLE_KEYS };
export type {
  OrderPublicActionMethods,
  OrderSubmitEventDetail,
  OrderWorkspaceElement,
  OrderWorkspaceHandle,
  OrderWorkspaceInput,
  OrderWorkspaceSnapshot,
};

const registeredOrderElements = new Map<
  string,
  PreactCustomElementConstructor<OrderWorkspaceInput, OrderWorkspaceHandle>
>();
let elementSequence = 0;

function OrderWorkspaceElementView({ input }: { input: OrderWorkspaceInput }) {
  return (
    <OrderContextProvider dispatch={input.dispatch} sourceSignal={input.sourceSignal}>
      <OrderWorkspaceView idPrefix={input.idPrefix} />
    </OrderContextProvider>
  );
}

function computeCanSubmit(state: OrderState): boolean {
  return Boolean(
    state.draft.customerName.trim() &&
      state.draft.shippingAddress.trim() &&
      state.draft.items.length > 0 &&
      state.submission.phase !== 'submitting',
  );
}

/**
 * Registers the <order-workspace> custom element.
 * Safe to call multiple times with the same tagName.
 */
export function defineOrderWorkspaceElement(
  tagName = 'order-workspace',
): { new(): OrderWorkspaceElement } {
  if (typeof globalThis.customElements === 'undefined') {
    throw new Error('Custom elements require a browser environment');
  }

  const existing = customElements.get(tagName);
  if (existing) {
    const registered = registeredOrderElements.get(tagName);
    if (registered === existing) return registered;
    throw new Error(`${tagName} is already registered`);
  }

  const Element = definePreactElement<OrderWorkspaceInput, OrderWorkspaceHandle>({
    tagName,
    observedAttributes: ['customer-name', 'shipping-address'],
    upgradeProperties: ['customerName', 'shippingAddress'],
    style: `
      :host {
        display: block;
        max-width: 760px;
        margin: 16px auto;
        box-sizing: border-box;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
    `,
    setup(element, context) {
      // This model belongs to the element instance. It survives disconnect /
      // reconnect and is destroyed only by the explicit dispose() terminal
      // operation.
      const model = createOrderModel();
      const idPrefix = `order-element-${++elementSequence}`;
      let suppressedChangeEvents = 0;
      let ownerSession: OrderWorkspaceOwnerSession | undefined;

      // Install the semantic API on the host, keeping it valid while the
      // renderer is disconnected and preventing public callers from reaching
      // the renderer's internal root or signals.
      const expose: OrderWorkspaceHandle = {
        get customerName() {
          return model.source.getSnapshot().draft.customerName;
        },
        set customerName(value: string) {
          if (typeof value !== 'string') throw new TypeError('customerName must be a string');
          if (element.getAttribute('customer-name') === value) return;
          if (ownerSession) suppressedChangeEvents += 1;
          element.setAttribute('customer-name', value);
        },
        get shippingAddress() {
          return model.source.getSnapshot().draft.shippingAddress;
        },
        set shippingAddress(value: string) {
          if (typeof value !== 'string') throw new TypeError('shippingAddress must be a string');
          if (element.getAttribute('shipping-address') === value) return;
          if (ownerSession) suppressedChangeEvents += 1;
          element.setAttribute('shipping-address', value);
        },
        get items() {
          return Object.freeze(
            model.source.getSnapshot().draft.items.map((item) => Object.freeze({ ...item })),
          );
        },
        getSnapshot(): OrderWorkspaceSnapshot {
          const state = model.source.getSnapshot();
          return Object.freeze({
            customerName: state.draft.customerName,
            shippingAddress: state.draft.shippingAddress,
            items: Object.freeze(state.draft.items.map((item) => Object.freeze({ ...item }))),
            phase: state.submission.phase,
            ...(state.submission.orderId !== undefined
              ? { orderId: state.submission.orderId }
              : {}),
            canSubmit: computeCanSubmit(state),
          });
        },
        canSubmit(): boolean {
          return computeCanSubmit(model.source.getSnapshot());
        },
        addItem(item: OrderItem) {
          return model.dispatch('addItem', { item });
        },
        removeItem(itemId: string) {
          return model.dispatch('removeItem', { itemId });
        },
        submit() {
          return model.dispatch('submitOrder');
        },
        reset() {
          return model.dispatch('resetDraft');
        },
      };

      // Initial attributes are already present when an element is upgraded.
      // Attribute callbacks cover normal changes, while this explicit sync
      // also handles environments that upgrade without replaying callbacks.
      const initialName = element.getAttribute('customer-name');
      if (initialName !== null) void model.dispatch('updateCustomerName', { name: initialName });
      const initialAddress = element.getAttribute('shipping-address');
      if (initialAddress !== null) {
        void model.dispatch('updateShippingAddress', { address: initialAddress });
      }

      return {
        view: OrderWorkspaceElementView,
        expose,
        getInput() {
          if (!ownerSession) throw new Error('Order workspace connection session is not active');
          return ownerSession.getInput();
        },
        onConnect() {
          ownerSession = createOrderWorkspaceOwnerSession(
            model,
            element,
            () => {
              if (suppressedChangeEvents === 0) return false;
              suppressedChangeEvents -= 1;
              return true;
            },
            idPrefix,
          );
          // `connectSourceSignal` drives fine-grained updates. Requesting an
          // input update here also closes the adapter boundary for renderers
          // that do not observe borrowed signals directly.
          context.requestUpdate();
        },
        onDisconnect() {
          const session = ownerSession;
          ownerSession = undefined;
          session?.destroy();
        },
        onAttributeChange(name, _oldValue, newValue) {
          if (name === 'customer-name') {
            void model.dispatch('updateCustomerName', { name: newValue ?? '' });
          } else if (name === 'shipping-address') {
            void model.dispatch('updateShippingAddress', { address: newValue ?? '' });
          }
        },
        onDestroy() {
          model.destroy();
        },
      };
    },
  });

  registeredOrderElements.set(tagName, Element);
  return Element;
}
