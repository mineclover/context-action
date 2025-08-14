
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
 *   // 핸들러가 자동으로 다음 핸들러로 진행
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
  private readonly registryConfig: ActionRegisterConfig['registry'];
  private executionStats = new Map<keyof T, {
    totalExecutions: number;
    totalDuration: number;
    successCount: number;
    errorCount: number;
  }>();

  constructor(config: ActionRegisterConfig = {}) {
    this.name = config.name || 'ActionRegister';
    this.registryConfig = config.registry;
    this.actionGuard = new ActionGuard();
    
    if (this.registryConfig?.defaultExecutionMode) {
      this.executionMode = this.registryConfig.defaultExecutionMode;
    }
    
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
      console.log(`🎯 ActionRegister created: ${this.name}`, {
        defaultExecutionMode: this.executionMode,
        maxHandlers: this.registryConfig.maxHandlers,
        autoCleanup: this.registryConfig.autoCleanup ?? true
      });
    }
  }

  register<K extends keyof T, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig = {}
  ): UnregisterFunction {
    
    // Generate unique handler ID with security consideration
    // Use counter + random suffix to prevent ID prediction attacks
    const handlerId = config.id || `handler_${++this.handlerCounter}_${Math.random().toString(36).substr(2, 5)}`;
    
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
    
    // Check for duplicate handler IDs and prevent duplicate registration
    const existingIndex = pipeline.findIndex(reg => reg.id === handlerId);
    if (existingIndex !== -1) {
      // Return a no-op unregister function for the duplicate
      return () => {};
    }
    
    // Check maximum handlers limit
    if (this.registryConfig?.maxHandlers && pipeline.length >= this.registryConfig.maxHandlers) {
      throw new Error(
        `Maximum number of handlers (${this.registryConfig.maxHandlers}) reached for action '${String(action)}' in registry '${this.name}'`
      );
    }

    // Add handler to pipeline
    pipeline.push(registration);
    
    // Sort pipeline by priority (highest first)
    pipeline.sort((a, b) => b.config.priority - a.config.priority);
    
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
      console.log(`🎯 Handler registered: ${String(action)}`, {
        handlerId,
        priority: config.priority,
        tags: config.tags,
        category: config.category,
        totalHandlers: pipeline.length,
        registry: this.name
      });
    }

    // Return unregister function that removes this specific registration
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
    // Auto-abort: Create AbortController if enabled
    let autoAbortController: AbortController | undefined;
    let effectiveSignal = options?.signal;
    
    if (options?.autoAbort?.enabled) {
      autoAbortController = new AbortController();
      effectiveSignal = autoAbortController.signal;
      
      // Provide access to the created controller
      if (options.autoAbort.onControllerCreated) {
        options.autoAbort.onControllerCreated(autoAbortController);
      }
      
      // If original signal exists, link them together
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
    
    // Check if dispatch is aborted before starting
    if (effectiveSignal?.aborted) {
      return;
    }
    
    const pipeline = this.pipelines.get(action);
    if (!pipeline || pipeline.length === 0) {
      return;
    }

    // Apply handler filtering first
    const filteredHandlers = this.filterHandlers([...pipeline], options?.filter);

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
    if (debounceMs !== undefined) {
      const shouldProceed = await this.actionGuard.debounce(actionKey, debounceMs);
      if (!shouldProceed) {
        return; // Debounced - don't execute
      }
    }
    
    // Apply throttle if specified
    if (throttleMs !== undefined) {
      const shouldProceed = this.actionGuard.throttle(actionKey, throttleMs);
      if (!shouldProceed) {
        return; // Throttled - don't execute
      }
    }

    // Determine execution mode for this action (with option override)
    const currentExecutionMode = options?.executionMode || 
                                this.actionExecutionModes.get(action) || 
                                this.executionMode;

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

    const startTime = Date.now();
    let executionSuccess = true;
    
    // Add abort listener if signal provided (use effectiveSignal for auto-abort)
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
      executionSuccess = false;
      throw error;
    } finally {
      // Clean up abort listener
      if (effectiveSignal && abortHandler) {
        effectiveSignal.removeEventListener('abort', abortHandler);
      }
      // Track execution statistics
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
    
    // Auto-abort: Create AbortController if enabled (same as dispatch)
    let autoAbortController: AbortController | undefined;
    let effectiveSignal = options?.signal;
    
    if (options?.autoAbort?.enabled) {
      autoAbortController = new AbortController();
      effectiveSignal = autoAbortController.signal;
      
      // Provide access to the created controller
      if (options.autoAbort.onControllerCreated) {
        options.autoAbort.onControllerCreated(autoAbortController);
      }
      
      // If original signal exists, link them together
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
    
    // Check if dispatch is aborted before starting
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

    // Apply handler filtering first
    const filteredHandlers = this.filterHandlers([...pipeline], options?.filter);

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
    
    // Apply throttle if specified
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

    // Determine execution mode for this action (with option override)
    const currentExecutionMode = options?.executionMode || 
                                this.actionExecutionModes.get(action) || 
                                this.executionMode;

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

    // Add abort listener if signal provided (use effectiveSignal for auto-abort)
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
      // Clean up abort listener
      if (effectiveSignal && abortHandler) {
        effectiveSignal.removeEventListener('abort', abortHandler);
      }
    }

    const endTime = Date.now();
    const executionSuccess = !executionError && !context.aborted;
    
    // Track execution statistics
    this.updateExecutionStats(action, executionSuccess, endTime - startTime);

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
          
          // Auto-abort: Handler can trigger pipeline abort if enabled
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

  /**
   * Update execution statistics for an action
   * 
   * @param action Action name
   * @param success Whether execution was successful
   * @param duration Execution duration in milliseconds
   */
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
          tags: h.config.tags,
          category: h.config.category,
          description: h.config.description,
          version: h.config.version,
        }))
      }));

    // Get execution statistics if available
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
      handlersByPriority,
      executionStats,
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
   * Get handlers by tag across all actions
   * 
   * @param tag Tag to filter handlers by
   * @returns Map of actions to handlers with the specified tag
   */
  getHandlersByTag(tag: string): Map<keyof T, HandlerRegistration<any, any>[]> {
    const result = new Map<keyof T, HandlerRegistration<any, any>[]>();
    
    for (const [action, pipeline] of this.pipelines.entries()) {
      const matchingHandlers = pipeline.filter(handler => 
        handler.config.tags.includes(tag)
      );
      
      if (matchingHandlers.length > 0) {
        result.set(action, matchingHandlers);
      }
    }
    
    return result;
  }

  /**
   * Get handlers by category across all actions
   * 
   * @param category Category to filter handlers by
   * @returns Map of actions to handlers with the specified category
   */
  getHandlersByCategory(category: string): Map<keyof T, HandlerRegistration<any, any>[]> {
    const result = new Map<keyof T, HandlerRegistration<any, any>[]>();
    
    for (const [action, pipeline] of this.pipelines.entries()) {
      const matchingHandlers = pipeline.filter(handler => 
        handler.config.category === category
      );
      
      if (matchingHandlers.length > 0) {
        result.set(action, matchingHandlers);
      }
    }
    
    return result;
  }

  /**
   * Set execution mode for a specific action
   * 
   * @param action Action name
   * @param mode Execution mode to set
   */
  setActionExecutionMode<K extends keyof T>(action: K, mode: ExecutionMode): void {
    this.actionExecutionModes.set(action, mode);
    
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
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
    
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
      console.log(`🎯 Execution mode reset for action '${String(action)}' to default: ${this.executionMode}`);
    }
  }

  /**
   * Clear execution statistics for all actions
   */
  clearExecutionStats(): void {
    this.executionStats.clear();
    
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
      console.log(`🎯 Execution statistics cleared for registry: ${this.name}`);
    }
  }

  /**
   * Clear execution statistics for a specific action
   * 
   * @param action Action name
   */
  clearActionExecutionStats<K extends keyof T>(action: K): void {
    this.executionStats.delete(action);
    
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
      console.log(`🎯 Execution statistics cleared for action: ${String(action)}`);
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
    return Boolean(this.registryConfig?.debug && process.env.NODE_ENV === 'development');
  }
}