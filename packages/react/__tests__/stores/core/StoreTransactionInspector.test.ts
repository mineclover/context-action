import { createTimeTravelStore } from '../../../src/stores/core/TimeTravelStore';
import { StoreTransactionCoordinator } from '../../../src/stores/core/StoreTransactionCoordinator';

describe('StoreTransactionInspector sink', () => {
  it('streams serializable snapshots without Store references', async () => {
    const store = createTimeTravelStore('sink', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();
    const snapshots: unknown[] = [];
    const unbind = coordinator.bindInspector({ write: snapshot => snapshots.push(snapshot) });

    await coordinator.run([{ name: 'sink', store }], () => {
      store.update(draft => { draft.value = 1; });
    }, { label: 'sink update' });

    expect(snapshots.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(snapshots)).not.toContain('TimeTravelStore');
    expect((snapshots[snapshots.length - 1] as { latest?: unknown }).latest).toBeDefined();
    unbind();
    store.dispose();
  });
});
