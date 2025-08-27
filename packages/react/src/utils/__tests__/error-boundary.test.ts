/**
 * 통합 에러 바운더리 시스템 테스트
 * ContextActionErrorBoundary, ErrorHandlerUtils, globalErrorBoundary 검증
 */

import {
  ContextActionErrorBoundary,
  ErrorHandlerUtils,
  globalErrorBoundary,
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext,
  type ErrorHandler,
  type ErrorInfo
} from '../error-boundary';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
const originalConsoleGroup = console.group;
const originalConsoleGroupEnd = console.groupEnd;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
  console.group = originalConsoleGroup;
  console.groupEnd = originalConsoleGroupEnd;
  
  // 글로벌 에러 바운더리 초기화
  globalErrorBoundary.reset();
});

describe('ContextActionErrorBoundary', () => {
  describe('기본 기능', () => {
    test('에러 바운더리 생성과 초기 상태', () => {
      const boundary = new ContextActionErrorBoundary();
      
      expect(boundary.getErrorCount()).toBe(0);
      expect(boundary.getLastError()).toBeNull();
      expect(boundary.hasErrors()).toBe(false);
    });

    test('에러 처리 및 통계 업데이트', () => {
      const boundary = new ContextActionErrorBoundary();
      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'test-operation',
        store: 'test-store'
      };

      boundary.handleError(error, context);

      expect(boundary.getErrorCount()).toBe(1);
      expect(boundary.getLastError()?.error).toBe(error);
      expect(boundary.hasErrors()).toBe(true);
    });

    test('심각도별 에러 분류', () => {
      const boundary = new ContextActionErrorBoundary();

      // CRITICAL 에러
      const criticalError = new Error('Critical error');
      boundary.handleError(criticalError, { 
        operation: 'critical-op',
        severity: ErrorSeverity.CRITICAL 
      });

      // WARNING 에러  
      const warningError = new Error('Warning error');
      boundary.handleError(warningError, {
        operation: 'warning-op',
        severity: ErrorSeverity.WARNING
      });

      const stats = boundary.getErrorStats();
      expect(stats.bySeverity[ErrorSeverity.CRITICAL]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.WARNING]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.ERROR]).toBe(0);
    });

    test('카테고리별 에러 분류', () => {
      const boundary = new ContextActionErrorBoundary();

      boundary.handleError(new Error('Store error'), {
        operation: 'store-op',
        category: ErrorCategory.STORE
      });

      boundary.handleError(new Error('Action error'), {
        operation: 'action-op', 
        category: ErrorCategory.ACTION
      });

      const stats = boundary.getErrorStats();
      expect(stats.byCategory[ErrorCategory.STORE]).toBe(1);
      expect(stats.byCategory[ErrorCategory.ACTION]).toBe(1);
      expect(stats.byCategory[ErrorCategory.COMPONENT]).toBe(0);
    });

    test('에러 중복 제거', () => {
      const boundary = new ContextActionErrorBoundary();
      const error = new Error('Duplicate error');
      const context = { operation: 'dup-test' };

      // 동일한 에러 여러 번 발생
      boundary.handleError(error, context);
      boundary.handleError(error, context);
      boundary.handleError(error, context);

      // 중복 제거로 인해 카운트가 증가하지 않아야 함
      expect(boundary.getErrorCount()).toBe(1);
      
      const errorInfo = boundary.getLastError()!;
      expect(errorInfo.occurrences).toBe(3);
    });
  });

  describe('에러 핸들러 관리', () => {
    test('커스텀 에러 핸들러 추가', () => {
      const boundary = new ContextActionErrorBoundary();
      const customHandler = jest.fn();

      boundary.addErrorHandler('custom', customHandler);

      const error = new Error('Custom handler test');
      boundary.handleError(error, { operation: 'custom-test' });

      expect(customHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          error,
          context: expect.objectContaining({ operation: 'custom-test' })
        })
      );
    });

    test('여러 에러 핸들러 체인 실행', () => {
      const boundary = new ContextActionErrorBoundary();
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      boundary.addErrorHandler('handler1', handler1);
      boundary.addErrorHandler('handler2', handler2);
      boundary.addErrorHandler('handler3', handler3);

      boundary.handleError(new Error('Chain test'), { operation: 'chain' });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });

    test('에러 핸들러 제거', () => {
      const boundary = new ContextActionErrorBoundary();
      const handler = jest.fn();

      boundary.addErrorHandler('removable', handler);
      boundary.removeErrorHandler('removable');

      boundary.handleError(new Error('Remove test'), { operation: 'remove' });

      expect(handler).not.toHaveBeenCalled();
    });

    test('에러 핸들러에서 에러 발생시 처리', () => {
      const boundary = new ContextActionErrorBoundary();
      const faultyHandler = jest.fn(() => {
        throw new Error('Handler error');
      });

      boundary.addErrorHandler('faulty', faultyHandler);

      // 핸들러에서 에러가 발생해도 boundary는 계속 작동해야 함
      expect(() => {
        boundary.handleError(new Error('Original error'), { operation: 'faulty-handler' });
      }).not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        'Error handler "faulty" threw an error:',
        expect.any(Error)
      );
    });
  });

  describe('에러 전파 제어', () => {
    test('기본 전파 정책', () => {
      const boundary = new ContextActionErrorBoundary();

      // CRITICAL 에러는 전파되어야 함
      expect(boundary.shouldPropagate(new Error('Critical'), {
        severity: ErrorSeverity.CRITICAL
      })).toBe(true);

      // WARNING은 전파되지 않아야 함
      expect(boundary.shouldPropagate(new Error('Warning'), {
        severity: ErrorSeverity.WARNING
      })).toBe(false);
    });

    test('커스텀 전파 정책 설정', () => {
      const boundary = new ContextActionErrorBoundary();
      
      // 모든 에러를 전파하지 않도록 설정
      boundary.setPropagationPolicy(() => false);

      expect(boundary.shouldPropagate(new Error('Critical'), {
        severity: ErrorSeverity.CRITICAL
      })).toBe(false);
    });

    test('조건부 전파 정책', () => {
      const boundary = new ContextActionErrorBoundary();
      
      // 특정 operation만 전파
      boundary.setPropagationPolicy((error, context) => {
        return context?.operation === 'critical-operation';
      });

      expect(boundary.shouldPropagate(new Error('Test'), {
        operation: 'critical-operation'
      })).toBe(true);

      expect(boundary.shouldPropagate(new Error('Test'), {
        operation: 'normal-operation'
      })).toBe(false);
    });
  });

  describe('에러 로깅', () => {
    test('기본 콘솔 로깅', () => {
      const boundary = new ContextActionErrorBoundary();
      const error = new Error('Console log test');

      boundary.handleError(error, {
        operation: 'console-test',
        severity: ErrorSeverity.ERROR
      });

      expect(console.group).toHaveBeenCalledWith('🚨 Context-Action Error [ERROR]');
      expect(console.log).toHaveBeenCalledWith('Message: Console log test');
      expect(console.groupEnd).toHaveBeenCalled();
    });

    test('심각도별 로깅 색상', () => {
      const boundary = new ContextActionErrorBoundary();

      boundary.handleError(new Error('Critical'), {
        severity: ErrorSeverity.CRITICAL
      });

      boundary.handleError(new Error('Warning'), {
        severity: ErrorSeverity.WARNING  
      });

      expect(console.group).toHaveBeenCalledWith('🚨 Context-Action Error [CRITICAL]');
      expect(console.group).toHaveBeenCalledWith('🚨 Context-Action Error [WARNING]');
    });

    test('로깅 활성화/비활성화', () => {
      const boundary = new ContextActionErrorBoundary();
      
      boundary.setLoggingEnabled(false);
      boundary.handleError(new Error('No log'), { operation: 'no-log' });

      expect(console.group).not.toHaveBeenCalled();

      boundary.setLoggingEnabled(true);
      boundary.handleError(new Error('With log'), { operation: 'with-log' });

      expect(console.group).toHaveBeenCalled();
    });
  });

  describe('에러 통계 및 분석', () => {
    test('상세 에러 통계', () => {
      const boundary = new ContextActionErrorBoundary();

      // 다양한 에러 생성
      boundary.handleError(new Error('Store error 1'), {
        category: ErrorCategory.STORE,
        severity: ErrorSeverity.ERROR
      });

      boundary.handleError(new Error('Store error 2'), {
        category: ErrorCategory.STORE,
        severity: ErrorSeverity.WARNING
      });

      boundary.handleError(new Error('Action error'), {
        category: ErrorCategory.ACTION,
        severity: ErrorSeverity.CRITICAL
      });

      const stats = boundary.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.byCategory[ErrorCategory.STORE]).toBe(2);
      expect(stats.byCategory[ErrorCategory.ACTION]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.CRITICAL]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.ERROR]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.WARNING]).toBe(1);
    });

    test('에러 이력 조회', () => {
      const boundary = new ContextActionErrorBoundary();

      boundary.handleError(new Error('First'), { operation: 'op1' });
      boundary.handleError(new Error('Second'), { operation: 'op2' });
      boundary.handleError(new Error('Third'), { operation: 'op3' });

      const history = boundary.getErrorHistory();
      expect(history).toHaveLength(3);
      expect(history[0].error.message).toBe('First');
      expect(history[2].error.message).toBe('Third');
    });

    test('에러 이력 제한', () => {
      const boundary = new ContextActionErrorBoundary({
        maxErrors: 2
      });

      boundary.handleError(new Error('1'), { operation: 'op1' });
      boundary.handleError(new Error('2'), { operation: 'op2' });
      boundary.handleError(new Error('3'), { operation: 'op3' });

      const history = boundary.getErrorHistory();
      expect(history).toHaveLength(2);
      expect(history[0].error.message).toBe('2'); // 오래된 것이 제거됨
      expect(history[1].error.message).toBe('3');
    });
  });

  describe('재설정 및 정리', () => {
    test('에러 바운더리 재설정', () => {
      const boundary = new ContextActionErrorBoundary();

      boundary.handleError(new Error('Before reset'), { operation: 'before' });
      expect(boundary.getErrorCount()).toBe(1);

      boundary.reset();

      expect(boundary.getErrorCount()).toBe(0);
      expect(boundary.getLastError()).toBeNull();
      expect(boundary.hasErrors()).toBe(false);
      expect(boundary.getErrorHistory()).toHaveLength(0);
    });

    test('핸들러 정리', () => {
      const boundary = new ContextActionErrorBoundary();
      const handler = jest.fn();

      boundary.addErrorHandler('temp', handler);
      boundary.reset();

      boundary.handleError(new Error('After reset'), { operation: 'after' });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe('ErrorHandlerUtils', () => {
  describe('안전한 실행 래퍼', () => {
    test('safeExecute - 성공 케이스', () => {
      const successFn = jest.fn(() => 'success result');
      const context = { operation: 'safe-test' };

      const result = ErrorHandlerUtils.safeExecute(successFn, context, 'default');

      expect(result).toBe('success result');
      expect(successFn).toHaveBeenCalled();
    });

    test('safeExecute - 에러 발생시 기본값 반환', () => {
      const errorFn = jest.fn(() => {
        throw new Error('Function error');
      });
      const context = { operation: 'error-test' };

      const result = ErrorHandlerUtils.safeExecute(errorFn, context, 'fallback');

      expect(result).toBe('fallback');
      expect(errorFn).toHaveBeenCalled();
      
      // 글로벌 에러 바운더리에 에러가 전달되었는지 확인
      expect(globalErrorBoundary.getErrorCount()).toBe(1);
    });

    test('safeExecuteAsync - 비동기 성공 케이스', async () => {
      const asyncSuccessFn = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async success';
      });

      const result = await ErrorHandlerUtils.safeExecuteAsync(
        asyncSuccessFn,
        { operation: 'async-safe' },
        'async default'
      );

      expect(result).toBe('async success');
      expect(asyncSuccessFn).toHaveBeenCalled();
    });

    test('safeExecuteAsync - 비동기 에러 발생시', async () => {
      const asyncErrorFn = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Async error');
      });

      const result = await ErrorHandlerUtils.safeExecuteAsync(
        asyncErrorFn,
        { operation: 'async-error' },
        'async fallback'
      );

      expect(result).toBe('async fallback');
      expect(globalErrorBoundary.getErrorCount()).toBe(1);
    });
  });

  describe('에러 바운더리 래퍼', () => {
    test('withErrorBoundary - 함수 래핑', () => {
      const originalFn = jest.fn((x: number, y: number) => x + y);
      const context = { operation: 'wrapper-test' };

      const wrappedFn = ErrorHandlerUtils.withErrorBoundary(originalFn, context);

      const result = wrappedFn(3, 7);
      expect(result).toBe(10);
      expect(originalFn).toHaveBeenCalledWith(3, 7);
    });

    test('withErrorBoundary - 에러 발생시', () => {
      const errorFn = jest.fn(() => {
        throw new Error('Wrapped error');
      });
      const context = { operation: 'wrapper-error' };

      const wrappedFn = ErrorHandlerUtils.withErrorBoundary(errorFn, context);

      const result = wrappedFn();
      expect(result).toBeUndefined();
      expect(globalErrorBoundary.getErrorCount()).toBe(1);
    });

    test('withAsyncErrorBoundary - 비동기 함수 래핑', async () => {
      const asyncFn = jest.fn(async (data: string) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return `processed: ${data}`;
      });

      const wrappedAsyncFn = ErrorHandlerUtils.withAsyncErrorBoundary(
        asyncFn,
        { operation: 'async-wrapper' }
      );

      const result = await wrappedAsyncFn('test data');
      expect(result).toBe('processed: test data');
    });

    test('withAsyncErrorBoundary - 비동기 에러', async () => {
      const asyncErrorFn = jest.fn(async () => {
        throw new Error('Async wrapped error');
      });

      const wrappedAsyncFn = ErrorHandlerUtils.withAsyncErrorBoundary(
        asyncErrorFn,
        { operation: 'async-wrapper-error' }
      );

      const result = await wrappedAsyncFn();
      expect(result).toBeUndefined();
      expect(globalErrorBoundary.getErrorCount()).toBe(1);
    });
  });
});

describe('globalErrorBoundary', () => {
  test('글로벌 싱글톤 인스턴스', () => {
    expect(globalErrorBoundary).toBeInstanceOf(ContextActionErrorBoundary);
    
    // 동일한 인스턴스인지 확인
    const another = globalErrorBoundary;
    expect(another).toBe(globalErrorBoundary);
  });

  test('글로벌 에러 처리', () => {
    const error = new Error('Global test error');
    globalErrorBoundary.handleError(error, { operation: 'global-test' });

    expect(globalErrorBoundary.getErrorCount()).toBe(1);
    expect(globalErrorBoundary.getLastError()?.error).toBe(error);
  });

  test('여러 모듈에서 동일한 글로벌 인스턴스 사용', () => {
    // 모듈 A에서 에러 추가
    globalErrorBoundary.handleError(new Error('Module A'), { 
      operation: 'module-a' 
    });

    // 모듈 B에서 에러 확인
    expect(globalErrorBoundary.getErrorCount()).toBe(1);

    // 모듈 B에서 에러 추가
    globalErrorBoundary.handleError(new Error('Module B'), { 
      operation: 'module-b' 
    });

    // 모듈 A에서 통합 통계 확인
    expect(globalErrorBoundary.getErrorCount()).toBe(2);
  });
});

describe('에러 컨텍스트 및 메타데이터', () => {
  test('풍부한 컨텍스트 정보 처리', () => {
    const boundary = new ContextActionErrorBoundary();
    const error = new Error('Context test');
    const richContext: ErrorContext = {
      operation: 'complex-operation',
      store: 'user-store',
      component: 'UserProfile',
      action: 'updateProfile',
      metadata: {
        userId: 123,
        timestamp: Date.now(),
        version: '1.2.3',
        environment: 'production'
      }
    };

    boundary.handleError(error, richContext);

    const lastError = boundary.getLastError()!;
    expect(lastError.context.store).toBe('user-store');
    expect(lastError.context.component).toBe('UserProfile');
    expect(lastError.context.action).toBe('updateProfile');
    expect(lastError.context.metadata?.userId).toBe(123);
  });

  test('부분적 컨텍스트 정보 처리', () => {
    const boundary = new ContextActionErrorBoundary();
    
    boundary.handleError(new Error('Minimal context'), {
      operation: 'minimal-op'
    });

    const lastError = boundary.getLastError()!;
    expect(lastError.context.operation).toBe('minimal-op');
    expect(lastError.context.store).toBeUndefined();
    expect(lastError.context.component).toBeUndefined();
  });
});

describe('실제 사용 시나리오', () => {
  test('Store 에러 처리 시나리오', () => {
    const boundary = new ContextActionErrorBoundary();

    // Store 에러 핸들러 추가
    boundary.addErrorHandler('store-validator', (errorInfo) => {
      if (errorInfo.context.category === ErrorCategory.STORE) {
        // Store 에러 발생시 특별한 처리
        console.log('Store validation failed:', errorInfo.error.message);
      }
    });

    // Store 에러 시뮬레이션
    boundary.handleError(new Error('Invalid store value'), {
      operation: 'setValue',
      store: 'userStore',
      category: ErrorCategory.STORE,
      severity: ErrorSeverity.ERROR,
      metadata: { 
        storeName: 'userStore',
        invalidValue: { invalid: 'data' }
      }
    });

    expect(console.log).toHaveBeenCalledWith(
      'Store validation failed:',
      'Invalid store value'
    );
  });

  test('Action 에러 처리 시나리오', () => {
    const boundary = new ContextActionErrorBoundary();

    // Action 에러 핸들러 추가  
    const actionHandler = jest.fn();
    boundary.addErrorHandler('action-handler', actionHandler);

    // Action 에러 시뮬레이션
    boundary.handleError(new Error('Action execution failed'), {
      operation: 'dispatchAction',
      action: 'updateUser',
      component: 'UserForm',
      category: ErrorCategory.ACTION,
      severity: ErrorSeverity.ERROR,
      metadata: {
        actionName: 'updateUser',
        payload: { id: 123, name: 'John' }
      }
    });

    expect(actionHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'Action execution failed' }),
        context: expect.objectContaining({
          action: 'updateUser',
          component: 'UserForm'
        })
      })
    );
  });

  test('복합 에러 처리 워크플로우', async () => {
    const boundary = new ContextActionErrorBoundary();

    // 다양한 핸들러 추가
    const logHandler = jest.fn();
    const alertHandler = jest.fn();
    const reportHandler = jest.fn();

    boundary.addErrorHandler('logger', logHandler);
    boundary.addErrorHandler('alerter', alertHandler);
    boundary.addErrorHandler('reporter', reportHandler);

    // 여러 에러 시나리오
    const scenarios = [
      {
        error: new Error('Network timeout'),
        context: {
          operation: 'fetchData',
          category: ErrorCategory.NETWORK,
          severity: ErrorSeverity.WARNING
        }
      },
      {
        error: new Error('Store corruption detected'),
        context: {
          operation: 'validateStore',
          store: 'mainStore',
          category: ErrorCategory.STORE,
          severity: ErrorSeverity.CRITICAL
        }
      },
      {
        error: new Error('Component render error'),
        context: {
          operation: 'render',
          component: 'ProductList',
          category: ErrorCategory.COMPONENT,
          severity: ErrorSeverity.ERROR
        }
      }
    ];

    // 모든 시나리오 실행
    scenarios.forEach(({ error, context }) => {
      boundary.handleError(error, context);
    });

    // 모든 핸들러가 모든 에러에 대해 호출되었는지 확인
    expect(logHandler).toHaveBeenCalledTimes(3);
    expect(alertHandler).toHaveBeenCalledTimes(3);
    expect(reportHandler).toHaveBeenCalledTimes(3);

    // 통계 확인
    const stats = boundary.getErrorStats();
    expect(stats.total).toBe(3);
    expect(stats.bySeverity[ErrorSeverity.CRITICAL]).toBe(1);
    expect(stats.bySeverity[ErrorSeverity.ERROR]).toBe(1);
    expect(stats.bySeverity[ErrorSeverity.WARNING]).toBe(1);
  });
});