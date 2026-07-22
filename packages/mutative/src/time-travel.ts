/**
 * @fileoverview Time Travel State Management
 *
 * Undo/redo functionality based on Mutative JSON Patches.
 * Inspired by mutativejs/travels with optimizations for Context-Action.
 */

import {
  create,
  apply,
  type Draft,
  type Patches,
  rawReturn,
} from '@context-action/mutative-core';
import type {
  PatchesOption,
  TravelPatches,
  TimeTravelOptions,
  TimeTravelControls,
  ManualTimeTravelControls,
  TimeTravelListener,
  Updater,
  Value,
} from './types';
import {
  isObjectLike,
  isPlainObject,
  hasOnlyArrayIndices,
  deepClone,
  createLogger,
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
  };
  private listeners = new Set<TimeTravelListener<S, P>>();
  private pendingState: S | null = null;
  private historyCache: { version: number; history: S[] } | null = null;
  private historyVersion = 0;
  private mutableFallbackWarned = false;

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

    // Validate maxHistory
    if (maxHistory < 0) {
      throw new Error(`TimeTravel: maxHistory must be non-negative, got ${maxHistory}`);
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

  private notify(changedPatches?: Patches<P>): void {
    this.listeners.forEach((listener) =>
      listener(this.state, this.getPatches(), this.position, changedPatches)
    );
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

    if (this.autoArchive) {
      this.archivePatches(patches, inversePatches);
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Archived patches, position now:', this.position);
      }
    } else {
      this.addTempPatches(patches, inversePatches);
    }

    this.invalidateHistoryCache();
    this.notify(patches);
  }

  private archivePatches(patches: Patches<P>, inversePatches: Patches<P>): void {
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
      this.position =
        this.maxHistory < this.allPatches.patches.length + 1
          ? this.maxHistory
          : this.position + 1;
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

    return history;
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
  go(nextPosition: number): void {
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
    this.notify(patchesToApply);
  }

  /**
   * Go back in history
   */
  back(amount = 1): void {
    this.go(this.position - amount);
  }

  /**
   * Go forward in history
   */
  forward(amount = 1): void {
    this.go(this.position + amount);
  }

  /**
   * Reset to initial state
   */
  reset(): void {
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

    this.invalidateHistoryCache();
    const rootPath =
      typeof this.options.enablePatches === 'object' &&
      this.options.enablePatches.pathAsArray === false
        ? ''
        : [];
    this.notify([
      { op: 'replace', path: rootPath, value: this.state },
    ] as unknown as Patches<P>);
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
