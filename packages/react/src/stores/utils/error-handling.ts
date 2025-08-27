/**
 * @fileoverview Error Handling Utilities
 * 
 * 일관된 에러 처리를 위한 유틸리티 함수들
 * Context-Action 프레임워크 전반에 걸친 표준화된 에러 처리 패턴
 * 
 * 통합된 에러 경계 시스템 사용 (error-boundary.ts와 통합)
 */

import { 
  globalErrorBoundary, 
  ErrorHandlerUtils,
  type ErrorContext as BoundaryErrorContext 
} from '../../utils/error-boundary';

/**
 * Context-Action 프레임워크의 에러 유형 정의
 */
export enum ContextActionErrorType {
  STORE_ERROR = 'STORE_ERROR',
  ACTION_ERROR = 'ACTION_ERROR',
  REF_ERROR = 'REF_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CIRCULAR_REFERENCE_ERROR = 'CIRCULAR_REFERENCE_ERROR'
}

/**
 * Context-Action 프레임워크의 표준 에러 클래스
 */
export class ContextActionError extends Error {
  public readonly type: ContextActionErrorType;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;

  constructor(
    type: ContextActionErrorType,
    message: string,
    context?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ContextActionError';
    this.type = type;
    this.context = context;
    this.timestamp = Date.now();
    
    // 원본 에러가 있으면 스택 추가
    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
    
    // Error.captureStackTrace가 사용 가능하면 스택 최적화
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContextActionError);
    }
  }
}

/**
 * 에러 로깅 레벨
 */
export enum ErrorLogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

/**
 * 에러 핸들링 설정
 */
export interface ErrorHandlingConfig {
  logLevel: ErrorLogLevel;
  throwOnError: boolean;
  enableStackTrace: boolean;
  maxLogEntries: number;
  suppressRepeatedErrors: boolean;
}

/**
 * 기본 에러 핸들링 설정
 */
const defaultErrorConfig: ErrorHandlingConfig = {
  logLevel: process.env.NODE_ENV === 'development' ? ErrorLogLevel.DEBUG : ErrorLogLevel.ERROR,
  throwOnError: process.env.NODE_ENV === 'development',
  enableStackTrace: true,
  maxLogEntries: 100,
  suppressRepeatedErrors: true
};

/**
 * 현재 에러 핸들링 설정
 */
let currentErrorConfig: ErrorHandlingConfig = { ...defaultErrorConfig };

/**
 * 에러 로그 엔트리
 */
interface ErrorLogEntry {
  error: ContextActionError;
  count: number;
  lastOccurred: number;
}

/**
 * 에러 로그 저장소
 */
let errorLog: ErrorLogEntry[] = [];
let errorSignatures: Map<string, ErrorLogEntry> = new Map();

/**
 * 에러 핸들링 설정 업데이트
 */
export function setErrorHandlingConfig(config: Partial<ErrorHandlingConfig>): void {
  currentErrorConfig = { ...currentErrorConfig, ...config };
}

/**
 * 현재 에러 핸들링 설정 가져오기
 */
export function getErrorHandlingConfig(): ErrorHandlingConfig {
  return { ...currentErrorConfig };
}

/**
 * 에러 시그니처 생성 (중복 에러 감지용)
 */
function createErrorSignature(error: ContextActionError): string {
  return `${error.type}:${error.message}:${error.context?.component || 'unknown'}`;
}

/**
 * 표준화된 에러 처리 함수 (통합된 에러 바운더리 사용)
 */
export function handleError(
  type: ContextActionErrorType,
  message: string,
  context?: Record<string, unknown>,
  originalError?: Error
): ContextActionError {
  const error = new ContextActionError(type, message, context, originalError);
  
  // 레거시 로깅
  logError(error);
  
  // 새로운 에러 바운더리 시스템으로 전달
  const boundaryContext: BoundaryErrorContext = {
    operation: type,
    store: (context?.storeName || context?.store) as string,
    component: (context?.componentName || context?.component) as string,
    action: (context?.actionName || context?.action) as string,
    metadata: { ...context, errorType: type }
  };
  
  // globalErrorBoundary를 통한 통합 에러 처리
  globalErrorBoundary.handleError(error, boundaryContext);
  
  // 설정에 따라 에러 throw (에러 바운더리의 shouldPropagate 사용)
  if (currentErrorConfig.throwOnError || globalErrorBoundary.shouldPropagate(error)) {
    throw error;
  }
  
  return error;
}

/**
 * 에러 로깅 함수
 */
function logError(error: ContextActionError): void {
  const signature = createErrorSignature(error);
  
  // 중복 에러 억제 설정이 활성화된 경우
  if (currentErrorConfig.suppressRepeatedErrors) {
    const existingEntry = errorSignatures.get(signature);
    if (existingEntry) {
      existingEntry.count++;
      existingEntry.lastOccurred = Date.now();
      
      // 중복 에러는 덜 자주 로깅
      if (existingEntry.count % 10 === 0) {
        console.warn(
          `[Context-Action] Repeated error occurred ${existingEntry.count} times:`,
          error
        );
      }
      return;
    }
  }
  
  // 새 에러 엔트리 생성
  const logEntry: ErrorLogEntry = {
    error,
    count: 1,
    lastOccurred: Date.now()
  };
  
  // 에러 로그에 추가
  errorLog.push(logEntry);
  errorSignatures.set(signature, logEntry);
  
  // 로그 크기 제한
  if (errorLog.length > currentErrorConfig.maxLogEntries) {
    const removedEntry = errorLog.shift();
    if (removedEntry) {
      const removedSignature = createErrorSignature(removedEntry.error);
      errorSignatures.delete(removedSignature);
    }
  }
  
  // 로그 레벨에 따른 출력
  switch (currentErrorConfig.logLevel) {
    case ErrorLogLevel.DEBUG:
      console.debug('[Context-Action] Debug:', error);
      break;
    case ErrorLogLevel.INFO:
      console.info('[Context-Action] Info:', error);
      break;
    case ErrorLogLevel.WARN:
      console.warn('[Context-Action] Warning:', error);
      break;
    case ErrorLogLevel.ERROR:
      console.error('[Context-Action] Error:', error);
      if (currentErrorConfig.enableStackTrace && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      break;
    case ErrorLogLevel.SILENT:
      // 무음 모드
      break;
  }
}

/**
 * 비동기 작업의 안전한 실행 래퍼 (통합된 에러 바운더리 사용)
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorType: ContextActionErrorType,
  context?: Record<string, unknown>
): Promise<T | null> {
  const boundaryContext: BoundaryErrorContext = {
    operation: errorType,
    store: (context?.storeName || context?.store) as string,
    component: (context?.componentName || context?.component) as string,
    action: (context?.actionName || context?.action) as string,
    metadata: { ...context, errorType }
  };
  
  const result = await ErrorHandlerUtils.safeExecuteAsync(
    operation,
    boundaryContext,
    null
  );
  
  return result as T | null;
}

/**
 * 동기 작업의 안전한 실행 래퍼 (통합된 에러 바운더리 사용)
 */
export function safeSync<T>(
  operation: () => T,
  errorType: ContextActionErrorType,
  context?: Record<string, unknown>
): T | null {
  const boundaryContext: BoundaryErrorContext = {
    operation: errorType,
    store: (context?.storeName || context?.store) as string,
    component: (context?.componentName || context?.component) as string,
    action: (context?.actionName || context?.action) as string,
    metadata: { ...context, errorType }
  };
  
  const result = ErrorHandlerUtils.safeExecute(
    operation,
    boundaryContext,
    null
  );
  
  return result as T | null;
}

/**
 * 특정 에러 타입에 대한 전용 핸들러들
 */
export const ErrorHandlers = {
  /**
   * Store 관련 에러 처리
   */
  store: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.STORE_ERROR, message, context, originalError),
  
  /**
   * Action 관련 에러 처리
   */
  action: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.ACTION_ERROR, message, context, originalError),
  
  /**
   * Ref 관련 에러 처리
   */
  ref: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.REF_ERROR, message, context, originalError),
  
  /**
   * 검증 관련 에러 처리
   */
  validation: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.VALIDATION_ERROR, message, context, originalError),
  
  /**
   * 초기화 관련 에러 처리
   */
  initialization: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.INITIALIZATION_ERROR, message, context, originalError),
  
  /**
   * 타임아웃 관련 에러 처리
   */
  timeout: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.TIMEOUT_ERROR, message, context, originalError),
  
  /**
   * 순환 참조 관련 에러 처리
   */
  circularReference: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.CIRCULAR_REFERENCE_ERROR, message, context, originalError)
} as const;

/**
 * 에러 로그 통계 정보
 */
export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Record<ContextActionErrorType, number>;
  mostFrequentErrors: Array<{
    signature: string;
    count: number;
    lastOccurred: number;
  }>;
  recentErrors: ContextActionError[];
}

/**
 * 에러 통계 가져오기
 */
export function getErrorStatistics(): ErrorStatistics {
  const errorsByType = Object.values(ContextActionErrorType).reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as Record<ContextActionErrorType, number>);
  
  // 타입별 에러 카운트
  errorLog.forEach(entry => {
    errorsByType[entry.error.type] += entry.count;
  });
  
  // 가장 빈번한 에러들
  const mostFrequentErrors = Array.from(errorSignatures.entries())
    .map(([signature, entry]) => ({
      signature,
      count: entry.count,
      lastOccurred: entry.lastOccurred
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // 최근 에러들 (최근 10개)
  const recentErrors = errorLog
    .slice(-10)
    .map(entry => entry.error);
  
  return {
    totalErrors: errorLog.reduce((sum, entry) => sum + entry.count, 0),
    errorsByType,
    mostFrequentErrors,
    recentErrors
  };
}

/**
 * 에러 로그 초기화
 */
export function clearErrorLog(): void {
  errorLog = [];
  errorSignatures.clear();
}

/**
 * 특정 조건에 따른 에러 필터링
 */
export function getFilteredErrors(
  filter: {
    type?: ContextActionErrorType;
    since?: number;
    limit?: number;
  } = {}
): ErrorLogEntry[] {
  let filtered = [...errorLog];
  
  // 타입 필터
  if (filter.type) {
    filtered = filtered.filter(entry => entry.error.type === filter.type);
  }
  
  // 시간 필터
  if (filter.since !== undefined) {
    filtered = filtered.filter(entry => entry.lastOccurred >= filter.since!);
  }
  
  // 제한
  if (filter.limit) {
    filtered = filtered.slice(-filter.limit);
  }
  
  return filtered;
}