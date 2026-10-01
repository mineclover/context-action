import { StoreTransactionCoordinator } from '../../../src/stores/core/StoreTransactionCoordinator';
import { createTimeTravelStore } from '../../../src/stores/core/TimeTravelStore';

describe('StoreTransactionCoordinator', () => {
  it('groups updates for explicit participants into one history entry each', async () => {
    const first = createTimeTravelStore('first', { value: 0 });
    const second = createTimeTravelStore('second', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();
    const phases: string[] = [];
    const observed: Array<[number, number]> = [];
    coordinator.subscribe(event => phases.push(event.phase));
    first.subscribe(() => observed.push([first.getValue().value, second.getValue().value]));

    const result = await coordinator.run(
      [
        { name: 'first', store: first },
        { name: 'second', store: second },
      ],
      async (meta) => {
        first.update(draft => { draft.value = 1; });
        await Promise.resolve();
        second.update(draft => { draft.value = 2; });
        return meta;
      },
      { label: 'sync values', origin: 'user' },
    );

    expect(result.id).toBe('tx_1');
    expect(result.label).toBe('sync values');
    expect(first.getHistory()).toHaveLength(2);
    expect(second.getHistory()).toHaveLength(2);
    expect(first.getLastTransitionMeta()).toMatchObject({ id: 'tx_1', label: 'sync values', origin: 'user' });
    expect(second.getLastTransitionMeta()).toMatchObject({ id: 'tx_1', label: 'sync values', origin: 'user' });
    expect(observed.every(([firstValue, secondValue]) => firstValue === 1 && secondValue === 2)).toBe(true);
    expect(JSON.parse(coordinator.serializeHistory())[0].participants[0].store).toBeUndefined();
    expect(coordinator.canUndo()).toBe(true);
    coordinator.undo();
    expect(first.getValue()).toEqual({ value: 0 });
    expect(second.getValue()).toEqual({ value: 0 });
    expect(first.getLastTransitionMeta()).toMatchObject({ id: 'tx_1', origin: 'undo' });
    expect(second.getLastTransitionMeta()).toMatchObject({ id: 'tx_1', origin: 'undo' });
    expect(observed[observed.length - 1]).toEqual([0, 0]);
    expect(coordinator.canRedo()).toBe(true);
    coordinator.redo();
    expect(first.getValue()).toEqual({ value: 1 });
    expect(second.getValue()).toEqual({ value: 2 });
    expect(first.getLastTransitionMeta()).toMatchObject({ id: 'tx_1', origin: 'redo' });
    expect(second.getLastTransitionMeta()).toMatchObject({ id: 'tx_1', origin: 'redo' });
    expect(observed[observed.length - 1]).toEqual([1, 2]);
    expect(phases).toEqual(['started', 'committed', 'undone', 'redone']);
    expect(coordinator.getInspectorSnapshot()).toMatchObject({
      position: 1,
      historyLength: 1,
      canUndo: true,
      canRedo: false,
      latest: { meta: { label: 'sync values' } },
    });
    first.dispose();
    second.dispose();
  });

  it('rolls back participant histories when the transaction callback fails', async () => {
    const store = createTimeTravelStore('rollback', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();
    await expect(coordinator.run([{ name: 'rollback', store }], () => {
      store.update(draft => { draft.value = 1; });
      throw new Error('fail');
    })).rejects.toThrow('fail');
    expect(store.getValue()).toEqual({ value: 0 });
    expect(store.getHistory()).toHaveLength(1);
    expect(store.getPosition()).toBe(0);
    expect(store.getLastTransitionMeta()).toBeUndefined();
    expect(coordinator.canUndo()).toBe(false);
    store.dispose();
  });

  it('rejects duplicate participant names and Store references', () => {
    const first = createTimeTravelStore('first', { value: 0 });
    const second = createTimeTravelStore('second', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();

    expect(() => coordinator.begin([
      { name: 'duplicate', store: first },
      { name: 'duplicate', store: second },
    ])).toThrow('Duplicate transaction participant name');
    expect(() => coordinator.begin([
      { name: 'first', store: first },
      { name: 'alias', store: first },
    ])).toThrow('registered more than once');

    first.dispose();
    second.dispose();
  });

  it('isolates transaction listener and inspector sink failures', async () => {
    const store = createTimeTravelStore('observed', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    coordinator.subscribe(() => { throw new Error('listener failure'); });
    const unbindInspector = coordinator.bindInspector({
      write: () => { throw new Error('inspector failure'); },
    });

    await coordinator.run([{ name: 'observed', store }], () => {
      store.update(draft => { draft.value = 1; });
    });

    expect(store.getValue()).toEqual({ value: 1 });
    expect(coordinator.canUndo()).toBe(true);
    unbindInspector();
    errorSpy.mockRestore();
    store.dispose();
  });

  it('propagates undo and redo metadata to participant stores', async () => {
    const store = createTimeTravelStore('metadata', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();

    await coordinator.run([{ name: 'metadata', store }], () => {
      store.update(draft => { draft.value = 1; });
    }, { label: 'metadata check' });

    coordinator.undo();
    expect(store.getLastTransitionMeta()).toMatchObject({ label: 'metadata check', origin: 'undo' });
    coordinator.redo();
    expect(store.getLastTransitionMeta()).toMatchObject({ label: 'metadata check', origin: 'redo' });
    store.dispose();
  });

  it('undoes retained transitions when maxHistory reuses a position', async () => {
    const store = createTimeTravelStore('bounded', { value: 'initial' }, { maxHistory: 2 });
    const coordinator = new StoreTransactionCoordinator();

    await coordinator.run([{ name: 'bounded', store }], () => {
      store.setValue({ value: 'first' });
    });
    await coordinator.run([{ name: 'bounded', store }], () => {
      store.setValue({ value: 'second' });
    });
    await coordinator.run([{ name: 'bounded', store }], () => {
      store.setValue({ value: 'third' });
    });

    coordinator.undo();
    expect(store.getValue()).toEqual({ value: 'second' });
    coordinator.undo();
    expect(store.getValue()).toEqual({ value: 'first' });
    coordinator.redo();
    expect(store.getValue()).toEqual({ value: 'second' });
    store.dispose();
  });

  it('does not replay unchanged participants during coordinated undo', async () => {
    const first = createTimeTravelStore('first', { value: 0 });
    const second = createTimeTravelStore('second', { value: 0 });
    second.setValue({ value: 99 });
    const coordinator = new StoreTransactionCoordinator();

    await coordinator.run([{ name: 'first', store: first }], () => {
      first.setValue({ value: 1 });
    });
    coordinator.undo();

    expect(first.getValue()).toEqual({ value: 0 });
    expect(second.getValue()).toEqual({ value: 99 });
    first.dispose();
    second.dispose();
  });

  it('rejects overlapping transactions on the same coordinator', () => {
    const store = createTimeTravelStore('overlap', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();
    const handle = coordinator.begin([{ name: 'overlap', store }]);
    expect(() => coordinator.begin([{ name: 'overlap-again', store }])).toThrow('active transaction');
    handle.rollback();
    store.dispose();
  });

  it('detects external same-value history before undo', async () => {
    const store = createTimeTravelStore('external', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();
    await coordinator.run([{ name: 'external', store }], () => {
      store.setValue({ value: 1 });
    });
    store.setValue({ value: 2 });
    store.setValue({ value: 1 });

    expect(() => coordinator.undo()).toThrow('conflicts with external history');
    expect(store.getValue()).toEqual({ value: 1 });
    store.dispose();
  });

  it('reports bounded history exhaustion through canUndo', async () => {
    const store = createTimeTravelStore('exhausted', { value: 0 }, { maxHistory: 2 });
    const coordinator = new StoreTransactionCoordinator();
    for (const value of [1, 2, 3]) {
      await coordinator.run([{ name: 'exhausted', store }], () => {
        store.setValue({ value });
      });
    }

    coordinator.undo();
    coordinator.undo();
    expect(coordinator.canUndo()).toBe(false);
    expect(store.getValue()).toEqual({ value: 1 });
    store.dispose();
  });
});
