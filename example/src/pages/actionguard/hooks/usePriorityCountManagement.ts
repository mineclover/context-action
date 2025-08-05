import { useCallback, useRef } from 'react';
import { Store } from '@context-action/react';

// 우선순위 카운팅 관리 훅
export function usePriorityCountManagement(priorityCountsStore: Store<Record<number, number>>) {
  const priorityExecutionCountRef = useRef<Record<number, number>>({});

  // 실시간 카운팅 - 즉시 UI 반영
  const incrementPriorityCount = useCallback((priority: number, handlerId: string) => {
    // Ref 업데이트
    priorityExecutionCountRef.current[priority] = (priorityExecutionCountRef.current[priority] || 0) + 1;
    
    // Store 즉시 업데이트 - setValue도 즉시 리렌더링 보장
    priorityCountsStore.setValue({ ...priorityExecutionCountRef.current });
  }, [priorityCountsStore]);

  // Ref 카운트를 Store로 동기화 (배치 업데이트)
  const syncPriorityCountsToStore = useCallback(() => {
    priorityCountsStore.setValue({ ...priorityExecutionCountRef.current });
  }, [priorityCountsStore]);

  // 카운트 초기화
  const resetPriorityCounts = useCallback(() => {
    priorityExecutionCountRef.current = {};
    priorityCountsStore.setValue({});
  }, [priorityCountsStore]);

  // 현재 Ref 카운트 조회
  const getCurrentRefCounts = useCallback(() => {
    return { ...priorityExecutionCountRef.current };
  }, []);

  return {
    incrementPriorityCount,
    syncPriorityCountsToStore,
    resetPriorityCounts,
    getCurrentRefCounts,
    priorityExecutionCountRef
  };
}