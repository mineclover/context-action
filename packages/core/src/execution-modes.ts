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
  PipelineController,
  HandlerError
} from './types.js';

/**
 * Create standardized error handling for handlers
 * 
 * @param error - The error that occurred
 * @param registration - The handler registration that failed
 * @returns Standardized HandlerError object
 * 
 * @internal
 */
function handleExecutionError<T, R>(
  error: any,
  registration: HandlerRegistration<T, R>
): HandlerError {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  return {
    handlerId: registration.id,
    error: errorObj,
    timestamp: Date.now(),
    severity: registration.config.blocking ? 'blocking' : 'non-blocking'
  };
}

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
 * @throws {Error} When a blocking handler fails
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-patterns
 * 
 * @public
 */
export async function executeSequential<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void> {

  let i = 0;
  const nonBlockingPromises: Array<Promise<any>> = [];
  const errors: HandlerError[] = [];
  
  while (i < context.handlers.length) {
    // Check for abort or termination
    if (context.aborted || context.terminated) {
      break;
    }

    const registration = context.handlers[i];
    if (!registration) {
      continue; // Skip if handler not found
    }
    context.currentIndex = i;
    const controller = createController(registration, i);

    try {
      // Check for abort before executing handler
      if (context.aborted) {
        break;
      }

      // 🔧 Fix: Check handler condition before execution
      if (registration.config.condition) {
        try {
          const shouldExecute = registration.config.condition(context.payload);
          if (!shouldExecute) {
            i++; // Skip this handler
            continue;
          }
        } catch {
          // If condition function throws, skip the handler
          i++;
          continue;
        }
      }

      const result = registration.handler(context.payload, controller);

      if (registration.config.blocking) {
        // 🆕 Blocking handlers: Wait for completion (sync or async)
        const handlerResult = result instanceof Promise ? await result : result;
        if (handlerResult !== undefined && !context.terminated) {
          context.results.push(handlerResult as R);
        }
      } else {
        // 🆕 Non-blocking handlers: Handle differently for sync vs async
        if (result instanceof Promise) {
          // Non-blocking async: Track promise with error handling
          const promiseWithErrorHandling = result
            .then(asyncResult => {
              if (asyncResult !== undefined && !context.terminated) {
                context.results.push(asyncResult as R);
              }
              return asyncResult;
            })
            .catch(error => {
              // 🆕 Non-blocking async handler error collection
              const handlerError = handleExecutionError(error, registration);
              errors.push({
                handlerId: handlerError.handlerId,
                error: handlerError.error,
                timestamp: handlerError.timestamp,
                severity: 'non-blocking'
              });
              return undefined; // Return undefined for failed non-blocking handlers
            });
          
          nonBlockingPromises.push(promiseWithErrorHandling);
        } else if (result !== undefined && !context.terminated) {
          // Non-blocking sync: Immediately collect result
          context.results.push(result as R);
        }
      }

      /** Check if pipeline was terminated by controller.return() */
      if (context.terminated) {
        break;
      }

      /** Handle jump to priority AFTER handler execution */
      if (context.jumpToPriority !== undefined) {
        // Check if we've exceeded maximum jumps to prevent infinite loops
        context.jumpCount = (context.jumpCount || 0) + 1;
        if (context.jumpCount > (context.maxJumps || 10)) {
          console.error(
            `[ActionRegister] ERROR: Maximum jump limit (${context.maxJumps || 10}) exceeded. ` +
            `Aborting to prevent infinite loop. Check your jumpToPriority logic and conditions.`
          );
          context.aborted = true;
          context.abortReason = `Maximum jump limit exceeded (${context.jumpCount} jumps)`;
          context.jumpToPriority = undefined;
          break;
        }

        // Find first handler with priority <= jumpToPriority
        const jumpIndex = context.handlers.findIndex(
          handler => (handler.config.priority || 0) <= context.jumpToPriority!
        );

        if (jumpIndex !== -1 && jumpIndex !== i) {
          if (jumpIndex < i) {
            // ⚠️ WARNING: Backward jump detected - risk of infinite loop!
            // Only allow backward jumps if handler has condition to prevent infinite loops
            const targetHandler = context.handlers[jumpIndex];
            if (targetHandler && !targetHandler.config.condition) {
              console.warn(
                `[ActionRegister] WARNING: Backward jumpToPriority to handler '${targetHandler.config.id || 'unnamed'}' without condition. ` +
                `This may cause infinite loops! Consider adding a condition to prevent re-execution. ` +
                `Jump count: ${context.jumpCount}/${context.maxJumps || 10}`
              );
            }
          }

          // Allow both forward and backward jumps
          i = jumpIndex;
          context.jumpToPriority = undefined;
          continue;
        } else {
          // No valid jump target found, or jumping to same handler
          context.jumpToPriority = undefined;
          i++;
        }
      } else {
        i++;
      }

    } catch (error: any) {
      // 🔧 Fix: Handle errors gracefully and continue pipeline execution
      const handlerError = handleExecutionError(error, registration);
      errors.push(handlerError);

      // 🔧 Fix: Only fail pipeline for blocking handlers, let non-blocking continue
      if (registration.config.blocking) {
        throw handlerError.error;
      }

      // For non-blocking handlers, continue to next handler
      i++;
    }
  }
  
  // 🆕 Wait for all non-blocking promises with error collection
  if (nonBlockingPromises.length > 0) {
    await Promise.allSettled(nonBlockingPromises);
  }

  // 🔧 Store collected errors in context for ExecutionResult with proper typing
  if (errors.length > 0) {
    // Convert to proper HandlerError format
    const handlerErrors: HandlerError[] = errors.map(err => ({
      handlerId: err.handlerId,
      error: err.error,
      timestamp: err.timestamp,
      severity: 'non-blocking' as const
    }));
    
    // Add to context with proper typing
    (context as PipelineContext<any, any> & { collectedErrors?: HandlerError[] }).collectedErrors = handlerErrors;
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
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-patterns#parallel-execution
 * 
 * @public
 */
export async function executeParallel<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void> {

  /** All handlers are runnable */
  const runnableHandlers = context.handlers;

  /** Create promises for all handlers */
  const handlerPromises = runnableHandlers.map(async (registration, _index) => {
    const controller = createController(registration, _index);

    try {
      // 🔧 Fix: Check handler condition before execution
      if (registration.config.condition) {
        try {
          const shouldExecute = registration.config.condition(context.payload);
          if (!shouldExecute) {
            // Return a skipped result for conditions that don't pass
            return {
              success: true,
              handlerId: registration.id,
              result: undefined,
              terminated: false,
              skipped: true
            };
          }
        } catch {
          // If condition function throws, skip the handler
          return {
            success: true,
            handlerId: registration.id,
            result: undefined,
            terminated: false,
            skipped: true
          };
        }
      }

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
      // 🆕 Consistent error object creation
      const handlerError = handleExecutionError(error, registration);
      
      if (handlerError.severity === 'blocking') {
        throw handlerError.error;
      }
      
      return { success: false, handlerId: registration.id, error: handlerError.error };
    }
  });

  /** Wait for all handlers to complete */
  const results = await Promise.allSettled(handlerPromises);
  
  /** Check for any rejected blocking handlers */
  const failures = results.filter((result, index) => {
    if (result.status === 'rejected') {
      const registration = runnableHandlers[index];
      return registration?.config.blocking ?? false;
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
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-patterns#race-execution
 * 
 * @public
 */
export async function executeRace<T, R = void>(
  context: PipelineContext<T, R>,
  createController: (registration: HandlerRegistration<T, R>, index: number) => PipelineController<T, R>
): Promise<void> {

  /** All handlers are runnable */
  const runnableHandlers = context.handlers;

  if (runnableHandlers.length === 0) {
    return;
  }

  /** Create promises for all handlers */
  const handlerPromises = runnableHandlers.map(async (registration, _index) => {
    const controller = createController(registration, _index);

    try {
      // 🔧 Fix: Check handler condition before execution
      if (registration.config.condition) {
        try {
          const shouldExecute = registration.config.condition(context.payload);
          if (!shouldExecute) {
            // Return a skipped result for conditions that don't pass
            return {
              success: true,
              handlerId: registration.id,
              registration,
              result: undefined,
              terminated: false,
              skipped: true
            };
          }
        } catch {
          // If condition function throws, skip the handler
          return {
            success: true,
            handlerId: registration.id,
            registration,
            result: undefined,
            terminated: false,
            skipped: true
          };
        }
      }

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
      // 🆕 Consistent error object creation
      const handlerError = handleExecutionError(error, registration);
      return { success: false, handlerId: registration.id, error: handlerError.error, registration };
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