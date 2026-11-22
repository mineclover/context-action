// biome-ignore-all lint/suspicious/noExplicitAny: heterogeneous runtime pipeline storage.

import { ActionGuard } from './action-guard.js';
import { OperationQueue } from './concurrency/OperationQueue.js';
import {
  ActionAttemptSupersededError,
  ActionRegisterDestroyedError,
  ActionResultProcessingError,
  ActionTimeoutError,
  ActionValidationError,
} from './errors.js';
import { executeParallel, executeRace, executeSequential } from './execution-modes.js';
import {
  ActionCommandController,
  ActionCommandHandler,
  ActionDispatchTrace,
  ActionDispatchTraceListener,
  ActionEffectHandler,
  ActionGuardHandler,
  ActionHandler,
  ActionHandlerStats,
  ActionNames,
  ActionObserverEvent,
  ActionObserverHandler,
  ActionPayloadMap,
  ActionPolicyConfig,
  ActionRegisterConfig,
  ActionRegistryInfo,
  ActionResult,
  ActionResultHandler,
  ActionResultMap,
  CommandConfig,
  DispatchArgs,
  DispatchOptions,
  EffectConfig,
  ExecutionMode,
  ExecutionResult,
  GuardConfig,
  HandlerConfig,
  HandlerError,
  HandlerExecutionOutcome,
  HandlerRegistration,
  HandlerRole,
  ObserverConfig,
  PipelineContext,
  PipelineController,
  PipelineControllerState,
  ProxyActionKey,
  ReservedActionKey,
  resolveHandlerConfig,
  UnregisterFunction,
} from './types.js';

type DispatchHandlerPromises = Set<Promise<unknown>>;

type CompiledActionPipeline = {
  readonly snapshot: readonly HandlerRegistration<any, any>[];
  readonly guards: readonly HandlerRegistration<any, any>[];
  readonly nonGuards: readonly HandlerRegistration<any, any>[];
  readonly results: readonly HandlerRegistration<any, any>[];
  readonly observers: readonly HandlerRegistration<any, any>[];
  readonly hasOnce: boolean;
  readonly debounceMs?: number;
  readonly throttleMs?: number;
  readonly hasTimingGuard: boolean;
};

type DispatchTraceScope = {
  dispatchId: string;
  startedAt: number;
  settle: (status: ActionDispatchTrace['status']) => void;
};

type RetryTelemetry = {
  pipelineDuration: number;
  retryDelayDuration: number;
  attempts: NonNullable<ExecutionResult<unknown>['execution']['attempts']>;
};

type TimingGuardAdmission = {
  reason?: 'Debounced execution' | 'Throttled execution';
  aborted: boolean;
};

type GuardPhaseResult<T> = {
  allowed: boolean;
  payload: T;
  aborted: boolean;
  abortReason: string | undefined;
  error: Error | undefined;
  errors: HandlerError[];
  outcomes: HandlerExecutionOutcome<unknown>[];
  executedHandlers: HandlerRegistration<any, any>[];
  duration: number;
};

/** Immutable handler selection and scheduling decisions for one dispatch. */
type DispatchPlan = {
  pipelineSnapshot: readonly HandlerRegistration<any, any>[];
  guards: readonly HandlerRegistration<any, any>[];
  results: readonly HandlerRegistration<any, any>[];
  observers: readonly HandlerRegistration<any, any>[];
  hasOnce: boolean;
  debounceMs?: number;
  throttleMs?: number;
  executionMode: ExecutionMode;
};

type FastSequentialState<TPayload> = {
  payload: TPayload;
  aborted: boolean;
  terminated: boolean;
  jumpToPriority: number | undefined;
  jumpCount: number;
  results: unknown[] | undefined;
  abortReason?: string | undefined;
  terminationResult?: any;
};

type MutableControllerState<TPayload> = {
  payload: TPayload;
  aborted: boolean;
  terminated: boolean;
  jumpToPriority: number | undefined;
  results?: unknown[] | undefined;
  abortReason?: string | undefined;
  terminationResult?: any;
};

const NOOP = () => {};
const RESOLVED_VOID_PROMISE: Promise<void> = Promise.resolve();
const FAST_STEP_OK = Object.freeze({});
const FAST_STEP_SKIPPED = Object.freeze({ skipped: true as const });
const FAST_STEP_ABORTED = Object.freeze({ aborted: true as const });
const IMMEDIATE_ONLY_OPTIONS: Readonly<DispatchOptions> = Object.freeze({ immediate: true });

function isFastPathOptions(options: DispatchOptions | undefined): boolean {
  if (options === undefined || options === IMMEDIATE_ONLY_OPTIONS) return true;
  return (
    options.immediate === true
    && options.debounce === undefined
    && options.throttle === undefined
    && options.executionMode === undefined
    && options.signal === undefined
    && options.queuePriority === undefined
    && options.timeout === undefined
    && options.retryOnError === undefined
    && options.autoAbort === undefined
    && options.filter === undefined
    && options.result === undefined
    && options.trace === undefined
  );
}
const EMPTY_COMPILED_PIPELINE: CompiledActionPipeline = Object.freeze({
  snapshot: Object.freeze([]),
  guards: Object.freeze([]),
  nonGuards: Object.freeze([]),
  results: Object.freeze([]),
  observers: Object.freeze([]),
  hasOnce: false,
  debounceMs: undefined,
  throttleMs: undefined,
  hasTimingGuard: false,
});

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function')
    && value !== null
    && typeof (value as { then?: unknown }).then === 'function'
  );
}

function publishesRoleResults(role?: HandlerRole): boolean {
  return role !== 'guard' && role !== 'command';
}

function createDispatchFailureEvent<TPayload, R>(
  action: string,
  payload: TPayload,
  error: unknown,
  signal: AbortSignal | undefined,
): ActionObserverEvent<TPayload, R> {
  return {
    action,
    payload,
    outcome: 'failed',
    result: undefined,
    errors: [{
      handlerId: 'dispatch',
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: Date.now(),
      severity: 'blocking',
    }],
    signal,
  };
}

function findTimingLimits(
  guards: readonly HandlerRegistration<any, any>[],
  results: readonly HandlerRegistration<any, any>[],
  initialDebounce?: number,
  initialThrottle?: number,
): { debounceMs: number | undefined; throttleMs: number | undefined } {
  let debounceMs = initialDebounce;
  let throttleMs = initialThrottle;
  const scan = (list: readonly HandlerRegistration<any, any>[]) => {
    for (let i = 0; i < list.length; i++) {
      const cfg = list[i]!.config;
      if (debounceMs === undefined && cfg.debounce !== undefined) debounceMs = cfg.debounce;
      if (throttleMs === undefined && cfg.throttle !== undefined) throttleMs = cfg.throttle;
      if (debounceMs !== undefined && throttleMs !== undefined) return true;
    }
    return false;
  };
  if ((debounceMs === undefined || throttleMs === undefined) && !scan(guards)) {
    scan(results);
  }
  return { debounceMs, throttleMs };
}

function createSkippedHandlerOutcome<R>(
  registration: HandlerRegistration<any, any>,
): HandlerExecutionOutcome<R> {
  return {
    id: registration.id,
    status: 'skipped',
    executed: false,
    duration: 0,
    result: undefined,
    error: undefined,
    metadata: registration.config.metadata ? { ...registration.config.metadata } : undefined,
  };
}

function createTerminalExecutionResult<R>(opts: {
  success: boolean;
  aborted: boolean;
  abortReason: string | undefined;
  outcome: ExecutionResult<R>['outcome'];
  startTime: number;
  endTime: number;
  admissionDuration?: number;
  pipelineDuration?: number;
  handlersExecuted?: number;
  handlersSkipped?: number;
  handlersFailed?: number;
  validation?: ExecutionResult<R>['validation'];
  handlers?: HandlerExecutionOutcome<R>[];
  errors?: HandlerError[];
  failedResults?: ExecutionResult<R>['failedResults'];
}): ExecutionResult<R> {
  const handlers = opts.handlers ?? [];
  return {
    success: opts.success,
    aborted: opts.aborted,
    abortReason: opts.abortReason,
    terminated: false,
    outcome: opts.outcome,
    validation: opts.validation,
    result: undefined,
    successResults: [],
    results: [],
    failedResults: opts.failedResults ?? [],
    execution: {
      duration: opts.endTime - opts.startTime,
      admissionDuration: opts.admissionDuration ?? 0,
      queueWaitDuration: 0,
      pipelineDuration: opts.pipelineDuration ?? 0,
      handlersExecuted: opts.handlersExecuted ?? 0,
      handlersSkipped: opts.handlersSkipped ?? handlers.length,
      handlersFailed: opts.handlersFailed ?? 0,
      startTime: opts.startTime,
      endTime: opts.endTime,
    },
    handlers,
    errors: opts.errors ?? [],
  };
}

const RESERVED_PROXY_KEYS = new Set<ReservedActionKey>([
  'then',
  'catch',
  'finally',
  'toJSON',
  'constructor',
  '__proto__',
  'prototype',
]);
const ATTEMPT_SIGNAL_CLEANUP = Symbol('attemptSignalCleanup');
type AttemptDispatchOptions = DispatchOptions & {
  [ATTEMPT_SIGNAL_CLEANUP]?: () => void;
};

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

function validateNonNegativeFiniteNumber(
  value: unknown,
  label: string,
): void {
  if (value === undefined) return;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative finite number.`);
  }
}

function validateTimingConfig(config: HandlerConfig<unknown> | undefined): void {
  validateNonNegativeFiniteNumber(config?.debounce, 'debounce');
  validateNonNegativeFiniteNumber(config?.throttle, 'throttle');
}

function validateRetryOptions(options?: DispatchOptions): void {
  const retry = options?.retryOnError;
  if (!retry) return;

  if (
    retry.maxAttempts !== undefined
    && (!Number.isSafeInteger(retry.maxAttempts) || retry.maxAttempts < 1)
  ) {
    throw new RangeError('retryOnError.maxAttempts must be a positive safe integer.');
  }
  validateNonNegativeFiniteNumber(retry.delay, 'retryOnError.delay');
  if (
    retry.attemptBarrier !== undefined
    && retry.attemptBarrier !== 'abort-and-drain'
    && retry.attemptBarrier !== 'abort-and-overlap'
  ) {
    throw new TypeError(
      'retryOnError.attemptBarrier must be "abort-and-drain" or "abort-and-overlap".',
    );
  }
}

function validateDispatchTimingOptions(options?: DispatchOptions): void {
  validateNonNegativeFiniteNumber(options?.debounce, 'debounce');
  validateNonNegativeFiniteNumber(options?.throttle, 'throttle');
  validateNonNegativeFiniteNumber(options?.timeout, 'timeout');
  validateRetryOptions(options);
}

function mergeAbortSignals(signals: AbortSignal[]): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  if (signals.length === 1) {
    return { signal: signals[0]!, cleanup: () => {} };
  }

  const abortSignalAny = (
    AbortSignal as typeof AbortSignal & {
      any?: (signals: AbortSignal[]) => AbortSignal;
    }
  ).any;

  if (typeof abortSignalAny === 'function') {
    return { signal: abortSignalAny(signals), cleanup: () => {} };
  }

  const mergedController = new AbortController();
  const cleanups: Array<() => void> = [];
  const forwardAbort = (source: AbortSignal) => {
    if (!mergedController.signal.aborted) {
      mergedController.abort(source.reason);
    }
  };

  for (const source of signals) {
    if (source.aborted) {
      forwardAbort(source);
      break;
    }
    const listener = () => forwardAbort(source);
    source.addEventListener('abort', listener, { once: true });
    cleanups.push(() => source.removeEventListener('abort', listener));
  }

  const cleanup = () => {
    for (const remove of cleanups) {
      remove();
    }
    cleanups.length = 0;
  };
  mergedController.signal.addEventListener('abort', cleanup, { once: true });

  return { signal: mergedController.signal, cleanup };
}

function getAbortReason(signal?: AbortSignal): string {
  return typeof signal?.reason === 'string'
    ? signal.reason
    : 'Action dispatch aborted by signal';
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
  private compiledPipelines = new Map<keyof T, CompiledActionPipeline>();
  /** Observer callbacks are intentionally stored outside the executable
   * pipeline so they cannot participate in result arbitration. */
  private readonly observerHandlers = new Map<
    HandlerRegistration<any, any>,
    { handler: ActionObserverHandler<any, any>; when: 'success' | 'failure' | 'always' }
  >();
  /** A once handler is removed from the registry before its callback starts.
   * Keep its claim separately so resource cleanup can still run on settlement. */
  private readonly claimedOnceHandlers = new WeakSet<HandlerRegistration<any, any>>();
  private readonly actionGuard: ActionGuard;
  private executionMode: ExecutionMode = 'sequential';
  private actionExecutionModes = new Map<keyof T, ExecutionMode>();
  
  // 🆕 Advanced unregister function management system
  private unregisterFunctions = new Map<keyof T, Map<string, UnregisterFunction>>();

  // 🔧 Fix: Track last registration timestamps for getActionStats
  private lastRegisteredTimestamps = new Map<keyof T, Date>();
  
  public readonly name: string;
  private readonly registryConfig: ActionRegisterConfig<T>['registry'];
  private readonly actionPolicies?: Partial<Record<ActionNames<T>, ActionPolicyConfig>>;
  private readonly actionDefaultDispatchOptions?: Partial<
    Record<ActionNames<T>, Readonly<DispatchOptions>>
  >;
  private readonly useGlobalConcurrencyQueue: boolean;

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
  private readonly defaultLifecycleOptions: DispatchOptions = Object.freeze({
    signal: this.lifecycleController.signal,
  });
  private readonly activeDispatches = new Set<Promise<unknown>>();
  private readonly activeHandlerPromises = new Set<Promise<unknown>>();
  private destroyAsyncPromise: Promise<void> | undefined;
  private dispatchConstructionDepth = 0;
  private dispatchTraceSequence = 0;
  private readonly dispatchTraceListeners = new Set<ActionDispatchTraceListener>();

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

  constructor(config: ActionRegisterConfig<T> = {}) {
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

    if (config.actions) {
      const validated: Partial<Record<ActionNames<T>, ActionPolicyConfig>> = {};
      const defaultDispatchOptions: Partial<
        Record<ActionNames<T>, Readonly<DispatchOptions>>
      > = {};
      for (const [actionName, policy] of Object.entries(config.actions) as Array<
        [string, ActionPolicyConfig | undefined]
      >) {
        if (!policy) continue;
        if (
          policy.queue !== undefined
          && policy.queue !== 'serial'
          && policy.queue !== 'immediate'
        ) {
          throw new TypeError(
            `Action "${actionName}" queue policy must be "serial" or "immediate".`
          );
        }
        validateNonNegativeFiniteNumber(policy.timeout, `actions.${actionName}.timeout`);
        validated[actionName as ActionNames<T>] = {
          ...(policy.queue !== undefined && { queue: policy.queue }),
          ...(policy.timeout !== undefined && { timeout: policy.timeout }),
        };
        if (policy.queue === 'immediate' && policy.timeout === undefined) {
          defaultDispatchOptions[actionName as ActionNames<T>] = IMMEDIATE_ONLY_OPTIONS;
        } else if (policy.queue !== undefined || policy.timeout !== undefined) {
          // Pre-freeze default dispatch options so default dispatches allocate nothing per call.
          defaultDispatchOptions[actionName as ActionNames<T>] = Object.freeze({
            ...(policy.queue === 'immediate'
              ? { immediate: true }
              : policy.queue === 'serial'
                ? { immediate: false }
                : {}),
            ...(policy.timeout !== undefined && { timeout: policy.timeout }),
          });
        }
      }
      this.actionPolicies = validated;
      this.actionDefaultDispatchOptions = defaultDispatchOptions;
    }

    // Guard creation with improved cleanup handling
    this.actionGuard = new ActionGuard(this.registryConfig?.autoCleanup !== false);
    
    // 🆕 Conditional queue system initialization
    this.useGlobalConcurrencyQueue = config.registry?.useConcurrencyQueue === true;
    const hasSerialActionPolicy = this.actionPolicies
      ? (Object.values(this.actionPolicies) as Array<ActionPolicyConfig | undefined>).some(
          policy => policy?.queue === 'serial'
        )
      : false;
    if (this.useGlobalConcurrencyQueue || hasSerialActionPolicy) {
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
  private createActionProxy<TProxy extends Record<string, (...args: any[]) => Promise<any>>>(
    cache: Map<PropertyKey, (...args: any[]) => Promise<unknown>>,
    dispatchFn: (action: ProxyActionKey<T>, ...args: any[]) => Promise<unknown>,
  ): TProxy {
    return new Proxy({} as any, {
      get: (_target, prop: string | symbol) => {
        if (typeof prop !== 'string' || RESERVED_PROXY_KEYS.has(prop as ReservedActionKey)) {
          return undefined;
        }
        let dispatcher = cache.get(prop);
        if (!dispatcher) {
          const actionKey = prop as ProxyActionKey<T>;
          dispatcher = (...args: unknown[]) => dispatchFn(actionKey, ...args);
          cache.set(prop, dispatcher);
        }
        return dispatcher;
      },
    });
  }

  get actions(): {
    [K in ProxyActionKey<T>]: (...args: DispatchArgs<T[K]>) => Promise<void>
  } {
    return (this._actionsProxy ??= this.createActionProxy(
      this.actionDispatchers,
      (actionKey, ...args) => this.dispatch(actionKey, ...(args as DispatchArgs<T[typeof actionKey]>)),
    ));
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
    return (this._actionsWithResultProxy ??= this.createActionProxy(
      this.actionResultDispatchers,
      (actionKey, ...args) => this.dispatchWithResult(actionKey, ...(args as DispatchArgs<T[typeof actionKey]>)),
    ));
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
   * Register a side-effect-only handler in an explicit guard or observer
   * phase. This is a supported 1.x compatibility convenience for callers
   * that configure the phase dynamically.
   *
   * Prefer `registerGuard()` for admission and `registerObserver()` for a
   * statically known post-result effect. `effectKind` remains required so this
   * API cannot participate in result arbitration implicitly.
   * @public
   */
  registerEffect<K extends ActionNames<T>>(
    action: K,
    handler: ActionGuardHandler<T[K]>,
    config: EffectConfig<T[K]> & { effectKind: 'guard' },
  ): UnregisterFunction;
  registerEffect<K extends ActionNames<T>>(
    action: K,
    handler: ActionEffectHandler<T[K]>,
    config: EffectConfig<T[K]> & { effectKind: 'observer' },
  ): UnregisterFunction;
  registerEffect<K extends ActionNames<T>>(
    action: K,
    handler: ActionEffectHandler<T[K]> | ActionGuardHandler<T[K]>,
    config: EffectConfig<T[K]>,
  ): UnregisterFunction {
    if (config.effectKind === 'guard') {
      return this.registerGuard(action, handler as ActionGuardHandler<T[K]>, config);
    }
    return this.registerObserver(action, event => (handler as ActionEffectHandler<T[K]>)(event.payload as T[K], {
      signal: event.signal,
      getPayload: () => event.payload as T[K],
    }), config);
  }

  /** Register an authorization or validation guard that always runs before
   * concurrent result arbitration. */
  registerGuard<K extends ActionNames<T>>(
    action: K,
    handler: ActionGuardHandler<T[K]>,
    config: GuardConfig<T[K]> = {},
  ): UnregisterFunction {
    // Runtime callers can still pass an unsafe cast or plain JavaScript
    // configuration. Admission must never become fail-open as a result.
    return this.registerWithRole(action, handler as ActionHandler<T[K], void>, {
      ...config,
      scheduling: 'await-before-next',
      errorPolicy: 'fatal',
    }, 'guard');
  }

  /**
   * Register a Phase 2 void command handler that mutates stores or performs
   * side effects after guards pass and before terminal observers run.
   * Command handlers cannot publish or arbitrate results.
   *
   * @public
   */
  registerCommand<
    K extends ActionNames<T>,
    H extends (
      payload: T[K],
      controller: ActionCommandController<T[K]>,
    ) => unknown = ActionCommandHandler<T[K]>,
  >(
    action: K,
    handler: H & (ReturnType<H> extends void | Promise<void> ? unknown : never),
    config?: CommandConfig<T[K]>,
  ): UnregisterFunction {
    return this.registerWithRole(
      action,
      handler as ActionHandler<T[K], void>,
      config ?? {},
      'command',
    );
  }

  /** Register a terminal observer. It runs after result aggregation and has
   * no controller, result, payload, or winner-selection capabilities. */
  registerObserver<
    K extends ActionNames<T>,
    R = ActionResult<TResultMap, K>,
    H extends (event: ActionObserverEvent<T[K], R>) => unknown = ActionObserverHandler<T[K], R>,
  >(
    action: K,
    handler: H & (ReturnType<H> extends void | Promise<void> ? unknown : never),
    config: ObserverConfig<T[K]> = {},
  ): UnregisterFunction {
    this.assertStringActionKey(action);
    this.assertAcceptingWork();
    const handlerId = config.id || this.generateHandlerId(action);
    const existing = this.pipelines.get(action)?.find(item => item.id === handlerId);
    if (existing && (existing.role ?? 'legacy') !== 'observer') {
      throw new Error(
        `Action handler role conflict for "${String(action)}" and id "${handlerId}": `
        + `cannot replace ${(existing.role ?? 'legacy')} with observer.`,
      );
    }
    // A duplicate observer must not acquire ownership of another registration
    // (or overwrite its callback) when replacement was explicitly disabled.
    if (existing && config.replaceExisting === false) return () => {};
    const unregister = this.registerWithRole(
      action,
      (() => undefined) as ActionHandler<T[K], void>,
      { ...config, id: handlerId },
      'observer',
    );
    const registration = this.pipelines.get(action)?.find(item => item.id === handlerId);
    if (!registration) {
      unregister();
      throw new Error(`Observer registration "${handlerId}" was not retained.`);
    }
    this.observerHandlers.set(registration, {
      handler: handler as ActionObserverHandler<any, any>,
      when: config.when ?? 'always',
    });
    return () => {
      this.observerHandlers.delete(registration);
      unregister();
    };
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
    return this.registerWithRole(
      action,
      handler as ActionHandler<T[K], ActionResult<TResultMap, K>>,
      config ?? {},
      'result',
    );
  }

  private registerWithRole<K extends keyof T, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig<T[K]>,
    role: HandlerRole,
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

  private beginDispatchTrace(action: string, options?: DispatchOptions): DispatchTraceScope | undefined {
    if (this.dispatchTraceListeners.size === 0) return undefined;
    const dispatchId = `${this.name}:${++this.dispatchTraceSequence}`;
    const startedAt = Date.now();
    const metadata = options?.trace;
    let settled = false;
    const emit = (event: ActionDispatchTrace) => {
      for (const listener of this.dispatchTraceListeners) {
        try { listener(event); } catch (error) {
          this.log('Dispatch trace listener failed', error, 'warn');
        }
      }
    };
    emit({
      dispatchId,
      action,
      phase: 'started',
      transactionId: metadata?.transactionId,
      origin: metadata?.origin,
      label: metadata?.label,
      startedAt,
    });
    return {
      dispatchId,
      startedAt,
      settle: (status) => {
        if (settled) return;
        settled = true;
        emit({
          dispatchId,
          action,
          phase: 'settled',
          status,
          transactionId: metadata?.transactionId,
          origin: metadata?.origin,
          label: metadata?.label,
          startedAt,
          endedAt: Date.now(),
        });
      },
    };
  }

  private withDispatchTrace<R>(
    promise: Promise<R>,
    trace: DispatchTraceScope | undefined,
    status: (result: R) => ActionDispatchTrace['status'],
  ): Promise<R> {
    if (!trace) return promise;
    return promise.then(
      result => { trace.settle(status(result)); return result; },
      error => { trace.settle('failed'); throw error; },
    );
  }

  /** Subscribe to start/settled dispatch lifecycle events. */
  subscribeDispatchTrace(listener: ActionDispatchTraceListener): UnregisterFunction {
    if (typeof listener !== 'function') {
      throw new TypeError('Dispatch trace listener must be a function.');
    }
    // Trace subscriptions are part of the register lifecycle.  Rejecting a
    // late subscription keeps callers from accidentally retaining a listener
    // that can never observe work and matches handler registration semantics.
    this.assertAcceptingWork();
    this.dispatchTraceListeners.add(listener);
    return () => this.dispatchTraceListeners.delete(listener);
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
    return this.createObservedRejection<R>(error);
  }

  private createObservedRejection<R = void>(error: unknown): Promise<R> {
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
    let autoAbortController: AbortController | undefined;

    if (options?.signal) {
      signals.push(options.signal);
    }

    if (options?.autoAbort?.enabled) {
      autoAbortController = new AbortController();
      signals.push(autoAbortController.signal);
    }

    if (signals.length === 0) {
      return [undefined, autoAbortController, () => {}];
    }

    const { signal, cleanup } = mergeAbortSignals(signals);
    return [signal, autoAbortController, cleanup];
  }

  /**
   * 🆕 Perform synchronous handler registration
   */
  private _performRegistrationSync<K extends keyof T, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig<T[K]>,
    handlerId: string,
    role: HandlerRole = 'legacy',
  ): UnregisterFunction {
    validateTimingConfig(config as HandlerConfig<unknown>);

    // Create handler registration with defaults
    const registration: HandlerRegistration<T[K], R> = {
      handler,
      config: resolveHandlerConfig(config, handlerId),
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

      if (!existing) {
        throw new Error('Internal error: existing handler should be defined in duplicate handler block');
      }

      if ((existing.role ?? 'legacy') !== role) {
        throw new Error(
          `Action handler role conflict for "${String(action)}" and id "${handlerId}": `
          + `cannot replace ${(existing.role ?? 'legacy')} with ${role}.`,
        );
      }
      
      if (registration.config.replaceExisting) {
        // Remove the old registration before running user cleanup. Cleanup is
        // re-entrant and may register/sort handlers, so retaining the old
        // array index until after cleanup can overwrite a newly registered
        // handler and leave its unregister lease orphaned.
        this.removeRegistration(action, existing, false);

        let currentPipeline = this.pipelines.get(action);
        if (!currentPipeline) {
          currentPipeline = [];
          this.pipelines.set(action, currentPipeline);
        }
        currentPipeline.push(registration);
        currentPipeline.sort((a, b) => b.config.priority - a.config.priority);
        this.compiledPipelines.delete(action);

        this.lastRegisteredTimestamps.set(action, new Date());

        // Create and publish the replacement lease before invoking cleanup so
        // re-entrant registrations observe a coherent current registry.
        const newUnregister = this.createUnregisterFunction(action, handlerId, registration);
        this.getUnregisterFunctions(action).set(handlerId, newUnregister);

        if (existing?.config.cleanup && typeof existing.config.cleanup === 'function') {
          try {
            existing.config.cleanup();
          } catch (cleanupError) {
            this.log(`Cleanup error for replaced handler: ${String(action)}`, cleanupError, 'warn');
          }
        }
        
        this.log(`Handler replaced: ${String(action)}`, {
          handlerId,
          priority: config.priority,
          totalHandlers: this.pipelines.get(action)?.length ?? 0,
          hadExistingUnregister: Boolean(existingUnregister)
        });
        
        return newUnregister;
      } else {
        // The rejected registration does not own the existing handler. Returning
        // its unregister function would let the rejected caller tear down a
        // registration created by somebody else.
        if (!existing) {
          throw new Error('Internal error: existing handler should be defined in duplicate handler block');
        }
        
        this.log(`Handler duplicate ignored, returning no-op unregister: ${String(action)}`, {
          handlerId,
          existingPriority: existing.config.priority,
          newPriority: config.priority,
          existingBlocking: existing.config.blocking,
          newBlocking: config.blocking,
          note: 'Use replaceExisting:true to replace'
        }, 'warn');
        
        return () => {};
      }
    }
    
    // Add handler to pipeline
    pipeline.push(registration);
    pipeline.sort((a, b) => b.config.priority - a.config.priority);
    this.compiledPipelines.delete(action);

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
   * @param args - The payload/options tuple for the selected action: payload-bearing actions require a payload, while void actions may omit it; dispatch options are optional.
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
    const [payload, rawOptions] = args as [T[K] | undefined, DispatchOptions | undefined];
    const options = this.resolveActionDispatchOptions(action, rawOptions);
    validateDispatchTimingOptions(options);
    if (this.lifecycleState !== 'active') {
      const trace = this.beginDispatchTrace(String(action), options);
      return this.withDispatchTrace(this.rejectedLifecyclePromise<void>(), trace, () => 'failed');
    }

    if (
      this.dispatchTraceListeners.size === 0
      && isFastPathOptions(options)
      && !this.shouldQueueDispatch(action, options)
      && (
        !this.registryConfig?.schema
        || this.registryConfig.validateOnDispatch === false
        || !this.registryConfig.schema[String(action)]
      )
    ) {
      const compiled = this.getCompiledPipeline(action);
      if (
        compiled.guards.length === 0
        && compiled.observers.length === 0
        && !compiled.hasTimingGuard
        && !compiled.hasOnce
        && (this.actionExecutionModes.get(action) ?? this.executionMode) === 'sequential'
      ) {
        if (compiled.results.length === 0) {
          if (!this.isDebugMode) {
            return RESOLVED_VOID_PROMISE;
          }
        } else {
          return this.dispatchFastSequential(action, payload as T[K], compiled.results, options);
        }
      }
    }

    const delegated = this._dispatchWithResult<K, void>(action, payload, options).then(result => {
      if (result.outcome === 'failed') {
        throw result.errors[result.errors.length - 1]?.error
          ?? new Error(`Action "${String(action)}" failed`);
      }
    });
    void delegated.catch(NOOP);
    return delegated;
  }

  private invokeFastSyncStep<K extends keyof T>(
    action: K,
    originalPayload: T[K],
    options: DispatchOptions | undefined,
    registration: HandlerRegistration<any, any>,
    state: FastSequentialState<T[K]>,
    lifecycleSignal: AbortSignal,
  ): {
    readonly aborted?: true;
    readonly skipped?: true;
    readonly failed?: Error;
    readonly pending?: Promise<unknown>;
  } {
    if (registration.config.condition) {
      try {
        if (!registration.config.condition(state.payload)) {
          return FAST_STEP_SKIPPED;
        }
      } catch (conditionError) {
        if (state.aborted || lifecycleSignal.aborted) {
          return FAST_STEP_ABORTED;
        }
        const normalized = conditionError instanceof Error
          ? conditionError
          : new Error(String(conditionError));
        this.invokeErrorHandler(normalized, action, originalPayload, options, 1);
        return { failed: normalized };
      }
    }
    const controller = this.createRoleController(registration.role, state, lifecycleSignal);
    try {
      const rawResult = registration.handler(state.payload, controller);
      if (isPromiseLike(rawResult)) {
        return { pending: Promise.resolve(rawResult) };
      }
      if (publishesRoleResults(registration.role) && rawResult !== undefined && !state.terminated) {
        (state.results ??= []).push(rawResult);
      }
      return FAST_STEP_OK;
    } catch (thrown) {
      if (state.aborted || lifecycleSignal.aborted) {
        return FAST_STEP_ABORTED;
      }
      const normalized = thrown instanceof Error ? thrown : new Error(String(thrown));
      if (registration.config.errorPolicy === 'fatal') {
        this.invokeErrorHandler(normalized, action, originalPayload, options, 1);
        return { failed: normalized };
      }
      return FAST_STEP_SKIPPED;
    }
  }

  private advanceFastSequentialIndex(
    handlers: readonly HandlerRegistration<any, any>[],
    index: number,
    state: FastSequentialState<any>,
  ): number {
    if (state.terminated) {
      return handlers.length;
    }
    if (state.jumpToPriority !== undefined) {
      state.jumpCount += 1;
      if (state.jumpCount > this.maxJumps) {
        state.aborted = true;
        state.jumpToPriority = undefined;
        return handlers.length;
      }
      const jumpPriority = state.jumpToPriority;
      state.jumpToPriority = undefined;
      for (let k = 0; k < handlers.length; k++) {
        if ((handlers[k]!.config.priority || 0) <= jumpPriority) {
          return k !== index ? k : index + 1;
        }
      }
      return index + 1;
    }
    return index + 1;
  }

  private dispatchFastSequential<K extends keyof T>(
    action: K,
    payload: T[K],
    handlers: readonly HandlerRegistration<any, any>[],
    options: DispatchOptions | undefined,
  ): Promise<void> {
    const state: FastSequentialState<T[K]> = {
      payload,
      aborted: false,
      terminated: false,
      jumpToPriority: undefined,
      jumpCount: 0,
      results: undefined,
    };
    const lifecycleSignal = this.lifecycleController.signal;
    let i = 0;

    this.dispatchConstructionDepth += 1;
    try {
      while (i < handlers.length) {
        if (state.aborted || state.terminated || lifecycleSignal.aborted) {
          break;
        }
        const registration = handlers[i]!;
        const step = this.invokeFastSyncStep(
          action,
          payload,
          options,
          registration,
          state,
          lifecycleSignal,
        );
        if (step.aborted) {
          break;
        }
        if (step.failed) {
          return this.createObservedRejection(step.failed);
        }
        if (step.pending) {
          const promise = this.continueFastSequentialAsync(
            action,
            payload,
            options,
            handlers,
            i,
            registration,
            step.pending,
            state,
            lifecycleSignal,
          );
          this.trackDispatchPromise(promise);
          void promise.catch(NOOP);
          return promise;
        }
        if (step.skipped) {
          i++;
          continue;
        }

        i = this.advanceFastSequentialIndex(handlers, i, state);
      }
    } finally {
      this.dispatchConstructionDepth -= 1;
    }

    return RESOLVED_VOID_PROMISE;
  }

  private async continueFastSequentialAsync<K extends keyof T>(
    action: K,
    originalPayload: T[K],
    options: DispatchOptions | undefined,
    handlers: readonly HandlerRegistration<any, any>[],
    startIndex: number,
    firstRegistration: HandlerRegistration<any, any>,
    firstPromise: Promise<unknown>,
    state: FastSequentialState<T[K]>,
    lifecycleSignal: AbortSignal,
  ): Promise<void> {
    let nonBlockingPromises: Array<Promise<unknown>> | undefined;
    let fatalError: Error | undefined;
    let firstPending: Promise<unknown> | undefined = firstPromise;
    let firstReg: HandlerRegistration<any, any> | undefined = firstRegistration;
    let i = startIndex;

    while (i < handlers.length) {
      let registration: HandlerRegistration<any, any>;
      let pendingPromise: Promise<unknown> | undefined;

      if (firstPending && firstReg) {
        registration = firstReg;
        pendingPromise = firstPending;
        firstReg = undefined;
        firstPending = undefined;
      } else {
        if (state.aborted || state.terminated || lifecycleSignal.aborted) {
          break;
        }
        registration = handlers[i]!;
        const step = this.invokeFastSyncStep(
          action,
          originalPayload,
          options,
          registration,
          state,
          lifecycleSignal,
        );
        if (step.aborted) {
          break;
        }
        if (step.failed) throw step.failed;
        if (step.skipped) {
          i++;
          continue;
        }
        pendingPromise = step.pending;
      }

      if (pendingPromise) {
        const currentReg = registration;
        const tracked = this.trackGlobalHandlerPromise(pendingPromise);
        if (currentReg.config.scheduling === 'await-before-next') {
          try {
            const resolved = await tracked;
            if (
              publishesRoleResults(currentReg.role)
              && resolved !== undefined
              && !state.terminated
            ) {
              (state.results ??= []).push(resolved);
            }
          } catch (thrown) {
            if (state.aborted || lifecycleSignal.aborted) {
              break;
            }
            const normalized = thrown instanceof Error ? thrown : new Error(String(thrown));
            if (currentReg.config.errorPolicy === 'fatal') {
              this.invokeErrorHandler(normalized, action, originalPayload, options, 1);
              throw normalized;
            }
          }
        } else {
          const settled = tracked.then(
            resolved => {
              if (
                publishesRoleResults(currentReg.role)
                && resolved !== undefined
                && !state.terminated
              ) {
                (state.results ??= []).push(resolved);
              }
            },
            thrown => {
              if (currentReg.config.errorPolicy === 'fatal' && !fatalError) {
                fatalError = thrown instanceof Error ? thrown : new Error(String(thrown));
              }
            },
          );
          (nonBlockingPromises ??= []).push(settled);
        }
      }

      i = this.advanceFastSequentialIndex(handlers, i, state);
    }

    if (nonBlockingPromises && nonBlockingPromises.length > 0) {
      await Promise.allSettled(nonBlockingPromises);
    }
    if (fatalError && !state.aborted && !lifecycleSignal.aborted) {
      this.invokeErrorHandler(fatalError, action, originalPayload, options, 1);
      throw fatalError;
    }
  }

  /** Execute a dispatch operation with an optional whole-action retry policy. */
  private async executeWithRetry<R>(
    operation: (attemptSignal: AbortSignal | undefined) => Promise<R>,
    options: DispatchOptions | undefined,
    attemptState: { count: number },
    shouldRetryResult?: (result: R) => boolean,
    canRetry: () => boolean = () => true,
    telemetry?: RetryTelemetry,
    beforeRetry?: () => Promise<void>,
  ): Promise<R> {
    const maxAttempts = options?.retryOnError?.maxAttempts ?? 1;
    const retryDelay = options?.retryOnError?.delay ?? 0;

    while (attemptState.count < maxAttempts) {
      attemptState.count += 1;
      const attemptStartedAt = telemetry ? Date.now() : 0;
      const attemptController = maxAttempts > 1 ? new AbortController() : undefined;
      const recordAttempt = (outcome: 'succeeded' | 'failed' | 'retried') => {
        if (!telemetry) return;
        const attemptEndedAt = Date.now();
        const duration = attemptEndedAt - attemptStartedAt;
        telemetry.pipelineDuration += duration;
        telemetry.attempts.push({
          startTime: attemptStartedAt,
          endTime: attemptEndedAt,
          duration,
          outcome,
        });
      };

      let retryResult: { failed: true; error: unknown } | { failed: false; value: R };
      try {
        const value = await operation(attemptController?.signal);
        const shouldRetry = shouldRetryResult?.(value) ?? false;
        const canRetryAttempt = (
          shouldRetry &&
          attemptState.count < maxAttempts &&
          !options?.signal?.aborted &&
          canRetry()
        );
        recordAttempt(shouldRetry ? (canRetryAttempt ? 'retried' : 'failed') : 'succeeded');
        if (!canRetryAttempt) return value;
        retryResult = { failed: false, value };
      } catch (error) {
        const canRetryAttempt = !(
          error instanceof ActionValidationError ||
          attemptState.count >= maxAttempts ||
          options?.signal?.aborted ||
          !canRetry()
        );
        recordAttempt(canRetryAttempt ? 'retried' : 'failed');
        if (!canRetryAttempt) throw error;
        retryResult = { failed: true, error };
      }

      attemptController?.abort(new ActionAttemptSupersededError(attemptState.count));
      await beforeRetry?.();
      const retryStartedAt = telemetry ? Date.now() : 0;
      const shouldContinue = await this.waitForRetry(retryDelay, options?.signal);
      if (telemetry) telemetry.retryDelayDuration += Date.now() - retryStartedAt;
      if (!shouldContinue) {
        if (retryResult.failed) throw retryResult.error;
        telemetry?.attempts.push({
          startTime: Date.now(), endTime: Date.now(), duration: 0, outcome: 'cancelled',
        });
        return retryResult.value;
      }
    }

    // The loop always returns or throws. This protects the generic return type
    // if an invalid retry configuration somehow reaches this point.
    const terminalAttempt = maxAttempts > 1 ? new AbortController() : undefined;
    return operation(terminalAttempt?.signal);
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

  private withAttemptSignal(
    options: DispatchOptions | undefined,
    attemptSignal: AbortSignal | undefined,
  ): DispatchOptions | AttemptDispatchOptions | undefined {
    if (!attemptSignal) return options;
    const outerSignal = options?.signal;
    if (!outerSignal) return { ...options, signal: attemptSignal };
    const { signal, cleanup } = mergeAbortSignals([outerSignal, attemptSignal]);
    return { ...options, signal, [ATTEMPT_SIGNAL_CLEANUP]: cleanup };
  }

  private shouldDrainBeforeRetry(
    plan: DispatchPlan,
    options: DispatchOptions | undefined,
  ): boolean {
    const barrier = options?.retryOnError?.attemptBarrier
      ?? (plan.executionMode === 'race' ? 'abort-and-drain' : 'abort-and-overlap');
    return barrier === 'abort-and-drain';
  }

  /** Do not begin a whole-action retry while a previous race loser is still
   * running. Handlers should still observe their signal for cancellation. */
  private async drainAttemptHandlers(
    dispatchHandlerPromises: DispatchHandlerPromises,
  ): Promise<void> {
    if (dispatchHandlerPromises.size === 0) return;
    await Promise.allSettled([...dispatchHandlerPromises]);
  }

  private trackGlobalHandlerPromise<R>(promise: Promise<R>): Promise<R> {
    this.activeHandlerPromises.add(promise);
    const remove = () => this.activeHandlerPromises.delete(promise);
    void promise.then(remove, remove);
    return promise;
  }

  /** Abort-aware retry delay so cancellation does not wait for the full backoff. */
  private waitForRetry(delay: number, signal?: AbortSignal): Promise<boolean> {
    if (signal?.aborted) return Promise.resolve(false);
    if (delay <= 0) return Promise.resolve(true);

    return new Promise(resolve => {
      const timer = setTimeout(finish, delay);
      const abort = () => finish(false);

      function finish(shouldContinue = true) {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        resolve(shouldContinue);
      }

      signal?.addEventListener('abort', abort, { once: true });
    });
  }

  private resolveActionDispatchOptions<K extends ActionNames<T>>(
    action: K,
    options?: DispatchOptions
  ): DispatchOptions | undefined {
    if (options === undefined) {
      return this.actionDefaultDispatchOptions?.[action];
    }

    const policy = this.actionPolicies?.[action];
    if (!policy) return options;

    const resolvedImmediate = options.immediate !== undefined
      ? options.immediate
      : policy.queue === 'immediate'
        ? true
        : policy.queue === 'serial'
          ? false
          : undefined;
    const resolvedTimeout = options.timeout !== undefined
      ? options.timeout
      : policy.timeout;

    if (
      resolvedImmediate === options.immediate
      && resolvedTimeout === options.timeout
    ) {
      return options;
    }

    return {
      ...options,
      ...(resolvedImmediate !== undefined && { immediate: resolvedImmediate }),
      ...(resolvedTimeout !== undefined && { timeout: resolvedTimeout }),
    };
  }

  private shouldQueueDispatch<K extends ActionNames<T>>(
    action: K,
    options?: DispatchOptions
  ): boolean {
    if (options?.immediate === true) return false;
    if (options?.immediate === false) {
      this.dispatchQueue ??= new OperationQueue(`${this.name}-Dispatch`);
      return true;
    }
    if (!this.dispatchQueue) return false;
    if (this.useGlobalConcurrencyQueue) return true;
    return this.actionPolicies?.[action]?.queue === 'serial';
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
    validateNonNegativeFiniteNumber(options?.timeout, 'timeout');
    const timeout = options?.timeout;
    if (timeout === undefined && options?.signal === undefined) {
      return {
        options: options === undefined
          ? this.defaultLifecycleOptions
          : { ...options, signal: this.lifecycleController.signal },
        timeoutPromise: undefined,
        onTimeout: NOOP,
        cleanup: NOOP,
        cleanupSignals: NOOP,
      };
    }

    const timeoutController = timeout !== undefined ? new AbortController() : undefined;
    const timeoutCallbacks = new Set<(error: ActionTimeoutError) => void>();
    const signals = [
      this.lifecycleController.signal,
      options?.signal,
      timeoutController?.signal,
    ].filter((candidate): candidate is AbortSignal => Boolean(candidate));
    const { signal, cleanup: cleanupSignals } = mergeAbortSignals(signals);

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
      cleanupSignals,
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
    if (!scope.timeoutPromise && scope.cleanup === NOOP && scope.cleanupSignals === NOOP) {
      return operation;
    }
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
    if (dispatchHandlerPromises.size === 0) {
      cleanup();
      return;
    }

    // In AbortSignal.any() fallback environments, this dispatch's signal
    // forwarding listeners must outlive its race-mode losers even though the
    // exposed dispatch resolved. Unrelated dispatches must not delay cleanup.
    void Promise.allSettled([...dispatchHandlerPromises]).then(cleanup);
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
    skippedRegistrations: readonly HandlerRegistration<any, any>[] = [],
    validation?: ExecutionResult<R>['validation'],
    abortReason = 'Action dispatch aborted by signal',
  ): ExecutionResult<R> {
    const endTime = Date.now();
    return createTerminalExecutionResult<R>({
      success: false,
      aborted: true,
      abortReason,
      outcome: 'cancelled',
      startTime,
      endTime,
      admissionDuration: endTime - startTime,
      validation,
      handlers: skippedRegistrations.map(createSkippedHandlerOutcome<R>),
    });
  }

  private getCompiledPipeline<K extends keyof T>(action: K): CompiledActionPipeline {
    const cached = this.compiledPipelines.get(action);
    if (cached) return cached;

    const raw = this.pipelines.get(action);
    if (!raw || raw.length === 0) {
      return EMPTY_COMPILED_PIPELINE;
    }

    const snapshot = [...raw];
    const guards: HandlerRegistration<any, any>[] = [];
    const nonGuards: HandlerRegistration<any, any>[] = [];
    const results: HandlerRegistration<any, any>[] = [];
    const observers: HandlerRegistration<any, any>[] = [];
    let hasOnce = false;

    for (let i = 0; i < snapshot.length; i++) {
      const handler = snapshot[i]!;
      if (handler.role === 'guard') {
        guards.push(handler);
      } else {
        nonGuards.push(handler);
        if (handler.role === 'observer') {
          observers.push(handler);
        } else {
          results.push(handler);
          if (handler.config.once) hasOnce = true;
        }
      }
    }

    const { debounceMs, throttleMs } = findTimingLimits(guards, results);

    const compiled: CompiledActionPipeline = {
      snapshot,
      guards,
      nonGuards,
      results,
      observers,
      hasOnce,
      debounceMs,
      throttleMs,
      hasTimingGuard: debounceMs !== undefined || throttleMs !== undefined,
    };
    this.compiledPipelines.set(action, compiled);
    return compiled;
  }

  private resolveDispatchPlan<K extends keyof T>(
    action: K,
    options?: DispatchOptions,
  ): DispatchPlan {
    const compiled = this.getCompiledPipeline(action);
    const executionMode = options?.executionMode
      ?? this.actionExecutionModes.get(action)
      ?? this.executionMode;

    if (!options?.filter) {
      return {
        pipelineSnapshot: compiled.snapshot,
        guards: compiled.guards,
        results: compiled.results,
        observers: compiled.observers,
        hasOnce: compiled.hasOnce,
        debounceMs: options?.debounce ?? compiled.debounceMs,
        throttleMs: options?.throttle ?? compiled.throttleMs,
        executionMode,
      };
    }

    // Guards are admission controls. Ordinary dispatch filters can select
    // result/observer work, but may never bypass validation or authorization.
    const filteredHandlers = this.filterHandlers(
      compiled.nonGuards as HandlerRegistration<any, any>[],
      options.filter,
    );
    const results: HandlerRegistration<any, any>[] = [];
    const observers: HandlerRegistration<any, any>[] = [];
    let hasOnce = false;

    for (let i = 0; i < filteredHandlers.length; i++) {
      const handler = filteredHandlers[i]!;
      if (handler.role === 'observer') {
        observers.push(handler);
      } else {
        results.push(handler);
        if (handler.config.once) hasOnce = true;
      }
    }

    const { debounceMs, throttleMs } = findTimingLimits(
      compiled.guards,
      results,
      options.debounce,
      options.throttle,
    );

    return {
      pipelineSnapshot: compiled.snapshot,
      guards: compiled.guards,
      results,
      observers,
      hasOnce,
      debounceMs,
      throttleMs,
      executionMode,
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
    if (!plan.hasOnce) {
      return plan.results as HandlerRegistration<any, any>[];
    }
    const activePipeline = this.pipelines.get(action) ?? [];
    return plan.results.filter(
      handler => !handler.config.once || activePipeline.includes(handler),
    );
  }

  private getObservers<K extends keyof T>(
    action: K,
    plan: DispatchPlan,
  ): Array<[
    HandlerRegistration<any, any>,
    { handler: ActionObserverHandler<any, any>; when: 'success' | 'failure' | 'always' }
  ]> {
    const activePipeline = this.pipelines.get(action) ?? [];
    return plan.observers.flatMap(registration => {
      const observer = this.observerHandlers.get(registration);
      return registration.role === 'observer'
        && activePipeline.includes(registration)
        && observer
        ? [[registration, observer] as [
          HandlerRegistration<any, any>,
          { handler: ActionObserverHandler<any, any>; when: 'success' | 'failure' | 'always' }
        ]]
        : [];
    });
  }

  /** Observers run after the canonical result has been constructed. Their
   * failures are isolated from that immutable result; detached observers are
   * still tracked for registry shutdown. */
  private async executeObservers<K extends keyof T, R>(
    action: K,
    plan: DispatchPlan,
    event: ActionObserverEvent<T[K], R>,
    notifiedObservers = new Set<HandlerRegistration<any, any>>(),
  ): Promise<void> {
    const observerEvent = this.safeSnapshotObserverEvent(event);
    const selectedObservers: Array<[
      HandlerRegistration<any, any>,
      { handler: ActionObserverHandler<any, any>; when: 'success' | 'failure' | 'always' },
    ]> = [];

    // Assign every terminal-path-eligible observer to this immutable event
    // before awaiting any callback. Conditions are deliberately evaluated in
    // the invocation loop below: a lower-priority observer must see state
    // changes made by an awaited higher-priority observer, while remaining
    // reserved to this canonical event if a timeout races that observer chain.
    for (const [registration, observerEntry] of this.getObservers(action, plan)) {
      if (notifiedObservers.has(registration)) continue;
      const successful = observerEvent.outcome === 'completed' || observerEvent.outcome === 'completed_with_errors';
      if (observerEntry.when === 'success' && !successful) continue;
      if (observerEntry.when === 'failure' && successful) continue;
      notifiedObservers.add(registration);
      selectedObservers.push([registration, observerEntry]);
    }

    for (const [registration, observerEntry] of selectedObservers) {
      let shouldRun = true;
      try {
        shouldRun = registration.config.condition?.(observerEvent.payload as T[K]) ?? true;
      } catch (error) {
        this.log(`Observer condition failed for ${String(action)}`, error, 'warn');
        continue;
      }
      if (!shouldRun) continue;
      // Detach before invocation so a concurrent dispatch cannot observe and
      // invoke the same once observer. Cleanup remains tied to settlement.
      const detachedOnce = registration.config.once
        && this.removeRegistration(action, registration, false);
      // An earlier awaited observer lets other dispatches consume this same
      // snapshot entry. Only the dispatch that detached it may invoke it.
      if (registration.config.once && !detachedOnce) continue;
      const cleanupOnce = () => {
        if (detachedOnce) this.runRegistrationCleanup(action, registration);
      };
      const invocation = Promise.resolve().then(() => observerEntry.handler(observerEvent));
      if (registration.config.scheduling === 'start-and-continue') {
        void this.trackGlobalHandlerPromise(invocation).then(cleanupOnce, error => {
          this.log(`Observer failed for ${String(action)}`, error, 'warn');
          cleanupOnce();
        });
      } else {
        try {
          await invocation;
        } catch (error) {
          this.log(`Observer failed for ${String(action)}`, error, 'warn');
        } finally {
          cleanupOnce();
        }
      }
    }
  }

  /** Give JavaScript observers an isolated, shallowly immutable terminal view.
   * Result payloads are intentionally not deep-cloned: arbitrary result values
   * may be class instances, streams, or identity-bearing domain objects. */
  private snapshotObserverEvent<TPayload, R>(
    event: ActionObserverEvent<TPayload, R>,
  ): ActionObserverEvent<TPayload, R> {
    const freezeValue = <V>(value: V): V => {
      if (Array.isArray(value)) return Object.freeze([...value]) as V;
      if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
        return Object.freeze({ ...(value as Record<string, unknown>) }) as V;
      }
      return value;
    };
    return Object.freeze({
      ...event,
      payload: freezeValue(event.payload),
      result: freezeValue(event.result),
      errors: Object.freeze(event.errors.map(error => Object.freeze({ ...error }))),
    });
  }

  /** A diagnostic observer must never make an already constructed canonical
   * result reject, including when shallow-copying a Proxy/getter throws. */
  private safeSnapshotObserverEvent<TPayload, R>(
    event: ActionObserverEvent<TPayload, R>,
  ): ActionObserverEvent<TPayload, R> {
    try {
      return this.snapshotObserverEvent(event);
    } catch (error) {
      this.log('Observer snapshot failed', error, 'warn');
      return Object.freeze({
        action: event.action,
        payload: event.payload,
        outcome: event.outcome,
        result: undefined,
        errors: Object.freeze([]),
        ...(event.signal === undefined ? {} : { signal: event.signal }),
      });
    }
  }

  /** Execute the selected guard snapshot once for the whole dispatch. Guards
   * are deliberately outside the retry loop: authorization and normalization
   * belong to admission, not to each provider attempt. */
  private async executeGuardPhase<K extends keyof T>(
    action: K,
    payload: T[K],
    options: DispatchOptions | undefined,
    plan: DispatchPlan,
    dispatchHandlerPromises: DispatchHandlerPromises,
  ): Promise<GuardPhaseResult<T[K]>> {
    if (plan.guards.length === 0) {
      return {
        allowed: true, payload, aborted: false, abortReason: undefined,
        error: undefined, errors: [], outcomes: [], executedHandlers: [], duration: 0,
      };
    }
    const [signal, autoAbortController, cleanup] = this.createAbortSignal(options);
    const context: PipelineContext<T[K], unknown> = {
      action: String(action),
      payload,
      handlers: [...plan.guards] as HandlerRegistration<T[K], unknown>[],
      executedHandlers: [],
      handlerOutcomes: [],
      claimOnce: registration => this.claimOnceRegistration(action, registration),
      signal: signal ?? this.lifecycleController.signal,
      trackHandlerPromise: promise => this.trackHandlerPromise(promise, dispatchHandlerPromises),
      aborted: false,
      abortReason: undefined,
      currentIndex: 0,
      jumpToPriority: undefined,
      jumpCount: 0,
      maxJumps: this.maxJumps,
      executionMode: 'sequential',
      results: [],
      terminated: false,
      terminationResult: undefined,
    };
    const abortHandler = signal ? () => {
      context.aborted = true;
      context.abortReason = typeof signal.reason === 'string'
        ? signal.reason
        : 'Action dispatch aborted by signal';
    } : undefined;
    signal?.addEventListener('abort', abortHandler!, { once: true });
    let error: Error | undefined;
    try {
      await executeSequential(context, (registration, _index) =>
        this.createRoleController(
          registration.role,
          context,
          context.signal ?? this.lifecycleController.signal,
          context,
          autoAbortController,
          options?.autoAbort,
        ),
      );
    } catch (caught) {
      error = caught instanceof Error ? caught : new Error(String(caught));
    } finally {
      if (signal && abortHandler) signal.removeEventListener('abort', abortHandler);
      this.cleanupSignalsAfterStartedHandlers(() => {
        cleanup();
        (options as AttemptDispatchOptions | undefined)?.[ATTEMPT_SIGNAL_CLEANUP]?.();
      }, dispatchHandlerPromises);
    }
    const errors = [...(context.collectedErrors ?? [])];
    if (error && !errors.some(entry => entry.error === error)) {
      errors.push({
        handlerId: 'guard', error, timestamp: Date.now(), severity: 'blocking',
      });
    }
    return {
      allowed: !context.aborted && error === undefined && errors.length === 0,
      payload: context.payload,
      aborted: context.aborted,
      abortReason: context.abortReason,
      error,
      errors,
      outcomes: (context.handlerOutcomes ?? []).map(snapshotHandlerOutcome),
      executedHandlers: context.executedHandlers ?? [],
      duration: (context.handlerOutcomes ?? []).reduce((total, outcome) => total + (outcome.duration ?? 0), 0),
    };
  }

  private createGuardRejectedResult<R>(
    startTime: number,
    validation: ExecutionResult<R>['validation'],
    guard: GuardPhaseResult<unknown>,
    selectedHandlers: readonly HandlerRegistration<any, any>[],
  ): ExecutionResult<R> {
    const endTime = Date.now();
    const outcomeById = new Map(guard.outcomes.map(outcome => [outcome.id, outcome]));
    let handlersExecuted = 0;
    let handlersSkipped = 0;
    let handlersFailed = 0;
    const handlers = selectedHandlers.map(registration => {
      const outcome = outcomeById.get(registration.id);
      const entry = outcome
        ? { ...snapshotHandlerOutcome(outcome as HandlerExecutionOutcome<R>), result: undefined }
        : createSkippedHandlerOutcome<R>(registration);
      if (entry.executed) handlersExecuted += 1;
      else handlersSkipped += 1;
      if (entry.status === 'failed') handlersFailed += 1;
      return entry;
    });
    return createTerminalExecutionResult<R>({
      success: false,
      aborted: guard.aborted,
      abortReason: guard.abortReason ?? guard.error?.message,
      outcome: guard.aborted ? 'cancelled' : 'failed',
      startTime,
      endTime,
      pipelineDuration: endTime - startTime,
      handlersExecuted,
      handlersSkipped,
      handlersFailed,
      validation,
      handlers,
      errors: guard.errors,
      failedResults: guard.errors.map(error => ({
        handlerId: error.handlerId, error: error.error, expectedType: 'unknown',
      })),
    });
  }

  private createTimingGuardResult<R>(
    reason: string,
    startTime: number,
    handlers: readonly HandlerRegistration<any, any>[],
    validation?: ExecutionResult<R>['validation'],
  ): ExecutionResult<R> {
    const endTime = Date.now();
    return createTerminalExecutionResult<R>({
      success: false,
      // A timing guard rejects admission; it does not cancel an in-flight
      // dispatch or consume a caller AbortSignal.
      aborted: false,
      abortReason: reason,
      outcome: reason === 'Debounced execution' ? 'debounced' : 'throttled',
      startTime,
      endTime,
      admissionDuration: endTime - startTime,
      validation,
      handlers: handlers.map(createSkippedHandlerOutcome<R>),
    });
  }

  /**
   * Dispatch an action and return detailed execution results
   * 
   * @param action - The action type to dispatch
   * @param args - The payload/options tuple for the selected action: payload-bearing actions require a payload, while void actions may omit it; dispatch options, including result collection, are optional.
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
    const [payload, rawOptions] = args as [T[K] | undefined, DispatchOptions | undefined];
    const options = this.resolveActionDispatchOptions(action, rawOptions);
    validateDispatchTimingOptions(options);
    return this._dispatchWithResult<K, R>(action, payload, options);
  }

  private _dispatchWithResult<K extends ActionNames<T>, R = ActionResult<TResultMap, K>>(
    action: K,
    payload: T[K] | undefined,
    options: DispatchOptions | undefined,
  ): Promise<ExecutionResult<R>> {
    const trace = this.beginDispatchTrace(String(action), options);
    if (this.lifecycleState !== 'active') {
      return this.withDispatchTrace(this.rejectedLifecyclePromise<ExecutionResult<R>>(), trace, () => 'failed');
    }

    const timeoutScope = this.createTimeoutScope(action, options);
    const dispatchStartTime = Date.now();
    const dispatchHandlerPromises: DispatchHandlerPromises = new Set();
    const attemptState = { count: 0 };
    let validation: ExecutionResult<R>['validation'];
    let observerPayload = payload as T[K];
    let admissionEndedAt = dispatchStartTime;
    let pipelineStartedAt: number | undefined;
    const retryTelemetry: RetryTelemetry = {
      pipelineDuration: 0,
      retryDelayDuration: 0,
      attempts: [],
    };
    let plan: DispatchPlan;
    try {
      plan = this.resolveDispatchPlan(action, options);
    } catch (error) {
      timeoutScope.cleanup();
      timeoutScope.cleanupSignals();
      trace?.settle('failed');
      throw error;
    }
    const hasTimingGuard = plan.debounceMs !== undefined || plan.throttleMs !== undefined;

    const pipelineOperation = async () => {
      pipelineStartedAt = Date.now();
      const guard = plan.guards.length > 0
        ? await this.executeGuardPhase(
          action, payload as T[K], timeoutScope.options, plan, dispatchHandlerPromises,
        )
        : {
          allowed: true, payload: payload as T[K], aborted: false,
          abortReason: undefined, error: undefined, errors: [], outcomes: [], executedHandlers: [], duration: 0,
        };
      this.cleanupOneTimeHandlers(action, guard.executedHandlers, dispatchHandlerPromises);
      observerPayload = guard.payload;
      if (!guard.allowed) {
        return this.createGuardRejectedResult<R>(
          pipelineStartedAt,
          validation,
          guard,
          [...plan.guards, ...plan.results],
        );
      }
      const rawExecution = await this.executeWithRetry(async attemptSignal => {
          const executedHandlers: HandlerRegistration<any, any>[] = [];
          try {
            return await this._performDispatchWithResult<K, R>(
              action,
              guard.payload,
              this.withAttemptSignal(timeoutScope.options, attemptSignal),
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
          result.outcome === 'failed'
        ), () => this.getAttemptHandlers(action, plan).length > 0, retryTelemetry,
        this.shouldDrainBeforeRetry(plan, timeoutScope.options)
          ? () => this.drainAttemptHandlers(dispatchHandlerPromises)
          : undefined);

      // A caller/lifecycle cancellation during retry backoff is terminal for
      // the dispatch, while the timeout channel remains a failed dispatch.
      if (timeoutScope.options?.signal?.aborted) {
        if (timeoutScope.options.signal.reason instanceof ActionTimeoutError) {
          throw timeoutScope.options.signal.reason;
        }
        rawExecution.success = false;
        rawExecution.aborted = true;
        rawExecution.abortReason = getAbortReason(timeoutScope.options.signal);
        rawExecution.outcome = 'cancelled';
        return rawExecution;
      }

      if (guard.outcomes.length > 0) {
        const guardHandlers = guard.outcomes.map(outcome => ({ ...outcome, result: undefined }));
        rawExecution.handlers = [
          ...guardHandlers,
          ...rawExecution.handlers,
        ] as ExecutionResult<R>['handlers'];
        let guardExecuted = 0;
        let guardSkipped = 0;
        let guardFailed = 0;
        for (let i = 0; i < guard.outcomes.length; i++) {
          const outcome = guard.outcomes[i]!;
          if (outcome.executed) guardExecuted += 1;
          else guardSkipped += 1;
          if (outcome.status === 'failed') guardFailed += 1;
        }
        rawExecution.execution.handlersExecuted += guardExecuted;
        rawExecution.execution.handlersSkipped += guardSkipped;
        rawExecution.execution.handlersFailed += guardFailed;
      }

      const resultProcessingStartedAt = Date.now();
      rawExecution.result = this.processResults(
        rawExecution.results,
        rawExecution.terminated,
        rawExecution.terminated ? rawExecution.result : undefined,
        options?.result,
      ) as R | R[] | undefined;
      const resultProcessingDuration = Date.now() - resultProcessingStartedAt;
      rawExecution.execution.pipelineDuration = guard.duration + retryTelemetry.pipelineDuration;
      rawExecution.execution.retryDelayDuration = retryTelemetry.retryDelayDuration;
      rawExecution.execution.resultProcessingDuration = resultProcessingDuration;
      rawExecution.execution.attempts = retryTelemetry.attempts;
      return rawExecution;
    };

    const selectedHandlers = plan.guards.length > 0
      ? [...plan.guards, ...plan.results]
      : plan.results;
    const operation = async () => {
      const buildAbortedResult = (currentValidation?: ExecutionResult<R>['validation']) =>
        this.createAbortedExecutionResult<R>(
          dispatchStartTime,
          selectedHandlers,
          currentValidation,
          getAbortReason(timeoutScope.options?.signal),
        );

      if (timeoutScope.options?.signal?.aborted) {
        admissionEndedAt = Date.now();
        return buildAbortedResult(undefined);
      }

      // Strict validation must complete before timing guards mutate admission state.
      validation = this.validatePayload(action, payload);
      if (timeoutScope.options?.signal?.aborted) {
        admissionEndedAt = Date.now();
        return buildAbortedResult(validation);
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
          return buildAbortedResult(validation);
        }
        if (admission.reason) {
          admissionEndedAt = Date.now();
          return this.createTimingGuardResult<R>(
            admission.reason,
            dispatchStartTime,
            selectedHandlers,
            validation,
          );
        }
      }

      if (timeoutScope.options?.signal?.aborted) {
        admissionEndedAt = Date.now();
        return buildAbortedResult(validation);
      }

      admissionEndedAt = Date.now();

      if (!this.shouldQueueDispatch(action, timeoutScope.options)) {
        return pipelineOperation();
      }

      const queued = this.dispatchQueue!.enqueueWithHandle(
        pipelineOperation,
        timeoutScope.options?.queuePriority ?? 0,
      );
      timeoutScope.onTimeout(error => queued.cancel(error));

      const callerSignal = options?.signal;
      let removeCallerAbortListener: (() => void) | undefined;
      const cleanupCallerAbortListener = () => {
        removeCallerAbortListener?.();
        removeCallerAbortListener = undefined;
      };
      if (callerSignal) {
        const cancelQueued = () => { queued.cancel(callerSignal.reason); };
        callerSignal.addEventListener('abort', cancelQueued, { once: true });
        removeCallerAbortListener = () => callerSignal.removeEventListener('abort', cancelQueued);
        if (callerSignal.aborted) cancelQueued();
      }

      return queued.promise.then(
        value => { cleanupCallerAbortListener(); return value; },
        error => { cleanupCallerAbortListener(); throw error; },
      ).catch(error => {
        const callerCancelled = (
          this.lifecycleState === 'active'
          && callerSignal?.aborted === true
          && !(timeoutScope.options?.signal?.reason instanceof ActionTimeoutError)
        );
        if (!callerCancelled) throw error;
        return buildAbortedResult(validation);
      });
    };

    const notifiedObservers = new Set<HandlerRegistration<any, any>>();
    const notifiedObserverOutcomes = new Set<ActionObserverEvent<T[K], R>['outcome']>();
    let terminalErrorReported = false;
    const reportTerminalError = (error: unknown) => {
      if (terminalErrorReported) return;
      terminalErrorReported = true;
      this.invokeErrorHandler(error, action, payload, options, attemptState.count);
    };
    const notifyObservers = async (event: ActionObserverEvent<T[K], R>) => {
      if (notifiedObserverOutcomes.has(event.outcome)) return;
      notifiedObserverOutcomes.add(event.outcome);
      await this.executeObservers(action, plan, event, notifiedObservers);
    };

    let observedDispatchPromise: Promise<ExecutionResult<R>>;
    this.dispatchConstructionDepth += 1;
    try {
      const dispatchPromise = operation();
      observedDispatchPromise = dispatchPromise.then(
        async result => {
          const dispatchEndedAt = Date.now();
          const execution = result.execution;
          execution.duration = dispatchEndedAt - dispatchStartTime;
          execution.admissionDuration = Math.max(0, admissionEndedAt - dispatchStartTime);
          execution.queueWaitDuration = pipelineStartedAt === undefined
            ? 0
            : Math.max(0, pipelineStartedAt - admissionEndedAt);
          execution.pipelineDuration = pipelineStartedAt === undefined
            ? 0
            : execution.pipelineDuration;
          execution.startTime = dispatchStartTime;
          execution.endTime = dispatchEndedAt;

          if (result.outcome === 'failed') {
            const terminalError = result.errors[result.errors.length - 1]?.error
              ?? new Error(`Action "${String(action)}" failed`);
            reportTerminalError(terminalError);
          }
          await notifyObservers({
            action: String(action),
            payload: observerPayload,
            outcome: result.outcome,
            result: result.result,
            errors: result.errors,
            signal: timeoutScope.options?.signal,
          });
          return result;
        },
        async error => {
          reportTerminalError(error);
          await notifyObservers(createDispatchFailureEvent<T[K], R>(
            String(action),
            observerPayload,
            error,
            timeoutScope.options?.signal,
          ));
          throw error;
        },
      );
      this.trackDispatchPromise(observedDispatchPromise);
    } finally {
      this.dispatchConstructionDepth -= 1;
    }

    const exposedPromise = this.raceWithTimeout(
      observedDispatchPromise,
      timeoutScope,
      dispatchHandlerPromises,
    );
    const observedPromise = exposedPromise.catch(async error => {
      reportTerminalError(error);
      // The public timeout is already terminal. Failure observers remain
      // shutdown-owned best-effort work, but a non-cooperative observer must
      // not hold the timed-out caller open indefinitely.
      const observerNotification = this.trackGlobalHandlerPromise(notifyObservers(
        createDispatchFailureEvent<T[K], R>(
          String(action),
          observerPayload,
          error,
          timeoutScope.options?.signal,
        ),
      ));
      void observerNotification.catch(observerError => {
        this.log(`Failure observer delivery failed for ${String(action)}`, observerError, 'warn');
      });
      throw error;
    });

    // Preserve rejection semantics for observers without leaking fire-and-forget
    // dispatches as process-level unhandled rejections.
    const tracedPromise = this.withDispatchTrace(observedPromise, trace, result => result.outcome);
    void tracedPromise.catch(NOOP);
    return tracedPromise;
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
    const cleanupDispatchSignals = () => {
      cleanup();
      (options as AttemptDispatchOptions | undefined)?.[ATTEMPT_SIGNAL_CLEANUP]?.();
    };

    try {
      if (options?.autoAbort?.onControllerCreated && autoAbortController) {
        options.autoAbort.onControllerCreated(autoAbortController);
      }
    } catch (error) {
      cleanupDispatchSignals();
      throw error;
    }

    // Check if dispatch is aborted before starting
    if (effectiveSignal?.aborted) {
      cleanupDispatchSignals();
      return this.createAbortedExecutionResult<R>(
        _startTime,
        plan.results,
        validation,
        getAbortReason(effectiveSignal),
      );
    }

    const pipeline = plan.pipelineSnapshot;

    if (!pipeline || pipeline.length === 0) {
      this.log(`Pipeline lookup for '${String(action)}'`, {
        pipelineExists: false,
        handlersCount: 0,
        allRegisteredActions: Array.from(this.pipelines.keys()),
      });
      // 🚨 경고: 핸들러가 등록되지 않은 액션 실행
      const warningMessage = `⚠️ Action '${String(action)}' has no registered handlers. This action will be ignored.`;

      if (this.isDebugMode) {
        console.warn(warningMessage);
        console.warn('💡 Tip: Register a handler using registry.register() before dispatching this action.');
        console.warn('📋 Available actions:', Array.from(this.pipelines.keys()));
      }
      this.log(`No handlers found for action '${String(action)}', dispatch cancelled`, {}, 'warn');

      cleanupDispatchSignals();
      return createTerminalExecutionResult<R>({
        success: true,
        aborted: false,
        abortReason: undefined,
        outcome: 'completed',
        startTime: _startTime,
        endTime: _startTime,
        validation,
      });
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
      claimOnce: registration => this.claimOnceRegistration(action, registration),
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
      this.cleanupSignalsAfterStartedHandlers(cleanupDispatchSignals, dispatchHandlerPromises);
    }

    const endTime = Date.now();
    
    const recordedOutcomes = context.handlerOutcomes ?? [];
    let outcomesById: Map<string, HandlerExecutionOutcome<R>> | undefined;
    const findOutcome = (id: string, indexHint: number): HandlerExecutionOutcome<R> | undefined => {
      const candidate = recordedOutcomes[indexHint];
      if (candidate && candidate.id === id) return candidate;
      if (!outcomesById && recordedOutcomes.length > 0) {
        outcomesById = new Map(recordedOutcomes.map(outcome => [outcome.id, outcome]));
      }
      return outcomesById?.get(id);
    };

    const handlerResults: HandlerExecutionOutcome<R>[] = new Array(filteredHandlers.length);
    let executionHandlersCount = 0;
    let nonRaceFailedCount = 0;
    for (let i = 0; i < filteredHandlers.length; i++) {
      const handler = filteredHandlers[i]!;
      const outcome = findOutcome(handler.id, i);
      const snapshot = outcome
        ? snapshotHandlerOutcome(outcome)
        : createSkippedHandlerOutcome<R>(handler);
      handlerResults[i] = snapshot;
      if (snapshot.executed) executionHandlersCount += 1;
      if (snapshot.status === 'failed') nonRaceFailedCount += 1;
    }

    const handlerErrors = errors.length === 0
      ? errors
      : errors.filter(error => error.handlerId !== 'pipeline');
    // Keep the public terminal-error view backward compatible: fatal pipeline
    // failures are represented by the pipeline error, while per-handler
    // diagnostics remain available through `handlers` and `failedResults`.
    const reportedErrors = executionError
      ? errors.filter(error => error.handlerId === 'pipeline')
      : errors;

    // 🔧 Type safety: Separate successful results from failed ones
    const successResults: R[] = [];
    for (let i = 0; i < context.results.length; i++) {
      const value = context.results[i];
      if (value !== undefined) successResults.push(value);
    }
    const failedResults = handlerErrors.length === 0
      ? []
      : handlerErrors.map(err => ({
          handlerId: err.handlerId,
          error: err.error,
          expectedType: 'unknown',
        }));

    let winnerOutcome: HandlerExecutionOutcome<R> | undefined;
    if (context.executionMode === 'race' && context.raceWinnerId !== undefined) {
      winnerOutcome = outcomesById
        ? outcomesById.get(context.raceWinnerId)
        : recordedOutcomes.find(outcome => outcome.id === context.raceWinnerId);
    }

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
      successResults,
      results: context.results,
      failedResults,
      execution: {
        duration: endTime - _startTime,
        admissionDuration: 0,
        queueWaitDuration: 0,
        pipelineDuration: endTime - _startTime,
        handlersExecuted: executionHandlersCount,
        handlersSkipped: Math.max(0, filteredHandlers.length - executionHandlersCount),
        handlersFailed: context.executionMode === 'race'
          ? (winnerOutcome?.status === 'failed' ? 1 : 0)
          : nonRaceFailedCount,
        startTime: _startTime,
        endTime,
      },
      handlers: handlerResults,
      ...(context.executionMode !== 'race' ? {} : {
        raceDiagnostics: {
          ...(context.raceWinnerId === undefined ? {} : { winnerId: context.raceWinnerId }),
          ...(winnerOutcome === undefined
            ? {}
            : { winner: snapshotHandlerOutcome(winnerOutcome) }),
          loserSnapshots: (context.raceLoserOutcomes ?? []).map(snapshotHandlerOutcome),
          pendingLosersAtReturn: (context.raceLoserOutcomes ?? [])
            .filter(outcome => outcome.status === 'running').length,
          observedLoserFailures: (context.raceLoserOutcomes ?? [])
            .filter(outcome => outcome.status === 'failed').length,
        },
      }),
      errors: reportedErrors.length === 0
        ? []
        : reportedErrors.map(err => ({
            handlerId: err.handlerId,
            error: err.error,
            timestamp: err.timestamp,
            severity: err.severity,
          })),
    };

    return executionResult;
  }

  /** Create a role-scoped pipeline controller directly for one handler execution. */
  private createRoleController<K extends keyof T>(
    role: HandlerRole | undefined,
    state: MutableControllerState<T[K]>,
    signal: AbortSignal = this.lifecycleController.signal,
    context?: PipelineContext<T[K], any>,
    autoAbortController?: AbortController,
    autoAbortOptions?: { allowHandlerAbort?: boolean },
  ): PipelineController<T[K], any> {
    const abort = (reason?: string) => {
      state.aborted = true;
      state.abortReason = reason;
      if (context) {
        const propagateAbort = state === context || context.executionMode !== 'race';
        if (propagateAbort) {
          context.aborted = true;
          context.abortReason = reason;
          if (autoAbortController && autoAbortOptions?.allowHandlerAbort) {
            autoAbortController.abort(reason);
          }
        }
      }
    };
    const getPayload = () => state.payload;

    if (role === 'command') {
      return { signal, getPayload, abort } as PipelineController<T[K], any>;
    }
    if (role === 'guard') {
      return {
        signal,
        getPayload,
        modifyPayload: (modifier: (payload: T[K]) => T[K]) => {
          state.payload = modifier(state.payload);
        },
        abort,
      } as PipelineController<T[K], any>;
    }

    const returnFn = (result: any) => {
      state.terminated = true;
      state.terminationResult = result;
      return result;
    };
    const setResult = (result: any) => {
      (state.results ??= []).push(result);
    };
    const getResults = () => (state.results ? [...state.results] : []);
    const mergeResult = (merger: (previousResults: any[], currentResult: any) => any) => {
      const results = (state.results ??= []);
      const currentResult = results[results.length - 1];
      const previousResults = results.slice(0, -1);
      const mergedResult = merger(previousResults, currentResult);
      if (results.length === 0) {
        results.push(mergedResult);
      } else {
        results[results.length - 1] = mergedResult;
      }
    };

    if (role === 'result') {
      return {
        signal,
        getPayload,
        abort,
        return: returnFn,
        setResult,
        getResults,
        mergeResult,
      } as PipelineController<T[K], any>;
    }

    return {
      signal,
      abort,
      modifyPayload: (modifier: (payload: T[K]) => T[K]) => {
        state.payload = modifier(state.payload);
      },
      getPayload,
      jumpToPriority: (priority: number) => {
        state.jumpToPriority = priority;
      },
      return: returnFn,
      setResult,
      getResults,
      mergeResult,
    };
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
    // controller.return() is authoritative even when its explicit value is undefined.
    if (terminated) {
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
    _dispatchHandlerPromises: DispatchHandlerPromises,
    autoAbortController?: AbortController,
    autoAbortOptions?: { allowHandlerAbort?: boolean }
  ): Promise<void> {
    const createController = (
      registration: HandlerRegistration<T[K], any>,
      _index: number,
      state?: PipelineControllerState<T[K], any>,
    ): PipelineController<T[K], any> =>
      this.createRoleController(
        registration.role,
        state ?? context,
        context.signal ?? this.lifecycleController.signal,
        context,
        autoAbortController,
        autoAbortOptions,
      );

    // Guards are a preflight phase in every mode, before result arbitration.
    const originalHandlers = context.handlers;
    let hasPreflightOrObserver = false;
    for (let i = 0; i < originalHandlers.length; i++) {
      const role = originalHandlers[i]!.role;
      if (role === 'guard' || role === 'observer') {
        hasPreflightOrObserver = true;
        break;
      }
    }

    if (hasPreflightOrObserver) {
      const preflightHandlers = originalHandlers.filter(handler => handler.role === 'guard');
      if (preflightHandlers.length > 0) {
        context.handlers = preflightHandlers;
        await executeSequential<T[K], any>(context, createController);
        if (context.aborted || context.terminated) {
          context.handlers = originalHandlers;
          return;
        }
      }
      context.handlers = originalHandlers.filter(
        handler => handler.role !== 'guard' && handler.role !== 'observer',
      );
    }

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
    context.handlers = originalHandlers;
  }

  private cleanupOneTimeHandlers<K extends keyof T>(
    action: K,
    executedHandlers: HandlerRegistration<any, any>[],
    dispatchHandlerPromises: DispatchHandlerPromises
  ): void {
    if (executedHandlers.length === 0) return;
    let oneTimeHandlers: HandlerRegistration<any, any>[] | undefined;
    for (let i = 0; i < executedHandlers.length; i++) {
      const reg = executedHandlers[i]!;
      if (reg.config.once) {
        (oneTimeHandlers ??= []).push(reg);
      }
    }
    if (!oneTimeHandlers) return;

    // Race mode returns its winner while loser handlers can still be active.
    // Detach every invoked once-handler immediately so retries cannot invoke it
    // again, but defer resource cleanup until this dispatch's started handler
    // work drains. Unrelated dispatches must not delay cleanup.
    const shouldDeferCleanup = dispatchHandlerPromises.size > 0;
    const handlersStillRunning = shouldDeferCleanup ? [...dispatchHandlerPromises] : undefined;

    for (let i = 0; i < oneTimeHandlers.length; i++) {
      const registration = oneTimeHandlers[i]!;
      const claimed = this.claimedOnceHandlers.delete(registration);
      const removed = claimed || this.removeRegistration(action, registration, !shouldDeferCleanup);
      if (removed) {
        if (claimed && !shouldDeferCleanup) {
          this.runRegistrationCleanup(action, registration);
        }
        if (
          handlersStillRunning &&
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
    }
  }

  /** Reserve a once registration before user code starts. This is synchronous,
   * so independent dispatches cannot both invoke the same registration. */
  private claimOnceRegistration<K extends keyof T>(
    action: K,
    registration: HandlerRegistration<any, any>,
  ): boolean {
    if (!registration.config.once) return true;
    if (this.claimedOnceHandlers.has(registration)) return false;
    if (!this.removeRegistration(action, registration, false)) return false;
    this.claimedOnceHandlers.add(registration);
    return true;
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
    this.compiledPipelines.delete(action);
    this.lastRegisteredTimestamps.delete(action);
    this.actionGuard.clearGuards(String(action));
    this.actionDispatchers.delete(String(action));
    this.actionResultDispatchers.delete(String(action));
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
    this.compiledPipelines.clear();
    this.lastRegisteredTimestamps.clear();
    this.unregisterFunctions.forEach(unregisters => unregisters.clear());
    this.unregisterFunctions.clear();
    this.actionGuard.clearAll();
    this.observerHandlers.clear();
    this.actionDispatchers.clear();
    this.actionResultDispatchers.clear();
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
    this.compiledPipelines.delete(action);
    this.observerHandlers.delete(registration);
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

  private beginShutdown(deferCleanup = false): Promise<void> {
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
      !deferCleanup &&
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
    this.dispatchTraceListeners.clear();
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
   * `deferCleanup` closes the register synchronously while deferring final
   * registered cleanup until the next microtask. This is useful for React
   * commit phases that must invalidate stale dispatchers immediately without
   * invoking user cleanup code inside the commit hook itself.
   *
   * Repeated calls return the same promise. New registrations and dispatches are
   * rejected as soon as shutdown begins.
   *
   * @public
   */
  destroyAsync(options: { deferCleanup?: boolean } = {}): Promise<void> {
    return this.beginShutdown(options.deferCleanup ?? false);
  }
}
