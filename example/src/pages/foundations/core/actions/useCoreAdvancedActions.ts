import { useCallback } from 'react';
import { useCoreAdvancedDispatch } from '../contexts/CoreAdvancedContexts';

export function useCoreAdvancedActions() {
  const dispatch = useCoreAdvancedDispatch();

  return {
    increment: useCallback(() => dispatch('increment'), [dispatch]),
    multiply: useCallback(() => dispatch('multiply', 2), [dispatch]),
    divide: useCallback(() => dispatch('divide', 2), [dispatch]),
    divideByZero: useCallback(() => dispatch('divide', 0), [dispatch]),
    throwError: useCallback(() => dispatch('errorAction'), [dispatch]),
    runPriorityTest: useCallback(
      () =>
        dispatch(
          'runPriorityTest',
          `테스트 ${new Date().toLocaleTimeString()}`
        ),
      [dispatch]
    ),
    clearPriorityResults: useCallback(
      () => dispatch('clearPriorityResults'),
      [dispatch]
    ),
    runSingleAsync: useCallback(() => {
      const delay = Math.floor(Math.random() * 2000) + 500;
      return dispatch('runAsync', {
        delay,
        message: `단일 비동기 작업 (${delay}ms)`,
      });
    }, [dispatch]),
    runMultipleAsync: useCallback(
      () => dispatch('runMultipleAsync', '다중 비동기 작업'),
      [dispatch]
    ),
    clearAsyncResults: useCallback(
      () => dispatch('clearAsyncResults'),
      [dispatch]
    ),
  };
}
