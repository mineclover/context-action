/** Workspace-only experiment. Not exported or packed by @context-action/mutative. */
import type {
  HistoryEntryId,
  ReadonlyStateSnapshot,
  StateMutationMeta,
  TimelineBackend,
} from '@context-action/store-core';
import { apply } from 'mutative';
import {
  createPatchableTravels,
  restoreTravels,
  Travels,
  type JsonValue,
  type PatchableInput,
  type TravelsEvent,
  type Updater,
} from 'travels';
import { RetainedEntryIndex } from './retained-entry-index';
import { assertDurable, freezeOwned, ownJson, prepareOwnedUpdate, rejectAsync } from './owned-json';
import type { ArrayPaths, TravelsV3BackendOptions, TravelsV3Patch } from './contracts';

export type { TravelsV3BackendOptions, TravelsV3Patch } from './contracts';

/**
 * JSON-only, immutable state-owning backend over upstream Travels 3 / Mutative 2.
 * Implements TimelineBackend, deliberately NOT TransactionBackend: there is no
 * fake beginBatch/endBatch/notification-hold bridge to the multi-store coordinator.
 */
export class TravelsV3Backend<T extends JsonValue> implements TimelineBackend<T, TravelsV3Patch> {
  readonly capabilities = { patches: true, timeline: true, immutableSnapshots: true } as const;
  private readonly entries: RetainedEntryIndex;
  private readonly listeners = new Set<() => void>();
  private readonly patchListeners = new Set<(patches: readonly TravelsV3Patch[] | null) => void>();
  private readonly unsubscribe: () => void;
  private snapshot: ReadonlyStateSnapshot<T>;
  private position: number;
  private disposed = false;
  private updating = false;
  private batchDepth = 0;
  private operationMeta: StateMutationMeta | undefined;
  private lastMeta: StateMutationMeta | undefined;
  private lastPatches: readonly TravelsV3Patch[] | null = null;

  constructor(
    readonly name: string,
    private readonly engine: Travels<T, true, true, ArrayPaths>,
    private readonly options: TravelsV3BackendOptions = {},
  ) {
    this.position = engine.getPosition();
    this.entries = new RetainedEntryIndex(engine.getHistoryEntries().length + 1);
    this.snapshot = this.readSnapshot();
    this.unsubscribe = engine.subscribe(event => this.publish(event));
  }

  private readSnapshot(): ReadonlyStateSnapshot<T> {
    return Object.freeze({
      name: this.name,
      value: freezeOwned(this.engine.getState()),
      version: this.engine.getRevision(),
      lastUpdate: Date.now(),
    });
  }

  private report(error: unknown): void {
    try { this.options.onListenerError?.(error); } catch { /* Observation cannot alter a commit. */ }
  }

  private publish(event: TravelsEvent<T, ArrayPaths>): void {
    if (this.disposed) return;
    if (event.type === 'setState' || event.type === 'transaction') {
      // Travels counts transitions; TimelineBackend counts retained states.
      this.entries.commit(this.position, event.historyLength + 1);
    } else if (event.type === 'reset' || event.type === 'rebase') {
      this.entries.reset(event.historyLength + 1);
    }
    this.position = event.position;
    this.snapshot = this.readSnapshot();
    // Work is proportional to this transition's delta, never getPatches().
    // Detach/freeze nested values too: upstream events only freeze shallow views.
    this.lastPatches = freezeOwned(structuredClone(event.patches.patches.flat()));
    this.lastMeta = this.operationMeta === undefined
      ? undefined
      : freezeOwned(structuredClone(this.operationMeta));
    const patches = this.lastPatches;
    for (const listener of [...this.listeners]) {
      if (!this.listeners.has(listener)) continue;
      try { listener(); } catch (error) { this.report(error); }
    }
    for (const listener of [...this.patchListeners]) {
      if (!this.patchListeners.has(listener)) continue;
      try { listener(patches); } catch (error) { this.report(error); }
    }
  }

  private perform(callback: (metadata?: StateMutationMeta) => void, meta?: StateMutationMeta): void {
    if (this.disposed) return;
    if (this.updating) throw new Error('Reentrant writes inside an updater are not supported');
    const metadata = meta === undefined ? undefined : ownJson(meta, 'metadata');
    const previous = this.operationMeta;
    this.operationMeta = metadata;
    try { callback(metadata); } finally { this.operationMeta = previous; }
  }

  private navigate(callback: () => void, meta?: StateMutationMeta): void {
    if (this.disposed) return;
    if (this.batchDepth > 0) throw new Error('Navigation inside an experimental batch is not supported');
    this.perform(callback, meta);
  }

  getSnapshot = (): ReadonlyStateSnapshot<T> => this.snapshot;
  getSafeValue = (): T => structuredClone(this.snapshot.value);
  getLastPatches = (): readonly TravelsV3Patch[] | null => this.lastPatches;
  getLastTransitionMeta = (): StateMutationMeta | undefined => this.lastMeta;
  isDisposed = (): boolean => this.disposed;

  subscribe = (listener: () => void): (() => void) => {
    if (typeof listener !== 'function') throw new TypeError('A listener must be a function');
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  subscribeWithPatches = (listener: (patches: readonly TravelsV3Patch[] | null) => void): (() => void) => {
    if (typeof listener !== 'function') throw new TypeError('A patch listener must be a function');
    if (this.disposed) return () => {};
    this.patchListeners.add(listener);
    return () => { this.patchListeners.delete(listener); };
  };

  setValue = (value: T, meta?: StateMutationMeta): void => {
    if (this.disposed) return;
    assertDurable(value, 'state');
    // Do not freeze caller-owned input or retain aliases to its patch values.
    const next = value === this.engine.getState() ? value : structuredClone(value);
    this.perform(metadata => this.engine.setState<Updater<T>>(next, metadata), meta);
  };

  update = (updater: (current: T) => T | undefined, meta?: StateMutationMeta): void => {
    if (this.disposed) return;
    if (this.updating) throw new Error('Reentrant writes inside an updater are not supported');
    if (meta !== undefined) assertDurable(meta, 'metadata');
    this.updating = true;
    let prepared: ReturnType<typeof prepareOwnedUpdate<T>>;
    try { prepared = prepareOwnedUpdate(this.engine.getState(), updater); }
    finally { this.updating = false; }
    if (prepared.patches.length === 0) return;
    if (prepared.patches.some(patch => patch.path.length === 0)) {
      this.perform(metadata => this.engine.setState<Updater<T>>(prepared.state, metadata), meta);
      return;
    }
    this.perform(metadata => this.engine.setState<Updater<T>>((draft: unknown) => {
      // Apply owned patch values, never the caller's borrowed draft assignments.
      apply(draft as object, prepared.patches, { mutable: true });
    }, metadata), meta);
  };

  /** One synchronous, single-backend transaction. Async callbacks are rejected. */
  batch<R>(callback: (() => R) & (Extract<R, PromiseLike<unknown>> extends never ? unknown : never), meta?: StateMutationMeta): R {
    if (this.disposed) throw new Error(`Backend "${this.name}" is disposed`);
    rejectAsync(callback);
    let result!: R;
    const execute = () => {
      this.batchDepth += 1;
      try {
        result = callback();
        if (result && typeof (result as { then?: unknown }).then === 'function') {
          void Promise.resolve(result).catch(() => {});
          throw new TypeError('An experimental batch must be synchronous');
        }
      } finally { this.batchDepth -= 1; }
    };
    this.perform(metadata => {
      if (metadata === undefined) this.engine.transaction(execute);
      else this.engine.transaction(metadata, execute);
    }, meta);
    return result;
  }

  getPosition = (): number => this.disposed ? 0 : this.position;
  getHistoryLength = (): number => this.disposed ? 0 : this.entries.length;
  getHistory = (): readonly T[] => this.disposed ? [] : this.engine.getHistorySnapshot();
  getHistoryEntryId = (): HistoryEntryId => this.disposed ? -1 : this.entries.at(this.position);
  hasHistoryEntry = (id: HistoryEntryId): boolean => !this.disposed && typeof id === 'number' && this.entries.has(id);
  canUndo = (): boolean => !this.disposed && this.engine.canBack();
  canRedo = (): boolean => !this.disposed && this.engine.canForward();
  undo = (steps = 1, meta?: StateMutationMeta): void => this.navigate(() => this.engine.back(steps), meta ?? { origin: 'undo' });
  redo = (steps = 1, meta?: StateMutationMeta): void => this.navigate(() => this.engine.forward(steps), meta ?? { origin: 'redo' });
  goTo = (position: number, meta?: StateMutationMeta): void => this.navigate(() => this.engine.go(position), meta);
  goToHistoryEntry = (id: HistoryEntryId, meta?: StateMutationMeta): void => this.navigate(() => {
    if (typeof id !== 'number') throw new Error(`History entry ${String(id)} is not retained`);
    this.engine.go(this.entries.positionOf(id));
  }, meta);
  reset = (meta?: StateMutationMeta): void => this.navigate(() => this.engine.reset(), meta ?? { origin: 'reset' });
  rebase = (): void => this.navigate(() => this.engine.rebase());

  /** JSON text only; validation and serialization remain explicit trust boundaries. */
  serialize(): string {
    if (this.disposed) throw new Error(`Backend "${this.name}" is disposed`);
    return JSON.stringify(this.engine.serialize({ strict: true }));
  }

  dispose = (): void => {
    if (this.disposed) return;
    if (this.batchDepth > 0) throw new Error('Disposal inside an experimental batch is not supported');
    this.disposed = true;
    this.unsubscribe();
    this.listeners.clear();
    this.patchListeners.clear();
  };
}

export function createTravelsV3Backend<T extends JsonValue>(
  name: string,
  initialValue: T,
  options: TravelsV3BackendOptions = {},
): TravelsV3Backend<T> {
  assertDurable(initialValue, 'initial state');
  const engine = createPatchableTravels<T, true, true, ArrayPaths>(
    structuredClone(initialValue) as PatchableInput<T>,
    { maxHistory: options.maxHistory ?? 50, enableAutoFreeze: true, mutable: false, patchesOptions: { pathAsArray: true } },
  );
  return new TravelsV3Backend(name, engine, options);
}

export function restoreTravelsV3Backend<T extends JsonValue>(
  name: string,
  serialized: string,
  options: TravelsV3BackendOptions = {},
): TravelsV3Backend<T> {
  const decoded = Travels.deserialize<T, ArrayPaths>(serialized, { validation: 'semantic' });
  assertDurable(decoded.state, 'restored state');
  const engine = restoreTravels<T, true, true, ArrayPaths>(decoded, {
    maxHistory: options.maxHistory ?? 50, enableAutoFreeze: true, mutable: false, patchesOptions: { pathAsArray: true },
  });
  return new TravelsV3Backend(name, engine, options);
}
