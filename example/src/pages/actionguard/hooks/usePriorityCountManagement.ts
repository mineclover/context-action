import { useCallback } from 'react';
import { Store, useStoreValue } from '@context-action/react';

// 우선순위 카운팅 관리 훅 (Store 중심)
export function usePriorityCountManagement(priorityCountsStore: Store<Record<number, number>>) {
  // Store 값을 직접 사용
  const priorityCounts = useStoreValue(priorityCountsStore);

  // 실시간 카운팅 - Store 직접 업데이트 후 새 카운트 반환
  const incrementPriorityCount = useCallback((priority: number, handlerId: string) => {
    const currentCounts = priorityCountsStore.getValue();
    const newCount = (currentCounts[priority] || 0) + 1;
    const newCounts = {
      ...currentCounts,
      [priority]: newCount
    };
    
    // Store 즉시 업데이트 - 리렌더링 자동 보장
    priorityCountsStore.setValue(newCounts);
    
    // 새로운 카운트 값 반환
    return newCount;
  }, [priorityCountsStore]);

  // 카운트 초기화
  const resetPriorityCounts = useCallback(() => {
    priorityCountsStore.setValue({});
  }, [priorityCountsStore]);

  // 특정 우선순위 카운트 조회 (Store에서 직접 최신 값 조회)
  const getPriorityCount = useCallback((priority: number) => {
    const currentCounts = priorityCountsStore.getValue();
    return currentCounts[priority] || 0;
  }, [priorityCountsStore]);

  // 현재 모든 카운트 조회 (Store에서 직접 최신 값 조회)
  const getAllCounts = useCallback(() => {
    const currentCounts = priorityCountsStore.getValue();
    return { ...currentCounts };
  }, [priorityCountsStore]);

  // 총 실행 횟수 계산 (Store에서 직접 최신 값 조회)
  const getTotalExecutionCount = useCallback(() => {
    const currentCounts = priorityCountsStore.getValue();
    return Object.values(currentCounts).reduce((sum, count) => sum + count, 0);
  }, [priorityCountsStore]);

  return {
    // 액션들
    incrementPriorityCount,
    resetPriorityCounts,
    
    // 조회 함수들
    getPriorityCount,
    getAllCounts,
    getTotalExecutionCount,
    
    // 직접 상태 접근
    priorityCounts
  };
}