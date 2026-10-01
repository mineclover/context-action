/**
 * @fileoverview Time Travel State Management
 *
 * Undo/redo functionality based on Mutative JSON Patches.
 * Inspired by mutativejs/travels with optimizations for Context-Action.
 */

import {
  apply,
  create,
  type Draft,
  type Patches,
  rawReturn,
} from '@context-action/mutative-core';
import type {
  ManualTimeTravelControls,
  PatchesOption,
  TimeTravelControls,
  TimeTravelListener,
  TimeTravelOptions,
  TimeTravelTransitionMeta,
  TravelPatches,
  Updater,
  Value,
} from './types';
import { safeGet } from './immutable';
import {
  createLogger,
  deepClone,
  hasOnlyArrayIndices,
  isObjectLike,
  isPlainObject,
} from './utils';

const logger = createLogger('time-travel');

// ============================================================================
// Helper Functions
// ============================================================================

function cloneTravelPatches<P extends PatchesOption = object>(
  base?: TravelPatches<P>
): TravelPatches<P> {
  return {
    patches: base ? base.patches.map((patch) => [...patch]) : [],
    inversePatches: base ? base.inversePatches.map((patch) => [...patch]) : [],
  };
}

function overwriteDraftWith(draft: Draft<unknown>, value: unknown): void {
  if (draft instanceof Map && value instanceof Map) {
    draft.clear();
    value.forEach((entryValue, key) => draft.set(key, entryValue));
    return;
  }

  if (draft instanceof Set && value instanceof Set) {
    draft.clear();
    value.forEach((entryValue) => draft.add(entryValue));
    return;
  }

  const draftIsArray = Array.isArray(draft);
  const valueIsArray = Array.isArray(value);
  const draftKeys = Reflect.ownKeys(draft as object);

  for (const key of draftKeys) {
    if (draftIsArray && key === 'length') continue;
    if (Object.getOwnPropertyDescriptor(Object(value), key) === undefined) {
      delete (draft as Record<PropertyKey, unknown>)[key];
    }
  }

  if (draftIsArray && valueIsArray) {
    (draft as unknown[]).length = (value as unknown[]).length;
  }

  Object.assign(draft as object, value);
}

// ============================================================================
// TimeTravel Class
// ============================================================================

/**
 * TimeTravel - Undo/Redo state management with Mutative
 *
 * @example
 * ```ts
 * const timeTravel = new TimeTravel({ count: 0 }, { maxHistory: 50 });
 *
 * // Update state
 * timeTravel.setState((draft) => { draft.count++; });
 *
 * // Undo/Redo
 * timeTravel.back();
 * timeTravel.forward();
 *
 * // Get controls for UI
 * const controls = timeTravel.getControls();
 * ```
 */
export class TimeTravel<
  S,
  F extends boolean = false,
  A extends boolean = true,
  P extends PatchesOption = object,
> {
  public readonly mutable: boolean;

  private state: S;
  private position: number;
  private allPatches: TravelPatches<P>;
  private tempPatches: TravelPatches<P>;
  private maxHistory: number;
  private initialState: S;
  private initialPosition: number;
  private initialPatches?: TravelPatches<P>;
  private autoArchive: A;
  private options: {
    enablePatches: true | P;
    strict?: boolean;
    enableAutoFreeze?: F;
    onListenerError?: (error: unknown) => void;
  };
  private listeners = new Set<TimeTravelListener<S, P>>();
  private pendingState: S | null = null;
  private historyCache: { version: number; history: S[] } | null = null;
  private historyVersion = 0;
  private entrySequence = 0;
  private historyEntryIds: number[] = [];
  private mutableFallbackWarned = false;
  private batchDepth = 0;
  private batchFrames: Array<{
    state: S;
    position: number;
    allPatches: TravelPatches<P>;
    tempPatches: TravelPatches<P>;
    entryIds: number[];
    changed: boolean;
    metadata?: TimeTravelTransitionMeta;
    stateReference: S;
  }> = [];
  private batchChanged = false;
  private batchMeta: TimeTravelTransitionMeta | undefined;

  constructor(initialState: S, options: TimeTravelOptions<F, A, P> = {} as TimeTravelOptions<F, A, P>) {
    const {
      maxHistory = 10,
      initialPatches,
      initialPosition = 0,
      autoArchive = true as A,
      mutable = false,
      patchesOptions,
      strict,
      enableAutoFreeze,
    } = options;

    // History arithmetic uses array positions, so accepting fractional or
    // non-finite values would corrupt the cursor and eventually make replay
    // apply an undefined patch entry.
    if (!Number.isSafeInteger(maxHistory) || maxHistory < 0) {
      throw new RangeError(
        `TimeTravel: maxHistory must be a non-negative safe integer, got ${maxHistory}`,
      );
    }

    if (!Number.isSafeInteger(initialPosition) || initialPosition < 0) {
      throw new RangeError(
        `TimeTravel: initialPosition must be a non-negative safe integer, got ${initialPosition}`,
      );
    }

    if (maxHistory === 0 && process.env.NODE_ENV !== 'production') {
      logger.warn('maxHistory is 0, undo/redo history is disabled');
    }

    this.state = initialState;
    this.initialState = mutable ? deepClone(initialState) : initialState;
    this.maxHistory = maxHistory;
    this.autoArchive = autoArchive;
    this.mutable = mutable;
    this.options = {
      enablePatches: patchesOptions ?? true,
      strict,
      enableAutoFreeze,
      onListenerError: options.onListenerError,
    };

    const { patches: normalizedPatches, position: normalizedPosition } =
      this.normalizeInitialHistory(initialPatches, initialPosition);

    this.allPatches = normalizedPatches;
    this.initialPatches = initialPatches
      ? cloneTravelPatches(normalizedPatches)
      : undefined;
    this.position = normalizedPosition;
    this.initialPosition = normalizedPosition;
    this.tempPatches = cloneTravelPatches();
    this.historyEntryIds = Array.from({ length: normalizedPatches.patches.length + 1 }, () => ++this.entrySequence);
  }

  private normalizeInitialHistory(
    initialPatches: TravelPatches<P> | undefined,
    initialPosition: number
  ): { patches: TravelPatches<P>; position: number } {
    const cloned = cloneTravelPatches(initialPatches);
    const total = cloned.patches.length;
    const historyLimit = this.maxHistory > 0 ? this.maxHistory : 0;
    let position = typeof initialPosition === 'number' && Number.isFinite(initialPosition)
      ? initialPosition
      : 0;
    const clampedPosition = Math.max(0, Math.min(position, total));

    if (clampedPosition !== position && process.env.NODE_ENV !== 'production') {
      logger.warn(
        `initialPosition (${initialPosition}) clamped to ${clampedPosition}`
      );
    }
    position = clampedPosition;

    if (total === 0) {
      return { patches: cloned, position: 0 };
    }

    if (historyLimit === 0) {
      return { patches: cloneTravelPatches(), position: 0 };
    }

    if (historyLimit >= total) {
      return { patches: cloned, position };
    }

    // Trim to maxHistory
    const trim = total - historyLimit;
    const trimmed = {
      patches: cloned.patches.slice(-historyLimit),
      inversePatches: cloned.inversePatches.slice(-historyLimit),
    } as TravelPatches<P>;

    return {
      patches: cloneTravelPatches(trimmed),
      position: Math.max(0, Math.min(historyLimit, position - trim)),
    };
  }

  private invalidateHistoryCache(): void {
    this.historyVersion++;
    this.historyCache = null;
  }

  private notify(changedPatches?: Patches<P>, metadata?: TimeTravelTransitionMeta): void {
    // Snapshot the set so subscriptions added during a notification observe
    // the next transition. Unsubscribed listeners are skipped immediately.
    for (const listener of [...this.listeners]) {
      if (!this.listeners.has(listener)) continue;
      try {
        listener(this.state, this.getPatches(), this.position, changedPatches, metadata);
      } catch (error) {
        try {
          this.options.onListenerError?.(error);
        } catch {
          // Error observers must not alter the state transition outcome.
        }
        if (!this.options.onListenerError && process.env.NODE_ENV !== 'production') {
          logger.error('TimeTravel listener failed', error);
        }
      }
    }
  }

  private hasRootReplacement(patches: Patches<P>): boolean {
    return patches.some(
      (patch) =>
        Array.isArray(patch.path) &&
        patch.path.length === 0 &&
        patch.op === 'replace'
    );
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Subscribe to state changes
   */
  subscribe = (listener: TimeTravelListener<S, P>): (() => void) => {
    if (typeof listener !== 'function') {
      throw new TypeError('TimeTravel.subscribe requires a listener function');
    }
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /**
   * Get current state
   */
  getState = (): S => this.state;

  /**
   * Update state with new value or updater function
   */
  setState(updater: Updater<S>): void {
    let patches: Patches<P>;
    let inversePatches: Patches<P>;

    const canUseMutableRoot = this.mutable && isObjectLike(this.state);
    const isFunctionUpdater = typeof updater === 'function';
    const stateIsArray = Array.isArray(this.state);
    const updaterIsArray = Array.isArray(updater);
    const canMutatePlainObjects =
      !stateIsArray &&
      !updaterIsArray &&
      isPlainObject(this.state) &&
      isPlainObject(updater);
    const canMutateArrays =
      stateIsArray &&
      updaterIsArray &&
      hasOnlyArrayIndices(this.state) &&
      hasOnlyArrayIndices(updater);
    const canMutateWithValue =
      canUseMutableRoot &&
      !isFunctionUpdater &&
      (canMutateArrays || canMutatePlainObjects);
    const useMutable =
      (isFunctionUpdater && canUseMutableRoot) || canMutateWithValue;

    if (this.mutable && !canUseMutableRoot && !this.mutableFallbackWarned) {
      this.mutableFallbackWarned = true;
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('mutable mode requires object root, falling back to immutable');
      }
    }

    if (useMutable) {
      let nextState: S;
      [nextState, patches, inversePatches] = create(
        this.state,
        isFunctionUpdater
          ? (updater as (draft: Draft<S>) => void)
          : (draft: Draft<S>) => {
              overwriteDraftWith(draft, updater);
            },
        this.options
      ) as [S, Patches<P>, Patches<P>];

      if (this.hasRootReplacement(patches)) {
        // A mutable patch application cannot replace the caller's root
        // reference. Keep the finalized replacement returned by create().
        this.state = nextState;
      } else {
        apply(this.state as object, patches, { mutable: true });
      }
      this.pendingState = this.state;
    } else {
      const [nextState, p, ip] = (
        typeof updater === 'function'
          ? create(this.state, updater as (draft: Draft<S>) => void, this.options)
          : isObjectLike(this.state) && isObjectLike(updater)
            ? // For object-to-object updates, use draft mutation to get proper patches
              create(
                this.state,
                (draft: Draft<S>) => {
                  overwriteDraftWith(draft, updater);
                },
                this.options
              )
            : // For non-object values, use rawReturn
              create(
                this.state,
                () => (isObjectLike(updater) ? (rawReturn(updater as object) as S) : (updater as S)),
                this.options
              )
      ) as [S, Patches<P>, Patches<P>];

      patches = p;
      inversePatches = ip;
      this.state = nextState;
      this.pendingState = nextState;
    }

    Promise.resolve().then(() => {
      this.pendingState = null;
    });

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('setState patches:', patches.length, 'inverse:', inversePatches.length);
    }

    if (patches.length === 0 && inversePatches.length === 0) {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('No patches generated, skipping update');
      }
      return;
    }

    if (this.batchDepth > 0) {
      this.batchChanged = true;
      return;
    }

    this.commitPatches(patches, inversePatches);
  }

  beginBatch(metadata?: TimeTravelTransitionMeta): void {
    if (this.batchDepth === 0) {
      this.batchChanged = false;
      this.batchMeta = metadata;
    }
    this.batchFrames.push({
      state: deepClone(this.state),
      position: this.position,
      allPatches: cloneTravelPatches(this.allPatches),
      tempPatches: cloneTravelPatches(this.tempPatches),
      entryIds: [...this.historyEntryIds],
      changed: this.batchChanged,
      metadata: this.batchMeta,
      stateReference: this.state,
    });
    this.batchDepth += 1;
  }

  endBatch(): void {
    if (this.batchDepth === 0) throw new Error('TimeTravel batch is not active');
    if (this.batchDepth > 1) {
      this.batchFrames.pop();
      this.batchDepth -= 1;
      return;
    }

    // Keep the final frame active until patch derivation succeeds. If the
    // derivation fails, cancelBatch() can still restore the pre-batch state.
    const frame = this.batchFrames[this.batchFrames.length - 1]!;

    const changed = this.batchChanged;
    const transitionMeta = this.batchMeta;
    if (!changed) {
      this.batchFrames.pop();
      this.batchDepth = 0;
      this.batchChanged = false;
      this.batchMeta = undefined;
      return;
    }

    let patches: Patches<P>;
    let inversePatches: Patches<P>;
    try {
      [, patches, inversePatches] = create(
        frame.state,
        (draft): S | undefined => {
          if (isObjectLike(frame.state) && isObjectLike(this.state)) {
            overwriteDraftWith(draft, this.state);
            return;
          }
          return isObjectLike(this.state) ? rawReturn(this.state as object) as S : this.state;
        },
        this.options,
      ) as [S, Patches<P>, Patches<P>];
    } catch (error) {
      this.cancelBatch();
      throw error;
    }

    this.batchFrames.pop();
    this.batchDepth = 0;
    this.batchChanged = false;
    this.batchMeta = undefined;
    if (patches.length > 0 || inversePatches.length > 0) {
      this.commitPatches(patches, inversePatches, transitionMeta);
    }
  }

  /** Restore the active batch without archiving its rejected changes. */
  cancelBatch(): void {
    if (this.batchDepth === 0) throw new Error('TimeTravel batch is not active');
    const frame = this.batchFrames.pop()!;
    this.batchDepth -= 1;
    // Mutable mode promises a stable root reference. Restore in place when
    // the batch did not replace that root; root replacement rolls back to the
    // original reference captured in stateReference.
    if (
      this.mutable &&
      isObjectLike(frame.stateReference) &&
      this.state === frame.stateReference &&
      isObjectLike(frame.state)
    ) {
      const [, restorePatches] = create(
        this.state,
        (draft) => overwriteDraftWith(draft, frame.state),
        this.options,
      ) as [S, Patches<P>, Patches<P>];
      if (restorePatches.length > 0) {
        apply(this.state as object, restorePatches, { mutable: true });
      }
      this.state = frame.stateReference;
    } else {
      this.state = frame.stateReference;
    }
    this.position = frame.position;
    this.allPatches = frame.allPatches;
    this.tempPatches = frame.tempPatches;
    this.historyEntryIds = frame.entryIds;
    this.pendingState = null;
    this.invalidateHistoryCache();
    this.batchChanged = frame.changed;
    this.batchMeta = frame.metadata;

    if (this.batchDepth > 0) {
      // An outer batch may still contain updates from before this nested batch.
      return;
    }

    this.batchChanged = false;
    this.batchMeta = undefined;
    const rootPath =
      typeof this.options.enablePatches === 'object' &&
      this.options.enablePatches.pathAsArray === false
        ? ''
        : [];
    // Cancellation restores the pre-batch snapshot; it is not a committed
    // transition and must not retain the rejected transaction metadata.
    this.notify([{ op: 'replace', path: rootPath, value: this.state }] as unknown as Patches<P>);
  }

  /** Group synchronous or asynchronous updates into one history entry. */
  batch<R>(callback: () => R, metadata?: TimeTravelTransitionMeta): R {
    this.beginBatch(metadata);

    try {
      const result = callback();
      if (result && typeof (result as { then?: unknown }).then === 'function') {
        return (result as unknown as Promise<unknown>).then(
          value => { this.endBatch(); return value; },
          error => {
            try {
              this.cancelBatch();
            } catch {
              // Preserve the callback's rejection as the public error.
            }
            throw error;
          },
        ) as R;
      }
      this.endBatch();
      return result;
    } catch (error) {
      try {
        this.cancelBatch();
      } catch {
        // Preserve the callback's original error if rollback itself fails.
      }
      throw error;
    }
  }

  private commitPatches(
    patches: Patches<P>,
    inversePatches: Patches<P>,
    metadata?: TimeTravelTransitionMeta,
  ): void {

    if (this.autoArchive) {
      this.archivePatches(patches, inversePatches);
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Archived patches, position now:', this.position);
      }
    } else {
      this.addTempPatches(patches, inversePatches);
    }

    this.invalidateHistoryCache();
    this.notify(patches, metadata);
  }

  private archivePatches(patches: Patches<P>, inversePatches: Patches<P>): void {
    this.historyEntryIds = this.historyEntryIds.slice(0, this.position + 1);
    this.historyEntryIds.push(++this.entrySequence);
    if (this.position < this.allPatches.patches.length) {
      this.allPatches.patches.splice(this.position);
      this.allPatches.inversePatches.splice(this.position);
    }

    this.allPatches.patches.push(patches);
    this.allPatches.inversePatches.push(inversePatches);

    this.position =
      this.maxHistory < this.allPatches.patches.length
        ? this.maxHistory
        : this.position + 1;

    if (this.maxHistory < this.allPatches.patches.length) {
      this.historyEntryIds = this.historyEntryIds.slice(-(this.maxHistory + 1));
      if (this.maxHistory === 0) {
        this.allPatches.patches = [];
        this.allPatches.inversePatches = [];
      } else {
        this.allPatches.patches = this.allPatches.patches.slice(-this.maxHistory);
        this.allPatches.inversePatches = this.allPatches.inversePatches.slice(-this.maxHistory);
      }
    }
  }

  private addTempPatches(patches: Patches<P>, inversePatches: Patches<P>): void {
    const notLast =
      this.position <
      this.allPatches.patches.length + (this.tempPatches.patches.length ? 1 : 0);

    if (notLast) {
      this.allPatches.patches.splice(this.position);
      this.allPatches.inversePatches.splice(this.position);
      this.tempPatches.patches.length = 0;
      this.tempPatches.inversePatches.length = 0;
    }

    if (!this.tempPatches.patches.length || notLast) {
      this.historyEntryIds = this.historyEntryIds.slice(0, this.position + 1);
      this.historyEntryIds.push(++this.entrySequence);
      this.position =
        this.maxHistory < this.allPatches.patches.length + 1
          ? this.maxHistory
          : this.position + 1;
    } else {
      this.historyEntryIds[this.historyEntryIds.length - 1] = ++this.entrySequence;
    }

    this.tempPatches.patches.push(patches);
    this.tempPatches.inversePatches.push(inversePatches);
  }

  /**
   * Archive temporary patches (manual mode only)
   */
  archive(): void {
    if (this.autoArchive) {
      logger.warn('Auto archive is enabled, manual archive not needed');
      return;
    }

    if (!this.tempPatches.patches.length) return;

    const stateToUse = (this.pendingState ?? this.state) as object;
    const [, patches, inversePatches] = create(
      stateToUse,
      (draft) => apply(draft, this.tempPatches.inversePatches.flat().reverse()),
      this.options
    ) as [S, Patches<P>, Patches<P>];

    this.allPatches.patches.push(inversePatches);
    this.allPatches.inversePatches.push(patches);

    if (this.maxHistory < this.allPatches.patches.length) {
      this.historyEntryIds = this.historyEntryIds.slice(-(this.maxHistory + 1));
      if (this.maxHistory === 0) {
        this.allPatches.patches = [];
        this.allPatches.inversePatches = [];
      } else {
        this.allPatches.patches = this.allPatches.patches.slice(-this.maxHistory);
        this.allPatches.inversePatches = this.allPatches.inversePatches.slice(-this.maxHistory);
      }
    }

    this.tempPatches.patches.length = 0;
    this.tempPatches.inversePatches.length = 0;

    this.invalidateHistoryCache();
    this.notify([]);
  }

  /**
   * Get complete history of states
   */
  getHistory(): readonly S[] {
    if (this.historyCache?.version === this.historyVersion) {
      return this.historyCache.history;
    }

    const history: S[] = [this.state];
    let currentState = this.state;
    const _allPatches = this.getAllPatches();

    const patches = !this.autoArchive && _allPatches.patches.length > this.maxHistory
      ? _allPatches.patches.slice(-this.maxHistory)
      : _allPatches.patches;
    const inversePatches = !this.autoArchive && _allPatches.inversePatches.length > this.maxHistory
      ? _allPatches.inversePatches.slice(-this.maxHistory)
      : _allPatches.inversePatches;

    // Build future history
    for (let i = this.position; i < patches.length; i++) {
      currentState = apply(currentState as object, patches[i]!) as S;
      history.push(currentState);
    }

    // Build past history
    currentState = this.state;
    for (let i = this.position - 1; i > -1; i--) {
      currentState = apply(currentState as object, inversePatches[i]!) as S;
      history.unshift(currentState);
    }

    this.historyCache = { version: this.historyVersion, history };

    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(history);
    }

    // History is an inspection API. Return defensive values so mutating a
    // returned entry cannot mutate the live cursor or poison the cache via
    // structural sharing between replayed states.
    return history.map((entry) => safeGet(entry, true));
  }

  private getAllPatches(): TravelPatches<P> {
    if (!this.autoArchive && this.tempPatches.patches.length) {
      return {
        patches: this.allPatches.patches.concat([this.tempPatches.patches.flat()]),
        inversePatches: this.allPatches.inversePatches.concat([
          this.tempPatches.inversePatches.flat().reverse(),
        ]),
      };
    }
    return this.allPatches;
  }

  /**
   * Go to specific position in history
   */
  go(nextPosition: number, metadata?: TimeTravelTransitionMeta): void {
    if (!Number.isSafeInteger(nextPosition) || nextPosition < 0) {
      throw new RangeError('TimeTravel position must be a non-negative safe integer');
    }
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`go(${nextPosition}) - current position: ${this.position}`);
    }

    if (!this.autoArchive && this.tempPatches.patches.length) {
      this.archive();
    }

    const _allPatches = this.getAllPatches();
    const back = nextPosition < this.position;

    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`go - patches count: ${_allPatches.patches.length}, going ${back ? 'back' : 'forward'}`);
    }

    if (nextPosition > _allPatches.patches.length) {
      logger.warn(`Can't go forward to position ${nextPosition}`);
      nextPosition = _allPatches.patches.length;
    }

    if (nextPosition < 0) {
      logger.warn(`Can't go back to position ${nextPosition}`);
      nextPosition = 0;
    }

    if (nextPosition === this.position) {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('go - already at target position, skipping');
      }
      return;
    }

    const patchesToApply = back
      ? _allPatches.inversePatches
          .slice(-this.maxHistory)
          .slice(nextPosition, this.position)
          .flat()
          .reverse()
      : _allPatches.patches
          .slice(-this.maxHistory)
          .slice(this.position, nextPosition)
          .flat();

    const canGoMutably =
      this.mutable &&
      isObjectLike(this.state) &&
      !this.hasRootReplacement(patchesToApply);

    if (canGoMutably) {
      apply(this.state as object, patchesToApply, { mutable: true });
    } else {
      this.state = apply(this.state as object, patchesToApply) as S;
    }

    this.position = nextPosition;
    this.invalidateHistoryCache();
    this.notify(patchesToApply, metadata);
  }

  /**
   * Go back in history
   */
  back(amount = 1, metadata?: TimeTravelTransitionMeta): void {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new RangeError('TimeTravel back amount must be a non-negative safe integer');
    }
    // Undo is a bounded cursor operation. Overstepping the beginning should
    // converge on the initial retained entry, just as forward() converges on
    // the newest retained entry when it oversteps the end.
    this.go(Math.max(0, this.position - amount), metadata);
  }

  /**
   * Go forward in history
   */
  forward(amount = 1, metadata?: TimeTravelTransitionMeta): void {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new RangeError('TimeTravel forward amount must be a non-negative safe integer');
    }
    this.go(this.position + amount, metadata);
  }

  /**
   * Reset to initial state
   */
  reset(metadata?: TimeTravelTransitionMeta): void {
    const canResetMutably =
      this.mutable && isObjectLike(this.state) && isObjectLike(this.initialState);

    if (canResetMutably) {
      const initialValue = deepClone(this.initialState);
      const [, patches] = create(
        this.state,
        (draft) => overwriteDraftWith(draft, initialValue),
        this.options
      );
      apply(this.state as object, patches, { mutable: true });
    } else {
      this.state = this.initialState;
    }

    this.position = this.initialPosition;
    this.allPatches = cloneTravelPatches(this.initialPatches);
    this.tempPatches = cloneTravelPatches();

    // Reset creates a new timeline generation, including when its values
    // happen to match a previous entry. Old transaction identities expire.
    this.historyEntryIds = Array.from({ length: this.allPatches.patches.length + 1 }, () => ++this.entrySequence);

    this.invalidateHistoryCache();
    const rootPath =
      typeof this.options.enablePatches === 'object' &&
      this.options.enablePatches.pathAsArray === false
        ? ''
        : [];
    this.notify(
      [
        { op: 'replace', path: rootPath, value: this.state },
      ] as unknown as Patches<P>,
      metadata,
    );
  }

  /**
   * Check if can go back
   */
  canBack(): boolean {
    return this.position > 0;
  }

  /**
   * Check if can go forward
   */
  canForward(): boolean {
    const hasTemp = !this.autoArchive && this.tempPatches.patches.length > 0;
    const _allPatches = this.getAllPatches();
    return hasTemp
      ? this.position < _allPatches.patches.length - 1
      : this.position < _allPatches.patches.length;
  }

  /**
   * Check if can archive (manual mode)
   */
  canArchive(): boolean {
    return !this.autoArchive && this.tempPatches.patches.length > 0;
  }

  /**
   * Get current position
   */
  getPosition(): number {
    return this.position;
  }

  /** Stable identity of the current entry, independent of a bounded cursor. */
  getHistoryEntryId(): number {
    return this.historyEntryIds[this.position]!;
  }

  /** Whether an entry remains available in the retained timeline. */
  hasHistoryEntry(entryId: number): boolean {
    return this.historyEntryIds.includes(entryId);
  }

  /** Replay an exact retained entry; reject trimmed or replaced branches. */
  goToHistoryEntry(entryId: number, metadata?: TimeTravelTransitionMeta): void {
    const position = this.historyEntryIds.indexOf(entryId);
    if (position < 0) throw new Error(`History entry ${entryId} is no longer retained`);
    this.go(position, metadata);
  }

  /**
   * Get all patches
   */
  getPatches(): TravelPatches<P> {
    return !this.autoArchive && this.tempPatches.patches.length
      ? this.getAllPatches()
      : this.allPatches;
  }

  /**
   * Get controls object for external use
   */
  getControls(): A extends true
    ? TimeTravelControls<S, F, P>
    : ManualTimeTravelControls<S, F, P> {
    const self = this;

    const controls: TimeTravelControls<S, F, P> | ManualTimeTravelControls<S, F, P> = {
      get position(): number {
        return self.getPosition();
      },
      getHistory: () => self.getHistory() as Value<S, F>[],
      get patches(): TravelPatches<P> {
        return self.getPatches();
      },
      back: (amount?: number) => self.back(amount),
      forward: (amount?: number) => self.forward(amount),
      reset: () => self.reset(),
      go: (position: number) => self.go(position),
      canBack: () => self.canBack(),
      canForward: () => self.canForward(),
    };

    if (!this.autoArchive) {
      (controls as ManualTimeTravelControls<S, F, P>).archive = () => self.archive();
      (controls as ManualTimeTravelControls<S, F, P>).canArchive = () => self.canArchive();
    }

    return controls as A extends true
      ? TimeTravelControls<S, F, P>
      : ManualTimeTravelControls<S, F, P>;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a TimeTravel instance with auto archive mode
 */
export function createTimeTravel<
  S,
  F extends boolean = false,
  P extends PatchesOption = object,
>(
  initialState: S,
  options?: Omit<TimeTravelOptions<F, true, P>, 'autoArchive'> & {
    autoArchive?: true;
  }
): TimeTravel<S, F, true, P>;

/**
 * Create a TimeTravel instance with manual archive mode
 */
export function createTimeTravel<
  S,
  F extends boolean = false,
  P extends PatchesOption = object,
>(
  initialState: S,
  options: Omit<TimeTravelOptions<F, false, P>, 'autoArchive'> & {
    autoArchive: false;
  }
): TimeTravel<S, F, false, P>;

/**
 * Create a TimeTravel instance
 */
export function createTimeTravel<
  S,
  F extends boolean,
  A extends boolean,
  P extends PatchesOption = object,
>(
  initialState: S,
  options: TimeTravelOptions<F, A, P> = {} as TimeTravelOptions<F, A, P>
): TimeTravel<S, F, A, P> {
  return new TimeTravel(initialState, options);
}
