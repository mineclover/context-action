/**
 * @fileoverview Focused hook for ref mounting logic
 * 
 * Separated from useRefHandler for better maintainability and testing
 */

import { useCallback } from 'react';
import type { RefInitConfig } from '../types';
import type { CreateRefContextOptions } from '../createRefContext';

export interface InternalRefState<T> {
  target: T | null;
  isMounted: boolean;
  mountPromise: Promise<T> | null;
  mountResolvers: Set<(target: T) => void>;
  mountRejectors: Set<(error: Error) => void>;
  operationInProgress: boolean;
  listeners: Set<() => void>;
  mountCallbacks: Set<(target: T) => void>;
}

/**
 * Hook for handling ref mounting logic
 */
export function useRefMount<T>(
  refState: InternalRefState<T>,
  refNameStr: string,
  optionsRef: React.MutableRefObject<CreateRefContextOptions | undefined>,
  definitionsRef: React.MutableRefObject<any>
) {
  const waitForMount = useCallback(async (): Promise<T> => {
    // 이미 마운트된 경우
    if (refState.target && refState.isMounted) {
      return refState.target;
    }
    
    // 기존 Promise가 있으면 재사용
    if (refState.mountPromise) {
      return refState.mountPromise;
    }
    
    // 타임아웃 설정 계산
    const globalOptions = optionsRef.current;
    const refConfig = definitionsRef.current?.[refNameStr] as RefInitConfig<any> | undefined;
    
    let timeoutMs: number | undefined;
    if (globalOptions?.disableTimeout) {
      timeoutMs = undefined;
    } else if (refConfig?.mountTimeout !== undefined) {
      timeoutMs = refConfig.mountTimeout;
    } else if (globalOptions?.defaultMountTimeout !== undefined) {
      timeoutMs = globalOptions.defaultMountTimeout;
    }
    
    // 새로운 Promise 생성
    refState.mountPromise = new Promise<T>((resolve, reject) => {
      refState.mountResolvers.add(resolve);
      refState.mountRejectors.add(reject);
      
      // 타임아웃 설정
      if (timeoutMs !== undefined && timeoutMs > 0) {
        const timeoutId = setTimeout(() => {
          const error = new Error(`Mount timeout after ${timeoutMs}ms for ref '${refNameStr}'`);
          refState.mountRejectors.forEach(rejector => rejector(error));
          refState.mountRejectors.clear();
          refState.mountResolvers.clear();
          refState.mountPromise = null;
        }, timeoutMs);
        
        // resolve/reject 시 타임아웃 정리
        const originalResolve = resolve;
        const originalReject = reject;
        
        const cleanupResolve = (value: T) => {
          clearTimeout(timeoutId);
          originalResolve(value);
        };
        
        const cleanupReject = (error: Error) => {
          clearTimeout(timeoutId);
          originalReject(error);
        };
        
        // resolver/rejector 교체
        refState.mountResolvers.delete(resolve);
        refState.mountRejectors.delete(reject);
        refState.mountResolvers.add(cleanupResolve);
        refState.mountRejectors.add(cleanupReject);
      }
    });
    
    return refState.mountPromise;
  }, [refState, refNameStr, optionsRef, definitionsRef]);

  const onMount = useCallback((callback: (target: T) => void) => {
    refState.mountCallbacks.add(callback);
    
    // 이미 마운트된 상태라면 즉시 실행
    if (refState.isMounted && refState.target) {
      callback(refState.target);
    }
    
    // cleanup 함수 반환
    return () => {
      refState.mountCallbacks.delete(callback);
    };
  }, [refState]);

  return {
    waitForMount,
    onMount,
    isMounted: refState.isMounted,
    isWaitingForMount: !refState.isMounted && refState.mountPromise !== null
  };
}