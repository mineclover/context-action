import type { StateMutationMeta } from '@context-action/store-core';
import type { JsonValue } from 'travels';
import type { OwnedTransition } from './owned-json';

export interface PendingJournalTransition<T> extends OwnedTransition<T> {
  readonly navigation?: number;
  readonly metadata?: StateMutationMeta;
}

/** Savepoints contain staged state/deltas, not copies of the retained history. */
export class JournalBatches<T extends JsonValue> {
  private readonly frames: Array<{ before: PendingJournalTransition<T> | undefined }> = [];
  private pending: PendingJournalTransition<T> | undefined;

  get active(): boolean { return this.frames.length > 0; }
  get outermost(): boolean { return this.frames.length === 1; }
  get current(): PendingJournalTransition<T> | undefined { return this.pending; }

  begin(state: T, metadata?: StateMutationMeta): void {
    this.frames.push({ before: this.pending });
    this.pending ??= { state, patches: [], inversePatches: [], metadata };
  }

  assertCanWrite(): void {
    if (this.pending?.navigation !== undefined) throw new Error('Cannot mix navigation and writes inside a journal batch');
  }

  stage(transition: OwnedTransition<T>): void {
    this.assertCanWrite();
    if (!this.pending) throw new Error('Journal batch is not active');
    this.pending = {
      ...this.pending,
      state: transition.state,
      patches: [...this.pending.patches, ...transition.patches],
      inversePatches: [...transition.inversePatches, ...this.pending.inversePatches],
    };
  }

  navigate(position: number, metadata?: StateMutationMeta): void {
    if (!this.pending) throw new Error('Journal batch is not active');
    if (this.pending.patches.length > 0) throw new Error('Cannot mix writes and navigation inside a journal batch');
    this.pending = { ...this.pending, navigation: position, metadata: this.pending.metadata ?? metadata };
  }

  complete(): void {
    if (!this.active) throw new Error('Journal batch is not active');
    this.frames.pop();
    if (!this.active) this.pending = undefined;
  }

  cancel(): void {
    if (!this.active) throw new Error('Journal batch is not active');
    this.pending = this.frames.pop()!.before;
  }

  clear(): void {
    this.frames.length = 0;
    this.pending = undefined;
  }
}
