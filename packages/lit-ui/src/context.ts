/**
 * @fileoverview W3C Context Protocol (@lit/context) tokens and dependency injection utilities
 * for Context-Action stores, action registers, and dispatchers across Shadow DOM boundaries.
 *
 * @implements context-protocol
 * @implements dependency-injection
 * @implements store-integration-pattern
 * @implements action-pipeline-system
 * @memberof core-concepts
 */

import {
  createContext,
  ContextProvider,
  ContextConsumer,
  type Context,
} from '@lit/context';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type {
  ActionRegister,
  ActionDispatcher,
  ActionPayloadMap,
  ActionNames,
  DispatchArgs,
} from '@context-action/core';
import type {
  ReadableStore,
  Selector,
  EqualityFn,
  Unsubscribe,
} from '@context-action/lit';

// Re-export core context primitives from @lit/context for convenience
export { ContextProvider, ContextConsumer, createContext, type Context };

// ============================================================================
// 1. Context Tokens
// ============================================================================

/**
 * Standard W3C Context token for an ActionRegister.
 * Uses Symbol.for to ensure singleton identity across independent bundle chunks and micro-frontends.
 *
 * @implements action-pipeline-system
 * @memberof api-terms
 */
export const actionRegisterContext: Context<symbol, ActionRegister<any>> =
  createContext<ActionRegister<any>, symbol>(Symbol.for('context-action.register'));

/**
 * Standard W3C Context token for an ActionDispatcher function.
 * Uses Symbol.for to ensure singleton identity across independent bundle chunks.
 *
 * @implements action-pipeline-system
 * @memberof api-terms
 */
export const actionDispatcherContext: Context<symbol, ActionDispatcher<any>> =
  createContext<ActionDispatcher<any>, symbol>(Symbol.for('context-action.dispatcher'));

/**
 * Factory function creating a strongly-typed W3C Context token for a named Context-Action store.
 *
 * Distinct store names yield isolated contexts. Identical store names across different
 * modules or micro-frontend bundles share the same underlying global Symbol.
 *
 * @template T State type managed by the store.
 * @param name Unique name of the store domain (e.g. 'cart', 'auth', 'theme').
 * @returns A Context token for the named ReadableStore.
 *
 * @example
 * ```typescript
 * export const cartStoreContext = createStoreContext<CartState>('cart');
 * ```
 *
 * @implements store-integration-pattern
 * @memberof api-terms
 */
export function createStoreContext<T = unknown>(
  name: string
): Context<symbol, ReadableStore<T>> {
  if (!name || typeof name !== 'string') {
    throw new TypeError('createStoreContext: "name" must be a non-empty string.');
  }
  return createContext<ReadableStore<T>, symbol>(
    Symbol.for(`context-action.store.${name}`)
  );
}

/**
 * Factory function creating a strongly-typed ActionRegister context token for a specific action map.
 *
 * @template A Action payload map.
 * @param name Optional domain qualifier. Defaults to the root action register.
 * @returns A typed Context token for ActionRegister<A>.
 */
export function createActionRegisterContext<A extends ActionPayloadMap = ActionPayloadMap>(
  name = 'default'
): Context<symbol, ActionRegister<A>> {
  return createContext<ActionRegister<A>, symbol>(
    Symbol.for(`context-action.register.${name}`)
  );
}

/**
 * Factory function creating a strongly-typed ActionDispatcher context token for a specific action map.
 *
 * @template A Action payload map.
 * @param name Optional domain qualifier. Defaults to the root action dispatcher.
 * @returns A typed Context token for ActionDispatcher<A>.
 */
export function createActionDispatcherContext<A extends ActionPayloadMap = ActionPayloadMap>(
  name = 'default'
): Context<symbol, ActionDispatcher<A>> {
  return createContext<ActionDispatcher<A>, symbol>(
    Symbol.for(`context-action.dispatcher.${name}`)
  );
}

// ============================================================================
// 2. Imperative Provider Helpers
// ============================================================================

/**
 * Imperatively attaches an ActionRegister ContextProvider to a host element.
 *
 * @template A Action payload map.
 * @param host The hosting LitElement or ReactiveElement.
 * @param register The ActionRegister instance to provide.
 * @param context Optional custom context token (defaults to actionRegisterContext).
 * @returns The initialized ContextProvider instance.
 */
export function provideActionRegister<A extends ActionPayloadMap = ActionPayloadMap>(
  host: HTMLElement & ReactiveControllerHost,
  register: ActionRegister<A>,
  context: Context<unknown, ActionRegister<A>> = actionRegisterContext as Context<unknown, ActionRegister<A>>
): ContextProvider<Context<unknown, ActionRegister<A>>> {
  return new ContextProvider(host, {
    context,
    initialValue: register,
  });
}

/**
 * Imperatively attaches an ActionDispatcher ContextProvider to a host element.
 *
 * @template A Action payload map.
 * @param host The hosting LitElement or ReactiveElement.
 * @param dispatcher The ActionDispatcher function to provide.
 * @param context Optional custom context token (defaults to actionDispatcherContext).
 * @returns The initialized ContextProvider instance.
 */
export function provideActionDispatcher<A extends ActionPayloadMap = ActionPayloadMap>(
  host: HTMLElement & ReactiveControllerHost,
  dispatcher: ActionDispatcher<A>,
  context: Context<unknown, ActionDispatcher<A>> = actionDispatcherContext as Context<unknown, ActionDispatcher<A>>
): ContextProvider<Context<unknown, ActionDispatcher<A>>> {
  return new ContextProvider(host, {
    context,
    initialValue: dispatcher,
  });
}

/**
 * Imperatively attaches a ReadableStore ContextProvider to a host element.
 *
 * @template T Store state type.
 * @param host The hosting LitElement or ReactiveElement.
 * @param context The store Context token created via `createStoreContext`.
 * @param store The ReadableStore instance to provide.
 * @returns The initialized ContextProvider instance.
 */
export function provideStore<T>(
  host: HTMLElement & ReactiveControllerHost,
  context: Context<unknown, ReadableStore<T>>,
  store: ReadableStore<T>
): ContextProvider<Context<unknown, ReadableStore<T>>> {
  return new ContextProvider(host, {
    context,
    initialValue: store,
  });
}

// ============================================================================
// 3. Reactive Controllers for Context Dependency Injection
// ============================================================================

/**
 * Options for `ContextStoreController`.
 *
 * @template T Source store state type.
 * @template Selected Projected output type.
 */
export interface ContextStoreControllerOptions<T, Selected = T> {
  /** The W3C Context token created via `createStoreContext`. */
  context: Context<unknown, ReadableStore<T>>;
  /** Optional projection selector to derive a slice of state. */
  selector?: Selector<T, Selected>;
  /** Optional equality comparator to prevent redundant rerenders. Defaults to Object.is. */
  equalityFn?: EqualityFn<Selected>;
}

/**
 * ReactiveController that consumes a Context-Action ReadableStore from the W3C Context
 * hierarchy across Shadow DOM boundaries, subscribes to state updates, and triggers host re-renders.
 *
 * Key guarantees:
 * 1. Attaches to host via `host.addController(this)`.
 * 2. Uses `@lit/context` ContextConsumer to dynamically resolve store instances across Shadow DOM boundaries.
 * 3. Supports selective projections with memoization (`equalityFn`).
 * 4. Ensures ZERO memory leaks: completely terminates store subscription when `hostDisconnected()` runs.
 * 5. Re-evaluates store state and resubscribes on `hostConnected()`.
 *
 * @template T Source store state type.
 * @template Selected Derived slice type.
 *
 * @implements store-integration-pattern
 * @implements reactive-state-management
 * @memberof core-concepts
 */
export class ContextStoreController<T = unknown, Selected = T> implements ReactiveController {
  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #selector: Selector<T, Selected>;
  readonly #equalityFn: EqualityFn<Selected>;

  #currentStore: ReadableStore<T> | undefined = undefined;
  #unsubscribeStore: Unsubscribe | null = null;
  #selectedValue: Selected | undefined = undefined;
  #isResolved = false;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: ContextStoreControllerOptions<T, Selected>
  ) {
    if (!host || typeof host.addController !== 'function') {
      throw new TypeError(
        'ContextStoreController requires a valid host implementing ReactiveControllerHost and HTMLElement.'
      );
    }
    if (!options?.context) {
      throw new TypeError('ContextStoreController requires a valid Context token.');
    }

    this.#host = host;
    this.#selector = options.selector ?? ((s: T) => s as unknown as Selected);
    this.#equalityFn = options.equalityFn ?? Object.is;

    // Attach ContextConsumer to host
    new ContextConsumer(host, {
      context: options.context,
      callback: (store) => this.#handleStoreResolved(store),
      subscribe: true,
    });

    host.addController(this);
  }

  /** Current projected state derived from the injected store, or undefined if not yet provided. */
  get value(): Selected | undefined {
    return this.#selectedValue;
  }

  /** The resolved ReadableStore instance currently bound to this controller. */
  get store(): ReadableStore<T> | undefined {
    return this.#currentStore;
  }

  /** Indicates whether the context request has been satisfied by an ancestor provider. */
  get isResolved(): boolean {
    return this.#isResolved;
  }

  #extractRawValue(store: ReadableStore<T>): T {
    if (typeof store.getValue === 'function') {
      return store.getValue();
    }
    if (typeof store.getSnapshot === 'function') {
      return store.getSnapshot() as T;
    }
    throw new TypeError(
      'ContextStoreController: Provided store must implement getValue() or getSnapshot().'
    );
  }

  #handleStoreResolved(nextStore?: ReadableStore<T>): void {
    if (this.#currentStore === nextStore && this.#isResolved) {
      return;
    }

    // Teardown previous subscription
    this.#cleanupStoreSubscription();

    this.#currentStore = nextStore;

    if (!nextStore) {
      this.#isResolved = false;
      this.#selectedValue = undefined;
      this.#host.requestUpdate();
      return;
    }

    this.#isResolved = true;
    this.#syncStateAndSubscribe();
    this.#host.requestUpdate();
  }

  #syncStateAndSubscribe(): void {
    if (!this.#currentStore) return;

    // Compute initial value
    const raw = this.#extractRawValue(this.#currentStore);
    this.#selectedValue = this.#selector(raw);

    // Subscribe to store notifications
    this.#unsubscribeStore = this.#currentStore.subscribe(() => {
      if (!this.#currentStore) return;
      const nextRaw = this.#extractRawValue(this.#currentStore);
      const nextSelected = this.#selector(nextRaw);

      if (!this.#equalityFn(this.#selectedValue as Selected, nextSelected)) {
        this.#selectedValue = nextSelected;
        this.#host.requestUpdate();
      }
    });
  }

  #cleanupStoreSubscription(): void {
    if (this.#unsubscribeStore) {
      this.#unsubscribeStore();
      this.#unsubscribeStore = null;
    }
  }

  hostConnected(): void {
    // ContextConsumer automatically dispatches context-request when host connects.
    // If a store was already resolved, ensure we resubscribe and sync fresh data:
    if (this.#currentStore && !this.#unsubscribeStore) {
      this.#syncStateAndSubscribe();
      this.#host.requestUpdate();
    }
  }

  hostDisconnected(): void {
    // Terminate store subscription immediately: zero memory leaks when element unmounts
    this.#cleanupStoreSubscription();
  }
}

/**
 * Options for `ContextActionController`.
 *
 * @template A Action payload map.
 */
export interface ContextActionControllerOptions<A extends ActionPayloadMap = ActionPayloadMap> {
  /** Optional custom context token (defaults to actionRegisterContext). */
  context?: Context<unknown, ActionRegister<A>>;
}

/**
 * ReactiveController that consumes an ActionRegister from the W3C Context hierarchy
 * across Shadow DOM boundaries and exposes typed dispatch methods.
 *
 * @template A Action payload map.
 *
 * @implements action-pipeline-system
 * @implements action-controller
 * @memberof core-concepts
 */
export class ContextActionController<A extends ActionPayloadMap = ActionPayloadMap>
  implements ReactiveController
{
  readonly #host: ReactiveControllerHost & HTMLElement;

  #register: ActionRegister<A> | undefined = undefined;
  #isPending = false;
  #lastError: Error | undefined = undefined;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options?: ContextActionControllerOptions<A>
  ) {
    if (!host || typeof host.addController !== 'function') {
      throw new TypeError(
        'ContextActionController requires a valid host implementing ReactiveControllerHost and HTMLElement.'
      );
    }

    this.#host = host;
    const ctx = (options?.context ?? actionRegisterContext) as Context<unknown, ActionRegister<A>>;

    new ContextConsumer(host, {
      context: ctx,
      callback: (reg) => {
        this.#register = reg;
        this.#host.requestUpdate();
      },
      subscribe: true,
    });

    host.addController(this);
  }

  /** The resolved ActionRegister instance, or undefined if no provider is present. */
  get register(): ActionRegister<A> | undefined {
    return this.#register;
  }

  /** Whether an action dispatch is currently in progress. */
  get isPending(): boolean {
    return this.#isPending;
  }

  /** The last error thrown during an action dispatch, if any. */
  get lastError(): Error | undefined {
    return this.#lastError;
  }

  /**
   * Dispatches an action through the context-injected ActionRegister pipeline.
   *
   * @template K Action name.
   * @param action Name of the registered action.
   * @param args Action payload arguments.
   */
  async dispatch<K extends ActionNames<A>>(
    action: K,
    ...args: DispatchArgs<A[K]>
  ): Promise<void> {
    if (!this.#register) {
      throw new Error(
        `ContextActionController: Cannot dispatch "${String(action)}". No ActionRegister found in context hierarchy.`
      );
    }

    this.#isPending = true;
    this.#lastError = undefined;
    this.#host.requestUpdate();

    try {
      await this.#register.dispatch(action, ...args);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      this.#lastError = errorObj;
      throw errorObj;
    } finally {
      this.#isPending = false;
      this.#host.requestUpdate();
    }
  }

  /**
   * Dispatches an action and returns the pipeline execution result.
   *
   * @template K Action name.
   * @template R Expected return value.
   * @param action Name of the registered action.
   * @param args Action payload arguments.
   * @returns Pipeline result promise.
   */
  async dispatchWithResult<K extends ActionNames<A>, R = unknown>(
    action: K,
    ...args: DispatchArgs<A[K]>
  ): Promise<R> {
    if (!this.#register) {
      throw new Error(
        `ContextActionController: Cannot dispatch "${String(action)}". No ActionRegister found in context hierarchy.`
      );
    }

    this.#isPending = true;
    this.#lastError = undefined;
    this.#host.requestUpdate();

    try {
      if (typeof (this.#register as any).dispatchWithResult === 'function') {
        return await (this.#register as any).dispatchWithResult(action, ...args);
      }
      return (await this.#register.dispatch(action, ...args)) as unknown as R;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      this.#lastError = errorObj;
      throw errorObj;
    } finally {
      this.#isPending = false;
      this.#host.requestUpdate();
    }
  }

  hostConnected(): void {}
  hostDisconnected(): void {}
}
