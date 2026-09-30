/**
 * @fileoverview Type definitions for the Lit integration of Context-Action.
 * @implements store-integration-pattern
 * @implements model-layer
 * @implements reactive-state-management
 * @memberof core-concepts
 */

/**
 * Change notification callback function.
 * Invoked synchronously or batch-scheduled when store state changes.
 */
export type Listener = () => void;

/**
 * Cleanup function to terminate a store subscription.
 */
export type Unsubscribe = () => void;

/**
 * Minimal structural interface for stores readable by Lit controllers.
 * Decoupled from React, allowing seamless interoperability with
 * `@context-action/react` stores, `@context-action/preact` sources, or custom reactive containers.
 *
 * @template T The type of state managed by the store.
 * @implements store-interface
 * @memberof api-terms
 */
export interface ReadableStore<T = unknown> {
  /**
   * Retrieves the current state value synchronously.
   */
  getValue(): T;

  /**
   * Subscribes a listener to receive notifications when state changes.
   * @param listener Callback invoked when the store value updates.
   * @returns Unsubscribe function to terminate the subscription.
   */
  subscribe(listener: Listener): Unsubscribe;

  /**
   * Optional snapshot retrieval function (e.g. for React useSyncExternalStore or metadata snapshots).
   */
  getSnapshot?(): unknown;

  /**
   * Optional human-readable store name for debugging and diagnostics.
   */
  readonly name?: string;
}

/**
 * Projection selector function mapping root state `T` to a derived slice `Selected`.
 *
 * @template T Source state type.
 * @template Selected Projected output type.
 */
export type Selector<T, Selected> = (state: T) => Selected;

/**
 * Comparator determining whether two projected values are equivalent.
 * When it returns `true`, re-renders are suppressed.
 *
 * @template Selected Projected output type.
 */
export type EqualityFn<Selected> = (prev: Selected, next: Selected) => boolean;

/**
 * Configuration options for `StoreController`.
 *
 * @template T Source state type.
 * @template Selected Projected output type.
 * @implements store-integration-pattern
 * @memberof api-terms
 */
export interface StoreControllerOptions<T, Selected = T> {
  /**
   * Optional projection function to select a slice of the store state.
   * Defaults to identity function `(state) => state`.
   */
  selector?: Selector<T, Selected>;

  /**
   * Optional equality comparator used to prevent unnecessary re-renders.
   * Defaults to `Object.is`.
   */
  equalityFn?: EqualityFn<Selected>;
}
