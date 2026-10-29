import { ActionRegister } from '@context-action/core';
import { bindActionTransactions, createTimeTravelStore, StoreTransactionCoordinator } from '@context-action/react';
import type { StoreReader, StoreTransactionParticipant, StoreWriter } from '@context-action/react';
import type {
  StateBackend,
  ReadonlyStateSnapshot,
  StateReader,
  StateSnapshot,
  TransactionCoordinatorPort,
  TransactionParticipantBackend,
} from '@context-action/react/backend';

function fixture() {
  const owner = createTimeTravelStore('owner', { count: 0 });
  // Deliberately no setValue/update, undo/redo, goTo/reset, or getHistory.
  const participant: TransactionParticipantBackend<{ count: number }> = {
    name: owner.name,
    getSnapshot: () => {
      const { value, name, lastUpdate } = owner.getSnapshot();
      return { value, name, lastUpdate }; // legacy snapshots need no version
    },
    subscribe: listener => owner.subscribe(listener),
    getHistoryEntryId: () => owner.getHistoryEntryId(),
    hasHistoryEntry: id => typeof id === 'number' && owner.hasHistoryEntry(id),
    canUndo: () => owner.canUndo(),
    canRedo: () => owner.canRedo(),
    getPosition: () => owner.getPosition(),
    getHistoryLength: () => owner.getHistoryLength(),
    goToHistoryEntry: (id, meta) => {
      if (typeof id !== 'number') throw new Error('Unknown retained entry');
      owner.goToHistoryEntry(id, meta);
    },
    isStoreDisposed: () => owner.isStoreDisposed(),
    beginBatch: (meta, options) => owner.beginBatch(meta, options),
    endBatch: () => owner.endBatch(),
    cancelBatch: () => owner.cancelBatch(),
    resumeNotifications: () => owner.resumeNotifications(),
    flushNotifications: () => owner.flushNotifications(),
  };
  return { owner, participant };
}

describe('minimal shared transaction participant contracts', () => {
  it('coordinates commit, rollback and retained-entry navigation without state ownership methods', async () => {
    const { owner, participant } = fixture();
    const coordinator = new StoreTransactionCoordinator();
    const port: TransactionCoordinatorPort = coordinator;
    const legacyReader: StoreReader<{ count: number }> = participant;
    try {
      expect(legacyReader.getSnapshot().version).toBeUndefined();
      const handle = port.begin([{ name: 'minimal', store: participant }], { label: 'shared port' });
      owner.setValue({ count: 1 });
      handle.commit();
      coordinator.undo();
      expect(owner.getValue().count).toBe(0);
      coordinator.redo();
      expect(owner.getValue().count).toBe(1);
      const failure = new Error('rollback');
      await expect(coordinator.run([{ name: 'minimal', store: participant }], () => {
        owner.setValue({ count: 9 });
        throw failure;
      })).rejects.toBe(failure);
      expect(owner.getValue().count).toBe(1);
      expect(coordinator.getHistory()).toHaveLength(1);
    } finally { owner.dispose(); }
  });

  it('accepts a begin-only coordinator port and minimal participants in the Action bridge', async () => {
    const { owner, participant } = fixture();
    const register = new ActionRegister<{ save: number }>({ name: 'MinimalBridge' });
    const coordinator = new StoreTransactionCoordinator();
    const port: TransactionCoordinatorPort = { begin: (participants, options) => coordinator.begin(participants, options) };
    const unbind = bindActionTransactions(register, port, {
      getParticipants: () => [{ name: 'minimal', store: participant }],
    });
    register.register('save', count => { owner.setValue({ count }); });
    try {
      await register.dispatch('save', 3);
      expect(owner.getValue().count).toBe(3);
      coordinator.undo();
      expect(owner.getValue().count).toBe(0);
    } finally { unbind(); owner.dispose(); await register.destroyAsync(); }
  });
});

// Strictly checked by test:type-check; not executed by the runtime test runner.
function compatibilityTypes(
  participant: TransactionParticipantBackend<number>,
  writer: StoreWriter<number>,
  metadata: NonNullable<Parameters<StoreWriter<number>['setValue']>[1]>,
) {
  const legacy: StoreReader<number> = participant;
  const optionalVersion: StateReader<number, StateSnapshot<number>> = legacy;
  const snapshot: StateSnapshot<number> = { value: 1, name: 'legacy', lastUpdate: 0 };
  // @ts-expect-error Strict snapshots still require a version, independently of writer capabilities.
  const strictSnapshot: ReadonlyStateSnapshot<number> = snapshot;
  writer.setValue(1, metadata); // legacy interfaces need no metadata index signature
  // @ts-expect-error Strict backend readers still require a version token.
  const strictReader: StateReader<number> = legacy;
  // @ts-expect-error Read-only participants are not state-owning backends.
  const owner: StateBackend<number> = participant;
  // @ts-expect-error Legacy convenience participant still includes undo/redo.
  const legacyParticipant: StoreTransactionParticipant<number> = { name: 'minimal', store: participant };
  void [optionalVersion, strictSnapshot, strictReader, owner, legacyParticipant];
}
void compatibilityTypes;
