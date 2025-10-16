import {
  useMemoizedActionDispatch,
  useNonMemoizedActionDispatch,
} from '../models/ComparisonModel';

/**
 * Action Dispatch Hooks - DOM 이벤트에 주입할 함수들을 제공
 * 이 훅들은 UI 컴포넌트에서 직접 dispatch를 사용하지 않고 함수를 주입받아 사용할 수 있게 합니다.
 */

export function useMemoizedActions() {
  const dispatch = useMemoizedActionDispatch();

  return {
    increment: () => dispatch('increment'),
    decrement: () => dispatch('decrement'),
    reset: () => dispatch('reset'),
    calculate: (multiplier: number = 10) =>
      dispatch('complexCalculation', { multiplier }),
    performHeavyOperation: (dataSize: number = 20) =>
      dispatch('heavyOperation', { dataSize }),
    performMemoryTask: () => dispatch('memoryIntensiveTask'),
  };
}

export function useNonMemoizedActions() {
  const dispatch = useNonMemoizedActionDispatch();

  return {
    increment: () => dispatch('increment'),
    decrement: () => dispatch('decrement'),
    reset: () => dispatch('reset'),
    calculate: (multiplier: number = 10) =>
      dispatch('complexCalculation', { multiplier }),
    performHeavyOperation: (dataSize: number = 50) =>
      dispatch('heavyOperation', { dataSize }),
    performMemoryTask: () => dispatch('memoryIntensiveTask'),
  };
}

/**
 * 조합된 Actions Hook - 특정 용도로 액션들을 그룹화
 */
export function usePerformanceTestActions() {
  const memoizedActions = useMemoizedActions();
  const nonMemoizedActions = useNonMemoizedActions();

  return {
    // 기본 테스트 액션들
    runBasicTest: () => {
      memoizedActions.increment();
      nonMemoizedActions.increment();
    },

    // 성능 집약적 테스트
    runPerformanceTest: () => {
      memoizedActions.performHeavyOperation(30);
      nonMemoizedActions.performHeavyOperation(30);
    },

    // 메모리 테스트
    runMemoryTest: () => {
      memoizedActions.performMemoryTask();
      nonMemoizedActions.performMemoryTask();
    },

    // 모든 데이터 리셋
    resetAll: () => {
      memoizedActions.reset();
      nonMemoizedActions.reset();
    },

    // 개별 액션 그룹들
    memoized: memoizedActions,
    nonMemoized: nonMemoizedActions,
  };
}
