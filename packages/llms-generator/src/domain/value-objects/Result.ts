/**
 * Result Pattern Implementation
 * 
 * 에러 처리를 명시적이고 타입 안전하게 만들기 위한 Result 패턴
 * 예외 대신 성공/실패를 값으로 표현
 */

/**
 * 기본 에러 인터페이스
 */
export interface DomainError {
  readonly message: string;
  readonly code: string;
  readonly details?: Record<string, unknown>;
}

/**
 * 결과를 나타내는 추상 클래스
 */
export abstract class Result<T, E extends DomainError = DomainError> {
  protected constructor(
    protected readonly _isSuccess: boolean,
    protected readonly _value?: T,
    protected readonly _error?: E
  ) {}

  /**
   * 성공 결과 생성
   */
  static success<T>(value: T): Success<T> {
    return new Success(value);
  }

  /**
   * 실패 결과 생성
   */
  static failure<T, E extends DomainError>(error: E): Failure<T, E> {
    return new Failure(error);
  }

  /**
   * 성공 여부 확인
   */
  get isSuccess(): boolean {
    return this._isSuccess;
  }

  /**
   * 실패 여부 확인
   */
  get isFailure(): boolean {
    return !this._isSuccess;
  }

  /**
   * 값 접근 (성공 시에만)
   */
  abstract get value(): T;

  /**
   * 에러 접근 (실패 시에만)
   */
  abstract get error(): E;

  /**
   * 결과에 함수 적용 (성공 시에만)
   */
  abstract map<U>(fn: (value: T) => U): Result<U, E>;

  /**
   * 결과를 다른 Result로 변환 (성공 시에만)
   */
  abstract flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E>;

  /**
   * 에러 변환 (실패 시에만)
   */
  abstract mapError<F extends DomainError>(fn: (error: E) => F): Result<T, F>;

  /**
   * 값이나 기본값 반환
   */
  abstract getOrElse(defaultValue: T): T;

  /**
   * 성공 시 함수 실행 (사이드 이펙트용)
   */
  abstract ifSuccess(fn: (value: T) => void): Result<T, E>;

  /**
   * 실패 시 함수 실행 (사이드 이펙트용)
   */
  abstract ifFailure(fn: (error: E) => void): Result<T, E>;

  /**
   * 결과를 Promise로 변환
   */
  abstract toPromise(): Promise<T>;
}

/**
 * 성공 결과
 */
export class Success<T> extends Result<T, never> {
  constructor(value: T) {
    super(true, value);
  }

  get value(): T {
    return this._value!;
  }

  get error(): never {
    throw new Error('Cannot access error of successful result');
  }

  map<U>(fn: (value: T) => U): Result<U, never> {
    return Result.success(fn(this._value!));
  }

  flatMap<U, E extends DomainError>(fn: (value: T) => Result<U, E>): Result<U, E> {
    try {
      return fn(this._value!);
    } catch (error) {
      return Result.failure({
        message: error instanceof Error ? error.message : 'Unknown error in flatMap function',
        code: 'FLATMAP_ERROR'
      } as E);
    }
  }

  mapError<F extends DomainError>(_fn: (error: never) => F): Result<T, F> {
    return this as any;
  }

  getOrElse(_defaultValue: T): T {
    return this._value!;
  }

  ifSuccess(fn: (value: T) => void): Result<T, never> {
    fn(this._value!);
    return this;
  }

  ifFailure(_fn: (error: never) => void): Result<T, never> {
    return this;
  }

  async toPromise(): Promise<T> {
    return this._value!;
  }
}

/**
 * 실패 결과
 */
export class Failure<T, E extends DomainError> extends Result<T, E> {
  constructor(error: E) {
    super(false, undefined, error);
  }

  get value(): T {
    throw new Error(`Cannot access value of failed result: ${this._error!.message}`);
  }

  get error(): E {
    return this._error!;
  }

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return this as any;
  }

  flatMap<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return this as any;
  }

  mapError<F extends DomainError>(fn: (error: E) => F): Result<T, F> {
    return Result.failure(fn(this._error!));
  }

  getOrElse(defaultValue: T): T {
    return defaultValue;
  }

  ifSuccess(_fn: (value: T) => void): Result<T, E> {
    return this;
  }

  ifFailure(fn: (error: E) => void): Result<T, E> {
    fn(this._error!);
    return this;
  }

  async toPromise(): Promise<T> {
    throw new Error(this._error!.message);
  }
}

/**
 * 도메인별 에러 타입들
 */

export interface ValidationError extends DomainError {
  code: 'VALIDATION_ERROR';
  field?: string;
}

export interface RepositoryError extends DomainError {
  code: 'REPOSITORY_ERROR';
  operation?: string;
}

export interface BusinessRuleError extends DomainError {
  code: 'BUSINESS_RULE_ERROR';
  rule?: string;
}

export interface ConfigurationError extends DomainError {
  code: 'CONFIGURATION_ERROR';
  setting?: string;
}

/**
 * 에러 생성 헬퍼 함수들
 */
export const Errors = {
  validation: (message: string, field?: string): ValidationError => ({
    message,
    code: 'VALIDATION_ERROR',
    field
  }),

  repository: (message: string, operation?: string): RepositoryError => ({
    message,
    code: 'REPOSITORY_ERROR',
    operation
  }),

  businessRule: (message: string, rule?: string): BusinessRuleError => ({
    message,
    code: 'BUSINESS_RULE_ERROR',
    rule
  }),

  configuration: (message: string, setting?: string): ConfigurationError => ({
    message,
    code: 'CONFIGURATION_ERROR',
    setting
  })
};

/**
 * 여러 Result를 조합하는 유틸리티 함수들
 */
export class ResultUtils {
  /**
   * 모든 Result가 성공이면 값들의 배열을 반환
   */
  static combine<T, E extends DomainError>(
    results: Result<T, E>[]
  ): Result<T[], E> {
    const values: T[] = [];
    
    for (const result of results) {
      if (result.isFailure) {
        return result as any;
      }
      values.push(result.value);
    }
    
    return Result.success(values);
  }

  /**
   * 첫 번째 성공하는 Result 반환
   */
  static firstSuccess<T, E extends DomainError>(
    results: Result<T, E>[]
  ): Result<T, E> {
    for (const result of results) {
      if (result.isSuccess) {
        return result;
      }
    }
    
    return results[results.length - 1] || Result.failure(
      Errors.validation('No results provided') as E
    );
  }

  /**
   * 모든 Result가 성공이면 마지막 값 반환
   */
  static sequence<T, E extends DomainError>(
    results: Result<T, E>[]
  ): Result<T, E> {
    let lastValue: T | undefined;
    
    for (const result of results) {
      if (result.isFailure) {
        return result;
      }
      lastValue = result.value;
    }
    
    if (lastValue === undefined) {
      return Result.failure(Errors.validation('No results provided') as E);
    }
    
    return Result.success(lastValue);
  }
}

/**
 * 편의 함수들
 */

/**
 * try-catch를 Result로 래핑
 */
export function tryResult<T>(fn: () => T): Result<T, DomainError> {
  try {
    return Result.success(fn());
  } catch (error) {
    return Result.failure({
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'RUNTIME_ERROR'
    });
  }
}

/**
 * async 함수를 Result로 래핑
 */
export async function tryAsyncResult<T>(fn: () => Promise<T>): Promise<Result<T, DomainError>> {
  try {
    const value = await fn();
    return Result.success(value);
  } catch (error) {
    return Result.failure({
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'ASYNC_ERROR'
    });
  }
}