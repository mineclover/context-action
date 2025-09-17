

export type ComparisonStrategy = 'reference' | 'shallow' | 'deep' | 'custom';

export type CustomComparator<T = unknown> = (oldValue: T, newValue: T) => boolean;

export interface ComparisonOptions<T = unknown> {
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
  const oldKeys = Object.keys(oldValue as Record<string, unknown>).filter(key => !ignoreKeys.includes(key));
  const newKeys = Object.keys(newValue as Record<string, unknown>).filter(key => !ignoreKeys.includes(key));

  if (oldKeys.length !== newKeys.length) {
    return false;
  }

  for (const key of oldKeys) {
    if (!newKeys.includes(key)) {
      return false;
    }
    
    if (!Object.is((oldValue as Record<string, unknown>)[key], (newValue as Record<string, unknown>)[key])) {
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
  
  // 개선된 순환 참조 감지 시스템
  const visitedPairs = enableCircularCheck ? new WeakMap<object, WeakSet<object>>() : null;
  
  function deepCompare(a: unknown, b: unknown, depth: number, path = ''): boolean {
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

    // 개선된 순환 참조 체크
    if (visitedPairs && typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      // 비교 쌍의 순환 참조 확인
      if (visitedPairs.has(a)) {
        const pairedSet = visitedPairs.get(a)!;
        if (pairedSet.has(b)) {
          return Object.is(a, b);
        }
      }
      
      // 방문 기록 추가
      if (!visitedPairs.has(a)) {
        visitedPairs.set(a, new WeakSet());
      }
      visitedPairs.get(a)!.add(b);
      
      // 반대 방향도 기록 (대칭적 추적)
      if (!visitedPairs.has(b)) {
        visitedPairs.set(b, new WeakSet());
      }
      visitedPairs.get(b)!.add(a);
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
        if (!deepCompare(a[i], b[i], depth + 1, `${path}[${i}]`)) {
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
    const aKeys = Object.keys(a as Record<string, unknown>).filter(key => !ignoreKeys.includes(key));
    const bKeys = Object.keys(b as Record<string, unknown>).filter(key => !ignoreKeys.includes(key));

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    for (const key of aKeys) {
      if (!bKeys.includes(key)) {
        return false;
      }
      
      if (!deepCompare((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], depth + 1, `${path}.${key}`)) {
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
        
      case 'deep': {
        const deepOptions = {
          ...(maxDepth !== undefined && { maxDepth }),
          ...(ignoreKeys !== undefined && { ignoreKeys }),
          ...(enableCircularCheck !== undefined && { enableCircularCheck })
        };
        result = deepEquals(oldValue, newValue, deepOptions);
        break;
      }
        
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



