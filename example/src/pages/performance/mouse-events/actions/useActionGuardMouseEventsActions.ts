import { useCallback } from 'react';
import { useActionGuardMouseEventsAction } from '../contexts/ActionGuardMouseEventsContexts';

export function useActionGuardMouseEventsActions() {
  const dispatch = useActionGuardMouseEventsAction();

  return {
    dispatchMouseMove: useCallback(
      (x: number, y: number) => dispatch('updateMousePosition', { x, y }),
      [dispatch]
    ),
    dispatchMouseClick: useCallback(
      (click: { x: number; y: number; button: number; timestamp: number }) =>
        dispatch('recordMouseClick', click),
      [dispatch]
    ),
    recordMousePathPoint: useCallback(
      (point: { x: number; y: number; timestamp: number }) =>
        dispatch('recordMousePathPoint', { point }),
      [dispatch]
    ),
    clearMouseData: useCallback(() => dispatch('clearMouseData'), [dispatch]),
    clearMousePath: useCallback(() => dispatch('clearMousePath'), [dispatch]),
    setTrackingMode: useCallback(
      (enabled: boolean) => dispatch('setTrackingMode', { enabled }),
      [dispatch]
    ),
    setPathRecording: useCallback(
      (enabled: boolean) => dispatch('setPathRecording', { enabled }),
      [dispatch]
    ),
  };
}
