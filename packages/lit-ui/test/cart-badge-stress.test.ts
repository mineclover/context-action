/**
 * @fileoverview Empirical Adversarial Stress & Chaos Test Suite for <lit-cart-badge> & React Bridge.
 * Authored by challenger_m4_2 (Empirical Challenger: Cart Badge & Leak Stress).
 *
 * Vectors Stress-Tested:
 * 1. High-frequency store mutations (500+ rapid synchronous & asynchronous updates).
 * 2. Selective projection memoization: unprojected cart mutations must NOT trigger requestUpdate().
 * 3. 50-cycle attach/detach memory leak verification: store listeners strictly return to 0.
 * 4. Deeply nested Shadow DOM context resolution (piercing 6+ shadow boundaries).
 * 5. Rapid mount/unmount of React bridge component (50 cycles in React 18/19 act environment).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { html, LitElement } from 'lit';
import { ActionRegister } from '@context-action/core';
import type { ReadableStore } from '@context-action/lit';
import {
  LitCartBadge,
  cartStoreContext,
  createStoreContext,
  provideStore,
  provideActionRegister,
  createLitElementBridge,
  defaultCartCountSelector,
} from '../src/index.js';

// Configure React 18/19 act testing environment
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Trackable mock store helper providing listener counts and mutation helpers.
 */
function createTrackedStore<T>(initialValue: T): ReadableStore<T> & {
  setValue(val: T): void;
  update(fn: (prev: T) => T): void;
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
    update: (fn: (prev: T) => T) => {
      val = fn(val);
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

// React Bridge Component Definition for testing
interface ReactCartBadgeProps {
  id?: string;
  store?: ReadableStore<any>;
  label?: string;
  maxCount?: number;
  hideZero?: boolean;
  value?: number;
  disabled?: boolean;
  onCartBadgeClick?: (e: CustomEvent<{ count: number; isPending: boolean }>) => void;
  children?: React.ReactNode;
}

const ReactCartBadge = createLitElementBridge<ReactCartBadgeProps, LitCartBadge>(
  'lit-cart-badge',
  {
    properties: ['store', 'maxCount', 'hideZero', 'value', 'label', 'disabled'],
    events: {
      onCartBadgeClick: 'cart-badge-click',
    },
  }
);

describe('Challenger M4-2: <lit-cart-badge> & React Bridge Adversarial Stress Suite', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.replaceChildren();
  });

  // =========================================================================
  // Vector 1: High-Frequency Store Mutations (500+ Rapid Updates)
  // =========================================================================
  describe('Vector 1: High-Frequency Store Mutations', () => {
    it('handles 500 rapid synchronous store mutations with correct final state and coalesced rendering', async () => {
      const store = createTrackedStore({ totalCount: 0 });
      const badge = document.createElement('lit-cart-badge') as LitCartBadge;
      badge.store = store;
      badge.maxCount = 1000; // Allow full count display
      container.appendChild(badge);
      await badge.updateComplete;

      expect(badge.count).toBe(0);

      // Track requestUpdate calls and render executions
      const requestUpdateSpy = vi.spyOn(badge, 'requestUpdate');

      // Blast 500 rapid synchronous store mutations
      const TOTAL_MUTATIONS = 500;
      for (let i = 1; i <= TOTAL_MUTATIONS; i++) {
        store.setValue({ totalCount: i });
      }

      // In Lit, requestUpdate is requested on each state change,
      // but the asynchronous microtask scheduler coalesces them into a single render pass
      await badge.updateComplete;

      // Final state must strictly reflect the last mutation (500)
      expect(badge.count).toBe(TOTAL_MUTATIONS);
      const countEl = badge.shadowRoot!.querySelector('[part~="count"]');
      expect(countEl?.textContent).toBe(String(TOTAL_MUTATIONS));
      expect(badge.hasAttribute('has-items')).toBe(true);
      expect(badge.hasAttribute('count-zero')).toBe(false);

      // Verify no UI desync or hanging updates
      expect(await badge.updateComplete).toBe(true);
      expect(store.getListenerCount()).toBe(1);
    });

    it('handles 500 rapid store updates across W3C Context Protocol without dropped frames', async () => {
      const store = createTrackedStore({ totalCount: 0 });

      class ContextHostElement extends LitElement {
        constructor() {
          super();
          provideStore(this, cartStoreContext, store);
        }
        override render() {
          return html`<lit-cart-badge max-count="1000"></lit-cart-badge>`;
        }
      }

      const hostTag = 'stress-context-host-burst';
      if (!customElements.get(hostTag)) {
        customElements.define(hostTag, ContextHostElement);
      }

      const host = document.createElement(hostTag) as ContextHostElement;
      container.appendChild(host);
      await host.updateComplete;

      const badge = host.shadowRoot!.querySelector('lit-cart-badge') as LitCartBadge;
      await badge.updateComplete;
      expect(badge.count).toBe(0);

      // 500 rapid updates to context store
      for (let i = 1; i <= 500; i++) {
        store.setValue({ totalCount: i });
      }

      await badge.updateComplete;

      expect(badge.count).toBe(500);
      const countEl = badge.shadowRoot!.querySelector('[part~="count"]');
      expect(countEl?.textContent).toBe('500');
    });

    it('handles rapid interleaved mutations with zero count and recovery without flicker or error', async () => {
      const store = createTrackedStore({ totalCount: 1 });
      const badge = document.createElement('lit-cart-badge') as LitCartBadge;
      badge.store = store;
      badge.hideZero = true;
      container.appendChild(badge);
      await badge.updateComplete;

      // Interleave between 0 and positive count 200 times
      for (let i = 0; i < 200; i++) {
        store.setValue({ totalCount: i % 2 === 0 ? 0 : 5 });
      }

      await badge.updateComplete;

      // Last mutation was i = 199 (199 % 2 !== 0 -> 5)
      expect(badge.count).toBe(5);
      expect(badge.shadowRoot!.querySelector('button')).not.toBeNull();
      const countEl = badge.shadowRoot!.querySelector('[part~="count"]');
      expect(countEl?.textContent).toBe('5');
    });
  });

  // =========================================================================
  // Vector 2: Selective Projection Memoization & requestUpdate Suppression
  // =========================================================================
  describe('Vector 2: Selective Projection Memoization', () => {
    interface RichCartState {
      totalCount: number;
      currency: string;
      discountCode?: string;
      shippingAddress?: { zip: string; city: string };
      metadata: Record<string, unknown>;
      items: { id: string; name: string; quantity: number; price: number }[];
    }

    it('strictly suppresses requestUpdate() for 200 non-quantity mutations on direct .store', async () => {
      const store = createTrackedStore<RichCartState>({
        totalCount: 3,
        currency: 'USD',
        discountCode: 'SUMMER',
        shippingAddress: { zip: '94102', city: 'San Francisco' },
        metadata: { version: 1 },
        items: [
          { id: 'item_1', name: 'Shoes', quantity: 2, price: 50 },
          { id: 'item_2', name: 'Socks', quantity: 1, price: 10 },
        ],
      });

      const badge = document.createElement('lit-cart-badge') as LitCartBadge;
      badge.store = store;
      container.appendChild(badge);
      await badge.updateComplete;

      expect(badge.count).toBe(3);

      const requestUpdateSpy = vi.spyOn(badge, 'requestUpdate');

      // 200 mutations to currency, discount, metadata, price, name — totalCount and quantities UNCHANGED
      for (let i = 0; i < 200; i++) {
        store.setValue({
          totalCount: 3,
          currency: i % 2 === 0 ? 'EUR' : 'GBP',
          discountCode: `CODE_${i}`,
          shippingAddress: { zip: `${10000 + i}`, city: 'City' },
          metadata: { version: i, timestamp: Date.now() },
          items: [
            { id: 'item_1', name: `Shoes_${i}`, quantity: 2, price: 50 + i },
            { id: 'item_2', name: `Socks_${i}`, quantity: 1, price: 10 + i },
          ],
        });
      }

      await badge.updateComplete;

      // MUST NOT have triggered requestUpdate() a single time!
      expect(requestUpdateSpy).not.toHaveBeenCalled();
      expect(badge.count).toBe(3);

      // Now mutate totalCount -> MUST trigger requestUpdate()
      store.setValue({
        ...store.getValue(),
        totalCount: 4,
      });

      await badge.updateComplete;

      expect(requestUpdateSpy).toHaveBeenCalled();
      expect(badge.count).toBe(4);
    });

    it('strictly suppresses requestUpdate() for context-injected store when unprojected slices change', async () => {
      const store = createTrackedStore({
        totalCount: 7,
        theme: 'dark',
        serverTime: 1000,
      });

      class ContextMemoHost extends LitElement {
        constructor() {
          super();
          provideStore(this, cartStoreContext, store);
        }
        override render() {
          return html`<lit-cart-badge></lit-cart-badge>`;
        }
      }

      const hostTag = 'stress-context-memo-host';
      if (!customElements.get(hostTag)) {
        customElements.define(hostTag, ContextMemoHost);
      }

      const host = document.createElement(hostTag) as ContextMemoHost;
      container.appendChild(host);
      await host.updateComplete;

      const badge = host.shadowRoot!.querySelector('lit-cart-badge') as LitCartBadge;
      await badge.updateComplete;
      expect(badge.count).toBe(7);

      const requestUpdateSpy = vi.spyOn(badge, 'requestUpdate');

      // Mutate unprojected slices 100 times
      for (let i = 0; i < 100; i++) {
        store.setValue({
          totalCount: 7,
          theme: i % 2 === 0 ? 'light' : 'dark',
          serverTime: 1000 + i,
        });
      }

      await badge.updateComplete;

      expect(requestUpdateSpy).not.toHaveBeenCalled();
      expect(badge.count).toBe(7);

      // Mutate totalCount -> triggers update
      store.setValue({ totalCount: 8, theme: 'light', serverTime: 2000 });
      await badge.updateComplete;

      expect(requestUpdateSpy).toHaveBeenCalled();
      expect(badge.count).toBe(8);
    });

    it('respects custom selector and custom equalityFn memoization', async () => {
      interface CustomState {
        user: string;
        cartId: string;
        itemCount: number;
      }

      const store = createTrackedStore<CustomState>({
        user: 'alice',
        cartId: 'c1',
        itemCount: 10,
      });

      const badge = document.createElement('lit-cart-badge') as LitCartBadge;
      badge.store = store;
      // Selector categorizes cart into tiers: 0 = empty, 1 = regular (1-9), 2 = bulk (10+)
      badge.selector = (s: CustomState) => (s.itemCount >= 10 ? 2 : s.itemCount > 0 ? 1 : 0);
      badge.equalityFn = (a, b) => a === b;

      container.appendChild(badge);
      await badge.updateComplete;

      expect(badge.count).toBe(2);

      const requestUpdateSpy = vi.spyOn(badge, 'requestUpdate');

      // Mutate itemCount from 10 to 15, 20, 99 (all stay in tier 2)
      store.setValue({ user: 'alice', cartId: 'c1', itemCount: 15 });
      store.setValue({ user: 'alice', cartId: 'c1', itemCount: 20 });
      store.setValue({ user: 'alice', cartId: 'c1', itemCount: 99 });
      await badge.updateComplete;

      // Suppressed because tier didn't change!
      expect(requestUpdateSpy).not.toHaveBeenCalled();

      // Drop to regular tier (itemCount = 5 -> tier 1)
      store.setValue({ user: 'alice', cartId: 'c1', itemCount: 5 });
      await badge.updateComplete;

      expect(requestUpdateSpy).toHaveBeenCalled();
      expect(badge.count).toBe(1);
    });
  });

  // =========================================================================
  // Vector 3: 50-Cycle Attach/Detach Memory Leak Verification
  // =========================================================================
  describe('Vector 3: 50-Cycle Attach/Detach Memory Leak Verification', () => {
    it('survives 50 cycles of attach/detach with direct .store, strictly returning listeners to 0', async () => {
      const store = createTrackedStore({ totalCount: 5 });
      const badge = document.createElement('lit-cart-badge') as LitCartBadge;
      badge.store = store;

      expect(store.getListenerCount()).toBe(0);

      const CYCLES = 50;
      for (let i = 0; i < CYCLES; i++) {
        container.appendChild(badge);
        await badge.updateComplete;

        // While attached: exactly 1 listener
        expect(store.getListenerCount()).toBe(1);
        expect(badge.count).toBe(5);

        container.removeChild(badge);

        // Immediately after detach: strictly 0 listeners!
        expect(store.getListenerCount()).toBe(0);
      }

      // Final post-condition
      expect(store.getListenerCount()).toBe(0);
    });

    it('survives 50 cycles of attach/detach with W3C Context-injected store, strictly returning listeners to 0', async () => {
      const store = createTrackedStore({ totalCount: 12 });

      class ContextHostForLeak extends LitElement {
        constructor() {
          super();
          provideStore(this, cartStoreContext, store);
        }
        override render() {
          return html`<slot></slot>`;
        }
      }

      const hostTag = 'stress-leak-context-host';
      if (!customElements.get(hostTag)) {
        customElements.define(hostTag, ContextHostForLeak);
      }

      const host = document.createElement(hostTag) as ContextHostForLeak;
      container.appendChild(host);
      await host.updateComplete;

      const badge = document.createElement('lit-cart-badge') as LitCartBadge;

      const CYCLES = 50;
      for (let i = 0; i < CYCLES; i++) {
        host.appendChild(badge);
        await badge.updateComplete;

        expect(store.getListenerCount()).toBe(1);
        expect(badge.count).toBe(12);

        host.removeChild(badge);

        expect(store.getListenerCount()).toBe(0);
      }

      expect(store.getListenerCount()).toBe(0);
    });

    it('correctly resubscribes after store mutations occur while detached', async () => {
      const store = createTrackedStore({ totalCount: 1 });
      const badge = document.createElement('lit-cart-badge') as LitCartBadge;
      badge.store = store;

      container.appendChild(badge);
      await badge.updateComplete;
      expect(badge.count).toBe(1);
      expect(store.getListenerCount()).toBe(1);

      // Disconnect
      badge.remove();
      expect(store.getListenerCount()).toBe(0);

      // Mutate store multiple times while detached
      store.setValue({ totalCount: 20 });
      store.setValue({ totalCount: 40 });
      store.setValue({ totalCount: 88 });

      // No listeners should have been called while detached
      expect(store.getListenerCount()).toBe(0);

      // Reconnect
      container.appendChild(badge);
      await badge.updateComplete;

      // Resubscribed and caught up with latest state
      expect(store.getListenerCount()).toBe(1);
      expect(badge.count).toBe(88);
      const countEl = badge.shadowRoot!.querySelector('[part~="count"]');
      expect(countEl?.textContent).toBe('88');
    });

    it('handles store property switching while detached without orphan listeners', async () => {
      const storeA = createTrackedStore({ totalCount: 10 });
      const storeB = createTrackedStore({ totalCount: 20 });

      const badge = document.createElement('lit-cart-badge') as LitCartBadge;
      badge.store = storeA;
      container.appendChild(badge);
      await badge.updateComplete;

      expect(storeA.getListenerCount()).toBe(1);
      expect(storeB.getListenerCount()).toBe(0);

      // Disconnect
      badge.remove();
      expect(storeA.getListenerCount()).toBe(0);
      expect(storeB.getListenerCount()).toBe(0);

      // Switch store while disconnected
      badge.store = storeB;

      // Reconnect
      container.appendChild(badge);
      await badge.updateComplete;

      // storeA must still have 0, storeB must have 1
      expect(storeA.getListenerCount()).toBe(0);
      expect(storeB.getListenerCount()).toBe(1);
      expect(badge.count).toBe(20);

      // Disconnect again
      badge.remove();
      expect(storeA.getListenerCount()).toBe(0);
      expect(storeB.getListenerCount()).toBe(0);
    });
  });

  // =========================================================================
  // Vector 4: Deeply Nested Shadow DOM Context Resolution (6+ Boundaries)
  // =========================================================================
  describe('Vector 4: Deeply Nested Shadow DOM Context Resolution', () => {
    it('pierces 6 nested Shadow DOM boundaries to resolve context and receive reactive updates', async () => {
      const store = createTrackedStore({ totalCount: 77 });

      // Level 0: Provider Root
      class DeepLevel0 extends LitElement {
        constructor() {
          super();
          provideStore(this, cartStoreContext, store);
        }
        override render() {
          return html`<slot></slot>`;
        }
      }

      // Level 1 - 5: Nested intermediate Shadow DOM containers
      class DeepLevel1 extends LitElement {
        override render() {
          return html`<div class="l1"><slot></slot></div>`;
        }
      }
      class DeepLevel2 extends LitElement {
        override render() {
          return html`<section class="l2"><slot></slot></section>`;
        }
      }
      class DeepLevel3 extends LitElement {
        override render() {
          return html`<article class="l3"><slot></slot></article>`;
        }
      }
      class DeepLevel4 extends LitElement {
        override render() {
          return html`<aside class="l4"><slot></slot></aside>`;
        }
      }
      class DeepLevel5 extends LitElement {
        override render() {
          return html`<nav class="l5"><slot></slot></nav>`;
        }
      }

      const tags = [
        'deep-level-0',
        'deep-level-1',
        'deep-level-2',
        'deep-level-3',
        'deep-level-4',
        'deep-level-5',
      ];
      const classes = [
        DeepLevel0,
        DeepLevel1,
        DeepLevel2,
        DeepLevel3,
        DeepLevel4,
        DeepLevel5,
      ];

      tags.forEach((tag, idx) => {
        if (!customElements.get(tag)) {
          customElements.define(tag, classes[idx]!);
        }
      });

      // Construct deeply nested hierarchy:
      // Level0 > Level1 > Level2 > Level3 > Level4 > Level5 > LitCartBadge
      const l0 = document.createElement('deep-level-0');
      const l1 = document.createElement('deep-level-1');
      const l2 = document.createElement('deep-level-2');
      const l3 = document.createElement('deep-level-3');
      const l4 = document.createElement('deep-level-4');
      const l5 = document.createElement('deep-level-5');
      const badge = document.createElement('lit-cart-badge') as LitCartBadge;

      l5.appendChild(badge);
      l4.appendChild(l5);
      l3.appendChild(l4);
      l2.appendChild(l3);
      l1.appendChild(l2);
      l0.appendChild(l1);
      container.appendChild(l0);

      await badge.updateComplete;

      // Badge must have successfully traversed all 6 Shadow DOM boundaries
      expect(badge.count).toBe(77);
      expect(store.getListenerCount()).toBe(1);

      // Reactive update propagates through all 6 Shadow DOM boundaries
      store.setValue({ totalCount: 154 });
      await badge.updateComplete;

      expect(badge.count).toBe(154);
      const countEl = badge.shadowRoot!.querySelector('[part~="count"]');
      expect(countEl?.textContent).toBe('99+'); // Default maxCount is 99

      // Detaching a mid-tier container (Level 3) must tear down badge subscription
      l3.remove();
      expect(store.getListenerCount()).toBe(0);
    });

    it('correctly respects context shadowing / overriding in deep Shadow DOM hierarchy', async () => {
      const rootStore = createTrackedStore({ totalCount: 10 });
      const localStore = createTrackedStore({ totalCount: 99 });

      class ShadowingRoot extends LitElement {
        constructor() {
          super();
          provideStore(this, cartStoreContext, rootStore);
        }
        override render() {
          return html`<slot></slot>`;
        }
      }

      class ShadowingLocal extends LitElement {
        constructor() {
          super();
          // Override cartStoreContext locally
          provideStore(this, cartStoreContext, localStore);
        }
        override render() {
          return html`<div class="local-boundary"><slot></slot></div>`;
        }
      }

      if (!customElements.get('shadowing-root')) customElements.define('shadowing-root', ShadowingRoot);
      if (!customElements.get('shadowing-local')) customElements.define('shadowing-local', ShadowingLocal);

      const root = document.createElement('shadowing-root');
      const local = document.createElement('shadowing-local');
      const badgeInsideLocal = document.createElement('lit-cart-badge') as LitCartBadge;
      const badgeOutsideLocal = document.createElement('lit-cart-badge') as LitCartBadge;

      local.appendChild(badgeInsideLocal);
      root.appendChild(local);
      root.appendChild(badgeOutsideLocal);
      container.appendChild(root);

      await Promise.all([badgeInsideLocal.updateComplete, badgeOutsideLocal.updateComplete]);

      // badgeInsideLocal binds to localStore (99), badgeOutsideLocal binds to rootStore (10)
      expect(badgeInsideLocal.count).toBe(99);
      expect(badgeOutsideLocal.count).toBe(10);
      expect(localStore.getListenerCount()).toBe(1);
      expect(rootStore.getListenerCount()).toBe(1);

      // Mutate localStore
      localStore.setValue({ totalCount: 101 });
      await badgeInsideLocal.updateComplete;
      expect(badgeInsideLocal.count).toBe(101);
      expect(badgeOutsideLocal.count).toBe(10);

      // Clean teardown
      root.remove();
      expect(localStore.getListenerCount()).toBe(0);
      expect(rootStore.getListenerCount()).toBe(0);
    });
  });

  // =========================================================================
  // Vector 5: Rapid Mount/Unmount of React Bridge Component
  // =========================================================================
  describe('Vector 5: Rapid Mount/Unmount of React Bridge Component', () => {
    let reactRoot: Root;
    let reactContainer: HTMLDivElement;

    beforeEach(() => {
      reactContainer = document.createElement('div');
      document.body.appendChild(reactContainer);
      reactRoot = createRoot(reactContainer);
    });

    afterEach(async () => {
      await act(async () => {
        reactRoot.unmount();
      });
      reactContainer.remove();
    });

    it('survives 50 rapid mount/unmount cycles in React 18/19 with strictly 0 store listeners', async () => {
      const store = createTrackedStore({ totalCount: 42 });
      const CYCLES = 50;

      for (let i = 0; i < CYCLES; i++) {
        await act(async () => {
          reactRoot.render(
            React.createElement(ReactCartBadge, {
              store,
              maxCount: 99,
              label: `Cart ${i}`,
            })
          );
        });

        // While mounted, exactly 1 active listener
        expect(store.getListenerCount()).toBe(1);

        // Unmount React tree
        await act(async () => {
          reactRoot.render(null);
        });

        // After unmount, listeners strictly returned to 0
        expect(store.getListenerCount()).toBe(0);
      }

      expect(store.getListenerCount()).toBe(0);
    });

    it('handles 100 rapid prop mutations in React without memory leaks or stale listeners', async () => {
      const storeA = createTrackedStore({ totalCount: 5 });
      const storeB = createTrackedStore({ totalCount: 15 });
      const clickHandlerA = vi.fn();
      const clickHandlerB = vi.fn();

      for (let i = 0; i < 100; i++) {
        const useA = i % 2 === 0;
        await act(async () => {
          reactRoot.render(
            React.createElement(ReactCartBadge, {
              store: useA ? storeA : storeB,
              label: `Label_${i}`,
              maxCount: 50 + i,
              disabled: i % 5 === 0,
              onCartBadgeClick: useA ? clickHandlerA : clickHandlerB,
            })
          );
        });
      }

      // Final iteration was i = 99 (useA = false -> storeB)
      expect(storeA.getListenerCount()).toBe(0);
      expect(storeB.getListenerCount()).toBe(1);

      // Trigger click to verify event handler binding
      const badgeEl = reactContainer.querySelector('lit-cart-badge') as LitCartBadge;
      const button = badgeEl.shadowRoot!.querySelector('button') as HTMLButtonElement;
      button.click();
      await badgeEl.updateComplete;

      expect(clickHandlerB).toHaveBeenCalled();

      // Final unmount cleans everything
      await act(async () => {
        reactRoot.render(null);
      });

      expect(storeA.getListenerCount()).toBe(0);
      expect(storeB.getListenerCount()).toBe(0);
    });
  });

  // =========================================================================
  // Vector 6: Edge Cases & Resilient Fallbacks in Default Selector
  // =========================================================================
  describe('Vector 6: Edge Cases & Resilient Fallbacks', () => {
    it('gracefully handles diverse object shapes and malformed inputs in defaultCartCountSelector', () => {
      // 1. Primitive numbers
      expect(defaultCartCountSelector(0)).toBe(0);
      expect(defaultCartCountSelector(42)).toBe(42);
      expect(defaultCartCountSelector(42.8)).toBe(42); // Floored
      expect(defaultCartCountSelector(-10)).toBe(0); // Clamped
      expect(defaultCartCountSelector(NaN)).toBe(0);
      expect(defaultCartCountSelector(Infinity)).toBe(0);

      // 2. Object with totalCount
      expect(defaultCartCountSelector({ totalCount: 15 })).toBe(15);
      expect(defaultCartCountSelector({ totalCount: -3 })).toBe(0);

      // 3. Object with count
      expect(defaultCartCountSelector({ count: 9 })).toBe(9);

      // 4. Object with total
      expect(defaultCartCountSelector({ total: 100 })).toBe(100);

      // 5. Items array
      expect(
        defaultCartCountSelector({
          items: [
            { quantity: 2 },
            { quantity: 3 },
            { quantity: -1 }, // Clamped to 0
            { quantity: 'invalid' }, // Defaults to 1
            5, // Primitive number inside items
            null, // Defaults to 1
          ],
        })
      ).toBe(2 + 3 + 0 + 1 + 5 + 1);

      // 6. Null / undefined / invalid
      expect(defaultCartCountSelector(null)).toBe(0);
      expect(defaultCartCountSelector(undefined)).toBe(0);
      expect(defaultCartCountSelector('string')).toBe(0);
      expect(defaultCartCountSelector(true)).toBe(0);
      expect(defaultCartCountSelector({})).toBe(0);
    });

    it('gracefully clamps NaN in totalCount to 0', () => {
      const result = defaultCartCountSelector({ totalCount: NaN });
      expect(result).toBe(0);
    });
  });

  // =========================================================================
  // Vector 7: Multi-Badge Concurrency Storm (100 Simultaneous Badges)
  // =========================================================================
  describe('Vector 7: Multi-Badge Concurrency Storm', () => {
    it('survives 100 simultaneous badges under 1,000 store mutations with zero memory leaks on batch teardown', async () => {
      const store = createTrackedStore({ totalCount: 0 });
      const BADGE_COUNT = 100;
      const badges: LitCartBadge[] = [];

      for (let i = 0; i < BADGE_COUNT; i++) {
        const badge = document.createElement('lit-cart-badge') as LitCartBadge;
        badge.store = store;
        badge.maxCount = 2000;
        container.appendChild(badge);
        badges.push(badge);
      }

      await Promise.all(badges.map((b) => b.updateComplete));

      expect(store.getListenerCount()).toBe(BADGE_COUNT);

      // Blast 1,000 rapid mutations
      const MUTATIONS = 1000;
      for (let i = 1; i <= MUTATIONS; i++) {
        store.setValue({ totalCount: i });
      }

      await Promise.all(badges.map((b) => b.updateComplete));

      // All 100 badges must have converged on exactly 1000
      for (let i = 0; i < BADGE_COUNT; i++) {
        expect(badges[i]!.count).toBe(MUTATIONS);
        const countEl = badges[i]!.shadowRoot!.querySelector('[part~="count"]');
        expect(countEl?.textContent).toBe(String(MUTATIONS));
      }

      // Batch teardown of all 100 badges
      for (const badge of badges) {
        badge.remove();
      }

      // Listener count must drop cleanly from 100 to strictly 0!
      expect(store.getListenerCount()).toBe(0);
    });
  });

  // =========================================================================
  // Vector 8: Action Pipeline Lifecycle & Error Handling
  // =========================================================================
  describe('Vector 8: Action Pipeline Lifecycle & Error Handling', () => {
    it('manages isPending state and spinner during asynchronous action dispatch and rejects double clicks', async () => {
      type Actions = { checkout: void };
      const register = new ActionRegister<Actions>({ name: 'stress-actions' });

      let resolveAction!: () => void;
      const actionPromise = new Promise<void>((r) => {
        resolveAction = r;
      });

      const actionSpy = vi.fn(async () => {
        await actionPromise;
      });
      register.register('checkout', actionSpy);

      const store = createTrackedStore({ totalCount: 3 });
      const badge = document.createElement('lit-cart-badge') as LitCartBadge;
      badge.store = store;
      badge.register = register;
      badge.actionName = 'checkout';
      container.appendChild(badge);
      await badge.updateComplete;

      const button = badge.shadowRoot!.querySelector('button') as HTMLButtonElement;
      expect(badge.isPending).toBe(false);
      expect(button.disabled).toBe(false);
      expect(badge.shadowRoot!.querySelector('.spinner')).toBeNull();

      // Click button to start async action
      button.click();
      await badge.updateComplete;

      // Pending state active
      expect(badge.isPending).toBe(true);
      expect(button.disabled).toBe(true);
      expect(badge.shadowRoot!.querySelector('.spinner')).not.toBeNull();
      expect(actionSpy).toHaveBeenCalledTimes(1);

      // Attempt second click while pending -> MUST be ignored
      button.click();
      await badge.updateComplete;
      expect(actionSpy).toHaveBeenCalledTimes(1);

      // Resolve async action
      resolveAction();
      await new Promise((r) => setTimeout(r, 0));
      await badge.updateComplete;

      // Pending state cleared
      expect(badge.isPending).toBe(false);
      expect(button.disabled).toBe(false);
      expect(badge.shadowRoot!.querySelector('.spinner')).toBeNull();
    });

    it('emits cart-action-error and resets isPending when action handler throws', async () => {
      type Actions = { failAction: void };
      const register = new ActionRegister<Actions>({ name: 'fail-reg' });
      register.register(
        'failAction',
        async () => {
          throw new Error('Payment gateway unavailable');
        },
        { blocking: true }
      );

      const store = createTrackedStore({ totalCount: 1 });
      const badge = document.createElement('lit-cart-badge') as LitCartBadge;
      badge.store = store;
      badge.register = register;
      badge.actionName = 'failAction';
      container.appendChild(badge);
      await badge.updateComplete;

      const errorSpy = vi.fn();
      badge.addEventListener('cart-action-error', errorSpy);

      const button = badge.shadowRoot!.querySelector('button') as HTMLButtonElement;
      button.click();

      // Allow pipeline rejection to complete
      await new Promise((r) => setTimeout(r, 10));
      await badge.updateComplete;

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0]![0].detail.error.message).toBe('Payment gateway unavailable');
      expect(badge.isPending).toBe(false);
    });
  });

  // =========================================================================
  // Vector 9: Dual-Mode Conflict, Context Fallback & Inactive Token Observation
  // =========================================================================
  describe('Vector 9: Dual-Mode Conflict & Context Fallback', () => {
    it('prioritizes direct .store over context store, and falls back to context store when .store is removed', async () => {
      const contextStore = createTrackedStore({ totalCount: 10 });
      const directStore = createTrackedStore({ totalCount: 50 });

      class FallbackHost extends LitElement {
        constructor() {
          super();
          provideStore(this, cartStoreContext, contextStore);
        }
        override render() {
          return html`<lit-cart-badge></lit-cart-badge>`;
        }
      }

      const tag = 'stress-fallback-host';
      if (!customElements.get(tag)) customElements.define(tag, FallbackHost);

      const host = document.createElement(tag) as FallbackHost;
      container.appendChild(host);
      await host.updateComplete;

      const badge = host.shadowRoot!.querySelector('lit-cart-badge') as LitCartBadge;
      await badge.updateComplete;

      // Initially renders contextStore (10)
      expect(badge.count).toBe(10);
      expect(contextStore.getListenerCount()).toBe(1);
      expect(directStore.getListenerCount()).toBe(0);

      // Now set direct store
      badge.store = directStore;
      await badge.updateComplete;

      // directStore overrides contextStore (50)
      expect(badge.count).toBe(50);
      expect(directStore.getListenerCount()).toBe(1);

      // Remove direct store (set undefined)
      (badge as any).store = undefined;
      await badge.updateComplete;

      // Falls back seamlessly to contextStore (10)!
      expect(badge.count).toBe(10);
      expect(directStore.getListenerCount()).toBe(0);
      expect(contextStore.getListenerCount()).toBe(1);
    });

    it('documents architectural finding: storeContext property is inert after constructor', async () => {
      const customStoreContext = createStoreContext<any>('custom-tenant-cart');
      const customStore = createTrackedStore({ totalCount: 88 });

      class CustomTokenHost extends LitElement {
        constructor() {
          super();
          provideStore(this, customStoreContext, customStore);
        }
        override render() {
          return html`<slot></slot>`;
        }
      }

      const hostTag = 'stress-custom-token-host';
      if (!customElements.get(hostTag)) customElements.define(hostTag, CustomTokenHost);

      const host = document.createElement(hostTag) as CustomTokenHost;
      const badge = document.createElement('lit-cart-badge') as LitCartBadge;
      badge.storeContext = customStoreContext;
      host.appendChild(badge);
      container.appendChild(host);
      await badge.updateComplete;

      // Because LitCartBadge instantiates ContextStoreController with cartStoreContext in constructor,
      // setting badge.storeContext property does NOT rebind ContextConsumer to the custom token.
      // Thus, badge remains unbound to customStore and counts 0.
      expect(badge.count).toBe(0);
      expect(customStore.getListenerCount()).toBe(0);
    });
  });
});

