import { createDisposalScope } from '../../src/disposal-scope.js';
import type { OrderItem } from './business/order-types.js';
import { createOrderModel } from './handlers/order-handlers.js';
import type { OrderModel } from './handlers/order-handlers.js';
import { mountOrderWorkspace } from './mount-order-workspace.js';
import type { OrderWorkspaceMount } from './mount-order-workspace.js';

export interface OrderSubmitEventDetail {
  orderId: string;
}

const registeredOrderElements = new Map<string, CustomElementConstructor>();

function cloneDraft(draft: ReturnType<OrderModel['source']['getSnapshot']>['draft']) {
  return {
    ...draft,
    items: Object.freeze(draft.items.map((item) => Object.freeze({ ...item }))),
  };
}

/**
 * Registers the <order-workspace> custom element.
 * Safe to call multiple times with the same tagName.
 */
export function defineOrderWorkspaceElement(tagName = 'order-workspace') {
  if (typeof globalThis.customElements === 'undefined') {
    throw new Error('Custom elements require a browser environment');
  }

  const existing = customElements.get(tagName);
  if (existing) {
    const registered = registeredOrderElements.get(tagName);
    if (registered === existing) return existing;
    throw new Error(`${tagName} is already registered`);
  }

  class OrderWorkspaceElement extends HTMLElement {
    static observedAttributes = ['customer-name', 'shipping-address'];

    #model: OrderModel;
    #mount: OrderWorkspaceMount | undefined;
    #scope = createDisposalScope();
    #connectionScope: ReturnType<typeof createDisposalScope> | undefined;
    #root: HTMLElement;
    #upgraded = false;

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });

      // Host styles
      const style = this.ownerDocument.createElement('style');
      style.textContent = `
        :host {
          display: block;
          max-width: 760px;
          margin: 16px auto;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `;

      this.#root = this.ownerDocument.createElement('div');
      shadow.append(style, this.#root);

      // Model instance owned by the custom element lifetime
      this.#model = createOrderModel();

      this.#scope.add(() => this.#model.destroy());
    }

    connectedCallback() {
      if (this.#mount) return;

      if (!this.#upgraded) {
        this.#upgraded = true;
        // Handle properties set before customElements.define()
        for (const key of ['customerName', 'shippingAddress'] as const) {
          if (Object.prototype.hasOwnProperty.call(this, key)) {
            const value = (this as unknown as Record<string, unknown>)[key];
            Reflect.deleteProperty(this, key);
            if (typeof value === 'string') {
              this[key] = value;
            }
          }
        }

        // Sync initial attributes
        const initialName = this.getAttribute('customer-name');
        if (initialName) void this.#model.dispatch('updateCustomerName', { name: initialName });

        const initialAddress = this.getAttribute('shipping-address');
        if (initialAddress) void this.#model.dispatch('updateShippingAddress', { address: initialAddress });
      }

      const connectionScope = createDisposalScope();
      let lastSubmissionPhase = this.#model.source.getSnapshot().submission.phase;
      const unsubscribe = this.#model.source.subscribe(() => {
        if (!this.isConnected) return;
        const state = this.#model.source.getSnapshot();
        this.dispatchEvent(
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
          this.dispatchEvent(
            new CustomEvent<OrderSubmitEventDetail>('order-submit-success', {
              detail: { orderId: state.submission.orderId ?? '' },
              bubbles: true,
              composed: true,
            }),
          );
        }
        lastSubmissionPhase = state.submission.phase;
      });
      connectionScope.add(unsubscribe);

      try {
        const mount = mountOrderWorkspace(this.#root, this.#model);
        connectionScope.add(() => mount.destroy());
        this.#connectionScope = connectionScope;
        this.#mount = mount;
      } catch (error) {
        try { connectionScope.dispose(); } catch (cleanupError) {
          throw new AggregateError([error, cleanupError], 'Order workspace connection failed');
        }
        throw error;
      }
    }

    disconnectedCallback() {
      // Unmount renderer on disconnect, but keep domain state if re-connected!
      const mount = this.#mount;
      this.#mount = undefined;
      const connectionScope = this.#connectionScope;
      this.#connectionScope = undefined;
      if (connectionScope) connectionScope.dispose();
      else mount?.destroy();
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
      if (oldValue === newValue) return;

      if (name === 'customer-name') {
        void this.#model.dispatch('updateCustomerName', { name: newValue ?? '' });
      } else if (name === 'shipping-address') {
        void this.#model.dispatch('updateShippingAddress', { address: newValue ?? '' });
      }
    }

    // Property API
    get customerName(): string {
      return this.#model.source.getSnapshot().draft.customerName;
    }
    set customerName(value: string) {
      if (typeof value !== 'string') throw new TypeError('customerName must be a string');
      this.setAttribute('customer-name', value);
    }

    get shippingAddress(): string {
      return this.#model.source.getSnapshot().draft.shippingAddress;
    }
    set shippingAddress(value: string) {
      if (typeof value !== 'string') throw new TypeError('shippingAddress must be a string');
      this.setAttribute('shipping-address', value);
    }

    get items(): readonly OrderItem[] {
      return Object.freeze(this.#model.source.getSnapshot().draft.items.map((item) => Object.freeze({ ...item })));
    }

    // Imperative Semantic Methods
    addItem(item: OrderItem): Promise<void> {
      return this.#model.dispatch('addItem', { item });
    }

    removeItem(itemId: string): Promise<void> {
      return this.#model.dispatch('removeItem', { itemId });
    }

    submit(): Promise<void> {
      return this.#model.dispatch('submitOrder');
    }

    reset(): Promise<void> {
      return this.#model.dispatch('resetDraft');
    }

    /** Permanently tears down the model and all subscriptions */
    dispose() {
      this.disconnectedCallback();
      this.#scope.dispose();
    }
  }

  customElements.define(tagName, OrderWorkspaceElement);
  registeredOrderElements.set(tagName, OrderWorkspaceElement);
  return OrderWorkspaceElement;
}
