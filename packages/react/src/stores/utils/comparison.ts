

export type ComparisonStrategy = 'reference' | 'shallow' | 'deep' | 'custom';

export type CustomComparator<T = any> = (oldValue: T, newValue: T) => boolean;

export interface ComparisonOptions<T = any> {
  strategy: ComparisonStrategy;
  customComparator?: CustomComparator<T>;
  maxDepth?: number;
  ignoreKeys?: string[];
  enableCircularCheck?: boolean;
}

const DEFAULT_COMPARISON_OPTIONS: ComparisonOptions = {
  strategy: 'reference',
  maxDepth: 5,
  enableCircularCheck: true,
};

let globalComparisonOptions: ComparisonOptions = { ...DEFAULT_COMPARISON_OPTIONS };

export function setGlobalComparisonOptions(options: Partial<ComparisonOptions>): void {
  globalComparisonOptions = { ...DEFAULT_COMPARISON_OPTIONS, ...options };
}

export function getGlobalComparisonOptions(): ComparisonOptions {
  return { ...globalComparisonOptions };
}

export function referenceEquals<T>(oldValue: T, newValue: T): boolean {
  const result = Object.is(oldValue, newValue);
  return result;
}

export function shallowEquals<T>(oldValue: T, newValue: T, ignoreKeys: string[] = []): boolean {
  // 참조가 같으면 즉시 true
  if (Object.is(oldValue, newValue)) {
    return true;
  }

  // null/undefined 처리
  if (oldValue == null || newValue == null) {
    const result = oldValue === newValue;
    return result;
  }

  // 원시 타입 처리
  if (typeof oldValue !== 'object' || typeof newValue !== 'object') {
    const result = oldValue === newValue;
    return result;
  }

  // 배열 처리
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (oldValue.length !== newValue.length) {
      return false;
    }
    
    for (let i = 0; i < oldValue.length; i++) {
      if (!Object.is(oldValue[i], newValue[i])) {
        return false;
      }
    }
    
    return true;
  }

  // 객체 처리
  const oldKeys = Object.keys(oldValue as any).filter(key => !ignoreKeys.includes(key));
  const newKeys = Object.keys(newValue as any).filter(key => !ignoreKeys.includes(key));

  if (oldKeys.length !== newKeys.length) {
    return false;
  }

  for (const key of oldKeys) {
    if (!newKeys.includes(key)) {
      return false;
    }
    
    if (!Object.is((oldValue as any)[key], (newValue as any)[key])) {
      return false;
    }
  }

  return true;
}

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
  
  return result;
}

export function compareValues<T>(
  oldValue: T, 
  newValue: T, 
  options: Partial<ComparisonOptions<T>> = {}
): boolean {
  const finalOptions = { ...globalComparisonOptions, ...options };
  const { strategy, customComparator, maxDepth, ignoreKeys, enableCircularCheck } = finalOptions;

  let result: boolean;

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
          return result;
        }
      } catch (error) {
        // JSON 직렬화 실패 시 (순환 참조, BigInt, Symbol, Function 등)
        // 디버그 모드에서만 로깅하여 성능 영향 최소화
        if (process.env.NODE_ENV === 'development') {
          console.debug('[ComparisonOptimization] JSON serialization failed, falling back to original strategy:', error);
        }
        // 원래 전략으로 계속 진행 (fallthrough)
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
          result = referenceEquals(oldValue, newValue);
        } else {
          result = customComparator(oldValue, newValue);
        }
        break;
        
      default:
        result = referenceEquals(oldValue, newValue);
    }
  } catch (error) {
    // 비교 중 예상치 못한 오류 발생 시 안전한 참조 비교로 fallback
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CompareValues] Comparison failed, falling back to reference equality:', error);
    }
    result = referenceEquals(oldValue, newValue);
  }

  return result;
}

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
    // 순환 참조, BigInt, Symbol, Function 등이 포함된 경우
    if (process.env.NODE_ENV === 'development') {
      console.debug('[FastCompare] JSON serialization failed, using fallback comparison:', error);
    }
    // 계속해서 다음 비교 로직으로 진행
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

export function createStoreComparator<T>(
  options: Partial<ComparisonOptions<T>> = {}
): (oldValue: T, newValue: T) => boolean {
  const finalOptions = { ...globalComparisonOptions, ...options };
  
  return (oldValue: T, newValue: T) => {
    return compareValues(oldValue, newValue, finalOptions);
  };
}

export interface ComparisonMetrics {
  strategy: ComparisonStrategy;
  duration: number;
  result: boolean;
  complexity: 'simple' | 'medium' | 'complex';
  timestamp: number;
}

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

  return metrics;
}