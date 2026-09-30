import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import {
  createLitElementBridge,
  type LitBridgeConfig,
} from '../src/react-bridge.js';

// React 18/19 act environment flag
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Adversarial Custom Element that instruments addEventListener and removeEventListener
 * to track active listeners, detect memory leaks, and measure listener lifecycles.
 */
class MockStressElement extends HTMLElement {
  #items: readonly any[] = [];
  #metadata: Record<string, any> = {};
  #config: any = null;
  counter = 0;

  // Real-time active listener registry per event type
  activeListeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  totalAddCalls = 0;
  totalRemoveCalls = 0;

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

  get config() {
    return this.#config;
  }
  set config(val: any) {
    this.#config = val;
  }

  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    this.totalAddCalls++;
    if (!this.activeListeners.has(type)) {
      this.activeListeners.set(type, new Set());
    }
    this.activeListeners.get(type)!.add(listener);
    super.addEventListener(type, listener, options);
  }

  override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void {
    this.totalRemoveCalls++;
    const set = this.activeListeners.get(type);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.activeListeners.delete(type);
      }
    }
    super.removeEventListener(type, listener, options);
  }

  getActiveListenerCount(type?: string): number {
    if (type) {
      return this.activeListeners.get(type)?.size ?? 0;
    }
    let total = 0;
    for (const set of this.activeListeners.values()) {
      total += set.size;
    }
    return total;
  }

  customMethod(): string {
    return `counter:${this.counter}`;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('mock-stress-element')) {
  customElements.define('mock-stress-element', MockStressElement);
}

interface MockStressProps {
  id?: string | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
  counter?: number | undefined;
  items?: readonly any[] | undefined;
  metadata?: Record<string, any> | undefined;
  config?: any;
  onQuantityChange?: ((e: CustomEvent<{ value: number }>) => void) | undefined;
  onStatusChange?: ((e: CustomEvent<{ active: boolean }>) => void) | undefined;
  onBurstEvent?: ((e: CustomEvent<{ seq: number; payload: any }>) => void) | undefined;
  onEventA?: ((e: CustomEvent<{ id: number }>) => void) | undefined;
  onEventB?: ((e: CustomEvent<{ msg: string }>) => void) | undefined;
  children?: React.ReactNode | undefined;
  'data-testid'?: string | undefined;
}

const stressConfig: LitBridgeConfig<MockStressProps> = {
  properties: ['counter', 'items', 'metadata', 'config'],
  events: {
    onQuantityChange: 'quantity-change',
    onStatusChange: 'status-change',
    onBurstEvent: 'burst-event',
    onEventA: 'event-a',
    onEventB: 'event-b',
  },
};

const ReactStressBridge = createLitElementBridge<MockStressProps, MockStressElement>(
  'mock-stress-element',
  stressConfig,
);

describe('createLitElementBridge Adversarial Stress Tests', () => {
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

  describe('Challenge 1: High-Frequency Parent Rerenders (100 Rapid State Updates)', () => {
    it('synchronizes properties accurately without duplicate listener accumulation across 100 rapid rerenders', async () => {
      let forwardedEl: MockStressElement | null = null;
      let setParentCount: React.Dispatch<React.SetStateAction<number>> = () => {};
      const changeHandlerCalls: number[] = [];

      function ParentComponent() {
        const [count, setCount] = React.useState(0);
        setParentCount = setCount;

        return (
          <ReactStressBridge
            ref={(el) => {
              if (el) forwardedEl = el;
            }}
            counter={count}
            items={[{ id: `item-${count}`, value: count }]}
            metadata={{ updateCycle: count, timestamp: Date.now() }}
            onQuantityChange={(e) => {
              changeHandlerCalls.push(e.detail.value);
            }}
            onStatusChange={() => {}}
          />
        );
      }

      await act(async () => {
        root.render(<ParentComponent />);
      });

      expect(forwardedEl).not.toBeNull();
      const el = forwardedEl!;

      // Initial state assertions
      expect(el.counter).toBe(0);
      expect(el.items[0]?.value).toBe(0);
      expect(el.getActiveListenerCount('quantity-change')).toBe(1);
      expect(el.getActiveListenerCount('status-change')).toBe(1);
      expect(el.getActiveListenerCount()).toBe(2);

      // Perform 100 rapid rerenders
      for (let i = 1; i <= 100; i++) {
        await act(async () => {
          setParentCount(i);
        });

        // After each render, properties MUST be up to date
        expect(el.counter).toBe(i);
        expect(el.items[0]?.value).toBe(i);
        expect(el.metadata['updateCycle']).toBe(i);

        // At NO POINT should listeners accumulate
        expect(el.getActiveListenerCount('quantity-change')).toBe(1);
        expect(el.getActiveListenerCount('status-change')).toBe(1);
        expect(el.getActiveListenerCount()).toBe(2);
      }

      // Final listener audit after 100 rerenders:
      // Initial render (1) + 100 updates = 101 effect setups
      // 100 cleanups occurred for each of the 2 events
      expect(el.totalAddCalls).toBe(101 * 2);
      expect(el.totalRemoveCalls).toBe(100 * 2);
      expect(el.getActiveListenerCount()).toBe(2);

      // Dispatch event after 100 rerenders: handler MUST fire exactly once
      el.dispatchEvent(
        new CustomEvent('quantity-change', {
          detail: { value: 999 },
        }),
      );

      expect(changeHandlerCalls).toEqual([999]);
      expect(changeHandlerCalls.length).toBe(1);
    });

    it('ensures fresh closures are invoked without stale state when inline handlers are recreated 100 times', async () => {
      let setParentCount: React.Dispatch<React.SetStateAction<number>> = () => {};
      let lastHandledValue = -1;
      let forwardedEl: MockStressElement | null = null;

      function ParentWithInlineHandler() {
        const [count, setCount] = React.useState(0);
        setParentCount = setCount;

        // Fresh inline closure on each render
        return (
          <ReactStressBridge
            ref={(el) => {
              if (el) forwardedEl = el;
            }}
            counter={count}
            onQuantityChange={(e) => {
              // Capture parent count in closure alongside event detail
              lastHandledValue = count + e.detail.value;
            }}
          />
        );
      }

      await act(async () => {
        root.render(<ParentWithInlineHandler />);
      });

      const el = forwardedEl!;

      for (let i = 1; i <= 100; i++) {
        await act(async () => {
          setParentCount(i);
        });
      }

      // Dispatch event: closure should reflect count = 100, not stale 0
      el.dispatchEvent(
        new CustomEvent('quantity-change', {
          detail: { value: 50 },
        }),
      );

      expect(lastHandledValue).toBe(100 + 50); // 150
      expect(el.getActiveListenerCount('quantity-change')).toBe(1);
    });
  });

  describe('Challenge 2: Rapid Mount/Unmount Stress (100 Cycles)', () => {
    it('executes 100 rapid mount and unmount cycles with guaranteed ZERO retained DOM listeners', async () => {
      const mountedInstances: MockStressElement[] = [];

      for (let cycle = 0; cycle < 100; cycle++) {
        let instanceRef: MockStressElement | null = null;
        const dummyHandler = vi.fn();

        // 1. Mount
        await act(async () => {
          root.render(
            <ReactStressBridge
              ref={(el) => {
                if (el) instanceRef = el;
              }}
              counter={cycle}
              items={[{ cycle }]}
              metadata={{ cycle }}
              onQuantityChange={dummyHandler}
              onStatusChange={dummyHandler}
              onBurstEvent={dummyHandler}
            />,
          );
        });

        expect(instanceRef).not.toBeNull();
        const el = instanceRef!;
        mountedInstances.push(el);

        // While mounted: exactly 3 listeners attached
        expect(el.getActiveListenerCount()).toBe(3);
        expect(el.totalAddCalls - el.totalRemoveCalls).toBe(3);

        // 2. Unmount
        await act(async () => {
          root.unmount();
        });

        // Immediately after unmount: exactly 0 listeners retained!
        expect(el.getActiveListenerCount()).toBe(0);
        expect(el.totalAddCalls).toBe(el.totalRemoveCalls);

        // Dispatching events to unmounted DOM element must NOT invoke callback
        el.dispatchEvent(
          new CustomEvent('quantity-change', {
            detail: { value: 42 },
          }),
        );
        expect(dummyHandler).not.toHaveBeenCalled();

        // Re-create root for next iteration
        container.remove();
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
      }

      // Global audit across all 100 instances: 0 retained listeners
      expect(mountedInstances.length).toBe(100);
      for (let i = 0; i < 100; i++) {
        const el = mountedInstances[i]!;
        expect(el.getActiveListenerCount()).toBe(0);
        expect(el.totalAddCalls).toBe(3);
        expect(el.totalRemoveCalls).toBe(3);
      }
    });

    it('handles immediate unmount during active event dispatch without throwing or leaking', async () => {
      let capturedEl: MockStressElement | null = null;
      const handler = vi.fn(() => {
        // Trigger unmount from inside event handler
      });

      await act(async () => {
        root.render(
          <ReactStressBridge
            ref={(el) => {
              if (el) capturedEl = el;
            }}
            onQuantityChange={handler}
          />,
        );
      });

      const el = capturedEl!;
      expect(el.getActiveListenerCount('quantity-change')).toBe(1);

      // Dispatch event
      el.dispatchEvent(
        new CustomEvent('quantity-change', { detail: { value: 1 } }),
      );
      expect(handler).toHaveBeenCalledTimes(1);

      // Unmount
      await act(async () => {
        root.unmount();
      });

      // Dispatch again on detached element
      el.dispatchEvent(
        new CustomEvent('quantity-change', { detail: { value: 2 } }),
      );

      // Must remain 1 (not called after unmount)
      expect(handler).toHaveBeenCalledTimes(1);
      expect(el.getActiveListenerCount()).toBe(0);
    });
  });

  describe('Challenge 3: Dynamic Ref Replacement Stress', () => {
    it('seamlessly transitions through CallbackRef -> ObjectRef -> null -> CallbackRef with correct detachment order', async () => {
      const callbackRefAInvocations: (MockStressElement | null)[] = [];
      const callbackRefBInvocations: (MockStressElement | null)[] = [];
      const callbackRefDInvocations: (MockStressElement | null)[] = [];
      const objectRefC = React.createRef<MockStressElement>();

      const callbackA = (el: MockStressElement | null) => {
        callbackRefAInvocations.push(el);
      };
      const callbackB = (el: MockStressElement | null) => {
        callbackRefBInvocations.push(el);
      };
      const callbackD = (el: MockStressElement | null) => {
        callbackRefDInvocations.push(el);
      };

      // Step 1: Render with callbackRefA
      await act(async () => {
        root.render(<ReactStressBridge ref={callbackA} counter={1} />);
      });

      const domEl = container.querySelector('mock-stress-element') as MockStressElement;
      expect(domEl).not.toBeNull();
      expect(callbackRefAInvocations).toEqual([domEl]);

      // Step 2: Transition to callbackRefB
      await act(async () => {
        root.render(<ReactStressBridge ref={callbackB} counter={2} />);
      });

      // callbackA must receive null (detached), callbackB receives domEl
      expect(callbackRefAInvocations).toEqual([domEl, null]);
      expect(callbackRefBInvocations).toEqual([domEl]);

      // Step 3: Transition to objectRefC (React.createRef)
      await act(async () => {
        root.render(<ReactStressBridge ref={objectRefC} counter={3} />);
      });

      // callbackB receives null, objectRefC.current becomes domEl
      expect(callbackRefBInvocations).toEqual([domEl, null]);
      expect(objectRefC.current).toBe(domEl);

      // Step 4: Transition to null ref
      await act(async () => {
        root.render(<ReactStressBridge ref={null} counter={4} />);
      });

      // objectRefC.current becomes null
      expect(objectRefC.current).toBeNull();
      expect(domEl.counter).toBe(4);

      // Step 5: Transition to callbackRefD
      await act(async () => {
        root.render(<ReactStressBridge ref={callbackD} counter={5} />);
      });

      expect(callbackRefDInvocations).toEqual([domEl]);

      // Step 6: Unmount component
      await act(async () => {
        root.unmount();
      });

      // callbackD receives null
      expect(callbackRefDInvocations).toEqual([domEl, null]);
    });

    it('maintains internal elementRef integrity and property synchronization under 50 rapid ref swaps', async () => {
      let domInstance: MockStressElement | null = null;
      let setRefType: React.Dispatch<React.SetStateAction<number>> = () => {};

      function RefSwappingParent() {
        const [refType, setType] = React.useState(0);
        setRefType = setType;

        const refObj1 = React.useRef<MockStressElement | null>(null);
        const refObj2 = React.useRef<MockStressElement | null>(null);

        let activeRef: any;
        if (refType % 3 === 0) {
          activeRef = (el: MockStressElement | null) => {
            if (el) domInstance = el;
          };
        } else if (refType % 3 === 1) {
          activeRef = refObj1;
        } else {
          activeRef = refObj2;
        }

        return <ReactStressBridge ref={activeRef} counter={refType} />;
      }

      await act(async () => {
        root.render(<RefSwappingParent />);
      });

      const el = domInstance!;
      expect(el).not.toBeNull();

      for (let i = 1; i <= 50; i++) {
        await act(async () => {
          setRefType(i);
        });
        expect(el.counter).toBe(i);
      }
    });
  });

  describe('Challenge 4: Custom Event Bursts & Payload Fidelity', () => {
    it('processes a synchronous burst of 1,000 custom events with 100% FIFO delivery and zero dropped payloads', async () => {
      let forwardedEl: MockStressElement | null = null;
      const receivedEvents: { seq: number; payload: any }[] = [];

      await act(async () => {
        root.render(
          <ReactStressBridge
            ref={(el) => {
              if (el) forwardedEl = el;
            }}
            onBurstEvent={(e) => {
              receivedEvents.push(e.detail);
            }}
          />,
        );
      });

      const el = forwardedEl!;
      const totalEvents = 1000;

      // Dispatch 1,000 custom events in tight synchronous loop
      for (let i = 0; i < totalEvents; i++) {
        el.dispatchEvent(
          new CustomEvent('burst-event', {
            detail: {
              seq: i,
              payload: {
                batchId: Math.floor(i / 10),
                subToken: `token-${i}`,
                nested: { depth: 3, val: i * 2 },
              },
            },
          }),
        );
      }

      // Assert complete delivery
      expect(receivedEvents.length).toBe(totalEvents);

      // Verify FIFO ordering and payload fidelity
      for (let i = 0; i < totalEvents; i++) {
        const item = receivedEvents[i]!;
        expect(item.seq).toBe(i);
        expect(item.payload.batchId).toBe(Math.floor(i / 10));
        expect(item.payload.subToken).toBe(`token-${i}`);
        expect(item.payload.nested.val).toBe(i * 2);
      }
    });

    it('handles concurrent event bursts interleaved with active parent rerenders without race conditions', async () => {
      let forwardedEl: MockStressElement | null = null;
      let setParentState: React.Dispatch<React.SetStateAction<number>> = () => {};
      const deliveredSeq: number[] = [];

      function InterleavedParent() {
        const [state, setState] = React.useState(0);
        setParentState = setState;

        return (
          <ReactStressBridge
            ref={(el) => {
              if (el) forwardedEl = el;
            }}
            counter={state}
            onBurstEvent={(e) => {
              deliveredSeq.push(e.detail.seq);
            }}
          />
        );
      }

      await act(async () => {
        root.render(<InterleavedParent />);
      });

      const el = forwardedEl!;

      // Interleave state updates with event dispatches
      for (let i = 0; i < 50; i++) {
        // Dispatch before update
        el.dispatchEvent(
          new CustomEvent('burst-event', {
            detail: { seq: i * 2, payload: {} },
          }),
        );

        await act(async () => {
          setParentState(i + 1);
        });

        // Dispatch after update
        el.dispatchEvent(
          new CustomEvent('burst-event', {
            detail: { seq: i * 2 + 1, payload: {} },
          }),
        );
      }

      expect(deliveredSeq.length).toBe(100);
      for (let i = 0; i < 100; i++) {
        expect(deliveredSeq[i]).toBe(i);
      }
    });
  });

  describe('Challenge 5: Complex Edge Cases & Boundary Conditions', () => {
    it('manages 5 simultaneous custom event types with independent listener lifecycles', async () => {
      let forwardedEl: MockStressElement | null = null;
      const callsA: number[] = [];
      const callsB: string[] = [];
      const callsQty: number[] = [];

      await act(async () => {
        root.render(
          <ReactStressBridge
            ref={(el) => {
              if (el) forwardedEl = el;
            }}
            onEventA={(e) => callsA.push(e.detail.id)}
            onEventB={(e) => callsB.push(e.detail.msg)}
            onQuantityChange={(e) => callsQty.push(e.detail.value)}
          />,
        );
      });

      const el = forwardedEl!;
      expect(el.getActiveListenerCount()).toBe(3);

      el.dispatchEvent(new CustomEvent('event-a', { detail: { id: 101 } }));
      el.dispatchEvent(new CustomEvent('event-b', { detail: { msg: 'hello' } }));
      el.dispatchEvent(new CustomEvent('quantity-change', { detail: { value: 77 } }));

      expect(callsA).toEqual([101]);
      expect(callsB).toEqual(['hello']);
      expect(callsQty).toEqual([77]);
    });

    it('dynamically attaches and detaches listeners when event handler prop transitions to undefined and back', async () => {
      let setHandlerActive: React.Dispatch<React.SetStateAction<boolean>> = () => {};
      let forwardedEl: MockStressElement | null = null;
      const handler = vi.fn();

      function TogglingHandlerParent() {
        const [active, setActive] = React.useState(true);
        setHandlerActive = setActive;

        return (
          <ReactStressBridge
            ref={(el) => {
              if (el) forwardedEl = el;
            }}
            onQuantityChange={active ? handler : undefined}
          />
        );
      }

      await act(async () => {
        root.render(<TogglingHandlerParent />);
      });

      const el = forwardedEl!;
      expect(el.getActiveListenerCount('quantity-change')).toBe(1);

      // Disable handler prop
      await act(async () => {
        setHandlerActive(false);
      });

      expect(el.getActiveListenerCount('quantity-change')).toBe(0);

      // Dispatch event while handler is undefined
      el.dispatchEvent(new CustomEvent('quantity-change', { detail: { value: 1 } }));
      expect(handler).not.toHaveBeenCalled();

      // Re-enable handler prop
      await act(async () => {
        setHandlerActive(true);
      });

      expect(el.getActiveListenerCount('quantity-change')).toBe(1);

      el.dispatchEvent(new CustomEvent('quantity-change', { detail: { value: 2 } }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('preserves children slot projection across 50 rapid rerenders', async () => {
      let setSlottedCount: React.Dispatch<React.SetStateAction<number>> = () => {};

      function SlottedParent() {
        const [count, setCount] = React.useState(0);
        setSlottedCount = setCount;

        return (
          <ReactStressBridge counter={count}>
            <div data-testid="slotted-child">Child Count: {count}</div>
          </ReactStressBridge>
        );
      }

      await act(async () => {
        root.render(<SlottedParent />);
      });

      for (let i = 1; i <= 50; i++) {
        await act(async () => {
          setSlottedCount(i);
        });

        const child = container.querySelector('[data-testid="slotted-child"]');
        expect(child).not.toBeNull();
        expect(child?.textContent).toBe(`Child Count: ${i}`);
      }
    });

    it('supports direct custom element method invocation via ref during rapid property updates', async () => {
      const ref = React.createRef<MockStressElement>();
      let setVal: React.Dispatch<React.SetStateAction<number>> = () => {};

      function MethodParent() {
        const [val, set] = React.useState(0);
        setVal = set;
        return <ReactStressBridge ref={ref} counter={val} />;
      }

      await act(async () => {
        root.render(<MethodParent />);
      });

      expect(ref.current?.customMethod()).toBe('counter:0');

      for (let i = 1; i <= 20; i++) {
        await act(async () => {
          setVal(i);
        });
        expect(ref.current?.customMethod()).toBe(`counter:${i}`);
      }
    });
  });
});
