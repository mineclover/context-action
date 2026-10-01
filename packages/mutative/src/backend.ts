import type { Patches } from '@context-action/mutative-core';
import { create } from '@context-action/mutative-core';
import type {
  HistoryEntryId,
  ReadonlyStateSnapshot,
  StateBackend,
  StateMutationMeta,
  TransactionBackend,
} from '@context-action/store-core';
import { safeGet, safeSet } from './immutable';
import { createTimeTravel, type TimeTravel } from './time-travel';
import type {
  PatchesOption,
  TimeTravelOptions,
  TimeTravelTransitionMeta,
} from './types';
import { isNonCloneableType } from './utils';

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
  const snapshotValue = readMode === 'safe' ? freezeSnapshot(safeGet(value, true)) : value;
  return {
    name,
    value: snapshotValue,
    version,
    lastUpdate: Date.now(),
  };
}

/**
 * Make defensive snapshot values immutable without freezing the backend's
 * live state. The recursive walk also handles cyclic object graphs, which
 * can occur in application state even though Mutative itself only drafts
 * supported structures.
 */
const DATE_MUTATORS = new Set([
  'setDate',
  'setFullYear',
  'setHours',
  'setMilliseconds',
  'setMinutes',
  'setMonth',
  'setSeconds',
  'setTime',
  'setUTCDate',
  'setUTCFullYear',
  'setUTCHours',
  'setUTCMilliseconds',
  'setUTCMinutes',
  'setUTCMonth',
  'setUTCSeconds',
  'setYear',
]);

function immutableSnapshotError(type: string): TypeError {
  return new TypeError(`Cannot mutate an immutable snapshot ${type}`);
}

/** Map proxy whose internal-slot mutators fail even though Object.freeze(Map)
 * alone would still allow map.set/delete/clear. */
function guardSnapshotMap<K, V>(map: Map<K, V>): Map<K, V> {
  let guarded: Map<K, V>;
  guarded = new Proxy(map, {
    get(target, property) {
      if (property === 'set' || property === 'delete' || property === 'clear') {
        return () => { throw immutableSnapshotError('Map'); };
      }
      // Map.prototype.forEach normally passes its internal target as the
      // third callback argument. Bind the callback to the guarded proxy so a
      // consumer cannot recover the mutable raw target from a safe snapshot.
      if (property === 'forEach') {
        return ((
          callback: (value: V, key: K, map: Map<K, V>) => void,
          thisArg?: unknown,
        ) => {
          target.forEach((value, key) => callback.call(thisArg, value, key, guarded));
        }) as Map<K, V>['forEach'];
      }
      const member = Reflect.get(target, property, target);
      return typeof member === 'function' ? member.bind(target) : member;
    },
  });
  return guarded;
}

/** Set proxy whose internal-slot mutators fail on safe snapshots. */
function guardSnapshotSet<T>(set: Set<T>): Set<T> {
  let guarded: Set<T>;
  guarded = new Proxy(set, {
    get(target, property) {
      if (property === 'add' || property === 'delete' || property === 'clear') {
        return () => { throw immutableSnapshotError('Set'); };
      }
      // See guardSnapshotMap: keep Set.prototype.forEach from handing out the
      // mutable target as its third callback argument.
      if (property === 'forEach') {
        return ((
          callback: (value: T, sameValue: T, set: Set<T>) => void,
          thisArg?: unknown,
        ) => {
          target.forEach(value => callback.call(thisArg, value, value, guarded));
        }) as Set<T>['forEach'];
      }
      const member = Reflect.get(target, property, target);
      return typeof member === 'function' ? member.bind(target) : member;
    },
  });
  return guarded;
}

/** Date's internal-slot mutators also bypass Object.freeze. */
function guardSnapshotDate(date: Date): Date {
  return new Proxy(date, {
    get(target, property) {
      if (typeof property === 'string' && DATE_MUTATORS.has(property)) {
        return () => { throw immutableSnapshotError('Date'); };
      }
      const member = Reflect.get(target, property, target);
      return typeof member === 'function' ? member.bind(target) : member;
    },
  });
}

/** WeakMap proxy whose internal-slot mutators fail on safe snapshots. */
function guardSnapshotWeakMap<K extends object, V>(weakMap: WeakMap<K, V>): WeakMap<K, V> {
  // A Proxy around the caller-owned WeakMap would make Object.freeze(proxy)
  // call [[PreventExtensions]] on that original object. Use an empty
  // surrogate as the proxy target and delegate reads to the original instead.
  const surrogate = new WeakMap<K, V>();
  const guarded = new Proxy(surrogate, {
    get(target, property) {
      if (property === 'set' || property === 'delete') {
        return () => { throw immutableSnapshotError('WeakMap'); };
      }
      if (property === 'get') {
        return ((key: K) => {
          const value = weakMap.get(key);
          // WeakMap values are not enumerable, so clone the value at read
          // time. Returning the original object would let a snapshot mutate
          // the live state through weakMap.get(key).
          return freezeSnapshot(safeGet(value, true));
        }) as WeakMap<K, V>['get'];
      }
      if (property === 'has') {
        return weakMap.has.bind(weakMap);
      }
      const member = Reflect.get(target, property, target);
      return typeof member === 'function' ? member.bind(target) : member;
    },
  });
  return guarded;
}

/** WeakSet proxy whose internal-slot mutators fail on safe snapshots. */
function guardSnapshotWeakSet<T extends object>(weakSet: WeakSet<T>): WeakSet<T> {
  // Keep the original WeakSet extensible for the same reason as the WeakMap
  // surrogate above. Weak collections have no enumerable entries to clone,
  // so reads are delegated while all mutators are rejected.
  const surrogate = new WeakSet<T>();
  const guarded = new Proxy(surrogate, {
    get(target, property) {
      if (property === 'add' || property === 'delete') {
        return () => { throw immutableSnapshotError('WeakSet'); };
      }
      if (property === 'has') {
        return weakSet.has.bind(weakSet);
      }
      const member = Reflect.get(target, property, target);
      return typeof member === 'function' ? member.bind(target) : member;
    },
  });
  return guarded;
}

/**
 * Make defensive snapshot values immutable without freezing the backend's
 * live state. Internal-slot collections and dates use guarded proxies because
 * Object.freeze alone does not prevent their mutator methods. The recursive
 * walk also handles cycles and preserves caller-owned Map keys.
 */
function freezeSnapshot<T>(value: T): T {
  const seen = new WeakMap<object, unknown>();
  const visit = (current: unknown): unknown => {
    if (current === null || typeof current !== 'object') return current;
    // WeakMap and WeakSet are not enumerable and therefore cannot be cloned,
    // but their mutators can still be guarded without exposing a writable
    // snapshot view of the live collection.
    if (current instanceof WeakMap) {
      const objectValue = current as object;
      const existing = seen.get(objectValue);
      if (existing) return existing;
      const guarded = guardSnapshotWeakMap(current);
      seen.set(objectValue, guarded);
      Object.freeze(guarded);
      return guarded;
    }
    if (current instanceof WeakSet) {
      const objectValue = current as object;
      const existing = seen.get(objectValue);
      if (existing) return existing;
      const guarded = guardSnapshotWeakSet(current);
      seen.set(objectValue, guarded);
      Object.freeze(guarded);
      return guarded;
    }
    // safeGet intentionally preserves DOM and other host objects by
    // reference. Never freeze or proxy an application-owned host object as a
    // side effect of producing a defensive snapshot. These values remain
    // caller-owned references even when `immutableSnapshots` is enabled.
    if (isNonCloneableType(current)) return current;
    const objectValue = current as object;
    const existing = seen.get(objectValue);
    if (existing) return existing;

    if (current instanceof Map) {
      const guarded = guardSnapshotMap(current);
      seen.set(objectValue, guarded);
      // safeGet clones Map values but intentionally preserves keys. Do not
      // freeze those caller-owned key objects while hardening this snapshot.
      current.forEach((mapValue, key) => {
        const frozenValue = visit(mapValue);
        if (frozenValue !== mapValue) {
          (current as Map<unknown, unknown>).set(key, frozenValue);
        }
      });
      Object.freeze(guarded);
      return guarded;
    }

    if (current instanceof Set) {
      const guarded = guardSnapshotSet(current);
      seen.set(objectValue, guarded);
      const values = [...current];
      current.clear();
      for (const entry of values) current.add(visit(entry) as typeof entry);
      Object.freeze(guarded);
      return guarded;
    }

    if (current instanceof Date) {
      const guarded = guardSnapshotDate(current);
      seen.set(objectValue, guarded);
      Object.freeze(guarded);
      return guarded;
    }

    seen.set(objectValue, current);
    for (const key of Reflect.ownKeys(objectValue)) {
      const descriptor = Object.getOwnPropertyDescriptor(objectValue, key);
      if (!descriptor || !('value' in descriptor)) continue;
      const frozenValue = visit(descriptor.value);
      if (frozenValue !== descriptor.value && descriptor.writable) {
        (objectValue as Record<PropertyKey, unknown>)[key] = frozenValue;
      }
    }
    Object.freeze(objectValue);
    return current;
  };
  return visit(value) as T;
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
  private readonly patchListeners = new Set<
    (patches: readonly MutativePatch[] | null) => void
  >();
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

  subscribeWithPatches = (
    listener: (patches: readonly MutativePatch[] | null) => void,
  ): (() => void) => {
    if (this.disposed) return () => {};
    this.patchListeners.add(listener);
    return () => this.patchListeners.delete(listener);
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
    this.patchListeners.clear();
  };

  private publish(nextState: T, patches: Patches): void {
    if (patches.length === 0 && Object.is(nextState, this.value)) return;
    this.value = nextState;
    this.lastPatches = patches;
    this.version += 1;
    this.snapshot = snapshotOf(this.name, this.value, this.version, this.options.readMode);
    for (const listener of [...this.patchListeners]) {
      try {
        listener(patches);
      } catch (error) {
        reportListenerError(error, this.options.onListenerError);
      }
    }
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
  private readonly patchListeners = new Set<
    (patches: readonly MutativePatch[] | null) => void
  >();
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
  // TimeTravel cancellation emits a synthetic root-replace notification.
  // A failed metadata-wrapped mutation is not a committed backend transition,
  // so suppress that internal notification during rollback.
  private suppressNextTransitionNotification = false;
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
        if (this.suppressNextTransitionNotification) {
          this.suppressNextTransitionNotification = false;
          return;
        }
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

  subscribeWithPatches = (
    listener: (patches: readonly MutativePatch[] | null) => void,
  ): (() => void) => {
    if (this.disposed) return () => {};
    this.patchListeners.add(listener);
    return () => this.patchListeners.delete(listener);
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
    this.patchListeners.clear();
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
        this.suppressNextTransitionNotification = true;
        this.timeTravel.cancelBatch();
      } catch {
        // Preserve the original updater error.
      } finally {
        // Cancellation is currently synchronous. Always clear the guard so a
        // future history-engine implementation cannot swallow a real commit.
        this.suppressNextTransitionNotification = false;
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
    const patches = this.pendingPatches ?? this.lastPatches;
    this.pendingPatches = null;
    if (patches) {
      this.lastPatches = patches;
    }
    for (const listener of [...this.patchListeners]) {
      try {
        listener(patches);
      } catch (error) {
        reportListenerError(error, this.options.onListenerError);
      }
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
