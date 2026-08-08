/**
 * Action Validation Errors
 *
 * Zod 스키마 기반 검증 실패 시 발생하는 에러 클래스들
 */

// ============================================
// Zod Error Compatible Types
// ============================================

/**
 * Zod Issue interface (loose typing for Zod 4 compatibility)
 */
export interface ZodIssueLike {
  message: string;
  path: readonly (string | number | symbol)[];
  code: string;
}

/**
 * Zod Error interface (loose typing for Zod 4 compatibility)
 * Accepts any object with these minimum required properties
 */
export interface ZodErrorLike {
  message: string;
  issues: readonly ZodIssueLike[];
  format?: () => unknown;
  flatten?: () => unknown;
}

/** Raised when dispatch result aggregation options cannot be processed. */
export class ActionResultProcessingError extends Error {
  override name = 'ActionResultProcessingError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ActionResultProcessingError.prototype);
  }
}

export function isActionResultProcessingError(
  error: unknown,
): error is ActionResultProcessingError {
  return error instanceof ActionResultProcessingError;
}

// ============================================
// Action Validation Error
// ============================================

/**
 * Action payload 검증 실패 에러
 *
 * dispatch 시 Zod 스키마 검증이 실패하면 발생합니다.
 * (validationMode가 'strict'일 때만 throw)
 *
 * @example
 * ```typescript
 * try {
 *   dispatch('updateUser', { id: '', name: 'John' });
 * } catch (error) {
 *   if (error instanceof ActionValidationError) {
 *     console.log('Action:', error.action);
 *     console.log('Issues:', error.issues);
 *     console.log('Formatted:', error.formattedErrors);
 *   }
 * }
 * ```
 */
export class ActionValidationError extends Error {
  /** 에러 이름 */
  override name = 'ActionValidationError';

  /** 원본 Zod 에러 객체 */
  public readonly zodError: unknown;

  /**
   * @param action - 검증 실패한 action 이름
   * @param zodError - Zod 검증 에러 객체 (ZodError compatible)
   */
  constructor(action: string, zodError: unknown) {
    const errorMessage =
      zodError && typeof zodError === 'object' && 'message' in zodError
        ? String((zodError as { message: unknown }).message)
        : 'Validation failed';

    const message = `Action "${action}" payload validation failed: ${errorMessage}`;
    super(message);

    this.action = action;
    this.zodError = zodError;

    // Error 상속 시 prototype chain 복원 (ES5 호환)
    Object.setPrototypeOf(this, ActionValidationError.prototype);
  }

  /** 검증 실패한 action 이름 */
  public readonly action: string;

  /**
   * Zod 검증 이슈 목록
   */
  get issues(): readonly ZodIssueLike[] {
    if (
      this.zodError &&
      typeof this.zodError === 'object' &&
      'issues' in this.zodError &&
      Array.isArray((this.zodError as { issues: unknown }).issues)
    ) {
      return (this.zodError as { issues: readonly ZodIssueLike[] }).issues;
    }
    return [];
  }

  /**
   * 포맷된 에러 객체 (필드별 에러 메시지)
   */
  get formattedErrors(): unknown {
    if (
      this.zodError &&
      typeof this.zodError === 'object' &&
      'format' in this.zodError &&
      typeof (this.zodError as { format: unknown }).format === 'function'
    ) {
      return (this.zodError as { format: () => unknown }).format();
    }
    return {};
  }

  /**
   * 플랫 에러 맵 (필드명 → 에러 메시지 배열)
   */
  get flattenedErrors(): unknown {
    if (
      this.zodError &&
      typeof this.zodError === 'object' &&
      'flatten' in this.zodError &&
      typeof (this.zodError as { flatten: unknown }).flatten === 'function'
    ) {
      return (this.zodError as { flatten: () => unknown }).flatten();
    }
    return { fieldErrors: {}, formErrors: [] };
  }

  /**
   * 첫 번째 에러 메시지
   */
  get firstError(): string | undefined {
    return this.issues[0]?.message;
  }

  /**
   * 에러 발생 필드 경로 목록
   */
  get errorPaths(): string[] {
    return this.issues.map((issue) =>
      issue.path.map((p) => String(p)).join('.')
    );
  }

  /**
   * JSON 직렬화
   */
  toJSON() {
    return {
      name: this.name,
      action: this.action,
      message: this.message,
      issues: this.issues,
    };
  }
}

/**
 * Raised when a dispatch exceeds its configured wall-clock timeout.
 * The underlying handler receives an aborted controller signal and the internal
 * queue keeps draining it safely, while the caller is released immediately with
 * this error.
 */
export class ActionTimeoutError extends Error {
  override name = 'ActionTimeoutError';

  constructor(
    public readonly action: string,
    public readonly timeout: number
  ) {
    super(`Action "${action}" timed out after ${timeout}ms`);
    Object.setPrototypeOf(this, ActionTimeoutError.prototype);
  }
}

/** Raised when work is submitted after an ActionRegister begins shutdown. */
export class ActionRegisterDestroyedError extends Error {
  override name = 'ActionRegisterDestroyedError';

  constructor(
    public readonly registerName: string,
    public readonly state: 'closing' | 'destroyed'
  ) {
    super(`ActionRegister "${registerName}" is ${state} and cannot accept new work`);
    Object.setPrototypeOf(this, ActionRegisterDestroyedError.prototype);
  }
}

// ============================================
// Type Guard
// ============================================

/**
 * ActionValidationError 타입 가드
 */
export function isActionValidationError(
  error: unknown
): error is ActionValidationError {
  return error instanceof ActionValidationError;
}

/** ActionTimeoutError type guard. */
export function isActionTimeoutError(
  error: unknown
): error is ActionTimeoutError {
  return error instanceof ActionTimeoutError;
}

/** ActionRegisterDestroyedError type guard. */
export function isActionRegisterDestroyedError(
  error: unknown
): error is ActionRegisterDestroyedError {
  return error instanceof ActionRegisterDestroyedError;
}
