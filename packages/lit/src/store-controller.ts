/**
 * @fileoverview StoreController implementation bridging Context-Action stores to Lit's ReactiveController lifecycle.
 * @implements store-integration-pattern
 * @implements observer-pattern
 * @implements reactive-state-management
 * @memberof core-concepts
 */

import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type {
  EqualityFn,
  ReadableStore,
  Selector,
  StoreControllerOptions,
  Unsubscribe,
} from './types.js';

/**
 * ReactiveController that subscribes a Lit host element to a Context-Action store.
 *
 * Key guarantees:
 * 1. Attaches to host via `host.addController(this)`.
 * 2. Cleanly subscribes on connection or instantiation, refreshing snapshot immediately to close race gaps.
 * 3. Supports fine-grained selective projections with memoization (`equalityFn`), suppressing `host.requestUpdate()`.
 * 4. Ensures zero memory leaks by immediately and completely unsubscribing on `hostDisconnected()`.
 * 5. Automatically resubscribes and synchronizes state on `hostConnected()`.
 * 6. Completely decoupled from the DOM.
 *
 * @template T The raw state type managed by the store.
 * @template Selected The projected state type exposed by the controller (defaults to `T`).
 *
 * @implements store-integration-pattern
 * @memberof core-concepts
 */
export class StoreController<T = unknown, Selected = T> implements ReactiveController {
  readonly #host: ReactiveControllerHost;
  readonly #store: ReadableStore<T>;
  readonly #selector: Selector<T, Selected>;
  readonly #equalityFn: EqualityFn<Selected>;

  #unsubscribe: Unsubscribe | null = null;
  #selectedValue!: Selected;
  #isDisposed = false;

  constructor(
    host: ReactiveControllerHost,
    store: ReadableStore<T>,
    options?: StoreControllerOptions<T, Selected>
  ) {
    if (!host || typeof host.addController !== 'function') {
      throw new TypeError(
        'StoreController requires a valid ReactiveControllerHost implementing addController().'
      );
    }
    if (!store || (typeof store.getValue !== 'function' && typeof store.getSnapshot !== 'function')) {
      throw new TypeError(
        'StoreController requires a ReadableStore implementing getValue() or getSnapshot().'
      );
    }

    this.#host = host;
    this.#store = store;
    this.#selector = options?.selector ?? ((state: T) => state as unknown as Selected);
    this.#equalityFn = options?.equalityFn ?? Object.is;

    // Synchronously initialize the projected value from the store
    const initialRaw = this.#extractRawValue();
    this.#selectedValue = this.#selector(initialRaw);

    // Register with Lit's controller host
    this.#host.addController(this);

    // Subscribe immediately if host is connected or in a non-DOM environment (e.g. test mock).
    // If host is an unmounted DOM element (isConnected === false), defer until hostConnected().
    const isExplicitlyDisconnected =
      'isConnected' in this.#host &&
      typeof (this.#host as { isConnected?: unknown }).isConnected === 'boolean' &&
      !(this.#host as { isConnected?: boolean }).isConnected;

    if (!isExplicitlyDisconnected) {
      this.subscribe();
    }
  }

  /**
   * The current projected slice of store state.
   */
  get value(): Selected {
    return this.#selectedValue;
  }

  /**
   * Whether the controller currently holds an active store subscription.
   */
  get isSubscribed(): boolean {
    return this.#unsubscribe !== null;
  }

  /**
   * Extracts raw state from the store, prioritizing `getValue()` and falling back to `getSnapshot()`.
   */
  #extractRawValue(): T {
    if (typeof this.#store.getValue === 'function') {
      return this.#store.getValue();
    }
    if (typeof this.#store.getSnapshot === 'function') {
      const snap = this.#store.getSnapshot();
      if (snap !== null && typeof snap === 'object' && 'value' in snap) {
        return (snap as { value: T }).value;
      }
      return snap as T;
    }
    throw new TypeError(
      `StoreController: store${this.#store.name ? ` "${this.#store.name}"` : ''} does not provide a readable value.`
    );
  }

  /**
   * Change handler invoked by the store subscription.
   */
  #handleStoreUpdate = (): void => {
    if (this.#isDisposed || this.#unsubscribe === null) {
      return;
    }

    const nextRaw = this.#extractRawValue();
    const nextSelected = this.#selector(nextRaw);

    // Memoization: suppress update if selected state is equal per equalityFn
    if (!this.#equalityFn(this.#selectedValue, nextSelected)) {
      this.#selectedValue = nextSelected;
      this.#host.requestUpdate();
    }
  };

  /**
   * Subscribes to the store and closes the read/subscribe race gap.
   * Safe to call multiple times (idempotent).
   */
  subscribe(): void {
    if (this.#unsubscribe !== null) {
      // Already subscribed; refresh projection in case state changed
      this.#refresh(true);
      return;
    }

    this.#isDisposed = false;
    const unsub = this.#store.subscribe(this.#handleStoreUpdate);
    this.#unsubscribe = unsub;

    // Close the read/subscribe gap:
    // Read the latest state immediately after subscribing. If a change occurred during or right
    // before subscription, detect it and request update. If reading fails, cleanly unsubscribe.
    try {
      this.#refresh(true);
    } catch (error) {
      this.unsubscribe();
      throw error;
    }
  }

  /**
   * Unsubscribes from the store. Safe to call multiple times (idempotent).
   * Guarantees zero memory leaks by removing listeners from the store.
   */
  unsubscribe(): void {
    const unsub = this.#unsubscribe;
    this.#unsubscribe = null;
    if (unsub) {
      unsub();
    }
  }

  /**
   * Refreshes the projected value from the store.
   * @param requestUpdateIfChanged Whether to invoke `host.requestUpdate()` if the value changed.
   */
  #refresh(requestUpdateIfChanged: boolean): void {
    const freshRaw = this.#extractRawValue();
    const freshSelected = this.#selector(freshRaw);

    if (!this.#equalityFn(this.#selectedValue, freshSelected)) {
      this.#selectedValue = freshSelected;
      if (requestUpdateIfChanged) {
        this.#host.requestUpdate();
      }
    }
  }

  /**
   * Disposes the controller, unsubscribing from the store and unregistering from the host.
   */
  dispose(): void {
    this.#isDisposed = true;
    this.unsubscribe();
    if (typeof this.#host.removeController === 'function') {
      this.#host.removeController(this);
    }
  }

  /**
   * Lifecycle hook: invoked when host connects to the DOM.
   * Automatically resubscribes to the store and refreshes the snapshot.
   */
  hostConnected(): void {
    this.subscribe();
  }

  /**
   * Lifecycle hook: invoked when host disconnects from the DOM.
   * Immediately unbinds all store subscriptions to ensure zero memory leaks.
   */
  hostDisconnected(): void {
    this.unsubscribe();
  }
}
