/**
 * @fileoverview 우선순위 테스트 시스템 타입 정의
 *
 * 최소 의존성 아키텍처를 지원하는 타입들:
 * - HandlerConfig: 개별 핸들러 설정
 * - PriorityTestViewModel: 통합 ViewModel 인터페이스
 * - PriorityTestState/Actions: 상태와 액션 분리
 */

// ================================
// 🔧 기본 설정 타입들
// ================================

// 개별 핸들러 설정 타입
export interface HandlerConfig {
  id: string;
  priority: number;
  color: string;
  label: string;
  delay: number;
  jumpToPriority?: number | null;
  jumpToIndex?: number | null;
}

// 성능 옵션 타입
export interface PerformanceOptions {
  enableToast?: boolean;
  enableConsoleLog?: boolean;
  performanceMode?: boolean;
}

// ================================
// 🎯 ViewModel 타입들
// ================================

// ViewModel 상태 인터페이스
export interface PriorityTestState {
  // 핸들러 관리
  registeredHandlers: Set<string>;

  // 실행 상태
  isRunning: boolean;
  aborted: boolean;

  // 테스트 결과
  testResults: string[];

  // 카운트 관리
  priorityCounts: Record<number, number>;
}

// ViewModel 액션 인터페이스
export interface PriorityTestActions {
  // 핸들러 관리
  registerHandlers: () => void;
  unregisterHandler: (handlerId: string) => void;
  unregisterAllHandlers: () => void;

  // 테스트 실행 (🎯 컨테이너 객체로 controller 받기 지원)
  executeTest: (controllerContainer?: {
    controller?: AbortController;
  }) => Promise<void>;
  abortTest: () => void;
  initializeTest: () => void;

  // 상태 조회
  getRegisteredCount: () => number;
  isHandlerRegistered: (handlerId: string) => boolean;

  // 고급 abort 제어 (dispatch 시점 AbortController + 핸들러에서 파이프라인 abort)
  getCurrentAbortController: () => AbortController | null;
  triggerPipelineAbort: (reason?: string) => void;
}

// 통합 ViewModel 인터페이스
export interface PriorityTestViewModel
  extends PriorityTestState,
    PriorityTestActions {
  // ActionRegister 인스턴스 (선택적 - 개별 훅들이 내부 관리)
  actionRegister?: any;
}
