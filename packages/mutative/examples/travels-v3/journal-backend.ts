/** Workspace-only external-state owner + upstream controlled history journal. */
import type {
  HistoryEntryId,
  ReadonlyStateSnapshot,
  StateMutationMeta,
  TransactionBackend,
} from '@context-action/store-core';
import {
  createTravelJournal,
  restoreTravelJournal,
  Travels,
  type JsonValue,
  type TravelJournal,
  type TravelsEvent,
  type TravelsSerializedHistory,
} from 'travels';
import type { ArrayPaths, TravelsV3BackendOptions, TravelsV3Patch } from './contracts';
import { JournalBatches } from './journal-batches';
import {
  IsolatedWriteGate,
  type JournalWriteScope,
  type ScopedJournalWriter,
} from './isolated-write-scope';
import {
  applyOwnedPatches,
  equalJson,
  freezeOwned,
  ownJson,
  prepareOwnedUpdate,
  type OwnedTransition,
} from './owned-json';
import { RetainedEntryIndex } from './retained-entry-index';
import { TransitionNotifications } from './transition-notifications';

/**
 * The adapter owns staged state and commit/publication boundaries; Travels owns
 * retained history and navigation. Async grouping here is NOT Travels.transaction.
 */
export class TravelsV3JournalBackend<T extends JsonValue> implements TransactionBackend<T, TravelsV3Patch> {
  readonly capabilities = { patches: true, timeline: true, immutableSnapshots: true } as const;
  private readonly journal: TravelJournal<T, true, true, ArrayPaths>;
  private readonly entries: RetainedEntryIndex;
  private readonly batches = new JournalBatches<T>();
  private readonly writeGate = new IsolatedWriteGate();
  private readonly notifications: TransitionNotifications<TravelsV3Patch>;
  private readonly unsubscribe: () => void;
  private snapshot: ReadonlyStateSnapshot<T>;
  // The previous cursor is needed when a new entry branches/trims history.
  private journalPosition = 0;
  private disposed = false;
  private updating = false;
  private managedBatch = false;
  private operationMeta: StateMutationMeta | undefined;
  private lastMeta: StateMutationMeta | undefined;
  private lastPatches: readonly TravelsV3Patch[] | null = null;

  private constructor(
    readonly name: string,
    initialValue: T,
    options: TravelsV3BackendOptions,
    restored?: TravelsSerializedHistory<T, ArrayPaths>,
  ) {
    const initial = ownJson(initialValue, 'initial state');
    const journalOptions = {
      maxHistory: options.maxHistory ?? 50,
      enableAutoFreeze: true as const,
      patchesOptions: { pathAsArray: true as const },
      apply: (transition: { state: T; patches: OwnedTransition<T>['patches'] }) =>
        applyOwnedPatches(transition.state, structuredClone(transition.patches)),
    };
    this.journal = restored
      ? restoreTravelJournal<T, true, true, ArrayPaths>(restored, journalOptions)
      : createTravelJournal<T, true, true, ArrayPaths>(initial, journalOptions);
    this.entries = new RetainedEntryIndex(this.journal.getHistoryEntries().length + 1);
    this.journalPosition = this.journal.getPosition();
    this.notifications = new TransitionNotifications(options.onListenerError);
    this.snapshot = this.readSnapshot();
    this.unsubscribe = this.journal.subscribe(event => this.publish(event));
  }

  static create<T extends JsonValue>(name: string, initialValue: T, options: TravelsV3BackendOptions = {}): TravelsV3JournalBackend<T> {
    return new TravelsV3JournalBackend(name, initialValue, options);
  }

  static restore<T extends JsonValue>(name: string, serialized: string, options: TravelsV3BackendOptions = {}): TravelsV3JournalBackend<T> {
    const decoded = Travels.deserialize<T, ArrayPaths>(serialized, { validation: 'semantic' });
    return new TravelsV3JournalBackend(name, decoded.state, options, decoded);
  }

  private assertWritable(): void {
    if (this.updating || this.notifications.isNotifying) throw new Error('Reentrant journal writes are not supported');
  }

  private assertWriteAccess(token?: symbol): void {
    this.writeGate.assertWrite(token);
    if (token !== undefined && !this.batches.active) throw new Error('An isolated writer requires its active journal batch');
    this.assertWritable();
  }

  private assertBatchControl(token?: symbol): void {
    if (this.disposed) throw new Error(`Backend "${this.name}" is disposed`);
    this.assertWritable();
    this.writeGate.assertControl(token);
    if (this.managedBatch) throw new Error('A managed batch owns its lifecycle until its callback settles');
  }

  private readSnapshot(): ReadonlyStateSnapshot<T> {
    return Object.freeze({
      name: this.name,
      value: freezeOwned(this.journal.getState()),
      version: this.journal.getRevision(),
      lastUpdate: Date.now(),
    });
  }

  private publish(event: TravelsEvent<T, ArrayPaths>): void {
    if (this.disposed) return;
    if (event.type === 'recordPatches') this.entries.commit(this.journalPosition, event.historyLength + 1);
    else if (event.type === 'reset' || event.type === 'rebase') this.entries.reset(event.historyLength + 1);
    this.journalPosition = event.position;
    this.snapshot = this.readSnapshot();
    this.lastPatches = freezeOwned(structuredClone(event.patches.patches.flat()));
    this.lastMeta = this.operationMeta;
    this.notifications.publish(this.lastPatches);
  }

  private perform(operation: () => void, meta?: StateMutationMeta): void {
    const previous = this.operationMeta;
    this.operationMeta = meta;
    try { operation(); } finally { this.operationMeta = previous; }
  }

  private record(transition: OwnedTransition<T>, meta?: StateMutationMeta): void {
    this.perform(() => this.journal.recordPatches(transition.state, {
      patches: transition.patches,
      inversePatches: transition.inversePatches,
      ...(meta === undefined ? {} : { metadata: meta }),
    }), meta);
  }

  private accept(transition: OwnedTransition<T>, meta?: StateMutationMeta): void {
    if (this.disposed || transition.patches.length === 0) return;
    if (this.batches.active) this.batches.stage(transition);
    else this.record(transition, meta);
  }

  private workingState(): T {
    const pending = this.batches.current;
    return pending ? pending.state : this.journal.getState();
  }

  getSnapshot = (): ReadonlyStateSnapshot<T> => this.snapshot;
  getSafeValue = (): T => structuredClone(this.snapshot.value);
  getLastPatches = (): readonly TravelsV3Patch[] | null => this.lastPatches;
  getLastTransitionMeta = (): StateMutationMeta | undefined => this.lastMeta;
  isDisposed = (): boolean => this.disposed;
  isStoreDisposed = (): boolean => this.disposed;
  subscribe = (listener: () => void): (() => void) => this.notifications.subscribe(listener);
  subscribeWithPatches = (listener: (patches: readonly TravelsV3Patch[] | null) => void): (() => void) =>
    this.notifications.subscribeWithPatches(listener);

  private writeValue(value: T, meta?: StateMutationMeta, token?: symbol): void {
    if (token !== undefined) this.writeGate.assertWrite(token);
    if (this.disposed) return;
    this.assertWriteAccess(token);
    this.batches.assertCanWrite();
    const metadata = meta === undefined ? undefined : ownJson(meta, 'metadata');
    const current = this.workingState();
    if (Object.is(value, current)) return;
    const owned = ownJson(value, 'state');
    this.accept(prepareOwnedUpdate(current, () => owned), metadata);
  }

  private writeUpdate(updater: (current: T) => T | undefined, meta?: StateMutationMeta, token?: symbol): void {
    if (token !== undefined) this.writeGate.assertWrite(token);
    if (this.disposed) return;
    this.assertWriteAccess(token);
    this.batches.assertCanWrite();
    const metadata = meta === undefined ? undefined : ownJson(meta, 'metadata');
    const current = this.workingState();
    this.updating = true;
    let transition: OwnedTransition<T>;
    try { transition = prepareOwnedUpdate(current, updater); }
    finally { this.updating = false; }
    this.accept(transition, metadata);
  }

  setValue = (value: T, meta?: StateMutationMeta): void => this.writeValue(value, meta);
  update = (updater: (current: T) => T | undefined, meta?: StateMutationMeta): void => this.writeUpdate(updater, meta);

  /** @internal Reserve before Coordinator.begin can invoke started observers. */
  reserveIsolatedWriter(): JournalWriteScope<T> {
    this.assertBatchControl();
    if (this.batches.active || !this.notifications.isQuiescent) throw new Error('An isolated writer requires a fresh quiescent journal');
    const scope = this.writeGate.acquire();
    const read = (): T => {
      this.writeGate.assertWrite(scope.token);
      if (!this.batches.active) throw new Error('An isolated writer requires its active journal batch');
      return this.workingState();
    };
    const writer: ScopedJournalWriter<T> = Object.freeze({
      name: this.name,
      getValue: read,
      getSafeValue: () => structuredClone(read()),
      setValue: (value: T, meta?: StateMutationMeta) => this.writeValue(value, meta, scope.token),
      update: (updater: (current: T) => T | undefined, meta?: StateMutationMeta) => this.writeUpdate(updater, meta, scope.token),
    });
    const batchControl = Object.freeze({
      beginBatch: (meta?: StateMutationMeta, options?: { readonly deferNotification?: boolean }) => this.startBatch(meta, options, scope.token),
      endBatch: () => this.closeBatch(false, scope.token),
      cancelBatch: () => this.closeBatch(true, scope.token),
      resumeNotifications: () => this.resume(scope.token),
      flushNotifications: () => this.flush(scope.token),
    });
    return { ...scope, writer, batchControl };
  }

  private startBatch(meta?: StateMutationMeta, options: { readonly deferNotification?: boolean } = {}, token?: symbol): void {
    this.assertBatchControl(token);
    if (token !== undefined && this.batches.active) throw new Error('An isolated scope owns one outer journal batch');
    const metadata = meta === undefined ? undefined : ownJson(meta, 'metadata');
    this.batches.begin(this.journal.getState(), metadata);
    if (options.deferNotification) this.notifications.hold();
  }

  beginBatch = (meta?: StateMutationMeta, options?: { readonly deferNotification?: boolean }): void => this.startBatch(meta, options);

  private finishBatch(): void {
    if (this.disposed) throw new Error(`Backend "${this.name}" is disposed`);
    const pending = this.batches.current;
    if (!pending) throw new Error('Journal batch is not active');
    if (this.batches.outermost) {
      if (pending.navigation !== undefined) this.perform(() => this.journal.go(pending.navigation!), pending.metadata);
      else if (!equalJson(this.journal.getState(), pending.state)) this.record(pending, pending.metadata);
    }
    // Keep the savepoint until journal preparation succeeds, so callers can cancel.
    if (!this.disposed) this.batches.complete();
  }

  private closeBatch(cancel: boolean, token?: symbol): void {
    this.assertBatchControl(token);
    if (cancel) this.batches.cancel();
    else this.finishBatch();
  }

  private resume(token?: symbol): void {
    if (this.disposed) return;
    this.writeGate.assertControl(token);
    this.notifications.resume();
  }

  private flush(token?: symbol): void {
    if (this.disposed) return;
    this.writeGate.assertControl(token);
    this.notifications.flush();
  }

  endBatch = (): void => this.closeBatch(false);
  cancelBatch = (): void => this.closeBatch(true);
  resumeNotifications = (): void => this.resume();
  flushNotifications = (): void => this.flush();

  /** Explicit scoped authority; direct writes stay blocked across awaits and publication. */
  async batchIsolated<R>(callback: (writer: ScopedJournalWriter<T>) => R | Promise<R>, meta?: StateMutationMeta): Promise<R> {
    this.assertBatchControl();
    if (this.batches.active) throw new Error('Isolated batches cannot nest inside an external journal batch');
    const scope = this.reserveIsolatedWriter();
    try {
      scope.batchControl.beginBatch(meta);
      const result = await callback(scope.writer);
      scope.seal();
      scope.batchControl.endBatch();
      return result;
    } catch (error) {
      scope.seal();
      if (this.batches.active) scope.batchControl.cancelBatch();
      throw error;
    } finally { scope.release(); }
  }

  /** Managed sync/async grouping; callbacks cannot close or overlap its lifecycle. */
  batch<R>(callback: () => R, meta?: StateMutationMeta): R {
    this.assertBatchControl();
    if (this.batches.active) throw new Error('Managed batches cannot nest inside an external journal batch');
    this.beginBatch(meta);
    this.managedBatch = true;
    const finish = () => { try { this.finishBatch(); } finally { this.managedBatch = false; } };
    const rollback = () => {
      if (this.batches.active) this.batches.cancel();
      this.managedBatch = false;
    };
    try {
      const result = callback();
      if (result && typeof (result as { then?: unknown }).then === 'function') {
        return Promise.resolve(result).then(
          value => { try { finish(); } catch (error) { rollback(); throw error; } return value; },
          error => { rollback(); throw error; },
        ) as R;
      }
      finish();
      return result;
    } catch (error) { rollback(); throw error; }
  }

  private navigate(position: number, meta?: StateMutationMeta): void {
    if (this.disposed) return;
    this.assertWriteAccess();
    if (!Number.isInteger(position) || position < 0 || position >= this.entries.length) throw new RangeError('Invalid journal position');
    const metadata = meta === undefined ? undefined : ownJson(meta, 'metadata');
    if (this.batches.active) this.batches.navigate(position, metadata);
    else this.perform(() => this.journal.go(position), metadata);
  }

  private step(steps: number, direction: -1 | 1, meta: StateMutationMeta): void {
    if (this.disposed) return;
    if (!Number.isInteger(steps) || steps < 0) throw new RangeError('Invalid journal step count');
    const position = this.batches.current?.navigation ?? this.journal.getPosition();
    this.navigate(Math.max(0, Math.min(this.entries.length - 1, position + steps * direction)), meta);
  }

  getPosition = (): number => this.disposed ? 0 : this.journal.getPosition();
  getHistoryLength = (): number => this.disposed ? 0 : this.entries.length;
  getHistory = (): readonly T[] => this.disposed ? [] : this.journal.getHistorySnapshot();
  getHistoryEntryId = (): HistoryEntryId => this.disposed ? -1 : this.entries.at(this.journal.getPosition());
  hasHistoryEntry = (id: HistoryEntryId): boolean => !this.disposed && typeof id === 'number' && this.entries.has(id);
  canUndo = (): boolean => !this.disposed && this.journal.canBack();
  canRedo = (): boolean => !this.disposed && this.journal.canForward();
  undo = (steps = 1, meta: StateMutationMeta = { origin: 'undo' }): void => this.step(steps, -1, meta);
  redo = (steps = 1, meta: StateMutationMeta = { origin: 'redo' }): void => this.step(steps, 1, meta);
  goTo = (position: number, meta?: StateMutationMeta): void => this.navigate(position, meta);
  goToHistoryEntry = (id: HistoryEntryId, meta?: StateMutationMeta): void => {
    if (this.disposed) return;
    if (typeof id !== 'number') throw new Error(`History entry ${String(id)} is not retained`);
    this.navigate(this.entries.positionOf(id), meta);
  };

  private baseline(operation: () => void, meta?: StateMutationMeta): void {
    if (this.disposed) return;
    this.assertWriteAccess();
    if (this.batches.active) throw new Error('Reset/rebase inside a journal batch is not supported');
    this.perform(operation, meta === undefined ? undefined : ownJson(meta, 'metadata'));
  }

  reset = (meta: StateMutationMeta = { origin: 'reset' }): void => this.baseline(() => this.journal.reset(), meta);
  rebase = (): void => this.baseline(() => this.journal.rebase());

  serialize(): string {
    if (this.disposed || this.batches.active) throw new Error('Only a live, committed journal can be serialized');
    return JSON.stringify(this.journal.serialize({ strict: true }));
  }

  dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    this.writeGate.dispose();
    this.unsubscribe();
    this.batches.clear();
    this.notifications.dispose();
  };
}

export const createTravelsV3JournalBackend = TravelsV3JournalBackend.create;
export const restoreTravelsV3JournalBackend = TravelsV3JournalBackend.restore;
