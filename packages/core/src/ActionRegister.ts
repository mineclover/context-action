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
  Logger,
} from './types.js';
import { createLogger } from './logger.js';

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

  constructor(config: ActionRegisterConfig = {}) {
    // Set defaults for configuration
    this.config = {
      logger: config.logger || createLogger(config.logLevel),
      logLevel: config.logLevel ?? 3, // ERROR level as default
      name: config.name || 'ActionRegister',
      debug: config.debug ?? false,
    };

    this.logger = this.config.logger;

    if (this.config.debug) {
      this.logger.info(`${this.config.name} initialized`, {
        logLevel: this.config.logLevel,
        debug: this.config.debug,
      });
    }
  }

  /**
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
      },
      id: handlerId,
    };

    // Initialize pipeline if it doesn't exist
    if (!this.pipelines.has(action)) {
      this.pipelines.set(action, []);
      this.logger.debug(`Created pipeline for action: ${String(action)}`);
    }

    const pipeline = this.pipelines.get(action)!;
    
    // Check for duplicate handler IDs
    if (pipeline.some(reg => reg.id === handlerId)) {
      this.logger.warn(`Handler with ID '${handlerId}' already exists for action '${String(action)}'`);
      return () => {}; // Return no-op unregister function
    }

    // Add handler to pipeline
    pipeline.push(registration);
    
    // Sort pipeline by priority (highest first)
    pipeline.sort((a, b) => b.config.priority - a.config.priority);

    this.logger.debug(`Registered handler for action '${String(action)}'`, {
      handlerId,
      priority: registration.config.priority,
      blocking: registration.config.blocking,
      once: registration.config.once,
    });

    // Emit registration event
    this.events.emit('handler:register', {
      action,
      handlerId,
      config: registration.config,
    });

    // Return unregister function
    return () => {
      const index = pipeline.findIndex(reg => reg.id === handlerId);
      if (index !== -1) {
        pipeline.splice(index, 1);
        this.logger.debug(`Unregistered handler '${handlerId}' from action '${String(action)}'`);
        
        // Emit unregistration event
        this.events.emit('handler:unregister', {
          action,
          handlerId,
        });
      }
    };
  }

  /**
   * Dispatch an action through the pipeline
   * Overloaded to provide type safety for actions with and without payloads
   */
  dispatch: ActionDispatcher<T> = async <K extends keyof T>(
    action: K,
    payload?: T[K]
  ): Promise<void> => {
    const startTime = Date.now();
    
    // Emit action start event
    this.events.emit('action:start', { action, payload });

    this.logger.debug(`Dispatching action '${String(action)}'`, { payload });

    const pipeline = this.pipelines.get(action);
    if (!pipeline || pipeline.length === 0) {
      this.logger.warn(`No handlers registered for action '${String(action)}'`);
      return;
    }

    // Create pipeline execution context
    const context: PipelineContext<T[K]> = {
      action: String(action),
      payload: payload as T[K],
      handlers: [...pipeline], // Copy handlers to avoid modification during execution
      aborted: false,
      abortReason: undefined,
      currentIndex: 0,
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

      this.logger.debug(`Completed action '${String(action)}'`, metrics);

    } catch (error: any) {
      const metrics: ActionMetrics = {
        action: String(action),
        executionTime: Date.now() - startTime,
        handlerCount: context.handlers.length,
        success: false,
        error: error.message || 'Unknown error',
        timestamp: Date.now(),
      };

      this.logger.error(`Error executing action '${String(action)}'`, metrics);
      
      this.events.emit('action:error', {
        action,
        payload,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      throw error;
    }
  };

  /**
   * Execute the pipeline with proper flow control
   * @internal
   */
  private async executePipeline<K extends keyof T>(context: PipelineContext<T[K]>): Promise<void> {
    for (let i = 0; i < context.handlers.length; i++) {
      if (context.aborted) break;

      const registration = context.handlers[i];
      context.currentIndex = i;

      // Check condition if provided
      if (registration.config.condition && !registration.config.condition()) {
        this.logger.debug(`Skipping handler '${registration.id}' - condition not met`);
        continue;
      }

      // Create controller for this handler
      const controller: PipelineController<T[K]> = {
        next: () => {
          // Next is called automatically after handler completion
        },
        abort: (reason?: string) => {
          context.aborted = true;
          context.abortReason = reason;
          this.logger.warn(`Pipeline aborted by handler '${registration.id}'`, { reason });
        },
        modifyPayload: (modifier: (payload: T[K]) => T[K]) => {
          context.payload = modifier(context.payload);
          this.logger.debug(`Payload modified by handler '${registration.id}'`);
        },
        getPayload: () => context.payload,
      };

      try {
        // Execute handler
        const result = registration.handler(context.payload, controller);
        
        // Wait for async handlers if they're blocking
        if (registration.config.blocking && result instanceof Promise) {
          await result;
        }

        // Remove one-time handlers after execution
        if (registration.config.once) {
          const pipeline = this.pipelines.get(context.action as keyof T);
          if (pipeline) {
            const index = pipeline.findIndex(reg => reg.id === registration.id);
            if (index !== -1) {
              pipeline.splice(index, 1);
              this.logger.debug(`Removed one-time handler '${registration.id}'`);
            }
          }
        }

      } catch (error: any) {
        this.logger.error(`Handler '${registration.id}' threw an error`, error);
        
        // For blocking handlers, propagate the error
        if (registration.config.blocking) {
          throw error;
        }
        
        // For non-blocking handlers, continue execution
        continue;
      }
    }
  }

  /**
   * Get the number of handlers registered for an action
   * @param action - The action to check
   * @returns Number of handlers registered
   */
  getHandlerCount<K extends keyof T>(action: K): number {
    const pipeline = this.pipelines.get(action);
    return pipeline ? pipeline.length : 0;
  }

  /**
   * Check if any handlers are registered for an action
   * @param action - The action to check
   * @returns True if handlers are registered
   */
  hasHandlers<K extends keyof T>(action: K): boolean {
    return this.getHandlerCount(action) > 0;
  }

  /**
   * Get all registered action names
   * @returns Array of action names
   */
  getRegisteredActions(): (keyof T)[] {
    return Array.from(this.pipelines.keys());
  }

  /**
   * Clear all handlers for a specific action
   * @param action - The action to clear
   */
  clearAction<K extends keyof T>(action: K): void {
    const pipeline = this.pipelines.get(action);
    if (pipeline) {
      const handlerCount = pipeline.length;
      this.pipelines.delete(action);
      this.logger.debug(`Cleared ${handlerCount} handlers for action '${String(action)}'`);
    }
  }

  /**
   * Clear all handlers for all actions
   */
  clearAll(): void {
    const actionCount = this.pipelines.size;
    const totalHandlers = Array.from(this.pipelines.values())
      .reduce((sum, pipeline) => sum + pipeline.length, 0);
    
    this.pipelines.clear();
    this.events.removeAllListeners();
    
    this.logger.info(`Cleared all handlers`, {
      actionCount,
      totalHandlers,
    });
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