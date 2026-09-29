import { describe, expect, it } from 'vitest';
import { connectSourceSignal } from '../src/index.js';
import type { ReadableSource } from '../src/index.js';

function source(initial = 0) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => value,
    subscribe(notify: () => void) {
      listeners.add(notify);
      return () => { listeners.delete(notify); };
    },
    set(next: number) { value = next; for (const listener of listeners) listener(); },
    get size() { return listeners.size; },
  };
}

describe('read-only source connection', () => {
  it('tracks snapshots, disposes once, and does not destroy its borrowed source', () => {
    const store = source(1);
    const a = connectSourceSignal(store);
    const b = connectSourceSignal(store);
    expect(a.signal.value).toBe(1);
    store.set(2);
    expect(a.signal.value).toBe(2);
    a.dispose(); a.dispose();
    store.set(3);
    expect(a.disposed).toBe(true);
    expect(a.signal.value).toBe(2);
    expect(b.signal.value).toBe(3);
    expect(store.size).toBe(1);
    b.dispose();
    expect(store.size).toBe(0);
  });

  it('re-reads after subscribing so an initialization gap is not lost', () => {
    let value = 1;
    const store: ReadableSource<number> = {
      getSnapshot: () => value,
      subscribe() { value = 2; return () => {}; },
    };
    const connection = connectSourceSignal(store);
    expect(connection.signal.value).toBe(2);
    connection.dispose();
  });

  it('ignores late notifications after disposal', () => {
    let value = 1;
    let notify = () => {};
    let unsubscribes = 0;
    const connection = connectSourceSignal({
      getSnapshot: () => value,
      subscribe(listener) { notify = listener; return () => { unsubscribes++; }; },
    });
    connection.dispose(); connection.dispose();
    value = 5; notify();
    expect(connection.signal.value).toBe(1);
    expect(unsubscribes).toBe(1);
  });

  it('unsubscribes if the post-subscribe snapshot read fails', () => {
    let reads = 0;
    let disposed = false;
    expect(() => connectSourceSignal({
      getSnapshot() { if (++reads > 1) throw new Error('snapshot'); return 1; },
      subscribe() { return () => { disposed = true; }; },
    })).toThrow('snapshot');
    expect(disposed).toBe(true);
  });
});
