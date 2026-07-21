/**
 * @fileoverview Focused hook for ref polling functionality
 * 
 * Separated from useRefHandler for better maintainability and testing
 */

import { useCallback } from 'react';
import type { InternalRefState } from './useRefMount';

export interface RefPollingOptions {
  interval?: number;
  timeout?: number;
  onTick?: (elapsed: number, isMounted: boolean) => void;
  onTimeout?: (elapsed: number) => void;
  onSuccess?: (elapsed: number, target: unknown) => void;
}

export interface RefPollingReturn<T> {
  promise: Promise<T>;
  cancel: () => void;
  isMounted: () => boolean;
}

/**
 * Hook for ref polling functionality
 */
export function useRefPolling() {
  const createPolling = useCallback(<T>(
    refState: InternalRefState<T>,
    refName: string,
    options: RefPollingOptions = {}
  ): RefPollingReturn<T> => {
    const {
      interval = 100,
      timeout,
      onTick,
      onTimeout,
      onSuccess
    } = options;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const startTime = Date.now();

    const promise = new Promise<T>((resolve, reject) => {
      const cleanup = () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const check = () => {
        if (cancelled) {
          cleanup();
          reject(new Error('Polling cancelled'));
          return;
        }

        const elapsed = Date.now() - startTime;
        const isMounted = refState.isMounted && refState.target !== null;

        // onTick 콜백 실행
        if (onTick) {
          try {
            onTick(elapsed, isMounted);
          } catch (error) {
            console.error('Error in polling onTick callback:', error);
          }
        }

        if (isMounted && refState.target) {
          cleanup();
          // onSuccess 콜백 실행
          if (onSuccess) {
            try {
              onSuccess(elapsed, refState.target);
            } catch (error) {
              console.error('Error in polling onSuccess callback:', error);
            }
          }
          resolve(refState.target);
          return;
        }
      };

      // 타임아웃 설정
      if (timeout && timeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup();
          const elapsed = Date.now() - startTime;
          // onTimeout 콜백 실행
          if (onTimeout) {
            try {
              onTimeout(elapsed);
            } catch (error) {
              console.error('Error in polling onTimeout callback:', error);
            }
          }
          reject(new Error(`Polling timeout after ${timeout}ms for ref '${refName}'`));
        }, timeout);
      }

      // 초기 체크
      check();

      // 주기적 체크
      intervalId = setInterval(check, interval);
    });

    const cancel = () => {
      cancelled = true;
    };

    const isMounted = () => {
      return refState.isMounted && refState.target !== null;
    };

    return {
      promise,
      cancel,
      isMounted
    };
  }, []);

  return createPolling;
}
