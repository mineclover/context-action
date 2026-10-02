import { connectSourceSignal } from '@context-action/preact';
import type { ReadonlySignal } from '@preact/signals';
import { definePreactElement } from '../../src/custom-element.js';
import { createDisposalScope } from '../../src/disposal-scope.js';
import type { OrderItem, OrderState } from './business/order-types.js';
import { OrderContextProvider } from './contexts/order-contexts.js';
import { createOrderModel } from './handlers/order-handlers.js';
import type { OrderModel } from './handlers/order-handlers.js';
import { OrderWorkspaceView } from './views/OrderWorkspaceView.js';

export interface OrderSubmitEventDetail {
  orderId: string;
}

export interface OrderWorkspaceElement extends HTMLElement {
  customerName: string;
  shippingAddress: string;
  readonly items: readonly OrderItem[];
  addItem(item: OrderItem): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  submit(): Promise<void>;
  reset(): Promise<void>;
  dispose(): void;
}

interface OrderWorkspaceInput {
  readonly dispatch: OrderModel['dispatch'];
  readonly sourceSignal: ReadonlySignal<OrderState>;
}

interface OrderWorkspaceOwnerSession {
  readonly destroyed: boolean;
  getInput(): OrderWorkspaceInput;
  destroy(): void;
}

const registeredOrderElements = new Map<string, CustomElementConstructor>();

function cloneDraft(draft: ReturnType<OrderModel['source']['getSnapshot']>['draft']) {
  return {
    ...draft,
    items: Object.freeze(draft.items.map((item) => Object.freeze({ ...item }))),
  };
}

function OrderWorkspaceElementView({ input }: { input: OrderWorkspaceInput }) {
  return (
    <OrderContextProvider dispatch={input.dispatch} sourceSignal={input.sourceSignal}>
      <OrderWorkspaceView />
    </OrderContextProvider>
  );
}

/**
 * Creates the per-connection resources for the order element.
 *
 * The model is the element's owner-lifetime domain object. The signal
 * connection and DOM event subscription are connection-lifetime resources and
 * are recreated on every reconnect while the model itself is preserved.
 */
function createOrderWorkspaceOwnerSession(
  model: OrderModel,
  element: HTMLElement,
): OrderWorkspaceOwnerSession {
  const scope = createDisposalScope();
  const connection = connectSourceSignal(model.source);
  scope.add(() => connection.dispose());

  let lastSubmissionPhase = model.source.getSnapshot().submission.phase;
  const unsubscribe = model.source.subscribe(() => {
    if (scope.disposed || !element.isConnected) return;
    const state = model.source.getSnapshot();
    element.dispatchEvent(
      new CustomEvent('order-change', {
        detail: {
          draft: cloneDraft(state.draft),
          submission: { ...state.submission },
        },
        bubbles: true,
        composed: true,
      }),
    );

    if (state.submission.phase === 'success' && lastSubmissionPhase !== 'success') {
      element.dispatchEvent(
        new CustomEvent<OrderSubmitEventDetail>('order-submit-success', {
          detail: { orderId: state.submission.orderId ?? '' },
          bubbles: true,
          composed: true,
        }),
      );
    }
    lastSubmissionPhase = state.submission.phase;
  });
  scope.add(unsubscribe);

  return {
    get destroyed() {
      return scope.disposed;
    },
    getInput() {
      if (scope.disposed) throw new Error('Order workspace connection session is not active');
      return { dispatch: model.dispatch, sourceSignal: connection.signal };
    },
    destroy() {
      scope.dispose();
    },
  };
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
    if (registered === existing) return existing as { new(): OrderWorkspaceElement };
    throw new Error(`${tagName} is already registered`);
  }

  const Element = definePreactElement<OrderWorkspaceInput>({
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
      let ownerSession: OrderWorkspaceOwnerSession | undefined;

      // Install the semantic API on the host, keeping it valid while the
      // renderer is disconnected and preventing public callers from reaching
      // the renderer's internal root or signals.
      Object.defineProperties(element, {
        customerName: {
          configurable: true,
          enumerable: true,
          get: () => model.source.getSnapshot().draft.customerName,
          set: (value: string) => {
            if (typeof value !== 'string') throw new TypeError('customerName must be a string');
            element.setAttribute('customer-name', value);
          },
        },
        shippingAddress: {
          configurable: true,
          enumerable: true,
          get: () => model.source.getSnapshot().draft.shippingAddress,
          set: (value: string) => {
            if (typeof value !== 'string') throw new TypeError('shippingAddress must be a string');
            element.setAttribute('shipping-address', value);
          },
        },
        items: {
          configurable: true,
          enumerable: true,
          get: () => Object.freeze(
            model.source.getSnapshot().draft.items.map((item) => Object.freeze({ ...item })),
          ),
        },
        addItem: {
          configurable: true,
          enumerable: true,
          value: (item: OrderItem) => model.dispatch('addItem', { item }),
        },
        removeItem: {
          configurable: true,
          enumerable: true,
          value: (itemId: string) => model.dispatch('removeItem', { itemId }),
        },
        submit: {
          configurable: true,
          enumerable: true,
          value: () => model.dispatch('submitOrder'),
        },
        reset: {
          configurable: true,
          enumerable: true,
          value: () => model.dispatch('resetDraft'),
        },
      });

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
        getInput() {
          if (!ownerSession) throw new Error('Order workspace connection session is not active');
          return ownerSession.getInput();
        },
        onConnect() {
          ownerSession = createOrderWorkspaceOwnerSession(model, element);
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
  }) as unknown as { new(): OrderWorkspaceElement };

  registeredOrderElements.set(tagName, Element);
  return Element;
}
