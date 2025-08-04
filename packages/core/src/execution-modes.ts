/**
 * @fileoverview Execution mode implementations for ActionRegister
 * Provides different execution strategies for action pipelines
 */

import type { 
  HandlerRegistration, 
  PipelineContext, 
  PipelineController
} from './types.js';

/**
 * Execute handlers in sequential mode (one after another)
 */
export async function executeSequential<T>(
  context: PipelineContext<T>,
  createController: (registration: HandlerRegistration<T>, index: number) => PipelineController<T>
): Promise<void> {

  for (let i = 0; i < context.handlers.length; i++) {
    if (context.aborted) {
      break;
    }

    /** Handle jump to priority */
    if (context.jumpToPriority !== undefined) {
      const jumpIndex = context.handlers.findIndex(
        handler => handler.config.priority === context.jumpToPriority
      );
      if (jumpIndex !== -1 && jumpIndex !== i) {
        i = jumpIndex - 1; // -1 because loop will increment
        context.jumpToPriority = undefined;
        continue;
      }
      context.jumpToPriority = undefined;
    }

    const registration = context.handlers[i];
    context.currentIndex = i;

    /** Check condition if provided */
    if (registration.config.condition && !registration.config.condition()) {
      continue;
    }

    /** Check validation if provided */
    if (registration.config.validation && !registration.config.validation(context.payload)) {
      continue;
    }

    const controller = createController(registration, i);

    try {
      const result = registration.handler(context.payload, controller);

      /** Wait for async handlers if they're blocking */
      if (registration.config.blocking && result instanceof Promise) {
        await result;
      }

    } catch (error: any) {
      if (registration.config.blocking) {
        throw error;
      }
    }
  }
}

/**
 * Execute handlers in parallel mode (all at once)
 */
export async function executeParallel<T>(
  context: PipelineContext<T>,
  createController: (registration: HandlerRegistration<T>, index: number) => PipelineController<T>
): Promise<void> {

  /** Filter handlers that should run */
  const runnableHandlers = context.handlers.filter((registration, _index) => {
    /** Check condition */
    if (registration.config.condition && !registration.config.condition()) {
      return false;
    }

    /** Check validation */
    if (registration.config.validation && !registration.config.validation(context.payload)) {
      return false;
    }

    return true;
  });

  /** Create promises for all handlers */
  const handlerPromises = runnableHandlers.map(async (registration, _index) => {
    const controller = createController(registration, _index);
    
    try {
      const result = registration.handler(context.payload, controller);
      
      if (result instanceof Promise) {
        await result;
      }
      
      return { success: true, handlerId: registration.id };
      
    } catch (error: any) {
      if (registration.config.blocking) {
        throw error;
      }
      
      return { success: false, handlerId: registration.id, error };
    }
  });

  /** Wait for all handlers to complete */
  const results = await Promise.allSettled(handlerPromises);
  
  /** Check for any rejected blocking handlers */
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
}

/**
 * Execute handlers in race mode (first to complete wins)
 */
export async function executeRace<T>(
  context: PipelineContext<T>,
  createController: (registration: HandlerRegistration<T>, index: number) => PipelineController<T>
): Promise<void> {

  /** Filter handlers that should run */
  const runnableHandlers = context.handlers.filter((registration, _index) => {
    /** Check condition */
    if (registration.config.condition && !registration.config.condition()) {
      return false;
    }

    /** Check validation */
    if (registration.config.validation && !registration.config.validation(context.payload)) {
      return false;
    }

    return true;
  });

  if (runnableHandlers.length === 0) {
    return;
  }

  /** Create promises for all handlers */
  const handlerPromises = runnableHandlers.map(async (registration, _index) => {
    const controller = createController(registration, _index);
    
    try {
      const result = registration.handler(context.payload, controller);
      
      if (result instanceof Promise) {
        await result;
      }
      
      return { success: true, handlerId: registration.id, registration };
      
    } catch (error: any) {
      return { success: false, handlerId: registration.id, error, registration };
    }
  });

  /** Race all handlers */
  const winner = await Promise.race(handlerPromises);

  /** If the winner failed and was blocking, throw the error */
  if (!winner.success && winner.registration?.config.blocking) {
    throw winner.error;
  }
}