# Context-Action Core Package - Complete Code

Total Files: 8
Total Lines: 1717

## Type Definitions

### types.ts

```typescript
export interface ActionPayloadMap {
  [actionName: string]: unknown;
}
export type ActionNames<T extends ActionPayloadMap> = keyof T;
export type ActionPayload<T extends ActionPayloadMap, K extends keyof T> = T[K];
export interface PipelineController<T = any, R = void> {
  abort(reason?: string): void;
  modifyPayload(modifier: (payload: T) => T): void;
  getPayload(): T;
  jumpToPriority(priority: number): void;
  return(result: R): void;
  setResult(result: R): void;
  getResults(): R[];
  mergeResult(merger: (previousResults: R[], currentResult: R) => R): void;
}
export type ActionHandler<T = any, R = void> = (
  payload: T,
  controller: PipelineController<T, R>
) => R | Promise<R> | void | Promise<void>;
export interface HandlerConfig {
  priority?: number;
  id?: string;
  blocking?: boolean;
  once?: boolean;
  debounce?: number;
  throttle?: number;
  replaceExisting?: boolean;
}
export interface HandlerRegistration<T = any, R = void> {
  handler: ActionHandler<T, R>;
  config: Required<HandlerConfig>;
  id: string;
}
export type ExecutionMode = 'sequential' | 'parallel' | 'race';
export interface PipelineContext<T = any, R = void> {
  action: string;
  payload: T;
  handlers: HandlerRegistration<T, R>[];
  aborted: boolean;
  abortReason: string | undefined;
  currentIndex: number;
  jumpToPriority: number | undefined;
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
    errorHandler?: (error: Error, context: unknown) => void;
  };
}
export interface DispatchOptions {
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
    custom?: (config: Required<HandlerConfig>) => boolean;
  };
  result?: {
    strategy?: 'first' | 'last' | 'all' | 'merge' | 'custom';
    merger?: <R>(results: Array<R | undefined>) => R;
    collect?: boolean;
    maxResults?: number;
    includeErrors?: boolean;
  };
}
export interface ExecutionResult<R = void> {
  success: boolean;
  aborted: boolean;
  abortReason: string | undefined;
  terminated: boolean;
  result: R | undefined;
  successResults: R[];
  results: Array<R | undefined>;
  failedResults: Array<{
    handlerId: string;
    error: Error;
    expectedType: string;
  }>;
  execution: {
    duration: number;
    handlersExecuted: number;
    handlersSkipped: number;
    handlersFailed: number;
    startTime: number;
    endTime: number;
  };
  handlers: Array<{
    id: string;
    executed: boolean;
    duration: number | undefined;
    result: R | undefined;
    error: Error | undefined;
    metadata: Record<string, any> | undefined;
  }>;
  errors: HandlerError[];
}
export interface HandlerError {
  handlerId: string;
  error: Error;
  timestamp: number;
  severity: 'blocking' | 'non-blocking';
}
export type UnregisterFunction = () => void;
type VoidActions<T extends ActionPayloadMap> = {
  [K in keyof T]: T[K] extends void | undefined ? K : never
}[keyof T];
type PayloadActions<T extends ActionPayloadMap> = {
  [K in keyof T]: T[K] extends void | undefined ? never : K
}[keyof T];
export interface ActionDispatcherWithResult<T extends ActionPayloadMap> {
  <K extends VoidActions<T>, R = any>(
    action: K,
    options?: DispatchOptions
  ): Promise<ExecutionResult<R>>;
  <K extends VoidActions<T>, R = any>(
    action: K,
    payload?: undefined,
    options?: DispatchOptions
  ): Promise<ExecutionResult<R>>;
  <K extends PayloadActions<T>, R = any>(
    action: K,
    payload: T[K],
    options?: DispatchOptions
  ): Promise<ExecutionResult<R>>;
}
export interface ActionDispatcher<T extends ActionPayloadMap> {
  <K extends VoidActions<T>>(
    action: K,
    options?: DispatchOptions
  ): Promise<void>;
  <K extends VoidActions<T>>(
    action: K,
    payload?: undefined,
    options?: DispatchOptions
  ): Promise<void>;
  <K extends PayloadActions<T>>(
    action: K,
    payload: T[K],
    options?: DispatchOptions
  ): Promise<void>;
}
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
interface GuardState {
  lastExecuted: number;
  debounceTimer: NodeJS.Timeout | undefined;
  throttleTimer: NodeJS.Timeout | undefined;
  isThrottled: boolean;
  debouncePromise: Promise<boolean> | undefined;
  debounceResolve: ((value: boolean) => void) | undefined;
}
export class ActionGuard {
  private guards = new Map<string, GuardState>();
  private cleanupInterval: NodeJS.Timeout | undefined;
  private readonly maxIdleTime: number = 60000; 
  private readonly cleanupIntervalMs: number = 30000; 
  constructor(autoCleanup: boolean = true) {
    if (autoCleanup) {
      this.startAutoCleanup();
    }
  }
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      this.guards.forEach((state, key) => {
        const isIdle = now - state.lastExecuted > this.maxIdleTime;
        const hasActiveTimers = state.debounceTimer || state.throttleTimer;
        if (isIdle && !hasActiveTimers) {
          keysToDelete.push(key);
        }
      });
      if (keysToDelete.length > 0) {
        keysToDelete.forEach(key => this.guards.delete(key));
        if (typeof process !== 'undefined' && process.env?.DEBUG_CONTEXT_ACTION) {
          console.debug(`[ActionGuard] Cleaned up ${keysToDelete.length} idle guards`);
        }
      }
    }, this.cleanupIntervalMs);
  }
  async debounce(actionKey: string, debounceMs: number): Promise<boolean> {
    let state = this.guards.get(actionKey);
    if (!state) {
      state = {
        lastExecuted: 0,
        isThrottled: false,
        debounceTimer: undefined as NodeJS.Timeout | undefined,
        throttleTimer: undefined as NodeJS.Timeout | undefined,
        debouncePromise: undefined as Promise<boolean> | undefined,
        debounceResolve: undefined as ((value: boolean) => void) | undefined,
      };
      this.guards.set(actionKey, state);
    }
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
      if (state.debounceResolve) {
        state.debounceResolve(false);
        state.debounceResolve = undefined as ((value: boolean) => void) | undefined;
      }
    }
    return new Promise<boolean>((resolve) => {
      state!.debounceResolve = resolve;
      state!.debounceTimer = setTimeout(() => {
        state!.debounceTimer = undefined as NodeJS.Timeout | undefined;
        state!.debounceResolve = undefined as ((value: boolean) => void) | undefined;
        state!.lastExecuted = Date.now();
        resolve(true);
      }, debounceMs);
    });
  }
  throttle(actionKey: string, throttleMs: number): boolean {
    let state = this.guards.get(actionKey);
    if (!state) {
      state = {
        lastExecuted: 0,
        isThrottled: false,
        debounceTimer: undefined as NodeJS.Timeout | undefined,
        throttleTimer: undefined as NodeJS.Timeout | undefined,
        debouncePromise: undefined as Promise<boolean> | undefined,
        debounceResolve: undefined as ((value: boolean) => void) | undefined,
      };
      this.guards.set(actionKey, state);
    }
    const now = Date.now();
    const timeSinceLastExecution = now - state.lastExecuted;
    if (timeSinceLastExecution >= throttleMs) {
      state.lastExecuted = now;
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
      state!.throttleTimer = undefined as NodeJS.Timeout | undefined;
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
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
        state.throttleTimer = undefined;
      }
      this.guards.delete(actionKey);
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
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
      }
    });
    this.guards.clear();
  }
  getGuardState(actionKey: string): GuardState | undefined {
    return this.guards.get(actionKey);
  }
  getAllGuardStates(): Map<string, GuardState> {
    return new Map(this.guards);
  }
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined as NodeJS.Timeout | undefined;
    }
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
import {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  HandlerRegistration,
  PipelineContext,
  PipelineController,
  ActionRegisterConfig,
  UnregisterFunction,
  ExecutionMode,
  ExecutionResult,
  ActionRegistryInfo,
  ActionHandlerStats,
  DispatchOptions,
} from './types.js';
import { executeSequential, executeParallel, executeRace } from './execution-modes.js';
import { ActionGuard } from './action-guard.js';
import { OperationQueue } from './concurrency/OperationQueue.js';
export class ActionRegister<T extends ActionPayloadMap = ActionPayloadMap> {
  private pipelines = new Map<keyof T, Array<HandlerRegistration<any, any>>>();
  private readonly actionGuard: ActionGuard;
  private executionMode: ExecutionMode = 'sequential';
  private actionExecutionModes = new Map<keyof T, ExecutionMode>();
  public readonly name: string;
  private readonly registryConfig: ActionRegisterConfig['registry'];
  private readonly isDebugMode: boolean;
  private readonly maxHandlersPerAction: number;
  private dispatchQueue?: OperationQueue;
  private filterCache = new Map<string, HandlerRegistration<any, any>[]>();
  private filterCacheMaxSize = 100; 
  constructor(config: ActionRegisterConfig = {}) {
    this.name = config.name || 'ActionRegister';
    this.registryConfig = config.registry;
    this.maxHandlersPerAction = config.registry?.maxHandlersPerAction ?? 1000;
    this.isDebugMode = Boolean(
      this.registryConfig?.debug && 
      process.env.NODE_ENV === 'development'
    );
    this.actionGuard = new ActionGuard(this.registryConfig?.autoCleanup !== false);
    if (config.registry?.useConcurrencyQueue !== false) {
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
  register<K extends keyof T, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig = {}
  ): UnregisterFunction {
    const handlerId = config.id || this.generateHandlerId(action);
    const unregisterFn = this._performRegistrationSync(action, handler, config, handlerId);
    return unregisterFn;
  }
  private log(message: string, data?: unknown, level: 'log' | 'warn' | 'error' = 'log') {
    if (this.isDebugMode) {
      const timestamp = new Date().toISOString();
      console[level](`🎯 [${timestamp}] [${this.name}] ${message}`, data || '');
    }
  }
  private generateHandlerId<K extends keyof T>(action: K): string {
    const uuid = crypto.randomUUID();
    return `${String(action)}_${uuid.slice(0, 8)}`;
  }
  private createAbortSignal(options?: DispatchOptions): [
    AbortSignal | undefined, 
    AbortController | undefined, 
    () => void
  ] {
    const signals: AbortSignal[] = [];
    const cleanups: (() => void)[] = [];
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
    if (signals.length === 1) {
      return [signals[0], autoAbortController, () => cleanups.forEach(c => c())];
    }
    let effectiveSignal: AbortSignal;
    if (typeof AbortSignal.any === 'function') {
      effectiveSignal = AbortSignal.any(signals);
    } else {
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
  private _performRegistrationSync<K extends keyof T, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig,
    handlerId: string
  ): UnregisterFunction {
    const registration: HandlerRegistration<T[K], R> = {
      handler,
      config: {
        priority: config.priority ?? 0,
        id: handlerId,
        blocking: config.blocking ?? false,
        once: config.once ?? false,
        debounce: config.debounce ?? undefined,
        throttle: config.throttle ?? undefined,
        replaceExisting: config.replaceExisting ?? false,
      } as Required<HandlerConfig>,
      id: handlerId,
    };
    if (!this.pipelines.has(action)) {
      this.pipelines.set(action, []);
    }
    const pipeline = this.pipelines.get(action)!;
    if (pipeline.length >= this.maxHandlersPerAction) {
      console.warn(`Handler limit (${this.maxHandlersPerAction}) reached for action "${String(action)}". Registration ignored.`);
      return () => {}; 
    }
    const existingIndex = pipeline.findIndex(reg => reg.id === handlerId);
    if (existingIndex !== -1) {
      if (config.replaceExisting) {
        const oldRegistration = pipeline[existingIndex];
        if (oldRegistration && typeof (oldRegistration as any).cleanup === 'function') {
          try {
            (oldRegistration as any).cleanup();
          } catch (cleanupError) {
            this.log(`Cleanup error for replaced handler: ${String(action)}`, cleanupError, 'warn');
          }
        }
        pipeline[existingIndex] = registration;
        pipeline.sort((a, b) => b.config.priority - a.config.priority);
        this.invalidateFilterCache();
        this.log(`Handler replaced: ${String(action)}`, {
          handlerId,
          priority: config.priority,
          totalHandlers: pipeline.length,
          oldHandlerCleaned: Boolean((oldRegistration as any).cleanup)
        });
        return () => {
          const index = pipeline.findIndex(reg => reg.id === handlerId && reg === registration);
          if (index !== -1) {
            pipeline.splice(index, 1);
            this.invalidateFilterCache();
            this.log(`Replaced handler unregistered: ${String(action)}`, { handlerId });
          }
        };
      } else {
        const existing = pipeline[existingIndex];
        this.log(`Handler duplicate ignored, returning existing unregister: ${String(action)}`, {
          handlerId,
          note: 'Use replaceExisting:true to replace'
        }, 'warn');
        return () => {
          const idx = pipeline.findIndex(reg => reg.id === handlerId);
          if (idx !== -1) {
            pipeline.splice(idx, 1);
            this.invalidateFilterCache();
            this.log(`Existing handler unregistered: ${String(action)}`, { handlerId });
          }
        };
      }
    }
    pipeline.push(registration);
    pipeline.sort((a, b) => b.config.priority - a.config.priority);
    this.invalidateFilterCache();
    this.log(`Handler registered: ${String(action)}`, {
      handlerId,
      priority: config.priority,
      totalHandlers: pipeline.length
    });
    this.log(`Action '${String(action)}' pipeline after registration`, {
      totalHandlers: pipeline.length,
      handlers: pipeline.map(h => ({ id: h.config.id, priority: h.config.priority })),
      pipelineExists: this.pipelines.has(action),
      canDispatch: this.hasHandlers(action)
    });
    return () => {
      const index = pipeline.findIndex((reg) => reg.id === handlerId && reg === registration);
      if (index !== -1) {
        pipeline.splice(index, 1);
        this.invalidateFilterCache();
        this.log(`Handler unregistered: ${String(action)}`, {
          handlerId,
          remainingHandlers: pipeline.length
        });
      }
    };
  }
  async dispatch<K extends keyof T>(
    action: K,
    payload?: T[K],
    options?: DispatchOptions
  ): Promise<void> {
    if (options?.immediate || !this.dispatchQueue) {
      return this._performDispatch(action, payload, options);
    } else {
      return this.dispatchQueue.enqueue(async () => {
        return this._performDispatch(action, payload, options);
      });
    }
  }
  private async _performDispatch<K extends keyof T>(
    action: K,
    payload?: T[K],
    options?: DispatchOptions
  ): Promise<void> {
    this.log(`Starting dispatch for action '${String(action)}'`, {
      hasPayload: payload !== undefined,
      payloadType: payload?.constructor?.name || typeof payload,
      options: options ? Object.keys(options) : 'none',
      timestamp: new Date().toISOString()
    });
    if (payload instanceof Event && process.env.NODE_ENV === 'development') {
      console.warn(`Event object passed to action "${String(action)}"`, payload.type);
    }
    const [effectiveSignal, autoAbortController, cleanup] = this.createAbortSignal(options);
    if (options?.autoAbort?.onControllerCreated && autoAbortController) {
      options.autoAbort.onControllerCreated(autoAbortController);
    }
    if (effectiveSignal?.aborted) {
      this.log(`Dispatch aborted before execution for '${String(action)}'`);
      return;
    }
    const pipeline = this.pipelines.get(action);
    this.log(`Pipeline lookup for '${String(action)}'`, {
      pipelineExists: Boolean(pipeline),
      handlersCount: pipeline?.length || 0,
      allRegisteredActions: Array.from(this.pipelines.keys()),
      pipelineMap: Object.fromEntries(Array.from(this.pipelines.entries()).map(([k, v]) => [k, v.length]))
    });
    if (!pipeline || pipeline.length === 0) {
      this.log(`No handlers found for action '${String(action)}', dispatch cancelled`, {}, 'warn');
      return;
    }
    const filteredHandlers = options?.filter 
      ? this.filterHandlers(pipeline, options.filter)
      : pipeline;
    const actionKey = String(action);
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
    if (debounceMs !== undefined) {
      const shouldProceed = await this.actionGuard.debounce(actionKey, debounceMs);
      if (!shouldProceed) {
        return; 
      }
    }
    if (throttleMs !== undefined) {
      const shouldProceed = this.actionGuard.throttle(actionKey, throttleMs);
      if (!shouldProceed) {
        return; 
      }
    }
    const currentExecutionMode = options?.executionMode || 
                                this.actionExecutionModes.get(action) || 
                                this.executionMode;
    const context: PipelineContext<T[K], any> = {
      action: String(action),
      payload: payload as T[K],
      handlers: filteredHandlers, 
      aborted: false,
      abortReason: undefined as string | undefined,
      currentIndex: 0,
      jumpToPriority: undefined as number | undefined,
      executionMode: currentExecutionMode,
      results: [],
      terminated: false,
      terminationResult: undefined as any,
    };
    const abortHandler = effectiveSignal ? () => {
      context.aborted = true;
      context.abortReason = 'Action dispatch aborted by signal';
    } : undefined;
    if (effectiveSignal && abortHandler) {
      effectiveSignal.addEventListener('abort', abortHandler);
    }
    try {
      await this.executePipeline(context, autoAbortController, options?.autoAbort);
      this.log(`Pipeline execution succeeded for ${String(action)}`);
    } catch (error) {
      this.log(`Pipeline execution failed for ${String(action)}`, error, 'error');
      throw error;
    } finally {
      cleanup();
    }
  }
  async dispatchWithResult<K extends keyof T, R = void>(
    action: K,
    payload?: T[K],
    options?: DispatchOptions
  ): Promise<ExecutionResult<R>> {
    const _startTime = Date.now();
    const [effectiveSignal, autoAbortController, cleanup] = this.createAbortSignal(options);
    if (options?.autoAbort?.onControllerCreated && autoAbortController) {
      options.autoAbort.onControllerCreated(autoAbortController);
    }
    if (effectiveSignal?.aborted) {
      return {
        success: false,
        aborted: true,
        abortReason: 'Action dispatch aborted by signal',
        terminated: false,
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
    const pipeline = this.pipelines.get(action);
    if (!pipeline || pipeline.length === 0) {
      return {
        success: true,
        aborted: false,
        abortReason: undefined as string | undefined,
        terminated: false,
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
    const filteredHandlers = options?.filter 
      ? this.filterHandlers(pipeline, options.filter)
      : pipeline;
    const actionKey = String(action);
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
            duration: Date.now() - _startTime,
            handlersExecuted: 0,
            handlersSkipped: pipeline.length,
            handlersFailed: 0,
            startTime: _startTime,
            endTime: Date.now(),
          },
          handlers: [],
          errors: [],
        };
      }
    }
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
            duration: Date.now() - _startTime,
            handlersExecuted: 0,
            handlersSkipped: pipeline.length,
            handlersFailed: 0,
            startTime: _startTime,
            endTime: Date.now(),
          },
          handlers: [],
          errors: [],
        };
      }
    }
    const currentExecutionMode = options?.executionMode || 
                                this.actionExecutionModes.get(action) || 
                                this.executionMode;
    const context: PipelineContext<T[K], R> = {
      action: String(action),
      payload: payload as T[K],
      handlers: filteredHandlers,
      aborted: false,
      abortReason: undefined as string | undefined,
      currentIndex: 0,
      jumpToPriority: undefined as number | undefined,
      executionMode: currentExecutionMode,
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
    const errors: Array<{
      handlerId: string;
      error: Error;
      timestamp: number;
    }> = [];
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
    const abortHandler = effectiveSignal ? () => {
      context.aborted = true;
      context.abortReason = 'Action dispatch aborted by signal';
    } : undefined;
    if (effectiveSignal && abortHandler) {
      effectiveSignal.addEventListener('abort', abortHandler);
    }
    try {
      await this.executePipeline(context, autoAbortController, options?.autoAbort);
      const executedCount = Math.min(context.currentIndex + (context.aborted ? 0 : 1), filteredHandlers.length);
      for (let i = 0; i < executedCount; i++) {
        const handler = filteredHandlers[i];
        if (!handler) continue;
        const handlerResult = handlerResults.find(hr => hr.id === handler.config.id);
        if (handlerResult) {
          handlerResult.executed = true;
        }
      }
    } catch (error) {
      executionError = error instanceof Error ? error : new Error(String(error));
      errors.push({
        handlerId: 'pipeline',
        error: executionError,
        timestamp: Date.now(),
      });
      const executedCount = Math.min(context.currentIndex + 1, filteredHandlers.length);
      for (let i = 0; i < executedCount; i++) {
        const handler = filteredHandlers[i];
        if (!handler) continue;
        const handlerResult = handlerResults.find(hr => hr.id === handler.config.id);
        if (handlerResult) {
          handlerResult.executed = true;
        }
      }
    } finally {
      cleanup();
    }
    const endTime = Date.now();
    const processedResult = this.processResults(context, options?.result);
    const successResults = context.results.filter((result): result is R => result !== undefined);
    const failedResults = errors.map(err => ({
      handlerId: err.handlerId,
      error: err.error,
      expectedType: typeof processedResult
    }));
    const executionResult: ExecutionResult<R> = {
      success: !executionError && !context.aborted,
      aborted: context.aborted,
      abortReason: context.abortReason,
      terminated: context.terminated,
      result: processedResult,
      successResults: successResults,
      results: context.results,
      failedResults,
      execution: {
        duration: endTime - _startTime,
        handlersExecuted: context.currentIndex + (context.aborted ? 0 : 1),
        handlersSkipped: Math.max(0, filteredHandlers.length - (context.currentIndex + 1)),
        handlersFailed: errors.length,
        startTime: _startTime,
        endTime,
      },
      handlers: handlerResults,
      errors: errors.map(err => ({
        handlerId: err.handlerId,
        error: err.error,
        timestamp: err.timestamp,
        severity: 'non-blocking' as const
      })),
    };
    this.cleanupOneTimeHandlers(action, context.handlers);
    return executionResult;
  }
  private generateFilterCacheKey(filterOptions?: DispatchOptions['filter']): string {
    if (!filterOptions) {
      return 'no-filter';
    }
    const key = [
      filterOptions.handlerIds?.sort().join(',') || 'none',
      filterOptions.excludeHandlerIds?.sort().join(',') || 'none',
      filterOptions.priority?.min?.toString() || 'none',
      filterOptions.priority?.max?.toString() || 'none',
      filterOptions.custom ? 'custom' : 'none'
    ].join('|');
    return key;
  }
  private invalidateFilterCache(): void {
    this.filterCache.clear();
  }
  private filterHandlers(
    handlers: HandlerRegistration<any, any>[],
    filterOptions?: DispatchOptions['filter']
  ): HandlerRegistration<any, any>[] {
    if (!filterOptions) {
      return handlers;
    }
    const cacheKey = this.generateFilterCacheKey(filterOptions);
    if (!filterOptions.custom) {
      const cached = this.filterCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    const filtered = handlers.filter(registration => {
      const config = registration.config;
      if (filterOptions.handlerIds?.length && 
          !filterOptions.handlerIds.includes(config.id)) {
        return false;
      }
      if (filterOptions.excludeHandlerIds?.length && 
          filterOptions.excludeHandlerIds.includes(config.id)) {
        return false;
      }
      if (filterOptions.priority) {
        if (filterOptions.priority.min !== undefined && 
            config.priority < filterOptions.priority.min) {
          return false;
        }
        if (filterOptions.priority.max !== undefined && 
            config.priority > filterOptions.priority.max) {
          return false;
        }
      }
      if (filterOptions.custom && !filterOptions.custom(config)) {
        return false;
      }
      return true;
    });
    if (!filterOptions.custom) {
      if (this.filterCache.size >= this.filterCacheMaxSize) {
        const firstKey = this.filterCache.keys().next().value;
        if (firstKey) {
          this.filterCache.delete(firstKey);
        }
      }
      this.filterCache.set(cacheKey, filtered);
    }
    return filtered;
  }
  private processResults<R>(
    context: PipelineContext<any, R>,
    resultOptions?: DispatchOptions['result']
  ): R | undefined {
    if (!resultOptions || !resultOptions.collect) {
      return undefined;
    }
    const results = context.results;
    if (context.terminated && context.terminationResult !== undefined) {
      return context.terminationResult;
    }
    const limitedResults = resultOptions.maxResults 
      ? results.slice(0, resultOptions.maxResults)
      : results;
    if (limitedResults.length === 0) {
      return undefined;
    }
    switch (resultOptions.strategy) {
      case 'first':
        return limitedResults[0];
      case 'last':
        return limitedResults[limitedResults.length - 1];
      case 'all':
        return limitedResults as unknown as R;
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
        return limitedResults as unknown as R;
    }
  }
  private async executePipeline<K extends keyof T>(
    context: PipelineContext<T[K], any>, 
    autoAbortController?: AbortController,
    autoAbortOptions?: { allowHandlerAbort?: boolean }
  ): Promise<void> {
    const createController = (_registration: HandlerRegistration<T[K], any>, _index: number): PipelineController<T[K], any> => {
      return {
        abort: (reason?: string) => {
          context.aborted = true;
          context.abortReason = reason;
          if (autoAbortController && autoAbortOptions?.allowHandlerAbort) {
            autoAbortController.abort(reason);
          }
        },
        modifyPayload: (modifier: (payload: T[K]) => T[K]) => {
          context.payload = modifier(context.payload);
        },
        getPayload: () => context.payload,
        jumpToPriority: (priority: number) => {
          context.jumpToPriority = priority;
        },
        return: (result: any) => {
          context.terminated = true;
          context.terminationResult = result;
        },
        setResult: (result: any) => {
          context.results.push(result);
        },
        getResults: () => {
          return [...context.results];
        },
        mergeResult: (merger: (previousResults: any[], currentResult: any) => any) => {
          const currentResult = context.results[context.results.length - 1];
          const previousResults = context.results.slice(0, -1);
          const mergedResult = merger(previousResults, currentResult);
          context.results[context.results.length - 1] = mergedResult;
        },
      };
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
    this.cleanupOneTimeHandlers(context.action as K, context.handlers);
  }
  private cleanupOneTimeHandlers<K extends keyof T>(action: K, executedHandlers: HandlerRegistration<any, any>[]): void {
    const pipeline = this.pipelines.get(action);
    if (!pipeline) return;
    const oneTimeHandlers = executedHandlers.filter(reg => reg.config.once);
    if (oneTimeHandlers.length === 0) return;
    oneTimeHandlers.forEach(registration => {
      const index = pipeline.findIndex(reg => reg.id === registration.id);
      if (index !== -1) {
        pipeline.splice(index, 1);
        if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
          console.log(`🎯 One-time handler removed: ${String(action)}`, {
            handlerId: registration.id,
            remainingHandlers: pipeline.length,
            registry: this.name
          });
        }
      }
    });
  }
  getHandlerCount<K extends keyof T>(action: K): number {
    const pipeline = this.pipelines.get(action);
    return pipeline ? pipeline.length : 0;
  }
  hasHandlers<K extends keyof T>(action: K): boolean {
    return this.getHandlerCount(action) > 0;
  }
  getRegisteredActions(): (keyof T)[] {
    return Array.from(this.pipelines.keys());
  }
  clearAction<K extends keyof T>(action: K): void {
    this.pipelines.delete(action);
    this.invalidateFilterCache();
  }
  clearAll(): void {
    this.pipelines.clear();
    this.invalidateFilterCache();
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
  getActionStats<K extends keyof T>(action: K): ActionHandlerStats<T> | null {
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
    };
  }
  getAllActionStats(): Array<ActionHandlerStats<T>> {
    return Array.from(this.pipelines.keys())
      .map(action => this.getActionStats(action))
      .filter((stats): stats is ActionHandlerStats<T> => stats !== null);
  }
  setActionExecutionMode<K extends keyof T>(action: K, mode: ExecutionMode): void {
    this.actionExecutionModes.set(action, mode);
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
      console.log(`🎯 Execution mode set for action '${String(action)}': ${mode}`);
    }
  }
  getActionExecutionMode<K extends keyof T>(action: K): ExecutionMode {
    return this.actionExecutionModes.get(action) || this.executionMode;
  }
  removeActionExecutionMode<K extends keyof T>(action: K): void {
    this.actionExecutionModes.delete(action);
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
      console.log(`🎯 Execution mode reset for action '${String(action)}' to default: ${this.executionMode}`);
    }
  }
  getRegistryConfig(): ActionRegisterConfig['registry'] {
    return this.registryConfig;
  }
  isDebugEnabled(): boolean {
    return this.isDebugMode;
  }
  destroy(): void {
    this.pipelines.clear();
    this.actionGuard.destroy();
    this.dispatchQueue?.clear?.();
    this.actionExecutionModes.clear();
    this.filterCache.clear();
    this.log('ActionRegister destroyed');
  }
}
```

### concurrency/index.ts

```typescript
export { OperationQueue } from './OperationQueue';
export type { QueuedOperation } from './OperationQueue';
```

### concurrency/OperationQueue.ts

```typescript
export interface QueuedOperation<T = any> {
  id: string;
  operation: () => T | Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  priority?: number;
  timestamp: number;
}
export class OperationQueue {
  private queue: QueuedOperation[] = [];
  private processingPromise: Promise<void> | null = null;
  private operationCounter = 0;
  private activeOperations = 0;
  private readonly maxConcurrency: number;
  private readonly runningOperations = new Set<Promise<any>>();
  constructor(
    private name: string = 'OperationQueue', 
    maxConcurrency: number = 1
  ) {
    this.maxConcurrency = Math.max(1, maxConcurrency);
  }
  enqueue<T>(operation: () => T | Promise<T>, priority: number = 0): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queuedOperation: QueuedOperation<T> = {
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
      this.queue.splice(insertIndex, 0, queuedOperation);
      this.processQueue();
    });
  }
  private async processQueue(): Promise<void> {
    if (this.processingPromise) {
      return this.processingPromise;
    }
    this.processingPromise = this._doProcess();
    try {
      await this.processingPromise;
    } finally {
      this.processingPromise = null;
    }
  }
  private async _doProcess(): Promise<void> {
    while (this.queue.length > 0 || this.runningOperations.size > 0) {
      while (this.queue.length > 0 && this.activeOperations < this.maxConcurrency) {
        const operation = this.queue.shift()!;
        this.activeOperations++;
        const operationPromise = this.executeOperation(operation);
        this.runningOperations.add(operationPromise);
        operationPromise.finally(() => {
          this.activeOperations--;
          this.runningOperations.delete(operationPromise);
        });
      }
      if (this.runningOperations.size > 0) {
        await Promise.race(this.runningOperations);
      }
    }
  }
  private async executeOperation<T>(operation: QueuedOperation<T>): Promise<void> {
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
      runningOperationsCount: this.runningOperations.size,
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
  clear(): void {
    this.queue.forEach(operation => {
      operation.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.processingPromise = null;
  }
  get size(): number {
    return this.queue.length;
  }
  get processing(): boolean {
    return Boolean(this.processingPromise);
  }
}
```

### execution-modes.ts

```typescript
import type { 
  HandlerRegistration, 
  PipelineContext, 
  PipelineController,
  HandlerError
} from './types.js';
function handleExecutionError<T, R>(
  error: any,
  registration: HandlerRegistration<T, R>
): HandlerError {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  return {
    handlerId: registration.id,
    error: errorObj,
    timestamp: Date.now(),
    severity: registration.config.blocking ? 'blocking' : 'non-blocking'
  };
}
export async function executeSequential<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void> {
  let i = 0;
  const nonBlockingPromises: Array<Promise<any>> = [];
  const errors: Array<{ handlerId: string; error: Error; timestamp: number }> = [];
  while (i < context.handlers.length) {
    if (context.aborted || context.terminated) {
      break;
    }
    const registration = context.handlers[i];
    if (!registration) {
      continue; 
    }
    context.currentIndex = i;
    const controller = createController(registration, i);
    try {
      if (context.aborted) {
        break;
      }
      const result = registration.handler(context.payload, controller);
      if (registration.config.blocking) {
        const handlerResult = result instanceof Promise ? await result : result;
        if (handlerResult !== undefined && !context.terminated) {
          context.results.push(handlerResult as R);
        }
      } else {
        if (result instanceof Promise) {
          const promiseWithErrorHandling = result
            .then(asyncResult => {
              if (asyncResult !== undefined && !context.terminated) {
                context.results.push(asyncResult as R);
              }
              return asyncResult;
            })
            .catch(error => {
              const handlerError = handleExecutionError(error, registration);
              errors.push({
                handlerId: handlerError.handlerId,
                error: handlerError.error,
                timestamp: handlerError.timestamp
              });
              return undefined; 
            });
          nonBlockingPromises.push(promiseWithErrorHandling);
        } else if (result !== undefined && !context.terminated) {
          context.results.push(result as R);
        }
      }
      if (context.terminated) {
        break;
      }
      if (context.jumpToPriority !== undefined) {
        const jumpIndex = context.handlers.findIndex(
          handler => handler.config.priority === context.jumpToPriority
        );
        if (jumpIndex !== -1) {
          i = jumpIndex;
          context.jumpToPriority = undefined;
          continue;
        } else {
          context.jumpToPriority = undefined;
          i++;
        }
      } else {
        i++;
      }
    } catch (error: any) {
      const handlerError = handleExecutionError(error, registration);
      throw handlerError.error;
    }
  }
  if (nonBlockingPromises.length > 0) {
    await Promise.allSettled(nonBlockingPromises);
  }
  if (errors.length > 0) {
    const handlerErrors: HandlerError[] = errors.map(err => ({
      handlerId: err.handlerId,
      error: err.error,
      timestamp: err.timestamp,
      severity: 'non-blocking' as const
    }));
    (context as PipelineContext<any, any> & { collectedErrors?: HandlerError[] }).collectedErrors = handlerErrors;
  }
}
export async function executeParallel<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void> {
  const runnableHandlers = context.handlers;
  const handlerPromises = runnableHandlers.map(async (registration, _index) => {
    const controller = createController(registration, _index);
    try {
      const result = registration.handler(context.payload, controller);
      let handlerResult: R | undefined;
      if (result instanceof Promise) {
        const resolved = await result;
        handlerResult = resolved as R | undefined;
      } else {
        handlerResult = result as R | undefined;
      }
      if (handlerResult !== undefined && !context.terminated) {
        context.results.push(handlerResult);
      }
      return { 
        success: true, 
        handlerId: registration.id, 
        result: handlerResult,
        terminated: context.terminated 
      };
    } catch (error: any) {
      const handlerError = handleExecutionError(error, registration);
      if (handlerError.severity === 'blocking') {
        throw handlerError.error;
      }
      return { success: false, handlerId: registration.id, error: handlerError.error };
    }
  });
  const results = await Promise.allSettled(handlerPromises);
  const failures = results.filter((result, index) => {
    if (result.status === 'rejected') {
      const registration = runnableHandlers[index];
      return registration?.config.blocking ?? false;
    }
    return false;
  });
  if (failures.length > 0) {
    const firstFailure = failures[0] as PromiseRejectedResult;
    throw firstFailure.reason;
  }
  const terminatedResults = results.filter(result => 
    result.status === 'fulfilled' && result.value.terminated
  );
  if (terminatedResults.length > 0) {
    context.terminated = true;
    const firstTerminated = terminatedResults[0] as PromiseFulfilledResult<any>;
    context.terminationResult = firstTerminated.value.result;
  }
}
export async function executeRace<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void> {
  const runnableHandlers = context.handlers;
  if (runnableHandlers.length === 0) {
    return;
  }
  const handlerPromises = runnableHandlers.map(async (registration, _index) => {
    const controller = createController(registration, _index);
    try {
      const result = registration.handler(context.payload, controller);
      let handlerResult: R | undefined;
      if (result instanceof Promise) {
        const resolved = await result;
        handlerResult = resolved as R | undefined;
      } else {
        handlerResult = result as R | undefined;
      }
      return { 
        success: true, 
        handlerId: registration.id, 
        registration,
        result: handlerResult,
        terminated: context.terminated
      };
    } catch (error: any) {
      const handlerError = handleExecutionError(error, registration);
      return { success: false, handlerId: registration.id, error: handlerError.error, registration };
    }
  });
  const winner = await Promise.race(handlerPromises);
  if (!winner.success && winner.registration?.config.blocking) {
    throw winner.error;
  }
  if (winner.success && winner.result !== undefined) {
    context.results.push(winner.result);
  }
  if (winner.success && winner.terminated) {
    context.terminated = true;
    context.terminationResult = winner.result;
  }
}
```

### index.ts

```typescript
export { ActionRegister } from './ActionRegister.js';
export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  HandlerRegistration,
  PipelineContext,
  PipelineController,
  ActionRegisterConfig,
  UnregisterFunction,
  ActionDispatcher,
  ExecutionMode,
  DispatchOptions,
  ExecutionResult,
} from './types.js';
export { ActionGuard } from './action-guard.js';
export { executeSequential, executeParallel, executeRace } from './execution-modes.js';
export {
  createActionHandler,
  createReactHandlerConfig,
  createReactDispatcher,
  ReactDevUtils,
  ReactActionError,
  isReactActionError
} from './react-helpers.js';
```

### react-helpers.ts

```typescript
import type { 
  ActionPayloadMap, 
  ActionHandler, 
  HandlerConfig,
  UnregisterFunction
} from './types.js';
import type { ActionRegister } from './ActionRegister.js';
export function createActionHandler<T extends ActionPayloadMap, K extends keyof T>(
  registry: ActionRegister<T>,
  action: K,
  handler: ActionHandler<T[K]>,
  config?: HandlerConfig
): {
  register: () => UnregisterFunction;
  unregister: () => void;
  registerWithCleanup: () => () => void;
  config: Required<HandlerConfig>;
} {
  const finalConfig = createReactHandlerConfig(String(action), undefined, config);
  let currentUnregister: UnregisterFunction | undefined;
  let isRegistered = false;
  return {
    register(): UnregisterFunction {
      if (isRegistered && currentUnregister) {
        currentUnregister();
      }
      currentUnregister = registry.register(action, handler, finalConfig);
      isRegistered = true;
      return currentUnregister;
    },
    unregister(): void {
      if (isRegistered && currentUnregister) {
        currentUnregister();
        currentUnregister = undefined;
        isRegistered = false;
      }
    },
    registerWithCleanup(): () => void {
      const unregisterFn = this.register();
      return () => {
        unregisterFn();
        this.unregister();
      };
    },
    config: finalConfig
  };
}
export function createReactHandlerConfig(
  action: string,
  componentId?: string,
  config: HandlerConfig = {}
): Required<HandlerConfig> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  return {
    priority: config.priority ?? 0,
    id: config.id || `${componentId || 'react'}_${action}_${timestamp}_${random}`,
    blocking: config.blocking ?? false,
    once: config.once ?? false,
    debounce: config.debounce ?? undefined,
    throttle: config.throttle ?? undefined,
    replaceExisting: true, 
  } as Required<HandlerConfig>;
}
export function createReactDispatcher<T extends ActionPayloadMap>(
  registry: ActionRegister<T>,
  errorHandler?: (error: Error, action: keyof T, payload?: any) => void
) {
  return async <K extends keyof T>(
    action: K,
    payload?: T[K],
    options?: Parameters<ActionRegister<T>['dispatch']>[2]
  ): Promise<void> => {
    try {
      await registry.dispatch(action, payload, {
        immediate: false, 
        ...options
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      if (errorHandler) {
        errorHandler(errorObj, action, payload);
      } else {
        console.error(`[ActionRegister] Dispatch failed for action '${String(action)}':`, errorObj);
      }
    }
  };
}
export const ReactDevUtils = {
  enableDebugMode(): void {
    if (typeof window !== 'undefined') {
      (window as any).__CONTEXT_ACTION_REACT_DEBUG__ = true;
    }
  },
  disableDebugMode(): void {
    if (typeof window !== 'undefined') {
      (window as any).__CONTEXT_ACTION_REACT_DEBUG__ = false;
    }
  },
  isDebugMode(): boolean {
    return typeof window !== 'undefined' && 
           Boolean((window as any).__CONTEXT_ACTION_REACT_DEBUG__);
  },
  log(component: string, action: string, message: string, data?: any): void {
    if (this.isDebugMode()) {
      console.log(`🎯 [React-ActionRegister] [${component}] ${action}: ${message}`, data || '');
    }
  },
  getStats(registry: ActionRegister<any>): {
    totalHandlers: number;
    reactHandlers: number;
    registryInfo: ReturnType<ActionRegister<any>['getRegistryInfo']>;
  } {
    const registryInfo = registry.getRegistryInfo();
    let reactHandlers = 0;
    registry.getRegisteredActions().forEach((action: keyof any) => {
      const stats = registry.getActionStats(action);
      if (stats) {
        stats.handlersByPriority.forEach((priorityGroup: any) => {
          priorityGroup.handlers.forEach((handler: any) => {
            if (handler.id.includes('react')) {
              reactHandlers++;
            }
          });
        });
      }
    });
    return {
      totalHandlers: registryInfo.totalHandlers,
      reactHandlers,
      registryInfo
    };
  }
};
export class ReactActionError extends Error {
  public readonly action: string;
  public readonly payload?: any;
  public readonly handlerId: string | undefined;
  public readonly timestamp: number;
  constructor(
    message: string,
    action: string,
    payload?: any,
    handlerId: string | undefined = undefined,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ReactActionError';
    this.action = action;
    this.payload = payload;
    this.handlerId = handlerId;
    this.timestamp = Date.now();
    if (originalError && originalError.stack) {
      this.stack = originalError.stack;
    }
  }
  static fromActionError(
    originalError: Error,
    action: string,
    payload?: any,
    handlerId?: string
  ): ReactActionError {
    return new ReactActionError(
      `Action '${action}' failed: ${originalError.message}`,
      action,
      payload,
      handlerId,
      originalError
    );
  }
}
export function isReactActionError(error: any): error is ReactActionError {
  return error instanceof ReactActionError;
}
```
