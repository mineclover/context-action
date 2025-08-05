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
export async function executeSequential<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void> {

  let i = 0;
  
  while (i < context.handlers.length) {
    if (context.aborted || context.terminated) {
      break;
    }

    const registration = context.handlers[i];
    context.currentIndex = i;

    /** Check condition if provided */
    if (registration.config.condition && !registration.config.condition()) {
      i++;
      continue;
    }

    /** Check validation if provided */
    if (registration.config.validation && !registration.config.validation(context.payload)) {
      i++;
      continue;
    }

    const controller = createController(registration, i);

    try {
      const result = registration.handler(context.payload, controller);

      /** Wait for async handlers if they're blocking */
      if (registration.config.blocking && result instanceof Promise) {
        const handlerResult = await result;
        
        /** Collect result if handler returned something and wasn't terminated */
        if (handlerResult !== undefined && !context.terminated) {
          context.results.push(handlerResult);
        }
      } else if (result !== undefined && !context.terminated) {
        /** Collect synchronous result */
        if (result instanceof Promise) {
          // Non-blocking async handler - don't wait but collect result when resolved
          result.then(asyncResult => {
            if (asyncResult !== undefined && !context.terminated) {
              context.results.push(asyncResult);
            }
          }).catch(() => {
            // Ignore errors from non-blocking handlers
          });
        } else {
          context.results.push(result);
        }
      }

      /** Check if pipeline was terminated by controller.return() */
      if (context.terminated) {
        break;
      }

      /** Handle jump to priority AFTER handler execution */
      if (context.jumpToPriority !== undefined) {
        const jumpIndex = context.handlers.findIndex(
          handler => handler.config.priority === context.jumpToPriority
        );
        
        if (jumpIndex !== -1) {
          // Jump to the target index directly (position movement)
          i = jumpIndex;
          context.jumpToPriority = undefined;
          continue; // Continue to execute the handler at jump destination
        } else {
          // Invalid jump target, clear and continue normally
          context.jumpToPriority = undefined;
          i++;
        }
      } else {
        // Normal progression to next handler
        i++;
      }

    } catch (error: any) {
      if (registration.config.blocking) {
        throw error;
      }
      // For non-blocking handlers, continue to next handler
      i++;
    }
  }
}

/**
 * Execute handlers in parallel mode (all at once)
 */
export async function executeParallel<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
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
      
      let handlerResult: R | undefined;
      if (result instanceof Promise) {
        handlerResult = await result;
      } else {
        handlerResult = result;
      }
      
      /** Collect result if handler returned something and pipeline wasn't terminated */
      if (handlerResult !== undefined && !context.terminated) {
        context.results.push(handlerResult);
      }
      
      return { 
        success: true, 
        handlerId: registration.id, 
        result: handlerResult,
        terminated: context.terminated 
      };
      
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

  /** Check if any handler terminated the pipeline */
  const terminatedResults = results.filter(result => 
    result.status === 'fulfilled' && result.value.terminated
  );
  
  if (terminatedResults.length > 0) {
    context.terminated = true;
    // In parallel mode, we can't determine which handler's termination result to use,
    // so we use the first one that terminated
    const firstTerminated = terminatedResults[0] as PromiseFulfilledResult<any>;
    context.terminationResult = firstTerminated.value.result;
  }
}

/**
 * Execute handlers in race mode (first to complete wins)
 */
export async function executeRace<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
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
      
      let handlerResult: R | undefined;
      if (result instanceof Promise) {
        handlerResult = await result;
      } else {
        handlerResult = result;
      }
      
      return { 
        success: true, 
        handlerId: registration.id, 
        registration,
        result: handlerResult,
        terminated: context.terminated
      };
      
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

  /** Collect result from the winning handler */
  if (winner.success && winner.result !== undefined) {
    context.results.push(winner.result);
  }

  /** Check if the winning handler terminated the pipeline */
  if (winner.success && winner.terminated) {
    context.terminated = true;
    context.terminationResult = winner.result;
  }
}