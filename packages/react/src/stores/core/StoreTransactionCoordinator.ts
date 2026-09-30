// biome-ignore-all lint/suspicious/noExplicitAny: transaction participants are heterogeneous store types.
import type { TimeTravelStore } from './TimeTravelStore';

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

type StoredStoreTransactionRecord = StoreTransactionRecord & {
  readonly participants: readonly {
    readonly name: string;
    readonly store: TimeTravelStore<any>;
    readonly before: number;
    readonly after: number;
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
    for (const listener of this.listeners) listener({ phase, record: snapshot });
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
    const unique = [...new Map(participants.map(participant => [participant.name, participant])).values()];
    if (unique.length === 0) throw new Error('A transaction requires at least one participant');
    if (unique.some(participant => participant.store.isStoreDisposed())) {
      throw new Error('A transaction cannot include a disposed store');
    }
    const before = unique.map(participant => ({
      ...participant,
      position: participant.store.getPosition(),
    }));
    unique.forEach(participant => participant.store.beginBatch(meta, { deferNotification: true }));
    this.emit('started', { meta, participants: before.map(({ name, position }) => ({ name, before: position, after: position })) });
    let closed = false;
    const closeBatches = () => {
      for (const participant of [...unique].reverse()) participant.store.endBatch();
      for (const participant of unique) participant.store.resumeNotifications();
      for (const participant of unique) participant.store.flushNotifications();
    };
    return {
      meta,
      commit: () => {
        if (closed) return;
        closed = true;
        closeBatches();
        const record = {
          meta,
          participants: before.map(participant => ({
            name: participant.name,
            store: participant.store,
            before: participant.position,
            after: participant.store.getPosition(),
          })),
        };
        if (record.participants.some(participant => participant.before !== participant.after)) {
          this.history = this.history.slice(0, this.position);
          this.history.push(record);
          this.position += 1;
          this.emit('committed', record);
        }
      },
      rollback: () => {
        if (closed) return;
        closed = true;
        closeBatches();
        for (const participant of [...before].reverse()) {
          const current = participant.store.getPosition();
          if (current !== participant.position) participant.store.goTo(participant.position);
        }
        this.emit('rolled_back', { meta, participants: before.map(({ name, position }) => ({ name, before: position, after: position })) });
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

  canUndo(): boolean { return this.position > 0; }
  canRedo(): boolean { return this.position < this.history.length; }
  getPosition(): number { return this.position; }
  getHistory(): readonly StoreTransactionRecord[] { return this.history.map(record => this.snapshot(record)); }

  undo(): void {
    if (!this.canUndo()) return;
    const record = this.history[this.position - 1]!;
    this.assertAtPositions(record, 'after');
    for (const participant of [...record.participants].reverse()) {
      participant.store.goTo(participant.before);
    }
    this.position -= 1;
    this.emit('undone', record);
  }

  redo(): void {
    if (!this.canRedo()) return;
    const record = this.history[this.position]!;
    this.assertAtPositions(record, 'before');
    for (const participant of record.participants) {
      participant.store.goTo(participant.after);
    }
    this.position += 1;
    this.emit('redone', record);
  }

  private assertAtPositions(record: StoredStoreTransactionRecord, side: 'before' | 'after'): void {
    for (const participant of record.participants) {
      const expected = participant[side];
      if (participant.store.getPosition() !== expected) {
        throw new Error(`Transaction ${record.meta.id} conflicts with external history on store "${participant.name}"`);
      }
    }
  }
}
