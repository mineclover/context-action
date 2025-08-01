/**
 * @fileoverview Execution mode implementations for ActionRegister
 * Provides different execution strategies for action pipelines
 */

import type { 
  HandlerRegistration, 
  PipelineContext, 
  PipelineController
} from './types.js';
import type { Logger } from '@context-action/logger';

/**
 * Execute handlers in sequential mode (one after another)
 * @implements execution-modes
 * @implements sequential-execution
 * @memberof core-concepts
 * @internal
 * @since 1.0.0
 * 
 * Executes action handlers sequentially in priority order, supporting flow control,
 * conditional execution, and priority jumping within the pipeline.
 * 
 * @template T - The type of the payload being processed
 * @param context - Pipeline execution context with handlers and state
 * @param createController - Factory function for creating pipeline controllers
 * @param logger - Logger instance for tracing execution
 * @returns Promise that resolves when all handlers complete or pipeline aborts
 * 
 * Features:
 * - Priority-based execution order (higher priority first)
 * - Support for priority jumping within execution
 * - Conditional handler execution (condition/validation checks)
 * - Blocking/non-blocking handler support
 * - Comprehensive error handling and recovery
 */
export async function executeSequential<T>(
  context: PipelineContext<T>,
  createController: (registration: HandlerRegistration<T>, index: number) => PipelineController<T>,
  logger: Logger
): Promise<void> {
  logger.trace('Executing in sequential mode', {
    handlerCount: context.handlers.length
  });

  for (let i = 0; i < context.handlers.length; i++) {
    if (context.aborted) {
      logger.trace('Sequential execution aborted', { 
        atIndex: i,
        reason: context.abortReason 
      });
      break;
    }

    // Handle jump to priority
    if (context.jumpToPriority !== undefined) {
      const jumpIndex = context.handlers.findIndex(
        handler => handler.config.priority === context.jumpToPriority
      );
      if (jumpIndex !== -1 && jumpIndex !== i) {
        logger.trace('Jumping to priority', {
          fromIndex: i,
          toIndex: jumpIndex,
          priority: context.jumpToPriority
        });
        i = jumpIndex - 1; // -1 because loop will increment
        context.jumpToPriority = undefined;
        continue;
      }
      context.jumpToPriority = undefined;
    }

    const registration = context.handlers[i];
    context.currentIndex = i;

    // Check condition if provided
    if (registration.config.condition && !registration.config.condition()) {
      logger.debug(`Skipping handler '${registration.id}' - condition not met`);
      continue;
    }

    // Check validation if provided
    if (registration.config.validation && !registration.config.validation(context.payload)) {
      logger.debug(`Skipping handler '${registration.id}' - validation failed`);
      continue;
    }

    const controller = createController(registration, i);

    try {
      logger.trace(`Executing handler ${i + 1}/${context.handlers.length}`, {
        handlerId: registration.id,
        priority: registration.config.priority
      });

      const result = registration.handler(context.payload, controller);

      // Wait for async handlers if they're blocking
      if (registration.config.blocking && result instanceof Promise) {
        logger.trace(`Waiting for blocking handler '${registration.id}'`);
        await result;
      }

      logger.trace(`Handler '${registration.id}' completed`);

    } catch (error: any) {
      logger.error(`Handler '${registration.id}' threw an error`, error);
      
      if (registration.config.blocking) {
        throw error;
      }
    }
  }
}

/**
 * Execute handlers in parallel mode (all at once)
 * @internal
 */
export async function executeParallel<T>(
  context: PipelineContext<T>,
  createController: (registration: HandlerRegistration<T>, index: number) => PipelineController<T>,
  logger: Logger
): Promise<void> {
  logger.trace('Executing in parallel mode', {
    handlerCount: context.handlers.length
  });

  // Filter handlers that should run
  const runnableHandlers = context.handlers.filter((registration, _index) => {
    // Check condition
    if (registration.config.condition && !registration.config.condition()) {
      logger.debug(`Skipping handler '${registration.id}' - condition not met`);
      return false;
    }

    // Check validation
    if (registration.config.validation && !registration.config.validation(context.payload)) {
      logger.debug(`Skipping handler '${registration.id}' - validation failed`);
      return false;
    }

    return true;
  });

  logger.trace(`Running ${runnableHandlers.length} handlers in parallel`);

  // Create promises for all handlers
  const handlerPromises = runnableHandlers.map(async (registration, _index) => {
    const controller = createController(registration, _index);
    
    try {
      logger.trace(`Starting parallel handler '${registration.id}'`);
      
      const result = registration.handler(context.payload, controller);
      
      if (result instanceof Promise) {
        await result;
      }
      
      logger.trace(`Parallel handler '${registration.id}' completed`);
      return { success: true, handlerId: registration.id };
      
    } catch (error: any) {
      logger.error(`Parallel handler '${registration.id}' failed`, error);
      
      if (registration.config.blocking) {
        throw error;
      }
      
      return { success: false, handlerId: registration.id, error };
    }
  });

  // Wait for all handlers to complete
  const results = await Promise.allSettled(handlerPromises);
  
  // Check for any rejected blocking handlers
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

  logger.trace('Parallel execution completed', {
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length
  });
}

/**
 * Execute handlers in race mode (first to complete wins)
 * @internal
 */
export async function executeRace<T>(
  context: PipelineContext<T>,
  createController: (registration: HandlerRegistration<T>, index: number) => PipelineController<T>,
  logger: Logger
): Promise<void> {
  logger.trace('Executing in race mode', {
    handlerCount: context.handlers.length
  });

  // Filter handlers that should run
  const runnableHandlers = context.handlers.filter((registration, _index) => {
    // Check condition
    if (registration.config.condition && !registration.config.condition()) {
      logger.debug(`Skipping handler '${registration.id}' - condition not met`);
      return false;
    }

    // Check validation
    if (registration.config.validation && !registration.config.validation(context.payload)) {
      logger.debug(`Skipping handler '${registration.id}' - validation failed`);
      return false;
    }

    return true;
  });

  if (runnableHandlers.length === 0) {
    logger.trace('No runnable handlers for race mode');
    return;
  }

  logger.trace(`Racing ${runnableHandlers.length} handlers`);

  // Create promises for all handlers
  const handlerPromises = runnableHandlers.map(async (registration, _index) => {
    const controller = createController(registration, _index);
    
    try {
      logger.trace(`Starting race handler '${registration.id}'`);
      
      const result = registration.handler(context.payload, controller);
      
      if (result instanceof Promise) {
        await result;
      }
      
      logger.trace(`Race handler '${registration.id}' completed`);
      return { success: true, handlerId: registration.id, registration };
      
    } catch (error: any) {
      logger.error(`Race handler '${registration.id}' failed`, error);
      return { success: false, handlerId: registration.id, error, registration };
    }
  });

  try {
    // Race all handlers
    const winner = await Promise.race(handlerPromises);
    
    logger.debug('Race completed', {
      winner: winner.handlerId,
      success: winner.success
    });

    // If the winner failed and was blocking, throw the error
    if (!winner.success && winner.registration?.config.blocking) {
      throw winner.error;
    }

  } catch (error: any) {
    logger.error('Race execution failed', error);
    throw error;
  }
}