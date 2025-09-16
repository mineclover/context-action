
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
  HandlerError,
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
  private pipelines = new Map<keyof T, Array<HandlerRegistration<any, any>>>();
  private readonly actionGuard: ActionGuard;
  private executionMode: ExecutionMode = 'sequential';
  private actionExecutionModes = new Map<keyof T, ExecutionMode>();
  
  // 🆕 Advanced unregister function management system
  private unregisterFunctions = new Map<string, UnregisterFunction>();
  
  public readonly name: string;
  private readonly registryConfig: ActionRegisterConfig['registry'];

  // 🆕 Performance optimizations
  private readonly isDebugMode: boolean;
  private readonly maxHandlersPerAction: number;

  // 🆕 동시성 문제 해결을 위한 큐 시스템 (conditional)
  private dispatchQueue?: OperationQueue;

  // 🧠 Filter cache disabled to prevent memory issues - direct filtering only
  private filterCacheDisabled = true;

  // 🔧 Performance optimization: Fast handler ID generation counter
  private handlerIdCounter = 0;

  // 🔧 Performance optimization: PipelineController pool for object reuse
  private controllerPool: PipelineController<any, any>[] = [];
  private readonly maxControllerPoolSize = 10;

  constructor(config: ActionRegisterConfig = {}) {
    this.name = config.name || 'ActionRegister';
    this.registryConfig = config.registry;
    this.maxHandlersPerAction = config.registry?.maxHandlersPerAction ?? 1000;
    
    // 🆕 Environment variable check cached (performance optimization)
    this.isDebugMode = Boolean(
      this.registryConfig?.debug && 
      process.env.NODE_ENV === 'development'
    );
    
    // Guard creation with improved cleanup handling
    this.actionGuard = new ActionGuard(this.registryConfig?.autoCleanup !== false);
    
    // 🆕 Conditional queue system initialization
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
    
    if (typeof AbortSignal.any === 'function') {
      // Modern browsers with AbortSignal.any()
      effectiveSignal = AbortSignal.any(signals);
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
        cleanup: config.cleanup, // 🔧 Preserve cleanup function from config
      } as Required<HandlerConfig>,
      id: handlerId,
    };
    
    // Initialize pipeline if it doesn't exist
    if (!this.pipelines.has(action)) {
      this.pipelines.set(action, []);
    }

    const pipeline = this.pipelines.get(action)!;
    
    // Check handler limit
    if (pipeline.length >= this.maxHandlersPerAction) {
      console.warn(`Handler limit (${this.maxHandlersPerAction}) reached for action "${String(action)}". Registration ignored.`);
      return () => {}; // No-op unregister
    }
    const existingIndex = pipeline.findIndex(reg => reg.id === handlerId);

    // 🆕 Enhanced duplicate ID handling with replaceExisting support and cleanup
    if (existingIndex !== -1) {
      const existing = pipeline[existingIndex];
      const existingUnregister = this.unregisterFunctions.get(handlerId);
      
      if (config.replaceExisting) {
        // Clean up existing handler before replacement
        if (existingUnregister) {
          // Execute existing unregister function first
          existingUnregister();
          this.unregisterFunctions.delete(handlerId);
        }
        
        // Call cleanup if available on the old handler
        if (existing && typeof (existing as any).cleanup === 'function') {
          try {
            (existing as any).cleanup();
          } catch (cleanupError) {
            this.log(`Cleanup error for replaced handler: ${String(action)}`, cleanupError, 'warn');
          }
        }
        
        // Replace existing handler
        pipeline[existingIndex] = registration;
        pipeline.sort((a, b) => b.config.priority - a.config.priority);
        // Cache disabled
        
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
  async dispatch<K extends keyof T>(
    action: K,
    payload?: T[K],
    options?: DispatchOptions
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
    options?: DispatchOptions
  ): Promise<void> {
    // 🔍 디스패치 시작 디버그
    this.log(`Starting dispatch for action '${String(action)}'`, {
      hasPayload: payload !== undefined,
      payloadType: payload?.constructor?.name || typeof payload,
      options: options ? Object.keys(options) : 'none',
      timestamp: new Date().toISOString()
    });
    
    // Simple Event object detection for development
    if (payload instanceof Event && process.env.NODE_ENV === 'development') {
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
      this.log(`No handlers found for action '${String(action)}', dispatch cancelled`, {}, 'warn');
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
      abortReason: undefined as string | undefined,
      currentIndex: 0,
      jumpToPriority: undefined as number | undefined,
      executionMode: currentExecutionMode,
      
      // New result collection fields
      results: [],
      terminated: false,
      terminationResult: undefined as any,
    };

    
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
      throw error;
    } finally {
      // 🔧 Use cleanup function from createAbortSignal
      cleanup();
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
    options?: DispatchOptions
  ): Promise<ExecutionResult<R>> {
    const _startTime = Date.now();
    
    // 🔧 Improved AbortSignal handling with cleaner merge logic (same as dispatch)
    const [effectiveSignal, autoAbortController, cleanup] = this.createAbortSignal(options);
    
    if (options?.autoAbort?.onControllerCreated && autoAbortController) {
      options.autoAbort.onControllerCreated(autoAbortController);
    }
    
    // Check if dispatch is aborted before starting
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

    // 🆕 Optimize filtering - only copy array if filtering is needed
    const filteredHandlers = options?.filter 
      ? this.filterHandlers(pipeline, options.filter)
      : pipeline;

    // 🔧 Apply ActionGuard controls using unified method with ExecutionResult return
    const actionKey = String(action);
    const guardResult = await this.applyActionGuardControlsWithResult<R>(
      actionKey, 
      filteredHandlers, 
      options, 
      _startTime, 
      pipeline.length
    );
    if (guardResult) {
      return guardResult; // Throttled or debounced - return early with proper result
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
      abortReason: undefined as string | undefined,
      currentIndex: 0,
      jumpToPriority: undefined as number | undefined,
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
      context.abortReason = 'Action dispatch aborted by signal';
    } : undefined;
    
    if (effectiveSignal && abortHandler) {
      effectiveSignal.addEventListener('abort', abortHandler);
    }
    
    // 🔧 Initialize errors array (will be updated after pipeline execution)
    let errors: HandlerError[] = [];
    
    try {
      await this.executePipeline(context, autoAbortController, options?.autoAbort);
      
      // 🔧 Collect errors from execution context after pipeline execution
      const contextWithErrors = context as PipelineContext<any, any> & { collectedErrors?: HandlerError[] };
      errors = contextWithErrors.collectedErrors || [];
      
      // Mark executed handlers based on context.currentIndex
      // In sequential mode, handlers 0 to currentIndex were executed
      // In parallel/race mode, all handlers that didn't error were executed
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
      
      // Mark executed handlers even when there's an error
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
      // 🔧 Use cleanup function from createAbortSignal
      cleanup();
    }

    const endTime = Date.now();
    
    // Process results based on options
    const processedResult = this.processResults(context, options?.result);

    // 🔧 Type safety: Separate successful results from failed ones
    const successResults = context.results.filter((result): result is R => result !== undefined);
    const failedResults = errors.map(err => ({
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
      result: processedResult,
      successResults: successResults,
      results: context.results,
      failedResults,
      execution: {
        duration: endTime - _startTime,
        handlersExecuted: filteredHandlers.length === 0 ? 0 : context.currentIndex + (context.aborted ? 0 : 1),
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

    /** Clean up one-time handlers after execution */
    this.cleanupOneTimeHandlers(action, context.handlers);

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

  // Cache methods removed for memory stability

  /**
   * 🔧 Generate optimized cache key for filter options
   */
  private generateFilterCacheKey(filterOptions?: DispatchOptions['filter']): string {
    if (!filterOptions) {
      return 'no-filter';
    }

    // Use pre-sorted arrays to avoid repeated sorting
    const parts: string[] = [];

    if (filterOptions.handlerIds?.length) {
      parts.push(`h:${filterOptions.handlerIds.slice().sort().join(',')}`);
    }

    if (filterOptions.excludeHandlerIds?.length) {
      parts.push(`e:${filterOptions.excludeHandlerIds.slice().sort().join(',')}`);
    }

    if (filterOptions.priority) {
      const { min, max } = filterOptions.priority;
      if (min !== undefined || max !== undefined) {
        parts.push(`p:${min ?? '*'}-${max ?? '*'}`);
      }
    }

    // Custom filters cannot be cached
    if (filterOptions.custom) {
      return 'custom-' + Date.now() + Math.random(); // Unique non-cacheable key
    }

    return parts.length > 0 ? parts.join('|') : 'no-filter';
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
    controller.abort = (reason?: string) => {
      context.aborted = true;
      context.abortReason = reason;
      
      // Auto-abort: Handler can trigger pipeline abort if enabled
      if (autoAbortController && autoAbortOptions?.allowHandlerAbort) {
        autoAbortController.abort(reason);
      }
    };

    controller.modifyPayload = (modifier: (payload: T[K]) => T[K]) => {
      context.payload = modifier(context.payload);
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

  /**
   * 🔧 Return controller to pool for reuse
   */
  private returnControllerToPool(controller: PipelineController<any, any>): void {
    // Only add to pool if we haven't exceeded max size
    if (this.controllerPool.length < this.maxControllerPoolSize) {
      this.controllerPool.push(controller);
    }
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
      if (excludeIdSet && excludeIdSet.has(config.id)) {
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
    // 🔧 Invalidate filter cache when pipeline changes
    // Cache disabled
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
    // 🔧 Invalidate filter cache when pipeline changes
    // Cache disabled
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
    
    if (this.registryConfig?.debug && process.env.NODE_ENV === 'development') {
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
      const pipeline = this.pipelines.get(action);
      if (!pipeline) return;
      
      const index = pipeline.findIndex(reg => reg.id === handlerId && reg === registration);
      if (index !== -1) {
        pipeline.splice(index, 1);
        // Cache disabled
        this.unregisterFunctions.delete(handlerId);
        
        // Execute cleanup function if available
        if (registration.config.cleanup && typeof registration.config.cleanup === 'function') {
          try {
            registration.config.cleanup();
          } catch (cleanupError) {
            this.log(`Cleanup error during unregister: ${String(action)}`, cleanupError, 'warn');
          }
        }
        
        this.log(`Handler unregistered: ${String(action)}`, {
          handlerId,
          remainingHandlers: pipeline.length
        });
      }
    };
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

  /**
   * 🆕 Destroy method for comprehensive cleanup
   * 
   * Cleans up all internal resources including pipelines, guards, queues, and statistics.
   * Should be called when the ActionRegister is no longer needed to prevent memory leaks.
   * 
   * @public
   */
  destroy(): void {
    // Execute all unregister functions to properly clean up handlers
    this.unregisterFunctions.forEach(unregister => {
      try {
        unregister();
      } catch (error) {
        this.log('Error during unregister in destroy', error, 'error');
      }
    });
    
    this.unregisterFunctions.clear();
    
    // Clean up all pipelines
    this.pipelines.clear();
    
    // Clean up guard system
    this.actionGuard.destroy();
    
    // Clean up queues if they exist
    this.dispatchQueue?.clear?.();
    
    this.actionExecutionModes.clear();
    
    // Cache disabled
    
    // 🔧 Clean up controller pool
    this.controllerPool.length = 0;
    
    this.log('ActionRegister destroyed');
  }
}