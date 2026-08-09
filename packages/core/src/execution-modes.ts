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
    metadata: registration.config.metadata
      ? { ...registration.config.metadata }
      : undefined,
  };
}

function createSkippedOutcome<T, R>(
  registration: HandlerRegistration<T, R>,
): HandlerExecutionOutcome<R> {
  return {
    id: registration.id,
    status: 'skipped',
    executed: false,
    duration: 0,
    result: undefined,
    error: undefined,
    metadata: registration.config.metadata
      ? { ...registration.config.metadata }
      : undefined,
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
  registration: HandlerRegistration<T, R>,
  target: R[] = context.results,
): void {
  if (registration.role === 'guard') return;
  if (state.results.length > 0) target.push(...state.results);
  if (returnedResult !== undefined && !state.terminated) {
    target.push(returnedResult);
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
    severity: registration.config.errorPolicy === 'fatal' ? 'blocking' : 'non-blocking'
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
        (context.handlerOutcomes ??= []).push(createSkippedOutcome(registration));
        i++;
        continue;
      }
    }

    if (context.claimOnce && !context.claimOnce(registration)) {
      (context.handlerOutcomes ??= []).push(createSkippedOutcome(registration));
      i++;
      continue;
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

      if (registration.config.scheduling === 'await-before-next') {
        // Sequential mode is genuinely sequential by default: an async
        // handler settles before the next priority slot starts.
        const handlerResult = trackedResult
          ? await trackedResult
          : result;
        finishOutcome(
          outcome,
          startedAt,
          'succeeded',
          registration.role === 'guard' ? undefined : handlerResult as R | undefined,
        );
        if (
          registration.role !== 'guard' &&
          handlerResult !== undefined &&
          !context.terminated
        ) {
          context.results.push(handlerResult as R);
        }
      } else {
        // 🆕 Non-blocking handlers: Handle differently for sync vs async
        if (trackedResult) {
          // Non-blocking async: Track promise with error handling
          const promiseWithErrorHandling = trackedResult
            .then(asyncResult => {
              finishOutcome(
                outcome,
                startedAt,
                'succeeded',
                registration.role === 'guard' ? undefined : asyncResult as R | undefined,
              );
              if (
                registration.role !== 'guard' &&
                asyncResult !== undefined &&
                !context.terminated
              ) {
                context.results.push(asyncResult as R);
              }
              return asyncResult;
            })
            .catch(error => {
              // 🆕 Non-blocking async handler error collection
              const handlerError = handleExecutionError(error, registration);
              errors.push(handlerError);
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
        } else if (
          registration.role !== 'guard' &&
          result !== undefined &&
          !context.terminated
        ) {
          // Non-blocking sync: Immediately collect result
          finishOutcome(outcome, startedAt, 'succeeded', result as R);
          context.results.push(result as R);
        } else {
          finishOutcome(
            outcome,
            startedAt,
            'succeeded',
            registration.role === 'guard' ? undefined : result as R | undefined,
          );
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

      // Fatal errors terminate the pipeline; collected errors let it continue.
      if (registration.config.errorPolicy === 'fatal') {
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

  if (errors.length > 0) {
    context.collectedErrors = errors;
  }

  // A fatal handler may already have allowed lower-priority work to start,
  // but it must still reject the final dispatch once that work has settled.
  const fatalError = errors.find(error => error.severity === 'blocking');
  if (fatalError) throw fatalError.error;
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
      (context.handlerOutcomes ??= []).push(createSkippedOutcome(registration));
      continue;
    }
    if (context.claimOnce && !context.claimOnce(registration)) {
      (context.handlerOutcomes ??= []).push(createSkippedOutcome(registration));
      continue;
    }
    runnableHandlers.push(registration);
  }

  const terminationSlots: Array<{
    requested: boolean;
    result: R | undefined;
  }> = runnableHandlers.map(() => ({ requested: false, result: undefined }));
  const resultSlots: R[][] = runnableHandlers.map(() => []);

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
      
      finishOutcome(
        outcome,
        startedAt,
        'succeeded',
        registration.role === 'guard' ? undefined : handlerResult,
      );
      outcome.terminationRequested = state.terminated;
      if (state.terminated && registration.role !== 'guard') {
        outcome.terminationResult = state.terminationResult;
        terminationSlots[_index] = {
          requested: true,
          result: state.terminationResult,
        };
      }
      appendLocalResults(context, state, handlerResult, registration, resultSlots[_index]);
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

  // Completion timing is intentionally concurrent, but collected result
  // order follows the priority-sorted handler order. This makes first/last/
  // all strategies deterministic across runs.
  context.results.push(...resultSlots.flat());
  
  /** Check for any rejected blocking handlers */
  const failures = results.filter((result, index) => {
    if (result.status === 'rejected') {
      const registration = runnableHandlers[index];
      return registration?.config.errorPolicy === 'fatal';
    }
    return false;
  });

  if (failures.length > 0) {
    const firstFailure = failures[0] as PromiseRejectedResult;
    throw firstFailure.reason;
  }

  /** Check if any handler terminated the pipeline */
  const firstTerminated = terminationSlots.find(slot => slot.requested);
  if (firstTerminated) {
    context.terminated = true;
    context.terminationResult = firstTerminated.result;
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
      (context.handlerOutcomes ??= []).push(createSkippedOutcome(registration));
      continue;
    }
    if (context.claimOnce && !context.claimOnce(registration)) {
      (context.handlerOutcomes ??= []).push(createSkippedOutcome(registration));
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
      
      finishOutcome(
        outcome,
        startedAt,
        'succeeded',
        registration.role === 'guard' ? undefined : handlerResult,
      );
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

  // Guards are executed by the register before race arbitration. Retain this
  // filtering for callers of this low-level primitive.
  const winnerCandidates = runnableHandlers.some(handler => handler.role !== 'guard')
    ? trackedHandlerPromises.filter((_, index) => (
      runnableHandlers[index]?.role !== 'guard'
    ))
    : trackedHandlerPromises;

  /** Race all handlers while retaining every loser for lifecycle draining. */
  const winner = await Promise.race(winnerCandidates);
  context.raceWinnerId = winner.handlerId;
  context.raceLoserOutcomes = (context.handlerOutcomes ?? [])
    .filter(outcome => outcome.id !== winner.handlerId)
    .map(outcome => ({ ...outcome, metadata: outcome.metadata ? { ...outcome.metadata } : undefined }));

  /** If the winner failed and was blocking, throw the error */
  if (!winner.success && winner.registration?.config.errorPolicy === 'fatal') {
    (context.collectedErrors ??= []).push(handleExecutionError(
      winner.error,
      winner.registration,
    ));
    throw winner.error;
  }

  // Losers are diagnostics-only. Their asynchronous completion must not
  // change the result, outcome, or errors selected by the winning handler.
  if (!winner.success) {
    (context.collectedErrors ??= []).push(handleExecutionError(
      winner.error,
      winner.registration,
    ));
  }

  /** Only the winner contributes results to the race snapshot. */
  if (winner.success) {
    appendLocalResults(context, winner.state, winner.result, winner.registration);
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
