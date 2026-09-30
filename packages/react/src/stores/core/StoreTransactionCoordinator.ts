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

/**
 * Groups updates across multiple TimeTravelStores into one history entry per
 * participant. The participant list is explicit so a transaction cannot
 * accidentally capture unrelated global stores.
 */
export class StoreTransactionCoordinator {
  private sequence = 0;

  async run<R>(
    participants: readonly StoreTransactionParticipant<any>[],
    callback: (meta: StoreTransactionMeta) => R | Promise<R>,
    options: Omit<StoreTransactionMeta, 'id'> = {},
  ): Promise<R> {
    const id = `tx_${++this.sequence}`;
    const meta: StoreTransactionMeta = { ...options, id };
    const unique = [...new Map(participants.map(participant => [participant.name, participant])).values()];
    const execute = () => callback(meta);
    const runAt = (index: number): R | Promise<R> => {
      if (index >= unique.length) return execute();
      return unique[index]!.store.batch(() => runAt(index + 1), meta);
    };
    return await runAt(0);
  }
}
