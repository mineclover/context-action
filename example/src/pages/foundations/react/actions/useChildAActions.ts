import { useCallback } from 'react';
import { useChildAActionDispatch } from '../contexts/ChildAContext';

/** View-facing dispatch helpers for Child A. */
export function useChildACounterActions() {
  const dispatch = useChildAActionDispatch();

  return {
    incrementCounter: useCallback(
      (amount: number) => dispatch('incrementCounter', { amount }),
      [dispatch]
    ),
    resetCounter: useCallback(
      () => dispatch('resetCounter', undefined),
      [dispatch]
    ),
  };
}

/** View-facing identity helper for the parent-control action. */
export function useChildARemoteControlActions() {
  return { childId: 'child-a-counter' };
}
