/**
 * @fileoverview Execution mode implementations for ActionRegister
 * 
 * Provides three different execution strategies for action handler pipelines:
 * - Sequential: Execute handlers one after another in priority order
 * - Parallel: Execute all handlers simultaneously
 * - Race: First handler to complete wins, other started handlers keep running
 */

import type { 
  HandlerError,
  HandlerExecutionOutcome,
  HandlerRegistration, 
  PipelineContext,
  PipelineController,
  PipelineControllerState,
} from './types.js';

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

function beginOutcome<T, R>(registration: HandlerRegistration<T, R>): HandlerExecutionOutcome<R> {
  return {
    id: registration.id,
    status: 'running',
    executed: true,
    duration: undefined,
    result: undefined,
    error: undefined,
    metadata: undefined,
  };
}

function finishOutcome<R>(
  outcome: HandlerExecutionOutcome<R>,
  startedAt: number,
  status: 'succeeded' | 'failed',
  result?: R,
  error?: Error,
): void {
  outcome.status = status;
  outcome.duration = Date.now() - startedAt;
  outcome.result = result;
  outcome.error = error;
}

function appendLocalResults<T, R>(
  context: PipelineContext<T, R>,
  state: PipelineControllerState<T, R>,
  returnedResult: R | undefined,
): void {
  if (state.results.length > 0) context.results.push(...state.results);
  if (returnedResult !== undefined && !state.terminated) {
    context.results.push(returnedResult);
  }
}

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
  error: unknown,
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
  const nonBlockingPromises: Array<Promise<unknown>> = [];
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

    // A condition is part of the dispatch contract, not a best-effort handler.
    // Evaluate it outside the non-blocking handler error path so a broken
    // predicate is never silently converted into a skipped handler.
    if (registration.config.condition) {
      const shouldExecute = registration.config.condition(context.payload);
      if (!shouldExecute) {
        (context.handlerOutcomes ??= []).push({
          id: registration.id,
          status: 'skipped',
          executed: false,
          duration: 0,
          result: undefined,
          error: undefined,
          metadata: undefined,
        });
        i++;
        continue;
      }
    }

    const outcome = beginOutcome(registration);
    const startedAt = Date.now();
    (context.handlerOutcomes ??= []).push(outcome);

    try {
      // Check for abort before executing handler
      if (context.aborted) {
        outcome.status = 'cancelled';
        outcome.executed = false;
        outcome.duration = 0;
        break;
      }

      (context.executedHandlers ??= []).push(registration);
      const result = registration.handler(context.payload, controller);
      const asyncResult = isPromiseLike(result) ? Promise.resolve(result) : undefined;
      const trackedResult = asyncResult && context.trackHandlerPromise
        ? context.trackHandlerPromise<unknown>(asyncResult)
        : asyncResult;

      if (registration.config.blocking) {
        // 🆕 Blocking handlers: Wait for completion (sync or async)
        const handlerResult = trackedResult
          ? await trackedResult
          : result;
        outcome.result = handlerResult as R | undefined;
        finishOutcome(outcome, startedAt, 'succeeded', handlerResult as R | undefined);
        if (handlerResult !== undefined && !context.terminated) {
          context.results.push(handlerResult as R);
        }
      } else {
        // 🆕 Non-blocking handlers: Handle differently for sync vs async
        if (trackedResult) {
          // Non-blocking async: Track promise with error handling
          const promiseWithErrorHandling = trackedResult
            .then(asyncResult => {
              finishOutcome(outcome, startedAt, 'succeeded', asyncResult as R | undefined);
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
              finishOutcome(
                outcome,
                startedAt,
                'failed',
                undefined,
                handlerError.error,
              );
              return undefined; // Return undefined for failed non-blocking handlers
            });
          
          nonBlockingPromises.push(promiseWithErrorHandling);
        } else if (result !== undefined && !context.terminated) {
          // Non-blocking sync: Immediately collect result
          finishOutcome(outcome, startedAt, 'succeeded', result as R);
          context.results.push(result as R);
        } else {
          finishOutcome(outcome, startedAt, 'succeeded', result as R | undefined);
        }
      }

      outcome.terminationRequested = context.terminated;
      if (context.terminated) outcome.terminationResult = context.terminationResult;

      /** Check if pipeline was terminated by controller.return() */
      if (context.terminated) {
        break;
      }

      /** Handle jump to priority AFTER handler execution */
      if (context.jumpToPriority !== undefined) {
        // Check if we've exceeded maximum jumps to prevent infinite loops
        context.jumpCount = (context.jumpCount || 0) + 1;
        if (context.jumpCount > (context.maxJumps || 10)) {
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
          // The bounded jump counter protects both forward and backward jumps
          // without emitting diagnostics from the execution primitive.
          i = jumpIndex;
          context.jumpToPriority = undefined;
        } else {
          // No valid jump target found, or jumping to same handler
          context.jumpToPriority = undefined;
          i++;
        }
      } else {
        i++;
      }

    } catch (error: unknown) {
      // 🔧 Fix: Handle errors gracefully and continue pipeline execution
      const handlerError = handleExecutionError(error, registration);
      finishOutcome(outcome, startedAt, 'failed', undefined, handlerError.error);
      errors.push(handlerError);
      (context.collectedErrors ??= []).push(handlerError);

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
    // Add to context with the original severity preserved.
    context.collectedErrors = errors;
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
  createController: (
    registration: HandlerRegistration<T, R>,
    index: number,
    state: PipelineControllerState<T, R>,
  ) => PipelineController<T, R>
): Promise<void> {

  /**
   * Conditions are dispatch preconditions in concurrent modes. Evaluate them
   * before any handler starts so a predicate error rejects the dispatch rather
   * than being mistaken for a non-blocking handler failure.
   */
  const runnableHandlers: HandlerRegistration<T, R>[] = [];
  for (const registration of context.handlers) {
    if (registration.config.condition && !registration.config.condition(context.payload)) {
      (context.handlerOutcomes ??= []).push({
        id: registration.id,
        status: 'skipped',
        executed: false,
        duration: 0,
        result: undefined,
        error: undefined,
        metadata: undefined,
      });
      continue;
    }
    runnableHandlers.push(registration);
  }

  const terminationCandidates: Array<{
    state: PipelineControllerState<T, R>;
    outcome: HandlerExecutionOutcome<R>;
  }> = [];

  /** Create promises for all handlers */
  const handlerPromises = runnableHandlers.map(async (registration, _index) => {
    const state: PipelineControllerState<T, R> = {
      payload: context.payload,
      aborted: false,
      abortReason: undefined,
      jumpToPriority: undefined,
      terminated: false,
      terminationResult: undefined,
      results: [],
    };
    const controller = createController(registration, _index, state);
    const outcome = beginOutcome(registration);
    const startedAt = Date.now();
    (context.handlerOutcomes ??= []).push(outcome);

    try {
      (context.executedHandlers ??= []).push(registration);
      const result = registration.handler(state.payload, controller);
      
      const handlerResult = (
        isPromiseLike(result) ? await Promise.resolve(result) : result
      ) as R | undefined;
      
      finishOutcome(outcome, startedAt, 'succeeded', handlerResult);
      outcome.terminationRequested = state.terminated;
      if (state.terminated) {
        outcome.terminationResult = state.terminationResult;
        terminationCandidates.push({ state, outcome });
      }
      appendLocalResults(context, state, handlerResult);
      return { 
        success: true, 
        handlerId: registration.id, 
        result: handlerResult,
        terminated: state.terminated,
        state,
        outcome,
      };
      
    } catch (error: unknown) {
      // 🆕 Consistent error object creation
      const handlerError = handleExecutionError(error, registration);
      finishOutcome(outcome, startedAt, 'failed', undefined, handlerError.error);
      (context.collectedErrors ??= []).push(handlerError);
      
      if (handlerError.severity === 'blocking') {
        throw handlerError.error;
      }
      
      return {
        success: false,
        handlerId: registration.id,
        error: handlerError.error,
        state,
        outcome,
        registration,
      };
    }
  });

  const trackedHandlerPromises = context.trackHandlerPromise
    ? handlerPromises.map(promise => context.trackHandlerPromise!(promise))
    : handlerPromises;

  /** Wait for all handlers to complete */
  const results = await Promise.allSettled(trackedHandlerPromises);
  
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
  if (terminationCandidates.length > 0) {
    context.terminated = true;
    const firstTerminated = terminationCandidates[0];
    if (firstTerminated) {
      context.terminationResult = firstTerminated.state.terminationResult;
    }
  }
}

/**
 * Execute handlers in race mode (first to complete wins)
 * 
 * Executes all qualifying handlers simultaneously using Promise.race, where
 * the first handler to complete determines the pipeline result. Other handlers
 * continue in the background and remain tracked for lifecycle cleanup; handlers
 * must observe the controller signal for cooperative external cancellation.
 * Useful for scenarios where you want the fastest response from multiple
 * equivalent handlers.
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
  createController: (
    registration: HandlerRegistration<T, R>,
    index: number,
    state: PipelineControllerState<T, R>,
  ) => PipelineController<T, R>
): Promise<void> {

  /** See executeParallel: condition errors are dispatch errors in concurrent modes. */
  const runnableHandlers: HandlerRegistration<T, R>[] = [];
  for (const registration of context.handlers) {
    if (registration.config.condition && !registration.config.condition(context.payload)) {
      (context.handlerOutcomes ??= []).push({
        id: registration.id,
        status: 'skipped',
        executed: false,
        duration: 0,
        result: undefined,
        error: undefined,
        metadata: undefined,
      });
      continue;
    }
    runnableHandlers.push(registration);
  }

  if (runnableHandlers.length === 0) {
    return;
  }

  /** Create promises for all handlers */
  const handlerPromises = runnableHandlers.map(async (registration, _index) => {
    const state: PipelineControllerState<T, R> = {
      payload: context.payload,
      aborted: false,
      abortReason: undefined,
      jumpToPriority: undefined,
      terminated: false,
      terminationResult: undefined,
      results: [],
    };
    const controller = createController(registration, _index, state);
    const outcome = beginOutcome(registration);
    const startedAt = Date.now();
    (context.handlerOutcomes ??= []).push(outcome);

    try {
      (context.executedHandlers ??= []).push(registration);
      const result = registration.handler(state.payload, controller);
      
      const handlerResult = (
        isPromiseLike(result) ? await Promise.resolve(result) : result
      ) as R | undefined;
      
      finishOutcome(outcome, startedAt, 'succeeded', handlerResult);
      outcome.terminationRequested = state.terminated;
      if (state.terminated) outcome.terminationResult = state.terminationResult;

      return {
        success: true, 
        handlerId: registration.id, 
        registration,
        result: handlerResult,
        terminated: state.terminated,
        state,
        outcome,
      };
      
    } catch (error: unknown) {
      // 🆕 Consistent error object creation
      const handlerError = handleExecutionError(error, registration);
      finishOutcome(outcome, startedAt, 'failed', undefined, handlerError.error);
      (context.collectedErrors ??= []).push(handlerError);
      return {
        success: false,
        handlerId: registration.id,
        error: handlerError.error,
        registration,
        state,
        outcome,
      };
    }
  });

  const trackedHandlerPromises = context.trackHandlerPromise
    ? handlerPromises.map(promise => context.trackHandlerPromise!(promise))
    : handlerPromises;

  /** Race all handlers while retaining every loser for lifecycle draining. */
  const winner = await Promise.race(trackedHandlerPromises);

  /** If the winner failed and was blocking, throw the error */
  if (!winner.success && winner.registration?.config.blocking) {
    throw winner.error;
  }

  /** Only the winner contributes results to the race snapshot. */
  if (winner.success) {
    appendLocalResults(context, winner.state, winner.result);
    if (winner.state.aborted) {
      context.aborted = true;
      context.abortReason = winner.state.abortReason;
    }
  }

  /** Check if the winning handler terminated the pipeline */
  if (winner.success && winner.terminated) {
    context.terminated = true;
    context.terminationResult = winner.state.terminationResult;
  }
}
