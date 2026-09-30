import { StoreTransactionCoordinator } from '../../../src/stores/core/StoreTransactionCoordinator';
import { createTimeTravelStore } from '../../../src/stores/core/TimeTravelStore';

describe('StoreTransactionCoordinator', () => {
  it('groups updates for explicit participants into one history entry each', async () => {
    const first = createTimeTravelStore('first', { value: 0 });
    const second = createTimeTravelStore('second', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();

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
    first.undo();
    second.undo();
    expect(first.getValue()).toEqual({ value: 0 });
    expect(second.getValue()).toEqual({ value: 0 });
    first.dispose();
    second.dispose();
  });
});
