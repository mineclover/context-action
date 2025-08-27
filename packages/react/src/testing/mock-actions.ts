/**
 * Action 핸들러 모킹 유틸리티
 */

export interface MockActionHandlerConfig {
  /** 핸들러 이름 */
  name: string;
  /** 기본 구현 */
  implementation?: (...args: any[]) => any;
  /** 자동 resolve 여부 */
  autoResolve?: boolean;
  /** resolve 지연 시간 */
  resolveDelay?: number;
  /** 로깅 활성화 */
  enableLogging?: boolean;
}

export interface ActionHandlerMock {
  /** Jest mock 함수 */
  mockFn: jest.MockedFunction<any>;
  /** 호출 횟수 조회 */
  getCallCount: () => number;
  /** 마지막 호출 인자 조회 */
  getLastCall: () => any[];
  /** 모든 호출 기록 조회 */
  getAllCalls: () => any[][];
  /** mock 초기화 */
  reset: () => void;
  /** 특정 값으로 resolve하도록 설정 */
  mockResolveValue: (value: any) => void;
  /** 에러를 reject하도록 설정 */
  mockRejectValue: (error: Error) => void;
}

/**
 * Action 핸들러 모킹 헬퍼
 */
export function mockActionHandler(config: MockActionHandlerConfig): ActionHandlerMock {
  const {
    name,
    implementation,
    autoResolve = true,
    resolveDelay = 0,
    enableLogging = process.env.NODE_ENV === 'test'
  } = config;

  const mockFn = jest.fn();

  if (implementation) {
    mockFn.mockImplementation(implementation);
  } else if (autoResolve) {
    if (resolveDelay > 0) {
      mockFn.mockImplementation((...args) => {
        if (enableLogging) {
          console.log(`Mock action handler [${name}] called with:`, args);
        }
        return new Promise(resolve => setTimeout(resolve, resolveDelay));
      });
    } else {
      mockFn.mockResolvedValue(undefined);
    }
  }

  const mock: ActionHandlerMock = {
    mockFn,
    getCallCount: () => mockFn.mock.calls.length,
    getLastCall: () => mockFn.mock.calls[mockFn.mock.calls.length - 1] || [],
    getAllCalls: () => mockFn.mock.calls,
    reset: () => mockFn.mockReset(),
    mockResolveValue: (value: any) => mockFn.mockResolvedValue(value),
    mockRejectValue: (error: Error) => mockFn.mockRejectedValue(error)
  };

  return mock;
}