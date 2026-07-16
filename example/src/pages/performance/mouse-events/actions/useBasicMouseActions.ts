import { useCallback } from 'react';
import { useBasicMouseAction } from '../contexts/LegacyMouseEventsContexts';

export function useBasicMouseActions() {
  const dispatch = useBasicMouseAction();

  return {
    dispatchMouseClick: useCallback(
      (payload: { x: number; y: number; button: string; target: string }) =>
        dispatch('handleMouseClick', payload),
      [dispatch]
    ),
    dispatchMouseMove: useCallback(
      (payload: {
        x: number;
        y: number;
        movementX: number;
        movementY: number;
      }) => dispatch('handleMouseMove', payload),
      [dispatch]
    ),
    dispatchMouseEnter: useCallback(
      (target: string, timestamp: number) =>
        dispatch('handleMouseEnter', { target, timestamp }),
      [dispatch]
    ),
    dispatchMouseLeave: useCallback(
      (target: string, timestamp: number) =>
        dispatch('handleMouseLeave', { target, timestamp }),
      [dispatch]
    ),
    clearEventLog: useCallback(() => dispatch('clearEventLog'), [dispatch]),
  };
}
