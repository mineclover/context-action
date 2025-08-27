
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
export class ActionRegister<T extends ActionPayloadMap = ActionPayloadMap> {
  private pipelines = new Map<keyof T, HandlerRegistration<any, any>[]>();
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

  // 🆕 Performance optimizations
  private readonly isDebugMode: boolean;
  private actionCounters = new Map<keyof T, number>();

  // 🆕 동시성 문제 해결을 위한 큐 시스템 (conditional)
  private registrationQueue?: OperationQueue;
  private dispatchQueue?: OperationQueue;

  constructor(config: ActionRegisterConfig = {}) {
    this.name = config.name || 'ActionRegister';
    this.registryConfig = config.registry;
    
    // 🆕 Environment variable check cached (performance optimization)
    this.isDebugMode = Boolean(
      this.registryConfig?.debug && 
      process.env.NODE_ENV === 'development'
    );
    
    // Guard creation with improved cleanup handling
    this.actionGuard = new ActionGuard(this.registryConfig?.autoCleanup !== false);
    
    // 🆕 Conditional queue system initialization
    if (config.registry?.useConcurrencyQueue !== false) {
      this.registrationQueue = new OperationQueue(`${this.name}-Registration`);
      this.dispatchQueue = new OperationQueue(`${this.name}-Dispatch`);
    }
    
    if (this.registryConfig?.defaultExecutionMode) {
      this.executionMode = this.registryConfig.defaultExecutionMode;
    }
    
    this.log('ActionRegister initialized', {
      defaultExecutionMode: this.executionMode,
      maxHandlers: this.registryConfig?.maxHandlers,
      autoCleanup: this.registryConfig?.autoCleanup !== false,
      concurrencyQueue: Boolean(this.dispatchQueue),
      debugMode: this.isDebugMode
    });
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
    config: HandlerConfig = {}
  ): UnregisterFunction {
    // 🔄 임시로 기존 구현 유지하되 개선된 방식 적용
    // 동기적 API를 유지하면서 내부적으로만 동시성 보호
    
    // 🆕 Optimized handler ID generation
    const handlerId = config.id || this.generateHandlerId(action);
    
    // 🆕 즉시 등록 수행하되 정렬까지 한 번에 처리
    const unregisterFn = this._performRegistrationSync(action, handler, config, handlerId);
    
    return unregisterFn;
  }

  /**
   * 🆕 Unified logging method with cached debug mode check
   */
  private log(message: string, data?: any, level: 'log' | 'warn' | 'error' = 'log') {
    if (this.isDebugMode) {
      const timestamp = new Date().toISOString();
      console[level](`🎯 [${timestamp}] [${this.name}] ${message}`, data || '');
    }
  }

  /**
   * 🆕 Optimized handler ID generation with per-action counters
   */
  private generateHandlerId<K extends keyof T>(action: K): string {
    const count = (this.actionCounters.get(action) || 0) + 1;
    this.actionCounters.set(action, count);
    // Remove Math.random() for performance - use counter only
    return `${String(action)}_h${count}`;
  }

  /**
   * 🆕 동기적 등록 수행 (개선된 버전)
   */
  private _performRegistrationSync<K extends keyof T, R = void>(
    action: K,
    handler: ActionHandler<T[K], R>,
    config: HandlerConfig,
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
        replaceExisting: config.replaceExisting ?? false,
      } as Required<HandlerConfig>,
      id: handlerId,
    };
    
    // Initialize pipeline if it doesn't exist
    if (!this.pipelines.has(action)) {
      this.pipelines.set(action, []);
    }

    const pipeline = this.pipelines.get(action)!;
    const existingIndex = pipeline.findIndex(reg => reg.id === handlerId);

    // 🆕 Enhanced duplicate ID handling with replaceExisting support
    if (existingIndex !== -1) {
      if (config.replaceExisting) {
        // Replace existing handler
        pipeline[existingIndex] = registration;
        
        // Re-sort pipeline since priority might have changed
        pipeline.sort((a, b) => b.config.priority - a.config.priority);
        
        this.log(`Handler replaced: ${String(action)}`, {
          handlerId,
          priority: config.priority,
          totalHandlers: pipeline.length
        });

        // Return unregister function for the replaced registration
        return () => {
          const index = pipeline.findIndex(reg => reg.id === handlerId && reg === registration);
          if (index !== -1) {
            pipeline.splice(index, 1);
            this.log(`Replaced handler unregistered: ${String(action)}`, { handlerId });
          }
        };
      } else {
        // Default mode: reject duplicate (backward compatibility)
        this.log(`Handler duplicate ignored: ${String(action)}`, {
          handlerId,
          note: 'Use replaceExisting:true to replace'
        }, 'warn');
        return () => {}; // No-op unregister
      }
    }
    
    // Check maximum handlers limit
    if (this.registryConfig?.maxHandlers && pipeline.length >= this.registryConfig.maxHandlers) {
      throw new Error(
        `Maximum number of handlers (${this.registryConfig.maxHandlers}) reached for action '${String(action)}' in registry '${this.name}'`
      );
    }

    // Add handler to pipeline
    pipeline.push(registration);
    
    // 🆕 즉시 정렬 (동시성 보호)
    pipeline.sort((a, b) => b.config.priority - a.config.priority);
    
    this.log(`Handler registered: ${String(action)}`, {
      handlerId,
      priority: config.priority,
      totalHandlers: pipeline.length
    });

    // Return unregister function that removes this specific registration
    return () => {
      const index = pipeline.findIndex((reg) => reg.id === handlerId && reg === registration);
      if (index !== -1) {
        pipeline.splice(index, 1);
        this.log(`Handler unregistered: ${String(action)}`, {
          handlerId,
          remainingHandlers: pipeline.length
        });
      }
    };
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
  async dispatch<K extends keyof T>(
    action: K,
    payload?: T[K],
    options?: import('./types.js').DispatchOptions
  ): Promise<void> {
    // 🆕 Conditional queue usage for performance
    if (options?.immediate || !this.dispatchQueue) {
      // Bypass queue for immediate execution or when queues disabled
      return this._performDispatch(action, payload, options);
    } else {
      // Use queue for concurrency protection
      return this.dispatchQueue.enqueue(async () => {
        return this._performDispatch(action, payload, options);
      });
    }
  }

  /**
   * 🆕 실제 디스패치 작업 수행 (큐에서 호출됨)
   */
  private async _performDispatch<K extends keyof T>(
    action: K,
    payload?: T[K],
    options?: import('./types.js').DispatchOptions
  ): Promise<void> {
    // Enhanced debugging for object analysis
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
      
      // Only log for debugging purposes when explicitly needed
      // Most cases (Event objects, regular data) are perfectly fine
      const hasUnexpectedStructure = false; // Currently no cases warrant warnings
      
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
      
      // Optional: Deep analysis for nested objects containing DOM elements
      // This is informational only - nested DOM objects might cause cloning issues in specific contexts
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
      this.log(`Pipeline execution succeeded for ${String(action)}`);
    } catch (error) {
      this.log(`Pipeline execution failed for ${String(action)}`, error, 'error');
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

      // Only support handler ID filtering
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
    this.pipelines.delete(action);
  }

  /**
   * Remove all handlers for all actions
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
   * 
   * @public
   */
  clearAll(): void {
    this.pipelines.clear();
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
      totalHandlers: pipeline.length,
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
    return this.isDebugMode;
  }

  /**
   * 🆕 Destroy method for comprehensive cleanup
   * 
   * Cleans up all internal resources including pipelines, guards, queues, and statistics.
   * Should be called when the ActionRegister is no longer needed to prevent memory leaks.
   * 
   * @public
   */
  destroy(): void {
    // Clean up all pipelines
    this.pipelines.clear();
    
    // Clean up guard system
    this.actionGuard.destroy();
    
    // Clean up queues if they exist
    this.registrationQueue?.clear?.();
    this.dispatchQueue?.clear?.();
    
    // Clean up statistics and counters
    this.executionStats.clear();
    this.actionCounters.clear();
    this.actionExecutionModes.clear();
    
    this.log('ActionRegister destroyed');
  }
}