import { ActionRegister } from '@context-action/core';
import {
  bindActionTransactions,
  createTimeTravelStore,
  StoreTransactionCoordinator,
  type StoreTransactionMeta,
} from '@context-action/react';

describe('public action transaction metadata for durable backends', () => {
  it.each([false, true])('omits absent optional fields and preserves explicit trace metadata: %s', async withTrace => {
    const register = new ActionRegister<{ save: number }>({ name: 'MetadataContract' });
    const store = createTimeTravelStore('metadata', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();
    const received: StoreTransactionMeta[] = [];
    const begin = store.beginBatch;
    store.beginBatch = (metadata, options) => {
      // A strict external owner should not have to strip undefined object fields
      // emitted by our own bridge before accepting durable JSON metadata.
      expect(Object.values(metadata ?? {}).every(value => value !== undefined)).toBe(true);
      begin.call(store, metadata, options);
    };
    const unbind = bindActionTransactions(register, coordinator, {
      getParticipants: () => [{ name: 'metadata', store }],
    });
    coordinator.subscribe(event => {
      if (event.phase === 'started') received.push(event.record.meta);
    });
    register.register('save', value => { store.setValue({ value }); });
    try {
      await register.dispatch('save', 3, withTrace ? {
        trace: { transactionId: 'explicit-tx', origin: 'user', label: 'Save document' },
      } : undefined);
      expect(coordinator.getHistory()).toHaveLength(1);
      expect(received[0]).toMatchObject({ actionId: expect.any(String), label: withTrace ? 'Save document' : 'save' });
      if (withTrace) {
        expect(received[0]).toMatchObject({ transactionId: 'explicit-tx', origin: 'user' });
      } else {
        expect(received[0]).not.toHaveProperty('transactionId');
        expect(received[0]).not.toHaveProperty('origin');
      }
      coordinator.undo();
      expect(store.getValue().value).toBe(0);
    } finally { unbind(); store.dispose(); await register.destroyAsync(); }
  });
});
