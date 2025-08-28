/**
 * Store 에러 핸들링 시스템 테스트
 * ContextActionError, ErrorHandlers, safeAsync/safeSync 등 검증
 */

import {
  ContextActionError,
  ContextActionErrorType,
  ErrorLogLevel,
  ErrorHandlers,
  safeAsync,
  safeSync,
  handleError,
  setErrorHandlingConfig,
  getErrorHandlingConfig,
  getErrorStatistics,
  clearErrorLog,
  getFilteredErrors
} from '../error-handling';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
  
  clearErrorLog();
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
    expect(lastError?.error.message).toBe('Circular reference detected');
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
    expect(error.message).toBe('Store validation failed');
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

describe('safeAsync - 비동기 안전 실행', () => {
  test('성공적인 비동기 실행', async () => {
    const asyncOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'async success';
    };

    const result = await safeAsync(
      asyncOperation,
      ContextActionErrorType.ACTION_ERROR,
      { operation: 'test-async' }
    );

    expect(result).toBe('async success');
  });

  test('비동기 에러 발생시 null 반환', async () => {
    const failingAsyncOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      throw new Error('Async operation failed');
    };

    const result = await safeAsync(
      failingAsyncOperation,
      ContextActionErrorType.ACTION_ERROR,
      { operation: 'failing-async' }
    );

    expect(result).toBeNull();
    expect(globalErrorBoundary.getErrorCount()).toBe(1);
  });

  test('Promise rejection 처리', async () => {
    const rejectingOperation = () => Promise.reject(new Error('Promise rejected'));

    const result = await safeAsync(
      rejectingOperation,
      ContextActionErrorType.TIMEOUT_ERROR
    );

    expect(result).toBeNull();
    expect(globalErrorBoundary.getErrorCount()).toBe(1);
  });
});

describe('safeSync - 동기 안전 실행', () => {
  test('성공적인 동기 실행', () => {
    const syncOperation = () => ({ data: 'sync success', count: 42 });

    const result = safeSync(
      syncOperation,
      ContextActionErrorType.VALIDATION_ERROR,
      { operation: 'test-sync' }
    );

    expect(result).toEqual({ data: 'sync success', count: 42 });
  });

  test('동기 에러 발생시 null 반환', () => {
    const failingSyncOperation = () => {
      throw new Error('Sync operation failed');
    };

    const result = safeSync(
      failingSyncOperation,
      ContextActionErrorType.STORE_ERROR,
      { operation: 'failing-sync' }
    );

    expect(result).toBeNull();
    expect(globalErrorBoundary.getErrorCount()).toBe(1);
  });

  test('타입 에러 처리', () => {
    const typeErrorOperation = () => {
      const obj: any = null;
      return obj.nonExistentProperty; // TypeError 발생
    };

    const result = safeSync(
      typeErrorOperation,
      ContextActionErrorType.REF_ERROR
    );

    expect(result).toBeNull();
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

describe('에러 통계', () => {
  test('기본 통계 정보', () => {
    ErrorHandlers.store('Store error 1');
    ErrorHandlers.store('Store error 2');
    ErrorHandlers.action('Action error 1');
    ErrorHandlers.validation('Validation error 1');

    const stats = getErrorStatistics();

    expect(stats.totalErrors).toBe(4);
    expect(stats.errorsByType[ContextActionErrorType.STORE_ERROR]).toBe(2);
    expect(stats.errorsByType[ContextActionErrorType.ACTION_ERROR]).toBe(1);
    expect(stats.errorsByType[ContextActionErrorType.VALIDATION_ERROR]).toBe(1);
    expect(stats.errorsByType[ContextActionErrorType.REF_ERROR]).toBe(0);
  });

  test('가장 빈번한 에러', () => {
    // 다양한 빈도로 에러 발생
    for (let i = 0; i < 5; i++) {
      ErrorHandlers.store('Most frequent error');
    }
    for (let i = 0; i < 3; i++) {
      ErrorHandlers.action('Second frequent error');
    }
    ErrorHandlers.validation('Rare error');

    const stats = getErrorStatistics();
    
    expect(stats.mostFrequentErrors.length).toBeGreaterThan(0);
    expect(stats.mostFrequentErrors[0].count).toBe(5);
  });

  test('최근 에러 목록', () => {
    const errorMessages = [
      'First error',
      'Second error', 
      'Third error',
      'Fourth error',
      'Fifth error'
    ];

    errorMessages.forEach(msg => {
      ErrorHandlers.store(msg);
    });

    const stats = getErrorStatistics();
    
    expect(stats.recentErrors.length).toBe(5);
    expect(stats.recentErrors[0].message).toBe('First error');
    expect(stats.recentErrors[4].message).toBe('Fifth error');
  });
});

describe('에러 필터링', () => {
  beforeEach(() => {
    // 테스트 데이터 준비
    ErrorHandlers.store('Store error', { time: 'past' });
    
    setTimeout(() => {
      ErrorHandlers.action('Action error', { time: 'recent' });
    }, 50);

    setTimeout(() => {
      ErrorHandlers.validation('Validation error', { time: 'future' });
    }, 100);
  });

  test('타입별 필터링', () => {
    const storeErrors = getFilteredErrors({ 
      type: ContextActionErrorType.STORE_ERROR 
    });

    expect(storeErrors.length).toBe(1);
    expect(storeErrors[0].error.type).toBe(ContextActionErrorType.STORE_ERROR);
  });

  test('시간 기준 필터링', async () => {
    const timestamp = Date.now();
    
    // 약간의 지연 후 새 에러 추가
    await new Promise(resolve => setTimeout(resolve, 150));
    ErrorHandlers.timeout('Recent timeout error');

    const recentErrors = getFilteredErrors({ 
      since: timestamp 
    });

    expect(recentErrors.length).toBe(1);
    expect(recentErrors[0].error.message).toBe('Recent timeout error');
  });

  test('제한 개수 필터링', () => {
    for (let i = 0; i < 10; i++) {
      ErrorHandlers.ref(`Ref error ${i}`);
    }

    const limitedErrors = getFilteredErrors({ 
      limit: 3 
    });

    expect(limitedErrors.length).toBe(3);
  });

  test('복합 필터링', () => {
    // 여러 Store 에러 생성
    for (let i = 0; i < 5; i++) {
      ErrorHandlers.store(`Store error ${i}`);
    }

    const filtered = getFilteredErrors({
      type: ContextActionErrorType.STORE_ERROR,
      limit: 2
    });

    expect(filtered.length).toBe(2);
    filtered.forEach(entry => {
      expect(entry.error.type).toBe(ContextActionErrorType.STORE_ERROR);
    });
  });
});

describe('에러 로그 관리', () => {
  test('최대 로그 항목 제한', () => {
    setErrorHandlingConfig({ maxLogEntries: 3 });

    // 5개 에러 생성 (최대 3개만 유지되어야 함)
    for (let i = 0; i < 5; i++) {
      ErrorHandlers.store(`Error ${i}`);
    }

    const stats = getErrorStatistics();
    expect(stats.recentErrors.length).toBe(3);
    
    // 가장 오래된 에러들이 제거되고 최신 3개만 남아야 함
    expect(stats.recentErrors[0].message).toBe('Error 2');
    expect(stats.recentErrors[2].message).toBe('Error 4');
  });

  test('에러 로그 초기화', () => {
    ErrorHandlers.store('Before clear');
    ErrorHandlers.action('Before clear');

    let stats = getErrorStatistics();
    expect(stats.totalErrors).toBe(2);

    clearErrorLog();

    stats = getErrorStatistics();
    expect(stats.totalErrors).toBe(0);
    expect(stats.recentErrors.length).toBe(0);
    expect(stats.mostFrequentErrors.length).toBe(0);
  });
});

describe('실제 사용 시나리오', () => {
  test('Store 운영 중 에러 처리 워크플로우', async () => {
    setErrorHandlingConfig({ 
      throwOnError: false,
      logLevel: ErrorLogLevel.ERROR,
      suppressRepeatedErrors: true
    });

    // 1. Store 값 검증 실패
    const validateResult = safeSync(
      () => {
        const value = { id: 'invalid-id', count: -5 };
        if (value.count < 0) {
          throw new Error('Count cannot be negative');
        }
        return value;
      },
      ContextActionErrorType.VALIDATION_ERROR,
      { storeName: 'productStore', operation: 'validateValue' }
    );

    expect(validateResult).toBeNull();

    // 2. 비동기 Store 업데이트 실패
    const updateResult = await safeAsync(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Database connection lost');
      },
      ContextActionErrorType.STORE_ERROR,
      { storeName: 'productStore', operation: 'updateStore' }
    );

    expect(updateResult).toBeNull();

    // 3. Action 실행 중 타임아웃
    ErrorHandlers.timeout('Action execution timed out', {
      actionName: 'fetchProducts',
      timeout: 5000,
      elapsed: 5500
    });

    // 통계 검증
    const stats = getErrorStatistics();
    expect(stats.totalErrors).toBe(3);
    expect(stats.errorsByType[ContextActionErrorType.VALIDATION_ERROR]).toBe(1);
    expect(stats.errorsByType[ContextActionErrorType.STORE_ERROR]).toBe(1);
    expect(stats.errorsByType[ContextActionErrorType.TIMEOUT_ERROR]).toBe(1);

    // 모든 에러가 globalErrorBoundary에도 전달되었는지 확인
    expect(globalErrorBoundary.getErrorCount()).toBe(3);
  });

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

  test('프로덕션 환경에서의 에러 처리', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    setErrorHandlingConfig({
      throwOnError: false,
      logLevel: ErrorLogLevel.WARN,
      suppressRepeatedErrors: true
    });

    // 프로덕션에서는 에러가 throw되지 않고 로깅만 됨
    expect(() => {
      ErrorHandlers.action('Production error', {
        actionName: 'prodAction',
        production: true
      });
    }).not.toThrow();

    // 에러는 여전히 추적됨
    const stats = getErrorStatistics();
    expect(stats.totalErrors).toBe(1);

    process.env.NODE_ENV = originalEnv;
  });
});