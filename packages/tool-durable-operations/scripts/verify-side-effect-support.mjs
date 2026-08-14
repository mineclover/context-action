import { createDurableOperationStore } from '../dist/index.js';

export function createInMemoryDurableOperationBackend() {
  const records = new Map();
  return {
    read(key) {
      return records.get(key);
    },
    list() {
      return [...records.values()];
    },
    compareAndSet(key, expectedFence, next) {
      const current = records.get(key);
      const matches = expectedFence === undefined
        ? current === undefined
        : current?.incarnation === expectedFence.incarnation &&
          current.revision === expectedFence.revision;
      if (!matches) return false;
      if (next === undefined) records.delete(key);
      else records.set(key, next);
      return true;
    },
  };
}

export function createDurableStorePair(backend) {
  const options = {
    defaultLeaseMs: 1_000,
    retentionMs: 0,
    maxAttempts: 16,
  };
  return {
    storeA: createDurableOperationStore(backend, options),
    storeB: createDurableOperationStore(backend, options),
  };
}
