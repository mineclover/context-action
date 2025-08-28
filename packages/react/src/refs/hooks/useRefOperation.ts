/**
 * @fileoverview Focused hook for ref operations
 * 
 * Separated from useRefHandler for better maintainability and testing
 */

import { useCallback } from 'react';
import type { RefOperation, RefOperationOptions, RefOperationResult, RefTarget } from '../types';
import type { InternalRefState } from './useRefMount';

/**
 * Hook for handling ref operations
 */
export function useRefOperation<T>(
  refState: InternalRefState<T>
) {
  const withTarget = useCallback(async <Result>(
    operation: RefOperation<T & RefTarget, Result>,
    options?: RefOperationOptions
  ): Promise<RefOperationResult<Result>> => {
    try {
      // 마운트 대기
      const target = await (async () => {
        if (refState.target && refState.isMounted) {
          return refState.target;
        }
        
        if (refState.mountPromise) {
          return refState.mountPromise;
        }
        
        refState.mountPromise = new Promise<T>((resolve, reject) => {
          refState.mountResolvers.add(resolve);
          refState.mountRejectors.add(reject);
        });
        
        return refState.mountPromise;
      })();
      
      // 순차 실행 보장
      while (refState.operationInProgress) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      refState.operationInProgress = true;
      const startTime = Date.now();
      
      try {
        // AbortSignal 체크
        if (options?.signal?.aborted) {
          throw new Error('Operation aborted');
        }
        
        // 타임아웃 설정
        const timeoutPromise = options?.timeout
          ? new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Operation timed out')), options.timeout);
            })
          : null;
        
        // 작업 실행
        const operationPromise = operation(target as T & RefTarget, options);
        
        const result = timeoutPromise
          ? await Promise.race([operationPromise, timeoutPromise])
          : await operationPromise;
        
        return {
          success: true,
          result,
          duration: Date.now() - startTime,
          timestamp: Date.now()
        };
      } catch (error) {
        return {
          success: false,
          error: error as Error,
          duration: Date.now() - startTime,
          timestamp: Date.now()
        };
      } finally {
        refState.operationInProgress = false;
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        timestamp: Date.now()
      };
    }
  }, [refState]);

  const executeIfMounted = useCallback(<Result>(
    operation: (target: T & RefTarget) => Result
  ): Result | null => {
    if (refState.target && refState.isMounted) {
      try {
        return operation(refState.target);
      } catch (error) {
        console.error('Error in executeIfMounted:', error);
        return null;
      }
    }
    return null;
  }, [refState]);

  return {
    withTarget,
    executeIfMounted
  };
}