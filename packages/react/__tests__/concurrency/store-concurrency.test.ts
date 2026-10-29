/**
 * Store concurrency and listener lifecycle contracts.
 *
 * These tests deliberately avoid wall-clock delays and random scheduling. The
 * store contract is about serialized updates and safe listener mutation while
 * notifying, so the assertions exercise those properties directly.
 */

import { Store, createStore } from '../../src/stores/core/Store';

describe('Store concurrency contracts', () => {
  let store: Store<{ counter: number; data: string[] }>;

  beforeEach(() => {
    store = createStore('test-store', { counter: 0, data: [] as string[] });
  });

  afterEach(() => {
    store.dispose();
  });

  test('delivers the final snapshot for rapid batched setValue calls', async () => {
    const receivedValues: number[] = [];
    const unsubscribe = store.subscribe(() => {
      receivedValues.push(store.getSnapshot().value.counter);
    });

    const updates = Array.from({ length: 100 }, (_, index) => index + 1);
    updates.forEach(counter => {
      store.setValue({ counter, data: [] });
    });
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

    expect(receivedValues).toEqual([100]);
    expect(store.getValue().counter).toBe(100);
    unsubscribe();
  });

  test('serializes concurrent update calls without lost increments', async () => {
    const updateResults: number[] = [];
    const updatePromises = Array.from({ length: 20 }, () => Promise.resolve().then(() => {
      store.update(current => {
        const nextCounter = current.counter + 1;
        updateResults.push(nextCounter);
        return { ...current, counter: nextCounter };
      });
    }));

    await Promise.all(updatePromises);

    expect(store.getValue().counter).toBe(20);
    expect(new Set(updateResults).size).toBe(20);
    expect([...updateResults].sort((left, right) => left - right)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
  });

  test('supports unsubscribe during notification and leaves no listeners after cleanup', async () => {
    const notificationCounts = Array.from({ length: 30 }, () => 0);
    const subscriptionIssues: Error[] = [];
    const unsubscribers: Array<() => void> = [];

    for (let index = 0; index < notificationCounts.length; index += 1) {
      let unsubscribe!: () => void;
      unsubscribe = store.subscribe(() => {
        const nextCount = (notificationCounts[index] ?? 0) + 1;
        notificationCounts[index] = nextCount;
        if (index % 2 === 0 && nextCount === 1) {
          unsubscribe();
        }
      });
      unsubscribers.push(() => {
        try {
          unsubscribe();
        } catch (error) {
          subscriptionIssues.push(error instanceof Error ? error : new Error(String(error)));
        }
      });
    }

    expect(store.getListenerCount()).toBe(30);

    for (let counter = 1; counter <= 10; counter += 1) {
      store.setValue({ counter, data: [`item-${counter}`] });
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }

    expect(notificationCounts.filter((_, index) => index % 2 === 0).every(count => count === 1)).toBe(true);
    expect(notificationCounts.filter((_, index) => index % 2 === 1).every(count => count === 10)).toBe(true);
    expect(store.getListenerCount()).toBe(15);

    unsubscribers.forEach(unsubscribe => unsubscribe());
    expect(subscriptionIssues).toEqual([]);
    expect(store.getListenerCount()).toBe(0);
  });
});
