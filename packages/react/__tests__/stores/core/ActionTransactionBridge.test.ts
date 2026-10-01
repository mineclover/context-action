import { ActionRegister } from '@context-action/core';
import { bindActionTransactions } from '../../../src/stores/core/ActionTransactionBridge';
import { StoreTransactionCoordinator } from '../../../src/stores/core/StoreTransactionCoordinator';
import { createTimeTravelStore } from '../../../src/stores/core/TimeTravelStore';

describe('bindActionTransactions', () => {
  it('groups store commits made by an action and rolls them back through the coordinator', async () => {
    const register = new ActionRegister<{ save: { value: number } }>({ name: 'BridgeTest' });
    const first = createTimeTravelStore('first', { value: 0 });
    const second = createTimeTravelStore('second', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();
    register.register('save', payload => {
      first.update(draft => { draft.value = payload.value; });
      second.update(draft => { draft.value = payload.value * 2; });
    });
    const unbind = bindActionTransactions(register, coordinator, {
      getParticipants: () => [
        { name: 'first', store: first },
        { name: 'second', store: second },
      ],
    });

    await register.dispatch('save', { value: 3 }, { trace: { origin: 'user', label: 'Save' } });
    expect(first.getHistory()).toHaveLength(2);
    expect(second.getHistory()).toHaveLength(2);
    expect(coordinator.getHistory()[0]?.meta.label).toBe('Save');

    coordinator.undo();
    expect(first.getValue()).toEqual({ value: 0 });
    expect(second.getValue()).toEqual({ value: 0 });

    unbind();
    first.dispose();
    second.dispose();
    await register.destroyAsync();
  });

  it('commits state when an action completes with non-blocking handler errors', async () => {
    const register = new ActionRegister<{ save: { value: number } }>({ name: 'BridgePartialTest' });
    const store = createTimeTravelStore('partial', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();
    register.register('save', payload => {
      store.update(draft => { draft.value = payload.value; });
      throw new Error('best effort failure');
    }, { blocking: false });
    const unbind = bindActionTransactions(register, coordinator, {
      getParticipants: () => [{ name: 'partial', store }],
    });

    await register.dispatch('save', { value: 4 });

    expect(store.getValue()).toEqual({ value: 4 });
    expect(coordinator.canUndo()).toBe(true);

    unbind();
    store.dispose();
    await register.destroyAsync();
  });
});
