/**
 * @fileoverview Store value comparison utilities
 * 향상된 값 비교 시스템으로 불필요한 리렌더링 방지
 */

import { createLogger } from '@context-action/logger';

const logger = createLogger();

/**
 * 비교 전략 타입
 */
export type ComparisonStrategy = 'reference' | 'shallow' | 'deep' | 'custom';

/**
 * 커스텀 비교 함수 타입
 */
export type CustomComparator<T = any> = (oldValue: T, newValue: T) => boolean;

/**
 * 비교 옵션 인터페이스
 */
export interface ComparisonOptions<T = any> {
  strategy: ComparisonStrategy;
  customComparator?: CustomComparator<T>;
  maxDepth?: number;
  ignoreKeys?: string[];
  enableCircularCheck?: boolean;
}

/**
 * 기본 비교 옵션
 */
const DEFAULT_COMPARISON_OPTIONS: ComparisonOptions = {
  strategy: 'reference',
  maxDepth: 5,
  enableCircularCheck: true,
};

/**
 * 전역 비교 옵션
 */
let globalComparisonOptions: ComparisonOptions = { ...DEFAULT_COMPARISON_OPTIONS };

/**
 * 전역 비교 옵션 설정
 */
export function setGlobalComparisonOptions(options: Partial<ComparisonOptions>): void {
  globalComparisonOptions = { ...DEFAULT_COMPARISON_OPTIONS, ...options };
  logger.debug('Global comparison options updated', globalComparisonOptions);
}

/**
 * 전역 비교 옵션 조회
 */
export function getGlobalComparisonOptions(): ComparisonOptions {
  return { ...globalComparisonOptions };
}

/**
 * 참조 동등성 비교 (Object.is 기반)
 */
export function referenceEquals<T>(oldValue: T, newValue: T): boolean {
  const result = Object.is(oldValue, newValue);
  logger.trace('Reference comparison', { 
    oldValue, 
    newValue, 
    result,
    oldType: typeof oldValue,
    newType: typeof newValue
  });
  return result;
}

/**
 * 얕은 비교 (1레벨 프로퍼티만 비교)
 */
export function shallowEquals<T>(oldValue: T, newValue: T, ignoreKeys: string[] = []): boolean {
  // 참조가 같으면 즉시 true
  if (Object.is(oldValue, newValue)) {
    logger.trace('Shallow comparison: reference equal');
    return true;
  }

  // null/undefined 처리
  if (oldValue == null || newValue == null) {
    const result = oldValue === newValue;
    logger.trace('Shallow comparison: null/undefined', { oldValue, newValue, result });
    return result;
  }

  // 원시 타입 처리
  if (typeof oldValue !== 'object' || typeof newValue !== 'object') {
    const result = oldValue === newValue;
    logger.trace('Shallow comparison: primitive types', { oldValue, newValue, result });
    return result;
  }

  // 배열 처리
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (oldValue.length !== newValue.length) {
      logger.trace('Shallow comparison: array length different');
      return false;
    }
    
    for (let i = 0; i < oldValue.length; i++) {
      if (!Object.is(oldValue[i], newValue[i])) {
        logger.trace('Shallow comparison: array element different at index', i);
        return false;
      }
    }
    
    logger.trace('Shallow comparison: arrays equal');
    return true;
  }

  // 객체 처리
  const oldKeys = Object.keys(oldValue as any).filter(key => !ignoreKeys.includes(key));
  const newKeys = Object.keys(newValue as any).filter(key => !ignoreKeys.includes(key));

  if (oldKeys.length !== newKeys.length) {
    logger.trace('Shallow comparison: object key count different');
    return false;
  }

  for (const key of oldKeys) {
    if (!newKeys.includes(key)) {
      logger.trace('Shallow comparison: missing key', key);
      return false;
    }
    
    if (!Object.is((oldValue as any)[key], (newValue as any)[key])) {
      logger.trace('Shallow comparison: property different', { key, oldValue: (oldValue as any)[key], newValue: (newValue as any)[key] });
      return false;
    }
  }

  logger.trace('Shallow comparison: objects equal');
  return true;
}

/**
 * 깊은 비교 (모든 중첩된 프로퍼티 비교)
 */
export function deepEquals<T>(
  oldValue: T, 
  newValue: T, 
  options: {
    maxDepth?: number;
    ignoreKeys?: string[];
    enableCircularCheck?: boolean;
  } = {}
): boolean {
  const { maxDepth = 5, ignoreKeys = [], enableCircularCheck = true } = options;
  
  // 순환 참조 감지를 위한 WeakSet
  const visited = enableCircularCheck ? new WeakSet() : null;
  
  function deepCompare(a: any, b: any, depth: number): boolean {
    // 최대 깊이 초과 시 참조 비교로 fallback
    if (depth > maxDepth) {
      logger.trace('Deep comparison: max depth exceeded, falling back to reference');
      return Object.is(a, b);
    }

    // 참조가 같으면 즉시 true
    if (Object.is(a, b)) {
      return true;
    }

    // null/undefined 처리
    if (a == null || b == null) {
      return a === b;
    }

    // 타입이 다르면 false
    if (typeof a !== typeof b) {
      return false;
    }

    // 원시 타입 처리
    if (typeof a !== 'object') {
      return a === b;
    }

    // 순환 참조 체크
    if (visited) {
      if (visited.has(a) || visited.has(b)) {
        logger.trace('Deep comparison: circular reference detected');
        return Object.is(a, b);
      }
      visited.add(a);
      visited.add(b);
    }

    // Date 객체 처리
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // RegExp 객체 처리
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString();
    }

    // 배열 처리
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      
      for (let i = 0; i < a.length; i++) {
        if (!deepCompare(a[i], b[i], depth + 1)) {
          return false;
        }
      }
      
      return true;
    }

    // 배열과 객체 타입 불일치
    if (Array.isArray(a) || Array.isArray(b)) {
      return false;
    }

    // 객체 처리
    const aKeys = Object.keys(a).filter(key => !ignoreKeys.includes(key));
    const bKeys = Object.keys(b).filter(key => !ignoreKeys.includes(key));

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    for (const key of aKeys) {
      if (!bKeys.includes(key)) {
        return false;
      }
      
      if (!deepCompare(a[key], b[key], depth + 1)) {
        return false;
      }
    }

    return true;
  }

  const result = deepCompare(oldValue, newValue, 0);
  logger.trace('Deep comparison result', { 
    oldValue, 
    newValue, 
    result,
    maxDepth,
    ignoreKeys
  });
  
  return result;
}

/**
 * 전략별 값 비교 함수
 * HMR 최적화 기술 적용: 크기 기반 최적 전략 자동 선택
 */
export function compareValues<T>(
  oldValue: T, 
  newValue: T, 
  options: Partial<ComparisonOptions<T>> = {}
): boolean {
  const finalOptions = { ...globalComparisonOptions, ...options };
  const { strategy, customComparator, maxDepth, ignoreKeys, enableCircularCheck } = finalOptions;

  const startTime = performance.now();

  let result: boolean;
  let actualStrategy = strategy;

  try {
    // HMR 최적화: 자동 전략 선택 (strategy가 'reference'가 아닌 경우)
    if (strategy !== 'reference' && strategy !== 'custom' && typeof oldValue === 'object' && typeof newValue === 'object') {
      // JSON 직렬화 시도로 크기와 복잡도 판단
      try {
        const oldStr = JSON.stringify(oldValue);
        const newStr = JSON.stringify(newValue);
        
        // 작은 객체 (1KB 미만): JSON 문자열 비교가 가장 빠름
        if (oldStr.length < 1000 && newStr.length < 1000) {
          result = oldStr === newStr;
          actualStrategy = 'json-fast';
          
          logger.trace('JSON fast comparison used', { 
            oldSize: oldStr.length, 
            newSize: newStr.length 
          });
          
          const duration = performance.now() - startTime;
          logger.debug('Value comparison completed', {
            strategy: actualStrategy,
            result,
            duration: `${duration.toFixed(3)}ms`,
            oldValueType: typeof oldValue,
            newValueType: typeof newValue
          });
          
          return result;
        }
      } catch (error) {
        // JSON 직렬화 실패 시 원래 전략 사용
      }
    }

    // 원래 전략 실행
    switch (strategy) {
      case 'reference':
        result = referenceEquals(oldValue, newValue);
        break;
        
      case 'shallow':
        result = shallowEquals(oldValue, newValue, ignoreKeys);
        break;
        
      case 'deep':
        result = deepEquals(oldValue, newValue, { 
          maxDepth, 
          ignoreKeys, 
          enableCircularCheck 
        });
        break;
        
      case 'custom':
        if (!customComparator) {
          logger.warn('Custom comparator not provided, falling back to reference comparison');
          result = referenceEquals(oldValue, newValue);
        } else {
          result = customComparator(oldValue, newValue);
        }
        break;
        
      default:
        logger.warn(`Unknown comparison strategy: ${strategy}, falling back to reference comparison`);
        result = referenceEquals(oldValue, newValue);
    }
  } catch (error) {
    logger.error('Error during value comparison, falling back to reference comparison', error);
    result = referenceEquals(oldValue, newValue);
  }

  const duration = performance.now() - startTime;

  logger.debug('Value comparison completed', {
    strategy: actualStrategy,
    result,
    duration: `${duration.toFixed(3)}ms`,
    hasCustomComparator: !!customComparator,
    oldValueType: typeof oldValue,
    newValueType: typeof newValue
  });

  return result;
}

/**
 * 성능 최적화된 빠른 비교 함수
 * 간단한 케이스들을 빠르게 처리하고, 복잡한 경우만 전체 비교로 넘김
 * HMR 최적화 기술 적용: JSON 직렬화 기반 빠른 비교
 */
export function fastCompare<T>(oldValue: T, newValue: T): boolean {
  // 1. 참조 동등성 체크 (가장 빠름)
  if (Object.is(oldValue, newValue)) {
    return true;
  }

  // 2. null/undefined 처리
  if (oldValue == null || newValue == null) {
    return oldValue === newValue;
  }

  // 3. 원시 타입 처리
  if (typeof oldValue !== 'object' || typeof newValue !== 'object') {
    return oldValue === newValue;
  }

  // 4. JSON 직렬화 가능한 객체 - 빠른 문자열 비교 (HMR 기술 적용)
  try {
    const oldStr = JSON.stringify(oldValue);
    const newStr = JSON.stringify(newValue);
    
    // 작은 객체의 경우 JSON 문자열 비교가 가장 빠르고 정확
    if (oldStr.length <= 1000 && newStr.length <= 1000) { // 1KB 이하
      return oldStr === newStr;
    }
  } catch (error) {
    // JSON 직렬화 실패 시 기존 로직으로 fallback
  }

  // 5. 간단한 배열의 경우 얕은 비교
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (oldValue.length !== newValue.length) {
      return false;
    }
    if (oldValue.length <= 10) { // 작은 배열은 얕은 비교
      return oldValue.every((item, index) => Object.is(item, newValue[index]));
    }
  }

  // 6. 작은 객체의 경우 얕은 비교
  const oldKeys = Object.keys(oldValue as any);
  if (oldKeys.length <= 5) { // 프로퍼티가 5개 이하인 작은 객체
    const newKeys = Object.keys(newValue as any);
    if (oldKeys.length === newKeys.length) {
      return oldKeys.every(key => 
        newKeys.includes(key) && 
        Object.is((oldValue as any)[key], (newValue as any)[key])
      );
    }
  }

  // 7. 복잡한 경우는 전역 설정에 따른 비교로 위임
  return compareValues(oldValue, newValue);
}

/**
 * 특정 Store를 위한 커스텀 비교 함수 생성기
 */
export function createStoreComparator<T>(
  options: Partial<ComparisonOptions<T>> = {}
): (oldValue: T, newValue: T) => boolean {
  const finalOptions = { ...globalComparisonOptions, ...options };
  
  return (oldValue: T, newValue: T) => {
    return compareValues(oldValue, newValue, finalOptions);
  };
}

/**
 * 성능 모니터링을 위한 비교 메트릭
 */
export interface ComparisonMetrics {
  strategy: ComparisonStrategy;
  duration: number;
  result: boolean;
  complexity: 'simple' | 'medium' | 'complex';
  timestamp: number;
}

/**
 * 비교 성능 모니터링 함수
 */
export function measureComparison<T>(
  oldValue: T,
  newValue: T,
  options: Partial<ComparisonOptions<T>> = {}
): ComparisonMetrics {
  const startTime = performance.now();
  const result = compareValues(oldValue, newValue, options);
  const duration = performance.now() - startTime;
  
  // 복잡도 판단
  let complexity: 'simple' | 'medium' | 'complex' = 'simple';
  if (typeof oldValue === 'object' && oldValue !== null) {
    const size = JSON.stringify(oldValue).length;
    if (size > 1000) complexity = 'complex';
    else if (size > 100) complexity = 'medium';
  }

  const metrics: ComparisonMetrics = {
    strategy: options.strategy || globalComparisonOptions.strategy,
    duration,
    result,
    complexity,
    timestamp: Date.now()
  };

  logger.trace('Comparison metrics', metrics);
  return metrics;
}