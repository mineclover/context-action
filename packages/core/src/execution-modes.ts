/**
 * @fileoverview Execution mode implementations for ActionRegister
 * 
 * Provides three different execution strategies for action handler pipelines:
 * - Sequential: Execute handlers one after another in priority order
 * - Parallel: Execute all handlers simultaneously
 * - Race: First handler to complete wins, others are cancelled
 */

import type { 
  HandlerRegistration, 
  PipelineContext, 
  PipelineController
} from './types.js';

/**
 * Execute handlers in sequential mode (one after another)
 * 
 * Executes action handlers one at a time in priority order (highest first).
 * Supports both blocking and non-blocking handlers, with proper abort and
 * termination handling. Handlers can modify payload for subsequent handlers
 * and jump to different priority levels.
 * 
 * @template T - The payload type for the action
 * @template R - The result type for handlers
 * 
 * @param context - Pipeline execution context containing handlers and state
 * @param createController - Factory function for creating pipeline controllers
 * 
 * @throws {Error} When a blocking handler fails or validation errors occur
 * 
 * @example
 * ```typescript
 * // This is called internally by ActionRegister.dispatch()
 * // when executionMode is 'sequential'
 * 
 * // Handlers execute in this order (by priority):
 * // 1. Priority 100: Validation handler
 * // 2. Priority 50: Business logic handler  
 * // 3. Priority 10: Logging handler
 * 
 * await executeSequential(context, (registration, index) => ({
 *   abort: (reason) => { context.aborted = true; context.abortReason = reason },
 *   modifyPayload: (modifier) => { context.payload = modifier(context.payload) },
 *   // ... other controller methods
 * }))
 * ```
 * 
 * @public
 */
export async function executeSequential<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void> {

  let i = 0;
  const nonBlockingPromises: Promise<any>[] = [];
  
  while (i < context.handlers.length) {
    // Check for abort or termination
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
      // Check for abort before executing handler
      if (context.aborted) {
        break;
      }
      
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
          // Non-blocking async handler - track promise for error handling
          const promiseWithHandling = result.then(asyncResult => {
            if (asyncResult !== undefined && !context.terminated) {
              context.results.push(asyncResult);
            }
            return asyncResult;
          }).catch((error) => {
            // Re-throw the error so it can be caught when we await all promises
            throw error;
          });
          
          nonBlockingPromises.push(promiseWithHandling);
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
      // For non-blocking synchronous handlers, throw immediately
      throw error;
    }
  }
  
  // Wait for all non-blocking async handlers to complete and check for errors
  if (nonBlockingPromises.length > 0) {
    await Promise.all(nonBlockingPromises);
  }
}

/**
 * Execute handlers in parallel mode (all at once)
 * 
 * Executes all qualifying action handlers simultaneously using Promise.allSettled.
 * Supports both blocking and non-blocking handlers. Blocking handlers can still
 * fail the entire pipeline if they throw errors.
 * 
 * @template T - The payload type for the action
 * @template R - The result type for handlers
 * 
 * @param context - Pipeline execution context containing handlers and state
 * @param createController - Factory function for creating pipeline controllers
 * 
 * @throws {Error} When any blocking handler fails
 * 
 * @example
 * ```typescript
 * // This is called internally by ActionRegister.dispatch()
 * // when executionMode is 'parallel'
 * 
 * // All handlers execute simultaneously:
 * // - Analytics handler (non-blocking)
 * // - Validation handler (blocking)
 * // - Update handler (blocking)
 * // - Notification handler (non-blocking)
 * 
 * await executeParallel(context, (registration, index) => ({
 *   abort: (reason) => { context.aborted = true },
 *   setResult: (result) => { context.results.push(result) },
 *   // ... other controller methods
 * }))
 * ```
 * 
 * @example Use Case
 * ```typescript
 * // Perfect for independent operations
 * register.setActionExecutionMode('logEvent', 'parallel')
 * 
 * // These can all run simultaneously:
 * register.register('logEvent', analyticsHandler, { blocking: false })
 * register.register('logEvent', metricsHandler, { blocking: false })
 * register.register('logEvent', auditHandler, { blocking: true })
 * ```
 * 
 * @public
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
        const resolved = await result;
        handlerResult = resolved as R | undefined;
      } else {
        handlerResult = result as R | undefined;
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
 * 
 * Executes all qualifying handlers simultaneously using Promise.race, where
 * the first handler to complete determines the pipeline result. Other handlers
 * are effectively cancelled. Useful for scenarios where you want the fastest
 * response from multiple equivalent handlers.
 * 
 * @template T - The payload type for the action
 * @template R - The result type for handlers
 * 
 * @param context - Pipeline execution context containing handlers and state
 * @param createController - Factory function for creating pipeline controllers
 * 
 * @throws {Error} When the winning handler fails and is blocking
 * 
 * @example
 * ```typescript
 * // This is called internally by ActionRegister.dispatch()
 * // when executionMode is 'race'
 * 
 * // Multiple data sources racing for fastest response:
 * // - Database handler (might be slow)
 * // - Cache handler (usually fast)
 * // - API handler (variable speed)
 * // 
 * // Whichever completes first wins
 * 
 * await executeRace(context, (registration, index) => ({
 *   return: (result) => { 
 *     context.terminated = true
 *     context.terminationResult = result 
 *   },
 *   // ... other controller methods
 * }))
 * ```
 * 
 * @example Use Case
 * ```typescript
 * // Race between multiple data sources
 * register.setActionExecutionMode('fetchUserData', 'race')
 * 
 * // These handlers race for fastest response:
 * register.register('fetchUserData', cacheHandler)     // Usually fastest
 * register.register('fetchUserData', databaseHandler)  // Reliable fallback
 * register.register('fetchUserData', apiHandler)       // External source
 * 
 * // First to complete wins, others are ignored
 * const result = await register.dispatchWithResult('fetchUserData', { id: '123' })
 * ```
 * 
 * @public
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
        const resolved = await result;
        handlerResult = resolved as R | undefined;
      } else {
        handlerResult = result as R | undefined;
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