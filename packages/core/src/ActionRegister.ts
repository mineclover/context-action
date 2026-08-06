// biome-ignore-all lint/suspicious/noExplicitAny: heterogeneous runtime pipeline storage.

import { ActionGuard } from './action-guard.js';
import { OperationQueue } from './concurrency/OperationQueue.js';
import {
  ActionRegisterDestroyedError,
  ActionTimeoutError,
  ActionValidationError,
} from './errors.js';
import { executeParallel, executeRace, executeSequential } from './execution-modes.js';
import {
  ActionHandler,
  ActionHandlerStats,
  ActionPayloadMap,
  ActionRegisterConfig,
  ActionRegistryInfo,
  DispatchArgs,
  DispatchOptions,
  ExecutionMode,
  ExecutionResult,
  HandlerConfig,
  HandlerError,
  HandlerRegistration,
  PipelineContext,
  PipelineController,
  UnregisterFunction,
} from './types.js';

type DispatchHandlerPromises = Set<Promise<unknown>>;

function normalizePositiveLimit(
  value: number | undefined,
  fallback: number,
  label: string,
): number {
  const limit = value ?? fallback;
  if (limit === Infinity) return limit;
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new RangeError(`${label} must be a positive safe integer or Infinity.`);
  }
  return limit;
}

/**
 * Action Register for managing action handlers with priority-based execution
 * 
 * Central action registration and dispatch system providing type-safe action pipeline management.
 * Supports sequential, parallel, and race execution modes with advanced handler filtering,
 * throttling, debouncing, and comprehensive result collection.
 * 
 * @template TActionMap - Action payload mapping interface extending ActionPayloadMap
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation
 * 
 * @public
 */

export class ActionRegister<
  T extends ActionPayloadMap = Record<string, unknown>
> {
  private pipelines = new Map<keyof T, Array<HandlerRegistration<any, any>>>();
  private readonly actionGuard: ActionGuard;
  private executionMode: ExecutionMode = 'sequential';
  private actionExecutionModes = new Map<keyof T, ExecutionMode>();
  
  // 🆕 Advanced unregister function management system
  private unregisterFunctions = new Map<string, UnregisterFunction>();

  // 🔧 Fix: Track last registration timestamps for getActionStats
  private lastRegisteredTimestamps = new Map<keyof T, Date>();
  
  public readonly name: string;
  private readonly registryConfig: ActionRegisterConfig['registry'];

  // 🆕 Performance optimizations
  private readonly isDebugMode: boolean;
  private readonly maxHandlersPerAction: number;
  private readonly maxJumps: number;

  // 🆕 동시성 문제 해결을 위한 큐 시스템 (conditional)
  private dispatchQueue?: OperationQueue;

  // 🔧 Performance optimization: Fast handler ID generation counter
  private handlerIdCounter = 0;

  // 🔧 Performance optimization: PipelineController pool for object reuse
  private controllerPool: PipelineController<any, any>[] = [];

  private lifecycleState: 'active' | 'closing' | 'destroyed' = 'active';
  private readonly lifecycleController = new AbortController();
  private readonly activeDispatches = new Set<Promise<unknown>>();
  private readonly activeHandlerPromises = new Set<Promise<unknown>>();
  private destroyAsyncPromise: Promise<void> | undefined;
  private dispatchConstructionDepth = 0;

  // 🔧 Performance optimization: Cached Proxy instances for actions getters
  private _actionsProxy?: {
    [K in keyof T]: (...args: DispatchArgs<T[K]>) => Promise<void>
  };
  private _actionsWithResultProxy?: {
    [K in keyof T]: (...args: DispatchArgs<T[K]>) => Promise<ExecutionResult<any>>
  };
  private readonly actionDispatchers = new Map<
    PropertyKey,
    (...args: any[]) => Promise<unknown>
  >();
  private readonly actionResultDispatchers = new Map<
    PropertyKey,
    (...args: any[]) => Promise<unknown>
  >();

  constructor(config: ActionRegisterConfig = {}) {
    this.name = config.name || 'ActionRegister';
    this.registryConfig = config.registry;
    this.maxHandlersPerAction = normalizePositiveLimit(
      config.registry?.maxHandlersPerAction,
      Infinity,
      'maxHandlersPerAction',
    );
    this.maxJumps = normalizePositiveLimit(
      config.registry?.maxJumps,
      10,
      'maxJumps',
    );
    this.isDebugMode = this.registryConfig?.debug === true;
    
    // Guard creation with improved cleanup handling
    this.actionGuard = new ActionGuard(this.registryConfig?.autoCleanup !== false);
    
    // 🆕 Conditional queue system initialization
    if (config.registry?.useConcurrencyQueue === true) {
      this.dispatchQueue = new OperationQueue(`${this.name}-Dispatch`);
    }
    
    if (this.registryConfig?.defaultExecutionMode) {
      this.executionMode = this.registryConfig.defaultExecutionMode;
    }
    
    this.log('ActionRegister initialized', {
      defaultExecutionMode: this.executionMode,
      autoCleanup: this.registryConfig?.autoCleanup !== false,
      concurrencyQueue: Boolean(this.dispatchQueue),
      debugMode: this.isDebugMode
    });
  }

  /**
   * 🆕 Action-based dispatcher
   *
   * Provides function-based access to actions for more convenient dispatching.
   * Each action becomes a callable function that can be invoked directly.
   *
   * @example
   * ```typescript
   * interface MyActions extends ActionPayloadMap {
   *   userLogin: { userId: string; email: string };
   *   resetApp: void;
   * }
   * 
   * const registry = new ActionRegister<MyActions>();
   * 
   * // Function-based dispatching
   * await registry.actions.userLogin({ userId: '123', email: 'test@example.com' });
   * await registry.actions.resetApp();
   * await registry.actions.resetApp(undefined, { debounce: 100 });
   * ```
   * 
   * @public
   */
  get actions(): {
    [K in keyof T]: (...args: DispatchArgs<T[K]>) => Promise<void>
  } {
    // 🔧 Performance: Return cached Proxy instance
    if (!this._actionsProxy) {
      this._actionsProxy = new Proxy({} as any, {
        get: (_target, prop: string | symbol) => {
          if (typeof prop !== 'string') return undefined;
          const actionKey = prop as keyof T;
          if (!this.pipelines.has(actionKey)) return undefined;

          let dispatcher = this.actionDispatchers.get(prop);
          if (!dispatcher) {
            dispatcher = (payload?: T[typeof actionKey], options?: DispatchOptions) =>
              this.dispatch(
                actionKey,
                ...( [payload, options] as DispatchArgs<T[typeof actionKey]> )
              );
            this.actionDispatchers.set(prop, dispatcher);
          }
          return dispatcher;
        }
      });
    }
    return this._actionsProxy!;
  }

  /**
   * Actions-based dispatching with result collection
   * 
   * Provides a function-based interface for dispatching actions with detailed execution results.
   * Each registered action becomes a callable function that returns ExecutionResult.
   * 
   * @example
   * ```typescript
   * // Actions with payload
   * const result = await registry.actionsWithResult.userLogin({ userId: '123', email: 'user@example.com' });
   * 
   * // Actions without payload
   * const result = await registry.actionsWithResult.userLogout();
   * const debouncedResult = await registry.actionsWithResult.userLogout(
   *   undefined,
   *   { debounce: 100 }
   * );
   * 
   * // With options
   * const result = await registry.actionsWithResult.processData(
   *   { data: { name: 'test' }, type: 'json' },
   *   { executionMode: 'parallel' }
   * );
   * ```
   * 
   * @returns Proxy object with action functions that return ExecutionResult
   */
  get actionsWithResult(): {
    [K in keyof T]: (...args: DispatchArgs<T[K]>) => Promise<ExecutionResult<any>>
  } {
    // 🔧 Performance: Return cached Proxy instance
    if (!this._actionsWithResultProxy) {
      this._actionsWithResultProxy = new Proxy({} as any, {
        get: (_target, prop: string | symbol) => {
          if (typeof prop !== 'string') return undefined;
          const actionKey = prop as keyof T;
          if (!this.pipelines.has(actionKey)) return undefined;

          let dispatcher = this.actionResultDispatchers.get(prop);
          if (!dispatcher) {
            dispatcher = (payload?: T[typeof actionKey], options?: DispatchOptions) =>
              this.dispatchWithResult(
                actionKey,
                ...( [payload, options] as DispatchArgs<T[typeof actionKey]> )
              );
            this.actionResultDispatchers.set(prop, dispatcher);
          }
          return dispatcher;
        }
      });
    }
    return this._actionsWithResultProxy!;
  }

  /**
   * Register an action handler with optional configuration
   * 
   * @param action - The action type to register handler for
   * @param handler - The handler function to execute
   * @param config - Optional handler configuration including priority, tags, etc.
   * 
   * @returns Unregister function to remove this handler
   * 
   * @throws {Error} When maximum handlers limit is reached
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
   * 
   * @public
   */
  register<K extends keyof T, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig<T[K]> = {}
  ): UnregisterFunction {
    this.assertAcceptingWork();
    // 🔄 임시로 기존 구현 유지하되 개선된 방식 적용
    // 동기적 API를 유지하면서 내부적으로만 동시성 보호
    
    // 🆕 Optimized handler ID generation
    const handlerId = config.id || this.generateHandlerId(action);
    
    // 🆕 Direct synchronous registration
    const unregisterFn = this._performRegistrationSync(action, handler, config, handlerId);
    
    return unregisterFn;
  }

  /**
   * 🆕 Unified logging method with cached debug mode check
   */
  private log(message: string, data?: unknown, level: 'log' | 'warn' | 'error' = 'log') {
    if (this.isDebugMode) {
      const timestamp = new Date().toISOString();
      console[level](`🎯 [${timestamp}] [${this.name}] ${message}`, data || '');
    }
  }

  private assertAcceptingWork(): void {
    if (this.lifecycleState !== 'active') {
      throw new ActionRegisterDestroyedError(this.name, this.lifecycleState);
    }
  }

  private rejectedLifecyclePromise<R>(): Promise<R> {
    const error = new ActionRegisterDestroyedError(
      this.name,
      this.lifecycleState === 'active' ? 'destroyed' : this.lifecycleState
    );
    const rejected = Promise.reject<R>(error);
    void rejected.catch(() => {});
    return rejected;
  }

  /**
   * 🔧 Generate unique handler ID using optimized counter-based approach
   */
  private generateHandlerId<K extends keyof T>(action: K): string {
    // 🔧 Performance: Use simple counter instead of crypto.randomUUID()
    // This is safe for single-process apps and ~70% faster
    return `${String(action)}_${this.name}_${++this.handlerIdCounter}`;
  }

  /**
   * 🔧 Create and merge AbortSignal instances with proper cleanup
   * 
   * @param options Dispatch options containing signal and autoAbort configuration
   * @returns [effectiveSignal, autoAbortController, cleanupFunction]
   */
  private createAbortSignal(options?: DispatchOptions): [
    AbortSignal | undefined, 
    AbortController | undefined, 
    () => void
  ] {
    const signals: AbortSignal[] = [];
    const cleanups: (() => void)[] = [];
    let autoAbortController: AbortController | undefined;

    // Add existing signal if provided
    if (options?.signal) {
      signals.push(options.signal);
    }

    // Create auto-abort controller if enabled
    if (options?.autoAbort?.enabled) {
      autoAbortController = new AbortController();
      signals.push(autoAbortController.signal);
    }

    // No signals to merge
    if (signals.length === 0) {
      return [undefined, autoAbortController, () => {}];
    }

    // Single signal - no merge needed
    if (signals.length === 1) {
      return [signals[0], autoAbortController, () => cleanups.forEach(c => c())];
    }

    // Multiple signals - use AbortSignal.any() if available, fallback to manual merge
    let effectiveSignal: AbortSignal;
    
    if (typeof (AbortSignal as any).any === 'function') {
      // Modern browsers with AbortSignal.any()
      effectiveSignal = (AbortSignal as any).any(signals);
    } else {
      // Fallback: Create controller and link all signals
      const mergedController = new AbortController();
      effectiveSignal = mergedController.signal;
      
      signals.forEach(signal => {
        if (signal.aborted) {
          mergedController.abort();
        } else {
          const abortHandler = () => mergedController.abort();
          signal.addEventListener('abort', abortHandler, { once: true });
          cleanups.push(() => signal.removeEventListener('abort', abortHandler));
        }
      });
    }

    const cleanup = () => {
      cleanups.forEach(c => {
        try {
          c();
        } catch (error) {
          this.log('Cleanup error during AbortSignal cleanup', error, 'warn');
        }
      });
    };

    return [effectiveSignal, autoAbortController, cleanup];
  }

  /**
   * 🆕 Perform synchronous handler registration
   */
  private _performRegistrationSync<K extends keyof T, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig<T[K]>,
    handlerId: string
  ): UnregisterFunction {
    // Create handler registration with defaults
    const registration: HandlerRegistration<T[K], R> = {
      handler,
      config: {
        priority: config.priority ?? 0,
        id: handlerId,
        blocking: config.blocking ?? false,
        once: config.once ?? false,
        debounce: config.debounce ?? undefined,
        throttle: config.throttle ?? undefined,
        replaceExisting: config.replaceExisting ?? true, // 🔧 Fix: Default to true for backward compatibility
        cleanup: config.cleanup, // 🔧 Preserve cleanup function from config
        condition: config.condition, // 🔧 Fix: Preserve condition function from config
      } as Required<HandlerConfig<T[K]>>,
      id: handlerId,
    };
    
    // Initialize pipeline if it doesn't exist
    if (!this.pipelines.has(action)) {
      this.pipelines.set(action, []);
    }

    const pipeline = this.pipelines.get(action)!;
    
    const existingIndex = pipeline.findIndex(reg => reg.id === handlerId);

    // Replacement keeps the pipeline size stable. Apply a finite limit only
    // when the registration would add a distinct handler.
    if (existingIndex === -1 && pipeline.length >= this.maxHandlersPerAction) {
      throw new RangeError(
        `Handler limit (${this.maxHandlersPerAction}) reached for action "${String(action)}".`,
      );
    }

    // 🆕 Enhanced duplicate ID handling with replaceExisting support and cleanup
    if (existingIndex !== -1) {
      const existing = pipeline[existingIndex];
      const existingUnregister = this.unregisterFunctions.get(handlerId);
      
      if (registration.config.replaceExisting) {
        // 🔧 Fix: Clean up existing handler properly without removing from pipeline

        // Call cleanup if available on the old handler
        if (existing?.config.cleanup && typeof existing.config.cleanup === 'function') {
          try {
            existing.config.cleanup();
          } catch (cleanupError) {
            this.log(`Cleanup error for replaced handler: ${String(action)}`, cleanupError, 'warn');
          }
        }

        // Clean up existing unregister function
        if (existingUnregister) {
          this.unregisterFunctions.delete(handlerId);
        }

        // Replace existing handler directly in pipeline
        pipeline[existingIndex] = registration;
        pipeline.sort((a, b) => b.config.priority - a.config.priority);
        // Cache disabled

        // 🔧 Fix: Update last registered timestamp when replacing
        this.lastRegisteredTimestamps.set(action, new Date());

        // Create new unregister function and store it
        const newUnregister = this.createUnregisterFunction(action, handlerId, registration);
        this.unregisterFunctions.set(handlerId, newUnregister);
        
        this.log(`Handler replaced: ${String(action)}`, {
          handlerId,
          priority: config.priority,
          totalHandlers: pipeline.length,
          hadExistingUnregister: Boolean(existingUnregister)
        });
        
        return newUnregister;
      } else {
        // Return existing unregister function or create a new one
        // At this point, existing is guaranteed to be defined because we're in the duplicate handler block
        if (!existing) {
          throw new Error('Internal error: existing handler should be defined in duplicate handler block');
        }
        
        this.log(`Handler duplicate ignored, returning existing unregister: ${String(action)}`, {
          handlerId,
          existingPriority: existing.config.priority,
          newPriority: config.priority,
          existingBlocking: existing.config.blocking,
          newBlocking: config.blocking,
          note: 'Use replaceExisting:true to replace'
        }, 'warn');
        
        if (existingUnregister) {
          return existingUnregister;
        } else {
          // Create new unregister function if somehow missing
          const newUnregister = this.createUnregisterFunction(action, handlerId, existing);
          this.unregisterFunctions.set(handlerId, newUnregister);
          return newUnregister;
        }
      }
    }
    
    // Add handler to pipeline
    pipeline.push(registration);
    pipeline.sort((a, b) => b.config.priority - a.config.priority);
    // Cache disabled

    // 🔧 Fix: Update last registered timestamp
    this.lastRegisteredTimestamps.set(action, new Date());

    // Create and store unregister function
    const unregister = this.createUnregisterFunction(action, handlerId, registration);
    this.unregisterFunctions.set(handlerId, unregister);

    this.log(`Handler registered: ${String(action)}`, {
      handlerId,
      priority: config.priority,
      totalHandlers: pipeline.length
    });

    return unregister;
  }


  /**
   * Dispatch an action with optional execution options
   * 
   * @param action - The action type to dispatch
   * @param payload - The action payload data
   * @param options - Optional dispatch options (execution mode, filters, etc.)
   * 
   * @returns Promise that resolves when all handlers complete
   * 
   * @throws {Error} When action dispatching fails
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
   * 
   * @public
   */
  // Overload for actions with payload (more specific)
  dispatch<K extends keyof T>(action: K, ...args: DispatchArgs<T[K]>): Promise<void>;
  
  // Implementation (least specific)
  dispatch<K extends keyof T>(action: K, ...args: DispatchArgs<T[K]>): Promise<void> {
    const [payload, options] = args as [T[K] | undefined, DispatchOptions | undefined];
    if (this.lifecycleState !== 'active') {
      return this.rejectedLifecyclePromise<void>();
    }

    const timeoutScope = this.createTimeoutScope(action, options);
    const dispatchHandlerPromises: DispatchHandlerPromises = new Set();
    const attemptState = { count: 0 };
    const operation = async () => {
      if (!timeoutScope.options?.signal?.aborted) {
        this.validatePayload(action, payload);
      }

      return this.executeWithRetry(async () => {
        const executedHandlers: HandlerRegistration<any, any>[] = [];
        try {
          return await this._performDispatch(
            action,
            payload,
            timeoutScope.options,
            attemptState.count > 1,
            executedHandlers,
            dispatchHandlerPromises
          );
        } finally {
          this.cleanupOneTimeHandlers(
            action,
            executedHandlers,
            dispatchHandlerPromises
          );
        }
      }, timeoutScope.options, attemptState, undefined, () => this.getHandlerCount(action) > 0);
    };

    const hasTimingGuard = (
      options?.debounce !== undefined ||
      options?.throttle !== undefined ||
      this.pipelines.get(action)?.some(handler => (
        handler.config.debounce !== undefined ||
        handler.config.throttle !== undefined
      )) === true
    );

    let dispatchPromise: Promise<void>;
    this.dispatchConstructionDepth += 1;
    try {
      // Timing guards must observe rapid calls when they are dispatched. If
      // they enter the serial queue first, each debounce window completes
      // before the next call starts and every call is executed.
      if (timeoutScope.options?.immediate || hasTimingGuard || !this.dispatchQueue) {
        dispatchPromise = operation();
      } else {
        const queued = this.dispatchQueue.enqueueWithHandle(
          operation,
          timeoutScope.options?.queuePriority ?? 0
        );
        timeoutScope.onTimeout(error => queued.cancel(error));
        dispatchPromise = queued.promise;
      }
      this.trackDispatchPromise(dispatchPromise);
    } finally {
      this.dispatchConstructionDepth -= 1;
    }
    const exposedPromise = this.raceWithTimeout(
      dispatchPromise,
      timeoutScope,
      dispatchHandlerPromises
    );
    const observedPromise = exposedPromise.catch(error => {
      this.invokeErrorHandler(error, action, payload, options, attemptState.count);
      throw error;
    });

    // Preserve rejection semantics for observers without leaking fire-and-forget
    // dispatches as process-level unhandled rejections.
    void observedPromise.catch(() => {});
    return observedPromise;
  }

  /** Execute a dispatch operation with an optional whole-action retry policy. */
  private async executeWithRetry<R>(
    operation: () => Promise<R>,
    options: DispatchOptions | undefined,
    attemptState: { count: number },
    shouldRetryResult?: (result: R) => boolean,
    canRetry: () => boolean = () => true
  ): Promise<R> {
    const configuredAttempts = options?.retryOnError?.maxAttempts ?? 1;
    const maxAttempts = Number.isFinite(configuredAttempts)
      ? Math.max(1, Math.floor(configuredAttempts))
      : 1;
    const retryDelay = Math.max(0, options?.retryOnError?.delay ?? 0);

    while (attemptState.count < maxAttempts) {
      attemptState.count += 1;

      try {
        const result = await operation();
        const shouldRetry = shouldRetryResult?.(result) ?? false;
        if (
          !shouldRetry ||
          attemptState.count >= maxAttempts ||
          options?.signal?.aborted ||
          !canRetry()
        ) {
          return result;
        }
      } catch (error) {
        if (
          error instanceof ActionValidationError ||
          attemptState.count >= maxAttempts ||
          options?.signal?.aborted ||
          !canRetry()
        ) {
          throw error;
        }
      }

      await this.waitForRetry(retryDelay, options?.signal);
    }

    // The loop always returns or throws. This protects the generic return type
    // if an invalid retry configuration somehow reaches this point.
    return operation();
  }

  private trackDispatchPromise<R>(promise: Promise<R>): Promise<R> {
    this.activeDispatches.add(promise);
    const remove = () => this.activeDispatches.delete(promise);
    void promise.then(remove, remove);
    return promise;
  }

  private trackHandlerPromise<R>(
    promise: Promise<R>,
    dispatchHandlerPromises: DispatchHandlerPromises
  ): Promise<R> {
    this.activeHandlerPromises.add(promise);
    dispatchHandlerPromises.add(promise);
    const remove = () => {
      this.activeHandlerPromises.delete(promise);
      dispatchHandlerPromises.delete(promise);
    };
    void promise.then(remove, remove);
    return promise;
  }

  private trackGlobalHandlerPromise<R>(promise: Promise<R>): Promise<R> {
    this.activeHandlerPromises.add(promise);
    const remove = () => this.activeHandlerPromises.delete(promise);
    void promise.then(remove, remove);
    return promise;
  }

  /** Abort-aware retry delay so cancellation does not wait for the full backoff. */
  private waitForRetry(delay: number, signal?: AbortSignal): Promise<void> {
    if (delay <= 0 || signal?.aborted) return Promise.resolve();

    return new Promise(resolve => {
      const timer = setTimeout(finish, delay);
      const abort = () => finish();

      function finish() {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        resolve();
      }

      signal?.addEventListener('abort', abort, { once: true });
    });
  }

  /** Build a wall-clock timeout that also participates in pipeline cancellation. */
  private createTimeoutScope<K extends keyof T>(
    action: K,
    options?: DispatchOptions
  ): {
    options: DispatchOptions | undefined;
    timeoutPromise?: Promise<never>;
    onTimeout: (callback: (error: ActionTimeoutError) => void) => void;
    cleanup: () => void;
    cleanupSignals: () => void;
  } {
    const configuredTimeout = options?.timeout;
    if (
      configuredTimeout !== undefined &&
      (!Number.isFinite(configuredTimeout) || configuredTimeout < 0)
    ) {
      throw new RangeError('timeout must be a non-negative finite number.');
    }
    const hasTimeout = configuredTimeout !== undefined;
    const timeout = configuredTimeout;
    const timeoutController = hasTimeout ? new AbortController() : undefined;
    const signalCleanups: Array<() => void> = [];
    const timeoutCallbacks = new Set<(error: ActionTimeoutError) => void>();
    const signals = [
      this.lifecycleController.signal,
      options?.signal,
      timeoutController?.signal,
    ].filter((candidate): candidate is AbortSignal => Boolean(candidate));
    let signal = signals[0]!;

    if (signals.length > 1) {
      if (typeof (AbortSignal as typeof AbortSignal & {
        any?: (signals: AbortSignal[]) => AbortSignal;
      }).any === 'function') {
        signal = (AbortSignal as typeof AbortSignal & {
          any: (signals: AbortSignal[]) => AbortSignal;
        }).any(signals);
      } else {
        const mergedController = new AbortController();
        const forwardAbort = (source: AbortSignal) => {
          if (!mergedController.signal.aborted) mergedController.abort(source.reason);
        };

        for (const source of signals) {
          if (source.aborted) {
            forwardAbort(source);
            break;
          }
          const listener = () => forwardAbort(source);
          source.addEventListener('abort', listener, { once: true });
          signalCleanups.push(() => source.removeEventListener('abort', listener));
        }
        signal = mergedController.signal;
      }
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = timeoutController && timeout !== undefined
      ? new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            const error = new ActionTimeoutError(String(action), timeout);
            timeoutController.abort(error);
            timeoutCallbacks.forEach(callback => callback(error));
            reject(error);
          }, timeout);
        })
      : undefined;

    return {
      options: { ...options, signal },
      timeoutPromise,
      onTimeout: callback => timeoutCallbacks.add(callback),
      cleanup: () => {
        if (timer !== undefined) clearTimeout(timer);
        timeoutCallbacks.clear();
      },
      cleanupSignals: () => signalCleanups.forEach(cleanup => cleanup()),
    };
  }

  /** Expose timeout failure while allowing the queued operation to drain safely. */
  private raceWithTimeout<R>(
    operation: Promise<R>,
    scope: {
      timeoutPromise?: Promise<never>;
      cleanup: () => void;
      cleanupSignals: () => void;
    },
    dispatchHandlerPromises: DispatchHandlerPromises
  ): Promise<R> {
    const exposed = scope.timeoutPromise
      ? Promise.race([operation, scope.timeoutPromise])
      : operation;
    const cleanupAfterStartedHandlers = () => {
      // Successful completion must cancel the ref'ed timeout timer immediately.
      // Only fallback signal-forwarding listeners need to outlive race losers.
      scope.cleanup();
      this.cleanupSignalsAfterStartedHandlers(
        scope.cleanupSignals,
        dispatchHandlerPromises
      );
    };
    void exposed.then(cleanupAfterStartedHandlers, cleanupAfterStartedHandlers);
    return exposed;
  }

  private cleanupSignalsAfterStartedHandlers(
    cleanup: () => void,
    dispatchHandlerPromises: DispatchHandlerPromises
  ): void {
    const handlersStillRunning = [...dispatchHandlerPromises];
    if (handlersStillRunning.length === 0) {
      cleanup();
      return;
    }

    // In AbortSignal.any() fallback environments, this dispatch's signal
    // forwarding listeners must outlive its race-mode losers even though the
    // exposed dispatch resolved. Unrelated dispatches must not delay cleanup.
    void Promise.allSettled(handlersStillRunning).then(cleanup);
  }

  /** Invoke the configured error handler without allowing it to replace the dispatch error. */
  private invokeErrorHandler<K extends keyof T>(
    error: unknown,
    action: K,
    payload: T[K] | undefined,
    options: DispatchOptions | undefined,
    attempts: number
  ): void {
    const errorHandler = this.registryConfig?.errorHandler;
    if (!errorHandler) return;

    const normalizedError = error instanceof Error ? error : new Error(String(error));
    try {
      const handlerResult = errorHandler(normalizedError, {
        action: String(action),
        payload,
        options,
        attempts,
        phase: normalizedError instanceof ActionTimeoutError
          ? 'timeout'
          : normalizedError instanceof ActionValidationError
            ? 'validation'
            : 'execution',
      });
      if (handlerResult && typeof (handlerResult as PromiseLike<void>).then === 'function') {
        void Promise.resolve(handlerResult).catch(handlerError => {
          this.log('Global async error handler failed', handlerError, 'warn');
        });
      }
    } catch (handlerError) {
      this.log('Global error handler failed', handlerError, 'warn');
    }
  }

  /**
   * Validate an action payload against the configured schema.
   * Shared by all dispatch paths so result collection cannot bypass validation.
   */
  private validatePayload<K extends keyof T>(
    action: K,
    payload?: T[K]
  ): ExecutionResult<never>['validation'] {
    if (
      !this.registryConfig?.schema ||
      this.registryConfig.validateOnDispatch === false
    ) {
      return undefined;
    }

    const actionName = String(action);
    const actionSchema = this.registryConfig.schema[actionName];
    if (!actionSchema) {
      return undefined;
    }

    let result: ReturnType<typeof actionSchema.safeParse>;
    try {
      result = actionSchema.safeParse(payload);
    } catch (error) {
      throw new ActionValidationError(actionName, error);
    }
    if (result.success) {
      return { passed: true, errors: [] };
    }

    const mode = this.registryConfig.validationMode ?? 'strict';
    if (mode === 'strict') {
      throw new ActionValidationError(actionName, result.error);
    }

    if (mode === 'warn') {
      console.warn(
        `Action "${actionName}" payload validation failed:`,
        result.error.message
      );
      this.log(`Validation warning for action '${actionName}'`, {
        issues: result.error.issues,
      }, 'warn');
    }

    return {
      passed: false,
      errors: result.error.issues.map(issue => issue.message),
    };
  }

  private createAbortedExecutionResult<R>(
    startTime: number,
    handlersSkipped: number = 0,
    validation?: ExecutionResult<R>['validation']
  ): ExecutionResult<R> {
    const endTime = Date.now();

    return {
      success: false,
      aborted: true,
      abortReason: 'Action dispatch aborted by signal',
      terminated: false,
      validation,
      result: undefined,
      successResults: [],
      results: [],
      failedResults: [],
      execution: {
        duration: endTime - startTime,
        handlersExecuted: 0,
        handlersSkipped,
        handlersFailed: 0,
        startTime,
        endTime,
      },
      handlers: [],
      errors: [],
    };
  }

  /**
   * 🆕 실제 디스패치 작업 수행 (큐에서 호출됨)
   */
  private async _performDispatch<K extends keyof T>(
    action: K,
    payload: T[K] | undefined,
    options: DispatchOptions | undefined,
    skipGuards: boolean,
    executedHandlers: HandlerRegistration<any, any>[],
    dispatchHandlerPromises: DispatchHandlerPromises
  ): Promise<void> {
    // 🔍 디스패치 시작 디버그
    this.log(`Starting dispatch for action '${String(action)}'`, {
      hasPayload: payload !== undefined,
      payloadType: payload?.constructor?.name || typeof payload,
      options: options ? Object.keys(options) : 'none',
      timestamp: new Date().toISOString()
    });
    
    // Event object detection is diagnostics-only and explicitly opt-in.
    if (this.isDebugMode && typeof Event !== 'undefined' && payload instanceof Event) {
      console.warn(`Event object passed to action "${String(action)}"`, payload.type);
    }

    // 🔧 Improved AbortSignal handling with cleaner merge logic
    const [effectiveSignal, autoAbortController, cleanup] = this.createAbortSignal(options);
    
    if (options?.autoAbort?.onControllerCreated && autoAbortController) {
      options.autoAbort.onControllerCreated(autoAbortController);
    }
    
    // Check if dispatch is aborted before starting
    if (effectiveSignal?.aborted) {
      this.log(`Dispatch aborted before execution for '${String(action)}'`);
      cleanup();
      return;
    }
    
    const pipeline = this.pipelines.get(action);
    
    // 🔍 파이프라인 존재 여부 디버그
    this.log(`Pipeline lookup for '${String(action)}'`, {
      pipelineExists: Boolean(pipeline),
      handlersCount: pipeline?.length || 0,
      allRegisteredActions: Array.from(this.pipelines.keys()),
      pipelineMap: Object.fromEntries(Array.from(this.pipelines.entries()).map(([k, v]) => [k, v.length]))
    });
    
    if (!pipeline || pipeline.length === 0) {
      // 🚨 경고: 핸들러가 등록되지 않은 액션 실행
      const warningMessage = `⚠️ Action '${String(action)}' has no registered handlers. This action will be ignored.`;
      
      if (this.isDebugMode) {
        console.warn(warningMessage);
        console.warn('💡 Tip: Register a handler using registry.register() before dispatching this action.');
        console.warn('📋 Available actions:', Array.from(this.pipelines.keys()));
      }
      
      this.log(`No handlers found for action '${String(action)}', dispatch cancelled`, {}, 'warn');
      cleanup();
      return;
    }

    // 🆕 Optimize filtering - only copy array if filtering is needed
    const filteredHandlers = options?.filter 
      ? this.filterHandlers(pipeline, options.filter)
      : pipeline;

    // Apply ActionGuard controls - check both dispatch options and handler configs
    const actionKey = String(action);
    
    // Get throttle/debounce settings from dispatch options or handler configs
    let throttleMs: number | undefined;
    let debounceMs: number | undefined;
    
    // Priority: dispatch options > handler config
    if (options?.throttle !== undefined) {
      throttleMs = options.throttle;
    } else if (filteredHandlers.length > 0) {
      // Use throttle from the first handler that has it (handlers are sorted by priority)
      for (const handler of filteredHandlers) {
        if (handler.config.throttle !== undefined) {
          throttleMs = handler.config.throttle;
          break;
        }
      }
    }
    
    if (options?.debounce !== undefined) {
      debounceMs = options.debounce;
    } else if (filteredHandlers.length > 0) {
      // Use debounce from the first handler that has it (handlers are sorted by priority)
      for (const handler of filteredHandlers) {
        if (handler.config.debounce !== undefined) {
          debounceMs = handler.config.debounce;
          break;
        }
      }
    }
    
    // Apply debounce if specified
    if (!skipGuards && debounceMs !== undefined) {
      const shouldProceed = await this.actionGuard.debounce(actionKey, debounceMs);
      if (!shouldProceed) {
        cleanup();
        return; // Debounced - don't execute
      }
    }
    
    // Apply throttle if specified
    if (!skipGuards && throttleMs !== undefined) {
      const shouldProceed = this.actionGuard.throttle(actionKey, throttleMs);
      if (!shouldProceed) {
        cleanup();
        return; // Throttled - don't execute
      }
    }

    // The signal may have been aborted while awaiting debounce.
    if (effectiveSignal?.aborted) {
      this.log(`Dispatch aborted during guard processing for '${String(action)}'`);
      cleanup();
      return;
    }

    // Determine execution mode for this action (with option override)
    const currentExecutionMode = options?.executionMode || 
                                this.actionExecutionModes.get(action) || 
                                this.executionMode;

    // Create pipeline execution context
    const context: PipelineContext<T[K], any> = {
      action: String(action),
      payload: payload as T[K],
      handlers: [...filteredHandlers],
      executedHandlers: [],
      deferOnceCleanup: true,
      signal: effectiveSignal ?? this.lifecycleController.signal,
      trackHandlerPromise: promise => this.trackHandlerPromise(
        promise,
        dispatchHandlerPromises
      ),
      aborted: false,
      abortReason: undefined as string | undefined,
      currentIndex: 0,
      jumpToPriority: undefined as number | undefined,
      jumpCount: 0,
      maxJumps: this.maxJumps,
      executionMode: currentExecutionMode,
      
      // New result collection fields
      results: [],
      terminated: false,
      terminationResult: undefined as any,
    };

    
    // Add abort listener if signal provided (use effectiveSignal for auto-abort)
    const abortHandler = effectiveSignal ? () => {
      context.aborted = true;
      context.abortReason = typeof effectiveSignal.reason === 'string'
        ? effectiveSignal.reason
        : 'Action dispatch aborted by signal';
    } : undefined;
    
    if (effectiveSignal && abortHandler) {
      effectiveSignal.addEventListener('abort', abortHandler, { once: true });
    }
    
    
    try {
      await this.executePipeline(
        context,
        dispatchHandlerPromises,
        autoAbortController,
        options?.autoAbort
      );
      this.log(`Pipeline execution succeeded for ${String(action)}`);
    } catch (error) {
      this.log(`Pipeline execution failed for ${String(action)}`, error, 'error');
      throw error;
    } finally {
      executedHandlers?.push(...(context.executedHandlers ?? []));
      if (effectiveSignal && abortHandler) {
        effectiveSignal.removeEventListener('abort', abortHandler);
      }
      this.cleanupSignalsAfterStartedHandlers(cleanup, dispatchHandlerPromises);
    }
  }

  /**
   * Dispatch an action and return detailed execution results
   * 
   * @param action - The action type to dispatch
   * @param payload - The action payload data
   * @param options - Optional dispatch options including result collection strategy
   * 
   * @returns Promise resolving to comprehensive execution results
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
   * 
   * @public
   */
  dispatchWithResult<K extends keyof T, R = void>(
    action: K,
    ...args: DispatchArgs<T[K]>
  ): Promise<ExecutionResult<R>> {
    const [payload, options] = args as [T[K] | undefined, DispatchOptions | undefined];
    if (this.lifecycleState !== 'active') {
      return this.rejectedLifecyclePromise<ExecutionResult<R>>();
    }

    const timeoutScope = this.createTimeoutScope(action, options);
    const dispatchHandlerPromises: DispatchHandlerPromises = new Set();
    const attemptState = { count: 0 };
    let validation: ExecutionResult<R>['validation'];

    const operation = async () => {
      if (!timeoutScope.options?.signal?.aborted) {
        validation = this.validatePayload(action, payload);
      }

      return this.executeWithRetry(async () => {
        const executedHandlers: HandlerRegistration<any, any>[] = [];
        try {
          return await this._performDispatchWithResult<K, R>(
            action,
            payload,
            timeoutScope.options,
            validation,
            attemptState.count > 1,
            executedHandlers,
            dispatchHandlerPromises
          );
        } finally {
          this.cleanupOneTimeHandlers(
            action,
            executedHandlers,
            dispatchHandlerPromises
          );
        }
      }, timeoutScope.options, attemptState, result => (
        !result.success &&
        !result.aborted &&
        this.getHandlerCount(action) > 0
      ), () => this.getHandlerCount(action) > 0);
    };

    // Result dispatches historically executed immediately. Preserve that
    // behavior for nested dispatch and debounce compatibility; queuePriority is
    // the explicit opt-in to shared queue ordering.
    const shouldQueue = (
      !timeoutScope.options?.immediate &&
      Boolean(this.dispatchQueue) &&
      timeoutScope.options?.queuePriority !== undefined
    );
    let dispatchPromise: Promise<ExecutionResult<R>>;
    this.dispatchConstructionDepth += 1;
    try {
      if (shouldQueue) {
        const queued = this.dispatchQueue!.enqueueWithHandle(
          operation,
          timeoutScope.options!.queuePriority!
        );
        timeoutScope.onTimeout(error => queued.cancel(error));
        dispatchPromise = queued.promise;
      } else {
        dispatchPromise = operation();
      }
      this.trackDispatchPromise(dispatchPromise);
    } finally {
      this.dispatchConstructionDepth -= 1;
    }
    const exposedPromise = this.raceWithTimeout(
      dispatchPromise,
      timeoutScope,
      dispatchHandlerPromises
    );
    const observedPromise = exposedPromise.then(result => {
      if (!result.success && !result.aborted) {
        const terminalError = result.errors[result.errors.length - 1]?.error
          ?? new Error(`Action "${String(action)}" failed`);
        this.invokeErrorHandler(
          terminalError,
          action,
          payload,
          options,
          attemptState.count
        );
      }
      return result;
    }, error => {
      this.invokeErrorHandler(error, action, payload, options, attemptState.count);
      throw error;
    });

    void observedPromise.catch(() => {});
    return observedPromise;
  }

  private async _performDispatchWithResult<K extends keyof T, R = void>(
    action: K,
    payload: T[K] | undefined,
    options: DispatchOptions | undefined,
    validation: ExecutionResult<R>['validation'],
    skipGuards: boolean,
    executedHandlers: HandlerRegistration<any, any>[],
    dispatchHandlerPromises: DispatchHandlerPromises
  ): Promise<ExecutionResult<R>> {
    const _startTime = Date.now();
    
    // 🔧 Improved AbortSignal handling with cleaner merge logic (same as dispatch)
    const [effectiveSignal, autoAbortController, cleanup] = this.createAbortSignal(options);
    
    if (options?.autoAbort?.onControllerCreated && autoAbortController) {
      options.autoAbort.onControllerCreated(autoAbortController);
    }
    
    // Check if dispatch is aborted before starting
    if (effectiveSignal?.aborted) {
      cleanup();
      return this.createAbortedExecutionResult<R>(_startTime, 0, validation);
    }
    
    const pipeline = this.pipelines.get(action);
    
    if (!pipeline || pipeline.length === 0) {
      // 🚨 경고: 핸들러가 등록되지 않은 액션 실행
      const warningMessage = `⚠️ Action '${String(action)}' has no registered handlers. This action will be ignored.`;
      
      if (this.isDebugMode) {
        console.warn(warningMessage);
        console.warn('💡 Tip: Register a handler using registry.register() before dispatching this action.');
        console.warn('📋 Available actions:', Array.from(this.pipelines.keys()));
      }
      
      cleanup();
      return {
        success: true,
        aborted: false,
        abortReason: undefined as string | undefined,
        terminated: false,
        validation,
        result: undefined as any,
        successResults: [] as any,
        results: [],
        failedResults: [],
        execution: {
          duration: 0,
          handlersExecuted: 0,
          handlersSkipped: 0,
          handlersFailed: 0,
          startTime: _startTime,
          endTime: _startTime,
        },
        handlers: [],
        errors: [],
      };
    }

    // 🆕 Optimize filtering - only copy array if filtering is needed
    const filteredHandlers = options?.filter 
      ? this.filterHandlers(pipeline, options.filter)
      : pipeline;

    // 🔧 Apply ActionGuard controls using unified method with ExecutionResult return
    const actionKey = String(action);
    const guardResult = skipGuards
      ? null
      : await this.applyActionGuardControlsWithResult<R>(
          actionKey,
          filteredHandlers,
          options,
          _startTime,
          pipeline.length
        );

    // The signal may have been aborted while awaiting debounce.
    if (effectiveSignal?.aborted) {
      cleanup();
      return this.createAbortedExecutionResult<R>(_startTime, pipeline.length, validation);
    }

    if (guardResult) {
      cleanup();
      return { ...guardResult, validation }; // Throttled or debounced
    }

    // Determine execution mode for this action (with option override)
    const currentExecutionMode = options?.executionMode || 
                                this.actionExecutionModes.get(action) || 
                                this.executionMode;

    // Create pipeline execution context
    const context: PipelineContext<T[K], R> = {
      action: String(action),
      payload: payload as T[K],
      handlers: [...filteredHandlers],
      executedHandlers: [],
      deferOnceCleanup: true,
      signal: effectiveSignal ?? this.lifecycleController.signal,
      trackHandlerPromise: promise => this.trackHandlerPromise(
        promise,
        dispatchHandlerPromises
      ),
      aborted: false,
      abortReason: undefined as string | undefined,
      currentIndex: 0,
      jumpToPriority: undefined as number | undefined,
      jumpCount: 0,
      maxJumps: this.maxJumps,
      executionMode: currentExecutionMode,
      
      // Result collection fields
      results: [],
      terminated: false,
      terminationResult: undefined as R | undefined,
    };

    let executionError: Error | undefined;
    const handlerResults: Array<{
      id: string;
      executed: boolean;
      duration: number | undefined;
      result: R | undefined;
      error: Error | undefined;
      metadata: Record<string, any> | undefined;
    }> = [];


    // Initialize handler tracking - all handlers start as not executed
    filteredHandlers.forEach(handler => {
      handlerResults.push({
        id: handler.config.id,
        executed: false,
        duration: undefined as number | undefined,
        result: undefined as R | undefined,
        error: undefined as Error | undefined,
        metadata: undefined as Record<string, any> | undefined,
      });
    });

    // Add abort listener if signal provided (use effectiveSignal for auto-abort)
    const abortHandler = effectiveSignal ? () => {
      context.aborted = true;
      context.abortReason = typeof effectiveSignal.reason === 'string'
        ? effectiveSignal.reason
        : 'Action dispatch aborted by signal';
    } : undefined;
    
    if (effectiveSignal && abortHandler) {
      effectiveSignal.addEventListener('abort', abortHandler, { once: true });
    }
    
    // 🔧 Initialize errors array (will be updated after pipeline execution)
    let errors: HandlerError[] = [];
    
    try {
      await this.executePipeline(
        context,
        dispatchHandlerPromises,
        autoAbortController,
        options?.autoAbort
      );
      
      // 🔧 Collect errors from execution context after pipeline execution
      const contextWithErrors = context as PipelineContext<any, any> & { collectedErrors?: HandlerError[] };
      errors = contextWithErrors.collectedErrors || [];
      
    } catch (error) {
      // 🔧 Collect errors from execution context before adding pipeline error
      const contextWithErrors = context as PipelineContext<any, any> & { collectedErrors?: HandlerError[] };
      errors = contextWithErrors.collectedErrors || [];
      
      executionError = error instanceof Error ? error : new Error(String(error));
      errors.push({
        handlerId: 'pipeline',
        error: executionError,
        timestamp: Date.now(),
        severity: 'blocking'
      });
      
    } finally {
      executedHandlers.push(...(context.executedHandlers ?? []));
      if (effectiveSignal && abortHandler) {
        effectiveSignal.removeEventListener('abort', abortHandler);
      }
      this.cleanupSignalsAfterStartedHandlers(cleanup, dispatchHandlerPromises);
    }

    const endTime = Date.now();
    
    // Process results based on options
    const processedResult = this.processResults(context, options?.result);

    // Derive execution metrics from registrations actually invoked by the
    // executor. currentIndex only describes sequential control flow and is
    // therefore not meaningful for parallel/race execution.
    const executedHandlerIds = new Set(
      (context.executedHandlers ?? []).map(handler => handler.id)
    );
    filteredHandlers.forEach(handler => {
      const handlerResult = handlerResults.find(result => result.id === handler.config.id);
      if (handlerResult) {
        handlerResult.executed = executedHandlerIds.has(handler.id);
      }
    });
    const handlerErrors = errors.filter(error => error.handlerId !== 'pipeline');
    const reportedErrors = executionError
      ? errors.filter(error => error.handlerId === 'pipeline')
      : errors;
    const executionHandlersCount = context.aborted && currentExecutionMode === 'sequential'
      ? Math.min(context.currentIndex, filteredHandlers.length)
      : executedHandlerIds.size;

    // 🔧 Type safety: Separate successful results from failed ones
    const successResults = context.results.filter((result): result is R => result !== undefined);
    const failedResults = handlerErrors.map(err => ({
      handlerId: err.handlerId,
      error: err.error,
      expectedType: typeof processedResult
    }));

    // Build execution result with improved type safety
    const executionResult: ExecutionResult<R> = {
      success: !executionError && !context.aborted,
      aborted: context.aborted,
      abortReason: context.abortReason,
      terminated: context.terminated,
      validation,
      result: processedResult,
      successResults: successResults,
      results: context.results,
      failedResults,
      execution: {
        duration: endTime - _startTime,
        handlersExecuted: executionHandlersCount,
        handlersSkipped: Math.max(0, filteredHandlers.length - executionHandlersCount),
        handlersFailed: handlerErrors.length,
        startTime: _startTime,
        endTime,
      },
      handlers: handlerResults,
      errors: reportedErrors.map(err => ({
        handlerId: err.handlerId,
        error: err.error,
        timestamp: err.timestamp,
        severity: err.severity
      })),
    };

    return executionResult;
  }

  /**
   * 🔧 Unified method for dispatchWithResult that returns ExecutionResult on guard rejection
   */
  private async applyActionGuardControlsWithResult<R>(
    actionKey: string,
    filteredHandlers: HandlerRegistration<any, any>[],
    options: DispatchOptions | undefined,
    startTime: number,
    pipelineLength: number
  ): Promise<ExecutionResult<R> | null> {
    // Get throttle/debounce settings (same logic as above)
    let throttleMs: number | undefined;
    let debounceMs: number | undefined;
    
    if (options?.throttle !== undefined) {
      throttleMs = options.throttle;
    } else if (filteredHandlers.length > 0) {
      for (const handler of filteredHandlers) {
        if (handler.config.throttle !== undefined) {
          throttleMs = handler.config.throttle;
          break;
        }
      }
    }
    
    if (options?.debounce !== undefined) {
      debounceMs = options.debounce;
    } else if (filteredHandlers.length > 0) {
      for (const handler of filteredHandlers) {
        if (handler.config.debounce !== undefined) {
          debounceMs = handler.config.debounce;
          break;
        }
      }
    }
    
    // Apply debounce if specified
    if (debounceMs !== undefined) {
      const shouldProceed = await this.actionGuard.debounce(actionKey, debounceMs);
      if (!shouldProceed) {
        return {
          success: false,
          aborted: true,
          abortReason: 'Debounced execution',
          terminated: false,
          result: undefined as any,
          successResults: [] as any,
          results: [],
          failedResults: [],
          execution: {
            duration: Date.now() - startTime,
            handlersExecuted: 0,
            handlersSkipped: pipelineLength,
            handlersFailed: 0,
            startTime: startTime,
            endTime: Date.now(),
          },
          handlers: [],
          errors: [],
        };
      }
    }
    
    // Apply throttle if specified
    if (throttleMs !== undefined) {
      const shouldProceed = this.actionGuard.throttle(actionKey, throttleMs);
      if (!shouldProceed) {
        return {
          success: false,
          aborted: true,
          abortReason: 'Throttled execution',
          terminated: false,
          result: undefined as any,
          successResults: [] as any,
          results: [],
          failedResults: [],
          execution: {
            duration: Date.now() - startTime,
            handlersExecuted: 0,
            handlersSkipped: pipelineLength,
            handlersFailed: 0,
            startTime: startTime,
            endTime: Date.now(),
          },
          handlers: [],
          errors: [],
        };
      }
    }

    return null; // No guard intervention, proceed with execution
  }

  // Cache invalidation removed for memory stability

  /**
   * 🔧 Create or reuse PipelineController from pool for better performance
   */
  private getControllerFromPool<K extends keyof T>(
    context: PipelineContext<T[K], any>, 
    autoAbortController?: AbortController,
    autoAbortOptions?: { allowHandlerAbort?: boolean }
  ): PipelineController<T[K], any> {
    // Try to reuse from pool
    let controller = this.controllerPool.pop();
    
    if (!controller) {
      // Create new controller if pool is empty
      controller = {} as PipelineController<T[K], any>;
    }

    // Configure/reset the controller for current context
    (controller as { signal: AbortSignal }).signal =
      context.signal ?? this.lifecycleController.signal;

    controller.abort = (reason?: string) => {
      context.aborted = true;
      context.abortReason = reason;
      
      // Auto-abort: Handler can trigger pipeline abort if enabled
      if (autoAbortController && autoAbortOptions?.allowHandlerAbort) {
        autoAbortController.abort(reason);
      }
    };

    controller.modifyPayload = (modifier: (payload: T[K]) => T[K]) => {
      try {
        context.payload = modifier(context.payload);
      } catch (modificationError) {
        // 🔧 Fix: Don't let payload modification errors crash the pipeline
        this.log('Payload modification error', modificationError, 'warn');
        // Keep original payload on modification error
      }
    };

    controller.getPayload = () => context.payload;

    controller.jumpToPriority = (priority: number) => {
      context.jumpToPriority = priority;
    };

    controller.return = (result: any) => {
      context.terminated = true;
      context.terminationResult = result;
    };

    controller.setResult = (result: any) => {
      context.results.push(result);
    };

    controller.getResults = () => {
      return [...context.results];
    };

    controller.mergeResult = (merger: (previousResults: any[], currentResult: any) => any) => {
      const currentResult = context.results[context.results.length - 1];
      const previousResults = context.results.slice(0, -1);
      const mergedResult = merger(previousResults, currentResult);
      context.results[context.results.length - 1] = mergedResult;
    };

    return controller;
  }

  private filterHandlers(
    handlers: HandlerRegistration<any, any>[],
    filterOptions?: DispatchOptions['filter']
  ): HandlerRegistration<any, any>[] {
    if (!filterOptions) {
      return handlers;
    }

    // Cache disabled for memory stability

    // Cache disabled - using direct filtering for memory stability

    // Create Sets for fast lookup if arrays are provided
    const handlerIdSet = filterOptions.handlerIds ? new Set(filterOptions.handlerIds) : null;
    const excludeIdSet = filterOptions.excludeHandlerIds ? new Set(filterOptions.excludeHandlerIds) : null;

    // Filter handlers with optimized checks
    const filtered = handlers.filter(registration => {
      const config = registration.config;

      // Fast Set-based inclusion check
      if (handlerIdSet && !handlerIdSet.has(config.id)) {
        return false;
      }

      // Fast Set-based exclusion check
      if (excludeIdSet?.has(config.id)) {
        return false;
      }

      // Priority range check
      if (filterOptions.priority) {
        const priority = config.priority;
        if (filterOptions.priority.min !== undefined && priority < filterOptions.priority.min) {
          return false;
        }
        if (filterOptions.priority.max !== undefined && priority > filterOptions.priority.max) {
          return false;
        }
      }

      // Custom filter (not cached)
      if (filterOptions.custom && !filterOptions.custom(config)) {
        return false;
      }

      return true;
    });

    // Cache disabled for memory stability

    return filtered;
  }

  private processResults<R>(
    context: PipelineContext<any, R>,
    resultOptions?: DispatchOptions['result']
  ): R | R[] | undefined {
    const results = context.results;

    // 🔧 Fix: Always handle termination result regardless of collect option
    if (context.terminated && context.terminationResult !== undefined) {
      return context.terminationResult;
    }

    // 🔧 Fix: Return undefined only if no results options specified AND no results available
    if (!resultOptions) {
      // If no result options specified but we have results, return the last one
      return results.length > 0 ? results[results.length - 1] : undefined;
    }

    // 🔧 Fix: Process results even when collect is false if we have a strategy specified
    if (!resultOptions.collect && !resultOptions.strategy) {
      return undefined;
    }

    // Apply maxResults limit
    const limitedResults = resultOptions.maxResults
      ? results.slice(0, resultOptions.maxResults)
      : results;

    if (limitedResults.length === 0) {
      return undefined;
    }

    // Process results based on strategy with improved type handling
    switch (resultOptions.strategy) {
      case 'first':
        return limitedResults[0];
      case 'last':
        return limitedResults[limitedResults.length - 1];
      case 'all':
        return limitedResults;
      case 'merge':
        if (resultOptions.merger) {
          return resultOptions.merger(limitedResults);
        }
        // Default merge: return last result
        return limitedResults[limitedResults.length - 1];
      case 'custom':
        if (resultOptions.merger) {
          return resultOptions.merger(limitedResults);
        }
        throw new Error('Custom result strategy requires a merger function');
      default:
        // 🔧 Fix: If collect is true but no strategy specified, return all results
        if (resultOptions.collect) {
          return limitedResults;
        }
        // Default: return last result if no strategy specified
        return limitedResults[limitedResults.length - 1];
    }
  }

  private async executePipeline<K extends keyof T>(
    context: PipelineContext<T[K], any>,
    dispatchHandlerPromises: DispatchHandlerPromises,
    autoAbortController?: AbortController,
    autoAbortOptions?: { allowHandlerAbort?: boolean }
  ): Promise<void> {
    const createController = (_registration: HandlerRegistration<T[K], any>, _index: number): PipelineController<T[K], any> => {
      return this.getControllerFromPool(context, autoAbortController, autoAbortOptions);
    };

    switch (context.executionMode) {
      case 'sequential':
        await executeSequential<T[K], any>(context, createController);
        break;
      case 'parallel':
        await executeParallel<T[K], any>(context, createController);
        break;
      case 'race':
        await executeRace<T[K], any>(context, createController);
        break;
      default:
        throw new Error(`Unknown execution mode: ${context.executionMode}`);
    }

    if (!context.deferOnceCleanup) {
      this.cleanupOneTimeHandlers(
        context.action as K,
        context.executedHandlers ?? [],
        dispatchHandlerPromises
      );
    }
  }

  private cleanupOneTimeHandlers<K extends keyof T>(
    action: K,
    executedHandlers: HandlerRegistration<any, any>[],
    dispatchHandlerPromises: DispatchHandlerPromises
  ): void {
    const oneTimeHandlers = executedHandlers.filter(reg => reg.config.once);
    if (oneTimeHandlers.length === 0) return;

    // Race mode returns its winner while loser handlers can still be active.
    // Detach every invoked once-handler immediately so retries cannot invoke it
    // again, but defer resource cleanup until this dispatch's started handler
    // work drains. Unrelated dispatches must not delay cleanup.
    const handlersStillRunning = [...dispatchHandlerPromises];
    const shouldDeferCleanup = handlersStillRunning.length > 0;

    oneTimeHandlers.forEach(registration => {
      if (this.removeRegistration(action, registration, !shouldDeferCleanup)) {
        if (
          shouldDeferCleanup &&
          typeof registration.config.cleanup === 'function'
        ) {
          const cleanupPromise = Promise.allSettled(handlersStillRunning).then(() => {
            this.runRegistrationCleanup(action, registration);
          });
          void this.trackGlobalHandlerPromise(cleanupPromise).catch(() => {});
        }

        this.log(`One-time handler removed: ${String(action)}`, {
          handlerId: registration.id,
          remainingHandlers: this.getHandlerCount(action)
        });
      }
    });
  }


  /**
   * Get the number of registered handlers for an action
   * 
   * @param action - The action type to count handlers for
   * 
   * @returns Number of registered handlers
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
   * 
   * @public
   */
  getHandlerCount<K extends keyof T>(action: K): number {
    const pipeline = this.pipelines.get(action);
    return pipeline ? pipeline.length : 0;
  }

  /**
   * Check if an action has any registered handlers
   * 
   * @param action - The action type to check
   * 
   * @returns True if action has handlers, false otherwise
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
   * 
   * @public
   */
  hasHandlers<K extends keyof T>(action: K): boolean {
    return this.getHandlerCount(action) > 0;
  }

  /**
   * Get all registered action types
   * 
   * @returns Array of all registered action types
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
   * 
   * @public
   */
  getRegisteredActions(): (keyof T)[] {
    return Array.from(this.pipelines.keys());
  }

  /**
   * Remove all handlers for a specific action
   * 
   * @param action - The action type to clear handlers for
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
   * 
   * @public
   */
  clearAction<K extends keyof T>(action: K): void {
    const pipeline = this.pipelines.get(action);
    if (pipeline) {
      [...pipeline].forEach(registration => {
        this.removeRegistration(action, registration);
      });
    }

    this.pipelines.delete(action);
    this.lastRegisteredTimestamps.delete(action);
    this.actionGuard.clearGuards(String(action));
  }

  /**
   * Remove all handlers for all actions
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
   * 
   * @public
   */
  clearAll(): void {
    [...this.pipelines.keys()].forEach(action => {
      this.clearAction(action);
    });

    this.pipelines.clear();
    this.lastRegisteredTimestamps.clear();
    this.unregisterFunctions.clear();
    this.actionGuard.clearAll();
  }

  /**
   * Get the name of this action register
   * 
   * @returns The register name
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
   * 
   * @public
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get comprehensive registry information (similar to DeclarativeStoreRegistry pattern)
   * 
   * @returns Registry information including actions, handlers, and execution modes
   */
  getRegistryInfo(): ActionRegistryInfo<T> {
    const totalHandlers = Array.from(this.pipelines.values()).reduce(
      (total, pipeline) => total + pipeline.length, 
      0
    );
    
    return {
      name: this.name,
      totalActions: this.pipelines.size,
      totalHandlers,
      registeredActions: Array.from(this.pipelines.keys()),
      actionExecutionModes: new Map(this.actionExecutionModes),
      defaultExecutionMode: this.executionMode,
    };
  }

  /**
   * Get detailed statistics for a specific action
   * 
   * @param action Action name to get statistics for
   * @returns Detailed handler statistics
   */
  getActionStats<K extends keyof T>(action: K): ActionHandlerStats<T> | null {
    const pipeline = this.pipelines.get(action);
    if (!pipeline) {
      return null;
    }

    // Group handlers by priority
    const priorityMap = new Map<number, typeof pipeline>();
    pipeline.forEach(handler => {
      if (!priorityMap.has(handler.config.priority)) {
        priorityMap.set(handler.config.priority, []);
      }
      priorityMap.get(handler.config.priority)!.push(handler);
    });

    const handlersByPriority = Array.from(priorityMap.entries())
      .sort(([a], [b]) => b - a) // Sort by priority (highest first)
      .map(([priority, handlers]) => ({
        priority,
        handlers: handlers.map(h => ({
          id: h.config.id,
        }))
      }));

    // Execution statistics are no longer tracked
    const executionStats = undefined;

    return {
      action,
      handlerCount: pipeline.length,
      totalHandlers: pipeline.length,
      handlersByPriority,
      executionStats,
      lastRegistered: this.lastRegisteredTimestamps.get(action),
    };
  }

  /**
   * Get statistics for all registered actions
   * 
   * @returns Array of statistics for all actions
   */
  getAllActionStats(): Array<ActionHandlerStats<T>> {
    return Array.from(this.pipelines.keys())
      .map(action => this.getActionStats(action))
      .filter((stats): stats is ActionHandlerStats<T> => stats !== null);
  }


  /**
   * Set global execution mode for all actions
   * 
   * @param mode Execution mode to set
   */
  setExecutionMode(mode: ExecutionMode): void {
    this.executionMode = mode;
    
    if (this.isDebugMode) {
      console.log(`🎯 Global execution mode set to: ${mode}`);
    }
  }

  /**
   * Set execution mode for a specific action
   * 
   * @param action Action name
   * @param mode Execution mode to set
   */
  setActionExecutionMode<K extends keyof T>(action: K, mode: ExecutionMode): void {
    this.actionExecutionModes.set(action, mode);
    
    if (this.isDebugMode) {
      console.log(`🎯 Execution mode set for action '${String(action)}': ${mode}`);
    }
  }

  /**
   * Get execution mode for a specific action
   * 
   * @param action Action name
   * @returns Execution mode for the action, or default if not set
   */
  getActionExecutionMode<K extends keyof T>(action: K): ExecutionMode {
    return this.actionExecutionModes.get(action) || this.executionMode;
  }

  /**
   * Remove execution mode override for a specific action
   * 
   * @param action Action name
   */
  removeActionExecutionMode<K extends keyof T>(action: K): void {
    this.actionExecutionModes.delete(action);
    
    if (this.isDebugMode) {
      console.log(`🎯 Execution mode reset for action '${String(action)}' to default: ${this.executionMode}`);
    }
  }


  /**
   * Get registry configuration (for debugging and inspection)
   * 
   * @returns Current registry configuration
   */
  getRegistryConfig(): ActionRegisterConfig['registry'] {
    return this.registryConfig;
  }

  /**
   * Check if registry has debug mode enabled
   * 
   * @returns Whether debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.isDebugMode;
  }

  /**
   * Creates a consistent unregister function for a handler
   * 
   * @param action - Action key
   * @param handlerId - Handler identifier
   * @param registration - Handler registration object
   * @returns Unregister function
   * @private
   */
  private createUnregisterFunction<K extends keyof T>(
    action: K,
    handlerId: string,
    registration: HandlerRegistration<any, any>
  ): UnregisterFunction {
    return () => {
      if (this.removeRegistration(action, registration)) {
        this.log(`Handler unregistered: ${String(action)}`, {
          handlerId,
          remainingHandlers: this.getHandlerCount(action),
          actionRemoved: !this.pipelines.has(action)
        });
      }
    };
  }

  /** Remove a registration and release every resource owned by it exactly once. */
  private removeRegistration<K extends keyof T>(
    action: K,
    registration: HandlerRegistration<any, any>,
    runCleanup = true
  ): boolean {
    const pipeline = this.pipelines.get(action);
    if (!pipeline) return false;

    const index = pipeline.indexOf(registration);
    if (index === -1) return false;

    pipeline.splice(index, 1);
    this.unregisterFunctions.delete(registration.id);

    if (runCleanup) {
      this.runRegistrationCleanup(action, registration);
    }

    if (pipeline.length === 0) {
      this.pipelines.delete(action);
      this.lastRegisteredTimestamps.delete(action);
    }

    return true;
  }

  private runRegistrationCleanup<K extends keyof T>(
    action: K,
    registration: HandlerRegistration<any, any>
  ): void {
    if (!registration.config.cleanup) return;

    try {
      registration.config.cleanup();
    } catch (cleanupError) {
      this.log(`Cleanup error while removing handler: ${String(action)}`, cleanupError, 'warn');
    }
  }

  /**
   * Gets the total count of registered unregister functions
   * 
   * @returns Number of unregister functions
   * @public
   */
  getUnregisterFunctionCount(): number {
    return this.unregisterFunctions.size;
  }
  
  /**
   * Checks if an unregister function exists for the given handler ID
   * 
   * @param handlerId - Handler identifier to check
   * @returns True if unregister function exists
   * @public
   */
  hasUnregisterFunction(handlerId: string): boolean {
    return this.unregisterFunctions.has(handlerId);
  }

  /** Reject queued dispatches without releasing registered handlers. */
  cancelPendingDispatches(): void {
    this.dispatchQueue?.clear({ rejectPending: true });
  }

  private beginShutdown(): Promise<void> {
    if (this.destroyAsyncPromise) return this.destroyAsyncPromise;

    if (this.lifecycleState === 'destroyed') {
      this.destroyAsyncPromise = Promise.resolve();
      return this.destroyAsyncPromise;
    }

    this.lifecycleState = 'closing';
    const shutdownError = new ActionRegisterDestroyedError(this.name, 'closing');

    // Store the stable shutdown promise before aborting signals: abort listeners
    // run synchronously and may re-enter destroyAsync().
    let resolveShutdown!: () => void;
    let rejectShutdown!: (error: unknown) => void;
    this.destroyAsyncPromise = new Promise<void>((resolve, reject) => {
      resolveShutdown = resolve;
      rejectShutdown = reject;
    });

    if (!this.lifecycleController.signal.aborted) {
      this.lifecycleController.abort(shutdownError);
    }

    // Stop guard timers immediately and reject operations that have not begun.
    // Registered handler cleanup is deferred until every started handler settles.
    this.actionGuard.destroy();
    this.dispatchQueue?.clear({ rejectPending: true, reason: shutdownError });

    const canFinalizeSynchronously = (
      this.dispatchConstructionDepth === 0 &&
      this.activeDispatches.size === 0 &&
      this.activeHandlerPromises.size === 0
    );

    if (canFinalizeSynchronously) {
      this.finalizeDestroy();
      resolveShutdown();
      return this.destroyAsyncPromise;
    }

    const drainAndFinalize = async () => {
      // Handler promises can be created by a dispatch that was already starting
      // when shutdown began, so drain until both dynamic sets stay empty.
      while (this.activeDispatches.size > 0 || this.activeHandlerPromises.size > 0) {
        await Promise.allSettled([
          ...this.activeDispatches,
          ...this.activeHandlerPromises,
        ]);
      }

      this.finalizeDestroy();
    };
    // Dispatch and queue construction call handlers synchronously before their
    // promises can be inserted into the active sets. Start draining on the next
    // microtask so handler-initiated shutdown cannot finalize through that gap.
    void Promise.resolve()
      .then(drainAndFinalize)
      .then(resolveShutdown, rejectShutdown);

    // destroy() is intentionally fire-and-forget; keep its internal promise
    // observed while destroyAsync() remains available to callers that need proof.
    void this.destroyAsyncPromise.catch(error => {
      this.log('ActionRegister async destroy failed', error, 'warn');
    });
    return this.destroyAsyncPromise;
  }

  private finalizeDestroy(): void {
    if (this.lifecycleState === 'destroyed') return;

    this.clearAll();
    this.actionExecutionModes.clear();
    this.controllerPool.length = 0;
    this.lifecycleState = 'destroyed';
    this.log('ActionRegister destroyed');
  }

  /**
   * 🆕 Destroy method for comprehensive cleanup
   *
   * Begins terminal cleanup of pipelines, guards, queues, and statistics. Cleanup
   * remains synchronous when no work has started; otherwise active handlers drain
   * in the background. Use destroyAsync() when completion must be observed.
   *
   * @public
   */
  destroy(): void {
    void this.beginShutdown();
  }

  /**
   * Begin terminal shutdown and resolve after all started handlers have settled
   * and their registered cleanup functions have run.
   *
   * Repeated calls return the same promise. New registrations and dispatches are
   * rejected as soon as shutdown begins.
   *
   * @public
   */
  destroyAsync(): Promise<void> {
    return this.beginShutdown();
  }
}
