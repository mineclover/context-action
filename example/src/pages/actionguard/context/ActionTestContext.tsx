import { createActionContext } from '@context-action/react';
import { ActionPayloadMap } from '@context-action/core';

// 테스트용 액션 타입 정의
export interface TestActions extends ActionPayloadMap {
  priorityTest: { testId: string; delay: number };
  sequentialTest: { testId: string; delay: number };
}

// Priority Test용 Action Context
export const PriorityTestActionContext = createActionContext<TestActions>({
  name: 'PriorityTest'
});

// Sequential Test용 Action Context  
export const SequentialTestActionContext = createActionContext<TestActions>({
  name: 'SequentialTest'
});

// 편의를 위한 별칭 exports
export const {
  Provider: PriorityTestProvider,
  useActionDispatch: usePriorityActionDispatch,
  useActionRegister: usePriorityActionRegister,
  useActionHandler: usePriorityActionHandler,
  useActionDispatchWithResult: usePriorityActionDispatchWithResult
} = PriorityTestActionContext;

export const {
  Provider: SequentialTestProvider,
  useActionDispatch: useSequentialActionDispatch,
  useActionRegister: useSequentialActionRegister,
  useActionHandler: useSequentialActionHandler,
  useActionDispatchWithResult: useSequentialActionDispatchWithResult
} = SequentialTestActionContext;

// 통합 Provider (두 Context를 모두 제공)
export function ActionTestProvider({ children }: { children: React.ReactNode }) {
  return (
    <PriorityTestProvider>
      <SequentialTestProvider>
        {children}
      </SequentialTestProvider>
    </PriorityTestProvider>
  );
}