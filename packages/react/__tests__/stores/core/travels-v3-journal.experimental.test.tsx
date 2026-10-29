import { act, renderHook } from '@testing-library/react';
import { ActionRegister } from '@context-action/core';
import { bindActionTransactions, StoreTransactionCoordinator, useStorePath, useStoreValue } from '@context-action/react';
import { createBackendStore } from '@context-action/react/backend';
import { createTravelsV3JournalBackend } from '../../../../mutative/examples/travels-v3/journal-backend';
import { runIsolatedJournalTransaction } from '../../../../mutative/examples/travels-v3/isolated-transactions';
import type { ScopedJournalWriter, ScopedTransactionParticipant } from '../../../../mutative/examples/travels-v3/isolated-write-scope';

const nativeStructuredClone = globalThis.structuredClone;
beforeAll(() => {
  if (!globalThis.structuredClone) {
    globalThis.structuredClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
  }
});
afterAll(() => {
  if (nativeStructuredClone) globalThis.structuredClone = nativeStructuredClone;
  else Reflect.deleteProperty(globalThis, 'structuredClone');
});

function pair(maxHistory = 50) {
  const first = createTravelsV3JournalBackend('first', { value: 0 }, { maxHistory });
  const second = createTravelsV3JournalBackend('second', { value: 0 }, { maxHistory });
  const participants = [{ name: 'first', store: first }, { name: 'second', store: second }];
  const coordinator = new StoreTransactionCoordinator();
  const values = () => [first.getSnapshot().value.value, second.getSnapshot().value.value];
  const dispose = () => { first.dispose(); second.dispose(); };
  return { first, second, participants, coordinator, values, dispose };
}

describe('upstream journal through existing Context-Action coordination', () => {
  it('publishes async multi-store commit, undo and redo only after every snapshot is ready', async () => {
    const setup = pair();
    const { first, second, participants, coordinator, values } = setup;
    const observations: number[][] = [];
    first.subscribe(() => observations.push(values()));
    second.subscribe(() => observations.push(values()));
    try {
      await coordinator.run(participants, async () => {
        first.update(draft => { draft.value = 1; return undefined; });
        await Promise.resolve();
        second.update(draft => { draft.value = 2; return undefined; });
        expect(values()).toEqual([0, 0]);
        expect(observations).toEqual([]);
      }, { transactionId: 'journal-tx', actionId: 'action-1', label: 'paired edit' });
      expect(values()).toEqual([1, 2]);
      expect(observations).toEqual([[1, 2], [1, 2]]);
      expect(first.getHistoryLength()).toBe(2);
      expect(second.getHistoryLength()).toBe(2);
      expect(first.getLastTransitionMeta()).toMatchObject({ transactionId: 'journal-tx', actionId: 'action-1' });
      observations.length = 0;
      coordinator.undo();
      expect(observations).toEqual([[0, 0], [0, 0]]);
      expect(first.getLastTransitionMeta()).toMatchObject({ origin: 'undo', actionId: 'action-1' });
      observations.length = 0;
      coordinator.redo();
      expect(observations).toEqual([[1, 2], [1, 2]]);
    } finally { setup.dispose(); }
  });

  it('rolls back rejection without provisional events and releases overlapping coordinator locks', async () => {
    const setup = pair();
    const { first, second, participants, coordinator, values } = setup;
    const other = new StoreTransactionCoordinator();
    const observed = jest.fn();
    first.subscribe(observed); second.subscribe(observed);
    const before = [first.getHistoryEntryId(), second.getHistoryEntryId()];
    const rejected = new Error('rejected');
    try {
      await expect(coordinator.run(participants, async () => {
        first.setValue({ value: 1 }); second.setValue({ value: 2 });
        expect(() => other.begin(participants)).toThrow(/active transaction/);
        await Promise.resolve();
        throw rejected;
      })).rejects.toBe(rejected);
      expect(values()).toEqual([0, 0]);
      expect([first.getHistoryEntryId(), second.getHistoryEntryId()]).toEqual(before);
      expect(observed).not.toHaveBeenCalled();
      expect(coordinator.getHistory()).toEqual([]);
      await other.run(participants, () => first.setValue({ value: 3 }));
      expect(values()).toEqual([3, 0]);
      expect(observed).toHaveBeenCalledTimes(1);
    } finally { setup.dispose(); }
  });

  it('cancels surviving batches if a participant is disposed before commit', async () => {
    const setup = pair();
    const { first, second, participants, coordinator } = setup;
    const observed = jest.fn(); first.subscribe(observed);
    try {
      await expect(coordinator.run(participants, async () => {
        first.setValue({ value: 1 }); second.setValue({ value: 2 });
        await Promise.resolve();
        second.dispose();
      })).rejects.toThrow(/disposed/);
      expect(first.getSnapshot().value.value).toBe(0);
      expect(observed).not.toHaveBeenCalled();
      first.setValue({ value: 3 });
      expect(first.getSnapshot().value.value).toBe(3);
      expect(observed).toHaveBeenCalledTimes(1);
    } finally { setup.dispose(); }
  });

  it('rejects external history conflicts before moving any participant', async () => {
    const setup = pair();
    const { first, second, participants, coordinator } = setup;
    try {
      await coordinator.run(participants, () => { first.setValue({ value: 1 }); second.setValue({ value: 2 }); });
      first.setValue({ value: 3 });
      const before = second.getSnapshot();
      expect(() => coordinator.undo()).toThrow(/conflict/);
      expect(first.getSnapshot().value.value).toBe(3);
      expect(second.getSnapshot()).toBe(before);
    } finally { setup.dispose(); }
  });

  it('detects expired retained targets after history trimming', async () => {
    const setup = pair(1);
    const { first, second, participants, coordinator } = setup;
    try {
      await coordinator.run(participants, () => { first.setValue({ value: 1 }); second.setValue({ value: 2 }); });
      expect(coordinator.canUndo()).toBe(true);
      first.setValue({ value: 3 });
      expect(coordinator.canUndo()).toBe(false);
      coordinator.undo();
      expect(second.getSnapshot().value.value).toBe(2);
    } finally { setup.dispose(); }
  });

  it('connects coordinated journals to existing value/path hooks and releases shared wrappers', async () => {
    const setup = pair();
    const firstStore = createBackendStore('first', setup.first);
    const secondStore = createBackendStore('second', setup.second);
    const { result, unmount } = renderHook(() => [
      useStoreValue(firstStore).value,
      useStorePath<{ value: number }, number>(secondStore, ['value'] as const),
    ]);
    try {
      await act(async () => {
        await setup.coordinator.run(setup.participants, async () => {
          setup.first.setValue({ value: 1 });
          await Promise.resolve();
          setup.second.setValue({ value: 2 });
        });
      });
      expect(result.current).toEqual([1, 2]);
      await act(async () => { setup.coordinator.undo(); });
      expect(result.current).toEqual([0, 0]);
      await act(async () => { setup.coordinator.redo(); });
      expect(result.current).toEqual([1, 2]);
    } finally { unmount(); firstStore.dispose(); secondStore.dispose(); }
    expect(setup.first.isDisposed()).toBe(false);
    expect(setup.second.isDisposed()).toBe(false);
    setup.dispose();
  });

  it('groups action-driven journals even when optional trace metadata is absent', async () => {
    const setup = pair();
    const register = new ActionRegister<{ save: { value: number } }>({ name: 'JournalBridge' });
    register.register('save', async payload => {
      setup.first.setValue({ value: payload.value });
      await Promise.resolve();
      setup.second.setValue({ value: payload.value * 2 });
    });
    const unbind = bindActionTransactions(register, setup.coordinator, { getParticipants: () => setup.participants });
    try {
      await register.dispatch('save', { value: 3 });
      expect(setup.coordinator.getHistory()).toHaveLength(1);
      expect(setup.first.getLastTransitionMeta()).toMatchObject({ label: 'save', actionId: expect.any(String) });
      setup.coordinator.undo();
      expect(setup.values()).toEqual([0, 0]);
    } finally { unbind(); setup.dispose(); await register.destroyAsync(); }
  });
});

describe('isolated journal coordination without participant facades', () => {
  it('infers heterogeneous writers from structural owner ports without concrete class types', async () => {
    const counter = createTravelsV3JournalBackend('counter-port', { count: 0 });
    const document = createTravelsV3JournalBackend('document-port', { title: 'Draft' });
    // Erase all concrete journal methods except the shared structural contract.
    const first: ScopedTransactionParticipant<{ count: number }> = counter;
    const second: ScopedTransactionParticipant<{ title: string }> = document;
    const coordinator = new StoreTransactionCoordinator();
    try {
      const result: number = await runIsolatedJournalTransaction(coordinator, { first, second }, writers => {
        writers.first.update(draft => { draft.count += 1; return undefined; });
        writers.second.setValue({ title: 'Reviewed' });
        const count: number = writers.first.getValue().count;
        const title: string = writers.second.getValue().title;
        expect(title).toBe('Reviewed');
        if (false) {
          // @ts-expect-error Structural ports retain distinct state types.
          writers.second.setValue({ count: 3 });
          // @ts-expect-error Lifecycle authority is not writer authority.
          writers.first.beginBatch();
        }
        return count;
      });
      expect(result).toBe(1);
      coordinator.undo();
      expect(counter.getSnapshot().value.count).toBe(0);
      expect(document.getSnapshot().value.title).toBe('Draft');
    } finally { counter.dispose(); document.dispose(); }
  });

  it('blocks independent writers across await and publication while preserving atomic undo/redo on real identities', async () => {
    const setup = pair();
    const { first, second, coordinator, values } = setup;
    const backends = { first, second };
    const observations: number[][] = [];
    const admissionBlocked: boolean[] = [];
    coordinator.subscribe(event => {
      if (event.phase !== 'started') return;
      for (const operation of [() => first.setValue({ value: 99 }), second.beginBatch, first.endBatch,
        second.cancelBatch, first.resumeNotifications, second.flushNotifications, first.undo]) {
        try { operation(); admissionBlocked.push(false); }
        catch { admissionBlocked.push(true); }
      }
    });
    let isolatedPublication = true;
    let saved!: ScopedJournalWriter<{ value: number }>;
    let resume!: () => void;
    const waiting = new Promise<void>(resolve => { resume = resolve; });
    first.subscribe(() => {
      observations.push(values());
      if (isolatedPublication) {
        expect(() => second.setValue({ value: 99 })).toThrow(/isolated/);
        expect(() => saved.setValue({ value: 99 })).toThrow(/expired/);
      }
    });
    second.subscribe(() => observations.push(values()));
    const pending = runIsolatedJournalTransaction(coordinator, backends, async (writers, meta) => {
      expect(Object.isFrozen(writers)).toBe(true);
      expect(meta.label).toBe('isolated pair');
      saved = writers.first;
      writers.first.setValue({ value: 1 });
      expect(writers.first.getValue().value).toBe(1);
      expect(first.getSnapshot().value.value).toBe(0);
      await waiting;
      writers.second.setValue({ value: 2 });
      return 'committed';
    }, { label: 'isolated pair' });
    try {
      expect(() => first.setValue({ value: 8 })).toThrow(/isolated/);
      const updater = jest.fn();
      expect(() => second.update(updater)).toThrow(/isolated/);
      expect(updater).not.toHaveBeenCalled();
      const competing = new StoreTransactionCoordinator();
      const callback = jest.fn();
      await expect(runIsolatedJournalTransaction(competing, backends, callback)).rejects.toThrow(/isolated/);
      expect(callback).not.toHaveBeenCalled();
      expect(values()).toEqual([0, 0]);
      resume();
      expect(await pending).toBe('committed');
      isolatedPublication = false;
      expect(admissionBlocked).toEqual(Array(7).fill(true));
      expect(observations).toEqual([[1, 2], [1, 2]]);
      expect(() => saved.setValue({ value: 9 })).toThrow(/expired/);
      observations.length = 0;
      coordinator.undo();
      expect(values()).toEqual([0, 0]);
      expect(observations).toEqual([[0, 0], [0, 0]]);
      observations.length = 0;
      coordinator.redo();
      expect(observations).toEqual([[1, 2], [1, 2]]);
      first.setValue({ value: 3 });
      expect(() => coordinator.undo()).toThrow(/conflict/);
      expect(second.getSnapshot().value.value).toBe(2);
    } finally { resume(); await pending; setup.dispose(); }
  });

  it('rolls back rejection, expires leaked writers and releases both coordinator and writer locks', async () => {
    const setup = pair();
    const { first, second, coordinator, values } = setup;
    let leaked!: ScopedJournalWriter<{ value: number }>;
    const error = new Error('isolated callback failed');
    const observed = jest.fn(); first.subscribe(observed); second.subscribe(observed);
    try {
      await expect(runIsolatedJournalTransaction(coordinator, { first, second }, async writers => {
        leaked = writers.first;
        writers.first.setValue({ value: 1 });
        await Promise.resolve();
        writers.second.setValue({ value: 2 });
        throw error;
      })).rejects.toBe(error);
      expect(values()).toEqual([0, 0]);
      expect(observed).not.toHaveBeenCalled();
      expect(() => leaked.setValue({ value: 9 })).toThrow(/expired/);
      await runIsolatedJournalTransaction(coordinator, { first, second }, writers => {
        writers.first.setValue({ value: 3 }); writers.second.setValue({ value: 4 });
      });
      expect(values()).toEqual([3, 4]);
    } finally { setup.dispose(); }
  });

  it('cleans partial acquisition without discarding a pre-existing outer batch', async () => {
    const setup = pair();
    const { first, second, coordinator, values } = setup;
    const callback = jest.fn();
    try {
      second.beginBatch();
      second.setValue({ value: 7 });
      await expect(runIsolatedJournalTransaction(coordinator, { first, second }, callback)).rejects.toThrow(/fresh quiescent/);
      expect(callback).not.toHaveBeenCalled();
      expect(values()).toEqual([0, 0]);
      second.endBatch();
      expect(second.getSnapshot().value.value).toBe(7);
      first.setValue({ value: 3 });
      expect(first.getSnapshot().value.value).toBe(3);
      await runIsolatedJournalTransaction(coordinator, { first, second }, writers => writers.first.setValue({ value: 4 }));
      expect(values()).toEqual([4, 7]);
    } finally { setup.dispose(); }
  });

  it('rolls back survivors after disposal and prevents late scoped writes from escaping', async () => {
    const setup = pair();
    const { first, second, coordinator, values } = setup;
    let resume!: () => void;
    const waiting = new Promise<void>(resolve => { resume = resolve; });
    let late!: ScopedJournalWriter<{ value: number }>;
    const updater = jest.fn();
    const pending = runIsolatedJournalTransaction(coordinator, { first, second }, async writers => {
      writers.first.setValue({ value: 1 });
      late = writers.second;
      await waiting;
      writers.second.update(updater);
    });
    second.dispose(); resume();
    try {
      await expect(pending).rejects.toThrow(/expired/);
      expect(updater).not.toHaveBeenCalled();
      expect(values()).toEqual([0, 0]);
      expect(() => late.setValue({ value: 9 })).toThrow(/expired/);
      await runIsolatedJournalTransaction(coordinator, { first }, writers => writers.first.setValue({ value: 3 }));
      expect(first.getSnapshot().value.value).toBe(3);
    } finally { setup.dispose(); }
  });

  it('retains state inference for heterogeneous backends and rejects duplicate participant identities', async () => {
    const first = createTravelsV3JournalBackend('counter', { count: 0 });
    const second = createTravelsV3JournalBackend('document', { title: 'initial' });
    const coordinator = new StoreTransactionCoordinator();
    try {
      await runIsolatedJournalTransaction(coordinator, { first, second }, writers => {
        writers.first.update(draft => { draft.count += 1; return undefined; });
        writers.second.update(draft => { draft.title = 'updated'; return undefined; });
        const count: number = writers.first.getValue().count;
        const title: string = writers.second.getValue().title;
        expect([count, title]).toEqual([1, 'updated']);
        if (false) {
          // @ts-expect-error Heterogeneous state types remain distinct.
          writers.first.setValue({ title: 'wrong backend' });
        }
      });
      expect(first.getSnapshot().value.count).toBe(1);
      expect(second.getSnapshot().value.title).toBe('updated');
      const callback = jest.fn();
      await expect(runIsolatedJournalTransaction(coordinator, { first, alias: first }, callback)).rejects.toThrow(/more than once/);
      expect(callback).not.toHaveBeenCalled();
      coordinator.undo();
      expect(first.getSnapshot().value.count).toBe(0);
      expect(second.getSnapshot().value.title).toBe('initial');
    } finally { first.dispose(); second.dispose(); }
  });

  it('releases reservations when begin rejects metadata before a callback runs', async () => {
    const setup = pair();
    const callback = jest.fn();
    try {
      await expect(runIsolatedJournalTransaction(setup.coordinator, { first: setup.first, second: setup.second }, callback,
        { label: undefined })).rejects.toThrow(/UNDEFINED/);
      expect(callback).not.toHaveBeenCalled();
      setup.first.setValue({ value: 1 }); setup.second.setValue({ value: 2 });
      expect(setup.values()).toEqual([1, 2]);
      await runIsolatedJournalTransaction(setup.coordinator, { first: setup.first, second: setup.second }, writers => {
        writers.first.setValue({ value: 3 }); writers.second.setValue({ value: 4 });
      });
      expect(setup.values()).toEqual([3, 4]);
    } finally { setup.dispose(); }
  });

  it('reports both operation and rollback errors without retaining writer authority', async () => {
    const setup = pair();
    const primary = new Error('commit observer failed');
    const secondary = new Error('rollback observer failed');
    const coordinator = {
      begin: (...args: Parameters<StoreTransactionCoordinator['begin']>) => {
        const handle = setup.coordinator.begin(...args);
        return {
          meta: handle.meta,
          commit: () => { handle.commit(); throw primary; },
          rollback: () => { handle.rollback(); throw secondary; },
        };
      },
    };
    try {
      await expect(runIsolatedJournalTransaction(coordinator, { first: setup.first, second: setup.second }, writers => {
        writers.first.setValue({ value: 1 }); writers.second.setValue({ value: 2 });
      })).rejects.toMatchObject({ name: 'IsolatedJournalRollbackError', errors: [primary, secondary] });
      // An arbitrary failure after a real commit is not distributed rollback.
      expect(setup.values()).toEqual([1, 2]);
      setup.first.setValue({ value: 3 }); setup.second.setValue({ value: 4 });
      expect(setup.values()).toEqual([3, 4]);
    } finally { setup.dispose(); }
  });
});
