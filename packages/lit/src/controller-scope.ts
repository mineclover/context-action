/**
 * @fileoverview Deterministic LIFO lifecycle scope for Lit ReactiveControllers,
 * store subscriptions, and arbitrary cleanup callbacks.
 *
 * @implements reactive-state-management
 * @implements observer-pattern
 * @memberof core-concepts
 */

import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * Configuration for {@link ControllerScope}.
 */
export interface ControllerScopeOptions {
  /**
   * Dispose the scope automatically when the host disconnects.
   *
   * Defaults to `false`; enable it when a scope represents one connection
   * session and the owner creates a fresh scope on the next `hostConnected()`.
   */
  autoDisposeOnDisconnect?: boolean;

  /** Alias for {@link autoDisposeOnDisconnect}. */
  disposeOnDisconnect?: boolean;

  /** Alias for {@link autoDisposeOnDisconnect}. */
  autoDispose?: boolean;
}

type ScopeEntry =
  | { readonly kind: 'controller'; readonly controller: ReactiveController }
  | { readonly kind: 'cleanup'; readonly cleanup: () => void };

function disposeController(controller: ReactiveController): void {
  const errors: unknown[] = [];
  const disposable = controller as ReactiveController & { dispose?: () => void };

  // Mirror Lit's own lifecycle first, then run an explicit dispose() when the
  // controller provides one. Controllers that combine both are expected to be
  // idempotent (StoreController is).
  if (typeof controller.hostDisconnected === 'function') {
    try {
      controller.hostDisconnected();
    } catch (error) {
      errors.push(error);
    }
  }

  if (typeof disposable.dispose === 'function') {
    try {
      disposable.dispose();
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, 'ReactiveController disposal failed');
  }
}

function readAutoDispose(options?: ControllerScopeOptions): boolean {
  return (
    options?.autoDisposeOnDisconnect ??
    options?.disposeOnDisconnect ??
    options?.autoDispose ??
    false
  );
}

/**
 * Container that owns ReactiveControllers and cleanup callbacks for one
 * connection session.
 *
 * Guarantees:
 * - Entries are disposed in reverse registration order (LIFO), so child parts
 *   and downstream subscriptions are released before their providers.
 * - A thrown cleanup does not stop the remaining cleanups; all failures are
 *   collected into one `AggregateError`.
 * - Adding to an already-disposed scope disposes the new entry immediately, so
 *   late registrations cannot leak.
 * - A disposed scope is terminal. On reconnect, owners create a new scope
 *   rather than reusing the previous one.
 *
 * @example
 * ```ts
 * class TimelineElement extends LitElement {
 *   #scope = new ControllerScope(this, { autoDisposeOnDisconnect: true });
 *
 *   constructor() {
 *     super();
 *     const store = new StoreController(this, timelineStore);
 *     this.#scope.add(store);
 *     this.#scope.addCleanup(() => this.#detachPlayhead());
 *   }
 *
 *   override connectedCallback() {
 *     super.connectedCallback();
 *     if (this.#scope.disposed) {
 *       this.#scope = new ControllerScope(this, { autoDisposeOnDisconnect: true });
 *     }
 *   }
 * }
 * ```
 */
export class ControllerScope implements ReactiveController {
  readonly #host: ReactiveControllerHost;
  readonly #autoDisposeOnDisconnect: boolean;
  readonly #entries: ScopeEntry[] = [];
  #disposed = false;

  constructor(host: ReactiveControllerHost, options?: ControllerScopeOptions) {
    if (!host || typeof host.addController !== 'function') {
      throw new TypeError(
        'ControllerScope requires a valid ReactiveControllerHost implementing addController().',
      );
    }

    this.#host = host;
    this.#autoDisposeOnDisconnect = readAutoDispose(options);
    host.addController(this);
  }

  /** Whether this scope has already been disposed. */
  get disposed(): boolean {
    return this.#disposed;
  }

  /** Number of entries that have not been disposed yet. */
  get size(): number {
    return this.#entries.length;
  }

  /**
   * Registers a ReactiveController for LIFO disposal.
   *
   * Registration order defines teardown order: register providers first and
   * dependent child parts later, so children disconnect before parents.
   */
  add(controller: ReactiveController): void {
    if (!controller || typeof controller !== 'object') {
      throw new TypeError('ControllerScope.add() requires a ReactiveController object.');
    }

    if (this.#disposed) {
      disposeController(controller);
      return;
    }

    this.#entries.push({ kind: 'controller', controller });
  }

  /**
   * Registers an arbitrary cleanup callback for LIFO disposal.
   *
   * Adding a cleanup to an already-disposed scope runs it immediately so late
   * registrations cannot leak.
   */
  addCleanup(cleanup: () => void): void {
    if (typeof cleanup !== 'function') {
      throw new TypeError('ControllerScope.addCleanup() requires a function.');
    }

    if (this.#disposed) {
      cleanup();
      return;
    }

    this.#entries.push({ kind: 'cleanup', cleanup });
  }

  /**
   * Disposes every registered entry in reverse registration order.
   *
   * Idempotent. Continues after individual failures and throws one
   * `AggregateError` containing all failures.
   */
  dispose(): void {
    this.#dispose(true);
  }

  /**
   * Lit lifecycle hook.
   *
   * A disposed scope is terminal; this hook intentionally does not resurrect it.
   * Owners that reconnect should create a new scope.
   */
  hostConnected(): void {
    // No-op. Scope creation and registration are explicit.
  }

  /**
   * Lit lifecycle hook. Disposes the scope when
   * `autoDisposeOnDisconnect` (or its alias) is enabled.
   */
  hostDisconnected(): void {
    if (!this.#autoDisposeOnDisconnect || this.#disposed) return;
    // Defer self-unregistration so we do not mutate the host's controller
    // array while Lit is iterating it in its own hostDisconnected pass.
    this.#dispose(false);
  }

  #dispose(removeImmediately: boolean): void {
    if (this.#disposed) return;
    this.#disposed = true;

    const errors: unknown[] = [];
    const entries = this.#entries.splice(0).reverse();

    for (const entry of entries) {
      try {
        if (entry.kind === 'controller') {
          disposeController(entry.controller);
        } else {
          entry.cleanup();
        }
      } catch (error) {
        errors.push(error);
      }
    }

    if (removeImmediately) {
      try {
        this.#host.removeController?.(this);
      } catch (error) {
        errors.push(error);
      }
    } else {
      queueMicrotask(() => {
        try {
          this.#host.removeController?.(this);
        } catch {
          // The host is already tearing down; there is no synchronous caller
          // left to receive the removal failure.
        }
      });
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'ControllerScope disposal failed');
    }
  }
}
