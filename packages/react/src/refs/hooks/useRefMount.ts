/**
 * @fileoverview Focused hook for ref mounting logic
 * 
 * Separated from useRefHandler for better maintainability and testing
 */

import { useCallback } from 'react';
import type { RefDefinitions, RefInitConfig } from '../types';
import type { CreateRefContextOptions } from '../createRefContext';
import { type InternalRefState, waitForRefMount } from '../ref-state';
export type { InternalRefState } from '../ref-state';

/**
 * Hook for handling ref mounting logic
 */
export function useRefMount<T>(
  refState: InternalRefState<T>,
  refNameStr: string,
  optionsRef: React.MutableRefObject<CreateRefContextOptions | undefined>,
  definitionsRef: React.MutableRefObject<RefDefinitions | undefined>
) {
  const waitForMount = useCallback(async (): Promise<T> => {
    // 타임아웃 설정 계산
    const globalOptions = optionsRef.current;
    const refConfig = definitionsRef.current?.[refNameStr] as RefInitConfig | undefined;
    
    let timeoutMs: number | undefined;
    if (globalOptions?.disableTimeout) {
      timeoutMs = undefined;
    } else if (refConfig?.mountTimeout !== undefined) {
      timeoutMs = refConfig.mountTimeout;
    } else if (globalOptions?.defaultMountTimeout !== undefined) {
      timeoutMs = globalOptions.defaultMountTimeout;
    }
    
    return waitForRefMount(refState, refNameStr, timeoutMs !== undefined && timeoutMs > 0 ? timeoutMs : undefined);
  }, [refState, refNameStr, optionsRef, definitionsRef]);

  const onMount = useCallback((callback: (target: T) => void) => {
    if (refState.disposed) return () => {};
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
