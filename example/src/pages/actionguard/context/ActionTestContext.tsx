import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ActionRegister } from '@context-action/react';
import { ActionPayloadMap } from '@context-action/core';

// 테스트용 액션 타입 정의
interface TestActions extends ActionPayloadMap {
  priorityTest: { testId: string; delay: number };
  sequentialTest: { testId: string; delay: number };
}

// ActionRegister Context 타입
interface ActionTestContextType {
  priorityActionRegister: ActionRegister<TestActions>;
  sequentialActionRegister: ActionRegister<TestActions>;
}

// Context 생성
const ActionTestContext = createContext<ActionTestContextType | null>(null);

// Provider 컴포넌트
interface ActionTestProviderProps {
  children: ReactNode;
}

export function ActionTestProvider({ children }: ActionTestProviderProps) {
  // ActionRegister 인스턴스들을 메모이제이션하여 재생성 방지
  const contextValue = useMemo(() => ({
    priorityActionRegister: new ActionRegister<TestActions>(),
    sequentialActionRegister: new ActionRegister<TestActions>()
  }), []);

  return (
    <ActionTestContext.Provider value={contextValue}>
      {children}
    </ActionTestContext.Provider>
  );
}

// Hook: 우선순위 테스트용 ActionRegister 가져오기
export function usePriorityActionRegister(): ActionRegister<TestActions> {
  const context = useContext(ActionTestContext);
  
  if (!context) {
    throw new Error('usePriorityActionRegister must be used within ActionTestProvider');
  }
  
  return context.priorityActionRegister;
}

// Hook: 순차 테스트용 ActionRegister 가져오기
export function useSequentialActionRegister(): ActionRegister<TestActions> {
  const context = useContext(ActionTestContext);
  
  if (!context) {
    throw new Error('useSequentialActionRegister must be used within ActionTestProvider');
  }
  
  return context.sequentialActionRegister;
}

// Hook: 전체 Context 가져오기 (필요시)
export function useActionTestContext(): ActionTestContextType {
  const context = useContext(ActionTestContext);
  
  if (!context) {
    throw new Error('useActionTestContext must be used within ActionTestProvider');
  }
  
  return context;
}

// 액션 타입 export
export type { TestActions };