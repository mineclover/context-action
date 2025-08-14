/**
 * Store 불변성 보장을 위한 유틸리티 함수들
 * 
 * 핵심 기능:
 * 1. 깊은 복사 (Deep Clone) - 중첩된 객체/배열의 완전한 복사본 생성
 * 2. 불변성 검증 - 복사본이 원본과 독립적인지 확인
 * 3. 성능 최적화 - primitive 값에 대한 불필요한 복사 방지
 * 
 * @implements store-immutability
 * @memberof core-concepts
 */

// Simple logger replacement
const logger = {
  warn: (message: string, ...args: any[]) => console.warn(`[Context-Action] ${message}`, ...args),
  trace: (message: string, ...args: any[]) => console.debug(`[Context-Action] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[Context-Action] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[Context-Action] ${message}`, ...args)
};

/**
 * 깊은 복사 함수 - structuredClone 기반 구현
 * 
 * 핵심 로직:
 * 1. Primitive 값은 그대로 반환 (복사 불필요)
 * 2. null/undefined는 그대로 반환
 * 3. 객체/배열은 structuredClone으로 깊은 복사
 * 4. Function, Symbol 등 복사 불가능한 타입은 에러 처리
 * 
 * @template T 복사할 값의 타입
 * @param value - 복사할 값
 * @returns 깊은 복사된 값
 * 
 * @example
 * ```typescript
 * // Primitive 값 - 복사 불필요
 * const num = deepClone(42);           // 42 (동일한 값)
 * const str = deepClone('hello');      // 'hello' (동일한 값)
 * 
 * // 객체 - 깊은 복사
 * const user = { id: '1', profile: { name: 'John' } };
 * const clonedUser = deepClone(user);
 * clonedUser.profile.name = 'Jane';    // 원본 user는 변경되지 않음
 * 
 * // 배열 - 깊은 복사
 * const items = [{ id: 1 }, { id: 2 }];
 * const clonedItems = deepClone(items);
 * clonedItems[0].id = 999;             // 원본 items는 변경되지 않음
 * ```
 */
export function deepClone<T>(value: T): T {
  // Primitive 값들은 이미 불변이므로 그대로 반환
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return value;
  }

  // Date 객체 특별 처리
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  // RegExp 객체 특별 처리
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T;
  }

  // Function은 복사 불가능하므로 경고 후 원본 반환
  if (typeof value === 'function') {
    logger.warn('Functions cannot be deep cloned, returning original reference');
    return value;
  }

  // Symbol은 복사 불가능하므로 경고 후 원본 반환
  if (typeof value === 'symbol') {
    logger.warn('Symbols cannot be deep cloned, returning original reference');
    return value;
  }

  try {
    // structuredClone을 사용한 깊은 복사
    // 이는 웹 표준 API로 모든 모던 브라우저와 Node.js 17+에서 지원
    const cloned = structuredClone(value);
    
    logger.trace('Deep clone successful', { 
      type: typeof value,
      isArray: Array.isArray(value),
      constructor: value?.constructor?.name 
    });
    
    return cloned;
  } catch (error) {
    // structuredClone 실패 시 폴백: JSON 기반 복사
    logger.warn('structuredClone failed, falling back to JSON clone', error);
    
    try {
      // JSON 기반 폴백 (함수, Symbol, undefined 등은 손실됨)
      const jsonCloned = JSON.parse(JSON.stringify(value));
      logger.warn('Used JSON fallback for deep clone - some data types may be lost');
      return jsonCloned;
    } catch (jsonError) {
      // JSON도 실패하면 원본 반환 (최후의 수단)
      logger.error('All cloning methods failed, returning original reference', jsonError);
      return value;
    }
  }
}

/**
 * 불변성 검증 함수 - 복사본이 원본과 독립적인지 확인
 * 
 * @param original - 원본 값
 * @param cloned - 복사된 값
 * @returns 불변성이 보장되면 true, 아니면 false
 */
export function verifyImmutability<T>(original: T, cloned: T): boolean {
  // Primitive 값은 항상 불변
  if (
    original === null ||
    original === undefined ||
    typeof original === 'string' ||
    typeof original === 'number' ||
    typeof original === 'boolean' ||
    typeof original === 'bigint'
  ) {
    return original === cloned;
  }

  // 객체나 배열의 경우 참조가 다른지 확인
  if (typeof original === 'object' && original !== null) {
    return original !== cloned; // 다른 참조여야 함
  }

  return false;
}

/**
 * 안전한 getter - 불변성을 보장하는 값 반환
 * 
 * @template T 값의 타입
 * @param value - 반환할 값
 * @param enableCloning - 복사 활성화 여부 (기본: true)
 * @returns 불변성이 보장된 값
 */
export function safeGet<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) {
    logger.trace('Cloning disabled, returning original reference');
    return value;
  }

  const cloned = deepClone(value);
  
  // 개발 모드에서 불변성 검증
  if (process.env.NODE_ENV === 'development') {
    const isImmutable = verifyImmutability(value, cloned);
    if (!isImmutable && typeof value === 'object' && value !== null) {
      logger.warn('Immutability verification failed - references are identical');
    }
  }

  return cloned;
}

/**
 * 안전한 setter - 입력값의 불변성을 보장하는 값 설정
 * 
 * @template T 값의 타입
 * @param value - 설정할 값
 * @param enableCloning - 복사 활성화 여부 (기본: true)
 * @returns 불변성이 보장된 값
 */
export function safeSet<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) {
    logger.trace('Cloning disabled for setter, returning original reference');
    return value;
  }

  return deepClone(value);
}

/**
 * 불변성 설정 옵션
 */
export interface ImmutabilityOptions {
  enableCloning?: boolean;      // 복사 활성화 여부 (기본: true)
  enableVerification?: boolean; // 개발 모드 검증 활성화 (기본: true)
  warnOnFallback?: boolean;     // 폴백 사용 시 경고 (기본: true)
  shallowCloneThreshold?: number; // 얕은 복사 임계값 (기본: 3 depth)
}

/**
 * 전역 불변성 설정
 */
let globalImmutabilityOptions: ImmutabilityOptions = {
  enableCloning: true,
  enableVerification: process.env.NODE_ENV === 'development',
  warnOnFallback: true,
  shallowCloneThreshold: 3
};

/**
 * 전역 불변성 옵션 설정
 * 
 * @param options - 불변성 옵션
 */
export function setGlobalImmutabilityOptions(options: Partial<ImmutabilityOptions>): void {
  globalImmutabilityOptions = { ...globalImmutabilityOptions, ...options };
  logger.debug('Global immutability options updated', globalImmutabilityOptions);
}

/**
 * 현재 전역 불변성 옵션 가져오기
 * 
 * @returns 현재 불변성 옵션
 */
export function getGlobalImmutabilityOptions(): ImmutabilityOptions {
  return { ...globalImmutabilityOptions };
}

// 사용하지 않는 함수들 제거됨 (calculateDepth, shallowClone)

/**
 * 성능 최적화된 복사 함수
 * 현재는 불변성 보장을 위해 항상 깊은 복사 사용
 * 
 * @template T 복사할 값의 타입
 * @param value - 복사할 값
 * @returns 복사된 값
 */
function optimizedClone<T>(value: T): T {
  // 불변성 보장을 위해 항상 깊은 복사 사용
  return deepClone(value);
}

/**
 * 성능 프로파일링 정보
 */
export interface PerformanceProfile {
  averageCloneTime: number;    // 평균 복사 시간 (ms)
  totalOperations: number;     // 총 작업 수
  recommendations: string[];   // 성능 개선 권장사항
}

let performanceData: { times: number[]; operations: number } = {
  times: [],
  operations: 0
};

/**
 * 성능 측정이 포함된 안전한 getter
 */
export function performantSafeGet<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) {
    return value;
  }

  const startTime = performance.now();
  const result = optimizedClone(value);
  const endTime = performance.now();
  
  const duration = endTime - startTime;
  performanceData.times.push(duration);
  performanceData.operations++;
  
  // 최근 100개 작업만 유지
  if (performanceData.times.length > 100) {
    performanceData.times.shift();
  }

  return result;
}

/**
 * 성능 프로파일 가져오기
 * 
 * @returns 성능 프로파일 정보
 */
export function getPerformanceProfile(): PerformanceProfile {
  const { times, operations } = performanceData;
  const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  
  const recommendations: string[] = [];
  
  // 성능 권장사항 생성
  if (averageTime > 5) {
    recommendations.push('복사 시간이 5ms를 초과합니다. 얕은 복사 임계값 조정을 고려하세요.');
  }
  
  if (operations > 100) {
    recommendations.push('많은 복사 작업이 감지되었습니다. 복사 빈도를 줄일 수 있는지 검토하세요.');
  }

  return {
    averageCloneTime: averageTime,
    totalOperations: operations,
    recommendations
  };
}