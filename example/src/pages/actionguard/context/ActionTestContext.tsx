import { createActionContext } from '@context-action/react';
import { ActionPayloadMap } from '@context-action/core';

// 테스트용 액션 타입 정의
export interface TestActions extends ActionPayloadMap {
  priorityTest: { 
    testId: string; 
    delay: number; // 미사용 (각 핸들러는 개별 config.delay만 사용)
  };
}

// Priority Test용 Action Context
export const PriorityTestActionContext = createActionContext<TestActions>({
  name: 'PriorityTest'
});

// 사용 중인 hooks만 export
export const {
  Provider: ActionTestProvider,
  useActionDispatch: usePriorityActionDispatch,
  useActionRegister: usePriorityActionRegister
} = PriorityTestActionContext;