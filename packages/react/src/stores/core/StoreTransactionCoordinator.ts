// biome-ignore-all lint/suspicious/noExplicitAny: transaction participants are heterogeneous store types.
import type { TimeTravelStore } from './TimeTravelStore';

export interface StoreTransactionMeta {
  readonly id: string;
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
    readonly store: TimeTravelStore<any>;
    readonly before: number;
    readonly after: number;
  }[];
}

/**
 * Groups updates across multiple TimeTravelStores into one history entry per
 * participant. The participant list is explicit so a transaction cannot
 * accidentally capture unrelated global stores.
 */
export class StoreTransactionCoordinator {
  private sequence = 0;
  private position = 0;
  private history: StoreTransactionRecord[] = [];

  async run<R>(
    participants: readonly StoreTransactionParticipant<any>[],
    callback: (meta: StoreTransactionMeta) => R | Promise<R>,
    options: Omit<StoreTransactionMeta, 'id'> = {},
  ): Promise<R> {
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
    const execute = () => callback(meta);
    const runAt = (index: number): R | Promise<R> => {
      if (index >= unique.length) return execute();
      return unique[index]!.store.batch(() => runAt(index + 1), meta);
    };
    try {
      const result = await runAt(0);
      const record: StoreTransactionRecord = {
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
      }
      return result;
    } catch (error) {
      for (const participant of [...before].reverse()) {
        const current = participant.store.getPosition();
        if (current !== participant.position) {
          participant.store.goTo(participant.position);
        }
      }
      throw error;
    }
  }

  canUndo(): boolean { return this.position > 0; }
  canRedo(): boolean { return this.position < this.history.length; }
  getPosition(): number { return this.position; }
  getHistory(): readonly StoreTransactionRecord[] { return this.history; }

  undo(): void {
    if (!this.canUndo()) return;
    const record = this.history[this.position - 1]!;
    this.assertAtPositions(record, 'after');
    for (const participant of [...record.participants].reverse()) {
      participant.store.goTo(participant.before);
    }
    this.position -= 1;
  }

  redo(): void {
    if (!this.canRedo()) return;
    const record = this.history[this.position]!;
    this.assertAtPositions(record, 'before');
    for (const participant of record.participants) {
      participant.store.goTo(participant.after);
    }
    this.position += 1;
  }

  private assertAtPositions(record: StoreTransactionRecord, side: 'before' | 'after'): void {
    for (const participant of record.participants) {
      const expected = participant[side];
      if (participant.store.getPosition() !== expected) {
        throw new Error(`Transaction ${record.meta.id} conflicts with external history on store "${participant.name}"`);
      }
    }
  }
}
