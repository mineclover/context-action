import type { TransactionCoordinatorPort, TransactionMeta, TransactionOptions, TransactionParticipantBackend } from '@context-action/store-core';
import type { JournalScopeControl, ScopedJournalWriter, ScopedTransactionParticipant } from './isolated-write-scope';

/** Compatibility names; the authoritative coordination protocol lives in store-core. */
export type JournalTransactionMeta = TransactionMeta;
export type JournalTransactionCoordinator = TransactionCoordinatorPort;

export type ScopedJournalWriters<Backends extends Record<string, TransactionParticipantBackend>> = {
  readonly [Key in keyof Backends]: ScopedJournalWriter<ReturnType<Backends[Key]['getSnapshot']>['value']>;
};

type ScopedParticipants<States extends Record<string, unknown>> = {
  readonly [Key in keyof States]: ScopedTransactionParticipant<States[Key]>;
};
type ScopedWriters<States extends Record<string, unknown>> = {
  readonly [Key in keyof States]: ScopedJournalWriter<States[Key]>;
};

/** Portable error aggregation without requiring an ES2021 AggregateError global. */
export class IsolatedJournalRollbackError extends Error {
  readonly name = 'IsolatedJournalRollbackError';
  readonly errors: readonly unknown[];
  constructor(error: unknown, rollbackError: unknown) {
    super('Isolated transaction and rollback failed');
    this.errors = Object.freeze([error, rollbackError]);
  }
}

/**
 * Coordinate the REAL backend identities (not disposable facade participants),
 * with scoped controls. Writers are locked BEFORE begin/started observers run.
 */
export async function runIsolatedJournalTransaction<States extends Record<string, unknown>, Result>(
  coordinator: TransactionCoordinatorPort,
  backends: ScopedParticipants<States>,
  callback: (writers: ScopedWriters<States>, meta: TransactionMeta) => Result | Promise<Result>,
  options: TransactionOptions = {},
): Promise<Result> {
  const keys = Object.keys(backends) as Array<keyof States & string>;
  const entries = keys.map(name => [name, backends[name]] as const);
  if (new Set(entries.map(([, store]) => store)).size !== entries.length) {
    throw new Error('A journal backend is registered more than once in the transaction');
  }
  const scopes: JournalScopeControl[] = [];
  let handle: ReturnType<TransactionCoordinatorPort['begin']> | undefined;
  try {
    const acquired = entries.map(([name, store]) => {
      const scope = store.reserveIsolatedWriter();
      scopes.push(scope);
      return { name, store, scope };
    });
    handle = coordinator.begin(acquired.map(({ name, store, scope }) => ({ name, store, batchControl: scope.batchControl })), options);
    // Entries were acquired from exactly the named participants. fromEntries also
    // keeps '__proto__' as an own data property instead of changing a prototype.
    const record = Object.freeze(Object.fromEntries(acquired.map(({ name, scope }) => [name, scope.writer]))) as ScopedWriters<States>;
    const result = await callback(record, handle.meta);
    for (const scope of scopes) scope.seal();
    handle.commit();
    return result;
  } catch (error) {
    for (const scope of scopes) scope.seal();
    try { handle?.rollback(); }
    catch (rollbackError) { throw new IsolatedJournalRollbackError(error, rollbackError); }
    throw error;
  } finally {
    for (const scope of scopes.reverse()) scope.release();
  }
}
