import type {
  HistoryEntryId,
  ReadonlyStateSnapshot,
  StateBackend,
  StateMutationMeta,
  TransactionBackend,
} from '@context-action/store-core';
import { safeGet, safeSet } from './immutable';
import { create } from '@context-action/mutative-core';
import { createTimeTravel, type TimeTravel } from './time-travel';
import type {
  PatchesOption,
  TimeTravelOptions,
  TimeTravelTransitionMeta,
} from './types';
import type { Patches } from '@context-action/mutative-core';

export type MutativeReadMode = 'reference' | 'safe';
export type MutativeNotificationMode = 'immediate' | 'batched';

export interface MutativeStateBackendOptions {
  /** Clone incoming values before storing them. Defaults to true. */
  readonly cloneOnSet?: boolean;
  /** Clone values exposed through snapshots. Defaults to true. */
  readonly readMode?: MutativeReadMode;
  /** Forwarded to the Mutative draft engine. */
  readonly strict?: boolean;
  /** Enable automatic freezing in the Mutative draft engine. */
  readonly enableAutoFreeze?: boolean;
  /** Patch path and array options. */
  readonly patchesOptions?: Exclude<PatchesOption, boolean>;
  /** Observe listener failures without changing the mutation result. */
  readonly onListenerError?: (error: unknown) => void;
}

export interface MutativeTimelineBackendOptions
  extends Omit<TimeTravelOptions<false, true>, 'autoArchive'> {
  /** Clone values exposed through snapshots. Defaults to reference reads. */
  readonly readMode?: MutativeReadMode;
  /** Clone values passed to setValue before archiving them. */
  readonly cloneOnSet?: boolean;
  /** Immediate notifications or microtask-coalesced notifications. */
  readonly notificationMode?: MutativeNotificationMode;
  /** Observe listener failures without changing the mutation result. */
  readonly onListenerError?: (error: unknown) => void;
}

type MutativePatch = Patches[number];

function reportListenerError(
  error: unknown,
  report: ((error: unknown) => void) | undefined,
): void {
  if (report) {
    try {
      report(error);
    } catch {
      // An observer must not change the outcome of a state transition.
    }
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    // Keep the default opt-in to development diagnostics and avoid making
    // console output part of the backend's production contract.
    console.error('[context-action/mutative] state listener failed', error);
  }
}

function notifyListeners(
  listeners: Set<() => void>,
  report: ((error: unknown) => void) | undefined,
): void {
  // Snapshot the listener set so a listener that subscribes while a
  // notification is in flight only observes the next transition. This also
  // makes re-entrant updates deterministic instead of allowing Set iteration
  // to visit listeners added during the current pass.
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (error) {
      reportListenerError(error, report);
    }
  }
}

function snapshotOf<T>(
  name: string,
  value: T,
  version: number,
  readMode: MutativeReadMode,
): ReadonlyStateSnapshot<T> {
  return {
    name,
    value: readMode === 'safe' ? safeGet(value, true) : value,
    version,
    lastUpdate: Date.now(),
  };
}

/**
 * A framework-neutral Mutative state backend without timeline history.
 *
 * The backend owns cloning, draft updates, patch capture, and snapshots. It
 * intentionally has no React dependency and can be wrapped by any UI layer.
 */
export class MutativeStateBackend<T = unknown>
  implements StateBackend<T, MutativePatch>
{
  public readonly name: string;
  public readonly capabilities;

  private value: T;
  private version = 0;
  private snapshot: ReadonlyStateSnapshot<T>;
  private lastPatches: Patches | null = null;
  private disposed = false;
  private readonly listeners = new Set<() => void>();
  private readonly options: Required<
    Pick<MutativeStateBackendOptions, 'cloneOnSet' | 'readMode'>
  > & MutativeStateBackendOptions;

  constructor(
    name: string,
    initialValue: T,
    options: MutativeStateBackendOptions = {},
  ) {
    this.name = name;
    this.options = {
      ...options,
      cloneOnSet: options.cloneOnSet ?? true,
      readMode: options.readMode ?? 'safe',
    };
    this.value = this.options.cloneOnSet
      ? safeSet(initialValue, true)
      : initialValue;
    this.snapshot = snapshotOf(this.name, this.value, this.version, this.options.readMode);
    this.capabilities = {
      patches: true,
      timeline: false,
      immutableSnapshots: this.options.readMode === 'safe',
    } as const;
  }

  getSnapshot = (): ReadonlyStateSnapshot<T> => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getLastPatches = (): readonly MutativePatch[] | null => this.lastPatches;

  getSafeValue = (): T => safeGet(this.value, true);

  setValue = (value: T, _meta?: StateMutationMeta): void => {
    if (this.disposed) return;
    const nextValue = this.options.cloneOnSet ? safeSet(value, true) : value;
    const [nextState, patches] = create(
      this.value,
      () => nextValue,
      {
        enablePatches: this.options.patchesOptions ?? true,
        strict: this.options.strict,
        enableAutoFreeze: this.options.enableAutoFreeze,
      },
    ) as [T, Patches, Patches];
    this.publish(nextState, patches);
  };

  update = (
    updater: (current: T) => T | undefined,
    _meta?: StateMutationMeta,
  ): void => {
    if (this.disposed) return;
    const [nextState, patches] = create(
      this.value,
      (draft) => updater(draft as T),
      {
        enablePatches: this.options.patchesOptions ?? true,
        strict: this.options.strict,
        enableAutoFreeze: this.options.enableAutoFreeze,
      },
    ) as [T, Patches, Patches];
    this.publish(nextState, patches);
  };

  isStoreDisposed = (): boolean => this.disposed;

  dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    this.listeners.clear();
  };

  private publish(nextState: T, patches: Patches): void {
    if (patches.length === 0 && Object.is(nextState, this.value)) return;
    this.value = nextState;
    this.lastPatches = patches;
    this.version += 1;
    this.snapshot = snapshotOf(this.name, this.value, this.version, this.options.readMode);
    notifyListeners(this.listeners, this.options.onListenerError);
  }
}

/**
 * A framework-neutral Mutative timeline backend with undo/redo and batches.
 *
 * TimeTravel remains the history engine, while this adapter supplies the
 * StateBackend/TransactionBackend contract used by UI integrations.
 */
export class MutativeTimelineBackend<T = unknown>
  implements TransactionBackend<T, MutativePatch>
{
  public readonly name: string;
  public readonly capabilities;

  private readonly timeTravel: TimeTravel<T, false, true>;
  private readonly listeners = new Set<() => void>();
  private readonly options: Required<
    Pick<MutativeTimelineBackendOptions, 'readMode' | 'notificationMode' | 'cloneOnSet'>
  > & MutativeTimelineBackendOptions;
  private snapshot: ReadonlyStateSnapshot<T>;
  private version = 0;
  private lastPatches: Patches | null = null;
  private lastTransitionMeta: TimeTravelTransitionMeta | undefined;
  private disposed = false;
  private pendingNotification = false;
  private pendingPatches: Patches | null = null;
  private notificationHoldDepth = 0;
  private notificationDeferred = false;
  private readonly unsubscribeTimeTravel: () => void;

  constructor(
    name: string,
    initialValue: T,
    options: MutativeTimelineBackendOptions = {},
  ) {
    this.name = name;
    this.options = {
      ...options,
      readMode: options.readMode ?? 'reference',
      notificationMode: options.notificationMode ?? 'immediate',
      cloneOnSet: options.cloneOnSet ?? options.readMode === 'safe',
    };
    const initial = this.options.cloneOnSet ? safeSet(initialValue, true) : initialValue;
    this.timeTravel = createTimeTravel(initial, {
      ...options,
      autoArchive: true,
    });
    this.snapshot = snapshotOf(this.name, this.timeTravel.getState(), this.version, this.options.readMode);
    this.capabilities = {
      patches: true,
      timeline: true,
      immutableSnapshots: this.options.readMode === 'safe',
    } as const;
    this.unsubscribeTimeTravel = this.timeTravel.subscribe(
      (_state, travelPatches, _position, changedPatches, metadata) => {
        if (this.disposed) return;
        this.lastPatches = (changedPatches ?? travelPatches.patches.flat()) as Patches;
        this.lastTransitionMeta = metadata;
        this.version += 1;
        this.snapshot = snapshotOf(
          this.name,
          this.timeTravel.getState(),
          this.version,
          this.options.readMode,
        );
        if (this.notificationHoldDepth > 0) {
          this.notificationDeferred = true;
          return;
        }
        this.scheduleNotification();
      },
    );
  }

  getSnapshot = (): ReadonlyStateSnapshot<T> => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getLastPatches = (): readonly MutativePatch[] | null => this.lastPatches;

  getSafeValue = (): T => safeGet(this.timeTravel.getState(), true);

  getLastTransitionMeta = (): TimeTravelTransitionMeta | undefined =>
    this.lastTransitionMeta;

  setValue = (value: T, meta?: StateMutationMeta): void => {
    if (this.disposed) return;
    const nextValue = this.options.cloneOnSet ? safeSet(value, true) : value;
    this.mutateWithMetadata(meta, () => this.timeTravel.setState(nextValue));
  };

  update = (
    updater: (current: T) => T | undefined,
    meta?: StateMutationMeta,
  ): void => {
    if (this.disposed) return;
    this.mutateWithMetadata(meta, () =>
      this.timeTravel.setState((draft) => updater(draft as T)),
    );
  };

  getHistoryEntryId = (): HistoryEntryId => this.timeTravel.getHistoryEntryId();

  hasHistoryEntry = (entryId: HistoryEntryId): boolean =>
    typeof entryId === 'number' && this.timeTravel.hasHistoryEntry(entryId);

  canUndo = (): boolean => !this.disposed && this.timeTravel.canBack();

  canRedo = (): boolean => !this.disposed && this.timeTravel.canForward();

  getPosition = (): number => this.timeTravel.getPosition();

  getHistoryLength = (): number => this.timeTravel.getHistory().length;

  getHistory = (): readonly T[] => this.timeTravel.getHistory();

  goTo = (position: number, meta?: StateMutationMeta): void => {
    if (this.disposed) return;
    this.timeTravel.go(position, meta);
  };

  undo = (steps = 1, meta?: StateMutationMeta): void => {
    if (this.disposed) return;
    this.timeTravel.back(steps, meta ?? { origin: 'undo' });
  };

  redo = (steps = 1, meta?: StateMutationMeta): void => {
    if (this.disposed) return;
    this.timeTravel.forward(steps, meta ?? { origin: 'redo' });
  };

  goToHistoryEntry = (entryId: HistoryEntryId, meta?: StateMutationMeta): void => {
    if (this.disposed) return;
    if (typeof entryId !== 'number') {
      throw new Error(`History entry ${String(entryId)} is not a Mutative numeric entry`);
    }
    this.timeTravel.goToHistoryEntry(entryId, meta);
  };

  reset = (meta?: StateMutationMeta): void => {
    if (this.disposed) return;
    this.timeTravel.reset(meta);
  };

  beginBatch = (
    meta?: StateMutationMeta,
    options: { deferNotification?: boolean } = {},
  ): void => {
    if (this.disposed) throw new Error(`Store "${this.name}" is disposed`);
    this.timeTravel.beginBatch(meta);
    // Increment only after TimeTravel accepts the batch. If it rejects the
    // operation, notification state must remain unchanged.
    if (options.deferNotification) this.notificationHoldDepth += 1;
  };

  endBatch = (): void => {
    if (this.disposed) throw new Error(`Store "${this.name}" is disposed`);
    this.timeTravel.endBatch();
  };

  cancelBatch = (): void => {
    if (this.disposed) throw new Error(`Store "${this.name}" is disposed`);
    this.timeTravel.cancelBatch();
  };

  resumeNotifications = (): void => {
    if (this.notificationHoldDepth > 0) this.notificationHoldDepth -= 1;
  };

  flushNotifications = (): void => {
    if (this.disposed || this.notificationHoldDepth > 0 || !this.notificationDeferred) {
      return;
    }
    this.notificationDeferred = false;
    this.scheduleNotification();
  };

  isStoreDisposed = (): boolean => this.disposed;

  dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    this.pendingNotification = false;
    this.pendingPatches = null;
    this.notificationHoldDepth = 0;
    this.notificationDeferred = false;
    this.unsubscribeTimeTravel();
    this.listeners.clear();
  };

  private mutateWithMetadata(meta: StateMutationMeta | undefined, operation: () => void): void {
    if (!meta) {
      operation();
      return;
    }
    this.timeTravel.beginBatch(meta);
    try {
      operation();
      this.timeTravel.endBatch();
    } catch (error) {
      try {
        this.timeTravel.cancelBatch();
      } catch {
        // Preserve the original updater error.
      }
      throw error;
    }
  }

  private scheduleNotification(): void {
    if (this.disposed) return;
    if (this.options.notificationMode === 'immediate') {
      this.notifyNow();
      return;
    }
    if (this.lastPatches) {
      this.pendingPatches = this.pendingPatches
        ? this.pendingPatches.concat(this.lastPatches)
        : this.lastPatches;
    }
    if (this.pendingNotification) return;
    this.pendingNotification = true;
    queueMicrotask(() => {
      this.pendingNotification = false;
      if (!this.disposed) this.notifyNow();
    });
  }

  private notifyNow(): void {
    if (this.disposed) return;
    if (this.pendingPatches) {
      this.lastPatches = this.pendingPatches;
      this.pendingPatches = null;
    }
    notifyListeners(this.listeners, this.options.onListenerError);
  }
}

export function createMutativeStateBackend<T = unknown>(
  name: string,
  initialValue: T,
  options?: MutativeStateBackendOptions,
): StateBackend<T, MutativePatch> {
  return new MutativeStateBackend(name, initialValue, options);
}

export function createMutativeTimelineBackend<T = unknown>(
  name: string,
  initialValue: T,
  options?: MutativeTimelineBackendOptions,
): TransactionBackend<T, MutativePatch> {
  return new MutativeTimelineBackend(name, initialValue, options);
}
