import { describe, expect, it } from 'vitest';
import { connectSourceSignal, fromStateReader } from '../src/index.js';
import type { ReadableSource, SnapshotStateReader } from '../src/index.js';

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

  it('adapts snapshot-envelope StateReader stores via fromStateReader without destroying source', () => {
    let version = 1;
    let state = { count: 10, label: 'init' };
    const listeners = new Set<() => void>();
    const stateReader: SnapshotStateReader<typeof state> & {
      readonly name: string;
      getSnapshot(): { readonly value: typeof state; readonly name: string; readonly version: number; readonly lastUpdate: number };
      set(next: typeof state): void;
      get size(): number;
    } = {
      name: 'counter',
      getSnapshot: () => ({ value: state, name: 'counter', version, lastUpdate: version * 100 }),
      subscribe(notify) {
        listeners.add(notify);
        return () => { listeners.delete(notify); };
      },
      set(next) {
        version += 1;
        state = next;
        for (const listener of listeners) listener();
      },
      get size() { return listeners.size; },
    };

    const connection = connectSourceSignal(fromStateReader(stateReader));
    expect(connection.signal.value).toEqual({ count: 10, label: 'init' });

    stateReader.set({ count: 11, label: 'updated' });
    expect(connection.signal.value).toEqual({ count: 11, label: 'updated' });

    connection.dispose();
    connection.dispose();
    expect(connection.disposed).toBe(true);
    expect(stateReader.size).toBe(0);

    stateReader.set({ count: 12, label: 'after-dispose' });
    expect(connection.signal.value).toEqual({ count: 11, label: 'updated' });
  });

  it('unwraps exactly one snapshot envelope level when domain state contains a value property', () => {
    let state = { value: 'inner-domain-value' };
    const listeners = new Set<() => void>();
    const reader: SnapshotStateReader<{ value: string }> = {
      getSnapshot: () => ({ value: state }),
      subscribe(notify) {
        listeners.add(notify);
        return () => { listeners.delete(notify); };
      },
    };

    const connection = connectSourceSignal(fromStateReader(reader));
    expect(connection.signal.value).toEqual({ value: 'inner-domain-value' });

    state = { value: 'next-domain-value' };
    for (const listener of listeners) listener();
    expect(connection.signal.value).toEqual({ value: 'next-domain-value' });
    connection.dispose();
  });
});
