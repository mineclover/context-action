/**
 * Store 에러 핸들링 시스템 테스트
 * ContextActionError, ErrorHandlers 등 검증
 */

import {
  ContextActionError,
  ContextActionErrorType,
  ErrorLogLevel,
  ErrorHandlers,
  handleError,
  setErrorHandlingConfig,
  getErrorHandlingConfig,
  getErrorStatistics,
} from '../../../src/stores/utils/error-handling';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;

// Mock globalErrorBoundary
let mockErrorCount = 0;
let mockLastError: any = null;

const globalErrorBoundary = {
  reset: jest.fn(() => {
    mockErrorCount = 0;
    mockLastError = null;
  }),
  getErrorCount: jest.fn(() => mockErrorCount),
  getLastError: jest.fn(() => mockLastError),
  reportError: jest.fn((error) => {
    mockErrorCount++;
    mockLastError = error;
  }),
};

// Make it globally available
(globalThis as any).globalErrorBoundary = globalErrorBoundary;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
  
  globalErrorBoundary.reset();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
  console.debug = originalConsoleDebug;

  // 설정 초기화
  setErrorHandlingConfig({
    logLevel: ErrorLogLevel.ERROR,
    throwOnError: false,
    enableStackTrace: true,
    maxLogEntries: 100,
    suppressRepeatedErrors: true
  });
});

describe('ContextActionError', () => {
  test('기본 에러 생성', () => {
    const error = new ContextActionError(
      ContextActionErrorType.STORE_ERROR,
      'Test error message'
    );

    expect(error.name).toBe('ContextActionError');
    expect(error.type).toBe(ContextActionErrorType.STORE_ERROR);
    expect(error.message).toBe('Test error message');
    expect(error.timestamp).toBeLessThanOrEqual(Date.now());
    expect(error.context).toBeUndefined();
  });

  test('컨텍스트가 있는 에러 생성', () => {
    const context = {
      storeName: 'userStore',
      operation: 'setValue',
      value: { id: 1, name: 'John' }
    };

    const error = new ContextActionError(
      ContextActionErrorType.VALIDATION_ERROR,
      'Validation failed',
      context
    );

    expect(error.type).toBe(ContextActionErrorType.VALIDATION_ERROR);
    expect(error.context).toEqual(context);
  });

  test('원본 에러와 함께 생성', () => {
    const originalError = new TypeError('Type error');
    const error = new ContextActionError(
      ContextActionErrorType.ACTION_ERROR,
      'Action failed',
      { actionName: 'updateUser' },
      originalError
    );

    expect(error.stack).toContain('Caused by: TypeError: Type error');
  });

  test('스택 트레이스 캡처', () => {
    const error = new ContextActionError(
      ContextActionErrorType.REF_ERROR,
      'Ref error'
    );

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('ContextActionError: Ref error');
  });
});

describe('에러 핸들링 설정', () => {
  test('기본 설정값 확인', () => {
    const config = getErrorHandlingConfig();

    expect(config.logLevel).toBe(ErrorLogLevel.ERROR);
    expect(config.throwOnError).toBe(false);
    expect(config.enableStackTrace).toBe(true);
    expect(config.maxLogEntries).toBe(100);
    expect(config.suppressRepeatedErrors).toBe(true);
  });

  test('설정 업데이트', () => {
    setErrorHandlingConfig({
      logLevel: ErrorLogLevel.DEBUG,
      throwOnError: true,
      maxLogEntries: 50
    });

    const config = getErrorHandlingConfig();
    expect(config.logLevel).toBe(ErrorLogLevel.DEBUG);
    expect(config.throwOnError).toBe(true);
    expect(config.maxLogEntries).toBe(50);
    // 다른 설정은 기본값 유지
    expect(config.enableStackTrace).toBe(true);
  });

  test('환경별 기본 설정', () => {
    const originalEnv = process.env.NODE_ENV;

    process.env.NODE_ENV = 'development';
    // 설정 재로드 시뮬레이션을 위해 새로운 기본 설정 적용
    setErrorHandlingConfig({
      logLevel: ErrorLogLevel.DEBUG,
      throwOnError: true
    });

    let config = getErrorHandlingConfig();
    expect(config.logLevel).toBe(ErrorLogLevel.DEBUG);
    expect(config.throwOnError).toBe(true);

    process.env.NODE_ENV = 'production';
    setErrorHandlingConfig({
      logLevel: ErrorLogLevel.ERROR,
      throwOnError: false
    });

    config = getErrorHandlingConfig();
    expect(config.logLevel).toBe(ErrorLogLevel.ERROR);
    expect(config.throwOnError).toBe(false);

    process.env.NODE_ENV = originalEnv;
  });
});

describe('handleError 함수', () => {
  test('기본 에러 처리', () => {
    const error = handleError(
      ContextActionErrorType.STORE_ERROR,
      'Store operation failed'
    );

    expect(error).toBeInstanceOf(ContextActionError);
    expect(error.type).toBe(ContextActionErrorType.STORE_ERROR);
    expect(error.message).toBe('Store operation failed');
  });

  test('컨텍스트와 함께 에러 처리', () => {
    const context = {
      storeName: 'productStore',
      actionName: 'addProduct'
    };

    const error = handleError(
      ContextActionErrorType.ACTION_ERROR,
      'Failed to add product',
      context
    );

    expect(error.context).toEqual(context);
  });

  test('원본 에러와 함께 처리', () => {
    const originalError = new Error('Database connection failed');
    
    const error = handleError(
      ContextActionErrorType.STORE_ERROR,
      'Store update failed',
      { operation: 'database-update' },
      originalError
    );

    expect(error.stack).toContain('Database connection failed');
  });

  test('throwOnError 설정에 따른 동작', () => {
    setErrorHandlingConfig({ throwOnError: true });

    expect(() => {
      handleError(
        ContextActionErrorType.VALIDATION_ERROR,
        'Should throw'
      );
    }).toThrow(ContextActionError);
  });

  test('globalErrorBoundary 통합', () => {
    handleError(
      ContextActionErrorType.CIRCULAR_REFERENCE_ERROR,
      'Circular reference detected'
    );

    expect(globalErrorBoundary.getErrorCount()).toBe(1);
    
    const lastError = globalErrorBoundary.getLastError();
    expect(lastError?.message).toBe('Circular reference detected');
  });
});

describe('도메인별 에러 핸들러', () => {
  test('ErrorHandlers.store', () => {
    setErrorHandlingConfig({ throwOnError: false });

    const error = ErrorHandlers.store('Store validation failed', {
      storeName: 'userStore',
      value: 'invalid-data'
    });

    expect(error.type).toBe(ContextActionErrorType.STORE_ERROR);
    expect(error.message).toContain('Store validation failed');
    expect(error.context?.storeName).toBe('userStore');
  });

  test('ErrorHandlers.action', () => {
    const error = ErrorHandlers.action('Action execution failed', {
      actionName: 'deleteUser',
      payload: { userId: 123 }
    });

    expect(error.type).toBe(ContextActionErrorType.ACTION_ERROR);
    expect(error.context?.actionName).toBe('deleteUser');
  });

  test('ErrorHandlers.validation', () => {
    const error = ErrorHandlers.validation('Email format invalid', {
      field: 'email',
      value: 'invalid-email'
    });

    expect(error.type).toBe(ContextActionErrorType.VALIDATION_ERROR);
  });

  test('ErrorHandlers.timeout', () => {
    const error = ErrorHandlers.timeout('Operation timed out', {
      operation: 'fetchData',
      timeout: 5000
    });

    expect(error.type).toBe(ContextActionErrorType.TIMEOUT_ERROR);
  });

  test('모든 에러 핸들러 타입', () => {
    const handlers = [
      () => ErrorHandlers.store('Store error'),
      () => ErrorHandlers.action('Action error'),  
      () => ErrorHandlers.ref('Ref error'),
      () => ErrorHandlers.validation('Validation error'),
      () => ErrorHandlers.initialization('Init error'),
      () => ErrorHandlers.timeout('Timeout error'),
      () => ErrorHandlers.circularReference('Circular ref error')
    ];

    setErrorHandlingConfig({ throwOnError: false });

    handlers.forEach(handler => {
      expect(() => handler()).not.toThrow();
    });

    expect(globalErrorBoundary.getErrorCount()).toBe(7);
  });
});



describe('에러 로깅', () => {
  test('로그 레벨별 출력', () => {
    // DEBUG 레벨
    setErrorHandlingConfig({ logLevel: ErrorLogLevel.DEBUG });
    ErrorHandlers.store('Debug message');
    expect(console.debug).toHaveBeenCalled();

    // INFO 레벨
    setErrorHandlingConfig({ logLevel: ErrorLogLevel.INFO });
    ErrorHandlers.action('Info message');
    expect(console.info).toHaveBeenCalled();

    // WARN 레벨
    setErrorHandlingConfig({ logLevel: ErrorLogLevel.WARN });
    ErrorHandlers.validation('Warning message');
    expect(console.warn).toHaveBeenCalled();

    // ERROR 레벨
    setErrorHandlingConfig({ logLevel: ErrorLogLevel.ERROR });
    ErrorHandlers.timeout('Error message');
    expect(console.error).toHaveBeenCalled();

    // SILENT 레벨
    setErrorHandlingConfig({ logLevel: ErrorLogLevel.SILENT });
    jest.clearAllMocks();
    ErrorHandlers.ref('Silent message');
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test('스택 트레이스 로깅', () => {
    setErrorHandlingConfig({ 
      logLevel: ErrorLogLevel.ERROR,
      enableStackTrace: true 
    });

    ErrorHandlers.store('Stack trace test');

    expect(console.error).toHaveBeenCalledWith(
      '[Context-Action] Error:',
      expect.any(ContextActionError)
    );
    expect(console.error).toHaveBeenCalledWith(
      'Stack trace:',
      expect.any(String)
    );
  });

  test('스택 트레이스 비활성화', () => {
    setErrorHandlingConfig({ 
      logLevel: ErrorLogLevel.ERROR,
      enableStackTrace: false 
    });

    ErrorHandlers.action('No stack trace');

    expect(console.error).toHaveBeenCalledWith(
      '[Context-Action] Error:',
      expect.any(ContextActionError)
    );
    expect(console.error).not.toHaveBeenCalledWith(
      'Stack trace:',
      expect.any(String)
    );
  });
});

describe('중복 에러 억제', () => {
  test('동일한 에러 중복 발생시 억제', () => {
    setErrorHandlingConfig({ suppressRepeatedErrors: true });

    const context = { storeName: 'testStore' };

    // 같은 메시지와 컨텍스트로 여러 번 에러 발생
    ErrorHandlers.store('Duplicate error', context);
    ErrorHandlers.store('Duplicate error', context);
    ErrorHandlers.store('Duplicate error', context);

    // 첫 번째만 로깅되고, 나머지는 억제됨
    expect(console.error).toHaveBeenCalledTimes(2); // 1번째 + 스택 트레이스
  });

  test('중복 억제 비활성화', () => {
    setErrorHandlingConfig({ suppressRepeatedErrors: false });

    const context = { storeName: 'testStore' };

    ErrorHandlers.validation('Not suppressed', context);
    ErrorHandlers.validation('Not suppressed', context);
    ErrorHandlers.validation('Not suppressed', context);

    // 모든 에러가 로깅됨 (각각 에러 + 스택 트레이스)
    expect(console.error).toHaveBeenCalledTimes(6);
  });

  test('중복 에러 카운팅', () => {
    setErrorHandlingConfig({ suppressRepeatedErrors: true });

    for (let i = 0; i < 15; i++) {
      ErrorHandlers.action('Repeated action error');
    }

    // 10회마다 중복 경고 출력
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Repeated error occurred 10 times'),
      expect.any(ContextActionError)
    );
  });
});




describe('환경별 에러 처리', () => {
  test('개발 환경에서의 에러 처리', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    setErrorHandlingConfig({
      throwOnError: true,
      logLevel: ErrorLogLevel.DEBUG,
      enableStackTrace: true
    });

    // 개발 환경에서는 에러가 throw되어야 함
    expect(() => {
      ErrorHandlers.store('Development error', { 
        storeName: 'devStore',
        debug: true 
      });
    }).toThrow(ContextActionError);

    process.env.NODE_ENV = originalEnv;
  });

});