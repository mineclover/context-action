import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'preact';
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import {
  createElementFacade as createRootElementFacade,
  definePreactElement,
  type ImperativeHandleFactory,
} from '../src/index.js';
import {
  createCustomElementBridge,
  createElementFacade,
  type PublicActionMethods,
} from '../src/react-bridge.js';
import {
  createOrderWorkspaceHandle,
  defineOrderWorkspaceElement,
  type OrderWorkspaceElement,
  type OrderWorkspaceHandle,
} from '../examples/projected-order/index.js';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

interface MockBridgeItem {
  id: string;
  name: string;
}

class MockBridgeElement extends HTMLElement {
  static connectedItems: readonly any[] | undefined;
  #items: readonly any[] = [];
  get items() {
    return this.#items;
  }
  set items(val: readonly any[]) {
    this.#items = val;
  }
  get itemCount(): number {
    return this.#items ? this.#items.length : 0;
  }
  addItem(item: MockBridgeItem): number {
    this.#items = [...(this.#items ?? []), item];
    return this.#items.length;
  }
  clearItems(): void {
    this.#items = [];
  }
  connectedCallback() {
    MockBridgeElement.connectedItems = this.#items;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('mock-bridge-el')) {
  customElements.define('mock-bridge-el', MockBridgeElement);
}

interface MockBridgeProps {
  customerName?: string;
  items?: readonly { id: string; name: string }[];
  onOrderChange?: (e: CustomEvent<{ total: number }>) => void;
}

describe('React Custom Element Bridge (createCustomElementBridge)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    MockBridgeElement.connectedItems = undefined;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('renders custom element, assigns properties, and binds custom events seamlessly', async () => {
    const ReactMockBridge = createCustomElementBridge<MockBridgeProps, MockBridgeElement>({
      tagName: 'mock-bridge-el',
      properties: ['items'],
      events: {
        onOrderChange: 'order-change',
      },
    });

    const handleChange = vi.fn();
    const itemsData = [{ id: '1', name: 'MacBook Pro' }, { id: '2', name: 'Magic Mouse' }];
    let forwardedEl: MockBridgeElement | null = null;

    await act(async () => {
      root.render(
        React.createElement(ReactMockBridge, {
          ref: (el: MockBridgeElement | null) => {
            if (el) forwardedEl = el;
          },
          customerName: '홍길동',
          items: itemsData,
          onOrderChange: handleChange,
        }),
      );
    });

    const domEl = container.querySelector('mock-bridge-el') as MockBridgeElement;
    expect(domEl).not.toBeNull();
    expect(forwardedEl).toBe(domEl);
    // React 18/SSR-safe bridge semantics: the Custom Element connects with
    // its default input, then the layout effect assigns complex properties.
    expect(MockBridgeElement.connectedItems).not.toBe(itemsData);

    // Verify attribute was set
    expect(domEl.getAttribute('customerName')).toBe('홍길동');

    // Verify complex property was assigned without stringification
    expect(domEl.items).toBe(itemsData);
    expect(domEl.items.length).toBe(2);

    // Dispatch CustomEvent from the DOM element
    domEl.dispatchEvent(
      new CustomEvent('order-change', {
        detail: { total: 2500 },
        bubbles: true,
      }),
    );

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0]?.[0]?.detail.total).toBe(2500);
  });

  it('cleans up event listeners when component unmounts', async () => {
    const ReactMockBridge = createCustomElementBridge<MockBridgeProps, MockBridgeElement>({
      tagName: 'mock-bridge-el',
      events: {
        onOrderChange: 'order-change',
      },
    });

    const handleChange = vi.fn();
    let capturedEl: MockBridgeElement | null = null;

    await act(async () => {
      root.render(
        React.createElement(ReactMockBridge, {
          ref: (el: MockBridgeElement | null) => {
            if (el) capturedEl = el;
          },
          onOrderChange: handleChange,
        }),
      );
    });

    expect(capturedEl).not.toBeNull();
    const targetEl = capturedEl!;

    // Unmount React component
    await act(async () => {
      root.unmount();
    });

    // Dispatch event on the element after unmount
    targetEl.dispatchEvent(
      new CustomEvent('order-change', {
        detail: { total: 100 },
      }),
    );

    // Listener was cleaned up, should not be called
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('clears a removed property on a later React render', async () => {
    const ReactMockBridge = createCustomElementBridge<MockBridgeProps, MockBridgeElement>({
      tagName: 'mock-bridge-el',
      properties: ['items'],
    });
    const itemsData = [{ id: '1', name: 'MacBook Pro' }];

    await act(async () => {
      root.render(React.createElement(ReactMockBridge, { items: itemsData }));
    });
    const domEl = container.querySelector('mock-bridge-el') as MockBridgeElement;
    expect(domEl.items).toBe(itemsData);

    await act(async () => {
      root.render(React.createElement(ReactMockBridge, {}));
    });
    expect(domEl.items).toBeUndefined();
  });

  it('exposes an encapsulated OOP handle via custom createHandle factory while hiding HTMLElement internals', async () => {
    interface OrderActions {
      addItem: MockBridgeItem;
      clearItems: void;
      internalRecalculate: { silent: boolean };
    }

    type OrderPublicMethods = PublicActionMethods<
      OrderActions,
      'addItem' | 'clearItems',
      { addItem: number }
    >;

    interface OrderHandle extends OrderPublicMethods {
      getItemCount(): number;
    }

    const ReactEncapsulatedBridge = createCustomElementBridge<
      MockBridgeProps,
      MockBridgeElement,
      OrderHandle
    >({
      tagName: 'mock-bridge-el',
      properties: ['items'],
      createHandle: (getElement) => ({
        async addItem(item) {
          const el = getElement();
          if (!el) throw new Error('Element not mounted');
          return el.addItem(item);
        },
        async clearItems() {
          const el = getElement();
          if (!el) throw new Error('Element not mounted');
          el.clearItems();
        },
        getItemCount() {
          return getElement()?.itemCount ?? 0;
        },
      }),
    });

    const handleRef = React.createRef<OrderHandle>();
    const initialItems = [{ id: '1', name: 'MacBook Pro' }];

    await act(async () => {
      root.render(
        React.createElement(ReactEncapsulatedBridge, {
          ref: handleRef,
          items: initialItems,
        }),
      );
    });

    const handle = handleRef.current;
    expect(handle).not.toBeNull();
    expect(handle instanceof HTMLElement).toBe(false);
    expect('shadowRoot' in (handle as unknown as Record<string, unknown>)).toBe(false);
    expect('innerHTML' in (handle as unknown as Record<string, unknown>)).toBe(false);
    expect((handle as unknown as Record<string, unknown>).shadowRoot).toBeUndefined();
    expect((handle as unknown as Record<string, unknown>).innerHTML).toBeUndefined();

    const domEl = container.querySelector('mock-bridge-el') as MockBridgeElement;
    expect(handle!.getItemCount()).toBe(1);

    const nextCount = await handle!.addItem({ id: '2', name: 'Studio Display' });
    expect(nextCount).toBe(2);
    expect(domEl.items).toHaveLength(2);
    expect(handle!.getItemCount()).toBe(2);

    await handle!.clearItems();
    expect(domEl.items).toHaveLength(0);
    expect(handle!.getItemCount()).toBe(0);
  });

  it('forwards getters, setters, and methods via createElementFacade while protecting read-only properties and unmounted handles', async () => {
    const facadeFactory = createElementFacade<
      MockBridgeElement,
      readonly ['items', 'itemCount', 'addItem', 'clearItems']
    >(['items', 'itemCount', 'addItem', 'clearItems']);

    const ReactFacadeBridge = createCustomElementBridge<
      MockBridgeProps,
      MockBridgeElement,
      Pick<MockBridgeElement, 'items' | 'itemCount' | 'addItem' | 'clearItems'>
    >({
      tagName: 'mock-bridge-el',
      properties: ['items'],
      createHandle: facadeFactory,
    });

    const facadeRef =
      React.createRef<Pick<MockBridgeElement, 'items' | 'itemCount' | 'addItem' | 'clearItems'>>();
    const initialItems = [{ id: '1', name: 'MacBook Pro' }];

    await act(async () => {
      root.render(
        React.createElement(ReactFacadeBridge, {
          ref: facadeRef,
          items: initialItems,
        }),
      );
    });

    const facade = facadeRef.current!;
    expect(facade).toBeDefined();
    expect(Object.isFrozen(facade)).toBe(true);
    expect(facade instanceof HTMLElement).toBe(false);
    expect('shadowRoot' in (facade as unknown as Record<string, unknown>)).toBe(false);
    expect('innerHTML' in (facade as unknown as Record<string, unknown>)).toBe(false);

    // Getter forwarding
    expect(facade.items).toBe(initialItems);
    expect(facade.itemCount).toBe(1);

    // Setter forwarding
    const replacedItems = [
      { id: '2', name: 'Magic Keyboard' },
      { id: '3', name: 'Magic Trackpad' },
    ];
    facade.items = replacedItems;
    const domEl = container.querySelector('mock-bridge-el') as MockBridgeElement;
    expect(domEl.items).toBe(replacedItems);
    expect(facade.itemCount).toBe(2);

    // Method forwarding (bound to underlying element)
    const countAfterAdd = facade.addItem({ id: '4', name: 'AirPods Max' });
    expect(countAfterAdd).toBe(3);
    expect(domEl.itemCount).toBe(3);

    facade.clearItems();
    expect(domEl.items).toEqual([]);
    expect(facade.itemCount).toBe(0);

    // Read-only property protection
    expect(() => {
      (facade as unknown as { itemCount: number }).itemCount = 42;
    }).toThrow(new TypeError("Cannot assign to read-only property 'itemCount'"));

    // Unmounted error handling via detached factory handle
    let mountedEl: MockBridgeElement | null = domEl;
    const manualFacade = facadeFactory(() => mountedEl);
    expect(manualFacade.itemCount).toBe(0);
    mountedEl = null;
    expect(() => manualFacade.items).toThrow('Custom element handle is not mounted');
    expect(() => {
      manualFacade.items = initialItems;
    }).toThrow('Custom element handle is not mounted');
    expect(() => manualFacade.clearItems()).toThrow('Custom element handle is not mounted');
  });

  it('supports definePreactElement<Input, Expose> with typed expose descriptors without unsafe casts', () => {
    interface CounterInput {
      count: number;
    }

    interface CounterExpose {
      count: number;
      readonly doubled: number;
      increment(step?: number): number;
    }

    const tagName = 'mock-exposed-counter-el';
    const CounterElement = definePreactElement<CounterInput, CounterExpose>({
      tagName,
      setup(_element, context) {
        let currentCount = 1;
        return {
          view: ({ input }) => h('span', { 'data-testid': 'count-val' }, String(input.count)),
          getInput: () => ({ count: currentCount }),
          expose: {
            get count() {
              return currentCount;
            },
            set count(next: number) {
              currentCount = next;
              context.requestUpdate();
            },
            get doubled() {
              return this.count * 2;
            },
            increment(step = 1) {
              this.count = this.count + step;
              return this.count;
            },
          },
        };
      },
    });

    const instance = new CounterElement();
    container.append(instance);

    expect(instance.count).toBe(1);
    expect(instance.doubled).toBe(2);
    expect(instance.shadowRoot?.querySelector('[data-testid="count-val"]')?.textContent).toBe('1');

    const updated = instance.increment(4);
    expect(updated).toBe(5);
    expect(instance.count).toBe(5);
    expect(instance.doubled).toBe(10);
    expect(instance.shadowRoot?.querySelector('[data-testid="count-val"]')?.textContent).toBe('5');

    instance.count = 9;
    expect(instance.doubled).toBe(18);
    expect(instance.shadowRoot?.querySelector('[data-testid="count-val"]')?.textContent).toBe('9');

    instance.dispose();
  });

  it('replays pre-upgrade properties into expose setters and supports Symbol keys on expose', () => {
    const capabilitySymbol = Symbol('capability');
    const tagName = 'mock-preupgrade-expose-el';

    // Create an unupgraded element and assign a property before customElements.define
    const unupgraded = document.createElement(tagName) as HTMLElement & {
      label: string;
      [capabilitySymbol]: () => string;
    };
    unupgraded.label = 'assigned-before-upgrade';
    container.append(unupgraded);

    definePreactElement<
      { label: string },
      { label: string; [capabilitySymbol](): string }
    >({
      tagName,
      upgradeProperties: ['label'],
      setup(_element, context) {
        let currentLabel = 'default-label';
        return {
          view: ({ input }) => h('div', { 'data-testid': 'label-out' }, input.label),
          getInput: () => ({ label: currentLabel }),
          expose: {
            get label() {
              return currentLabel;
            },
            set label(next: string) {
              currentLabel = next.trim();
              context.requestUpdate();
            },
            [capabilitySymbol]() {
              return `capability:${this.label}`;
            },
          },
        };
      },
    });

    expect(unupgraded.label).toBe('assigned-before-upgrade');
    expect(unupgraded[capabilitySymbol]()).toBe('capability:assigned-before-upgrade');
    expect(
      unupgraded.shadowRoot?.querySelector('[data-testid="label-out"]')?.textContent,
    ).toBe('assigned-before-upgrade');
  });

  it('supports createElementFacade from root entrypoint, deduplicates keys, and checks deep prototype chain read-only properties', () => {
    expect(createRootElementFacade).toBe(createElementFacade);

    class GrandParentElement extends HTMLElement {
      get inheritedReadOnly(): string {
        return 'immutable-from-grandparent';
      }
    }
    class ParentElement extends GrandParentElement {
      #step = 1;
      get step(): number {
        return this.#step;
      }
      set step(next: number) {
        this.#step = next;
      }
    }
    class ChildElement extends ParentElement {
      compute(multiplier: number): number {
        return this.step * multiplier;
      }
    }

    const childTag = 'mock-deep-inheritance-el';
    if (!customElements.get(childTag)) {
      customElements.define(childTag, ChildElement);
    }

    const instance = new ChildElement();
    // Pass duplicate keys to verify deduplication does not throw Cannot redefine property
    const factory: ImperativeHandleFactory<
      ChildElement,
      Pick<ChildElement, 'inheritedReadOnly' | 'step' | 'compute'>
    > = createRootElementFacade(['inheritedReadOnly', 'step', 'compute', 'step']);

    const facade = factory(() => instance);
    expect(facade.inheritedReadOnly).toBe('immutable-from-grandparent');
    expect(facade.step).toBe(1);
    facade.step = 7;
    expect(facade.compute(3)).toBe(21);

    // Read-only getter defined 2 prototype levels up should still throw a descriptive TypeError
    expect(() => {
      (facade as unknown as { inheritedReadOnly: string }).inheritedReadOnly = 'mutated';
    }).toThrow(new TypeError("Cannot assign to read-only property 'inheritedReadOnly'"));
  });

  it('integrates OrderWorkspaceElement + createOrderWorkspaceHandle end-to-end with React useImperativeHandle', async () => {
    const tagName = 'react-bridged-order-workspace';
    defineOrderWorkspaceElement(tagName);

    interface OrderWorkspaceProps {
      customerName?: string;
      shippingAddress?: string;
      onOrderSubmitSuccess?: (e: CustomEvent<{ orderId: string }>) => void;
    }

    const OrderWorkspaceBridge = createCustomElementBridge<
      OrderWorkspaceProps,
      OrderWorkspaceElement,
      OrderWorkspaceHandle
    >({
      tagName,
      properties: ['customerName', 'shippingAddress'],
      events: { onOrderSubmitSuccess: 'order-submit-success' },
      createHandle: createOrderWorkspaceHandle,
    });

    const handleRef = React.createRef<OrderWorkspaceHandle>();
    const onSubmitSpy = vi.fn();

    await act(async () => {
      root.render(
        React.createElement(OrderWorkspaceBridge, {
          ref: handleRef,
          customerName: 'Alice Kim',
          shippingAddress: 'Seoul, KR',
          onOrderSubmitSuccess: onSubmitSpy,
        }),
      );
    });

    const handle = handleRef.current!;
    expect(handle).toBeDefined();
    expect(handle instanceof HTMLElement).toBe(false);
    expect('shadowRoot' in (handle as unknown as Record<string, unknown>)).toBe(false);
    expect(handle.canSubmit()).toBe(false);

    await act(async () => {
      await handle.addItem({ id: 'kb-1', name: 'HHKB Studio', unitPrice: 329, quantity: 1 });
    });

    expect(handle.canSubmit()).toBe(true);
    expect(handle.getSnapshot().items).toHaveLength(1);

    await act(async () => {
      await handle.submit();
    });

    const finalSnapshot = handle.getSnapshot();
    expect(finalSnapshot.phase).toBe('success');
    expect(finalSnapshot.orderId).toBeDefined();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    expect(onSubmitSpy.mock.calls[0]?.[0]?.detail.orderId).toBe(finalSnapshot.orderId);
  });
});
