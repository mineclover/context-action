// biome-ignore-all lint/suspicious/noExplicitAny: transaction participants are heterogeneous store types.
import type { TimeTravelTransitionMeta } from '@context-action/mutative';
import { ErrorHandlers } from '../utils/error-handling';
import type { TimeTravelStore } from './TimeTravelStore';

const activeTransactionStores = new WeakSet<TimeTravelStore<any>>();

export interface StoreTransactionMeta {
  readonly id: string;
  readonly transactionId?: string;
  readonly label?: string;
  readonly actionId?: string;
  readonly origin?: 'user' | 'system' | 'network' | 'undo' | 'redo' | 'reset';
}

export interface StoreTransactionParticipant<T = unknown> {
  readonly name: string;
  readonly store: TimeTravelStore<T>;
}

export interface StoreTransactionRecord {
  readonly meta: StoreTransactionMeta;
  readonly participants: readonly {
    readonly name: string;
    readonly before: number;
    readonly after: number;
  }[];
}

export type StoreTransactionEventPhase = 'started' | 'committed' | 'rolled_back' | 'undone' | 'redone';

export interface StoreTransactionEvent {
  readonly phase: StoreTransactionEventPhase;
  readonly record: StoreTransactionRecord;
}

export type StoreTransactionListener = (event: StoreTransactionEvent) => void;

export interface StoreTransactionInspectorSnapshot {
  readonly version: number;
  readonly position: number;
  readonly historyLength: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly latest?: StoreTransactionRecord;
}

export interface StoreTransactionInspectorSink {
  write(snapshot: StoreTransactionInspectorSnapshot): void;
}

type StoredStoreTransactionRecord = Omit<StoreTransactionRecord, 'participants'> & {
  readonly participants: readonly {
    readonly name: string;
    readonly store: TimeTravelStore<any>;
    readonly before: number;
    readonly after: number;
    readonly beforeEntryId: number;
    readonly afterEntryId: number;
    readonly changed: boolean;
  }[];
};

export interface StoreTransactionHandle {
  readonly meta: StoreTransactionMeta;
  commit(): void;
  rollback(): void;
}

/**
 * Groups updates across multiple TimeTravelStores into one history entry per
 * participant. The participant list is explicit so a transaction cannot
 * accidentally capture unrelated global stores.
 */
export class StoreTransactionCoordinator {
  private sequence = 0;
  private position = 0;
  private history: StoredStoreTransactionRecord[] = [];
  private readonly activeStores = new Set<TimeTravelStore<any>>();
  private readonly listeners = new Set<StoreTransactionListener>();
  private inspectorVersion = 0;
  private inspectorSnapshot: StoreTransactionInspectorSnapshot = {
    version: 0,
    position: 0,
    historyLength: 0,
    canUndo: false,
    canRedo: false,
  };

  subscribe(listener: StoreTransactionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  serializeHistory(): string {
    return JSON.stringify(this.getHistory());
  }

  getInspectorSnapshot(): StoreTransactionInspectorSnapshot {
    return this.inspectorSnapshot;
  }

  /** Connect a serializable snapshot stream to DevTools, logs, or a protocol adapter. */
  bindInspector(sink: StoreTransactionInspectorSink): () => void {
    try {
      sink.write(this.getInspectorSnapshot());
    } catch (error) {
      this.reportListenerError(error);
    }
    return this.subscribe(() => {
      try {
        sink.write(this.getInspectorSnapshot());
      } catch (error) {
        this.reportListenerError(error);
      }
    });
  }

  private reportListenerError(error: unknown): void {
    // Observation cannot change transaction outcome, even when the configured
    // reporting hook also throws.
    try {
      ErrorHandlers.store('Transaction listener error', undefined, error instanceof Error ? error : undefined);
    } catch {}
  }

  private emit(phase: StoreTransactionEventPhase, record: StoreTransactionRecord): void {
    const snapshot = this.snapshot(record);
    this.inspectorVersion += 1;
    const latest = this.history[this.history.length - 1];
    this.inspectorSnapshot = {
      version: this.inspectorVersion,
      position: this.position,
      historyLength: this.history.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      ...(latest && { latest: this.snapshot(latest) }),
    };
    for (const listener of this.listeners) {
      try {
        listener({ phase, record: snapshot });
      } catch (error) {
        this.reportListenerError(error);
      }
    }
  }

  private snapshot(record: StoreTransactionRecord): StoreTransactionRecord {
    return {
      meta: { ...record.meta },
      participants: record.participants.map(({ name, before, after }) => ({ name, before, after })),
    };
  }

  begin(
    participants: readonly StoreTransactionParticipant<any>[],
    options: Omit<StoreTransactionMeta, 'id'> = {},
  ): StoreTransactionHandle {
    const id = `tx_${++this.sequence}`;
    const meta: StoreTransactionMeta = { ...options, id };
    const unique = [...participants];
    if (unique.length === 0) throw new Error('A transaction requires at least one participant');
    const participantNames = new Set<string>();
    const participantStores = new Set<TimeTravelStore<any>>();
    for (const participant of unique) {
      if (participantNames.has(participant.name)) {
        throw new Error(`Duplicate transaction participant name "${participant.name}"`);
      }
      if (participantStores.has(participant.store)) {
        throw new Error(`Store "${participant.store.name}" is registered more than once in the transaction`);
      }
      participantNames.add(participant.name);
      participantStores.add(participant.store);
      if (this.activeStores.has(participant.store) || activeTransactionStores.has(participant.store)) {
        throw new Error(`Store "${participant.store.name}" already participates in an active transaction`);
      }
    }
    if (unique.some(participant => participant.store.isStoreDisposed())) {
      throw new Error('A transaction cannot include a disposed store');
    }
    const before = unique.map(participant => ({
      ...participant,
      position: participant.store.getPosition(),
      beforeEntryId: participant.store.getHistoryEntryId(),
    }));
    const started: typeof unique = [];
    try {
      for (const participant of unique) {
        participant.store.beginBatch(meta, { deferNotification: true });
        started.push(participant);
      }
    } catch (error) {
      for (const participant of [...started].reverse()) participant.store.cancelBatch();
      for (const participant of started) {
        participant.store.resumeNotifications();
        participant.store.flushNotifications();
      }
      throw error;
    }
    for (const participant of unique) {
      this.activeStores.add(participant.store);
      activeTransactionStores.add(participant.store);
    }
    this.emit('started', { meta, participants: before.map(({ name, position }) => ({ name, before: position, after: position })) });
    let closed = false;
    const endBatches = () => {
      for (const participant of [...unique].reverse()) participant.store.endBatch();
    };
    const cancelBatches = () => {
      for (const participant of [...unique].reverse()) {
        if (participant.store.isStoreDisposed()) continue;
        try {
          participant.store.cancelBatch();
        } catch (error) {
          this.reportListenerError(error);
        }
      }
    };
    const flushBatches = () => {
      for (const participant of unique) participant.store.resumeNotifications();
      for (const participant of unique) participant.store.flushNotifications();
    };
    return {
      meta,
      commit: () => {
        if (closed) return;
        closed = true;
        try {
          endBatches();
          flushBatches();
          const record = {
            meta,
            participants: before.map(participant => ({
                name: participant.name,
                store: participant.store,
                before: participant.position,
                after: participant.store.getPosition(),
                beforeEntryId: participant.beforeEntryId,
                afterEntryId: participant.store.getHistoryEntryId(),
                changed: participant.beforeEntryId !== participant.store.getHistoryEntryId(),
              })),
          };
          if (record.participants.some(participant => participant.changed)) {
            this.history = this.history.slice(0, this.position);
            this.history.push(record);
            this.position += 1;
            this.emit('committed', record);
          }
        } catch (error) {
          // A participant may be disposed while the callback is running. The
          // commit must fail without leaking active batches on survivors.
          cancelBatches();
          flushBatches();
          throw error;
        } finally {
          for (const participant of unique) {
            this.activeStores.delete(participant.store);
            activeTransactionStores.delete(participant.store);
          }
        }
      },
      rollback: () => {
        if (closed) return;
        closed = true;
        try {
          cancelBatches();
          flushBatches();
          this.emit('rolled_back', { meta, participants: before.map(({ name, position }) => ({ name, before: position, after: position })) });
        } finally {
          for (const participant of unique) {
            this.activeStores.delete(participant.store);
            activeTransactionStores.delete(participant.store);
          }
        }
      },
    };
  }

  async run<R>(
    participants: readonly StoreTransactionParticipant<any>[],
    callback: (meta: StoreTransactionMeta) => R | Promise<R>,
    options: Omit<StoreTransactionMeta, 'id'> = {},
  ): Promise<R> {
    const handle = this.begin(participants, options);
    try {
      const result = await callback(handle.meta);
      handle.commit();
      return result;
    } catch (error) {
      handle.rollback();
      throw error;
    }
  }

  canUndo(): boolean {
    return this.position > 0 && this.canMoveRecord(this.history[this.position - 1]!, 'undo');
  }
  canRedo(): boolean {
    return this.position < this.history.length && this.canMoveRecord(this.history[this.position]!, 'redo');
  }
  getPosition(): number { return this.position; }
  getHistory(): readonly StoreTransactionRecord[] { return this.history.map(record => this.snapshot(record)); }

  undo(): void {
    if (!this.canUndo()) return;
    const record = this.history[this.position - 1]!;
    this.assertAtPositions(record, 'after');
    this.applyPositions(record, 'undo');
    this.position -= 1;
    this.emit('undone', record);
  }

  redo(): void {
    if (!this.canRedo()) return;
    const record = this.history[this.position]!;
    this.assertAtPositions(record, 'before');
    this.applyPositions(record, 'redo');
    this.position += 1;
    this.emit('redone', record);
  }

  private applyPositions(
    record: StoredStoreTransactionRecord,
    origin: 'undo' | 'redo',
  ): void {
    const participants = record.participants.map(({ store }) => store);
    const metadata: TimeTravelTransitionMeta = { ...record.meta, origin };
    const started: TimeTravelStore<any>[] = [];
    try {
      for (const store of participants) {
        store.beginBatch(metadata, { deferNotification: true });
        started.push(store);
      }
    } catch (error) {
      for (const store of [...started].reverse()) store.cancelBatch();
      for (const store of started) {
        store.resumeNotifications();
        store.flushNotifications();
      }
      throw error;
    }
    let applied = false;
    try {
      for (const participant of participants) {
        const participantRecord = record.participants.find(({ store }) => store === participant)!;
        if (!participantRecord.changed) continue;
        if (origin === 'undo' ? !participant.canUndo() : !participant.canRedo()) {
          throw new Error(`Transaction ${record.meta.id} cannot ${origin} retained history on store "${participant.name}"`);
        }
        const targetEntryId = origin === 'undo' ? participantRecord.beforeEntryId : participantRecord.afterEntryId;
        if (!participant.hasHistoryEntry(targetEntryId)) {
          throw new Error(`Transaction ${record.meta.id} cannot ${origin} retained history on store "${participant.name}"`);
        }
        participant.goToHistoryEntry(targetEntryId, metadata);
      }
      applied = true;
    } finally {
      for (const store of [...participants].reverse()) {
        if (applied) store.endBatch();
        else store.cancelBatch();
      }
      for (const store of participants) {
        store.resumeNotifications();
        store.flushNotifications();
      }
    }
  }

  private assertAtPositions(record: StoredStoreTransactionRecord, side: 'before' | 'after'): void {
    for (const participant of record.participants) {
      const expectedEntryId = participant[`${side}EntryId`];
      if (participant.store.isStoreDisposed() || participant.store.getHistoryEntryId() !== expectedEntryId) {
        throw new Error(`Transaction ${record.meta.id} conflicts with external history on store "${participant.name}"`);
      }
    }
  }

  private canMoveRecord(record: StoredStoreTransactionRecord, direction: 'undo' | 'redo'): boolean {
    return record.participants.every(participant =>
      !participant.changed
      || (!participant.store.isStoreDisposed()
        && participant.store.hasHistoryEntry(direction === 'undo' ? participant.beforeEntryId : participant.afterEntryId))
    );
  }
}
