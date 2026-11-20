# Context-Action Core Package - Complete Code

Total Files: 25
Total Lines: 4990

## Type Definitions

### bridges/react-element/types.ts

```typescript
import type * as React from 'react';
export type ReactElementComponent<Props, Element extends HTMLElement, Handle = Element> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<Props & Omit<React.HTMLAttributes<Element>, keyof Props>> & React.RefAttributes<Handle>
>;
```

### facade/types.ts

```typescript
export type PublicHandleFactory<Target extends object, Handle> =
  (getTarget: () => Target | null) => Handle;
```

### types.ts

```typescript
export type ActionPayloadMap = object;
export interface ActionSchemaLike {
  safeParse(value: unknown):
    | { success: true; data: unknown }
    | {
        success: false;
        error: {
          message: string;
          issues: readonly { message: string }[];
        };
      };
}
export type ActionNames<T extends ActionPayloadMap> = Extract<keyof T, string>;
export type ActionPayload<T extends ActionPayloadMap, K extends keyof T> = T[K];
export type ActionResultMap<T extends ActionPayloadMap> = Partial<
  Record<ActionNames<T>, unknown>
>;
export type ActionResult<
  TResultMap extends ActionPayloadMap,
  K extends PropertyKey,
> = K extends keyof TResultMap ? TResultMap[K]
  : void;
export interface PipelineController<T = unknown, R = void> {
  readonly signal?: AbortSignal;
  abort(reason?: string): void;
  modifyPayload(modifier: (payload: T) => T): void;
  getPayload(): T;
  jumpToPriority(priority: number): void;
  return(result: R): R;
  setResult(result: R): void;
  getResults(): R[];
  mergeResult(merger: (previousResults: R[], currentResult: R) => R): void;
}
export interface ActionEffectController<T = unknown> {
  readonly signal?: AbortSignal;
  getPayload(): T;
}
export interface ActionCommandController<T = unknown> extends ActionEffectController<T> {
  abort(reason?: string): void;
}
export interface ActionGuardController<T = unknown> extends ActionEffectController<T> {
  abort(reason?: string): void;
  modifyPayload(modifier: (payload: T) => T): void;
}
export interface ActionResultController<T = unknown, R = void>
  extends ActionEffectController<T> {
  abort(reason?: string): void;
  return(result: R): R;
  setResult(result: R): void;
  getResults(): readonly R[];
  mergeResult(merger: (previousResults: readonly R[], currentResult: R) => R): void;
}
export type HandlerRole = 'guard' | 'command' | 'result' | 'observer' | 'legacy';
export interface ActionObserverEvent<T = unknown, R = void> {
  readonly action: string;
  readonly payload: Readonly<T>;
  readonly outcome: ExecutionResult<R>['outcome'];
  readonly result: R | readonly R[] | undefined;
  readonly errors: readonly HandlerError[];
  readonly signal?: AbortSignal;
}
export type ActionObserverHandler<T = unknown, R = void> = (
  event: ActionObserverEvent<T, R>,
) => void | Promise<void>;
export interface ObserverConfig<T = unknown> extends Omit<HandlerConfig<T>,
  'debounce' | 'throttle' | 'blocking' | 'errorPolicy'> {
  when?: 'success' | 'failure' | 'always';
}
export interface GuardConfig<T = unknown> extends Omit<HandlerConfig<T>,
  'blocking' | 'scheduling' | 'errorPolicy' | 'debounce' | 'throttle' | 'when'> {}
export interface EffectConfig<T = unknown> extends HandlerConfig<T> {
  effectKind: 'guard' | 'observer';
}
export type ActionCommandHandler<T = unknown> = (
  payload: T,
  controller: ActionCommandController<T>,
) => void | Promise<void>;
export interface CommandConfig<T = unknown> extends Omit<HandlerConfig<T>, 'when'> {}
export type ActionHandler<T = unknown, R = void> = (
  payload: T,
  controller: PipelineController<T, R>
) => R | Promise<R> | void | Promise<void>;
export type ActionEffectHandler<T = unknown> = (
  payload: T,
  controller: ActionEffectController<T>,
) => void | Promise<void>;
export type ActionGuardHandler<T = unknown> = (
  payload: T,
  controller: ActionGuardController<T>,
) => void | Promise<void>;
export type ActionResultHandler<T = unknown, R = void> = (
  payload: T,
  controller: ActionResultController<T, R>
) => R | Promise<R>;
export type HandlerScheduling = 'await-before-next' | 'start-and-continue';
export type HandlerErrorPolicy = 'fatal' | 'collect';
export interface HandlerConfig<T = unknown> {
  priority?: number;
  id?: string;
  blocking?: boolean;
  scheduling?: HandlerScheduling;
  errorPolicy?: HandlerErrorPolicy;
  once?: boolean;
  debounce?: number;
  throttle?: number;
  replaceExisting?: boolean;
  cleanup?: () => void;
  condition?: (payload: T) => boolean;
  metadata?: Record<string, unknown>;
  when?: 'success' | 'failure' | 'always';
}
export interface ResolvedHandlerConfig<T = unknown> {
  priority: number;
  id: string;
  blocking: boolean;
  scheduling: HandlerScheduling;
  errorPolicy: HandlerErrorPolicy;
  once: boolean;
  replaceExisting: boolean;
  debounce?: number;
  throttle?: number;
  cleanup?: () => void;
  condition?: (payload: T) => boolean;
  metadata?: Record<string, unknown>;
}
export function resolveHandlerConfig<T = unknown>(
  config: HandlerConfig<T> | undefined,
  handlerId: string,
): ResolvedHandlerConfig<T> {
  return {
    priority: config?.priority ?? 0,
    id: handlerId,
    blocking: config?.errorPolicy === 'fatal' || config?.blocking === true,
    scheduling: config?.scheduling
      ?? (config?.blocking === false ? 'start-and-continue' : 'await-before-next'),
    errorPolicy: config?.errorPolicy
      ?? (config?.blocking === true ? 'fatal' : 'collect'),
    once: config?.once ?? false,
    debounce: config?.debounce,
    throttle: config?.throttle,
    replaceExisting: config?.replaceExisting ?? true,
    cleanup: config?.cleanup,
    condition: config?.condition,
    metadata: config?.metadata,
  };
}
export interface HandlerRegistration<T = unknown, R = void> {
  handler: ActionHandler<T, R>;
  config: ResolvedHandlerConfig<T>;
  id: string;
  role?: HandlerRole;
}
export type HandlerExecutionStatus =
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'skipped'
  | 'cancelled';
export interface HandlerExecutionOutcome<R = void> {
  id: string;
  status: HandlerExecutionStatus;
  executed: boolean;
  duration: number | undefined;
  result: R | undefined;
  error: Error | undefined;
  metadata: Record<string, unknown> | undefined;
  terminationRequested?: boolean;
  terminationResult?: R;
}
export interface PipelineControllerState<T = unknown, R = void> {
  payload: T;
  aborted: boolean;
  abortReason: string | undefined;
  jumpToPriority: number | undefined;
  terminated: boolean;
  terminationResult: R | undefined;
  results: R[];
}
export type ExecutionMode = 'sequential' | 'parallel' | 'race';
export interface PipelineContext<T = unknown, R = void> {
  action: string;
  payload: T;
  handlers: HandlerRegistration<T, R>[];
  executedHandlers?: HandlerRegistration<T, R>[];
  handlerOutcomes?: HandlerExecutionOutcome<R>[];
  raceWinnerId?: string;
  raceLoserOutcomes?: HandlerExecutionOutcome<R>[];
  deferOnceCleanup?: boolean;
  claimOnce?(registration: HandlerRegistration<T, R>): boolean;
  signal?: AbortSignal;
  trackHandlerPromise?<V>(promise: Promise<V>): Promise<V>;
  collectedErrors?: HandlerError[];
  aborted: boolean;
  abortReason: string | undefined;
  currentIndex: number;
  jumpToPriority: number | undefined;
  jumpCount?: number;
  maxJumps?: number;
  executionMode: ExecutionMode;
  results: R[];
  terminated: boolean;
  terminationResult: R | undefined;
}
export interface ActionRegisterConfig {
  name?: string;
  registry?: {
    debug?: boolean;
    autoCleanup?: boolean;
    defaultExecutionMode?: ExecutionMode;
    useConcurrencyQueue?: boolean;
    maxHandlersPerAction?: number;
    maxJumps?: number;
    errorHandler?: (error: Error, context: unknown) => void | Promise<void>;
    schema?: Record<string, ActionSchemaLike>;
    validateOnDispatch?: boolean;
    validationMode?: 'strict' | 'warn' | 'silent';
  };
}
export interface DispatchOptions {
  trace?: {
    transactionId?: string;
    origin?: 'user' | 'system' | 'network' | 'undo' | 'redo' | 'reset';
    label?: string;
  };
  debounce?: number;
  throttle?: number;
  executionMode?: ExecutionMode;
  signal?: AbortSignal;
  immediate?: boolean;
  queuePriority?: number;
  timeout?: number;
  retryOnError?: {
    maxAttempts: number;
    delay: number;
    attemptBarrier?: 'abort-and-drain' | 'abort-and-overlap';
  };
  autoAbort?: {
    enabled: boolean;
    onControllerCreated?: (controller: AbortController) => void;
    allowHandlerAbort?: boolean;
  };
  filter?: {
    handlerIds?: string[];
    excludeHandlerIds?: string[];
    priority?: {
      min?: number;
      max?: number;
    };
    custom?: (config: Readonly<ResolvedHandlerConfig>) => boolean;
  };
  result?: {
    strategy?: 'first' | 'last' | 'all' | 'merge' | 'custom';
    merger?: <R>(results: Array<R | undefined>) => R;
    collect?: boolean;
    maxResults?: number;
    includeErrors?: boolean;
  };
}
export interface ActionDispatchTrace {
  readonly dispatchId: string;
  readonly action: string;
  readonly phase: 'started' | 'settled';
  readonly status?:
    | 'completed'
    | 'completed_with_errors'
    | 'failed'
    | 'cancelled'
    | 'debounced'
    | 'throttled';
  readonly transactionId?: string;
  readonly origin?: 'user' | 'system' | 'network' | 'undo' | 'redo' | 'reset';
  readonly label?: string;
  readonly startedAt: number;
  readonly endedAt?: number;
}
export type ActionDispatchTraceListener = (event: ActionDispatchTrace) => void;
export interface ExecutionResult<R = void> {
  success: boolean;
  aborted: boolean;
  abortReason: string | undefined;
  terminated: boolean;
  outcome: 'completed' | 'completed_with_errors' | 'failed' | 'cancelled' | 'debounced' | 'throttled';
  validation?: {
    passed: boolean;
    errors: string[];
  };
  result: R | R[] | undefined;
  successResults: R[];
  results: Array<R | undefined>;
  failedResults: Array<{
    handlerId: string;
    error: Error;
    expectedType: string;
  }>;
  execution: {
    duration: number;
    admissionDuration: number;
    queueWaitDuration: number;
    pipelineDuration: number;
    retryDelayDuration?: number;
    resultProcessingDuration?: number;
    attempts?: Array<{
      startTime: number;
      endTime: number;
      duration: number;
      outcome: 'succeeded' | 'failed' | 'retried' | 'cancelled';
    }>;
    handlersExecuted: number;
    handlersSkipped: number;
    handlersFailed: number;
    startTime: number;
    endTime: number;
  };
  handlers: Array<{
    id: string;
    executed: boolean;
    status: HandlerExecutionStatus;
    duration: number | undefined;
    result: R | undefined;
    error: Error | undefined;
    metadata: Record<string, unknown> | undefined;
  }>;
  raceDiagnostics?: {
    winnerId?: string;
    winner?: HandlerExecutionOutcome<R>;
    loserSnapshots: Array<HandlerExecutionOutcome<R>>;
    pendingLosersAtReturn: number;
    observedLoserFailures: number;
  };
  errors: HandlerError[];
}
export interface HandlerError {
  handlerId: string;
  error: Error;
  timestamp: number;
  severity: 'blocking' | 'non-blocking';
}
export type UnregisterFunction = () => void;
export type DispatchArgs<P> = [P] extends [void]
  ? [payload?: undefined, options?: DispatchOptions]
  : [payload: P, options?: DispatchOptions];
export type ReservedActionKey =
  | 'then'
  | 'catch'
  | 'finally'
  | 'toJSON'
  | 'constructor'
  | '__proto__'
  | 'prototype';
export type ProxyActionKey<T extends ActionPayloadMap> = Exclude<ActionNames<T>, ReservedActionKey>;
export type ActionDispatcherWithResult<
  T extends ActionPayloadMap,
  TResultMap extends ActionResultMap<T> = {},
> = <
  K extends ActionNames<T>,
  R = ActionResult<TResultMap, K>
>(action: K, ...args: DispatchArgs<T[K]>) => Promise<ExecutionResult<R>>;
export type ActionDispatcher<T extends ActionPayloadMap> = <K extends ActionNames<T>>(
  action: K,
  ...args: DispatchArgs<T[K]>
) => Promise<void>;
export interface ActionRegistryInfo<T extends ActionPayloadMap> {
  name: string;
  totalActions: number;
  totalHandlers: number;
  registeredActions: Array<keyof T>;
  actionExecutionModes: Map<keyof T, ExecutionMode>;
  defaultExecutionMode: ExecutionMode;
}
export interface ActionHandlerStats<T extends ActionPayloadMap> {
  action: keyof T;
  handlerCount: number;
  totalHandlers: number;
  lastRegistered?: Date;
  handlersByPriority: Array<{
    priority: number;
    handlers: Array<{
      id: string;
    }>;
  }>;
  executionStats?: undefined;
}
```

## Implementation Code

### action-guard.ts

```typescript
type TimerHandle = ReturnType<typeof setTimeout>;
interface GuardState {
  lastThrottleExecutedAt: number;
  lastDebounceSettledAt: number;
  debounceTimer: TimerHandle | undefined;
  throttleTimer: TimerHandle | undefined;
  isThrottled: boolean;
  debounceResolve: ((value: boolean) => void) | undefined;
  debounceAbortCleanup: (() => void) | undefined;
  debounceRequestId: number;
}
function validateDelay(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative finite number.`);
  }
}
export class ActionGuard {
  private guards = new Map<string, GuardState>();
  private cleanupInterval: ReturnType<typeof setInterval> | undefined;
  private readonly autoCleanupEnabled: boolean;
  private readonly maxIdleTime: number = 60000; 
  private readonly cleanupIntervalMs: number = 30000; 
  constructor(autoCleanup: boolean = true) {
    this.autoCleanupEnabled = autoCleanup;
  }
  private ensureAutoCleanup(): void {
    if (this.autoCleanupEnabled && !this.cleanupInterval) {
      this.startAutoCleanup();
    }
  }
  private startAutoCleanup(): void {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.cleanupIntervalMs);
    (this.cleanupInterval as { unref?: () => void }).unref?.();
  }
  private stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
  private performCleanup(): void {
    if (this.guards.size === 0) {
      this.stopAutoCleanup();
      return;
    }
    const now = Date.now();
    for (const [key, state] of this.guards) {
      const isIdle = now - Math.max(
        state.lastThrottleExecutedAt,
        state.lastDebounceSettledAt,
      ) > this.maxIdleTime;
      const hasActiveTimers = state.debounceTimer || state.throttleTimer;
      if (isIdle && !hasActiveTimers) {
        this.guards.delete(key);
      }
    }
    if (this.guards.size === 0) {
      this.stopAutoCleanup();
    }
  }
  async debounce(
    actionKey: string,
    debounceMs: number,
    signal?: AbortSignal,
  ): Promise<boolean> {
    validateDelay(debounceMs, 'debounce');
    this.ensureAutoCleanup();
    if (signal?.aborted) return false;
    let state = this.guards.get(actionKey);
    if (!state) {
      state = {
        lastThrottleExecutedAt: 0,
        lastDebounceSettledAt: 0,
        isThrottled: false,
        debounceTimer: undefined,
        throttleTimer: undefined,
        debounceResolve: undefined as ((value: boolean) => void) | undefined,
        debounceAbortCleanup: undefined,
        debounceRequestId: 0,
      };
      this.guards.set(actionKey, state);
    }
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
      if (state.debounceResolve) {
        state.debounceResolve(false);
        state.debounceResolve = undefined as ((value: boolean) => void) | undefined;
      }
      state.debounceAbortCleanup?.();
      state.debounceAbortCleanup = undefined;
    }
    const requestId = ++state.debounceRequestId;
    return new Promise<boolean>((resolve) => {
      let settled = false;
      let abortCleanup: (() => void) | undefined;
      const finish = (allowed: boolean) => {
        if (settled) return;
        settled = true;
        if (state!.debounceRequestId === requestId) {
          if (state!.debounceTimer) clearTimeout(state!.debounceTimer);
          state!.debounceTimer = undefined;
          state!.debounceResolve = undefined;
          state!.debounceAbortCleanup = undefined;
          if (allowed) state!.lastDebounceSettledAt = Date.now();
        }
        abortCleanup?.();
        resolve(allowed);
      };
      state!.debounceResolve = finish;
      state!.debounceTimer = setTimeout(() => finish(true), debounceMs);
      if (signal) {
        const abort = () => finish(false);
        signal.addEventListener('abort', abort, { once: true });
        abortCleanup = () => signal.removeEventListener('abort', abort);
        state!.debounceAbortCleanup = abortCleanup;
      }
    });
  }
  throttle(actionKey: string, throttleMs: number, signal?: AbortSignal): boolean {
    validateDelay(throttleMs, 'throttle');
    this.ensureAutoCleanup();
    if (signal?.aborted) return false;
    let state = this.guards.get(actionKey);
    if (!state) {
      state = {
        lastThrottleExecutedAt: 0,
        lastDebounceSettledAt: 0,
        isThrottled: false,
        debounceTimer: undefined,
        throttleTimer: undefined,
        debounceResolve: undefined as ((value: boolean) => void) | undefined,
        debounceAbortCleanup: undefined,
        debounceRequestId: 0,
      };
      this.guards.set(actionKey, state);
    }
    const now = Date.now();
    const timeSinceLastExecution = now - state.lastThrottleExecutedAt;
    if (timeSinceLastExecution >= throttleMs) {
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
        state.throttleTimer = undefined;
      }
      state.lastThrottleExecutedAt = now;
      state.isThrottled = false;
      return true;
    }
    if (state.isThrottled) {
      return false;
    }
    state.isThrottled = true;
    const remainingTime = throttleMs - timeSinceLastExecution;
    state.throttleTimer = setTimeout(() => {
      state!.isThrottled = false;
      state!.throttleTimer = undefined;
    }, remainingTime);
    return false;
  }
  clearGuards(actionKey: string): void {
    const state = this.guards.get(actionKey);
    if (state) {
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
        if (state.debounceResolve) {
          state.debounceResolve(false);
          state.debounceResolve = undefined;
        }
        state.debounceTimer = undefined;
      }
      state.debounceAbortCleanup?.();
      state.debounceAbortCleanup = undefined;
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
        state.throttleTimer = undefined;
      }
      this.guards.delete(actionKey);
      if (this.guards.size === 0) {
        this.stopAutoCleanup();
      }
    }
  }
  clearAll(): void {
    this.guards.forEach((state) => {
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
        if (state.debounceResolve) {
          state.debounceResolve(false);
        }
      }
      state.debounceAbortCleanup?.();
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
      }
    });
    this.guards.clear();
    this.stopAutoCleanup();
  }
  getGuardState(actionKey: string): GuardState | undefined {
    return this.guards.get(actionKey);
  }
  getAllGuardStates(): Map<string, GuardState> {
    return new Map(this.guards);
  }
  destroy(): void {
    this.clearAll();
  }
  getStats(): { activeGuards: number; withTimers: number } {
    let withTimers = 0;
    this.guards.forEach(state => {
      if (state.debounceTimer || state.throttleTimer) {
        withTimers++;
      }
    });
    return {
      activeGuards: this.guards.size,
      withTimers
    };
  }
}
```

### ActionRegister.ts

```typescript
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
type DispatchPlan = {
  pipelineSnapshot: readonly HandlerRegistration<any, any>[];
  eligibleHandlers: readonly HandlerRegistration<any, any>[];
  guards: readonly HandlerRegistration<any, any>[];
  results: readonly HandlerRegistration<any, any>[];
  observers: readonly HandlerRegistration<any, any>[];
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
export class ActionRegister<
  T extends ActionPayloadMap = Record<string, unknown>,
  TResultMap extends ActionResultMap<T> = {},
> {
  private pipelines = new Map<keyof T, Array<HandlerRegistration<any, any>>>();
  private readonly observerHandlers = new Map<
    HandlerRegistration<any, any>,
    { handler: ActionObserverHandler<any, any>; when: 'success' | 'failure' | 'always' }
  >();
  private readonly claimedOnceHandlers = new WeakSet<HandlerRegistration<any, any>>();
  private readonly actionGuard: ActionGuard;
  private executionMode: ExecutionMode = 'sequential';
  private actionExecutionModes = new Map<keyof T, ExecutionMode>();
  private unregisterFunctions = new Map<keyof T, Map<string, UnregisterFunction>>();
  private lastRegisteredTimestamps = new Map<keyof T, Date>();
  public readonly name: string;
  private readonly registryConfig: ActionRegisterConfig['registry'];
  private readonly isDebugMode: boolean;
  private readonly maxHandlersPerAction: number;
  private readonly maxJumps: number;
  private dispatchQueue?: OperationQueue;
  private handlerIdCounter = 0;
  private lifecycleState: 'active' | 'closing' | 'destroyed' = 'active';
  private readonly lifecycleController = new AbortController();
  private readonly activeDispatches = new Set<Promise<unknown>>();
  private readonly activeHandlerPromises = new Set<Promise<unknown>>();
  private destroyAsyncPromise: Promise<void> | undefined;
  private dispatchConstructionDepth = 0;
  private dispatchTraceSequence = 0;
  private readonly dispatchTraceListeners = new Set<ActionDispatchTraceListener>();
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
    this.actionGuard = new ActionGuard(this.registryConfig?.autoCleanup !== false);
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
  get actions(): {
    [K in ProxyActionKey<T>]: (...args: DispatchArgs<T[K]>) => Promise<void>
  } {
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
  get actionsWithResult(): {
    [K in ProxyActionKey<T>]: (...args: DispatchArgs<T[K]>) => Promise<ExecutionResult<ActionResult<TResultMap, K>>>
  } {
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
  registerGuard<K extends ActionNames<T>>(
    action: K,
    handler: ActionGuardHandler<T[K]>,
    config: GuardConfig<T[K]> = {},
  ): UnregisterFunction {
    return this.registerWithRole(action, handler as ActionHandler<T[K], void>, {
      ...config,
      scheduling: 'await-before-next',
      errorPolicy: 'fatal',
    }, 'guard');
  }
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
  private log(message: string, data?: unknown, level: 'log' | 'warn' | 'error' = 'log') {
    if (this.isDebugMode) {
      const timestamp = new Date().toISOString();
      console[level](`🎯 [${timestamp}] [${this.name}] ${message}`, data || '');
    }
  }
  private beginDispatchTrace(action: string, options?: DispatchOptions): {
    dispatchId: string;
    startedAt: number;
    settle: (status: ActionDispatchTrace['status']) => void;
  } {
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
    trace: ReturnType<ActionRegister<T, TResultMap>['beginDispatchTrace']>,
    status: (result: R) => ActionDispatchTrace['status'],
  ): Promise<R> {
    return promise.then(
      result => { trace.settle(status(result)); return result; },
      error => { trace.settle('failed'); throw error; },
    );
  }
  subscribeDispatchTrace(listener: ActionDispatchTraceListener): UnregisterFunction {
    if (typeof listener !== 'function') {
      throw new TypeError('Dispatch trace listener must be a function.');
    }
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
    const rejected = Promise.reject<R>(error);
    void rejected.catch(() => {});
    return rejected;
  }
  private generateHandlerId<K extends keyof T>(action: K): string {
    return `${String(action)}_${this.name}_${++this.handlerIdCounter}`;
  }
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
  private _performRegistrationSync<K extends keyof T, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig<T[K]>,
    handlerId: string,
    role: HandlerRole = 'legacy',
  ): UnregisterFunction {
    validateTimingConfig(config as HandlerConfig<unknown>);
    const registration: HandlerRegistration<T[K], R> = {
      handler,
      config: resolveHandlerConfig(config, handlerId),
      id: handlerId,
      role,
    };
    if (!this.pipelines.has(action)) {
      this.pipelines.set(action, []);
    }
    const pipeline = this.pipelines.get(action)!;
    const actionUnregisterFunctions = this.getUnregisterFunctions(action);
    const existingIndex = pipeline.findIndex(reg => reg.id === handlerId);
    if (existingIndex === -1 && pipeline.length >= this.maxHandlersPerAction) {
      throw new RangeError(
        `Handler limit (${this.maxHandlersPerAction}) reached for action "${String(action)}".`,
      );
    }
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
        this.removeRegistration(action, existing, false);
        let currentPipeline = this.pipelines.get(action);
        if (!currentPipeline) {
          currentPipeline = [];
          this.pipelines.set(action, currentPipeline);
        }
        currentPipeline.push(registration);
        currentPipeline.sort((a, b) => b.config.priority - a.config.priority);
        this.lastRegisteredTimestamps.set(action, new Date());
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
    pipeline.push(registration);
    pipeline.sort((a, b) => b.config.priority - a.config.priority);
    this.lastRegisteredTimestamps.set(action, new Date());
    const unregister = this.createUnregisterFunction(action, handlerId, registration);
    actionUnregisterFunctions.set(handlerId, unregister);
    this.log(`Handler registered: ${String(action)}`, {
      handlerId,
      priority: config.priority,
      totalHandlers: pipeline.length
    });
    return unregister;
  }
  dispatch<K extends ActionNames<T>>(action: K, ...args: DispatchArgs<T[K]>): Promise<void>;
  dispatch<K extends ActionNames<T>>(action: K, ...args: DispatchArgs<T[K]>): Promise<void> {
    this.assertStringActionKey(action);
    const [payload, options] = args as [T[K] | undefined, DispatchOptions | undefined];
    validateDispatchTimingOptions(options);
    const trace = this.beginDispatchTrace(String(action), options);
    if (this.lifecycleState !== 'active') {
      return this.withDispatchTrace(this.rejectedLifecyclePromise<void>(), trace, () => 'failed');
    }
    const timeoutScope = this.createTimeoutScope(action, options);
    const dispatchHandlerPromises: DispatchHandlerPromises = new Set();
    const attemptState = { count: 0 };
    let plan: DispatchPlan;
    try {
      plan = this.resolveDispatchPlan(action, options);
    } catch (error) {
      timeoutScope.cleanup();
      timeoutScope.cleanupSignals();
      trace.settle('failed');
      throw error;
    }
    const hasTimingGuard = plan.debounceMs !== undefined || plan.throttleMs !== undefined;
    const notifiedObservers = new Set<HandlerRegistration<any, any>>();
    const notifiedObserverOutcomes = new Set<ActionObserverEvent<T[K], unknown>['outcome']>();
    let dispatchTraceStatus: ActionDispatchTrace['status'] = 'completed';
    let terminalErrorReported = false;
    const reportTerminalError = (error: unknown) => {
      if (terminalErrorReported) return;
      terminalErrorReported = true;
      this.invokeErrorHandler(error, action, payload, options, attemptState.count);
    };
    const notifyObservers = async (event: ActionObserverEvent<T[K], unknown>) => {
      if (notifiedObserverOutcomes.has(event.outcome)) return;
      notifiedObserverOutcomes.add(event.outcome);
      if (event.outcome === 'completed_with_errors') dispatchTraceStatus = 'completed_with_errors';
      else if (event.outcome === 'failed') dispatchTraceStatus = 'failed';
      else if (event.outcome === 'cancelled') dispatchTraceStatus = 'cancelled';
      else if (event.outcome === 'debounced') dispatchTraceStatus = 'debounced';
      else if (event.outcome === 'throttled') dispatchTraceStatus = 'throttled';
      await this.executeObservers(action, plan, event, notifiedObservers);
    };
    const pipelineOperation = async () => {
      const guard = plan.guards.length > 0
        ? await this.executeGuardPhase(
          action, payload as T[K], timeoutScope.options, plan, dispatchHandlerPromises,
        )
        : {
          allowed: true, payload: payload as T[K], aborted: false,
          abortReason: undefined, error: undefined, errors: [], outcomes: [], executedHandlers: [], duration: 0,
        };
      this.cleanupOneTimeHandlers(action, guard.executedHandlers, dispatchHandlerPromises);
      if (!guard.allowed) {
        await notifyObservers({
          action: String(action),
          payload: guard.payload,
          outcome: guard.aborted ? 'cancelled' : 'failed',
          result: undefined,
          errors: guard.errors,
          signal: timeoutScope.options?.signal,
        });
        if (!guard.aborted && guard.errors.length > 0) {
          throw guard.error
            ?? guard.errors[0]?.error
            ?? new Error(`Guard phase failed for "${String(action)}"`);
        }
        return;
      }
      const execution = await this.executeWithRetry(async attemptSignal => {
        const executedHandlers: HandlerRegistration<any, any>[] = [];
        try {
          return await this._performDispatchWithResult<K, void>(
            action,
            guard.payload,
            this.withAttemptSignal(timeoutScope.options, attemptSignal),
            undefined,
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
      }, timeoutScope.options, attemptState, result => result.outcome === 'failed', () => (
        this.getAttemptHandlers(action, plan).length > 0
      ), undefined, this.shouldDrainBeforeRetry(plan, timeoutScope.options)
        ? () => this.drainAttemptHandlers(dispatchHandlerPromises)
        : undefined);
      if (timeoutScope.options?.signal?.aborted) {
        if (timeoutScope.options.signal.reason instanceof ActionTimeoutError) {
          throw timeoutScope.options.signal.reason;
        }
        await notifyObservers({
          action: String(action),
          payload: guard.payload,
          outcome: 'cancelled',
          result: undefined,
          errors: execution.errors,
          signal: timeoutScope.options.signal,
        });
        return;
      }
      if (execution.outcome === 'failed') {
        throw execution.errors[execution.errors.length - 1]?.error
          ?? new Error(`Action "${String(action)}" failed`);
      }
      const result = this.processResults<unknown>(
        execution.results as unknown[],
        execution.terminated,
        execution.terminated ? execution.result : undefined,
        options?.result,
      );
      await notifyObservers({
        action: String(action),
        payload: guard.payload,
        outcome: execution.outcome,
        result,
        errors: execution.errors,
        signal: timeoutScope.options?.signal,
      });
    };
    const operation = async () => {
      if (timeoutScope.options?.signal?.aborted) {
        await notifyObservers({ action: String(action), payload: payload as T[K], outcome: 'cancelled',
          result: undefined, errors: [], signal: timeoutScope.options?.signal });
        return;
      }
      this.validatePayload(action, payload);
      this.validateResultOptions(options?.result);
      if (timeoutScope.options?.signal?.aborted) {
        await notifyObservers({ action: String(action), payload: payload as T[K], outcome: 'cancelled',
          result: undefined, errors: [], signal: timeoutScope.options?.signal });
        return;
      }
      if (hasTimingGuard) {
        const admission = await this.evaluateTimingGuards(
          String(action),
          plan,
          timeoutScope.options?.signal,
        );
        if (admission.aborted || timeoutScope.options?.signal?.aborted || admission.reason) {
          await notifyObservers({
            action: String(action), payload: payload as T[K],
            outcome: admission.aborted || timeoutScope.options?.signal?.aborted
              ? 'cancelled'
              : admission.reason === 'Debounced execution' ? 'debounced' : 'throttled',
            result: undefined, errors: admission.reason ? [{
              handlerId: 'admission', error: new Error(admission.reason),
              timestamp: Date.now(), severity: 'blocking',
            }] : [],
            signal: timeoutScope.options?.signal,
          });
          return;
        }
      }
      if (timeoutScope.options?.signal?.aborted) {
        await notifyObservers({ action: String(action), payload: payload as T[K], outcome: 'cancelled',
          result: undefined, errors: [], signal: timeoutScope.options?.signal });
        return;
      }
      if (timeoutScope.options?.immediate || !this.dispatchQueue) {
        return pipelineOperation();
      }
      const queued = this.dispatchQueue.enqueueWithHandle(
        pipelineOperation,
        timeoutScope.options?.queuePriority ?? 0
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
      const queuedPromise = queued.promise.then(
        value => { cleanupCallerAbortListener(); return value; },
        error => { cleanupCallerAbortListener(); throw error; },
      );
      return queuedPromise.catch(async error => {
        const callerCancelled = (
          this.lifecycleState === 'active'
          && callerSignal?.aborted === true
          && !(timeoutScope.options?.signal?.reason instanceof ActionTimeoutError)
        );
        if (!callerCancelled) throw error;
        await notifyObservers({
          action: String(action),
          payload: payload as T[K],
          outcome: 'cancelled',
          result: undefined,
          errors: [],
          signal: timeoutScope.options?.signal,
        });
      });
    };
    let dispatchPromise: Promise<void>;
    let observedDispatchPromise: Promise<void>;
    this.dispatchConstructionDepth += 1;
    try {
      dispatchPromise = operation();
      observedDispatchPromise = dispatchPromise.catch(async error => {
        reportTerminalError(error);
        await notifyObservers({
          action: String(action), payload: payload as T[K], outcome: 'failed', result: undefined,
          errors: [{ handlerId: 'dispatch', error: error instanceof Error ? error : new Error(String(error)),
            timestamp: Date.now(), severity: 'blocking' }], signal: timeoutScope.options?.signal,
        });
        throw error;
      });
      this.trackDispatchPromise(observedDispatchPromise);
    } finally {
      this.dispatchConstructionDepth -= 1;
    }
    const exposedPromise = this.raceWithTimeout(
      observedDispatchPromise!,
      timeoutScope,
      dispatchHandlerPromises
    );
    const observedPromise = exposedPromise.catch(async error => {
      reportTerminalError(error);
      const observerNotification = this.trackGlobalHandlerPromise(notifyObservers({
        action: String(action), payload: payload as T[K], outcome: 'failed', result: undefined,
        errors: [{ handlerId: 'dispatch', error: error instanceof Error ? error : new Error(String(error)),
          timestamp: Date.now(), severity: 'blocking' }], signal: timeoutScope.options?.signal,
      }));
      void observerNotification.catch(observerError => {
        this.log(`Failure observer delivery failed for ${String(action)}`, observerError, 'warn');
      });
      throw error;
    });
    const tracedPromise = this.withDispatchTrace(observedPromise, trace, () => dispatchTraceStatus);
    void tracedPromise.catch(() => {});
    return tracedPromise;
  }
  private async executeWithRetry<R>(
    operation: (attemptSignal: AbortSignal) => Promise<R>,
    options: DispatchOptions | undefined,
    attemptState: { count: number },
    shouldRetryResult?: (result: R) => boolean,
    canRetry: () => boolean = () => true,
    telemetry?: RetryTelemetry,
    beforeRetry?: () => Promise<void>,
  ): Promise<R> {
    const configuredAttempts = options?.retryOnError?.maxAttempts ?? 1;
    const maxAttempts = configuredAttempts;
    const retryDelay = options?.retryOnError?.delay ?? 0;
    while (attemptState.count < maxAttempts) {
      attemptState.count += 1;
      const attemptStartedAt = Date.now();
      const attemptController = new AbortController();
      try {
        const result = await operation(attemptController.signal);
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
          outcome: shouldRetry
            ? (canRetryAttempt ? 'retried' : 'failed')
            : 'succeeded',
        });
        if (telemetry) telemetry.pipelineDuration += attemptEndedAt - attemptStartedAt;
        if (!canRetryAttempt) {
          return result;
        }
        attemptController.abort(new ActionAttemptSupersededError(attemptState.count));
        await beforeRetry?.();
        const retryStartedAt = Date.now();
        const shouldContinue = await this.waitForRetry(retryDelay, options?.signal);
        if (telemetry) telemetry.retryDelayDuration += Date.now() - retryStartedAt;
        if (!shouldContinue) {
          telemetry?.attempts.push({
            startTime: Date.now(), endTime: Date.now(), duration: 0, outcome: 'cancelled',
          });
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
        if (!canRetryAttempt) {
          throw error;
        }
        attemptController.abort(new ActionAttemptSupersededError(attemptState.count));
        await beforeRetry?.();
        const retryStartedAt = Date.now();
        const shouldContinue = await this.waitForRetry(retryDelay, options?.signal);
        if (telemetry) telemetry.retryDelayDuration += Date.now() - retryStartedAt;
        if (!shouldContinue) throw error;
      }
    }
    const terminalAttempt = new AbortController();
    return operation(terminalAttempt.signal);
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
    attemptSignal: AbortSignal,
  ): AttemptDispatchOptions {
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
  private async drainAttemptHandlers(
    dispatchHandlerPromises: DispatchHandlerPromises,
  ): Promise<void> {
    const pending = [...dispatchHandlerPromises];
    if (pending.length > 0) await Promise.allSettled(pending);
  }
  private trackGlobalHandlerPromise<R>(promise: Promise<R>): Promise<R> {
    this.activeHandlerPromises.add(promise);
    const remove = () => this.activeHandlerPromises.delete(promise);
    void promise.then(remove, remove);
    return promise;
  }
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
    void Promise.allSettled(handlersStillRunning).then(cleanup);
  }
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
    const handlers = skippedRegistrations.map(registration => ({
      id: registration.id,
      status: 'skipped' as const,
      executed: false,
      duration: 0,
      result: undefined,
      error: undefined,
      metadata: registration.config.metadata ? { ...registration.config.metadata } : undefined,
    }));
    return {
      success: false,
      aborted: true,
      abortReason,
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
        handlersSkipped: handlers.length,
        handlersFailed: 0,
        startTime,
        endTime,
      },
      handlers,
      errors: [],
    };
  }
  private resolveDispatchPlan<K extends keyof T>(
    action: K,
    options?: DispatchOptions,
  ): DispatchPlan {
    const pipelineSnapshot = [...(this.pipelines.get(action) ?? [])];
    const guards = pipelineSnapshot.filter(handler => handler.role === 'guard');
    const filterableHandlers = pipelineSnapshot.filter(handler => handler.role !== 'guard');
    const filteredHandlers = options?.filter
      ? this.filterHandlers(filterableHandlers, options.filter)
      : filterableHandlers;
    const eligibleHandlers = [...guards, ...filteredHandlers];
    const admissionHandlers = eligibleHandlers.filter(handler => handler.role !== 'observer');
    const debounceMs = options?.debounce
      ?? admissionHandlers.find(handler => handler.config.debounce !== undefined)?.config.debounce;
    const throttleMs = options?.throttle
      ?? admissionHandlers.find(handler => handler.config.throttle !== undefined)?.config.throttle;
    return {
      pipelineSnapshot,
      eligibleHandlers,
      guards,
      results: filteredHandlers.filter(handler => handler.role !== 'observer'),
      observers: filteredHandlers.filter(handler => handler.role === 'observer'),
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
  private getAttemptHandlers<K extends keyof T>(
    action: K,
    plan: DispatchPlan,
  ): HandlerRegistration<any, any>[] {
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
      const detachedOnce = registration.config.once
        && this.removeRegistration(action, registration, false);
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
      await executeSequential(context, (registration, _index) => {
        const controller = this.createController(
          context,
          autoAbortController,
          options?.autoAbort,
          undefined,
          false,
        );
        return {
          signal: controller.signal,
          getPayload: controller.getPayload,
          modifyPayload: controller.modifyPayload,
          abort: controller.abort,
        } as PipelineController<T[K], unknown>;
      });
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
    const handlers = selectedHandlers.map(registration => {
      const outcome = outcomeById.get(registration.id);
      return outcome ? { ...snapshotHandlerOutcome(outcome), result: undefined } : {
        id: registration.id, status: 'skipped' as const, executed: false,
        duration: 0, result: undefined, error: undefined,
        metadata: registration.config.metadata ? { ...registration.config.metadata } : undefined,
      };
    });
    return {
      success: false,
      aborted: guard.aborted,
      abortReason: guard.abortReason ?? guard.error?.message,
      terminated: false,
      outcome: guard.aborted ? 'cancelled' : 'failed',
      validation,
      result: undefined,
      successResults: [],
      results: [],
      failedResults: guard.errors.map(error => ({
        handlerId: error.handlerId, error: error.error, expectedType: 'unknown',
      })),
      execution: {
        duration: endTime - startTime, admissionDuration: 0, queueWaitDuration: 0,
        pipelineDuration: endTime - startTime,
        handlersExecuted: handlers.filter(handler => handler.executed).length,
        handlersSkipped: handlers.filter(handler => !handler.executed).length,
        handlersFailed: handlers.filter(handler => handler.status === 'failed').length,
        startTime, endTime,
      },
      handlers,
      errors: guard.errors,
    };
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
    validateDispatchTimingOptions(options);
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
      trace.settle('failed');
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
      if (timeoutScope.options?.signal?.aborted) {
        if (timeoutScope.options.signal.reason instanceof ActionTimeoutError) {
          throw timeoutScope.options.signal.reason;
        }
        return {
          ...rawExecution,
          success: false,
          aborted: true,
          abortReason: typeof timeoutScope.options.signal.reason === 'string'
            ? timeoutScope.options.signal.reason
            : 'Action dispatch aborted by signal',
          outcome: 'cancelled' as const,
        };
      }
      const executionWithGuards: ExecutionResult<R> = {
        ...rawExecution,
        handlers: [
          ...guard.outcomes.map(outcome => ({ ...outcome, result: undefined })),
          ...rawExecution.handlers,
        ] as ExecutionResult<R>['handlers'],
        execution: {
          ...rawExecution.execution,
          handlersExecuted: guard.outcomes.filter(outcome => outcome.executed).length
            + rawExecution.execution.handlersExecuted,
          handlersSkipped: guard.outcomes.filter(outcome => !outcome.executed).length
            + rawExecution.execution.handlersSkipped,
          handlersFailed: guard.outcomes.filter(outcome => outcome.status === 'failed').length
            + rawExecution.execution.handlersFailed,
        },
      };
      const resultProcessingStartedAt = Date.now();
      const result = this.processResults(
        executionWithGuards.results,
        executionWithGuards.terminated,
        executionWithGuards.terminated ? executionWithGuards.result : undefined,
        options?.result,
      );
      const resultProcessingDuration = Date.now() - resultProcessingStartedAt;
      const completed = {
        ...executionWithGuards,
        result,
        execution: {
          ...executionWithGuards.execution,
          pipelineDuration: guard.duration + retryTelemetry.pipelineDuration,
          retryDelayDuration: retryTelemetry.retryDelayDuration,
          resultProcessingDuration,
          attempts: retryTelemetry.attempts,
        },
      };
      return completed;
    };
    const operation = async () => {
      if (timeoutScope.options?.signal?.aborted) {
        admissionEndedAt = Date.now();
        return this.createAbortedExecutionResult<R>(
          dispatchStartTime,
          [...plan.guards, ...plan.results],
          undefined,
          getAbortReason(timeoutScope.options?.signal),
        );
      }
      validation = this.validatePayload(action, payload);
      if (timeoutScope.options?.signal?.aborted) {
        admissionEndedAt = Date.now();
        return this.createAbortedExecutionResult<R>(
          dispatchStartTime,
          [...plan.guards, ...plan.results],
          validation,
          getAbortReason(timeoutScope.options?.signal),
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
            [...plan.guards, ...plan.results],
            validation,
            getAbortReason(timeoutScope.options?.signal),
          );
        }
        if (admission.reason) {
          admissionEndedAt = Date.now();
          return this.createTimingGuardResult<R>(
            admission.reason,
            dispatchStartTime,
            [...plan.guards, ...plan.results],
            validation,
          );
        }
      }
      if (timeoutScope.options?.signal?.aborted) {
        admissionEndedAt = Date.now();
        return this.createAbortedExecutionResult<R>(
          dispatchStartTime,
          [...plan.guards, ...plan.results],
          validation,
          getAbortReason(timeoutScope.options?.signal),
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
      const queuedPromise = queued.promise.then(
        value => { cleanupCallerAbortListener(); return value; },
        error => { cleanupCallerAbortListener(); throw error; },
      );
      return queuedPromise.catch(error => {
        const callerCancelled = (
          this.lifecycleState === 'active'
          && callerSignal?.aborted === true
          && !(timeoutScope.options?.signal?.reason instanceof ActionTimeoutError)
        );
        if (!callerCancelled) throw error;
        return this.createAbortedExecutionResult<R>(
          dispatchStartTime,
          [...plan.guards, ...plan.results],
          validation,
          getAbortReason(timeoutScope.options?.signal),
        );
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
    let dispatchPromise: Promise<ExecutionResult<R>>;
    let observedDispatchPromise: Promise<ExecutionResult<R>>;
    this.dispatchConstructionDepth += 1;
    try {
      dispatchPromise = operation();
      observedDispatchPromise = dispatchPromise.then(async result => {
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
          reportTerminalError(terminalError);
        }
        await notifyObservers({
          action: String(action), payload: observerPayload,
          outcome: completedResult.outcome, result: completedResult.result,
          errors: completedResult.errors, signal: timeoutScope.options?.signal,
        });
        return completedResult;
      }, async error => {
        reportTerminalError(error);
        await notifyObservers({
          action: String(action), payload: observerPayload, outcome: 'failed', result: undefined,
          errors: [{
            handlerId: 'dispatch',
            error: error instanceof Error ? error : new Error(String(error)),
            timestamp: Date.now(), severity: 'blocking',
          }],
          signal: timeoutScope.options?.signal,
        });
        throw error;
      });
      this.trackDispatchPromise(observedDispatchPromise);
    } finally {
      this.dispatchConstructionDepth -= 1;
    }
    const exposedPromise = this.raceWithTimeout(
      observedDispatchPromise!,
      timeoutScope,
      dispatchHandlerPromises
    );
    const observedPromise = exposedPromise.catch(async error => {
      reportTerminalError(error);
      const observerNotification = this.trackGlobalHandlerPromise(notifyObservers({
        action: String(action), payload: observerPayload, outcome: 'failed', result: undefined,
        errors: [{
          handlerId: 'dispatch',
          error: error instanceof Error ? error : new Error(String(error)),
          timestamp: Date.now(), severity: 'blocking',
        }],
        signal: timeoutScope.options?.signal,
      }));
      void observerNotification.catch(observerError => {
        this.log(`Failure observer delivery failed for ${String(action)}`, observerError, 'warn');
      });
      throw error;
    });
    const tracedPromise = this.withDispatchTrace(observedPromise, trace, result => {
      switch (result.outcome) {
        case 'completed':
          return 'completed';
        case 'completed_with_errors':
          return 'completed_with_errors';
        case 'cancelled':
          return 'cancelled';
        case 'debounced':
          return 'debounced';
        case 'throttled':
          return 'throttled';
        default:
          return 'failed';
      }
    });
    void tracedPromise.catch(() => {});
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
      const warningMessage = `⚠️ Action '${String(action)}' has no registered handlers. This action will be ignored.`;
      if (this.isDebugMode) {
        console.warn(warningMessage);
        console.warn('💡 Tip: Register a handler using registry.register() before dispatching this action.');
        console.warn('📋 Available actions:', Array.from(this.pipelines.keys()));
      }
      this.log(`No handlers found for action '${String(action)}', dispatch cancelled`, {}, 'warn');
      cleanupDispatchSignals();
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
      results: [],
      terminated: false,
      terminationResult: undefined as R | undefined,
    };
    let executionError: Error | undefined;
    const abortHandler = effectiveSignal ? () => {
      context.aborted = true;
      context.abortReason = typeof effectiveSignal.reason === 'string'
        ? effectiveSignal.reason
        : 'Action dispatch aborted by signal';
    } : undefined;
    if (effectiveSignal && abortHandler) {
      effectiveSignal.addEventListener('abort', abortHandler, { once: true });
    }
    let errors: HandlerError[] = [];
    try {
      await this.executePipeline(
        context,
        dispatchHandlerPromises,
        autoAbortController,
        options?.autoAbort
      );
      const contextWithErrors = context as PipelineContext<any, any> & { collectedErrors?: HandlerError[] };
      errors = contextWithErrors.collectedErrors || [];
    } catch (error) {
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
    const successResults = context.results.filter((result): result is R => result !== undefined);
    const failedResults = handlerErrors.map(err => ({
      handlerId: err.handlerId,
      error: err.error,
      expectedType: 'unknown'
    }));
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
        handlersFailed: context.executionMode === 'race'
          ? (context.raceWinnerId && outcomesById.get(context.raceWinnerId)?.status === 'failed' ? 1 : 0)
          : handlerResults.filter(handler => handler.status === 'failed').length,
        startTime: _startTime,
        endTime,
      },
      handlers: handlerResults,
      ...(context.executionMode !== 'race' ? {} : {
        raceDiagnostics: {
          ...(context.raceWinnerId === undefined ? {} : { winnerId: context.raceWinnerId }),
          ...(context.raceWinnerId === undefined
            ? {}
            : { winner: snapshotHandlerOutcome(outcomesById.get(context.raceWinnerId)!) }),
          loserSnapshots: (context.raceLoserOutcomes ?? []).map(snapshotHandlerOutcome),
          pendingLosersAtReturn: (context.raceLoserOutcomes ?? [])
            .filter(outcome => outcome.status === 'running').length,
          observedLoserFailures: (context.raceLoserOutcomes ?? [])
            .filter(outcome => outcome.status === 'failed').length,
        },
      }),
      errors: reportedErrors.map(err => ({
        handlerId: err.handlerId,
        error: err.error,
        timestamp: err.timestamp,
        severity: err.severity
      })),
    };
    return executionResult;
  }
  private createController<K extends keyof T>(
    context: PipelineContext<T[K], any>, 
    autoAbortController?: AbortController,
    autoAbortOptions?: { allowHandlerAbort?: boolean },
    isolatedState?: PipelineControllerState<T[K], any>,
    collectResults = true,
  ): PipelineController<T[K], any> {
    const controller = {} as PipelineController<T[K], any>;
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
      if (!collectResults) return;
      const currentResult = state.results[state.results.length - 1];
      const previousResults = state.results.slice(0, -1);
      const mergedResult = merger(previousResults, currentResult);
      if (state.results.length === 0) {
        state.results.push(mergedResult);
      } else {
        state.results[state.results.length - 1] = mergedResult;
      }
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
    const handlerIdSet = filterOptions.handlerIds ? new Set(filterOptions.handlerIds) : null;
    const excludeIdSet = filterOptions.excludeHandlerIds ? new Set(filterOptions.excludeHandlerIds) : null;
    const filtered = handlers.filter(registration => {
      const config = registration.config;
      if (handlerIdSet && !handlerIdSet.has(config.id)) {
        return false;
      }
      if (excludeIdSet?.has(config.id)) {
        return false;
      }
      if (filterOptions.priority) {
        const priority = config.priority;
        if (filterOptions.priority.min !== undefined && priority < filterOptions.priority.min) {
          return false;
        }
        if (filterOptions.priority.max !== undefined && priority > filterOptions.priority.max) {
          return false;
        }
      }
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
    if (terminated) {
      return terminationResult;
    }
    if (!resultOptions) {
      return results.length > 0 ? results[results.length - 1] : undefined;
    }
    if (!resultOptions.collect && !resultOptions.strategy) {
      return undefined;
    }
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
        return limitedResults[limitedResults.length - 1];
      case 'custom':
        if (resultOptions.merger) {
          return resultOptions.merger(limitedResults);
        }
        throw new Error('Custom result strategy requires a merger function');
      default:
        if (resultOptions.collect) {
          return limitedResults;
        }
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
      const controller = this.createController(
        context,
        autoAbortController,
        autoAbortOptions,
        state,
        registration.role !== 'guard' && registration.role !== 'command',
      );
      if (registration.role === 'guard') {
        return {
          signal: controller.signal,
          getPayload: controller.getPayload,
          modifyPayload: controller.modifyPayload,
          abort: controller.abort,
        } as PipelineController<T[K], any>;
      }
      if (registration.role === 'command') {
        return {
          signal: controller.signal,
          getPayload: controller.getPayload,
          abort: controller.abort,
        } as PipelineController<T[K], any>;
      }
      if (registration.role === 'result') {
        return {
          signal: controller.signal,
          getPayload: controller.getPayload,
          abort: controller.abort,
          return: controller.return,
          setResult: controller.setResult,
          getResults: controller.getResults,
          mergeResult: controller.mergeResult,
        } as PipelineController<T[K], any>;
      }
      return controller;
    };
    const originalHandlers = context.handlers;
    const preflightHandlers = originalHandlers.filter(handler => handler.role === 'guard');
    if (preflightHandlers.length > 0) {
      context.handlers = preflightHandlers;
      await executeSequential<T[K], any>(context, createController);
      if (context.aborted || context.terminated) {
        context.handlers = originalHandlers;
        return;
      }
    }
    context.handlers = originalHandlers.filter(handler => (
      !preflightHandlers.includes(handler) && handler.role !== 'observer'
    ));
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
    const oneTimeHandlers = executedHandlers.filter(reg => reg.config.once);
    if (oneTimeHandlers.length === 0) return;
    const handlersStillRunning = [...dispatchHandlerPromises];
    const shouldDeferCleanup = handlersStillRunning.length > 0;
    oneTimeHandlers.forEach(registration => {
      const claimed = this.claimedOnceHandlers.delete(registration);
      const removed = claimed || this.removeRegistration(action, registration, !shouldDeferCleanup);
      if (removed) {
        if (claimed && !shouldDeferCleanup) {
          this.runRegistrationCleanup(action, registration);
        }
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
  getHandlerCount<K extends ActionNames<T>>(action: K): number {
    const pipeline = this.pipelines.get(action);
    return pipeline ? pipeline.length : 0;
  }
  hasHandlers<K extends ActionNames<T>>(action: K): boolean {
    return this.getHandlerCount(action) > 0;
  }
  getRegisteredActions(): (keyof T)[] {
    return Array.from(this.pipelines.keys());
  }
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
    this.actionDispatchers.delete(String(action));
    this.actionResultDispatchers.delete(String(action));
  }
  clearAll(): void {
    [...this.pipelines.keys()].forEach(action => {
      this.clearAction(action as ActionNames<T>);
    });
    this.pipelines.clear();
    this.lastRegisteredTimestamps.clear();
    this.unregisterFunctions.forEach(unregisters => unregisters.clear());
    this.unregisterFunctions.clear();
    this.actionGuard.clearAll();
    this.observerHandlers.clear();
    this.actionDispatchers.clear();
    this.actionResultDispatchers.clear();
  }
  getName(): string {
    return this.name;
  }
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
  getActionStats<K extends ActionNames<T>>(action: K): ActionHandlerStats<T> | null {
    const pipeline = this.pipelines.get(action);
    if (!pipeline) {
      return null;
    }
    const priorityMap = new Map<number, typeof pipeline>();
    pipeline.forEach(handler => {
      if (!priorityMap.has(handler.config.priority)) {
        priorityMap.set(handler.config.priority, []);
      }
      priorityMap.get(handler.config.priority)!.push(handler);
    });
    const handlersByPriority = Array.from(priorityMap.entries())
      .sort(([a], [b]) => b - a) 
      .map(([priority, handlers]) => ({
        priority,
        handlers: handlers.map(h => ({
          id: h.config.id,
        }))
      }));
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
  getAllActionStats(): Array<ActionHandlerStats<T>> {
    return Array.from(this.pipelines.keys())
      .map(action => this.getActionStats(action as ActionNames<T>))
      .filter((stats): stats is ActionHandlerStats<T> => stats !== null);
  }
  setExecutionMode(mode: ExecutionMode): void {
    this.executionMode = mode;
    if (this.isDebugMode) {
      console.log(`🎯 Global execution mode set to: ${mode}`);
    }
  }
  setActionExecutionMode<K extends ActionNames<T>>(action: K, mode: ExecutionMode): void {
    this.actionExecutionModes.set(action, mode);
    if (this.isDebugMode) {
      console.log(`🎯 Execution mode set for action '${String(action)}': ${mode}`);
    }
  }
  getActionExecutionMode<K extends ActionNames<T>>(action: K): ExecutionMode {
    return this.actionExecutionModes.get(action) || this.executionMode;
  }
  removeActionExecutionMode<K extends ActionNames<T>>(action: K): void {
    this.actionExecutionModes.delete(action);
    if (this.isDebugMode) {
      console.log(`🎯 Execution mode reset for action '${String(action)}' to default: ${this.executionMode}`);
    }
  }
  getRegistryConfig(): ActionRegisterConfig['registry'] {
    return this.registryConfig;
  }
  isDebugEnabled(): boolean {
    return this.isDebugMode;
  }
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
  getUnregisterFunctionCount(): number {
    let count = 0;
    this.unregisterFunctions.forEach(unregisters => {
      count += unregisters.size;
    });
    return count;
  }
  hasUnregisterFunction(handlerId: string): boolean {
    for (const unregisters of this.unregisterFunctions.values()) {
      if (unregisters.has(handlerId)) return true;
    }
    return false;
  }
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
    let resolveShutdown!: () => void;
    let rejectShutdown!: (error: unknown) => void;
    this.destroyAsyncPromise = new Promise<void>((resolve, reject) => {
      resolveShutdown = resolve;
      rejectShutdown = reject;
    });
    if (!this.lifecycleController.signal.aborted) {
      this.lifecycleController.abort(shutdownError);
    }
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
      while (this.activeDispatches.size > 0 || this.activeHandlerPromises.size > 0) {
        await Promise.allSettled([
          ...this.activeDispatches,
          ...this.activeHandlerPromises,
        ]);
      }
      this.finalizeDestroy();
    };
    void Promise.resolve()
      .then(drainAndFinalize)
      .then(resolveShutdown, rejectShutdown);
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
  destroy(): void {
    void this.beginShutdown();
  }
  destroyAsync(options: { deferCleanup?: boolean } = {}): Promise<void> {
    return this.beginShutdown(options.deferCleanup ?? false);
  }
}
```

### bridges/react-element/create-react-element-bridge.ts

```typescript
import type * as React from 'react';
import type { ElementBinding, ElementBridgeContract } from '../../element/contracts.js';
import { createElementBinding } from '../../element/create-element-binding.js';
import type { ReactElementComponent } from './types.js';
function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as React.MutableRefObject<T | null>).current = value;
}
export function createReactElementBridge<Props extends object = Record<string, unknown>, Element extends HTMLElement = HTMLElement, Handle = Element>(
  React: typeof import('react'),
  options: ElementBridgeContract<Props, Element, Handle>,
  assignmentErrors: 'ignore' | 'throw' = 'ignore',
): ReactElementComponent<Props, Element, Handle> {
  const useLayout = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
  const { tagName, createHandle } = options;
  const properties = Array.from(new Set(options.properties ?? []));
  const propertySet = new Set<PropertyKey>(properties);
  const attributes = { ...options.attributes };
  const attributeProps = new Set(Object.keys(attributes));
  const styles = { ...options.styles };
  const styleProps = new Set(Object.keys(styles));
  const events = { ...options.events };
  const eventProps = new Set(Object.keys(events));
  const config = { properties, attributes, styles, events };
  const Bridge = React.forwardRef<Handle, Props & Omit<React.HTMLAttributes<Element>, keyof Props>>(
    function ElementBridge(props, forwardedRef) {
      const elementRef = React.useRef<Element | null>(null);
      const [element, setElement] = React.useState<Element | null>(null);
      const bindingRef = React.useRef<{ element: Element; binding: ElementBinding<Props> } | null>(null);
      const rawForwardedRef = React.useRef<React.ForwardedRef<Handle>>(forwardedRef);
      const ref = React.useCallback((node: Element | null) => {
        if (bindingRef.current && bindingRef.current.element !== node) {
          bindingRef.current.binding.dispose();
          bindingRef.current = null;
        }
        elementRef.current = node;
        if (!createHandle) assignRef(rawForwardedRef.current, node as unknown as Handle | null);
        setElement(node);
      }, []);
      React.useImperativeHandle(
        createHandle ? forwardedRef : null,
        () => (createHandle ? createHandle(() => elementRef.current) : null) as unknown as Handle,
        [createHandle],
      );
      useLayout(() => {
        if (createHandle || rawForwardedRef.current === forwardedRef) return;
        const previousRef = rawForwardedRef.current;
        rawForwardedRef.current = forwardedRef;
        assignRef(previousRef, null);
        assignRef(forwardedRef, elementRef.current as unknown as Handle | null);
      }, [createHandle, element, forwardedRef]);
      useLayout(() => {
        const currentElement = elementRef.current;
        if (!element || !currentElement || element !== currentElement) return;
        if (bindingRef.current?.element !== currentElement) {
          bindingRef.current?.binding.dispose();
          bindingRef.current = {
            element: currentElement,
            binding: createElementBinding<Props>(currentElement, config, { assignmentErrors }),
          };
        }
        bindingRef.current.binding.update(props as Props);
      }, [element, props]);
      React.useEffect(() => {
        const current = bindingRef.current;
        const currentElement = elementRef.current;
        if (currentElement && current?.element === currentElement) current.binding.updateEvents(props as Props);
      });
      React.useEffect(() => () => { bindingRef.current?.binding.disconnectEvents(); }, []);
      const domProps: Record<string, unknown> = { ref };
      for (const [key, value] of Object.entries(props)) {
        if (propertySet.has(key) || attributeProps.has(key) || styleProps.has(key) || eventProps.has(key)) continue;
        domProps[key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key] = value;
      }
      return React.createElement(tagName, domProps);
    },
  );
  Bridge.displayName = `ElementBridge(${tagName})`;
  return Bridge;
}
```

### concurrency/OperationQueue.ts

```typescript
export interface QueuedOperation<T = unknown> {
  id: string;
  operation: () => T | Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  priority?: number;
  timestamp: number;
}
export interface QueuedOperationHandle<T> {
  promise: Promise<T>;
  cancel(reason?: unknown): boolean;
}
export class OperationQueue {
  private queue: Array<QueuedOperation<unknown>> = [];
  private processingPromise: Promise<void> | null = null;
  private operationCounter = 0;
  private activeOperations = 0;
  private readonly maxConcurrency: number;
  private needsReprocess = false;
  constructor(
    private name: string = 'OperationQueue', 
    maxConcurrency: number = 1
  ) {
    this.maxConcurrency = Math.max(1, maxConcurrency);
  }
  enqueue<T>(operation: () => T | Promise<T>, priority: number = 0): Promise<T> {
    return this.enqueueWithHandle(operation, priority).promise;
  }
  enqueueWithHandle<T>(
    operation: () => T | Promise<T>,
    priority: number = 0
  ): QueuedOperationHandle<T> {
    let queuedOperation!: QueuedOperation<T>;
    const promise = new Promise<T>((resolve, reject) => {
      queuedOperation = {
        id: `${this.name}-${++this.operationCounter}`,
        operation,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      };
      let insertIndex = this.queue.length;
      for (let i = 0; i < this.queue.length; i++) {
        const item = this.queue[i];
        if (item && (item.priority || 0) < priority) {
          insertIndex = i;
          break;
        }
      }
      this.queue.splice(insertIndex, 0, queuedOperation as unknown as QueuedOperation<unknown>);
      if (this.processingPromise) {
        this.notifyNewOperation();
      }
      this.processQueue();
    });
    return {
      promise,
      cancel: (reason = new Error('Queue operation cancelled')) => {
        const index = this.queue.indexOf(queuedOperation as unknown as QueuedOperation<unknown>);
        if (index === -1) return false;
        this.queue.splice(index, 1);
        queuedOperation.reject(reason);
        this.notifyNewOperation();
        return true;
      },
    };
  }
  private async processQueue(): Promise<void> {
    if (this.processingPromise) {
      this.needsReprocess = true;
      return;
    }
    do {
      this.needsReprocess = false;
      this.processingPromise = this._doProcess();
      try {
        await this.processingPromise;
      } finally {
        this.processingPromise = null;
      }
    } while (this.needsReprocess || (this.queue.length > 0 && this.activeOperations < this.maxConcurrency));
  }
  private async _doProcess(): Promise<void> {
    while (this.queue.length > 0 || this.activeOperations > 0) {
      while (this.queue.length > 0 && this.activeOperations < this.maxConcurrency) {
        const operation = this.queue.shift()!;
        this.startOperation(operation);
      }
      if (this.activeOperations > 0) {
        await this.waitForAnyOperation();
      }
    }
  }
  private startOperation(operation: QueuedOperation<unknown>): void {
    this.activeOperations++;
    this.executeOperation(operation)
      .finally(() => {
        this.activeOperations--;
        this.notifyOperationComplete();
      });
  }
  private pendingResolvers: Array<() => void> = [];
  private waitForAnyOperation(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.pendingResolvers.push(resolve);
    });
  }
  private notifyOperationComplete(): void {
    const resolvers = this.pendingResolvers.splice(0);
    resolvers.forEach(resolve => resolve());
  }
  private notifyNewOperation(): void {
    this.notifyOperationComplete();
  }
  private async executeOperation(operation: QueuedOperation<unknown>): Promise<void> {
    try {
      const result = await Promise.resolve(operation.operation());
      operation.resolve(result);
    } catch (error) {
      operation.reject(error);
    }
  }
  getQueueInfo() {
    return {
      name: this.name,
      queueLength: this.queue.length,
      isProcessing: Boolean(this.processingPromise),
      activeOperations: this.activeOperations,
      maxConcurrency: this.maxConcurrency,
      operations: this.queue.map(op => ({
        id: op.id,
        priority: op.priority,
        timestamp: op.timestamp
      }))
    };
  }
  getConcurrencyInfo() {
    return {
      maxConcurrency: this.maxConcurrency,
      activeOperations: this.activeOperations,
      availableSlots: this.maxConcurrency - this.activeOperations,
      queuedOperations: this.queue.length,
      efficiency: this.activeOperations / this.maxConcurrency
    };
  }
  clear(options: { rejectPending?: boolean; reason?: unknown } = {}): void {
    const rejectPending = options.rejectPending ?? true;
    const reason = options.reason ?? new Error('Queue cleared');
    this.queue.forEach(operation => {
      if (rejectPending) {
        operation.reject(reason);
      } else {
        operation.resolve(undefined as never);
      }
    });
    this.queue = [];
    const resolvers = this.pendingResolvers.splice(0);
    resolvers.forEach(resolve => resolve());
  }
  get size(): number {
    return this.queue.length;
  }
  get processing(): boolean {
    return Boolean(this.processingPromise);
  }
}
```

### contracts/public-action-methods.ts

```typescript
export type PublicActionMethods<
  Actions extends object,
  PublicKeys extends keyof Actions = keyof Actions,
  ReturnMap extends Partial<Record<PublicKeys, unknown>> = Record<never, never>,
> = {
  readonly [Key in PublicKeys]: [Actions[Key]] extends [void | undefined]
    ? () => Key extends keyof ReturnMap ? Promise<ReturnMap[Key]> : Promise<void>
    : (payload: Actions[Key]) => Key extends keyof ReturnMap ? Promise<ReturnMap[Key]> : Promise<void>;
};
```

### element-react.ts

```typescript
export { createReactElementBridge } from './bridges/react-element/create-react-element-bridge.js';
export type { ReactElementComponent } from './bridges/react-element/types.js';
export * from './element.js';
```

### element.ts

```typescript
export { createElementFacade } from './element/create-element-facade.js';
export { createElementBinding } from './element/create-element-binding.js';
export { createPointerGestureSession } from './element/pointer-gesture-session.js';
export { createRovingFocusController } from './element/roving-focus.js';
export { createSyncActionPipeline } from './element/sync-action-pipeline.js';
export { toReactPartProps } from './element/to-react-part-props.js';
export type { PublicActionMethods } from './contracts/public-action-methods.js';
export type {
  ImperativeHandleFactory, ElementBinding, ElementBindingConfig, ElementBindingOptions,
  ElementBridgeConfig, ElementBridgeContract,
} from './element/contracts.js';
export type {
  PointerCaptureTargetLike,
  PointerGestureEventLike,
  PointerGestureKeyEventLike,
  PointerGestureModifiers,
  PointerGestureOptions,
  PointerGestureSession,
  PointerGestureSnapshot,
} from './element/pointer-gesture-session.js';
export type {
  RovingFocusController,
  RovingFocusItem,
  RovingFocusKeyEventLike,
  RovingFocusOptions,
  RovingFocusOrientation,
} from './element/roving-focus.js';
export type {
  SyncActionPipeline,
  SyncDispatchOutcome,
  SyncGuardController,
  SyncHandlerConfig,
  SyncObserverConfig,
  SyncObserverMeta,
  SyncResultController,
} from './element/sync-action-pipeline.js';
```

### element/attribute-bindings.ts

```typescript
export function createAttributeBindings<Props extends object>(
  element: HTMLElement,
  attributes: readonly (readonly [keyof Props, string])[],
  active: () => boolean,
) {
  const applied = new Set<keyof Props>();
  return (input: Props): void => {
    for (const [key, attrName] of attributes) {
      if (!active()) return;
      if (key in input) {
        const value = input[key];
        if (!active()) return;
        applied.add(key);
        if (value === null || value === undefined || value === false) {
          element.removeAttribute(attrName);
        } else if (value === true) {
          element.setAttribute(attrName, '');
        } else {
          element.setAttribute(attrName, String(value));
        }
      } else if (applied.delete(key)) {
        element.removeAttribute(attrName);
      }
    }
  };
}
```

### element/contracts.ts

```typescript
import type { PublicHandleFactory } from '../facade/types.js';
export type ImperativeHandleFactory<Element extends HTMLElement, Handle> = PublicHandleFactory<Element, Handle>;
export interface ElementBindingConfig<Props extends object> {
  properties?: readonly (keyof Props)[];
  attributes?: Partial<Record<keyof Props & string, string>>;
  styles?: Partial<Record<keyof Props & string, string>>;
  events?: Record<string, string>;
}
export interface ElementBridgeConfig<Props extends object, Element extends HTMLElement = HTMLElement, Handle = Element>
  extends ElementBindingConfig<Props> {
  createHandle?: ImperativeHandleFactory<Element, Handle>;
}
export interface ElementBridgeContract<Props extends object, Element extends HTMLElement = HTMLElement, Handle = Element>
  extends ElementBridgeConfig<Props, Element, Handle> {
  tagName: string;
}
export interface ElementBindingOptions {
  assignmentErrors?: 'ignore' | 'throw';
}
export interface ElementBinding<Props extends object> {
  readonly disposed: boolean;
  update(input: Props): void;
  updateProperties(input: Props): void;
  updateAttributes(input: Props): void;
  updateStyles(input: Props): void;
  updateEvents(input: Props): void;
  disconnectEvents(): void;
  dispose(): void;
}
```

### element/create-element-binding.ts

```typescript
import { createAttributeBindings } from './attribute-bindings.js';
import type { ElementBinding, ElementBindingConfig, ElementBindingOptions } from './contracts.js';
import { createEventBindings } from './event-bindings.js';
import { createPropertyBindings } from './property-bindings.js';
import { createStyleBindings } from './style-bindings.js';
export function createElementBinding<Props extends object>(
  element: HTMLElement,
  config: ElementBindingConfig<Props>,
  options: ElementBindingOptions = {},
): ElementBinding<Props> {
  let disposed = false;
  let updating = false;
  const active = () => !disposed;
  const properties = createPropertyBindings(element, Array.from(new Set(config.properties ?? [])), active, options.assignmentErrors ?? 'ignore');
  const attributes = createAttributeBindings(element, Object.entries(config.attributes ?? {}) as [keyof Props, string][], active);
  const styles = createStyleBindings(element, Object.entries(config.styles ?? {}) as [keyof Props, string][], active);
  const events = createEventBindings(element, Object.entries(config.events ?? {}), active);
  function run(update: () => void): void {
    if (disposed) throw new Error('Element binding is disposed');
    if (updating) throw new Error('Element binding update is already in progress');
    updating = true;
    try { update(); } finally { updating = false; }
  }
  return {
    get disposed() { return disposed; },
    update(input) {
      run(() => {
        events.update(input);
        if (active()) attributes(input);
        if (active()) styles(input);
        if (active()) properties(input);
      });
    },
    updateProperties(input) { run(() => properties(input)); },
    updateAttributes(input) { run(() => attributes(input)); },
    updateStyles(input) { run(() => styles(input)); },
    updateEvents(input) { run(() => events.update(input)); },
    disconnectEvents() { events.disconnect(); },
    dispose() { disposed = true; events.disconnect(); },
  };
}
```

### element/create-element-facade.ts

```typescript
import { createPublicFacade } from '../facade/create-public-facade.js';
import type { ImperativeHandleFactory } from './contracts.js';
export function createElementFacade<Element extends HTMLElement, const Keys extends readonly (keyof Element)[]>(
  keys: Keys,
): ImperativeHandleFactory<Element, Pick<Element, Keys[number]>> {
  return createPublicFacade<Element, Keys>(keys, 'Custom element handle is not mounted');
}
```

### element/event-bindings.ts

```typescript
type Handler = ((event: Event) => void) | { handleEvent(event: Event): void };
interface Binding {
  handler: Handler;
  eventName: string;
  listener: EventListener;
  active: boolean;
}
function isHandler(value: unknown): value is Handler {
  return typeof value === 'function' || (typeof value === 'object' && value !== null
    && typeof (value as { handleEvent?: unknown }).handleEvent === 'function');
}
export function createEventBindings(element: HTMLElement, events: readonly (readonly [string, string])[], active: () => boolean) {
  const bindings = new Map<string, Binding>();
  function remove(key: string, binding: Binding): void {
    binding.active = false;
    bindings.delete(key);
    element.removeEventListener(binding.eventName, binding.listener);
  }
  return {
    update(input: object): void {
      const handlers = input as Record<string, unknown>;
      for (const [key, eventName] of events) {
        if (!active()) return;
        const handler = handlers[key];
        const old = bindings.get(key);
        if (old?.handler === handler) continue;
        if (old) remove(key, old);
        if (!active()) return;
        if (!isHandler(handler)) continue;
        const binding: Binding = {
          handler, eventName, active: true,
          listener(event) {
            if (!active() || !binding.active) return;
            if (typeof handler === 'function') handler(event);
            else handler.handleEvent(event);
          },
        };
        bindings.set(key, binding);
        try { element.addEventListener(eventName, binding.listener); }
        catch (error) { remove(key, binding); throw error; }
        if (!active()) remove(key, binding);
      }
    },
    disconnect(): void {
      for (const [key, binding] of bindings) remove(key, binding);
    },
  };
}
```

### element/pointer-gesture-session.ts

```typescript
export interface PointerGestureModifiers {
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
}
export interface PointerGestureSnapshot {
  readonly active: boolean;
  readonly pointerId: number | null;
  readonly startX: number;
  readonly startY: number;
  readonly currentX: number;
  readonly currentY: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly modifiers: PointerGestureModifiers;
}
export interface PointerCaptureTargetLike {
  setPointerCapture?(pointerId: number): void;
  releasePointerCapture?(pointerId: number): void;
}
export interface PointerGestureEventLike {
  readonly pointerId?: number | undefined;
  readonly button?: number | undefined;
  readonly clientX: number;
  readonly clientY: number;
  readonly shiftKey?: boolean | undefined;
  readonly altKey?: boolean | undefined;
  readonly ctrlKey?: boolean | undefined;
  readonly metaKey?: boolean | undefined;
  readonly currentTarget?: PointerCaptureTargetLike | null | undefined;
}
export interface PointerGestureKeyEventLike {
  readonly key: string;
  preventDefault?(): void;
}
export interface PointerGestureOptions {
  onStart?: ((snapshot: PointerGestureSnapshot) => boolean | void) | undefined;
  onMove?: ((snapshot: PointerGestureSnapshot) => void) | undefined;
  onCommit?: ((snapshot: PointerGestureSnapshot) => void) | undefined;
  onCancel?: ((snapshot: PointerGestureSnapshot, reason?: string) => void) | undefined;
}
export interface PointerGestureSession {
  start(event: PointerGestureEventLike): boolean;
  move(event: PointerGestureEventLike): boolean;
  commit(event?: PointerGestureEventLike): boolean;
  cancel(reason?: string): boolean;
  handleKeyDown(event: PointerGestureKeyEventLike): boolean;
  isActive(): boolean;
  getSnapshot(): PointerGestureSnapshot;
  dispose(): void;
}
const DEFAULT_MODIFIERS: PointerGestureModifiers = {
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
};
function readModifiers(event: Partial<PointerGestureEventLike>): PointerGestureModifiers {
  return {
    shiftKey: Boolean(event.shiftKey),
    altKey: Boolean(event.altKey),
    ctrlKey: Boolean(event.ctrlKey),
    metaKey: Boolean(event.metaKey),
  };
}
function createIdleSnapshot(): PointerGestureSnapshot {
  return {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    modifiers: { ...DEFAULT_MODIFIERS },
  };
}
function cloneSnapshot(snapshot: PointerGestureSnapshot): PointerGestureSnapshot {
  return {
    ...snapshot,
    modifiers: { ...snapshot.modifiers },
  };
}
export function createPointerGestureSession(
  options: PointerGestureOptions = {},
): PointerGestureSession {
  let disposed = false;
  let snapshot = createIdleSnapshot();
  let captureTarget: PointerCaptureTargetLike | null = null;
  const releaseCapture = (): void => {
    if (captureTarget && snapshot.pointerId !== null) {
      try {
        captureTarget.releasePointerCapture?.(snapshot.pointerId);
      } catch {
      }
    }
    captureTarget = null;
  };
  return {
    start(event) {
      if (disposed || snapshot.active) return false;
      if (event.button !== undefined && event.button !== 0) return false;
      const pointerId = event.pointerId ?? 0;
      const next: PointerGestureSnapshot = {
        active: true,
        pointerId,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        deltaX: 0,
        deltaY: 0,
        modifiers: readModifiers(event),
      };
      const verdict = options.onStart?.(cloneSnapshot(next));
      if (verdict === false || disposed) return false;
      snapshot = next;
      captureTarget = event.currentTarget ?? null;
      if (captureTarget) {
        try {
          captureTarget.setPointerCapture?.(pointerId);
        } catch {
        }
      }
      return true;
    },
    move(event) {
      if (disposed || !snapshot.active) return false;
      if (event.pointerId !== undefined && event.pointerId !== snapshot.pointerId) return false;
      snapshot = {
        ...snapshot,
        currentX: event.clientX,
        currentY: event.clientY,
        deltaX: event.clientX - snapshot.startX,
        deltaY: event.clientY - snapshot.startY,
        modifiers: readModifiers(event),
      };
      options.onMove?.(cloneSnapshot(snapshot));
      return true;
    },
    commit(event) {
      if (disposed || !snapshot.active) return false;
      if (event?.pointerId !== undefined && event.pointerId !== snapshot.pointerId) return false;
      if (event && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
        snapshot = {
          ...snapshot,
          currentX: event.clientX,
          currentY: event.clientY,
          deltaX: event.clientX - snapshot.startX,
          deltaY: event.clientY - snapshot.startY,
          modifiers: readModifiers(event),
        };
      }
      releaseCapture();
      snapshot = { ...snapshot, active: false };
      options.onCommit?.(cloneSnapshot(snapshot));
      return true;
    },
    cancel(reason) {
      if (disposed || !snapshot.active) return false;
      releaseCapture();
      snapshot = { ...snapshot, active: false };
      options.onCancel?.(cloneSnapshot(snapshot), reason);
      return true;
    },
    handleKeyDown(event) {
      if (disposed || !snapshot.active || event.key !== 'Escape') return false;
      event.preventDefault?.();
      this.cancel('escape');
      return true;
    },
    isActive() {
      return !disposed && snapshot.active;
    },
    getSnapshot() {
      return cloneSnapshot(snapshot);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      releaseCapture();
      snapshot = { ...snapshot, active: false };
    },
  };
}
```

### element/property-bindings.ts

```typescript
export function createPropertyBindings<Props extends object>(
  element: HTMLElement,
  properties: readonly (keyof Props)[],
  active: () => boolean,
  assignmentErrors: 'ignore' | 'throw',
) {
  const applied = new Set<keyof Props>();
  const host = element as unknown as Record<keyof Props, unknown>;
  return (input: Props): void => {
    for (const key of properties) {
      if (!active()) return;
      if (key in input) {
        const value = input[key];
        if (!active()) return;
        applied.add(key);
        try { host[key] = value; }
        catch (error) { if (assignmentErrors === 'throw') throw error; }
      } else if (applied.delete(key)) {
        try { host[key] = undefined; } catch {  }
      }
    }
  };
}
```

### element/roving-focus.ts

```typescript
export type RovingFocusOrientation = 'horizontal' | 'vertical' | 'both';
export interface RovingFocusItem {
  readonly id: string;
  readonly disabled?: boolean | undefined;
}
export interface RovingFocusKeyEventLike {
  readonly key: string;
  preventDefault?(): void;
}
export interface RovingFocusOptions {
  readonly orientation?: RovingFocusOrientation | undefined;
  readonly loop?: boolean | undefined;
  getItems(): readonly RovingFocusItem[];
  getActiveId(): string | null | undefined;
  onFocusChange?: ((nextId: string) => void) | undefined;
}
export interface RovingFocusController {
  getTabIndex(itemId: string): 0 | -1;
  handleKeyDown(currentId: string, event: RovingFocusKeyEventLike): string | null;
}
function isForwardKey(key: string, orientation: RovingFocusOrientation): boolean {
  if (orientation === 'horizontal') return key === 'ArrowRight';
  if (orientation === 'vertical') return key === 'ArrowDown';
  return key === 'ArrowRight' || key === 'ArrowDown';
}
function isBackwardKey(key: string, orientation: RovingFocusOrientation): boolean {
  if (orientation === 'horizontal') return key === 'ArrowLeft';
  if (orientation === 'vertical') return key === 'ArrowUp';
  return key === 'ArrowLeft' || key === 'ArrowUp';
}
export function createRovingFocusController(options: RovingFocusOptions): RovingFocusController {
  const orientation: RovingFocusOrientation = options.orientation ?? 'horizontal';
  const loop = options.loop ?? true;
  const getEnabledItems = (): readonly RovingFocusItem[] =>
    options.getItems().filter(item => !item.disabled);
  const resolveEffectiveActiveId = (enabled: readonly RovingFocusItem[]): string | null => {
    if (enabled.length === 0) return null;
    const requested = options.getActiveId();
    if (requested && enabled.some(item => item.id === requested)) return requested;
    return enabled[0]?.id ?? null;
  };
  return {
    getTabIndex(itemId) {
      const enabled = getEnabledItems();
      const effectiveId = resolveEffectiveActiveId(enabled);
      return effectiveId !== null && itemId === effectiveId ? 0 : -1;
    },
    handleKeyDown(currentId, event) {
      const enabled = getEnabledItems();
      if (enabled.length === 0) return null;
      let target: RovingFocusItem | undefined;
      if (event.key === 'Home') {
        target = enabled[0];
      } else if (event.key === 'End') {
        target = enabled[enabled.length - 1];
      } else if (isForwardKey(event.key, orientation) || isBackwardKey(event.key, orientation)) {
        const step = isForwardKey(event.key, orientation) ? 1 : -1;
        const effectiveId = resolveEffectiveActiveId(enabled);
        let idx = enabled.findIndex(item => item.id === currentId);
        if (idx < 0 && effectiveId !== null) {
          idx = enabled.findIndex(item => item.id === effectiveId);
        }
        if (idx < 0) idx = 0;
        const nextIdx = loop
          ? (idx + step + enabled.length) % enabled.length
          : Math.max(0, Math.min(enabled.length - 1, idx + step));
        target = enabled[nextIdx];
      } else {
        return null;
      }
      if (!target) return null;
      event.preventDefault?.();
      options.onFocusChange?.(target.id);
      return target.id;
    },
  };
}
```

### element/style-bindings.ts

```typescript
export function createStyleBindings<Props extends object>(
  element: HTMLElement,
  styles: readonly (readonly [keyof Props, string])[],
  active: () => boolean,
) {
  const applied = new Set<keyof Props>();
  return (input: Props): void => {
    for (const [key, cssProperty] of styles) {
      if (!active()) return;
      if (key in input) {
        const value = input[key];
        if (!active()) return;
        applied.add(key);
        if (value === null || value === undefined || value === '') {
          element.style.removeProperty(cssProperty);
        } else {
          element.style.setProperty(cssProperty, String(value));
        }
      } else if (applied.delete(key)) {
        element.style.removeProperty(cssProperty);
      }
    }
  };
}
```

### element/sync-action-pipeline.ts

```typescript
export interface SyncGuardController<TPayload = unknown> {
  abort(reason?: string): void;
  modifyPayload(updater: TPayload | ((prev: TPayload) => TPayload)): void;
  getPayload(): TPayload;
}
export interface SyncResultController<TPayload = unknown, TResult = unknown>
  extends SyncGuardController<TPayload> {
  setResult(value: TResult): void;
  getResult(): TResult | undefined;
}
export interface SyncObserverMeta<TResult = unknown> {
  readonly success: boolean;
  readonly aborted: boolean;
  readonly abortReason?: string | undefined;
  readonly result: TResult | undefined;
  readonly errors: readonly unknown[];
}
export interface SyncDispatchOutcome<TPayload = unknown, TResult = unknown> {
  readonly success: boolean;
  readonly aborted: boolean;
  readonly abortReason?: string | undefined;
  readonly payload: TPayload;
  readonly result: TResult | undefined;
  readonly errors: readonly unknown[];
}
export interface SyncHandlerConfig {
  readonly priority?: number;
  readonly id?: string;
  readonly once?: boolean;
}
export interface SyncObserverConfig extends SyncHandlerConfig {
  readonly when?: 'success' | 'failure' | 'always';
}
export interface SyncActionPipeline<
  TActions extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly name: string;
  registerGuard<K extends keyof TActions & string>(
    action: K,
    handler: (payload: TActions[K], controller: SyncGuardController<TActions[K]>) => void,
    config?: SyncHandlerConfig,
  ): () => void;
  register<K extends keyof TActions & string, TResult = unknown>(
    action: K,
    handler: (
      payload: TActions[K],
      controller: SyncResultController<TActions[K], TResult>,
    ) => TResult | undefined,
    config?: SyncHandlerConfig,
  ): () => void;
  registerObserver<K extends keyof TActions & string, TResult = unknown>(
    action: K,
    handler: (payload: TActions[K], meta: SyncObserverMeta<TResult>) => void,
    config?: SyncObserverConfig,
  ): () => void;
  dispatch<K extends keyof TActions & string, TResult = unknown>(
    action: K,
    payload?: TActions[K],
  ): SyncDispatchOutcome<TActions[K], TResult>;
  destroy(): void;
}
interface InternalEntry {
  readonly id: string;
  readonly seq: number;
  readonly priority: number;
  readonly when: 'success' | 'failure' | 'always';
  readonly once: boolean;
  readonly handler: (...args: any[]) => unknown;
}
export function createSyncActionPipeline<
  TActions extends Record<string, unknown> = Record<string, unknown>,
>(name: string): SyncActionPipeline<TActions> {
  const guards = new Map<string, InternalEntry[]>();
  const handlers = new Map<string, InternalEntry[]>();
  const observers = new Map<string, InternalEntry[]>();
  let nextSeq = 1;
  let destroyed = false;
  function addEntry(
    phaseMap: Map<string, InternalEntry[]>,
    action: string,
    handler: (...args: any[]) => unknown,
    config: SyncObserverConfig = {},
  ): () => void {
    if (destroyed) throw new Error(`SyncActionPipeline '${name}' is destroyed`);
    if (typeof handler !== 'function') throw new TypeError('Handler must be a function');
    const bucket = phaseMap.get(action) ?? [];
    const entry: InternalEntry = {
      id: config.id ?? `${action}-${nextSeq}`,
      seq: nextSeq++,
      priority: config.priority ?? 0,
      when: config.when ?? 'success',
      once: Boolean(config.once),
      handler,
    };
    const next = [...bucket, entry].sort(
      (a, b) => b.priority - a.priority || a.seq - b.seq,
    );
    phaseMap.set(action, next);
    return () => {
      const current = phaseMap.get(action);
      if (!current) return;
      phaseMap.set(
        action,
        current.filter(item => item !== entry),
      );
    };
  }
  function consumeOnce(
    phaseMap: Map<string, InternalEntry[]>,
    action: string,
    entry: InternalEntry,
  ): void {
    if (!entry.once) return;
    const list = phaseMap.get(action);
    if (list) {
      phaseMap.set(
        action,
        list.filter(item => item !== entry),
      );
    }
  }
  return {
    name,
    registerGuard(action, handler, config) {
      return addEntry(guards, action, handler, config);
    },
    register(action, handler, config) {
      return addEntry(handlers, action, handler, config);
    },
    registerObserver(action, handler, config) {
      return addEntry(observers, action, handler, config);
    },
    dispatch<K extends keyof TActions & string, TResult = unknown>(
      action: K,
      initialPayload?: TActions[K],
    ): SyncDispatchOutcome<TActions[K], TResult> {
      if (destroyed) throw new Error(`SyncActionPipeline '${name}' is destroyed`);
      let currentPayload = initialPayload as TActions[K];
      let aborted = false;
      let abortReason: string | undefined;
      let result: TResult | undefined;
      const errors: unknown[] = [];
      for (const entry of [...(guards.get(action) ?? [])]) {
        consumeOnce(guards, action, entry);
        let entryAborted = false;
        const guardController: SyncGuardController<TActions[K]> = {
          abort(reason?: string) {
            aborted = true;
            entryAborted = true;
            abortReason = reason;
          },
          modifyPayload(updater) {
            currentPayload =
              typeof updater === 'function'
                ? (updater as (prev: TActions[K]) => TActions[K])(currentPayload)
                : updater;
          },
          getPayload() {
            return currentPayload;
          },
        };
        try {
          entry.handler(currentPayload, guardController);
        } catch (error) {
          aborted = true;
          abortReason = error instanceof Error ? error.message : String(error);
          errors.push(error);
        }
        if (aborted || entryAborted) break;
      }
      if (!aborted) {
        for (const entry of [...(handlers.get(action) ?? [])]) {
          consumeOnce(handlers, action, entry);
          const execController: SyncResultController<TActions[K], TResult> = {
            abort(reason?: string) {
              aborted = true;
              abortReason = reason;
            },
            modifyPayload(updater) {
              currentPayload =
                typeof updater === 'function'
                  ? (updater as (prev: TActions[K]) => TActions[K])(currentPayload)
                  : updater;
            },
            getPayload() {
              return currentPayload;
            },
            setResult(value: TResult) {
              result = value;
            },
            getResult() {
              return result;
            },
          };
          try {
            const ret = entry.handler(currentPayload, execController);
            if (ret !== undefined) result = ret as TResult;
          } catch (error) {
            errors.push(error);
            break;
          }
          if (aborted) break;
        }
      }
      const success = !aborted && errors.length === 0;
      for (const entry of [...(observers.get(action) ?? [])]) {
        if (entry.when === 'success' && !success) continue;
        if (entry.when === 'failure' && success) continue;
        consumeOnce(observers, action, entry);
        try {
          entry.handler(currentPayload, {
            success,
            aborted,
            abortReason,
            result,
            errors: [...errors],
          });
        } catch {
        }
      }
      return {
        success,
        aborted,
        abortReason,
        payload: currentPayload,
        result,
        errors,
      };
    },
    destroy() {
      destroyed = true;
      guards.clear();
      handlers.clear();
      observers.clear();
    },
  };
}
```

### element/to-react-part-props.ts

```typescript
import type { ElementBindingConfig } from './contracts.js';
const ATTR_TO_REACT_PROP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
};
function toReactStyleProperty(cssProperty: string): string {
  if (cssProperty.startsWith('--')) return cssProperty;
  return cssProperty.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
}
export function toReactPartProps<Props extends object>(
  snapshot: Props,
  config: ElementBindingConfig<Props> = {},
): Record<string, unknown> {
  const reactProps: Record<string, unknown> = {};
  const attrEntries = Object.entries(config.attributes ?? {}) as [string, string | undefined][];
  const styleEntries = Object.entries(config.styles ?? {}) as [string, string | undefined][];
  const eventMap = config.events ?? {};
  const record = snapshot as Record<string, unknown>;
  for (const [propKey, attrName] of attrEntries) {
    if (!attrName) continue;
    const value = record[propKey];
    if (value === undefined || value === null || value === false) continue;
    const reactKey = ATTR_TO_REACT_PROP[attrName] ?? attrName;
    reactProps[reactKey] = value === true ? '' : value;
  }
  const styleObj: Record<string, string> = {};
  let hasStyle = false;
  for (const [propKey, cssProperty] of styleEntries) {
    if (!cssProperty) continue;
    const value = record[propKey];
    if (value === undefined || value === null || value === '') continue;
    styleObj[toReactStyleProperty(cssProperty)] = String(value);
    hasStyle = true;
  }
  if (hasStyle) reactProps.style = styleObj;
  for (const propKey of Object.keys(eventMap)) {
    const candidate = record[propKey];
    if (typeof candidate === 'function') {
      reactProps[propKey] = candidate;
    }
  }
  return reactProps;
}
```

### errors.ts

```typescript
export interface ZodIssueLike {
  message: string;
  path: readonly (string | number | symbol)[];
  code: string;
}
export interface ZodErrorLike {
  message: string;
  issues: readonly ZodIssueLike[];
  format?: () => unknown;
  flatten?: () => unknown;
}
export class ActionResultProcessingError extends Error {
  override name = 'ActionResultProcessingError';
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ActionResultProcessingError.prototype);
  }
}
export class ActionAttemptSupersededError extends Error {
  override name = 'ActionAttemptSupersededError';
  constructor(public readonly attempt: number) {
    super(`Action attempt ${attempt} was superseded by a retry.`);
    Object.setPrototypeOf(this, ActionAttemptSupersededError.prototype);
  }
}
export function isActionResultProcessingError(
  error: unknown,
): error is ActionResultProcessingError {
  return error instanceof ActionResultProcessingError;
}
export class ActionValidationError extends Error {
  override name = 'ActionValidationError';
  public readonly zodError: unknown;
  constructor(action: string, zodError: unknown) {
    const errorMessage =
      zodError && typeof zodError === 'object' && 'message' in zodError
        ? String((zodError as { message: unknown }).message)
        : 'Validation failed';
    const message = `Action "${action}" payload validation failed: ${errorMessage}`;
    super(message);
    this.action = action;
    this.zodError = zodError;
    Object.setPrototypeOf(this, ActionValidationError.prototype);
  }
  public readonly action: string;
  get issues(): readonly ZodIssueLike[] {
    if (
      this.zodError &&
      typeof this.zodError === 'object' &&
      'issues' in this.zodError &&
      Array.isArray((this.zodError as { issues: unknown }).issues)
    ) {
      return (this.zodError as { issues: readonly ZodIssueLike[] }).issues;
    }
    return [];
  }
  get formattedErrors(): unknown {
    if (
      this.zodError &&
      typeof this.zodError === 'object' &&
      'format' in this.zodError &&
      typeof (this.zodError as { format: unknown }).format === 'function'
    ) {
      return (this.zodError as { format: () => unknown }).format();
    }
    return {};
  }
  get flattenedErrors(): unknown {
    if (
      this.zodError &&
      typeof this.zodError === 'object' &&
      'flatten' in this.zodError &&
      typeof (this.zodError as { flatten: unknown }).flatten === 'function'
    ) {
      return (this.zodError as { flatten: () => unknown }).flatten();
    }
    return { fieldErrors: {}, formErrors: [] };
  }
  get firstError(): string | undefined {
    return this.issues[0]?.message;
  }
  get errorPaths(): string[] {
    return this.issues.map((issue) =>
      (issue.path ?? []).map((p) => String(p)).join('.')
    );
  }
  toJSON() {
    return {
      name: this.name,
      action: this.action,
      message: this.message,
      issues: this.issues,
    };
  }
}
export class ActionTimeoutError extends Error {
  override name = 'ActionTimeoutError';
  constructor(
    public readonly action: string,
    public readonly timeout: number
  ) {
    super(`Action "${action}" timed out after ${timeout}ms`);
    Object.setPrototypeOf(this, ActionTimeoutError.prototype);
  }
}
export class ActionRegisterDestroyedError extends Error {
  override name = 'ActionRegisterDestroyedError';
  constructor(
    public readonly registerName: string,
    public readonly state: 'closing' | 'destroyed'
  ) {
    super(`ActionRegister "${registerName}" is ${state} and cannot accept new work`);
    Object.setPrototypeOf(this, ActionRegisterDestroyedError.prototype);
  }
}
export function isActionValidationError(
  error: unknown
): error is ActionValidationError {
  return error instanceof ActionValidationError;
}
export function isActionTimeoutError(
  error: unknown
): error is ActionTimeoutError {
  return error instanceof ActionTimeoutError;
}
export function isActionRegisterDestroyedError(
  error: unknown
): error is ActionRegisterDestroyedError {
  return error instanceof ActionRegisterDestroyedError;
}
```

### execution-modes.ts

```typescript
import type { 
  HandlerError,
  HandlerExecutionOutcome,
  HandlerRegistration, 
  HandlerRole,
  PipelineContext,
  PipelineController,
  PipelineControllerState,
} from './types.js';
function publishesResults(role?: HandlerRole): boolean {
  return role !== 'guard' && role !== 'command';
}
function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}
function beginOutcome<T, R>(registration: HandlerRegistration<T, R>): HandlerExecutionOutcome<R> {
  return {
    id: registration.id,
    status: 'running',
    executed: true,
    duration: undefined,
    result: undefined,
    error: undefined,
    metadata: registration.config.metadata
      ? { ...registration.config.metadata }
      : undefined,
  };
}
function createSkippedOutcome<T, R>(
  registration: HandlerRegistration<T, R>,
): HandlerExecutionOutcome<R> {
  return {
    id: registration.id,
    status: 'skipped',
    executed: false,
    duration: 0,
    result: undefined,
    error: undefined,
    metadata: registration.config.metadata
      ? { ...registration.config.metadata }
      : undefined,
  };
}
function selectConcurrentHandlers<T, R>(
  context: PipelineContext<T, R>,
): HandlerRegistration<T, R>[] {
  const eligibleHandlers: HandlerRegistration<T, R>[] = [];
  for (const registration of context.handlers) {
    if (registration.config.condition && !registration.config.condition(context.payload)) {
      (context.handlerOutcomes ??= []).push(createSkippedOutcome(registration));
      continue;
    }
    eligibleHandlers.push(registration);
  }
  return eligibleHandlers.filter(registration => {
    if (context.claimOnce && !context.claimOnce(registration)) {
      (context.handlerOutcomes ??= []).push(createSkippedOutcome(registration));
      return false;
    }
    return true;
  });
}
function finishOutcome<R>(
  outcome: HandlerExecutionOutcome<R>,
  startedAt: number,
  status: 'succeeded' | 'failed',
  result?: R,
  error?: Error,
): void {
  outcome.status = status;
  outcome.duration = Date.now() - startedAt;
  outcome.result = result;
  outcome.error = error;
}
function appendLocalResults<T, R>(
  context: PipelineContext<T, R>,
  state: PipelineControllerState<T, R>,
  returnedResult: R | undefined,
  registration: HandlerRegistration<T, R>,
  target: R[] = context.results,
): void {
  if (!publishesResults(registration.role)) return;
  if (state.results.length > 0) target.push(...state.results);
  if (returnedResult !== undefined && !state.terminated) {
    target.push(returnedResult);
  }
}
function handleExecutionError<T, R>(
  error: unknown,
  registration: HandlerRegistration<T, R>
): HandlerError {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  return {
    handlerId: registration.id,
    error: errorObj,
    timestamp: Date.now(),
    severity: registration.config.errorPolicy === 'fatal' ? 'blocking' : 'non-blocking'
  };
}
export async function executeSequential<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void> {
  let i = 0;
  const nonBlockingPromises: Array<Promise<unknown>> = [];
  const errors: HandlerError[] = [];
  while (i < context.handlers.length) {
    if (context.aborted || context.terminated) {
      break;
    }
    const registration = context.handlers[i];
    if (!registration) {
      i++;
      continue; 
    }
    context.currentIndex = i;
    const controller = createController(registration, i);
    if (registration.config.condition) {
      const shouldExecute = registration.config.condition(context.payload);
      if (!shouldExecute) {
        (context.handlerOutcomes ??= []).push(createSkippedOutcome(registration));
        i++;
        continue;
      }
    }
    if (context.claimOnce && !context.claimOnce(registration)) {
      (context.handlerOutcomes ??= []).push(createSkippedOutcome(registration));
      i++;
      continue;
    }
    const outcome = beginOutcome(registration);
    const startedAt = Date.now();
    (context.handlerOutcomes ??= []).push(outcome);
    try {
      if (context.aborted) {
        outcome.status = 'cancelled';
        outcome.executed = false;
        outcome.duration = 0;
        break;
      }
      (context.executedHandlers ??= []).push(registration);
      const result = registration.handler(context.payload, controller);
      const asyncResult = isPromiseLike(result) ? Promise.resolve(result) : undefined;
      const trackedResult = asyncResult && context.trackHandlerPromise
        ? context.trackHandlerPromise<unknown>(asyncResult)
        : asyncResult;
      if (registration.config.scheduling === 'await-before-next') {
        const handlerResult = trackedResult
          ? await trackedResult
          : result;
        finishOutcome(
          outcome,
          startedAt,
          'succeeded',
          publishesResults(registration.role) ? handlerResult as R | undefined : undefined,
        );
        if (
          publishesResults(registration.role) &&
          handlerResult !== undefined &&
          !context.terminated
        ) {
          context.results.push(handlerResult as R);
        }
      } else {
        if (trackedResult) {
          const promiseWithErrorHandling = trackedResult
            .then(asyncResult => {
              finishOutcome(
                outcome,
                startedAt,
                'succeeded',
                publishesResults(registration.role) ? asyncResult as R | undefined : undefined,
              );
              if (
                publishesResults(registration.role) &&
                asyncResult !== undefined &&
                !context.terminated
              ) {
                context.results.push(asyncResult as R);
              }
              return asyncResult;
            })
            .catch(error => {
              const handlerError = handleExecutionError(error, registration);
              errors.push(handlerError);
              (context.collectedErrors ??= []).push(handlerError);
              finishOutcome(
                outcome,
                startedAt,
                'failed',
                undefined,
                handlerError.error,
              );
              return undefined; 
            });
          nonBlockingPromises.push(promiseWithErrorHandling);
        } else if (
          publishesResults(registration.role) &&
          result !== undefined &&
          !context.terminated
        ) {
          finishOutcome(outcome, startedAt, 'succeeded', result as R);
          context.results.push(result as R);
        } else {
          finishOutcome(
            outcome,
            startedAt,
            'succeeded',
            publishesResults(registration.role) ? result as R | undefined : undefined,
          );
        }
      }
      outcome.terminationRequested = context.terminated;
      if (context.terminated) outcome.terminationResult = context.terminationResult;
      if (context.terminated) {
        break;
      }
      if (context.jumpToPriority !== undefined) {
        context.jumpCount = (context.jumpCount || 0) + 1;
        if (context.jumpCount > (context.maxJumps || 10)) {
          context.aborted = true;
          context.abortReason = `Maximum jump limit exceeded (${context.jumpCount} jumps)`;
          context.jumpToPriority = undefined;
          break;
        }
        const jumpIndex = context.handlers.findIndex(
          handler => (handler.config.priority || 0) <= context.jumpToPriority!
        );
        if (jumpIndex !== -1 && jumpIndex !== i) {
          i = jumpIndex;
          context.jumpToPriority = undefined;
        } else {
          context.jumpToPriority = undefined;
          i++;
        }
      } else {
        i++;
      }
    } catch (error: unknown) {
      const handlerError = handleExecutionError(error, registration);
      finishOutcome(outcome, startedAt, 'failed', undefined, handlerError.error);
      errors.push(handlerError);
      (context.collectedErrors ??= []).push(handlerError);
      if (registration.config.errorPolicy === 'fatal') {
        throw handlerError.error;
      }
      i++;
    }
  }
  if (nonBlockingPromises.length > 0) {
    await Promise.allSettled(nonBlockingPromises);
  }
  if (errors.length > 0) {
    context.collectedErrors = errors;
  }
  const fatalError = errors.find(error => error.severity === 'blocking');
  if (fatalError) throw fatalError.error;
}
export async function executeParallel<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (
    registration: HandlerRegistration<T, R>,
    index: number,
    state: PipelineControllerState<T, R>,
  ) => PipelineController<T, R>
): Promise<void> {
  const runnableHandlers = selectConcurrentHandlers(context);
  const terminationSlots: Array<{
    requested: boolean;
    result: R | undefined;
  }> = runnableHandlers.map(() => ({ requested: false, result: undefined }));
  const resultSlots: R[][] = runnableHandlers.map(() => []);
  const handlerPromises = runnableHandlers.map(async (registration, _index) => {
    const state: PipelineControllerState<T, R> = {
      payload: context.payload,
      aborted: false,
      abortReason: undefined,
      jumpToPriority: undefined,
      terminated: false,
      terminationResult: undefined,
      results: [],
    };
    const controller = createController(registration, _index, state);
    const outcome = beginOutcome(registration);
    const startedAt = Date.now();
    (context.handlerOutcomes ??= []).push(outcome);
    try {
      (context.executedHandlers ??= []).push(registration);
      const result = registration.handler(state.payload, controller);
      const handlerResult = (
        isPromiseLike(result) ? await Promise.resolve(result) : result
      ) as R | undefined;
      finishOutcome(
        outcome,
        startedAt,
        'succeeded',
        publishesResults(registration.role) ? handlerResult : undefined,
      );
      outcome.terminationRequested = state.terminated;
      if (state.terminated && publishesResults(registration.role)) {
        outcome.terminationResult = state.terminationResult;
        terminationSlots[_index] = {
          requested: true,
          result: state.terminationResult,
        };
      }
      appendLocalResults(context, state, handlerResult, registration, resultSlots[_index]);
      return { 
        success: true, 
        handlerId: registration.id, 
        result: handlerResult,
        terminated: state.terminated,
        state,
        outcome,
      };
    } catch (error: unknown) {
      const handlerError = handleExecutionError(error, registration);
      finishOutcome(outcome, startedAt, 'failed', undefined, handlerError.error);
      (context.collectedErrors ??= []).push(handlerError);
      if (handlerError.severity === 'blocking') {
        throw handlerError.error;
      }
      return {
        success: false,
        handlerId: registration.id,
        error: handlerError.error,
        state,
        outcome,
        registration,
      };
    }
  });
  const trackedHandlerPromises = context.trackHandlerPromise
    ? handlerPromises.map(promise => context.trackHandlerPromise!(promise))
    : handlerPromises;
  const results = await Promise.allSettled(trackedHandlerPromises);
  context.results.push(...resultSlots.flat());
  const failures = results.filter((result, index) => {
    if (result.status === 'rejected') {
      const registration = runnableHandlers[index];
      return registration?.config.errorPolicy === 'fatal';
    }
    return false;
  });
  if (failures.length > 0) {
    const firstFailure = failures[0] as PromiseRejectedResult;
    throw firstFailure.reason;
  }
  const firstTerminated = terminationSlots.find(slot => slot.requested);
  if (firstTerminated) {
    context.terminated = true;
    context.terminationResult = firstTerminated.result;
  }
}
export async function executeRace<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (
    registration: HandlerRegistration<T, R>,
    index: number,
    state: PipelineControllerState<T, R>,
  ) => PipelineController<T, R>
): Promise<void> {
  const runnableHandlers = selectConcurrentHandlers(context);
  if (runnableHandlers.length === 0) {
    return;
  }
  const handlerPromises = runnableHandlers.map(async (registration, _index) => {
    const state: PipelineControllerState<T, R> = {
      payload: context.payload,
      aborted: false,
      abortReason: undefined,
      jumpToPriority: undefined,
      terminated: false,
      terminationResult: undefined,
      results: [],
    };
    const controller = createController(registration, _index, state);
    const outcome = beginOutcome(registration);
    const startedAt = Date.now();
    (context.handlerOutcomes ??= []).push(outcome);
    try {
      (context.executedHandlers ??= []).push(registration);
      const result = registration.handler(state.payload, controller);
      const handlerResult = (
        isPromiseLike(result) ? await Promise.resolve(result) : result
      ) as R | undefined;
      finishOutcome(
        outcome,
        startedAt,
        'succeeded',
        publishesResults(registration.role) ? handlerResult : undefined,
      );
      outcome.terminationRequested = state.terminated;
      if (state.terminated) outcome.terminationResult = state.terminationResult;
      return {
        success: true, 
        handlerId: registration.id, 
        registration,
        result: handlerResult,
        terminated: state.terminated,
        state,
        outcome,
      };
    } catch (error: unknown) {
      const handlerError = handleExecutionError(error, registration);
      finishOutcome(outcome, startedAt, 'failed', undefined, handlerError.error);
      return {
        success: false,
        handlerId: registration.id,
        error: handlerError.error,
        registration,
        state,
        outcome,
      };
    }
  });
  const trackedHandlerPromises = context.trackHandlerPromise
    ? handlerPromises.map(promise => context.trackHandlerPromise!(promise))
    : handlerPromises;
  const winnerCandidates = runnableHandlers.some(handler => publishesResults(handler.role))
    ? trackedHandlerPromises.filter((_, index) => (
      publishesResults(runnableHandlers[index]?.role)
    ))
    : trackedHandlerPromises;
  const winner = await Promise.race(winnerCandidates);
  context.raceWinnerId = winner.handlerId;
  context.raceLoserOutcomes = (context.handlerOutcomes ?? [])
    .filter(outcome => outcome.id !== winner.handlerId)
    .map(outcome => ({ ...outcome, metadata: outcome.metadata ? { ...outcome.metadata } : undefined }));
  if (!winner.success && winner.registration?.config.errorPolicy === 'fatal') {
    (context.collectedErrors ??= []).push(handleExecutionError(
      winner.error,
      winner.registration,
    ));
    throw winner.error;
  }
  if (!winner.success) {
    (context.collectedErrors ??= []).push(handleExecutionError(
      winner.error,
      winner.registration,
    ));
  }
  if (winner.success) {
    appendLocalResults(context, winner.state, winner.result, winner.registration);
    if (winner.state.aborted) {
      context.aborted = true;
      context.abortReason = winner.state.abortReason;
    }
  }
  if (winner.success && winner.terminated) {
    context.terminated = true;
    context.terminationResult = winner.state.terminationResult;
  }
}
```

### facade/create-public-facade.ts

```typescript
import type { PublicHandleFactory } from './types.js';
function findDescriptor(target: object, key: PropertyKey): PropertyDescriptor | undefined {
  let current: object | null = target;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) return descriptor;
    current = Object.getPrototypeOf(current);
  }
  return undefined;
}
export function createPublicFacade<Element extends object, const Keys extends readonly (keyof Element)[]>(
  keys: Keys,
  detachedMessage = 'Public handle target is not available',
): PublicHandleFactory<Element, Pick<Element, Keys[number]>> {
  const uniqueKeys = Array.from(new Set(keys));
  return getElement => {
    const requireElement = (): Element => {
      const element = getElement();
      if (!element) throw new Error(detachedMessage);
      return element;
    };
    const methods = new WeakMap<Element, Map<PropertyKey, { source: unknown; bound: unknown }>>();
    const facade = {} as Pick<Element, Keys[number]>;
    for (const key of uniqueKeys) {
      Object.defineProperty(facade, key, {
        configurable: false,
        enumerable: true,
        get() {
          const element = requireElement();
          const value: unknown = Reflect.get(element, key, element);
          if (typeof value !== 'function') return value;
          let cache = methods.get(element);
          if (!cache) { cache = new Map(); methods.set(element, cache); }
          const cached = cache.get(key);
          if (cached?.source === value) return cached.bound;
          const bound = value.bind(element);
          cache.set(key, { source: value, bound });
          return bound;
        },
        set(value: unknown) {
          const element = requireElement();
          const descriptor = findDescriptor(element, key);
          if ((descriptor && !descriptor.set && !descriptor.writable) || !Reflect.set(element, key, value, element)) {
            throw new TypeError(`Cannot assign to read-only property '${String(key)}'`);
          }
        },
      });
    }
    return Object.freeze(facade);
  };
}
```

### index.ts

```typescript
export { ActionRegister } from './ActionRegister.js';
export type { PublicActionMethods } from './contracts/public-action-methods.js';
export { ActionGuard } from './action-guard.js';
export {
  ActionAttemptSupersededError,
  ActionRegisterDestroyedError,
  ActionResultProcessingError,
  ActionTimeoutError,
  ActionValidationError,
  isActionRegisterDestroyedError,
  isActionResultProcessingError,
  isActionTimeoutError,
  isActionValidationError,
} from './errors.js';
export { executeParallel, executeRace, executeSequential } from './execution-modes.js';
export { resolveHandlerConfig } from './types.js';
export type {
  ActionCommandController,
  ActionCommandHandler,
  ActionEffectController,
  ActionEffectHandler,
  CommandConfig,
  EffectConfig,
  ActionGuardController,
  ActionGuardHandler,
  ActionObserverEvent,
  ActionObserverHandler,
  ActionResultController,
  ActionDispatcher,
  ActionDispatcherWithResult,
  ActionHandler,
  ActionHandlerStats,
  ActionNames,
  ActionPayload,
  ActionResultHandler,
  ActionPayloadMap,
  ActionDispatchTrace,
  ActionDispatchTraceListener,
  ActionResult,
  ActionResultMap,
  ActionRegisterConfig,
  ActionRegistryInfo,
  ActionSchemaLike,
  DispatchArgs,
  DispatchOptions,
  ExecutionMode,
  ExecutionResult,
  HandlerConfig,
  HandlerError,
  HandlerErrorPolicy,
  HandlerExecutionOutcome,
  HandlerExecutionStatus,
  HandlerRegistration,
  HandlerRole,
  GuardConfig,
  ObserverConfig,
  HandlerScheduling,
  PipelineContext,
  PipelineController,
  ProxyActionKey,
  ReservedActionKey,
  ResolvedHandlerConfig,
  UnregisterFunction,
} from './types.js';
```
