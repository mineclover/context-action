import { describe, expect, it } from 'vitest';
import { StoreController } from '../src/store-controller.js';
import { MockReactiveControllerHost, createMockStore } from './helpers.js';
import type { ReadableStore } from '../src/types.js';

describe('StoreController Adversarial & Stress Suite', () => {
  describe('1. High-Frequency Store Mutations', () => {
    it('handles 500 rapid sequential synchronous mutations with exact state synchronization', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ count: 0, marker: 'seq' });
      const controller = new StoreController(host, store);

      host.connected();
      host.resetStats();

      const iterations = 500;
      for (let i = 1; i <= iterations; i++) {
        store.setValue({ count: i, marker: 'seq' });
        expect(controller.value.count).toBe(i);
      }

      expect(host.requestUpdateCount).toBe(iterations);
      expect(controller.value).toEqual({ count: iterations, marker: 'seq' });
    });

    it('handles 500 rapid asynchronous concurrent mutations resolving out-of-order', async () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ value: 0 });
      const controller = new StoreController(host, store);

      host.connected();
      host.resetStats();

      const totalMutations = 500;
      const promises = Array.from({ length: totalMutations }, (_, idx) => {
        return new Promise<void>((resolve) => {
          // Interleave randomly across microtask / macrotask
          if (idx % 2 === 0) {
            queueMicrotask(() => {
              store.update((prev) => ({ value: Math.max(prev.value, idx + 1) }));
              resolve();
            });
          } else {
            setTimeout(() => {
              store.update((prev) => ({ value: Math.max(prev.value, idx + 1) }));
              resolve();
            }, 0);
          }
        });
      });

      await Promise.all(promises);

      // Verify eventual consistency
      expect(controller.value.value).toBe(totalMutations);
      expect(host.requestUpdateCount).toBeGreaterThan(0);
      expect(store.listenerCount).toBe(1);
    });

    it('suppresses updates on 500 high-frequency identical reference mutations (Object.is)', () => {
      const host = new MockReactiveControllerHost();
      const identicalState = { status: 'idle', count: 42 };
      const store = createMockStore(identicalState);
      const controller = new StoreController(host, store);

      host.connected();
      host.resetStats();

      for (let i = 0; i < 500; i++) {
        // Same object reference mutated repeatedly
        store.setValue(identicalState);
      }

      expect(host.requestUpdateCount).toBe(0);
      expect(controller.value).toBe(identicalState);
    });

    it('suppresses updates on 500 distinct object instances when equalityFn provides value comparison', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ status: 'idle', count: 42 });
      const controller = new StoreController(host, store, {
        equalityFn: (prev, next) => prev.status === next.status && prev.count === next.count,
      });

      host.connected();
      host.resetStats();

      for (let i = 0; i < 500; i++) {
        // Distinct object reference every time, but equal values
        store.setValue({ status: 'idle', count: 42 });
      }

      // Value-based equality suppresses all 500 updates
      expect(host.requestUpdateCount).toBe(0);
      expect(controller.value).toEqual({ status: 'idle', count: 42 });
    });
  });

  describe('2. Projection Stress Testing & Selective Isolation', () => {
    interface ComplexState {
      account: { id: string; balance: number };
      ui: { theme: 'light' | 'dark'; sidebarOpen: boolean };
      telemetry: { timestamp: number; sequence: number };
      items: string[];
    }

    it('verifies non-selected changes never trigger host.requestUpdate() across multi-controller topologies', () => {
      const host1 = new MockReactiveControllerHost();
      const host2 = new MockReactiveControllerHost();
      const host3 = new MockReactiveControllerHost();

      const initialState: ComplexState = {
        account: { id: 'acc_01', balance: 1000 },
        ui: { theme: 'light', sidebarOpen: false },
        telemetry: { timestamp: 1000000, sequence: 0 },
        items: ['apple', 'banana'],
      };

      const store = createMockStore<ComplexState>(initialState);

      // Host 1 subscribes ONLY to account.balance
      const ctrl1 = new StoreController(host1, store, {
        selector: (s) => s.account.balance,
      });

      // Host 2 subscribes ONLY to ui.theme
      const ctrl2 = new StoreController(host2, store, {
        selector: (s) => s.ui.theme,
      });

      // Host 3 subscribes ONLY to items array with custom shallow array equality
      const ctrl3 = new StoreController(host3, store, {
        selector: (s) => s.items,
        equalityFn: (prev, next) =>
          prev.length === next.length && prev.every((item, i) => item === next[i]),
      });

      host1.connected();
      host2.connected();
      host3.connected();

      host1.resetStats();
      host2.resetStats();
      host3.resetStats();

      // Stress step A: 500 rapid mutations exclusively to telemetry (ignored by all 3 controllers)
      for (let i = 1; i <= 500; i++) {
        store.update((prev) => ({
          ...prev,
          telemetry: { timestamp: 1000000 + i, sequence: i },
        }));
      }

      expect(host1.requestUpdateCount).toBe(0);
      expect(host2.requestUpdateCount).toBe(0);
      expect(host3.requestUpdateCount).toBe(0);

      // Stress step B: 500 mutations to items that do NOT change items contents (same values)
      for (let i = 1; i <= 500; i++) {
        store.update((prev) => ({
          ...prev,
          items: ['apple', 'banana'], // new array reference, identical contents
        }));
      }

      // ctrl3 should suppress all 500 updates due to equalityFn!
      expect(host3.requestUpdateCount).toBe(0);
      expect(host1.requestUpdateCount).toBe(0);
      expect(host2.requestUpdateCount).toBe(0);

      // Stress step C: 200 mutations to ui.theme toggling between light and dark
      let expectedThemeUpdates = 0;
      for (let i = 1; i <= 200; i++) {
        const nextTheme = i % 2 === 0 ? 'light' : 'dark';
        store.update((prev) => ({
          ...prev,
          ui: { ...prev.ui, theme: nextTheme },
        }));
        expectedThemeUpdates++;
      }

      expect(host2.requestUpdateCount).toBe(expectedThemeUpdates);
      expect(ctrl2.value).toBe('light'); // 200 is even -> 'light'
      expect(host1.requestUpdateCount).toBe(0); // host1 untouched
      expect(host3.requestUpdateCount).toBe(0); // host3 untouched

      // Stress step D: 100 mutations to account.balance
      for (let i = 1; i <= 100; i++) {
        store.update((prev) => ({
          ...prev,
          account: { ...prev.account, balance: 1000 + i },
        }));
      }

      expect(host1.requestUpdateCount).toBe(100);
      expect(ctrl1.value).toBe(1100);
      expect(host2.requestUpdateCount).toBe(expectedThemeUpdates); // host2 didn't receive extra
      expect(host3.requestUpdateCount).toBe(0); // host3 untouched
    });

    it('evaluates fine-grained projection with pseudo-randomized property fuzzing (1000 iterations)', () => {
      interface FuzzState {
        watched: number;
        unwatchedA: number;
        unwatchedB: string;
      }

      const host = new MockReactiveControllerHost();
      const store = createMockStore<FuzzState>({
        watched: 0,
        unwatchedA: 0,
        unwatchedB: 'init',
      });

      const controller = new StoreController(host, store, {
        selector: (s) => s.watched,
      });

      host.connected();
      host.resetStats();

      let expectedWatchedUpdates = 0;

      // Seeded-style deterministic fuzzing
      for (let i = 1; i <= 1000; i++) {
        const branch = i % 4;
        if (branch === 0) {
          // Mutate watched property
          store.update((prev) => ({ ...prev, watched: prev.watched + 1 }));
          expectedWatchedUpdates++;
        } else if (branch === 1) {
          // Mutate unwatched property A
          store.update((prev) => ({ ...prev, unwatchedA: prev.unwatchedA + 1 }));
        } else if (branch === 2) {
          // Mutate unwatched property B
          store.update((prev) => ({ ...prev, unwatchedB: `str_${i}` }));
        } else {
          // Mutate both unwatched properties simultaneously
          store.update((prev) => ({
            ...prev,
            unwatchedA: prev.unwatchedA + 2,
            unwatchedB: `combo_${i}`,
          }));
        }
      }

      expect(host.requestUpdateCount).toBe(expectedWatchedUpdates);
      expect(controller.value).toBe(expectedWatchedUpdates);
    });
  });

  describe('3. Rapid Attach/Detach Cycles & Zero Listener Leak Verification', () => {
    it('verifies zero listener leaks under 500 rapid attach/detach cycles', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ value: 1 });
      const controller = new StoreController(host, store);

      expect(store.listenerCount).toBe(1);

      for (let cycle = 1; cycle <= 500; cycle++) {
        host.connected();
        expect(store.listenerCount).toBe(1);
        expect(controller.isSubscribed).toBe(true);

        host.disconnected();
        expect(store.listenerCount).toBe(0);
        expect(controller.isSubscribed).toBe(false);
      }

      // Final post-condition
      expect(store.listenerCount).toBe(0);
    });

    it('interleaves 500 attach/detach cycles with concurrent mutations while disconnected', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ generation: 0 });
      const controller = new StoreController(host, store);

      host.resetStats();

      for (let i = 1; i <= 500; i++) {
        // Disconnect
        host.disconnected();
        expect(store.listenerCount).toBe(0);

        // Mutate multiple times while disconnected (must not leak or trigger host updates)
        store.setValue({ generation: i * 10 });
        store.setValue({ generation: i * 10 + 1 });
        store.setValue({ generation: i * 10 + 2 });

        // Connect back
        host.connected();
        expect(store.listenerCount).toBe(1);
        expect(controller.value).toEqual({ generation: i * 10 + 2 });
      }

      // Disconnect at the end
      host.disconnected();
      expect(store.listenerCount).toBe(0);
    });

    it('verifies zero leaks when 100 controllers attach and detach concurrently on separate hosts', () => {
      const store = createMockStore({ common: 'shared' });
      const hosts: MockReactiveControllerHost[] = [];
      const controllers: StoreController<{ common: string }>[] = [];

      for (let i = 0; i < 100; i++) {
        const host = new MockReactiveControllerHost();
        const controller = new StoreController(host, store);
        hosts.push(host);
        controllers.push(controller);
      }

      expect(store.listenerCount).toBe(100);

      // Disconnect all
      for (const host of hosts) {
        host.disconnected();
      }
      expect(store.listenerCount).toBe(0);

      // Reconnect all
      for (const host of hosts) {
        host.connected();
      }
      expect(store.listenerCount).toBe(100);

      // Dispose all
      for (const controller of controllers) {
        controller.dispose();
      }
      expect(store.listenerCount).toBe(0);
    });

    it('guarantees idempotency on consecutive redundant connected() or disconnected() calls', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ test: true });
      const controller = new StoreController(host, store);

      // Consecutive connected calls
      for (let i = 0; i < 10; i++) {
        host.connected();
      }
      expect(store.listenerCount).toBe(1);

      // Consecutive disconnected calls
      for (let i = 0; i < 10; i++) {
        host.disconnected();
      }
      expect(store.listenerCount).toBe(0);
    });
  });

  describe('4. Edge Case Hardening & Adversarial Invariants', () => {
    it('handles NaN projection equality safely without triggering infinite loops or spurious updates', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ num: NaN });
      const controller = new StoreController(host, store, {
        selector: (s) => s.num,
      });

      host.connected();
      host.resetStats();

      // Mutate to another NaN value (Object.is(NaN, NaN) === true)
      store.setValue({ num: Number('invalid_number') });
      expect(host.requestUpdateCount).toBe(0); // Suppressed by Object.is!

      // Mutate to actual number
      store.setValue({ num: 42 });
      expect(host.requestUpdateCount).toBe(1);
      expect(controller.value).toBe(42);
    });

    it('handles selector returning undefined, null, symbol, and bigint primitives', () => {
      const sym = Symbol('token');
      const host = new MockReactiveControllerHost();
      const store = createMockStore<{
        u: undefined;
        n: null;
        s: symbol;
        b: bigint;
      }>({
        u: undefined,
        n: null,
        s: sym,
        b: 100n,
      });

      const ctrlNull = new StoreController(host, store, { selector: (s) => s.n });
      const ctrlSym = new StoreController(host, store, { selector: (s) => s.s });
      const ctrlBig = new StoreController(host, store, { selector: (s) => s.b });

      host.connected();
      host.resetStats();

      expect(ctrlNull.value).toBe(null);
      expect(ctrlSym.value).toBe(sym);
      expect(ctrlBig.value).toBe(100n);

      store.setValue({
        u: undefined,
        n: null,
        s: sym,
        b: 200n,
      });

      // Only bigint changed
      expect(ctrlBig.value).toBe(200n);
    });

    it('guarantees clean unsubscription and leak-freedom if selector throws during subscribe() #refresh()', () => {
      const host = new MockReactiveControllerHost();
      const store = createMockStore({ fail: false });

      let shouldFail = false;
      const failingSelector = (state: { fail: boolean }) => {
        if (shouldFail) {
          throw new Error('Adversarial selector crash');
        }
        return state.fail;
      };

      const controller = new StoreController(host, store, {
        selector: failingSelector,
      });

      host.connected();
      expect(store.listenerCount).toBe(1);

      // Now disconnect
      host.disconnected();
      expect(store.listenerCount).toBe(0);

      // Enable failure on next selector invocation
      shouldFail = true;

      // When reconnecting, #refresh() will throw.
      // StoreController catch block must cleanly unsubscribe, preventing orphaned listeners!
      expect(() => {
        host.connected();
      }).toThrow('Adversarial selector crash');

      expect(store.listenerCount).toBe(0); // Zero leak guarantee maintained even on crash!
    });

    it('closes race gap if store mutates synchronously during store.subscribe() invocation', () => {
      let subscriberCallback: (() => void) | null = null;
      let storeValue = 'initial';

      const raceStore: ReadableStore<string> = {
        getValue() {
          return storeValue;
        },
        subscribe(callback) {
          subscriberCallback = callback;
          // Synchronous race mutation: state changes right before subscribe returns
          storeValue = 'mutated_during_subscribe';
          return () => {
            subscriberCallback = null;
          };
        },
      };

      const host = new MockReactiveControllerHost();
      const controller = new StoreController(host, raceStore);

      // StoreController constructor subscribes and executes try { this.#refresh(true); }
      // It must have detected 'mutated_during_subscribe'!
      expect(controller.value).toBe('mutated_during_subscribe');
      expect(host.requestUpdateCount).toBe(1); // Notified host about race-gap change!
    });

    it('survives re-entrant mutations where a host or listener triggers a store update during requestUpdate', () => {
      const store = createMockStore({ tick: 0 });
      let reentrancyStep = 0;

      class ReentrantHost extends MockReactiveControllerHost {
        override requestUpdate(): void {
          super.requestUpdate();
          // Simulate an element triggering up to 5 cascaded store updates upon receiving requestUpdate
          if (reentrancyStep < 5) {
            reentrancyStep++;
            store.setValue({ tick: reentrancyStep });
          }
        }
      }

      const host = new ReentrantHost();
      const controller = new StoreController(host, store);

      host.connected();
      host.resetStats();

      // Trigger initial change
      store.setValue({ tick: 1 });

      // Controller must reach tick: 5 cleanly without stack overflow or corrupted state
      expect(controller.value.tick).toBe(5);
      // Initial update triggered reentrancyStep 1..5 sequentially
      expect(host.requestUpdateCount).toBeGreaterThanOrEqual(5);
    });
  });
});
