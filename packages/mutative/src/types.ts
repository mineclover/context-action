import type {
  Options as MutativeOptions,
  Patches,
  Draft,
  Immutable,
  PatchesOptions,
} from '@context-action/mutative-core';

// ============================================================================
// Patch Types
// ============================================================================

export type PatchesOption = Exclude<PatchesOptions, boolean>;

export type TravelPatches<P extends PatchesOption = object> = {
  patches: Patches<P>[];
  inversePatches: Patches<P>[];
};

// ============================================================================
// Time Travel Types
// ============================================================================

export type TimeTravelOptions<
  F extends boolean = false,
  A extends boolean = true,
  P extends PatchesOption = object,
> = {
  /**
   * Maximum number of history entries to keep
   * @default 10
   */
  maxHistory?: number;

  /**
   * Initial position in history
   * @default 0
   */
  initialPosition?: number;

  /**
   * Initial patches for restoring history
   */
  initialPatches?: TravelPatches<P>;

  /**
   * Auto-archive mode - automatically save state changes
   * @default true
   */
  autoArchive?: A;

  /**
   * Mutable mode - apply patches in place (for observable state)
   * @default false
   */
  mutable?: boolean;

  /**
   * Patches options for mutative
   */
  patchesOptions?: P;

  /** Forwarded to @context-action/mutative-core. */
  enableAutoFreeze?: F;

  /** Reject non-draft replacement values in strict mode. */
  strict?: boolean;
} & Omit<
  MutativeOptions<true, F>,
  'enablePatches' | 'enableAutoFreeze' | 'strict'
>;

// ============================================================================
// Value Types
// ============================================================================

export type InitialValue<I> = I extends (...args: unknown[]) => infer R ? R : I;

export type DraftFunction<S> = (draft: Draft<S>) => void;

export type Updater<S> = S | (() => S) | DraftFunction<S>;

export type Value<S, F extends boolean> = F extends true
  ? Immutable<InitialValue<S>>
  : InitialValue<S>;

// ============================================================================
// Controls Types
// ============================================================================

export interface TimeTravelControls<
  S,
  F extends boolean = false,
  P extends PatchesOption = object,
> {
  /** Current position in history */
  readonly position: number;

  /** Get complete history of states */
  getHistory: () => readonly Value<S, F>[];

  /** All patches in history */
  readonly patches: TravelPatches<P>;

  /** Go back in history */
  back: (amount?: number) => void;

  /** Go forward in history */
  forward: (amount?: number) => void;

  /** Reset to initial state */
  reset: () => void;

  /** Go to specific position */
  go: (position: number) => void;

  /** Check if can go back */
  canBack: () => boolean;

  /** Check if can go forward */
  canForward: () => boolean;
}

export interface ManualTimeTravelControls<
  S,
  F extends boolean = false,
  P extends PatchesOption = object,
> extends TimeTravelControls<S, F, P> {
  /** Archive current temporary changes */
  archive: () => void;

  /** Check if can archive */
  canArchive: () => boolean;
}

// ============================================================================
// Listener Types
// ============================================================================

export type TimeTravelListener<S, P extends PatchesOption = object> = (
  state: S,
  patches: TravelPatches<P>,
  position: number,
  /** Patches applied by the state transition that triggered this notification. */
  changedPatches?: Patches<P>
) => void;

// ============================================================================
// Immutable Utils Types
// ============================================================================

export interface ImmutabilityOptions {
  /** Enable deep cloning */
  enableCloning?: boolean;
  /** Enable verification in development */
  enableVerification?: boolean;
  /** Warn on fallback methods */
  warnOnFallback?: boolean;
}

export interface ProduceOptions<F extends boolean = false> {
  /** Freeze returned state */
  freeze?: F;
  /** Enable patches generation */
  enablePatches?: boolean;
  /** Reject non-draft replacement values */
  strict?: boolean;
}

// ============================================================================
// Re-export mutative types
// ============================================================================

export type {
  Draft,
  Immutable,
  Patches,
  PatchesOptions,
} from '@context-action/mutative-core';
