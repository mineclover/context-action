
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


export class ActionRegister<T extends ActionPayloadMap = ActionPayloadMap> {
  private pipelines = new Map<keyof T, HandlerRegistration<any>[]>();
  private handlerCounter = 0;
  private readonly actionGuard: ActionGuard;
  private executionMode: ExecutionMode = 'sequential';
  private actionExecutionModes = new Map<keyof T, ExecutionMode>();
  public readonly name: string;

  constructor(config: ActionRegisterConfig = {}) {
    this.name = config.name || 'ActionRegister';
    this.actionGuard = new ActionGuard();
  }

  register<K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config: HandlerConfig = {}
  ): UnregisterFunction {
    
    // Generate unique handler ID
    const handlerId = config.id || `handler_${++this.handlerCounter}`;
    
    // Create handler registration with defaults
    const registration: HandlerRegistration<T[K]> = {
      handler,
      config: {
        priority: config.priority ?? 0,
        id: handlerId,
        blocking: config.blocking ?? false,
        once: config.once ?? false,
        condition: config.condition || (() => true),
        debounce: config.debounce ?? undefined,
        throttle: config.throttle ?? undefined,
        validation: config.validation ?? undefined,
        middleware: config.middleware ?? false,
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
    const context: PipelineContext<T[K]> = {
      action: String(action),
      payload: payload as T[K],
      handlers: [...pipeline], // Copy handlers to avoid modification during execution
      aborted: false,
      abortReason: undefined,
      currentIndex: 0,
      jumpToPriority: undefined,
      executionMode: currentExecutionMode,
    };

    await this.executePipeline(context);
  }

  private async executePipeline<K extends keyof T>(context: PipelineContext<T[K]>): Promise<void> {

    const createController = (_registration: HandlerRegistration<T[K]>, _index: number): PipelineController<T[K]> => {
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

  private cleanupOneTimeHandlers<K extends keyof T>(action: K, executedHandlers: HandlerRegistration<T[K]>[]): void {
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