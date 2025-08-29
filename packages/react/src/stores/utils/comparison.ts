

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
        
      case 'deep':
        const deepOptions = {
          ...(maxDepth !== undefined && { maxDepth }),
          ...(ignoreKeys !== undefined && { ignoreKeys }),
          ...(enableCircularCheck !== undefined && { enableCircularCheck })
        };
        result = deepEquals(oldValue, newValue, deepOptions);
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

  // 4. HTML/DOM Elements 특별 처리 - RefContext용
  if (typeof oldValue === 'object' && oldValue !== null) {
    const isDOMElement = (
      (typeof Element !== 'undefined' && oldValue instanceof Element) ||
      (typeof Node !== 'undefined' && oldValue instanceof Node) ||
      (typeof HTMLElement !== 'undefined' && oldValue instanceof HTMLElement) ||
      (oldValue as any).nodeType !== undefined ||
      (oldValue as any)._owner !== undefined ||
      (oldValue as any).stateNode !== undefined
    );
    
    if (isDOMElement) {
      // DOM 요소는 참조 비교만 사용 (JSON 직렬화 시도하지 않음)
      return Object.is(oldValue, newValue);
    }
  }

  // 6. JSON serializable objects - fast string comparison (HMR technique)
  try {
    const oldStr = JSON.stringify(oldValue);
    const newStr = JSON.stringify(newValue);
    
    // 작은 객체의 경우 JSON 문자열 비교가 가장 빠르고 정확
    if (oldStr.length <= 1000 && newStr.length <= 1000) { // 1KB 이하
      return oldStr === newStr;
    }
  } catch (error) {
    // JSON 직렬화 실패 시 참조 비교로 안전하게 fallback
    // 순환 참조, BigInt, Symbol, Function, DOM 요소 등이 포함된 경우
    const errorMessage = error?.toString() || '';
    if (
      errorMessage.includes('circular') ||
      errorMessage.includes('HTMLDivElement') ||
      errorMessage.includes('HTMLElement') ||
      errorMessage.includes('Converting circular structure')
    ) {
      // DOM 요소나 circular reference가 감지되면 참조 비교만 사용
      return Object.is(oldValue, newValue);
    }
    
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
  const oldKeys = Object.keys(oldValue as Record<string, unknown>);
  if (oldKeys.length <= 5) { // 프로퍼티가 5개 이하인 작은 객체
    const newKeys = Object.keys(newValue as Record<string, unknown>);
    if (oldKeys.length === newKeys.length) {
      return oldKeys.every(key => 
        newKeys.includes(key) && 
        Object.is((oldValue as Record<string, unknown>)[key], (newValue as Record<string, unknown>)[key])
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

// Enhanced security validation utilities

/**
 * Check if an object is a DOM element with comprehensive validation
 * 
 * @param value - Value to check
 * @returns true if value is a DOM element
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isDOMElement(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  // Check for standard DOM interfaces
  if (typeof Element !== 'undefined' && value instanceof Element) return true;
  if (typeof Node !== 'undefined' && value instanceof Node) return true;
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return true;
  
  // Check for DOM-like properties
  return (
    typeof obj.nodeType === 'number' ||
    typeof obj.nodeName === 'string' ||
    obj._owner !== undefined ||  // React fiber node
    obj.stateNode !== undefined  // React fiber node
  );
}

/**
 * Enhanced security validation for potentially unsafe objects
 * 
 * Detects objects that might contain malicious properties or patterns
 * that could lead to prototype pollution or XSS attacks.
 * 
 * @param value - Value to validate
 * @returns true if object is potentially unsafe
 */
function isUnsafeObject(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  // Check for prototype pollution attempts
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  if (dangerousKeys.some(key => Object.prototype.hasOwnProperty.call(obj, key))) {
    const protoValue = obj.__proto__;
    const constructorValue = obj.constructor;
    
    // Allow legitimate cases
    if (protoValue === Object.prototype || protoValue === Array.prototype) {
      // Standard object/array prototypes are safe
    } else if (constructorValue === Object || constructorValue === Array) {
      // Standard constructors are safe
    } else {
      return true; // Potentially unsafe modification
    }
  }
  
  // Check for suspicious patterns that might indicate XSS attempts
  const stringValues = Object.values(obj).filter((v): v is string => typeof v === 'string');
  const hasScriptTags = stringValues.some(str => 
    /<script[^>]*>|javascript:|data:text\/html|eval\(|Function\(/i.test(str)
  );
  
  if (hasScriptTags) {
    console.warn('Potentially unsafe string content detected in object comparison');
    return true;
  }
  
  // Check for excessive nesting that might indicate DoS attempts
  try {
    const serialized = JSON.stringify(obj);
    if (serialized.length > 100000) { // >100KB
      console.warn('Extremely large object detected in comparison');
      return true;
    }
  } catch {
    // Circular reference or other serialization issues
    // Not necessarily unsafe, but requires careful handling
  }
  
  return false;
}

/**
 * Sanitize value to prevent XSS and prototype pollution
 * 
 * @param value - Value to sanitize
 * @returns Sanitized value
 */
export function sanitizeValue<T>(value: T): T {
  if (typeof value === 'string') {
    // Basic HTML entity encoding for string values
    const sanitizedString = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    return sanitizedString as T;
  }
  
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  
  // For objects, create a clean copy without dangerous properties
  try {
    const sanitized = JSON.parse(JSON.stringify(value));
    
    // Remove dangerous properties recursively
    function cleanObject(obj: Record<string, unknown>): Record<string, unknown> {
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      const clean = { ...obj };
      
      dangerousKeys.forEach(key => {
        delete clean[key];
      });
      
      // Recursively clean nested objects
      Object.keys(clean).forEach(key => {
        if (typeof clean[key] === 'object' && clean[key] !== null) {
          clean[key] = cleanObject(clean[key] as Record<string, unknown>);
        }
      });
      
      return clean;
    }
    
    return cleanObject(sanitized as Record<string, unknown>) as T;
  } catch (error) {
    console.warn('Failed to sanitize value, returning original:', error);
    return value;
  }
}

/**
 * Validate value against security constraints
 * 
 * @param value - Value to validate
 * @param options - Security validation options
 * @returns true if value is safe, false otherwise
 */
export function validateSecurity<T>(value: T, options: SecurityOptions = {}): boolean {
  const {
    preventPrototypePollution = true,
    preventXSS = true,
    maxDepth = 10,
    maxStringLength = 10000
  } = options;
  
  if (typeof value !== 'object' || value === null) {
    // For primitive values, just check string length
    if (typeof value === 'string' && value.length > maxStringLength) {
      return false;
    }
    return true;
  }
  
  // Check object depth to prevent DoS
  let currentDepth = 0;
  function checkDepth(obj: unknown): boolean {
    if (currentDepth > maxDepth) return false;
    
    if (typeof obj === 'object' && obj !== null) {
      currentDepth++;
      
      if (Array.isArray(obj)) {
        return obj.every(item => checkDepth(item));
      } else {
        return Object.values(obj as Record<string, unknown>).every(val => checkDepth(val));
      }
    }
    
    return true;
  }
  
  if (!checkDepth(value)) {
    console.warn('Object depth exceeds security limit');
    return false;
  }
  
  // Check for prototype pollution
  if (preventPrototypePollution && isUnsafeObject(value)) {
    return false;
  }
  
  // Check for XSS patterns
  if (preventXSS) {
    const stringValues = JSON.stringify(value);
    if (/<script|javascript:|data:text\/html|eval\(|Function\(/i.test(stringValues)) {
      console.warn('Potentially unsafe content detected');
      return false;
    }
  }
  
  return true;
}

/**
 * Security options interface moved from types.ts for better organization
 */
export interface SecurityOptions {
  /** Enable prototype pollution detection */
  preventPrototypePollution?: boolean;
  /** Enable XSS prevention */
  preventXSS?: boolean;
  /** Maximum object depth allowed */
  maxDepth?: number;
  /** Maximum string length allowed */
  maxStringLength?: number;
  /** Allowed property names pattern */
  allowedProperties?: RegExp;
  /** Blocked property names pattern */
  blockedProperties?: RegExp;
}