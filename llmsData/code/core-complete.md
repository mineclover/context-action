# Context-Action Core Package - Complete Code

Total Files: 7
Total Lines: 1289

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
  abortReason?: string;
  currentIndex: number;
  jumpToPriority?: number;
  executionMode: ExecutionMode;
  results: R[];
  terminated: boolean;
  terminationResult?: R;
}
export interface ActionRegisterConfig {
  name?: string;
  registry?: {
    debug?: boolean;
    autoCleanup?: boolean;
    maxHandlers?: number;
    defaultExecutionMode?: ExecutionMode;
  };
}
export interface DispatchOptions {
  debounce?: number;
  throttle?: number;
  executionMode?: ExecutionMode;
  signal?: AbortSignal;
  autoAbort?: {
    enabled: boolean;
    onControllerCreated?: (controller: AbortController) => void;
    allowHandlerAbort?: boolean;
  };
  filter?: {
    handlerIds?: string[];
    excludeHandlerIds?: string[];
    custom?: (config: Required<HandlerConfig>) => boolean;
  };
  result?: {
    strategy?: 'first' | 'last' | 'all' | 'merge' | 'custom';
    merger?: <R>(results: Array<R | undefined>) => R;
    collect?: boolean;
    maxResults?: number;
  };
}
export interface ExecutionResult<R = void> {
  success: boolean;
  aborted: boolean;
  abortReason?: string;
  terminated: boolean;
  result?: R;
  results: Array<R | undefined>;
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
    duration?: number;
    result?: R;
    error?: Error;
    metadata?: Record<string, any>;
  }>;
  errors: Array<{
    handlerId: string;
    error: Error;
    timestamp: number;
  }>;
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
  executionStats?: {
    totalExecutions: number;
    averageDuration: number;
    successRate: number;
    errorCount: number;
  };
}
```

## Implementation Code

### action-guard.ts

```typescript
interface GuardState {
  lastExecuted: number;
  debounceTimer?: NodeJS.Timeout;
  throttleTimer?: NodeJS.Timeout;
  isThrottled: boolean;
  debouncePromise?: Promise<boolean>;
  debounceResolve?: (value: boolean) => void;
}
export class ActionGuard {
  private guards = new Map<string, GuardState>();
  constructor() {
  }
  async debounce(actionKey: string, debounceMs: number): Promise<boolean> {
    let state = this.guards.get(actionKey);
    if (!state) {
      state = {
        lastExecuted: 0,
        isThrottled: false
      };
      this.guards.set(actionKey, state);
    }
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
      if (state.debounceResolve) {
        state.debounceResolve(false);
        state.debounceResolve = undefined;
      }
    }
    return new Promise<boolean>((resolve) => {
      state!.debounceResolve = resolve;
      state!.debounceTimer = setTimeout(() => {
        state!.debounceTimer = undefined;
        state!.debounceResolve = undefined;
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
        isThrottled: false
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
        }
      }
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
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
} from './types.js';
import { executeSequential, executeParallel, executeRace } from './execution-modes.js';
import { ActionGuard } from './action-guard.js';
import { OperationQueue } from './concurrency/OperationQueue.js';
export class ActionRegister<T extends ActionPayloadMap = ActionPayloadMap> {
  private pipelines = new Map<keyof T, HandlerRegistration<any, any>[]>();
  private handlerCounter = 0;
  private readonly actionGuard: ActionGuard;
  private executionMode: ExecutionMode = 'sequential';
  private actionExecutionModes = new Map<keyof T, ExecutionMode>();
  public readonly name: string;
  private readonly registryConfig: ActionRegisterConfig['registry'];
  private executionStats = new Map<keyof T, {
    totalExecutions: number;
    totalDuration: number;
    successCount: number;
    errorCount: number;
  }>();
  private registrationQueue: OperationQueue;
  private dispatchQueue: OperationQueue;
  constructor(config: ActionRegisterConfig = {}) {
    this.name = config.name || 'ActionRegister';
    this.registryConfig = config.registry;
    this.actionGuard = new ActionGuard();
    this.registrationQueue = new OperationQueue(`${this.name}-Registration`);
    this.dispatchQueue = new OperationQueue(`${this.name}-Dispatch`);
    if (this.registryConfig?.defaultExecutionMode) {
      this.executionMode = this.registryConfig.defaultExecutionMode;
    }
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
      console.log(`🎯 ActionRegister created: ${this.name}`, {
        defaultExecutionMode: this.executionMode,
        maxHandlers: this.registryConfig.maxHandlers,
        autoCleanup: this.registryConfig.autoCleanup ?? true,
        concurrencyProtection: true 
      });
    }
  }
  register<K extends keyof T, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig = {}
  ): UnregisterFunction {
    const handlerId = config.id || `handler_${++this.handlerCounter}_${Math.random().toString(36).substr(2, 5)}`;
    const unregisterFn = this._performRegistrationSync(action, handler, config, handlerId);
    return unregisterFn;
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
      } as Required<HandlerConfig>,
      id: handlerId,
    };
    if (!this.pipelines.has(action)) {
      this.pipelines.set(action, []);
    }
    const pipeline = this.pipelines.get(action)!;
    const existingIndex = pipeline.findIndex(reg => reg.id === handlerId);
    if (existingIndex !== -1) {
      return () => {};
    }
    if (this.registryConfig?.maxHandlers && pipeline.length >= this.registryConfig.maxHandlers) {
      throw new Error(
        `Maximum number of handlers (${this.registryConfig.maxHandlers}) reached for action '${String(action)}' in registry '${this.name}'`
      );
    }
    pipeline.push(registration);
    pipeline.sort((a, b) => b.config.priority - a.config.priority);
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
      console.log(`🎯 Handler registered: ${String(action)}`, {
        handlerId,
        priority: config.priority,
        totalHandlers: pipeline.length,
        registry: this.name
      });
    }
    return () => {
      const index = pipeline.findIndex((reg) => reg.id === handlerId && reg === registration);
      if (index !== -1) {
        pipeline.splice(index, 1);
        if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
          console.log(`🎯 Handler unregistered: ${String(action)}`, {
            handlerId,
            remainingHandlers: pipeline.length,
            registry: this.name
          });
        }
      }
    };
  }
  async dispatch<K extends keyof T>(
    action: K,
    payload?: T[K],
    options?: import('./types.js').DispatchOptions
  ): Promise<void> {
    return this.dispatchQueue.enqueue(async () => {
      return this._performDispatch(action, payload, options);
    });
  }
  private async _performDispatch<K extends keyof T>(
    action: K,
    payload?: T[K],
    options?: import('./types.js').DispatchOptions
  ): Promise<void> {
    if (payload && typeof payload === 'object' && payload !== null && 
        (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')) {
      const isEvent = payload instanceof Event;
      const isElement = payload instanceof Element;
      const hasPreventDefault = typeof (payload as any).preventDefault === 'function';
      const hasStopPropagation = typeof (payload as any).stopPropagation === 'function';
      const hasCurrentTarget = (payload as any).currentTarget !== undefined;
      const hasTarget = (payload as any).target !== undefined;
      const targetType = hasTarget ? typeof (payload as any).target : 'undefined';
      const targetIsElement = hasTarget ? (payload as any).target instanceof Element : false;
      const hasUnexpectedStructure = false; 
      if (hasUnexpectedStructure) {
        console.warn(
          `[Context-Action] 🔍 Object analysis for action "${String(action)}" in registry "${this.name}":`,
          {
            isEvent,
            isElement, 
            hasPreventDefault,
            hasStopPropagation,
            hasCurrentTarget,
            hasTarget,
            targetType,
            targetIsElement,
            payloadType: typeof payload,
            constructor: payload?.constructor?.name,
            keys: Object.keys(payload),
            payload: payload
          }
        );
      }
      if ((typeof process !== 'undefined' && process.env?.DEBUG_CONTEXT_ACTION) || 
          (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')) {
        const nestedDOMProperties: string[] = [];
        Object.keys(payload).forEach(key => {
          const prop = (payload as any)[key];
          if (prop instanceof Element || prop instanceof Event) {
            nestedDOMProperties.push(`${key}: ${prop instanceof Element ? 'Element' : 'Event'}`);
          }
        });
        if (nestedDOMProperties.length > 0) {
          console.debug(
            `[Context-Action] 📋 Nested DOM objects in action "${String(action)}":`,
            {
              registry: this.name,
              nestedDOMProperties,
              note: 'This is informational - usually not a problem'
            }
          );
        }
      }
    }
    let autoAbortController: AbortController | undefined;
    let effectiveSignal = options?.signal;
    if (options?.autoAbort?.enabled) {
      autoAbortController = new AbortController();
      effectiveSignal = autoAbortController.signal;
      if (options.autoAbort.onControllerCreated) {
        options.autoAbort.onControllerCreated(autoAbortController);
      }
      if (options?.signal) {
        const originalSignal = options.signal;
        if (originalSignal.aborted) {
          autoAbortController.abort();
        } else {
          const abortHandler = () => autoAbortController!.abort();
          originalSignal.addEventListener('abort', abortHandler, { once: true });
        }
      }
    }
    if (effectiveSignal?.aborted) {
      return;
    }
    const pipeline = this.pipelines.get(action);
    if (!pipeline || pipeline.length === 0) {
      return;
    }
    const filteredHandlers = this.filterHandlers([...pipeline], options?.filter);
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
      abortReason: undefined,
      currentIndex: 0,
      jumpToPriority: undefined,
      executionMode: currentExecutionMode,
      results: [],
      terminated: false,
      terminationResult: undefined,
    };
    const startTime = Date.now();
    let executionSuccess = true;
    const abortHandler = effectiveSignal ? () => {
      context.aborted = true;
      context.abortReason = 'Action dispatch aborted by signal';
    } : undefined;
    if (effectiveSignal && abortHandler) {
      effectiveSignal.addEventListener('abort', abortHandler);
    }
    try {
      await this.executePipeline(context, autoAbortController, options?.autoAbort);
      console.log(`[ActionRegister] Pipeline execution succeeded for ${String(action)}`);
    } catch (error) {
      console.log(`[ActionRegister] Pipeline execution failed for ${String(action)}:`, error);
      executionSuccess = false;
      throw error;
    } finally {
      if (effectiveSignal && abortHandler) {
        effectiveSignal.removeEventListener('abort', abortHandler);
      }
      const duration = Date.now() - startTime;
      this.updateExecutionStats(action, executionSuccess, duration);
    }
  }
  async dispatchWithResult<K extends keyof T, R = void>(
    action: K,
    payload?: T[K],
    options?: import('./types.js').DispatchOptions
  ): Promise<ExecutionResult<R>> {
    const startTime = Date.now();
    let autoAbortController: AbortController | undefined;
    let effectiveSignal = options?.signal;
    if (options?.autoAbort?.enabled) {
      autoAbortController = new AbortController();
      effectiveSignal = autoAbortController.signal;
      if (options.autoAbort.onControllerCreated) {
        options.autoAbort.onControllerCreated(autoAbortController);
      }
      if (options?.signal) {
        const originalSignal = options.signal;
        if (originalSignal.aborted) {
          autoAbortController.abort();
        } else {
          const abortHandler = () => autoAbortController!.abort();
          originalSignal.addEventListener('abort', abortHandler, { once: true });
        }
      }
    }
    if (effectiveSignal?.aborted) {
      return {
        success: false,
        aborted: true,
        abortReason: 'Action dispatch aborted by signal',
        terminated: false,
        result: undefined,
        results: [],
        execution: {
          duration: 0,
          handlersExecuted: 0,
          handlersSkipped: 0,
          handlersFailed: 0,
          startTime,
          endTime: startTime,
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
        terminated: false,
        result: undefined,
        results: [],
        execution: {
          duration: 0,
          handlersExecuted: 0,
          handlersSkipped: 0,
          handlersFailed: 0,
          startTime,
          endTime: startTime,
        },
        handlers: [],
        errors: [],
      };
    }
    const filteredHandlers = this.filterHandlers([...pipeline], options?.filter);
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
          result: undefined,
          results: [],
          execution: {
            duration: Date.now() - startTime,
            handlersExecuted: 0,
            handlersSkipped: pipeline.length,
            handlersFailed: 0,
            startTime,
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
          result: undefined,
          results: [],
          execution: {
            duration: Date.now() - startTime,
            handlersExecuted: 0,
            handlersSkipped: pipeline.length,
            handlersFailed: 0,
            startTime,
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
      abortReason: undefined,
      currentIndex: 0,
      jumpToPriority: undefined,
      executionMode: currentExecutionMode,
      results: [],
      terminated: false,
      terminationResult: undefined,
    };
    let executionError: Error | undefined;
    const handlerResults: Array<{
      id: string;
      executed: boolean;
      duration?: number;
      result?: R;
      error?: Error;
      metadata?: Record<string, any>;
    }> = [];
    const errors: Array<{
      handlerId: string;
      error: Error;
      timestamp: number;
    }> = [];
    const abortHandler = effectiveSignal ? () => {
      context.aborted = true;
      context.abortReason = 'Action dispatch aborted by signal';
    } : undefined;
    if (effectiveSignal && abortHandler) {
      effectiveSignal.addEventListener('abort', abortHandler);
    }
    try {
      await this.executePipeline(context, autoAbortController, options?.autoAbort);
    } catch (error) {
      executionError = error instanceof Error ? error : new Error(String(error));
      errors.push({
        handlerId: 'pipeline',
        error: executionError,
        timestamp: Date.now(),
      });
    } finally {
      if (effectiveSignal && abortHandler) {
        effectiveSignal.removeEventListener('abort', abortHandler);
      }
    }
    const endTime = Date.now();
    const executionSuccess = !executionError && !context.aborted;
    this.updateExecutionStats(action, executionSuccess, endTime - startTime);
    const processedResult = this.processResults(context, options?.result);
    const executionResult: ExecutionResult<R> = {
      success: !executionError && !context.aborted,
      aborted: context.aborted,
      abortReason: context.abortReason,
      terminated: context.terminated,
      result: processedResult,
      results: context.results,
      execution: {
        duration: endTime - startTime,
        handlersExecuted: context.currentIndex + (context.aborted ? 0 : 1),
        handlersSkipped: Math.max(0, filteredHandlers.length - (context.currentIndex + 1)),
        handlersFailed: errors.length,
        startTime,
        endTime,
      },
      handlers: handlerResults,
      errors,
    };
    this.cleanupOneTimeHandlers(action, context.handlers);
    return executionResult;
  }
  private filterHandlers<K extends keyof T>(
    handlers: HandlerRegistration<T[K], any>[],
    filterOptions?: import('./types.js').DispatchOptions['filter']
  ): HandlerRegistration<T[K], any>[] {
    if (!filterOptions) {
      return handlers;
    }
    return handlers.filter(registration => {
      const config = registration.config;
      if (filterOptions.handlerIds && filterOptions.handlerIds.length > 0) {
        if (!filterOptions.handlerIds.includes(config.id)) {
          return false;
        }
      }
      if (filterOptions.excludeHandlerIds && filterOptions.excludeHandlerIds.length > 0) {
        if (filterOptions.excludeHandlerIds.includes(config.id)) {
          return false;
        }
      }
      if (filterOptions.custom && !filterOptions.custom(config)) {
        return false;
      }
      return true;
    });
  }
  private processResults<R>(
    context: PipelineContext<any, R>,
    resultOptions?: import('./types.js').DispatchOptions['result']
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
  private cleanupOneTimeHandlers<K extends keyof T>(action: K, executedHandlers: HandlerRegistration<T[K], any>[]): void {
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
  private updateExecutionStats<K extends keyof T>(action: K, success: boolean, duration: number): void {
    if (!this.executionStats.has(action)) {
      this.executionStats.set(action, {
        totalExecutions: 0,
        totalDuration: 0,
        successCount: 0,
        errorCount: 0,
      });
    }
    const stats = this.executionStats.get(action)!;
    stats.totalExecutions++;
    stats.totalDuration += duration;
    if (success) {
      stats.successCount++;
    } else {
      stats.errorCount++;
    }
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
  }
  clearAll(): void {
    this.pipelines.clear();
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
    const stats = this.executionStats.get(action);
    const executionStats = stats ? {
      totalExecutions: stats.totalExecutions,
      averageDuration: stats.totalExecutions > 0 ? stats.totalDuration / stats.totalExecutions : 0,
      successRate: stats.totalExecutions > 0 ? (stats.successCount / stats.totalExecutions) * 100 : 0,
      errorCount: stats.errorCount,
    } : undefined;
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
  clearExecutionStats(): void {
    this.executionStats.clear();
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
      console.log(`🎯 Execution statistics cleared for registry: ${this.name}`);
    }
  }
  clearActionExecutionStats<K extends keyof T>(action: K): void {
    this.executionStats.delete(action);
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
      console.log(`🎯 Execution statistics cleared for action: ${String(action)}`);
    }
  }
  getRegistryConfig(): ActionRegisterConfig['registry'] {
    return this.registryConfig;
  }
  isDebugEnabled(): boolean {
    return Boolean(this.registryConfig?.debug && process.env.NODE_ENV === 'development');
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
  reject: (error: any) => void;
  priority?: number;
  timestamp: number;
}
export class OperationQueue {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private operationCounter = 0;
  constructor(private name: string = 'OperationQueue') {}
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
        if ((this.queue[i].priority || 0) < priority) {
          insertIndex = i;
          break;
        }
      }
      this.queue.splice(insertIndex, 0, queuedOperation);
      this.processQueue();
    });
  }
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    this.isProcessing = true;
    try {
      while (this.queue.length > 0) {
        const operation = this.queue.shift()!;
        try {
          const result = await Promise.resolve(operation.operation());
          operation.resolve(result);
        } catch (error) {
          operation.reject(error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
  getQueueInfo() {
    return {
      name: this.name,
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      operations: this.queue.map(op => ({
        id: op.id,
        priority: op.priority,
        timestamp: op.timestamp
      }))
    };
  }
  clear(): void {
    this.queue.forEach(operation => {
      operation.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.isProcessing = false;
  }
  get size(): number {
    return this.queue.length;
  }
  get processing(): boolean {
    return this.isProcessing;
  }
}
```

### execution-modes.ts

```typescript
import type { 
  HandlerRegistration, 
  PipelineContext, 
  PipelineController
} from './types.js';
export async function executeSequential<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void> {
  let i = 0;
  const nonBlockingPromises: Promise<any>[] = [];
  while (i < context.handlers.length) {
    if (context.aborted || context.terminated) {
      break;
    }
    const registration = context.handlers[i];
    context.currentIndex = i;
    const controller = createController(registration, i);
    try {
      if (context.aborted) {
        break;
      }
      const result = registration.handler(context.payload, controller);
      if (registration.config.blocking && result instanceof Promise) {
        const handlerResult = await result;
        if (handlerResult !== undefined && !context.terminated) {
          context.results.push(handlerResult as R);
        }
      } else if (result !== undefined && !context.terminated) {
        if (result instanceof Promise) {
          const promiseWithHandling = result.then(asyncResult => {
            if (asyncResult !== undefined && !context.terminated) {
              context.results.push(asyncResult as R);
            }
            return asyncResult;
          }).catch((error) => {
            throw error;
          });
          nonBlockingPromises.push(promiseWithHandling);
        } else {
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
      if (registration.config.blocking) {
        throw error;
      }
      throw error;
    }
  }
  if (nonBlockingPromises.length > 0) {
    await Promise.all(nonBlockingPromises);
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
      if (registration.config.blocking) {
        throw error;
      }
      return { success: false, handlerId: registration.id, error };
    }
  });
  const results = await Promise.allSettled(handlerPromises);
  const failures = results.filter((result, index) => {
    if (result.status === 'rejected') {
      const registration = runnableHandlers[index];
      return registration.config.blocking;
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
      return { success: false, handlerId: registration.id, error, registration };
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
```
