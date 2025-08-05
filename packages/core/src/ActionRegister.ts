
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
} from './types.js';
import { executeSequential, executeParallel, executeRace } from './execution-modes.js';
import { ActionGuard } from './action-guard.js';

/**
 * 중앙화된 액션 등록 및 디스패치 시스템으로, 타입 안전한 액션 파이프라인 관리를 제공하는 핵심 클래스입니다.
 * 
 * @implements {ActionRegister}
 * @implements {Action Pipeline System}
 * @memberof core-concepts
 * 
 * @example
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string };
 *   calculateTotal: void;
 * }
 * 
 * const register = new ActionRegister<AppActions>({
 *   name: 'AppRegister',
 *   logLevel: LogLevel.DEBUG
 * });
 * 
 * // 핸들러 등록
 * register.register('updateUser', ({ id, name }, controller) => {
 *   userStore.setValue({ id, name });
 *   controller.next();
 * }, { priority: 10 });
 * 
 * // 액션 디스패치
 * await register.dispatch('updateUser', { id: '1', name: 'John' });
 * ```
 */
export class ActionRegister<T extends ActionPayloadMap = ActionPayloadMap> {
  private pipelines = new Map<keyof T, HandlerRegistration<any, any>[]>();
  private handlerCounter = 0;
  private readonly actionGuard: ActionGuard;
  private executionMode: ExecutionMode = 'sequential';
  private actionExecutionModes = new Map<keyof T, ExecutionMode>();
  public readonly name: string;

  constructor(config: ActionRegisterConfig = {}) {
    this.name = config.name || 'ActionRegister';
    this.actionGuard = new ActionGuard();
  }

  register<K extends keyof T, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig = {}
  ): UnregisterFunction {
    
    // Generate unique handler ID
    const handlerId = config.id || `handler_${++this.handlerCounter}`;
    
    // Create handler registration with defaults
    const registration: HandlerRegistration<T[K], R> = {
      handler,
      config: {
        // Existing fields
        priority: config.priority ?? 0,
        id: handlerId,
        blocking: config.blocking ?? false,
        once: config.once ?? false,
        condition: config.condition || (() => true),
        debounce: config.debounce ?? undefined,
        throttle: config.throttle ?? undefined,
        validation: config.validation ?? undefined,
        middleware: config.middleware ?? false,
        
        // New metadata fields
        tags: config.tags ?? [],
        category: config.category ?? undefined,
        description: config.description ?? undefined,
        version: config.version ?? undefined,
        returnType: config.returnType ?? 'value',
        timeout: config.timeout ?? undefined,
        retries: config.retries ?? 0,
        dependencies: config.dependencies ?? [],
        conflicts: config.conflicts ?? [],
        environment: config.environment ?? undefined,
        feature: config.feature ?? undefined,
        metrics: config.metrics ?? {
          collectTiming: false,
          collectErrors: false,
          customMetrics: {}
        },
        metadata: config.metadata ?? {},
      } as Required<HandlerConfig>,
      id: handlerId,
    };
    
    // Initialize pipeline if it doesn't exist
    if (!this.pipelines.has(action)) {
      this.pipelines.set(action, []);
    }

    const pipeline = this.pipelines.get(action)!;
    
    // Check for duplicate handler IDs
    if (pipeline.some(reg => reg.id === handlerId)) {
      return () => {}; // Return no-op unregister function
    }

    // Add handler to pipeline
    pipeline.push(registration);
    
    // Sort pipeline by priority (highest first)
    pipeline.sort((a, b) => b.config.priority - a.config.priority);


    // Return unregister function
    return () => {
      const index = pipeline.findIndex(reg => reg.id === handlerId);
      if (index !== -1) {
        pipeline.splice(index, 1);
        
      }
    };
  }

  async dispatch<K extends keyof T>(
    action: K,
    payload?: T[K],
    options?: import('./types.js').DispatchOptions
  ): Promise<void> {
    const pipeline = this.pipelines.get(action);
    if (!pipeline || pipeline.length === 0) {
      return;
    }

    // Apply ActionGuard controls if specified in options
    if (options) {
      const actionKey = String(action);
      
      // Handle debounce - wait for delay after last call
      if (options.debounce !== undefined) {
        const shouldProceed = await this.actionGuard.debounce(actionKey, options.debounce);
        if (!shouldProceed) {
          return; // Debounced - don't execute
        }
      }
      
      // Handle throttle - limit execution frequency
      if (options.throttle !== undefined) {
        const shouldProceed = this.actionGuard.throttle(actionKey, options.throttle);
        if (!shouldProceed) {
          return; // Throttled - don't execute
        }
      }
    }

    // Determine execution mode for this action (with option override)
    const currentExecutionMode = options?.executionMode || 
                                this.actionExecutionModes.get(action) || 
                                this.executionMode;

    // Apply handler filtering if specified
    const filteredHandlers = this.filterHandlers([...pipeline], options?.filter);

    // Create pipeline execution context
    const context: PipelineContext<T[K], any> = {
      action: String(action),
      payload: payload as T[K],
      handlers: filteredHandlers, // Use filtered handlers
      aborted: false,
      abortReason: undefined,
      currentIndex: 0,
      jumpToPriority: undefined,
      executionMode: currentExecutionMode,
      
      // New result collection fields
      results: [],
      terminated: false,
      terminationResult: undefined,
    };

    await this.executePipeline(context);
  }

  async dispatchWithResult<K extends keyof T, R = void>(
    action: K,
    payload?: T[K],
    options?: import('./types.js').DispatchOptions
  ): Promise<ExecutionResult<R>> {
    const startTime = Date.now();
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

    // Apply ActionGuard controls if specified in options
    if (options) {
      const actionKey = String(action);
      
      // Handle debounce - wait for delay after last call
      if (options.debounce !== undefined) {
        const shouldProceed = await this.actionGuard.debounce(actionKey, options.debounce);
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
      
      // Handle throttle - limit execution frequency
      if (options.throttle !== undefined) {
        const shouldProceed = this.actionGuard.throttle(actionKey, options.throttle);
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
    }

    // Determine execution mode for this action (with option override)
    const currentExecutionMode = options?.executionMode || 
                                this.actionExecutionModes.get(action) || 
                                this.executionMode;

    // Apply handler filtering if specified
    const filteredHandlers = this.filterHandlers([...pipeline], options?.filter);

    // Create pipeline execution context
    const context: PipelineContext<T[K], R> = {
      action: String(action),
      payload: payload as T[K],
      handlers: filteredHandlers,
      aborted: false,
      abortReason: undefined,
      currentIndex: 0,
      jumpToPriority: undefined,
      executionMode: currentExecutionMode,
      
      // Result collection fields
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

    try {
      await this.executePipeline(context);
    } catch (error) {
      executionError = error instanceof Error ? error : new Error(String(error));
      errors.push({
        handlerId: 'pipeline',
        error: executionError,
        timestamp: Date.now(),
      });
    }

    const endTime = Date.now();

    // Process results based on options
    const processedResult = this.processResults(context, options?.result);

    // Build execution result
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

    /** Clean up one-time handlers after execution */
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

      // Check include filters
      if (filterOptions.tags && filterOptions.tags.length > 0) {
        const hasMatchingTag = filterOptions.tags.some(tag => config.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      if (filterOptions.category && config.category !== filterOptions.category) {
        return false;
      }

      if (filterOptions.handlerIds && filterOptions.handlerIds.length > 0) {
        if (!filterOptions.handlerIds.includes(config.id)) {
          return false;
        }
      }

      if (filterOptions.environment && config.environment !== filterOptions.environment) {
        return false;
      }

      if (filterOptions.feature && config.feature !== filterOptions.feature) {
        return false;
      }

      // Check exclude filters
      if (filterOptions.excludeTags && filterOptions.excludeTags.length > 0) {
        const hasExcludedTag = filterOptions.excludeTags.some(tag => config.tags.includes(tag));
        if (hasExcludedTag) return false;
      }

      if (filterOptions.excludeCategory && config.category === filterOptions.excludeCategory) {
        return false;
      }

      if (filterOptions.excludeHandlerIds && filterOptions.excludeHandlerIds.length > 0) {
        if (filterOptions.excludeHandlerIds.includes(config.id)) {
          return false;
        }
      }

      // Custom filter
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
    
    // Handle termination result
    if (context.terminated && context.terminationResult !== undefined) {
      return context.terminationResult;
    }

    // Apply maxResults limit
    const limitedResults = resultOptions.maxResults 
      ? results.slice(0, resultOptions.maxResults)
      : results;

    if (limitedResults.length === 0) {
      return undefined;
    }

    // Process results based on strategy
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
        // Default merge: return last result
        return limitedResults[limitedResults.length - 1];
      case 'custom':
        if (resultOptions.merger) {
          return resultOptions.merger(limitedResults);
        }
        throw new Error('Custom result strategy requires a merger function');
      default:
        // Default: return all results
        return limitedResults as unknown as R;
    }
  }

  private async executePipeline<K extends keyof T>(context: PipelineContext<T[K], any>): Promise<void> {

    const createController = (_registration: HandlerRegistration<T[K], any>, _index: number): PipelineController<T[K], any> => {
      return {
        next: () => {
          /** Next is called automatically after handler completion in sequential mode */
          /** In parallel/race modes, this method is essentially a no-op */
        },
        abort: (reason?: string) => {
          /** Set abort flag to stop pipeline execution immediately */
          context.aborted = true;
          context.abortReason = reason;
        },
        modifyPayload: (modifier: (payload: T[K]) => T[K]) => {
          /** Transform payload for subsequent handlers in the pipeline */
          context.payload = modifier(context.payload);
        },
        getPayload: () => context.payload,
        jumpToPriority: (priority: number) => {
          /** Set priority jump target for sequential execution mode */
          context.jumpToPriority = priority;
        },
        
        // New result handling methods
        return: (result: any) => {
          /** Return a result and terminate the pipeline */
          context.terminated = true;
          context.terminationResult = result;
        },
        setResult: (result: any) => {
          /** Set a result but continue pipeline execution */
          context.results.push(result);
        },
        getResults: () => {
          /** Get all results from previously executed handlers */
          return [...context.results];
        },
        mergeResult: (merger: (previousResults: any[], currentResult: any) => any) => {
          /** Merge current result with previous results using a custom merger function */
          const currentResult = context.results[context.results.length - 1];
          const previousResults = context.results.slice(0, -1);
          const mergedResult = merger(previousResults, currentResult);
          context.results[context.results.length - 1] = mergedResult;
        },
      };
    };

    /** Delegate execution to mode-specific implementation */
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

    /** Clean up one-time handlers after successful execution */
    this.cleanupOneTimeHandlers(context.action as K, context.handlers);
  }

  private cleanupOneTimeHandlers<K extends keyof T>(action: K, executedHandlers: HandlerRegistration<T[K], any>[]): void {
    const pipeline = this.pipelines.get(action);
    if (!pipeline) return;

    /** Find handlers marked for one-time execution */
    const oneTimeHandlers = executedHandlers.filter(reg => reg.config.once);
    if (oneTimeHandlers.length === 0) return;

    /** Remove each one-time handler from the active pipeline */
    oneTimeHandlers.forEach(registration => {
      const index = pipeline.findIndex(reg => reg.id === registration.id);
      if (index !== -1) {
        /** Remove handler while preserving array integrity */
        pipeline.splice(index, 1);
      }
    });
  }

  getHandlerCount<K extends keyof T>(action: K): number {
    const pipeline = this.pipelines.get(action);
    const count = pipeline ? pipeline.length : 0;
    return count;
  }

  hasHandlers<K extends keyof T>(action: K): boolean {
    const hasHandlers = this.getHandlerCount(action) > 0;
    return hasHandlers;
  }

  getRegisteredActions(): (keyof T)[] {
    const actions = Array.from(this.pipelines.keys());
    return actions;
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
}