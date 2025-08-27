/**
 * 통일된 에러 처리 시스템
 * Context-Action 프레임워크 전반에서 일관된 에러 처리를 제공
 */

export interface ErrorContext {
  operation: string;
  component?: string;
  store?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorBoundary {
  handleError(error: Error, context: ErrorContext): void;
  shouldPropagate(error: Error): boolean;
  getErrorHistory(): ErrorInfo[];
}

export interface ErrorHandler {
  (error: ErrorInfo): void;
}

export interface ErrorBoundaryConfig {
  /** 개발 환경에서 콘솔에 로깅 여부 */
  enableConsoleLogging?: boolean;
  /** 프로덕션 환경에서 에러 리포팅 여부 */
  enableErrorReporting?: boolean;
  /** 최대 에러 히스토리 보관 개수 */
  maxErrorHistory?: number;
  /** 커스텀 에러 핸들러 */
  customErrorHandler?: ErrorHandler;
  /** 에러 전파 여부를 결정하는 커스텀 함수 */
  shouldPropagate?: (error: Error, context: ErrorContext) => boolean;
}

/**
 * 통일된 에러 경계 구현
 * 프레임워크 전체에서 일관된 에러 처리를 제공
 */
export class ContextActionErrorBoundary implements ErrorBoundary {
  private config: Required<ErrorBoundaryConfig>;
  private errorHistory: ErrorInfo[] = [];
  private errorCounts = new Map<string, number>();

  constructor(config: ErrorBoundaryConfig = {}) {
    this.config = {
      enableConsoleLogging: config.enableConsoleLogging ?? (process.env.NODE_ENV === 'development'),
      enableErrorReporting: config.enableErrorReporting ?? (process.env.NODE_ENV === 'production'),
      maxErrorHistory: config.maxErrorHistory ?? 100,
      customErrorHandler: config.customErrorHandler ?? this.defaultErrorHandler,
      shouldPropagate: config.shouldPropagate ?? this.defaultShouldPropagate,
    };
  }

  /**
   * 에러 처리 메인 메서드
   */
  handleError(error: Error, context: ErrorContext): void {
    const severity = this.determineSeverity(error, context);
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      severity,
    };

    // 에러 히스토리 업데이트
    this.updateErrorHistory(errorInfo);
    this.updateErrorCounts(context.operation);

    // 콘솔 로깅 (개발 환경)
    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorInfo);
    }

    // 커스텀 에러 핸들러 실행
    try {
      this.config.customErrorHandler(errorInfo);
    } catch (handlerError) {
      if (this.config.enableConsoleLogging) {
        console.error('Error in custom error handler:', handlerError);
      }
    }

    // 에러 리포팅 (프로덕션 환경)
    if (this.config.enableErrorReporting) {
      this.reportError(errorInfo);
    }
  }

  /**
   * 에러 전파 여부 결정
   */
  shouldPropagate(error: Error): boolean {
    return this.config.shouldPropagate(error, { operation: 'unknown' });
  }

  /**
   * 에러 히스토리 조회
   */
  getErrorHistory(): ErrorInfo[] {
    return [...this.errorHistory];
  }

  /**
   * 에러 통계 조회
   */
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  /**
   * 에러 히스토리 초기화
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.errorCounts.clear();
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<ErrorBoundaryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 에러 심각도 결정
   */
  private determineSeverity(error: Error, context: ErrorContext): ErrorInfo['severity'] {
    // 특정 에러 타입에 따른 심각도 결정
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'critical';
    }

    // 컨텍스트에 따른 심각도 결정
    if (context.operation === 'setValue' || context.operation === 'subscription') {
      return 'high';
    }

    if (context.operation === 'comparison' || context.operation === 'notification') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 에러 히스토리 업데이트
   */
  private updateErrorHistory(errorInfo: ErrorInfo): void {
    this.errorHistory.unshift(errorInfo);
    
    // 최대 히스토리 개수 제한
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(0, this.config.maxErrorHistory);
    }
  }

  /**
   * 에러 발생 횟수 업데이트
   */
  private updateErrorCounts(operation: string): void {
    const currentCount = this.errorCounts.get(operation) || 0;
    this.errorCounts.set(operation, currentCount + 1);
  }

  /**
   * 콘솔 로깅
   */
  private logToConsole(errorInfo: ErrorInfo): void {
    const { message, context, severity, timestamp } = errorInfo;
    const logMethod = severity === 'critical' ? 'error' : 
                     severity === 'high' ? 'error' :
                     severity === 'medium' ? 'warn' : 'log';

    console.group(`🚨 Context-Action Error [${severity.toUpperCase()}]`);
    console[logMethod]('Message:', message);
    console.log('Context:', context);
    console.log('Timestamp:', new Date(timestamp).toISOString());
    if (errorInfo.stack) {
      console.log('Stack:', errorInfo.stack);
    }
    console.groupEnd();
  }

  /**
   * 에러 리포팅 (프로덕션 환경)
   */
  private reportError(errorInfo: ErrorInfo): void {
    // 실제 환경에서는 Sentry, LogRocket 등의 서비스에 전송
    if (typeof window !== 'undefined' && window.console) {
      // 브라우저 환경에서의 간단한 리포팅
      console.warn('Error reported to monitoring service:', {
        message: errorInfo.message,
        operation: errorInfo.context.operation,
        severity: errorInfo.severity,
        timestamp: errorInfo.timestamp
      });
    }
  }

  /**
   * 기본 에러 핸들러
   */
  private defaultErrorHandler: ErrorHandler = (_errorInfo) => {
    // 기본적으로는 아무것도 하지 않음
    // 사용자가 커스텀 핸들러를 제공하지 않은 경우의 fallback
  };

  /**
   * 기본 에러 전파 결정 로직
   */
  private defaultShouldPropagate = (error: Error, context: ErrorContext): boolean => {
    // 심각한 에러는 항상 전파
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return true;
    }

    // Store 관련 에러는 일반적으로 전파하지 않음
    if (context.store) {
      return false;
    }

    // Action 관련 에러는 선택적 전파
    if (context.action) {
      return error.message.includes('critical');
    }

    return false;
  };
}

/**
 * 전역 에러 경계 인스턴스
 */
export const globalErrorBoundary = new ContextActionErrorBoundary();

/**
 * 에러 처리 유틸리티 함수들
 */
export const ErrorHandlerUtils = {
  /**
   * 안전한 함수 실행 (에러 캐치)
   */
  safeExecute<T>(
    fn: () => T,
    context: ErrorContext,
    fallback?: T,
    errorBoundary: ErrorBoundary = globalErrorBoundary
  ): T | undefined {
    try {
      return fn();
    } catch (error) {
      errorBoundary.handleError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      return fallback;
    }
  },

  /**
   * 안전한 비동기 함수 실행 (에러 캐치)
   */
  async safeExecuteAsync<T>(
    fn: () => Promise<T>,
    context: ErrorContext,
    fallback?: T,
    errorBoundary: ErrorBoundary = globalErrorBoundary
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      errorBoundary.handleError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      return fallback;
    }
  },

  /**
   * 함수를 에러 경계로 래핑
   */
  withErrorBoundary<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => TReturn,
    context: ErrorContext,
    _errorBoundary: ErrorBoundary = globalErrorBoundary
  ) {
    return (...args: TArgs): TReturn | undefined => {
      return ErrorHandlerUtils.safeExecute(() => fn(...args), context);
    };
  },

  /**
   * 비동기 함수를 에러 경계로 래핑
   */
  withAsyncErrorBoundary<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    context: ErrorContext,
    _errorBoundary: ErrorBoundary = globalErrorBoundary
  ) {
    return (...args: TArgs): Promise<TReturn | undefined> => {
      return ErrorHandlerUtils.safeExecuteAsync(() => fn(...args), context);
    };
  }
};

/**
 * React 에러 경계 컴포넌트를 위한 props
 */
export interface ReactErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  errorBoundary?: ErrorBoundary;
}