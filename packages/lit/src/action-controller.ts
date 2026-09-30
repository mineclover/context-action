/**
 * @fileoverview ActionController implementation bridging Context-Action action pipelines to Lit's ReactiveController lifecycle.
 * @implements action-controller
 * @implements action-pipeline-system
 * @implements reactive-state-management
 * @memberof core-concepts
 */

import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type {
  ActionPayloadMap,
  ActionNames,
  ActionResultMap,
  ActionResult,
  DispatchArgs,
  DispatchOptions,
  ExecutionResult,
} from '@context-action/core';
import type { ActionRegister } from '@context-action/core';

/**
 * Options for configuring an ActionController instance.
 *
 * @implements action-controller
 * @memberof api-terms
 */
export interface ActionControllerOptions {
  /** Optional placeholder for controller-level configuration */
}

/**
 * Combines an internal lifecycle AbortSignal with an optional caller-provided AbortSignal.
 *
 * @param controllerSignal - The controller's lifecycle abort signal.
 * @param userSignal - Optional abort signal passed via dispatch options.
 * @returns An AbortSignal that aborts if either input signal aborts.
 */
function mergeSignals(controllerSignal: AbortSignal, userSignal?: AbortSignal): AbortSignal {
  if (!userSignal) {
    return controllerSignal;
  }
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([controllerSignal, userSignal]);
  }

  const merged = new AbortController();
  const onAbort = () => {
    merged.abort(controllerSignal.reason ?? userSignal.reason);
  };

  if (controllerSignal.aborted || userSignal.aborted) {
    onAbort();
    return merged.signal;
  }

  controllerSignal.addEventListener('abort', onAbort, { once: true });
  userSignal.addEventListener('abort', onAbort, { once: true });
  return merged.signal;
}

/**
 * Lit ReactiveController that wraps a Context-Action ActionRegister.
 *
 * Bridges action pipeline orchestration to Lit web components by providing:
 * - Strongly-typed action dispatches (`dispatch`, `dispatchWithResult`).
 * - Coalesced pending state tracking (`isPending`) triggering `host.requestUpdate()`
 *   strictly on 0 <-> >0 active count transitions.
 * - Automatic abort cancellation of in-flight dispatches on `hostDisconnected()`.
 *
 * @template A - Action payload mapping interface extending ActionPayloadMap.
 * @template TResultMap - Action-to-result mapping interface extending ActionResultMap<A>.
 *
 * @implements action-controller
 * @implements action-pipeline-system
 * @memberof core-concepts
 */
export class ActionController<
  A extends ActionPayloadMap = Record<string, any>,
  TResultMap extends ActionResultMap<A> = {},
> implements ReactiveController {
  readonly #host: ReactiveControllerHost;
  readonly #register: ActionRegister<A, TResultMap>;

  #activeCount = 0;
  #abortController: AbortController = new AbortController();

  /**
   * Creates an instance of ActionController and registers it with the host element.
   *
   * @param host - The Lit element or ReactiveControllerHost managing this controller.
   * @param register - The Context-Action ActionRegister instance to delegate dispatches to.
   * @param _options - Optional configuration options.
   */
  constructor(
    host: ReactiveControllerHost,
    register: ActionRegister<A, TResultMap>,
    _options?: ActionControllerOptions,
  ) {
    if (!host || typeof host.addController !== 'function') {
      throw new TypeError(
        'ActionController requires a valid ReactiveControllerHost implementing addController().'
      );
    }
    if (!register || typeof register.dispatch !== 'function') {
      throw new TypeError(
        'ActionController requires an ActionRegister instance implementing dispatch().'
      );
    }

    this.#host = host;
    this.#register = register;
    host.addController(this);
  }

  /**
   * Reference to the underlying ActionRegister instance.
   */
  get register(): ActionRegister<A, TResultMap> {
    return this.#register;
  }

  /**
   * True if one or more action dispatches are currently in flight; false otherwise.
   */
  get isPending(): boolean {
    return this.#activeCount > 0;
  }

  /**
   * Current number of concurrent in-flight dispatches.
   */
  get activeCount(): number {
    return this.#activeCount;
  }

  /**
   * Increments active dispatch count.
   * Triggers host.requestUpdate() ONLY when transitioning from 0 to 1.
   */
  #incrementPending(): void {
    const wasPending = this.#activeCount > 0;
    this.#activeCount++;
    if (!wasPending) {
      this.#host.requestUpdate();
    }
  }

  /**
   * Decrements active dispatch count.
   * Triggers host.requestUpdate() ONLY when transitioning from 1 to 0.
   */
  #decrementPending(): void {
    if (this.#activeCount > 0) {
      this.#activeCount--;
      if (this.#activeCount === 0) {
        this.#host.requestUpdate();
      }
    }
  }

  /**
   * Lit lifecycle hook: invoked when the host element connects to the DOM.
   * Recreates the internal AbortController if it was aborted during a previous disconnection.
   */
  hostConnected(): void {
    if (this.#abortController.signal.aborted) {
      this.#abortController = new AbortController();
    }
  }

  /**
   * Lit lifecycle hook: invoked when the host element disconnects from the DOM.
   * Aborts all in-flight dispatches associated with this element.
   */
  hostDisconnected(): void {
    if (!this.#abortController.signal.aborted) {
      this.#abortController.abort(new DOMException('Host disconnected', 'AbortError'));
    }
  }

  /**
   * Manually aborts all currently active in-flight dispatches and resets the controller.
   *
   * @param reason - Optional cancellation reason.
   */
  abort(reason?: unknown): void {
    this.#abortController.abort(reason ?? new DOMException('Action aborted', 'AbortError'));
    this.#abortController = new AbortController();
  }

  /**
   * Dispatches an action through the action pipeline.
   *
   * Automatically tracks `isPending` state and links the dispatch to the element's lifecycle
   * cancellation token.
   *
   * @param action - Action key to dispatch.
   * @param args - Action payload and optional dispatch options tuple.
   * @returns A promise that resolves when all non-blocking handlers settle.
   */
  async dispatch<K extends ActionNames<A>>(
    action: K,
    ...args: DispatchArgs<A[K]>
  ): Promise<void> {
    const [payload, options] = args as [A[K] | undefined, DispatchOptions | undefined];
    const mergedSignal = mergeSignals(this.#abortController.signal, options?.signal);
    const mergedOptions: DispatchOptions = {
      ...options,
      signal: mergedSignal,
    };

    this.#incrementPending();
    try {
      await (this.#register.dispatch as (
        action: K,
        payload?: any,
        options?: DispatchOptions,
      ) => Promise<void>)(action, payload, mergedOptions);
      if (mergedSignal.aborted) {
        throw (
          mergedSignal.reason ?? new DOMException('Action dispatch aborted', 'AbortError')
        );
      }
    } finally {
      this.#decrementPending();
    }
  }

  /**
   * Dispatches an action through the action pipeline and aggregates handler results.
   *
   * Automatically tracks `isPending` state and links the dispatch to the element's lifecycle
   * cancellation token.
   *
   * @param action - Action key to dispatch.
   * @param args - Action payload and optional dispatch options tuple.
   * @returns Detailed ExecutionResult containing execution status and collected results.
   */
  async dispatchWithResult<K extends ActionNames<A> & keyof TResultMap>(
    action: K,
    ...args: DispatchArgs<A[K]>
  ): Promise<ExecutionResult<ActionResult<TResultMap, K>>>;
  async dispatchWithResult<K extends ActionNames<A>, R = unknown>(
    action: K,
    ...args: DispatchArgs<A[K]>
  ): Promise<ExecutionResult<R>>;
  async dispatchWithResult<K extends ActionNames<A>, R = unknown>(
    action: K,
    ...args: DispatchArgs<A[K]>
  ): Promise<ExecutionResult<R>> {
    const [payload, options] = args as [A[K] | undefined, DispatchOptions | undefined];
    const mergedSignal = mergeSignals(this.#abortController.signal, options?.signal);
    const mergedOptions: DispatchOptions = {
      ...options,
      signal: mergedSignal,
    };

    this.#incrementPending();
    try {
      const result = await (this.#register.dispatchWithResult as (
        action: K,
        payload?: any,
        options?: DispatchOptions,
      ) => Promise<ExecutionResult<R>>)(action, payload, mergedOptions);
      if (mergedSignal.aborted) {
        throw (
          mergedSignal.reason ?? new DOMException('Action dispatch aborted', 'AbortError')
        );
      }
      return result;
    } finally {
      this.#decrementPending();
    }
  }
}
