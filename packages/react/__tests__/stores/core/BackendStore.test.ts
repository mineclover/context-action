import { createBackendStore } from '../../../src/stores/core/BackendStore';

function createReferenceBackend<T>(_name: string, initialValue: T) {
  let value = initialValue;
  let version = 0;
  let snapshot = { value, name: _name, version, lastUpdate: Date.now() };
  const listeners = new Set<() => void>();
  const publish = (next: T) => {
    value = next;
    version += 1;
    snapshot = { value, name: _name, version, lastUpdate: Date.now() };
    listeners.forEach(listener => listener());
  };
  return {
    name: _name,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setValue: (next: T) => publish(next),
    update: (updater: (current: T) => T | undefined) => {
      const next = updater(value);
      if (next !== undefined) publish(next);
    },
  };
}

describe('BackendStore', () => {
  it('binds a user-owned non-immutable backend without Mutative', () => {
    const backend = createReferenceBackend('reference', { count: 0 });
    const store = createBackendStore('reference', backend);
    const listener = jest.fn();
    store.subscribe(listener);

    store.setValue({ count: 1 });
    store.update(current => ({ count: current.count + 1 }));

    expect(store.getValue()).toEqual({ count: 2 });
    expect(store.getSnapshot().version).toBe(2);
    expect(listener).toHaveBeenCalledTimes(2);
    store.dispose();
  });
});
