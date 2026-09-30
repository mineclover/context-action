import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import {
  createLitElementBridge,
  createLitBridge,
  createCustomElementBridge,
} from '../src/react-bridge.js';

// React 18/19 act environment flag
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock Custom Element simulating Lit property getters/setters and custom events
class MockLitStepperElement extends HTMLElement {
  #items: readonly any[] = [];
  #metadata: Record<string, any> = {};
  value = 1;

  get items() {
    return this.#items;
  }
  set items(val: readonly any[]) {
    this.#items = val;
  }

  get metadata() {
    return this.#metadata;
  }
  set metadata(val: Record<string, any>) {
    this.#metadata = val;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('mock-lit-stepper')) {
  customElements.define('mock-lit-stepper', MockLitStepperElement);
}

interface MockLitStepperProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  value?: number;
  customerName?: string;
  items?: readonly { id: string; name: string }[];
  metadata?: Record<string, any>;
  onQuantityChange?: (e: CustomEvent<{ value: number }>) => void;
  onStatusChange?: (e: CustomEvent<{ active: boolean }>) => void;
  children?: React.ReactNode;
  'data-testid'?: string;
  'aria-label'?: string;
}

describe('React Custom Element Bridge (createLitElementBridge)', () => {
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

  it('renders custom element, assigns properties directly, and binds custom events seamlessly', async () => {
    const ReactMockBridge = createLitElementBridge<MockLitStepperProps, MockLitStepperElement>(
      'mock-lit-stepper',
      {
        properties: ['items', 'metadata'],
        events: {
          onQuantityChange: 'quantity-change',
        },
      },
    );

    const handleChange = vi.fn();
    const itemsData = [{ id: '1', name: 'MacBook Pro' }, { id: '2', name: 'Magic Mouse' }];
    const metadataData = { region: 'KR', priority: 1 };
    let forwardedEl: MockLitStepperElement | null = null;

    await act(async () => {
      root.render(
        React.createElement(ReactMockBridge, {
          ref: (el: MockLitStepperElement | null) => {
            if (el) forwardedEl = el;
          },
          customerName: '홍길동',
          items: itemsData,
          metadata: metadataData,
          onQuantityChange: handleChange,
        }),
      );
    });

    const domEl = container.querySelector('mock-lit-stepper') as MockLitStepperElement;
    expect(domEl).not.toBeNull();
    expect(forwardedEl).toBe(domEl);

    // Verify primitive attribute was set on the DOM element
    expect(domEl.getAttribute('customerName')).toBe('홍길동');

    // Verify complex property was assigned directly without stringification
    expect(domEl.items).toBe(itemsData);
    expect(domEl.items.length).toBe(2);
    expect(domEl.metadata).toBe(metadataData);
    expect(domEl.metadata['region']).toBe('KR');

    // Verify complex property was NOT rendered as an HTML attribute ("[object Object]")
    expect(domEl.getAttribute('items')).toBeNull();
    expect(domEl.getAttribute('metadata')).toBeNull();

    // Dispatch CustomEvent from the DOM element
    domEl.dispatchEvent(
      new CustomEvent('quantity-change', {
        detail: { value: 42 },
        bubbles: true,
      }),
    );

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0]?.[0]?.detail.value).toBe(42);
  });

  it('cleans up event listeners when component unmounts (zero memory leaks)', async () => {
    const ReactMockBridge = createLitElementBridge<MockLitStepperProps, MockLitStepperElement>(
      'mock-lit-stepper',
      {
        events: {
          onQuantityChange: 'quantity-change',
        },
      },
    );

    const handleChange = vi.fn();
    let capturedEl: MockLitStepperElement | null = null;

    await act(async () => {
      root.render(
        React.createElement(ReactMockBridge, {
          ref: (el: MockLitStepperElement | null) => {
            if (el) capturedEl = el;
          },
          onQuantityChange: handleChange,
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
      new CustomEvent('quantity-change', {
        detail: { value: 100 },
      }),
    );

    // Listener was cleaned up, should NOT be called
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('cleans up previous event listeners when event handler prop updates', async () => {
    const ReactMockBridge = createLitElementBridge<MockLitStepperProps, MockLitStepperElement>(
      'mock-lit-stepper',
      {
        events: {
          onQuantityChange: 'quantity-change',
        },
      },
    );

    const handlerA = vi.fn();
    const handlerB = vi.fn();

    // Render with handlerA
    await act(async () => {
      root.render(
        React.createElement(ReactMockBridge, {
          onQuantityChange: handlerA,
        }),
      );
    });

    const domEl = container.querySelector('mock-lit-stepper') as MockLitStepperElement;

    // Re-render with handlerB
    await act(async () => {
      root.render(
        React.createElement(ReactMockBridge, {
          onQuantityChange: handlerB,
        }),
      );
    });

    // Dispatch event
    domEl.dispatchEvent(
      new CustomEvent('quantity-change', {
        detail: { value: 7 },
      }),
    );

    // Old handler should NOT be called; new handler should be called exactly once
    expect(handlerA).not.toHaveBeenCalled();
    expect(handlerB).toHaveBeenCalledTimes(1);
    expect(handlerB.mock.calls[0]?.[0]?.detail.value).toBe(7);
  });

  it('updates complex properties when React props change on re-render', async () => {
    const ReactMockBridge = createLitElementBridge<MockLitStepperProps, MockLitStepperElement>(
      'mock-lit-stepper',
      {
        properties: ['items'],
      },
    );

    const initialItems = [{ id: '1', name: 'Item 1' }];
    const updatedItems = [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }];

    await act(async () => {
      root.render(
        React.createElement(ReactMockBridge, {
          items: initialItems,
        }),
      );
    });

    const domEl = container.querySelector('mock-lit-stepper') as MockLitStepperElement;
    expect(domEl.items).toBe(initialItems);
    expect(domEl.items.length).toBe(1);

    // Update props
    await act(async () => {
      root.render(
        React.createElement(ReactMockBridge, {
          items: updatedItems,
        }),
      );
    });

    expect(domEl.items).toBe(updatedItems);
    expect(domEl.items.length).toBe(2);
  });

  it('forwards refs correctly to both callback refs and ObjectRefs (React.createRef)', async () => {
    const ReactMockBridge = createLitElementBridge<MockLitStepperProps, MockLitStepperElement>(
      'mock-lit-stepper',
    );

    const objectRef = React.createRef<MockLitStepperElement>();
    let callbackRefEl: MockLitStepperElement | null = null;

    // Test ObjectRef
    await act(async () => {
      root.render(
        React.createElement(ReactMockBridge, {
          ref: objectRef,
        }),
      );
    });

    const domEl = container.querySelector('mock-lit-stepper') as MockLitStepperElement;
    expect(objectRef.current).toBe(domEl);

    // Test Callback Ref
    await act(async () => {
      root.render(
        React.createElement(ReactMockBridge, {
          ref: (el: MockLitStepperElement | null) => {
            callbackRefEl = el;
          },
        }),
      );
    });

    expect(callbackRefEl).toBe(domEl);
  });

  it('passes children through to custom element for Shadow DOM slot projection', async () => {
    const ReactMockBridge = createLitElementBridge<MockLitStepperProps, MockLitStepperElement>(
      'mock-lit-stepper',
    );

    await act(async () => {
      root.render(
        React.createElement(
          ReactMockBridge,
          null,
          React.createElement('span', { 'data-testid': 'slot-content' }, 'Slotted Text'),
        ),
      );
    });

    const slottedEl = container.querySelector('span[data-testid="slot-content"]');
    expect(slottedEl).not.toBeNull();
    expect(slottedEl?.textContent).toBe('Slotted Text');
    expect(slottedEl?.parentElement?.tagName.toLowerCase()).toBe('mock-lit-stepper');
  });

  it('supports single options object signature and aliases (createLitBridge, createCustomElementBridge)', async () => {
    const BridgeFromOptions = createLitElementBridge<MockLitStepperProps, MockLitStepperElement>({
      tagName: 'mock-lit-stepper',
      properties: ['items'],
    });

    const BridgeFromLitAlias = createLitBridge<MockLitStepperProps, MockLitStepperElement>(
      'mock-lit-stepper',
      {
        properties: ['items'],
      },
    );

    const BridgeFromCustomAlias = createCustomElementBridge<MockLitStepperProps, MockLitStepperElement>({
      tagName: 'mock-lit-stepper',
      properties: ['items'],
    });

    expect(BridgeFromOptions).toBeDefined();
    expect(BridgeFromLitAlias).toBeDefined();
    expect(BridgeFromCustomAlias).toBeDefined();
    expect(BridgeFromOptions.displayName).toBe('LitBridge(mock-lit-stepper)');
  });

  it('passes through standard HTML attributes, className, style, and aria/data attributes', async () => {
    const ReactMockBridge = createLitElementBridge<MockLitStepperProps, MockLitStepperElement>(
      'mock-lit-stepper',
    );

    await act(async () => {
      root.render(
        React.createElement(ReactMockBridge, {
          id: 'stepper-unit-1',
          className: 'custom-lit-class',
          style: { opacity: '0.8' },
          'data-testid': 'test-stepper',
          'aria-label': 'Stepper Component',
        }),
      );
    });

    const domEl = container.querySelector('mock-lit-stepper') as MockLitStepperElement;
    expect(domEl.id).toBe('stepper-unit-1');
    expect(domEl.className).toBe('custom-lit-class');
    expect(domEl.style.opacity).toBe('0.8');
    expect(domEl.getAttribute('data-testid')).toBe('test-stepper');
    expect(domEl.getAttribute('aria-label')).toBe('Stepper Component');
  });
});
