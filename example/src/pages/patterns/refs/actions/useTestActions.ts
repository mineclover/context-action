import { useCallback } from 'react';
import { useTestAction } from '../contexts/UseRefMountStateContexts';

export function useTestActions() {
  const dispatch = useTestAction();

  return {
    incrementRenderCount: useCallback(
      (componentId: string) => {
        dispatch('incrementRenderCount', { componentId });
      },
      [dispatch]
    ),
    toggleTest: useCallback(
      (testId: string) => {
        dispatch('toggleTest', { testId });
      },
      [dispatch]
    ),
    resetRenderCounts: useCallback(() => {
      dispatch('resetRenderCounts');
    }, [dispatch]),
  };
}
