import { createTimeTravelStore, StoreTransactionCoordinator } from '@context-action/react';
import type { TransactionBatchControl } from '@context-action/react/backend';

function fixture(name: string) {
  const store = createTimeTravelStore(name, { value: 0 });
  let active = true;
  const calls: string[] = [];
  const check = (operation: string) => {
    if (!active) throw new Error('Scoped control expired');
    calls.push(operation);
  };
  const control: TransactionBatchControl = {
    beginBatch: (meta, options) => { check('begin'); store.beginBatch(meta, options); },
    endBatch: () => { check('end'); store.endBatch(); },
    cancelBatch: () => { check('cancel'); store.cancelBatch(); },
    resumeNotifications: () => { check('resume'); store.resumeNotifications(); },
    flushNotifications: () => { check('flush'); store.flushNotifications(); },
  };
  return { store, control, calls, expire: () => { active = false; } };
}

describe('public transaction lifecycle authority separate from Store identity', () => {
  it('uses optional controls only for the open handle, then undoes/redoes through real stores', async () => {
    const first = fixture('first');
    const second = fixture('second');
    const coordinator = new StoreTransactionCoordinator();
    const observed: number[][] = [];
    first.store.subscribe(() => observed.push([first.store.getValue().value, second.store.getValue().value]));
    try {
      await coordinator.run([
        { name: 'first', store: first.store, batchControl: first.control },
        { name: 'second', store: second.store, batchControl: second.control },
      ], async () => {
        first.store.setValue({ value: 1 });
        await Promise.resolve();
        second.store.setValue({ value: 2 });
      });
      expect(first.calls).toEqual(['begin', 'end', 'resume', 'flush']);
      expect(second.calls).toEqual(['begin', 'end', 'resume', 'flush']);
      expect(observed).toEqual([[1, 2]]);
      first.expire(); second.expire();
      expect(() => coordinator.undo()).not.toThrow();
      expect(observed[observed.length - 1]).toEqual([0, 0]);
      expect(() => coordinator.redo()).not.toThrow();
      expect(observed[observed.length - 1]).toEqual([1, 2]);
      expect(first.calls).toEqual(['begin', 'end', 'resume', 'flush']);
      expect(coordinator.getHistory()[0]?.participants).toEqual([
        { name: 'first', before: 0, after: 1 }, { name: 'second', before: 0, after: 1 },
      ]);
    } finally { first.store.dispose(); second.store.dispose(); }
  });

  it('routes rollback cleanup through the admitted controller', async () => {
    const item = fixture('rollback');
    const coordinator = new StoreTransactionCoordinator();
    const error = new Error('callback failed');
    try {
      await expect(coordinator.run([{ name: 'item', store: item.store, batchControl: item.control }], () => {
        item.store.setValue({ value: 9 });
        throw error;
      })).rejects.toBe(error);
      expect(item.calls).toEqual(['begin', 'cancel', 'resume', 'flush']);
      expect(item.store.getValue().value).toBe(0);
      expect(coordinator.getHistory()).toEqual([]);
      item.store.setValue({ value: 3 });
      expect(item.store.getValue().value).toBe(3);
    } finally { item.store.dispose(); }
  });

  it('keeps duplicate/conflict checks bound to real stores, not distinct controller objects', () => {
    const item = fixture('identity');
    const coordinator = new StoreTransactionCoordinator();
    const competing = new StoreTransactionCoordinator();
    try {
      expect(() => coordinator.begin([
        { name: 'item', store: item.store, batchControl: item.control },
        { name: 'alias', store: item.store, batchControl: { ...item.control } },
      ])).toThrow(/more than once/);
      const handle = coordinator.begin([{ name: 'item', store: item.store, batchControl: item.control }]);
      expect(() => competing.begin([{ name: 'other', store: item.store, batchControl: { ...item.control } }])).toThrow(/active transaction/);
      handle.rollback();
    } finally { item.store.dispose(); }
  });

  it('captures the admitted participant fields rather than following later replacements', () => {
    const original = fixture('original');
    const replacement = fixture('replacement');
    const coordinator = new StoreTransactionCoordinator();
    const participant = { name: 'item', store: original.store, batchControl: original.control };
    try {
      const handle = coordinator.begin([participant]);
      participant.store = replacement.store;
      participant.batchControl = replacement.control;
      original.store.setValue({ value: 1 });
      handle.commit();
      expect(original.calls).toEqual(['begin', 'end', 'resume', 'flush']);
      expect(replacement.calls).toEqual([]);
      coordinator.undo();
      expect(original.store.getValue().value).toBe(0);
      expect(replacement.store.getValue().value).toBe(0);
    } finally { original.store.dispose(); replacement.store.dispose(); }
  });

  it('cleans all started controls after admission failure even when one cleanup reports an error', () => {
    const first = fixture('first');
    const second = fixture('second');
    const third = createTimeTravelStore('admission-identity', { value: 0 });
    const rejected = new Error('begin rejected');
    const coordinator = new StoreTransactionCoordinator();
    const cancel = second.control.cancelBatch;
    second.control.cancelBatch = () => { cancel(); throw new Error('cleanup observer failure'); };
    const failing: TransactionBatchControl = {
      ...second.control,
      beginBatch: () => { throw rejected; },
    };
    try {
      expect(() => coordinator.begin([
        { name: 'first', store: first.store, batchControl: first.control },
        { name: 'second', store: second.store, batchControl: second.control },
        { name: 'failing', store: third, batchControl: failing },
      ])).toThrow(rejected);
      expect(first.calls).toEqual(['begin', 'cancel', 'resume', 'flush']);
      expect(second.calls).toEqual(['begin', 'cancel', 'resume', 'flush']);
      first.store.setValue({ value: 1 });
      second.store.setValue({ value: 2 });
      expect(first.store.getValue().value).toBe(1);
      expect(second.store.getValue().value).toBe(2);
    } finally { first.store.dispose(); second.store.dispose(); third.dispose(); }
  });
});
