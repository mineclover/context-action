/** Ref operations serialize actual work, independently of caller cancellation. */
import { useCallback } from 'react';
import type { RefOperation, RefOperationOptions, RefOperationResult, RefTarget } from '../types';
import {
  executeRefOperation,
  type InternalRefState,
  runIfRefMounted,
} from '../ref-state';

export function useRefOperation<T>(refState: InternalRefState<T>) {
  const withTarget = useCallback(async <Result>(
    operation: RefOperation<T & RefTarget, Result>,
    options?: RefOperationOptions,
  ): Promise<RefOperationResult<Result>> => {
    return executeRefOperation(refState, operation, options);
  }, [refState]);

  const executeIfMounted = useCallback(<Result>(
    operation: (target: T & RefTarget) => Result,
  ): Result | null => {
    return runIfRefMounted(refState, operation);
  }, [refState]);

  return { withTarget, executeIfMounted };
}
