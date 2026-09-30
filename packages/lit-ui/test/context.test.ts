import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LitElement, html } from 'lit';
import { ActionRegister } from '@context-action/core';
import type { ReadableStore } from '@context-action/lit';
import {
  actionRegisterContext,
  actionDispatcherContext,
  createStoreContext,
  provideActionRegister,
  provideStore,
  ContextStoreController,
  ContextActionController,
} from '../src/context.js';

// Observable mock store tracking listener counts
function createMockStore<T>(initialValue: T): ReadableStore<T> & {
  setValue(val: T): void;
  getListenerCount(): number;
} {
  let val = initialValue;
  const listeners = new Set<() => void>();

  return {
    getValue: () => val,
    getSnapshot: () => val,
    setValue: (next: T) => {
      val = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    getListenerCount: () => listeners.size,
  };
}

describe('W3C Context Protocol (@lit/context) Integration', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('1. Context Tokens & Identity', () => {
    it('provides stable singleton context tokens for action register and dispatcher', () => {
      expect(actionRegisterContext).toBe(Symbol.for('context-action.register'));
      expect(actionDispatcherContext).toBe(Symbol.for('context-action.dispatcher'));
    });

    it('creates matching store context tokens for identical store names', () => {
      const storeCtx1 = createStoreContext<number>('counter');
      const storeCtx2 = createStoreContext<number>('counter');
      const otherCtx = createStoreContext<number>('other');

      expect(storeCtx1).toBe(storeCtx2);
      expect(storeCtx1).not.toBe(otherCtx);
      expect(storeCtx1).toBe(Symbol.for('context-action.store.counter'));
    });

    it('rejects empty or invalid store names', () => {
      expect(() => createStoreContext('')).toThrow(TypeError);
      expect(() => createStoreContext(null as any)).toThrow(TypeError);
    });
  });

  describe('2. Multi-Level Shadow DOM Dependency Injection', () => {
    interface CounterState {
      count: number;
    }

    const counterContext = createStoreContext<CounterState>('counter');

    // Custom Element definitions
    class ProviderHostElement extends LitElement {
      store = createMockStore<CounterState>({ count: 10 });
      register = new ActionRegister<{ increment: { amount: number } }>({
        name: 'test-actions',
      });

      constructor() {
        super();
        provideStore(this, counterContext, this.store);
        provideActionRegister(this, this.register);
      }

      override render() {
        return html`<slot></slot>`;
      }
    }

    class NestedShadowLevel1 extends LitElement {
      override render() {
        return html`<slot></slot>`;
      }
    }

    class ConsumerLeafElement extends LitElement {
      counter = new ContextStoreController(this, {
        context: counterContext,
        selector: (s: CounterState) => s.count,
      });

      actions = new ContextActionController<{ increment: { amount: number } }>(this, {
        context: actionRegisterContext,
      });

      override render() {
        return html`<span data-testid="count">${this.counter.value ?? -1}</span>`;
      }
    }

    const providerTag = 'test-provider-host';
    const level1Tag = 'test-nested-level1';
    const consumerTag = 'test-consumer-leaf';

    if (!customElements.get(providerTag)) customElements.define(providerTag, ProviderHostElement);
    if (!customElements.get(level1Tag)) customElements.define(level1Tag, NestedShadowLevel1);
    if (!customElements.get(consumerTag)) customElements.define(consumerTag, ConsumerLeafElement);

    it('injects Store and ActionRegister across nested Shadow DOM boundaries', async () => {
      const provider = document.createElement(providerTag) as ProviderHostElement;
      const level1 = document.createElement(level1Tag) as NestedShadowLevel1;
      const consumer = document.createElement(consumerTag) as ConsumerLeafElement;

      // Hierarchy: container -> provider -> level1 -> consumer
      provider.appendChild(level1);
      level1.appendChild(consumer);
      container.appendChild(provider);

      await consumer.updateComplete;

      // Verify store resolution across Shadow DOM
      expect(consumer.counter.isResolved).toBe(true);
      expect(consumer.counter.value).toBe(10);
      expect(consumer.actions.register).toBe(provider.register);

      // Verify reactive update
      provider.store.setValue({ count: 42 });
      await consumer.updateComplete;
      expect(consumer.counter.value).toBe(42);
    });

    it('guarantees zero memory leaks on consumer disconnection and resumes on reconnect', async () => {
      const provider = document.createElement(providerTag) as ProviderHostElement;
      const consumer = document.createElement(consumerTag) as ConsumerLeafElement;

      provider.appendChild(consumer);
      container.appendChild(provider);
      await consumer.updateComplete;

      expect(provider.store.getListenerCount()).toBe(1);

      // Disconnect consumer
      consumer.remove();
      expect(provider.store.getListenerCount()).toBe(0);

      // Update store while disconnected
      provider.store.setValue({ count: 99 });

      // Reconnect consumer
      provider.appendChild(consumer);
      await consumer.updateComplete;

      expect(provider.store.getListenerCount()).toBe(1);
      expect(consumer.counter.value).toBe(99);
    });

    it('dispatches typed actions through the context-injected ActionRegister', async () => {
      const provider = document.createElement(providerTag) as ProviderHostElement;
      const consumer = document.createElement(consumerTag) as ConsumerLeafElement;

      const handlerSpy = vi.fn();
      provider.register.register('increment', async (payload: { amount: number }) => {
        handlerSpy(payload);
        provider.store.setValue({ count: provider.store.getValue().count + payload.amount });
      });

      provider.appendChild(consumer);
      container.appendChild(provider);
      await consumer.updateComplete;

      await consumer.actions.dispatch('increment', { amount: 5 });

      expect(handlerSpy).toHaveBeenCalledWith({ amount: 5 });
      expect(consumer.counter.value).toBe(15);
    });

    it('throws descriptive error when dispatching without a registered provider', async () => {
      const orphanConsumer = document.createElement(consumerTag) as ConsumerLeafElement;
      container.appendChild(orphanConsumer);
      await orphanConsumer.updateComplete;

      await expect(orphanConsumer.actions.dispatch('increment', { amount: 1 })).rejects.toThrow(
        /No ActionRegister found in context hierarchy/
      );
    });
  });
});
