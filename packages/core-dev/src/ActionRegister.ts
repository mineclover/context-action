/**
 * @fileoverview ActionRegister - Core action pipeline management system
 * Provides type-safe action dispatch with priority-based handler execution
 */

import {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  HandlerRegistration,
  PipelineContext,
  PipelineController,
  ActionRegisterConfig,
  UnregisterFunction,
  ActionDispatcher,
  ActionMetrics,
  ActionRegisterEvents,
  EventEmitter,
  EventHandler,
  ExecutionMode,
} from './types.js';
import { Logger, createLogger, getLoggerNameFromEnv, getDebugFromEnv, LogArtHelpers } from '@context-action/logger';
import { executeSequential, executeParallel, executeRace } from './execution-modes.js';
import { ActionGuard } from './action-guard.js';

/**
 * Simple event emitter implementation for ActionRegister events
 * @internal
 */
class SimpleEventEmitter<T extends Record<string, any>> implements EventEmitter<T> {
  private listeners = new Map<keyof T, Set<EventHandler<any>>>();

  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): UnregisterFunction {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => this.off(event, handler);
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${String(event)}:`, error);
        }
      });
    }
  }

  off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(handler);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  removeAllListeners(event?: keyof T): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

/**
 * Central action registration and dispatch system
 * @implements action-pipeline-system
 * @implements actionregister
 * @implements loose-coupling
 * @implements separation-of-concerns
 * @implements viewmodel-layer
 * @implements class-naming
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Core action pipeline management system with type-safe action dispatch
 * @template T - Action payload map defining available actions and their payload types
 * 
 * @example
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   increment: void;
 *   setCount: number;
 *   updateUser: { id: string; name: string };
 * }
 *
 * const actionRegister = new ActionRegister<AppActions>();
 *
 * // Register handlers with priority and configuration
 * actionRegister.register('increment', (_, controller) => {
 *   console.log('Incremented');
 *   controller.next();
 * }, { priority: 10 });
 *
 * actionRegister.register('setCount', (count, controller) => {
 *   console.log(`Count: ${count}`);
 *   controller.next();
 * });
 *
 * // Dispatch actions with type safety
 * await actionRegister.dispatch('increment');
 * await actionRegister.dispatch('setCount', 42);
 * ```
 */
export class ActionRegister<T extends ActionPayloadMap = ActionPayloadMap> {
  private pipelines = new Map<keyof T, HandlerRegistration<any>[]>();
  private handlerCounter = 0;
  private readonly logger: Logger;
  private readonly events = new SimpleEventEmitter<ActionRegisterEvents<T>>();
  private readonly config: Required<ActionRegisterConfig>;
  private readonly actionGuard: ActionGuard;
  private executionMode: ExecutionMode = 'sequential';
  private actionExecutionModes = new Map<keyof T, ExecutionMode>();

  constructor(config: ActionRegisterConfig = {}) {
    // Set defaults for configuration with .env support
    this.config = {
      logger: config.logger || createLogger(config.logLevel),
      logLevel: config.logLevel ?? 3, // ERROR level as default
      name: config.name || getLoggerNameFromEnv(),
      debug: config.debug ?? getDebugFromEnv(),
      defaultExecutionMode: config.defaultExecutionMode ?? 'sequential',
    } as Required<ActionRegisterConfig>;

    this.logger = this.config.logger;
    this.actionGuard = new ActionGuard(this.logger);
    this.executionMode = this.config.defaultExecutionMode;
    
    this.logger.trace(`${this.config.name} constructor called`, { config });

    if (this.config.debug) {
      this.logger.info(LogArtHelpers.core.start('ActionRegister 초기화'));
      this.logger.info(LogArtHelpers.core.debug('ActionRegister 구성', {
        name: this.config.name,
        logLevel: this.config.logLevel,
        debug: this.config.debug,
        defaultExecutionMode: this.executionMode,
      }));
      this.logger.info(LogArtHelpers.core.end('ActionRegister 초기화'));
    }
    
    this.logger.trace(`${this.config.name} constructor completed`);
  }

  /**
   * Register action handler with pipeline
   * @implements action-handler
   * 
   * Register a handler for an action in the pipeline
   * @param action - The action name to handle
   * @param handler - The handler function to execute
   * @param config - Optional configuration for the handler
   * @returns Unregister function to remove the handler
   * 
   * @example
   * ```typescript
   * const unregister = actionRegister.register('updateUser', 
   *   async (payload, controller) => {
   *     // Validate payload
   *     if (!payload.id) {
   *       controller.abort('User ID is required');
   *       return;
   *     }
   *     
   *     // Process update
   *     await updateUserInStore(payload);
   *     controller.next();
   *   }, 
   *   { priority: 10, blocking: true }
   * );
   * 
   * // Later, remove the handler
   * unregister();
   * ```
   */
  register<K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config: HandlerConfig = {}
  ): UnregisterFunction {
    this.logger.trace(`Registering handler for action '${String(action)}'`, { config });
    
    // Generate unique handler ID
    const handlerId = config.id || `handler_${++this.handlerCounter}`;
    
    this.logger.trace(`Generated handler ID: ${handlerId}`);
    
    // Create handler registration with defaults
    const registration: HandlerRegistration<T[K]> = {
      handler,
      config: {
        priority: config.priority ?? 0,
        id: handlerId,
        blocking: config.blocking ?? false,
        once: config.once ?? false,
        condition: config.condition || (() => true),
        debounce: config.debounce,
        throttle: config.throttle,
        validation: config.validation,
        middleware: config.middleware ?? false,
      } as Required<HandlerConfig>,
      id: handlerId,
    };
    
    this.logger.trace(`Created handler registration`, { registration: { id: handlerId, config: registration.config } });

    // Initialize pipeline if it doesn't exist
    if (!this.pipelines.has(action)) {
      this.logger.trace(`Creating new pipeline for action: ${String(action)}`);
      this.pipelines.set(action, []);
      this.logger.debug(`Created pipeline for action: ${String(action)}`);
    }

    const pipeline = this.pipelines.get(action)!;
    this.logger.trace(`Current pipeline for '${String(action)}' has ${pipeline.length} handlers`);
    
    // Check for duplicate handler IDs
    if (pipeline.some(reg => reg.id === handlerId)) {
      this.logger.warn(`Handler with ID '${handlerId}' already exists for action '${String(action)}'`);
      this.logger.trace(`Duplicate handler registration aborted`);
      return () => {}; // Return no-op unregister function
    }

    // Add handler to pipeline
    pipeline.push(registration);
    this.logger.trace(`Added handler to pipeline, current length: ${pipeline.length}`);
    
    // Sort pipeline by priority (highest first)
    pipeline.sort((a, b) => b.config.priority - a.config.priority);
    this.logger.trace(`Pipeline sorted by priority`, { 
      priorities: pipeline.map(reg => ({ id: reg.id, priority: reg.config.priority })) 
    });

    this.logger.debug(LogArtHelpers.core.debug(`핸들러 등록 완료: '${String(action)}'`, {
      handlerId,
      priority: registration.config.priority,
      blocking: registration.config.blocking,
      once: registration.config.once,
    }));

    // Emit registration event
    this.events.emit('handler:register', {
      action,
      handlerId,
      config: registration.config,
    });

    // Return unregister function
    return () => {
      this.logger.trace(`Unregistering handler '${handlerId}' from action '${String(action)}'`);
      const index = pipeline.findIndex(reg => reg.id === handlerId);
      if (index !== -1) {
        pipeline.splice(index, 1);
        this.logger.debug(`Unregistered handler '${handlerId}' from action '${String(action)}'`);
        this.logger.trace(`Pipeline now has ${pipeline.length} handlers`);
        
        // Emit unregistration event
        this.events.emit('handler:unregister', {
          action,
          handlerId,
        });
      } else {
        this.logger.trace(`Handler '${handlerId}' not found in pipeline for unregistration`);
      }
    };
  }

  /**
   * Dispatch action through pipeline
   * @implements action-dispatcher
   * 
   * Dispatch an action through the pipeline
   * Overloaded to provide type safety for actions with and without payloads
   */
  dispatch: ActionDispatcher<T> = async <K extends keyof T>(
    action: K,
    payload?: T[K]
  ): Promise<void> => {
    const startTime = Date.now();
    this.logger.trace(`Starting dispatch for action '${String(action)}'`, { 
      action, 
      payload, 
      startTime 
    });
    
    // Emit action start event
    this.events.emit('action:start', { action, payload });
    this.logger.trace(`Emitted 'action:start' event`);

    this.logger.debug(LogArtHelpers.core.start(`액션 디스패치: '${String(action)}'`));

    const pipeline = this.pipelines.get(action);
    if (!pipeline || pipeline.length === 0) {
      this.logger.warn(LogArtHelpers.core.error(`액션 디스패치: '${String(action)}'`, '등록된 핸들러가 없음'));
      this.logger.trace(`Dispatch completed early - no handlers`);
      return;
    }
    
    this.logger.trace(`Found ${pipeline.length} handlers for action '${String(action)}'`, {
      handlerIds: pipeline.map(reg => reg.id)
    });

    // Determine execution mode for this action
    const currentExecutionMode = this.actionExecutionModes.get(action) || this.executionMode;

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

    try {
      await this.executePipeline(context);
      
      // Create success metrics
      const metrics: ActionMetrics = {
        action: String(action),
        executionTime: Date.now() - startTime,
        handlerCount: context.handlers.length,
        success: !context.aborted,
        timestamp: Date.now(),
      };

      if (context.aborted) {
        metrics.error = context.abortReason;
        this.events.emit('action:abort', {
          action,
          payload,
          reason: context.abortReason,
        });
      } else {
        this.events.emit('action:complete', {
          action,
          payload,
          metrics,
        });
      }

      const duration = Date.now() - startTime;
      this.logger.debug(LogArtHelpers.core.end(`액션 디스패치: '${String(action)}'`, duration));

    } catch (error: any) {
      const metrics: ActionMetrics = {
        action: String(action),
        executionTime: Date.now() - startTime,
        handlerCount: context.handlers.length,
        success: false,
        error: error.message || 'Unknown error',
        timestamp: Date.now(),
      };

      this.logger.error(LogArtHelpers.core.error(`액션 디스패치: '${String(action)}'`, error.message || 'Unknown error'));
      
      this.events.emit('action:error', {
        action,
        payload,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics,
      });

      throw error;
    }
  };

  /**
   * Execute the pipeline with proper flow control
   * @implements pipeline-execution
   * @implements flow-control
   * @memberof core-concepts
   * @internal
   * @since 1.0.0
   * 
   * Executes action pipeline using configured execution mode
   * @implements execution-mode
   * 
   * @template K - The action key type being executed
   * @param context - Pipeline execution context containing handlers, payload, and state
   * @returns Promise that resolves when pipeline execution completes or aborts
   * 
   * @throws {Error} When execution mode is unknown or handler execution fails
   */
  private async executePipeline<K extends keyof T>(context: PipelineContext<T[K]>): Promise<void> {
    this.logger.trace(`Starting pipeline execution`, {
      action: context.action,
      handlerCount: context.handlers.length,
      executionMode: context.executionMode,
      payload: context.payload
    });

    /**
     * Create controller factory for handlers
     * @implements pipeline-controller
     * Each handler receives a unique controller instance with action-specific context
     */
    const createController = (registration: HandlerRegistration<T[K]>, _index: number): PipelineController<T[K]> => {
      return {
        next: () => {
          /** Next is called automatically after handler completion in sequential mode */
          /** In parallel/race modes, this method is essentially a no-op */
        },
        abort: (reason?: string) => {
          /** Set abort flag to stop pipeline execution immediately */
          this.logger.trace(`Handler '${registration.id}' is aborting pipeline`, { reason });
          context.aborted = true;
          context.abortReason = reason;
          this.logger.warn(`Pipeline aborted by handler '${registration.id}'`, { reason });
        },
        modifyPayload: (modifier: (payload: T[K]) => T[K]) => {
          /** Transform payload for subsequent handlers in the pipeline */
          this.logger.trace(`Handler '${registration.id}' is modifying payload`);
          const oldPayload = context.payload;
          context.payload = modifier(context.payload);
          this.logger.debug(`Payload modified by handler '${registration.id}'`);
          this.logger.trace(`Payload change`, { oldPayload, newPayload: context.payload });
        },
        getPayload: () => context.payload,
        jumpToPriority: (priority: number) => {
          /** Set priority jump target for sequential execution mode */
          this.logger.trace(`Handler '${registration.id}' jumping to priority ${priority}`);
          context.jumpToPriority = priority;
        },
      };
    };

    /** Delegate execution to mode-specific implementation */
    switch (context.executionMode) {
      case 'sequential':
        await executeSequential(context, createController, this.logger);
        break;
      case 'parallel':
        await executeParallel(context, createController, this.logger);
        break;
      case 'race':
        await executeRace(context, createController, this.logger);
        break;
      default:
        throw new Error(`Unknown execution mode: ${context.executionMode}`);
    }

    /** Clean up one-time handlers after successful execution */
    this.cleanupOneTimeHandlers(context.action as K, context.handlers);
  }

  /**
   * Clean up one-time handlers after pipeline execution
   * @implements cleanup-function
   * @implements memory-management
   * @memberof core-concepts
   * @internal
   * @since 1.0.0
   * 
   * Removes one-time handlers after pipeline execution
   * @implements cleanup-function
   * 
   * @template K - The action key type
   * @param action - The action whose handlers should be cleaned up
   * @param executedHandlers - Array of handlers that were executed in this pipeline run
   * @returns void
   */
  private cleanupOneTimeHandlers<K extends keyof T>(action: K, executedHandlers: HandlerRegistration<T[K]>[]): void {
    const pipeline = this.pipelines.get(action);
    if (!pipeline) return;

    /** Find handlers marked for one-time execution */
    const oneTimeHandlers = executedHandlers.filter(reg => reg.config.once);
    if (oneTimeHandlers.length === 0) return;

    this.logger.trace(`Cleaning up ${oneTimeHandlers.length} one-time handlers`);

    /** Remove each one-time handler from the active pipeline */
    oneTimeHandlers.forEach(registration => {
      const index = pipeline.findIndex(reg => reg.id === registration.id);
      if (index !== -1) {
        /** Remove handler while preserving array integrity */
        pipeline.splice(index, 1);
        this.logger.debug(`Removed one-time handler '${registration.id}'`);
      }
    });

    this.logger.trace(`Pipeline now has ${pipeline.length} handlers`);
  }

  /**
   * Get the number of handlers registered for an action
   * @param action - The action to check
   * @returns Number of handlers registered
   */
  getHandlerCount<K extends keyof T>(action: K): number {
    const pipeline = this.pipelines.get(action);
    const count = pipeline ? pipeline.length : 0;
    this.logger.trace(`Handler count for '${String(action)}': ${count}`);
    return count;
  }

  /**
   * Check if any handlers are registered for an action
   * @param action - The action to check
   * @returns True if handlers are registered
   */
  hasHandlers<K extends keyof T>(action: K): boolean {
    const hasHandlers = this.getHandlerCount(action) > 0;
    this.logger.trace(`Has handlers for '${String(action)}': ${hasHandlers}`);
    return hasHandlers;
  }

  /**
   * Get all registered action names
   * @returns Array of action names
   */
  getRegisteredActions(): (keyof T)[] {
    const actions = Array.from(this.pipelines.keys());
    this.logger.trace(`Registered actions`, { actions, count: actions.length });
    return actions;
  }

  /**
   * Clear all handlers for a specific action
   * @param action - The action to clear
   */
  clearAction<K extends keyof T>(action: K): void {
    this.logger.trace(`Clearing handlers for action '${String(action)}'`);
    const pipeline = this.pipelines.get(action);
    if (pipeline) {
      const handlerCount = pipeline.length;
      this.pipelines.delete(action);
      this.logger.debug(`Cleared ${handlerCount} handlers for action '${String(action)}'`);
      this.logger.trace(`Action '${String(action)}' pipeline removed`);
    } else {
      this.logger.trace(`No pipeline found for action '${String(action)}' to clear`);
    }
  }

  /**
   * Clear all handlers for all actions
   */
  clearAll(): void {
    this.logger.trace(`Clearing all handlers and pipelines`);
    const actionCount = this.pipelines.size;
    const totalHandlers = Array.from(this.pipelines.values())
      .reduce((sum, pipeline) => sum + pipeline.length, 0);
    
    this.logger.trace(`Before clear`, { actionCount, totalHandlers });
    
    this.pipelines.clear();
    this.events.removeAllListeners();
    
    this.logger.info(`Cleared all handlers`, {
      actionCount,
      totalHandlers,
    });
    
    this.logger.trace(`All pipelines and event listeners cleared`);
  }

  /**
   * Add event listener for ActionRegister events
   * @param event - Event name to listen for
   * @param handler - Event handler function
   * @returns Unregister function to remove the listener
   */
  on<K extends keyof ActionRegisterEvents<T>>(
    event: K,
    handler: EventHandler<ActionRegisterEvents<T>[K]>
  ): UnregisterFunction {
    return this.events.on(event, handler);
  }

  /**
   * Remove event listener
   * @param event - Event name
   * @param handler - Event handler to remove
   */
  off<K extends keyof ActionRegisterEvents<T>>(
    event: K,
    handler: EventHandler<ActionRegisterEvents<T>[K]>
  ): void {
    this.events.off(event, handler);
  }

  /**
   * Get current configuration
   * @returns Current ActionRegister configuration
   */
  getConfig(): Readonly<Required<ActionRegisterConfig>> {
    return { ...this.config };
  }

  /**
   * Get logger instance
   * @returns Current logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }
}