import type { StateWriter, TransactionBatchControl, TransactionParticipantBackend } from '@context-action/store-core';

/** Explicit authority to read staged state and write one isolated operation. */
export interface ScopedJournalWriter<T> extends StateWriter<T> {
  readonly name: string;
  /** Borrowed immutable staged state, not a React/public committed snapshot. */
  getValue(): T;
  getSafeValue(): T;
}

export interface JournalScopeControl {
  seal(): void;
  release(): void;
}

export interface JournalWriteScope<T> extends JournalScopeControl {
  readonly writer: ScopedJournalWriter<T>;
  readonly batchControl: TransactionBatchControl;
}

/** A structural owner port; no concrete journal class or draft engine required. */
export interface ScopedTransactionParticipant<T> extends TransactionParticipantBackend<T> {
  reserveIsolatedWriter(): JournalWriteScope<T>;
}

interface ActiveScope {
  readonly token: symbol;
  sealed: boolean;
}

/** No ambient async context: every authorized write carries its own token. */
export class IsolatedWriteGate {
  private active: ActiveScope | undefined;
  private disposed = false;

  assertWrite(token?: symbol): void {
    if (token !== undefined) {
      if (this.disposed || this.active?.token !== token || this.active.sealed) {
        throw new Error('Journal writer scope has expired');
      }
    } else if (this.active) {
      throw new Error('Journal is owned by an isolated writer scope');
    }
  }

  assertControl(token?: symbol): void {
    if (token !== undefined) {
      if (this.disposed || this.active?.token !== token) throw new Error('Journal writer scope has expired');
    } else if (this.active) {
      throw new Error('Journal lifecycle is owned by an isolated writer scope');
    }
  }

  acquire(): JournalScopeControl & { readonly token: symbol } {
    if (this.disposed) throw new Error('Journal is disposed');
    this.assertControl();
    const scope: ActiveScope = { token: Symbol('journal-writer'), sealed: false };
    this.active = scope;
    return {
      token: scope.token,
      seal: () => { scope.sealed = true; },
      release: () => { if (this.active === scope) this.active = undefined; },
    };
  }

  dispose(): void {
    this.disposed = true;
    this.active = undefined;
  }
}
