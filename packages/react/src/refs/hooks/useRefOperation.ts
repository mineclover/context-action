/** Ref operations serialize actual work, independently of caller cancellation. */
import { useCallback } from 'react';
import type { RefOperation, RefOperationOptions, RefOperationResult, RefTarget } from '../types';
import { type InternalRefState, onRefDisposed, refAbortError, waitForRefMount } from '../ref-state';

export function useRefOperation<T>(refState: InternalRefState<T>) {
  const withTarget = useCallback(async <Result>(
    operation: RefOperation<T & RefTarget, Result>,
    options?: RefOperationOptions,
  ): Promise<RefOperationResult<Result>> => {
    const controller = new AbortController();
    const externalSignal = options?.signal;
    const forwardAbort = () => controller.abort(refAbortError(externalSignal!));
    if (externalSignal?.aborted) forwardAbort();
    else externalSignal?.addEventListener('abort', forwardAbort, { once: true });
    const removeDisposal = onRefDisposed(refState, error => controller.abort(error));
    let startedAt: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onAbort = () => {
      if (timer !== undefined) clearTimeout(timer);
      rejectAbort(refAbortError(controller.signal));
    };
    let rejectAbort!: (error: Error) => void;
    const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
    controller.signal.addEventListener('abort', onAbort, { once: true });
    if (controller.signal.aborted) onAbort();

    try {
      if (controller.signal.aborted) throw refAbortError(controller.signal);
      const execution = (refState.operationTail ?? Promise.resolve()).then(async () => {
        // Re-read the target after earlier operations settle. A queued operation
        // must not retain an obsolete target or run after cancellation/disposal.
        const target = await waitForRefMount(refState, 'operation', undefined, controller.signal);
        if (controller.signal.aborted) throw refAbortError(controller.signal);
        refState.operationInProgress = true;
        startedAt = Date.now();
        if (options?.timeout) {
          timer = setTimeout(() => controller.abort(new Error('Operation timed out')), options.timeout);
        }
        try {
          return await operation(target as T & RefTarget, { ...options, signal: controller.signal });
        } finally {
          // A timed-out/non-cooperative operation still owns the serialization
          // slot until its actual promise settles; JavaScript cannot force-stop it.
          refState.operationInProgress = false;
          if (timer !== undefined) clearTimeout(timer);
        }
      });
      refState.operationTail = execution.then(() => undefined, () => undefined);
      const result = await Promise.race([execution, aborted]);
      return { success: true, result, duration: Date.now() - startedAt!, timestamp: Date.now() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        ...(startedAt !== undefined && { duration: Date.now() - startedAt }),
        timestamp: Date.now(),
      };
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      externalSignal?.removeEventListener('abort', forwardAbort);
      controller.signal.removeEventListener('abort', onAbort);
      removeDisposal();
      void aborted.catch(() => {});
    }
  }, [refState]);

  const executeIfMounted = useCallback(<Result>(
    operation: (target: T & RefTarget) => Result,
  ): Result | null => {
    if (!refState.disposed && refState.isMounted && refState.target !== null) {
      try { return operation(refState.target); }
      catch (error) { console.error('Error in executeIfMounted:', error); }
    }
    return null;
  }, [refState]);

  return { withTarget, executeIfMounted };
}
