import { HandlerConfig } from '../usePriorityActionHandlers';

/**
 * ViewModel Layer: 상태 타입 정의
 */

export interface PerformanceOptions {
  enableToast?: boolean;
  enableConsoleLog?: boolean;
  performanceMode?: boolean;
}

export interface PriorityTestState {
  // 핸들러 관리
  registeredHandlers: Set<string>;
  
  // 실행 상태
  isRunning: boolean;
  aborted: boolean;
  
  // 테스트 결과
  testResults: string[];
  completedCount: number;
  
  // 카운트 관리
  priorityCounts: Record<number, number>;
}

export interface PriorityTestActions {
  // 핸들러 관리
  registerHandlers: () => void;
  unregisterHandler: (handlerId: string) => void;
  unregisterAllHandlers: () => void;
  
  // 테스트 실행
  executeTest: (delay?: number) => Promise<void>;
  abortTest: () => void;
  initializeTest: () => void;
  
  // 상태 조회
  getRegisteredCount: () => number;
  isHandlerRegistered: (handlerId: string) => boolean;
}

export interface PriorityTestViewModel extends PriorityTestState, PriorityTestActions {
  // ActionRegister 인스턴스 (호환성을 위해)
  actionRegister: any;
}

export interface ViewModelDependencies {
  configs: HandlerConfig[];
  priorityCountsStore: any;
  performanceOptions: PerformanceOptions;
  actionRegister: any;
  dispatch: any;
  countManagement: any;
  executionState: any;
}