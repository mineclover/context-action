import { StoreTransactionCoordinator } from '../../../src/stores/core/StoreTransactionCoordinator';
import { createTimeTravelStore } from '../../../src/stores/core/TimeTravelStore';

describe('StoreTransactionCoordinator history identity', () => {
  it.each([false, true])('preserves unchanged participants (prehistory: %s)', async hasPrehistory => {
    const changed = createTimeTravelStore('changed', { value: 0 });
    const unchanged = createTimeTravelStore('unchanged', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();
    if (hasPrehistory) unchanged.setValue({ value: 99 });
    const unchangedPosition = unchanged.getPosition();
    const unchangedHistory = unchanged.getHistory().map(value => ({ ...value }));

    await coordinator.run([
      { name: 'changed', store: changed },
      { name: 'unchanged', store: unchanged },
    ], () => {
      changed.update(draft => { draft.value = 1; });
    });

    expect(coordinator.canUndo()).toBe(true);
    coordinator.undo();
    expect(changed.getValue()).toEqual({ value: 0 });
    expect(unchanged.getValue()).toEqual({ value: hasPrehistory ? 99 : 0 });
    expect(unchanged.getPosition()).toBe(unchangedPosition);
    expect(unchanged.getHistory()).toEqual(unchangedHistory);

    expect(coordinator.canRedo()).toBe(true);
    coordinator.redo();
    expect(changed.getValue()).toEqual({ value: 1 });
    expect(unchanged.getValue()).toEqual({ value: hasPrehistory ? 99 : 0 });
    expect(unchanged.getPosition()).toBe(unchangedPosition);
    expect(unchanged.getHistory()).toEqual(unchangedHistory);
    changed.dispose();
    unchanged.dispose();
  });

  it.each([1, 2])('rejects an external same-value branch with maxHistory %s', async maxHistory => {
    const store = createTimeTravelStore('external-branch', { value: 0 }, { maxHistory });
    const coordinator = new StoreTransactionCoordinator();
    await coordinator.run([{ name: 'external-branch', store }], () => {
      store.setValue({ value: 1 });
    });
    store.setValue({ value: 2 });
    store.setValue({ value: 1 });
    const beforePosition = store.getPosition();

    expect(coordinator.canUndo()).toBe(false);
    coordinator.undo();
    expect(store.getValue()).toEqual({ value: 1 });
    expect(store.getPosition()).toBe(beforePosition);
    expect(coordinator.getPosition()).toBe(1);
    store.dispose();
  });

  it('reports no retained undo when history is disabled', async () => {
    const store = createTimeTravelStore('no-history', { value: 0 }, { maxHistory: 0 });
    const coordinator = new StoreTransactionCoordinator();
    await coordinator.run([{ name: 'no-history', store }], () => {
      store.setValue({ value: 1 });
    });

    expect(coordinator.canUndo()).toBe(false);
    coordinator.undo();
    expect(store.getValue()).toEqual({ value: 1 });
    expect(store.getPosition()).toBe(0);
    store.dispose();
  });

  it('undoes and redoes retained transitions after bounded positions are reused', async () => {
    const store = createTimeTravelStore('bounded', { value: 'initial' }, { maxHistory: 2 });
    const coordinator = new StoreTransactionCoordinator();
    for (const value of ['first', 'second', 'third']) {
      await coordinator.run([{ name: 'bounded', store }], () => {
        store.setValue({ value });
      });
    }

    expect(coordinator.canUndo()).toBe(true);
    coordinator.undo();
    expect(store.getValue()).toEqual({ value: 'second' });
    expect(coordinator.canUndo()).toBe(true);
    coordinator.undo();
    expect(store.getValue()).toEqual({ value: 'first' });
    expect(coordinator.canUndo()).toBe(false);
    coordinator.undo();
    expect(store.getValue()).toEqual({ value: 'first' });

    expect(coordinator.canRedo()).toBe(true);
    coordinator.redo();
    expect(store.getValue()).toEqual({ value: 'second' });
    expect(coordinator.canRedo()).toBe(true);
    coordinator.redo();
    expect(store.getValue()).toEqual({ value: 'third' });
    expect(coordinator.canRedo()).toBe(false);
    store.dispose();
  });

  it('does not partially undo when one participant has exhausted history', async () => {
    const retained = createTimeTravelStore('retained', { value: 0 }, { maxHistory: 2 });
    const disabled = createTimeTravelStore('disabled', { value: 0 }, { maxHistory: 0 });
    const coordinator = new StoreTransactionCoordinator();
    await coordinator.run([
      { name: 'retained', store: retained },
      { name: 'disabled', store: disabled },
    ], () => {
      retained.setValue({ value: 1 });
      disabled.setValue({ value: 1 });
    });

    expect(coordinator.canUndo()).toBe(false);
    coordinator.undo();
    expect(retained.getValue()).toEqual({ value: 1 });
    expect(disabled.getValue()).toEqual({ value: 1 });
    expect(retained.getPosition()).toBe(1);
    expect(disabled.getPosition()).toBe(0);
    retained.dispose();
    disabled.dispose();
  });

  it('rejects overlapping transactions from different coordinators and releases the lock', async () => {
    const store = createTimeTravelStore('shared', { value: 0 });
    const first = new StoreTransactionCoordinator();
    const second = new StoreTransactionCoordinator();
    const transaction = first.begin([{ name: 'shared', store }]);
    store.setValue({ value: 1 });

    expect(() => second.begin([{ name: 'shared', store }])).toThrow('active transaction');
    transaction.rollback();
    expect(store.getValue()).toEqual({ value: 0 });
    await second.run([{ name: 'shared', store }], () => {
      store.setValue({ value: 2 });
    });
    expect(store.getValue()).toEqual({ value: 2 });
    expect(second.canUndo()).toBe(true);
    second.undo();
    expect(store.getValue()).toEqual({ value: 0 });
    store.dispose();
  });

  it('rolls back surviving participants and preserves the callback error after disposal', async () => {
    const surviving = createTimeTravelStore('surviving', { value: 0 });
    const disposed = createTimeTravelStore('disposed', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();
    const callbackError = new Error('callback failed');
    const observed: number[] = [];
    surviving.subscribe(() => observed.push(surviving.getValue().value));

    await expect(coordinator.run([
      { name: 'surviving', store: surviving },
      { name: 'disposed', store: disposed },
    ], () => {
      surviving.setValue({ value: 1 });
      disposed.dispose();
      throw callbackError;
    })).rejects.toBe(callbackError);

    expect(surviving.getValue()).toEqual({ value: 0 });
    expect(surviving.getPosition()).toBe(0);
    expect(surviving.getHistory()).toEqual([{ value: 0 }]);
    expect(coordinator.canUndo()).toBe(false);
    expect(observed.every(value => value === 0)).toBe(true);
    await coordinator.run([{ name: 'surviving', store: surviving }], () => {
      surviving.setValue({ value: 2 });
    });
    expect(surviving.getValue()).toEqual({ value: 2 });
    surviving.dispose();
  });

  it('rolls back surviving participants when commit finds a disposed participant', async () => {
    const surviving = createTimeTravelStore('surviving-commit', { value: 0 });
    const disposed = createTimeTravelStore('disposed-commit', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();

    await expect(coordinator.run([
      { name: 'surviving-commit', store: surviving },
      { name: 'disposed-commit', store: disposed },
    ], () => {
      surviving.setValue({ value: 1 });
      disposed.dispose();
    })).rejects.toThrow('disposed');

    expect(surviving.getValue()).toEqual({ value: 0 });
    expect(surviving.getPosition()).toBe(0);
    expect(surviving.getHistory()).toEqual([{ value: 0 }]);
    expect(coordinator.canUndo()).toBe(false);
    await coordinator.run([{ name: 'surviving-commit', store: surviving }], () => {
      surviving.setValue({ value: 2 });
    });
    expect(surviving.getValue()).toEqual({ value: 2 });
    surviving.dispose();
  });

  it('retains ordered collection transitions', async () => {
    const store = createTimeTravelStore('collection-order', { values: new Set([1, 2]) });
    const coordinator = new StoreTransactionCoordinator();
    await coordinator.run([{ name: 'collection-order', store }], () => {
      store.update(draft => {
        draft.values.delete(1);
        draft.values.add(1);
      });
    });

    expect([...store.getValue().values]).toEqual([2, 1]);
    expect(coordinator.canUndo()).toBe(true);
    coordinator.undo();
    expect([...store.getValue().values]).toEqual([1, 2]);
    expect(coordinator.canRedo()).toBe(true);
    coordinator.redo();
    expect([...store.getValue().values]).toEqual([2, 1]);
    store.dispose();
  });
});
