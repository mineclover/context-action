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
    expect(observed[observed.length - 1]).toEqual([0, 0]);
    expect(coordinator.canRedo()).toBe(true);
    coordinator.redo();
    expect(first.getValue()).toEqual({ value: 1 });
    expect(second.getValue()).toEqual({ value: 2 });
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
    expect(coordinator.canUndo()).toBe(false);
    store.dispose();
  });
});
