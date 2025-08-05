
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

    // Create pipeline execution context
    const context: PipelineContext<T[K], any> = {
      action: String(action),
      payload: payload as T[K],
      handlers: [...pipeline], // Copy handlers to avoid modification during execution
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
        await executeSequential(context, createController);
        break;
      case 'parallel':
        await executeParallel(context, createController);
        break;
      case 'race':
        await executeRace(context, createController);
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