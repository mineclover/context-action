/**
 * @fileoverview Focused hook for ref polling functionality
 * 
 * Separated from useRefHandler for better maintainability and testing
 */

import { useCallback } from 'react';
import { type InternalRefState, onRefDisposed } from '../ref-state';

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

    let settled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let removeDisposal = () => {};
    const startTime = Date.now();
    let resolve!: (target: T) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<T>((onResolve, onReject) => { resolve = onResolve; reject = onReject; });
    const cleanup = () => {
      if (intervalId !== null) clearInterval(intervalId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      intervalId = null;
      timeoutId = null;
      removeDisposal();
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const check = () => {
      if (settled) return;
      const elapsed = Date.now() - startTime;
      try { onTick?.(elapsed, refState.isMounted && refState.target !== null); }
      catch (error) { console.error('Error in polling onTick callback:', error); }
      // A user callback may cancel polling or unmount its Provider.
      if (settled) return;
      if (refState.isMounted && refState.target !== null) {
        const target = refState.target;
        settled = true;
        cleanup();
        try { onSuccess?.(elapsed, target); }
        catch (error) { console.error('Error in polling onSuccess callback:', error); }
        resolve(target);
      }
    };
    removeDisposal = onRefDisposed(refState, fail);
    if (!settled && timeout !== undefined && timeout > 0) {
      timeoutId = setTimeout(() => {
        if (settled) return;
        fail(new Error(`Polling timeout after ${timeout}ms for ref '${refName}'`));
        try { onTimeout?.(Date.now() - startTime); }
        catch (error) { console.error('Error in polling onTimeout callback:', error); }
      }, timeout);
    }
    check();
    if (!settled) intervalId = setInterval(check, interval);
    void promise.catch(() => {});
    const cancel = () => { fail(new Error('Polling cancelled')); };
    const isMounted = () => {
      return !refState.disposed && refState.isMounted && refState.target !== null;
    };

    return {
      promise,
      cancel,
      isMounted
    };
  }, []);

  return createPolling;
}
