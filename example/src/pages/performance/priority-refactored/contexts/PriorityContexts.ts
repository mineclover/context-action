/**
 * @fileoverview Priority Performance Context Definitions
 *
 * Context-Driven Architecture의 Context Layer
 * 타입 정의와 컨텍스트 생성을 담당합니다.
 */

import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStoreContext,
} from '@context-action/react';

// ================================
// Type Definitions
// ================================

/**
 * 테스트 인스턴스 데이터
 */
export interface TestInstance {
  id: string;
  title: string;
}

/**
 * 핸들러 설정 정보
 */
export interface HandlerConfig {
  id: string;
  priority: number;
  color: string;
  label: string;
  delay: number;
  jumpToPriority: number | null;
}

/**
 * 테스트 실행 상태 데이터
 */
export interface ExecutionStateData {
  isRunning: boolean;
  testResults: string[];
  currentTestId: string | null;
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  abortedTests: number;
  averageExecutionTime: number;
  lastExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
  startTime: number;
  executionTimes: number[];
}

/**
 * 성능 테스트 상태 데이터
 */
export interface PerformanceStateData {
  instances: TestInstance[];
  runningInstances: Set<string>;
}

// ================================
// Action Type Definitions
// ================================

/**
 * 우선순위 테스트 액션 타입
 */
export interface PriorityTestActions extends ActionPayloadMap {
  priorityTest: {
    testId: string;
    delay: number;
  };
}

/**
 * 성능 관리 액션 타입
 */
export interface PerformanceManagementActions extends ActionPayloadMap {
  addInstance: void;
  removeInstance: { instanceId: string };
  resetInstances: void;
  startInstanceExecution: { instanceId: string };
  stopInstanceExecution: { instanceId: string };
}

/**
 * 테스트 제어 액션 타입
 */
export interface TestControlActions extends ActionPayloadMap {
  executeTest: { instanceId: string };
  abortTest: { instanceId: string };
  resetTest: { instanceId: string };
  updateHandlerConfig: { config: HandlerConfig };
  bulkAddHandlers: { count: number };
}

// ================================
// Action Contexts
// ================================

/**
 * 우선순위 테스트 액션 컨텍스트
 */
export const {
  Provider: PriorityTestActionProvider,
  useActionDispatch: usePriorityTestAction,
  useActionHandler: usePriorityTestActionHandler,
  useActionRegister: usePriorityTestActionRegister,
} = createActionContext<PriorityTestActions>('PriorityTest');

/**
 * 성능 관리 액션 컨텍스트
 */
export const {
  Provider: PerformanceManagementActionProvider,
  useActionDispatch: usePerformanceManagementAction,
  useActionHandler: usePerformanceManagementActionHandler,
  useActionRegister: usePerformanceManagementActionRegister,
} = createActionContext<PerformanceManagementActions>('PerformanceManagement');

/**
 * 테스트 제어 액션 컨텍스트
 */
export const {
  Provider: TestControlActionProvider,
  useActionDispatch: useTestControlAction,
  useActionHandler: useTestControlActionHandler,
  useActionRegister: useTestControlActionRegister,
} = createActionContext<TestControlActions>('TestControl');

// ================================
// Store Contexts
// ================================

/**
 * 우선순위 테스트 스토어 컨텍스트
 */
export const {
  Provider: PriorityTestStoreProvider,
  useStore: usePriorityTestStore,
} = createStoreContext('PriorityTestStores', {
  priorityCounts: {
    initialValue: {} as Record<number, number>,
    description: 'Priority execution counts',
    strategy: 'shallow',
  },
  executionState: {
    initialValue: {
      isRunning: false,
      testResults: [] as string[],
      currentTestId: null as string | null,
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      abortedTests: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: Number.MAX_VALUE,
      startTime: 0,
      executionTimes: [] as number[],
    } as ExecutionStateData,
    description: 'Test execution state and statistics',
    strategy: 'shallow',
  },
});

/**
 * 성능 관리 스토어 컨텍스트
 */
export const {
  Provider: PerformanceManagementStoreProvider,
  useStore: usePerformanceManagementStore,
} = createStoreContext('PerformanceManagementStores', {
  performanceState: {
    initialValue: {
      instances: [
        { id: 'instance-a', title: '🔴 Priority Test Instance A' },
        { id: 'instance-b', title: '🔵 Priority Test Instance B' },
      ] as TestInstance[],
      runningInstances: new Set<string>(),
    } as PerformanceStateData,
    description: 'Performance test state and instance management',
    strategy: 'shallow',
  },
});

/**
 * 테스트 설정 스토어 컨텍스트
 */
export const {
  Provider: TestConfigStoreProvider,
  useStore: useTestConfigStore,
} = createStoreContext('TestConfigStores', {
  handlerConfigs: {
    initialValue: [
      {
        id: 'h1',
        priority: 95,
        color: '#dc2626',
        label: 'Ultra High (95)',
        delay: 50,
        jumpToPriority: null,
      },
      {
        id: 'h2',
        priority: 90,
        color: '#e11d48',
        label: 'Very High (90)',
        delay: 60,
        jumpToPriority: 70,
      },
      {
        id: 'h3',
        priority: 70,
        color: '#ea580c',
        label: 'High (70)',
        delay: 45,
        jumpToPriority: 25,
      },
      {
        id: 'h4',
        priority: 55,
        color: '#f59e0b',
        label: 'High-Mid (55)',
        delay: 40,
        jumpToPriority: 45,
      },
      {
        id: 'h5',
        priority: 45,
        color: '#ca8a04',
        label: 'Medium (45)',
        delay: 35,
        jumpToPriority: 15,
      },
      {
        id: 'h6',
        priority: 30,
        color: '#84cc16',
        label: 'Med-Low (30)',
        delay: 30,
        jumpToPriority: 10,
      },
      {
        id: 'h7',
        priority: 25,
        color: '#65a30d',
        label: 'Low (25)',
        delay: 25,
        jumpToPriority: null,
      },
      {
        id: 'h8',
        priority: 15,
        color: '#0891b2',
        label: 'Lower (15)',
        delay: 20,
        jumpToPriority: 95,
      },
      {
        id: 'h9',
        priority: 10,
        color: '#7c3aed',
        label: 'Lowest (10)',
        delay: 15,
        jumpToPriority: null,
      },
    ] as HandlerConfig[],
    description: 'Handler configuration settings',
    strategy: 'shallow',
  },
  selectedDelay: {
    initialValue: 0 as 0 | 1 | 50,
    description: 'Selected delay setting',
    strategy: 'reference',
  },
});