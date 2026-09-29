import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { createCustomElementBridge } from '../src/react-bridge.js';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

class MockBridgeElement extends HTMLElement {
  #items: readonly any[] = [];
  get items() {
    return this.#items;
  }
  set items(val: readonly any[]) {
    this.#items = val;
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
});
