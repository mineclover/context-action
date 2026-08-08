// biome-ignore-all lint/suspicious/noExplicitAny: heterogeneous runtime pipeline storage.

import { ActionGuard } from './action-guard.js';
import { OperationQueue } from './concurrency/OperationQueue.js';
import {
  ActionRegisterDestroyedError,
  ActionResultProcessingError,
  ActionTimeoutError,
  ActionValidationError,
} from './errors.js';
import { executeParallel, executeRace, executeSequential } from './execution-modes.js';
import {
  ActionHandler,
  ActionNames,
  ActionHandlerStats,
  ActionPayloadMap,
  ActionRegisterConfig,
  ActionRegistryInfo,
  ActionResult,
  ActionResultHandler,
  ActionResultMap,
  DispatchArgs,
  DispatchOptions,
  ExecutionMode,
  ExecutionResult,
  HandlerConfig,
  HandlerError,
  HandlerExecutionOutcome,
  HandlerRegistration,
  PipelineContext,
  PipelineController,
  PipelineControllerState,
  ProxyActionKey,
  ReservedActionKey,
  ResolvedHandlerConfig,
  UnregisterFunction,
} from './types.js';

type DispatchHandlerPromises = Set<Promise<unknown>>;

type RetryTelemetry = {
  pipelineDuration: number;
  retryDelayDuration: number;
  attempts: NonNullable<ExecutionResult<unknown>['execution']['attempts']>;
};

type TimingGuardAdmission = {
  reason?: 'Debounced execution' | 'Throttled execution';
  aborted: boolean;
};

/** Immutable handler selection and scheduling decisions for one dispatch. */
type DispatchPlan = {
  pipelineSnapshot: readonly HandlerRegistration<any, any>[];
  eligibleHandlers: readonly HandlerRegistration<any, any>[];
  debounceMs?: number;
  throttleMs?: number;
  executionMode: ExecutionMode;
};

const RESERVED_PROXY_KEYS = new Set<ReservedActionKey>([
  'then',
  'catch',
  'finally',
  'toJSON',
  'constructor',
  '__proto__',
  'prototype',
]);

function snapshotHandlerOutcome<R>(outcome: HandlerExecutionOutcome<R>): HandlerExecutionOutcome<R> {
  return {
    ...outcome,
    metadata: outcome.metadata ? { ...outcome.metadata } : undefined,
  };
}

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
  T extends ActionPayloadMap = Record<string, unknown>,
  TResultMap extends ActionResultMap<T> = {},
> {
  private pipelines = new Map<keyof T, Array<HandlerRegistration<any, any>>>();
  private readonly actionGuard: ActionGuard;
  private executionMode: ExecutionMode = 'sequential';
  private actionExecutionModes = new Map<keyof T, ExecutionMode>();
  
  // 🆕 Advanced unregister function management system
  private unregisterFunctions = new Map<keyof T, Map<string, UnregisterFunction>>();

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

  private lifecycleState: 'active' | 'closing' | 'destroyed' = 'active';
  private readonly lifecycleController = new AbortController();
  private readonly activeDispatches = new Set<Promise<unknown>>();
  private readonly activeHandlerPromises = new Set<Promise<unknown>>();
  private destroyAsyncPromise: Promise<void> | undefined;
  private dispatchConstructionDepth = 0;

  // 🔧 Performance optimization: Cached Proxy instances for actions getters
  private _actionsProxy?: {
    [K in ProxyActionKey<T>]: (...args: DispatchArgs<T[K]>) => Promise<void>
  };
  private _actionsWithResultProxy?: {
    [K in ProxyActionKey<T>]: (...args: DispatchArgs<T[K]>) => Promise<ExecutionResult<ActionResult<TResultMap, K>>>
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
    [K in ProxyActionKey<T>]: (...args: DispatchArgs<T[K]>) => Promise<void>
  } {
    // 🔧 Performance: Return cached Proxy instance
    if (!this._actionsProxy) {
      this._actionsProxy = new Proxy({} as any, {
        get: (_target, prop: string | symbol) => {
          if (typeof prop !== 'string') return undefined;
          if (RESERVED_PROXY_KEYS.has(prop as ReservedActionKey)) return undefined;
          const actionKey = prop as ProxyActionKey<T>;

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
    [K in ProxyActionKey<T>]: (...args: DispatchArgs<T[K]>) => Promise<ExecutionResult<ActionResult<TResultMap, K>>>
  } {
    // 🔧 Performance: Return cached Proxy instance
    if (!this._actionsWithResultProxy) {
      this._actionsWithResultProxy = new Proxy({} as any, {
        get: (_target, prop: string | symbol) => {
          if (typeof prop !== 'string') return undefined;
          if (RESERVED_PROXY_KEYS.has(prop as ReservedActionKey)) return undefined;
          const actionKey = prop as ProxyActionKey<T>;

          let dispatcher = this.actionResultDispatchers.get(prop);
          if (!dispatcher) {
            const dispatchAction = this.dispatchWithResult.bind(this) as (
              action: ProxyActionKey<T>,
              ...args: DispatchArgs<T[ProxyActionKey<T>]>
            ) => Promise<ExecutionResult<unknown>>;
            dispatcher = (payload?: T[typeof actionKey], options?: DispatchOptions) =>
              dispatchAction(
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
   * @param config - Optional handler configuration including priority, timing, and lifecycle options.
   * 
   * @returns Unregister function to remove this handler
   * 
   * @throws {Error} When maximum handlers limit is reached
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
   * 
   * @public
   */
  register<K extends ActionNames<T> & keyof TResultMap>(
    action: K,
    handler: ActionResultHandler<T[K], ActionResult<TResultMap, K>>,
    config?: HandlerConfig<T[K]>
  ): UnregisterFunction;
  register<K extends Exclude<ActionNames<T>, keyof TResultMap>, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config?: HandlerConfig<T[K]>
  ): UnregisterFunction;
  register<K extends ActionNames<T>, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig<T[K]> = {}
  ): UnregisterFunction {
    return this.registerWithRole(action, handler, config, 'legacy');
  }

  /**
   * Register a side-effect-only handler. This is the explicit route for
   * validation, logging, and abort guards on actions with mapped results.
   *
   * @public
   */
  registerEffect<K extends ActionNames<T>, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig<T[K]> = {}
  ): UnregisterFunction {
    return this.registerWithRole(action, handler, config, 'effect');
  }

  /**
   * Register a handler that contributes the result declared for an action.
   *
   * @public
   */
  registerResult<K extends ActionNames<T> & keyof TResultMap>(
    action: K,
    handler: ActionResultHandler<T[K], ActionResult<TResultMap, K>>,
    config?: HandlerConfig<T[K]>,
  ): UnregisterFunction {
    return this.registerWithRole(action, handler, config ?? {}, 'result');
  }

  private registerWithRole<K extends keyof T, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig<T[K]>,
    role: 'effect' | 'result' | 'legacy',
  ): UnregisterFunction {
    this.assertStringActionKey(action);
    this.assertAcceptingWork();
    const handlerId = config.id || this.generateHandlerId(action);
    return this._performRegistrationSync(action, handler, config, handlerId, role);
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

  private assertStringActionKey(action: PropertyKey): void {
    if (typeof action !== 'string') {
      throw new TypeError('Action keys must be strings.');
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
    handlerId: string,
    role: 'effect' | 'result' | 'legacy' = 'legacy',
  ): UnregisterFunction {
    // Create handler registration with defaults
    const registration: HandlerRegistration<T[K], R> = {
      handler,
      config: {
        priority: config.priority ?? 0,
        id: handlerId,
        // Keep `blocking` as a resolved compatibility view while execution
        // uses the independently configured scheduling and error policy.
        blocking: config.errorPolicy === 'fatal' || config.blocking === true,
        scheduling: config.scheduling
          ?? (config.blocking === false ? 'start-and-continue' : 'await-before-next'),
        errorPolicy: config.errorPolicy
          ?? (config.blocking === true ? 'fatal' : 'collect'),
        once: config.once ?? false,
        debounce: config.debounce ?? undefined,
        throttle: config.throttle ?? undefined,
        replaceExisting: config.replaceExisting ?? true, // 🔧 Fix: Default to true for backward compatibility
        cleanup: config.cleanup, // 🔧 Preserve cleanup function from config
        condition: config.condition, // 🔧 Fix: Preserve condition function from config
        metadata: config.metadata,
      } as ResolvedHandlerConfig<T[K]>,
      id: handlerId,
      role,
    };
    
    // Initialize pipeline if it doesn't exist
    if (!this.pipelines.has(action)) {
      this.pipelines.set(action, []);
    }

    const pipeline = this.pipelines.get(action)!;
    const actionUnregisterFunctions = this.getUnregisterFunctions(action);
    
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
      const existingUnregister = actionUnregisterFunctions.get(handlerId);
      
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
          actionUnregisterFunctions.delete(handlerId);
        }

        // Replace existing handler directly in pipeline
        pipeline[existingIndex] = registration;
        pipeline.sort((a, b) => b.config.priority - a.config.priority);
        // Cache disabled

        // 🔧 Fix: Update last registered timestamp when replacing
        this.lastRegisteredTimestamps.set(action, new Date());

        // Create new unregister function and store it
        const newUnregister = this.createUnregisterFunction(action, handlerId, registration);
        actionUnregisterFunctions.set(handlerId, newUnregister);
        
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
          actionUnregisterFunctions.set(handlerId, newUnregister);
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
    actionUnregisterFunctions.set(handlerId, unregister);

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
  dispatch<K extends ActionNames<T>>(action: K, ...args: DispatchArgs<T[K]>): Promise<void>;
  
  // Implementation (least specific)
  dispatch<K extends ActionNames<T>>(action: K, ...args: DispatchArgs<T[K]>): Promise<void> {
    this.assertStringActionKey(action);
    const [payload, options] = args as [T[K] | undefined, DispatchOptions | undefined];
    if (this.lifecycleState !== 'active') {
      return this.rejectedLifecyclePromise<void>();
    }

    const timeoutScope = this.createTimeoutScope(action, options);
    const dispatchHandlerPromises: DispatchHandlerPromises = new Set();
    const attemptState = { count: 0 };
    const plan = this.resolveDispatchPlan(action, options);
    const hasTimingGuard = plan.debounceMs !== undefined || plan.throttleMs !== undefined;
    const pipelineOperation = async () => this.executeWithRetry(async () => {
        const executedHandlers: HandlerRegistration<any, any>[] = [];
        try {
          return await this._performDispatch(
            action,
            payload,
            timeoutScope.options,
            plan,
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
    const operation = async () => {
      if (timeoutScope.options?.signal?.aborted) return;

      // Strict validation must complete before timing guards mutate admission state.
      this.validatePayload(action, payload);
      if (timeoutScope.options?.signal?.aborted) return;

      if (hasTimingGuard) {
        const admission = await this.evaluateTimingGuards(
          String(action),
          plan,
          timeoutScope.options?.signal,
        );
        if (admission.aborted || timeoutScope.options?.signal?.aborted || admission.reason) {
          return;
        }
      }

      if (timeoutScope.options?.signal?.aborted) return;

      if (timeoutScope.options?.immediate || !this.dispatchQueue) {
        return pipelineOperation();
      }

      const queued = this.dispatchQueue.enqueueWithHandle(
        pipelineOperation,
        timeoutScope.options?.queuePriority ?? 0
      );
      timeoutScope.onTimeout(error => queued.cancel(error));
      return queued.promise;
    };

    let dispatchPromise: Promise<void>;
    this.dispatchConstructionDepth += 1;
    try {
      dispatchPromise = operation();
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
    canRetry: () => boolean = () => true,
    telemetry?: RetryTelemetry,
  ): Promise<R> {
    const configuredAttempts = options?.retryOnError?.maxAttempts ?? 1;
    const maxAttempts = Number.isFinite(configuredAttempts)
      ? Math.max(1, Math.floor(configuredAttempts))
      : 1;
    const retryDelay = Math.max(0, options?.retryOnError?.delay ?? 0);

    while (attemptState.count < maxAttempts) {
      attemptState.count += 1;
      const attemptStartedAt = Date.now();

      try {
        const result = await operation();
        const shouldRetry = shouldRetryResult?.(result) ?? false;
        const canRetryAttempt = (
          shouldRetry &&
          attemptState.count < maxAttempts &&
          !options?.signal?.aborted &&
          canRetry()
        );
        const attemptEndedAt = Date.now();
        telemetry?.attempts.push({
          startTime: attemptStartedAt,
          endTime: attemptEndedAt,
          duration: attemptEndedAt - attemptStartedAt,
          outcome: canRetryAttempt ? 'retried' : 'succeeded',
        });
        if (telemetry) telemetry.pipelineDuration += attemptEndedAt - attemptStartedAt;
        if (
          !canRetryAttempt
        ) {
          return result;
        }
      } catch (error) {
        const attemptEndedAt = Date.now();
        const canRetryAttempt = !(
          error instanceof ActionValidationError ||
          attemptState.count >= maxAttempts ||
          options?.signal?.aborted ||
          !canRetry()
        );
        telemetry?.attempts.push({
          startTime: attemptStartedAt,
          endTime: attemptEndedAt,
          duration: attemptEndedAt - attemptStartedAt,
          outcome: canRetryAttempt ? 'retried' : 'failed',
        });
        if (telemetry) telemetry.pipelineDuration += attemptEndedAt - attemptStartedAt;
        if (
          !canRetryAttempt
        ) {
          throw error;
        }
      }

      const retryStartedAt = Date.now();
      await this.waitForRetry(retryDelay, options?.signal);
      if (telemetry) telemetry.retryDelayDuration += Date.now() - retryStartedAt;
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
      outcome: 'cancelled',
      validation,
      result: undefined,
      successResults: [],
      results: [],
      failedResults: [],
      execution: {
        duration: endTime - startTime,
        admissionDuration: endTime - startTime,
        queueWaitDuration: 0,
        pipelineDuration: 0,
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

  private resolveDispatchPlan<K extends keyof T>(
    action: K,
    options?: DispatchOptions,
  ): DispatchPlan {
    const pipelineSnapshot = [...(this.pipelines.get(action) ?? [])];
    const eligibleHandlers = options?.filter
      ? this.filterHandlers(pipelineSnapshot, options.filter)
      : pipelineSnapshot;
    const debounceMs = options?.debounce
      ?? eligibleHandlers.find(handler => handler.config.debounce !== undefined)?.config.debounce;
    const throttleMs = options?.throttle
      ?? eligibleHandlers.find(handler => handler.config.throttle !== undefined)?.config.throttle;

    return {
      pipelineSnapshot,
      eligibleHandlers,
      debounceMs,
      throttleMs,
      executionMode: options?.executionMode
        ?? this.actionExecutionModes.get(action)
        ?? this.executionMode,
    };
  }

  private async evaluateTimingGuards(
    actionKey: string,
    plan: DispatchPlan,
    signal?: AbortSignal,
  ): Promise<TimingGuardAdmission> {
    const { debounceMs, throttleMs } = plan;

    if (signal?.aborted) return { aborted: true };

    if (debounceMs !== undefined && !(await this.actionGuard.debounce(actionKey, debounceMs, signal))) {
      return signal?.aborted
        ? { aborted: true }
        : { aborted: false, reason: 'Debounced execution' };
    }
    if (throttleMs !== undefined && !this.actionGuard.throttle(actionKey, throttleMs, signal)) {
      return signal?.aborted
        ? { aborted: true }
        : { aborted: false, reason: 'Throttled execution' };
    }
    return { aborted: false };
  }

  /**
   * Keep the dispatch plan stable across retries while honoring handlers that
   * were consumed by the `once` lifecycle after an earlier attempt.
   */
  private getAttemptHandlers<K extends keyof T>(
    action: K,
    plan: DispatchPlan,
  ): HandlerRegistration<any, any>[] {
    const activePipeline = this.pipelines.get(action) ?? [];
    return plan.eligibleHandlers.filter(
      handler => !handler.config.once || activePipeline.includes(handler),
    );
  }

  private createTimingGuardResult<R>(
    reason: string,
    startTime: number,
    handlers: readonly HandlerRegistration<any, any>[],
    validation?: ExecutionResult<R>['validation'],
  ): ExecutionResult<R> {
    const endTime = Date.now();
    return {
      success: false,
      // A timing guard rejects admission; it does not cancel an in-flight
      // dispatch or consume a caller AbortSignal.
      aborted: false,
      abortReason: reason,
      terminated: false,
      outcome: reason === 'Debounced execution' ? 'debounced' : 'throttled',
      validation,
      result: undefined,
      successResults: [],
      results: [],
      failedResults: [],
      execution: {
        duration: endTime - startTime,
        admissionDuration: endTime - startTime,
        queueWaitDuration: 0,
        pipelineDuration: 0,
        handlersExecuted: 0,
        handlersSkipped: handlers.length,
        handlersFailed: 0,
        startTime,
        endTime,
      },
      handlers: handlers.map(handler => ({
        id: handler.id,
        status: 'skipped' as const,
        executed: false,
        duration: 0,
        result: undefined,
        error: undefined,
        metadata: handler.config.metadata ? { ...handler.config.metadata } : undefined,
      })),
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
    plan: DispatchPlan,
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
    
    const pipeline = plan.pipelineSnapshot;
    
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

    const filteredHandlers = this.getAttemptHandlers(action, plan);

    // Create pipeline execution context
    const context: PipelineContext<T[K], any> = {
      action: String(action),
      payload: payload as T[K],
      handlers: [...filteredHandlers],
      executedHandlers: [],
      handlerOutcomes: [],
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
      executionMode: plan.executionMode,
      
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
  dispatchWithResult<K extends ActionNames<T> & keyof TResultMap>(
    action: K,
    ...args: DispatchArgs<T[K]>
  ): Promise<ExecutionResult<ActionResult<TResultMap, K>>>;
  dispatchWithResult<K extends Exclude<ActionNames<T>, keyof TResultMap>, R = void>(
    action: K,
    ...args: DispatchArgs<T[K]>
  ): Promise<ExecutionResult<R>>;
  dispatchWithResult<K extends ActionNames<T>, R = ActionResult<TResultMap, K>>(
    action: K,
    ...args: DispatchArgs<T[K]>
  ): Promise<ExecutionResult<R>> {
    this.assertStringActionKey(action);
    const [payload, options] = args as [T[K] | undefined, DispatchOptions | undefined];
    if (this.lifecycleState !== 'active') {
      return this.rejectedLifecyclePromise<ExecutionResult<R>>();
    }

    const timeoutScope = this.createTimeoutScope(action, options);
    const dispatchStartTime = Date.now();
    const dispatchHandlerPromises: DispatchHandlerPromises = new Set();
    const attemptState = { count: 0 };
    let validation: ExecutionResult<R>['validation'];
    let admissionEndedAt = dispatchStartTime;
    let pipelineStartedAt: number | undefined;
    const retryTelemetry: RetryTelemetry = {
      pipelineDuration: 0,
      retryDelayDuration: 0,
      attempts: [],
    };
    const plan = this.resolveDispatchPlan(action, options);
    const hasTimingGuard = plan.debounceMs !== undefined || plan.throttleMs !== undefined;

    const pipelineOperation = async () => {
      pipelineStartedAt = Date.now();
      const rawExecution = await this.executeWithRetry(async () => {
          const executedHandlers: HandlerRegistration<any, any>[] = [];
          try {
            return await this._performDispatchWithResult<K, R>(
              action,
              payload,
              timeoutScope.options,
              validation,
              plan,
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
          result.outcome === 'failed' &&
          this.getHandlerCount(action) > 0
        ), () => this.getHandlerCount(action) > 0, retryTelemetry);

      const resultProcessingStartedAt = Date.now();
      const result = this.processResults(
        rawExecution.results,
        rawExecution.terminated,
        rawExecution.terminated ? rawExecution.result : undefined,
        options?.result,
      );
      const resultProcessingDuration = Date.now() - resultProcessingStartedAt;
      return {
        ...rawExecution,
        result,
        execution: {
          ...rawExecution.execution,
          pipelineDuration: retryTelemetry.pipelineDuration,
          retryDelayDuration: retryTelemetry.retryDelayDuration,
          resultProcessingDuration,
          attempts: retryTelemetry.attempts,
        },
      };
    };

    const operation = async () => {
      if (timeoutScope.options?.signal?.aborted) {
        admissionEndedAt = Date.now();
        return this.createAbortedExecutionResult<R>(
          dispatchStartTime,
          plan.eligibleHandlers.length,
        );
      }

      // Strict validation must complete before timing guards mutate admission state.
      validation = this.validatePayload(action, payload);
      if (timeoutScope.options?.signal?.aborted) {
        admissionEndedAt = Date.now();
        return this.createAbortedExecutionResult<R>(
          dispatchStartTime,
          plan.eligibleHandlers.length,
          validation,
        );
      }

      this.validateResultOptions(options?.result);
      if (hasTimingGuard) {
        const admission = await this.evaluateTimingGuards(
          String(action),
          plan,
          timeoutScope.options?.signal,
        );
        if (admission.aborted || timeoutScope.options?.signal?.aborted) {
          admissionEndedAt = Date.now();
          return this.createAbortedExecutionResult<R>(
            dispatchStartTime,
            plan.eligibleHandlers.length,
            validation,
          );
        }
        if (admission.reason) {
          admissionEndedAt = Date.now();
          return this.createTimingGuardResult<R>(
            admission.reason,
            dispatchStartTime,
            plan.eligibleHandlers,
            validation,
          );
        }
      }

      if (timeoutScope.options?.signal?.aborted) {
        admissionEndedAt = Date.now();
        return this.createAbortedExecutionResult<R>(
          dispatchStartTime,
          plan.eligibleHandlers.length,
          validation,
        );
      }

      admissionEndedAt = Date.now();

      if (timeoutScope.options?.immediate || !this.dispatchQueue) {
        return pipelineOperation();
      }

      const queued = this.dispatchQueue.enqueueWithHandle(
        pipelineOperation,
        timeoutScope.options?.queuePriority ?? 0
      );
      timeoutScope.onTimeout(error => queued.cancel(error));
      return queued.promise;
    };

    let dispatchPromise: Promise<ExecutionResult<R>>;
    this.dispatchConstructionDepth += 1;
    try {
      dispatchPromise = operation();
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
      const dispatchEndedAt = Date.now();
      const pipelineDuration = pipelineStartedAt === undefined
        ? 0
        : result.execution.pipelineDuration;
      const completedResult: ExecutionResult<R> = {
        ...result,
        execution: {
          ...result.execution,
          duration: dispatchEndedAt - dispatchStartTime,
          admissionDuration: Math.max(0, admissionEndedAt - dispatchStartTime),
          queueWaitDuration: pipelineStartedAt === undefined
            ? 0
            : Math.max(0, pipelineStartedAt - admissionEndedAt),
          pipelineDuration,
          startTime: dispatchStartTime,
          endTime: dispatchEndedAt,
        },
      };
      if (completedResult.outcome === 'failed') {
        const terminalError = completedResult.errors[completedResult.errors.length - 1]?.error
          ?? new Error(`Action "${String(action)}" failed`);
        this.invokeErrorHandler(
          terminalError,
          action,
          payload,
          options,
          attemptState.count
        );
      }
      return completedResult;
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
    plan: DispatchPlan,
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
    
    const pipeline = plan.pipelineSnapshot;
    
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
        outcome: 'completed',
        validation,
        result: undefined as any,
        successResults: [] as any,
        results: [],
        failedResults: [],
        execution: {
          duration: 0,
          admissionDuration: 0,
          queueWaitDuration: 0,
          pipelineDuration: 0,
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

    const filteredHandlers = this.getAttemptHandlers(action, plan);

    // Create pipeline execution context
    const context: PipelineContext<T[K], R> = {
      action: String(action),
      payload: payload as T[K],
      handlers: [...filteredHandlers],
      executedHandlers: [],
      handlerOutcomes: [],
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
      executionMode: plan.executionMode,
      
      // Result collection fields
      results: [],
      terminated: false,
      terminationResult: undefined as R | undefined,
    };

    let executionError: Error | undefined;
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
    
    const recordedOutcomes = context.handlerOutcomes ?? [];
    const outcomesById = new Map(recordedOutcomes.map(outcome => [outcome.id, outcome]));
    const handlerResults: HandlerExecutionOutcome<R>[] = filteredHandlers.map(handler => {
      const outcome = outcomesById.get(handler.id);
      return outcome
        ? snapshotHandlerOutcome(outcome)
        : {
            id: handler.id,
            status: 'skipped' as const,
            executed: false,
            duration: 0,
            result: undefined,
            error: undefined,
            metadata: handler.config.metadata ? { ...handler.config.metadata } : undefined,
          };
    });
    const handlerErrors = errors.filter(error => error.handlerId !== 'pipeline');
    const reportedErrors = executionError
      ? errors.filter(error => error.handlerId === 'pipeline')
      : errors;
    const executionHandlersCount = handlerResults.filter(handler => handler.executed).length;

    // 🔧 Type safety: Separate successful results from failed ones
    const successResults = context.results.filter((result): result is R => result !== undefined);
    const failedResults = handlerErrors.map(err => ({
      handlerId: err.handlerId,
      error: err.error,
      expectedType: 'unknown'
    }));

    // Build execution result with improved type safety
    const executionResult: ExecutionResult<R> = {
      success: !executionError && !context.aborted,
      aborted: context.aborted,
      abortReason: context.abortReason,
      terminated: context.terminated,
      outcome: context.aborted
        ? 'cancelled'
        : executionError
          ? 'failed'
          : handlerErrors.length > 0
            ? 'completed_with_errors'
            : 'completed',
      validation,
      // Result aggregation happens after the retry boundary in dispatchWithResult.
      // Preserve controller.return() here so the post-processing step can retain it.
      result: context.terminated ? context.terminationResult : undefined,
      successResults: successResults,
      results: context.results,
      failedResults,
      execution: {
        duration: endTime - _startTime,
        admissionDuration: 0,
        queueWaitDuration: 0,
        pipelineDuration: endTime - _startTime,
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

  /** Create a pipeline controller for one handler execution. */
  private createController<K extends keyof T>(
    context: PipelineContext<T[K], any>, 
    autoAbortController?: AbortController,
    autoAbortOptions?: { allowHandlerAbort?: boolean },
    isolatedState?: PipelineControllerState<T[K], any>,
    collectResults = true,
  ): PipelineController<T[K], any> {
    const controller = {} as PipelineController<T[K], any>;

    // Configure/reset the controller for current context
    (controller as { signal: AbortSignal }).signal =
      context.signal ?? this.lifecycleController.signal;

    const state = isolatedState ?? context;

    controller.abort = (reason?: string) => {
      state.aborted = true;
      state.abortReason = reason;
      const propagateAbort = !isolatedState || context.executionMode !== 'race';
      if (propagateAbort) {
        context.aborted = true;
        context.abortReason = reason;
      }
      
      // Auto-abort: Handler can trigger pipeline abort if enabled
      if (propagateAbort && autoAbortController && autoAbortOptions?.allowHandlerAbort) {
        autoAbortController.abort(reason);
      }
    };

    controller.modifyPayload = (modifier: (payload: T[K]) => T[K]) => {
      state.payload = modifier(state.payload);
    };

    controller.getPayload = () => state.payload;

    controller.jumpToPriority = (priority: number) => {
      state.jumpToPriority = priority;
    };

    controller.return = (result: any) => {
      state.terminated = true;
      state.terminationResult = collectResults ? result : undefined;
      if (!isolatedState) {
        context.terminated = true;
        context.terminationResult = collectResults ? result : undefined;
      }
      return result;
    };

    controller.setResult = (result: any) => {
      if (collectResults) state.results.push(result);
    };

    controller.getResults = () => {
      return [...state.results];
    };

    controller.mergeResult = (merger: (previousResults: any[], currentResult: any) => any) => {
      const currentResult = state.results[state.results.length - 1];
      const previousResults = state.results.slice(0, -1);
      const mergedResult = merger(previousResults, currentResult);
      state.results[state.results.length - 1] = mergedResult;
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

      // Evaluate user code against a frozen snapshot. This prevents a custom
      // filter from changing the registration that the current plan executes.
      if (filterOptions.custom) {
        const configSnapshot = Object.freeze({
          ...config,
          metadata: config.metadata
            ? Object.freeze({ ...config.metadata })
            : undefined,
        });
        if (!filterOptions.custom(configSnapshot)) {
          return false;
        }
      }

      return true;
    });

    // Cache disabled for memory stability

    return filtered;
  }

  private validateResultOptions(resultOptions?: DispatchOptions['result']): void {
    if (!resultOptions) return;

    if (resultOptions.strategy === 'custom' && typeof resultOptions.merger !== 'function') {
      throw new ActionResultProcessingError(
        'Custom result strategy requires a merger function',
      );
    }

    if (
      resultOptions.maxResults !== undefined &&
      (!Number.isSafeInteger(resultOptions.maxResults) || resultOptions.maxResults < 0)
    ) {
      throw new RangeError('maxResults must be a non-negative safe integer.');
    }
  }

  private processResults<R>(
    results: Array<R | undefined>,
    terminated: boolean,
    terminationResult: R | R[] | undefined,
    resultOptions?: DispatchOptions['result']
  ): R | R[] | undefined {
    // 🔧 Fix: Always handle termination result regardless of collect option
    if (terminated && terminationResult !== undefined) {
      return terminationResult;
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
    const collectedResults = results.filter((result): result is R => result !== undefined);
    const limitedResults = resultOptions.maxResults !== undefined
      ? collectedResults.slice(0, resultOptions.maxResults)
      : collectedResults;

    if (limitedResults.length === 0) {
      if (resultOptions.strategy === 'all' || (resultOptions.collect && !resultOptions.strategy)) {
        return [];
      }
      if (resultOptions.strategy === 'custom' || (resultOptions.strategy === 'merge' && resultOptions.merger)) {
        return resultOptions.merger!(limitedResults);
      }
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
    const createController = (
      registration: HandlerRegistration<T[K], any>,
      _index: number,
      state?: PipelineControllerState<T[K], any>,
    ): PipelineController<T[K], any> => {
      return this.createController(
        context,
        autoAbortController,
        autoAbortOptions,
        state,
        registration.role !== 'effect',
      );
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
          remainingHandlers: this.pipelines.get(action)?.length ?? 0
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
  getHandlerCount<K extends ActionNames<T>>(action: K): number {
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
  hasHandlers<K extends ActionNames<T>>(action: K): boolean {
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
  clearAction<K extends ActionNames<T>>(action: K): void {
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
      this.clearAction(action as ActionNames<T>);
    });

    this.pipelines.clear();
    this.lastRegisteredTimestamps.clear();
    this.unregisterFunctions.forEach(unregisters => unregisters.clear());
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
  getActionStats<K extends ActionNames<T>>(action: K): ActionHandlerStats<T> | null {
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
      .map(action => this.getActionStats(action as ActionNames<T>))
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
  setActionExecutionMode<K extends ActionNames<T>>(action: K, mode: ExecutionMode): void {
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
  getActionExecutionMode<K extends ActionNames<T>>(action: K): ExecutionMode {
    return this.actionExecutionModes.get(action) || this.executionMode;
  }

  /**
   * Remove execution mode override for a specific action
   * 
   * @param action Action name
   */
  removeActionExecutionMode<K extends ActionNames<T>>(action: K): void {
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
          remainingHandlers: this.pipelines.get(action)?.length ?? 0,
          actionRemoved: !this.pipelines.has(action)
        });
      }
    };
  }

  private getUnregisterFunctions<K extends keyof T>(action: K): Map<string, UnregisterFunction> {
    let unregisters = this.unregisterFunctions.get(action);
    if (!unregisters) {
      unregisters = new Map();
      this.unregisterFunctions.set(action, unregisters);
    }
    return unregisters;
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
    const actionUnregisterFunctions = this.unregisterFunctions.get(action);
    actionUnregisterFunctions?.delete(registration.id);

    if (runCleanup) {
      this.runRegistrationCleanup(action, registration);
    }

    if (pipeline.length === 0) {
      this.pipelines.delete(action);
      this.lastRegisteredTimestamps.delete(action);
      this.unregisterFunctions.delete(action);
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
    let count = 0;
    this.unregisterFunctions.forEach(unregisters => {
      count += unregisters.size;
    });
    return count;
  }
  
  /**
   * Checks if an unregister function exists for the given handler ID
   * 
   * @param handlerId - Handler identifier to check
   * @returns True if unregister function exists
   * @public
   */
  hasUnregisterFunction(handlerId: string): boolean {
    for (const unregisters of this.unregisterFunctions.values()) {
      if (unregisters.has(handlerId)) return true;
    }
    return false;
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
