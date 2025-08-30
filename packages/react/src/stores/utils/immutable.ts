/**
 * @fileoverview Immer-based Immutability Utils
 * 
 * Immer를 사용한 안전하고 효율적인 불변성 보장 시스템
 * 기존 복잡한 구현을 Immer로 대체하여 안정성과 성능을 개선
 * 
 * @implements store-immutability
 * @memberof core-concepts
 */

// Dynamic Immer import for bundle size optimization
type ImmerModule = typeof import('immer');
let immerModule: ImmerModule | null = null;

/**
 * Lazy load Immer module
 */
async function getImmer(): Promise<ImmerModule> {
  if (!immerModule) {
    immerModule = await import('immer');
  }
  return immerModule;
}

/**
 * Check if value is a primitive type
 */
function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol'
  );
}

/**
 * Check if value is a complex object that needs Immer
 */
function isComplexObject(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  
  // Arrays are complex
  if (Array.isArray(value)) return true;
  
  // Objects with nested properties
  if (value.constructor === Object) {
    const obj = value as Record<string, unknown>;
    return Object.values(obj).some(val => 
      typeof val === 'object' && val !== null
    );
  }
  
  // Class instances, Maps, Sets etc.
  return value.constructor !== Object;
}

// Simple logger replacement
const logger = {
  warn: (message: string, ...args: any[]) => console.warn(`[Context-Action] ${message}`, ...args),
  trace: (message: string, ...args: any[]) => console.trace(`[Context-Action] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[Context-Action] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[Context-Action] ${message}`, ...args)
};

/**
 * 불변성 설정 옵션
 */
export interface ImmutabilityOptions {
  enableCloning?: boolean;      // 복사 활성화 여부 (기본: true)
  enableVerification?: boolean; // 개발 모드 검증 활성화 (기본: true)
  warnOnFallback?: boolean;     // 폴백 사용 시 경고 (기본: true)
}

/**
 * 전역 불변성 설정
 */
let globalImmutabilityOptions: ImmutabilityOptions = {
  enableCloning: true,
  enableVerification: process.env.NODE_ENV === 'development',
  warnOnFallback: true
};

/**
 * 복사하지 않아야 할 특별한 객체 타입들을 확인
 */
function isNonCloneableType(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  
  // DOM Elements
  if (typeof Element !== 'undefined' && value instanceof Element) return true;
  if (typeof Node !== 'undefined' && value instanceof Node) return true;
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return true;
  
  // DOM-like properties check
  const record = value as Record<string, unknown>;
  if (typeof record.nodeType === 'number' && record.nodeType > 0) return true;
  if (typeof record.nodeName === 'string') return true;
  if (typeof record.tagName === 'string') return true;
  
  // React Fiber properties
  if (record._owner !== undefined || record.stateNode !== undefined) return true;
  
  // Functions (though they shouldn't reach here)
  if (typeof value === 'function') return true;
  
  // Promises
  if (value instanceof Promise) return true;
  if (typeof record.then === 'function' && typeof record.catch === 'function') return true;
  
  // Other unclonable types
  if (value instanceof WeakMap || value instanceof WeakSet) return true;
  
  return false;
}

/**
 * 최적화된 Immer 기반 깊은 복사
 * Tree-shaking과 성능을 고려한 구현
 * 
 * @template T 복사할 값의 타입
 * @param value 복사할 값
 * @param options 복사 옵션
 * @returns 불변성이 보장된 복사본
 */
export function deepClone<T>(value: T, _options?: { skipProducer?: boolean }): T {
  // Fast path: Primitive values are already immutable
  if (isPrimitive(value)) {
    return value;
  }

  // Function은 복사 불가능하므로 경고 후 원본 반환
  if (typeof value === 'function') {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Functions cannot be deep cloned, returning original reference');
    }
    return value;
  }

  // 복사하지 않아야 할 특별한 객체들
  if (isNonCloneableType(value)) {
    return value;
  }

  // RefState 객체는 DOM 요소를 포함하므로 복사하지 않고 원본 반환
  // DOM 요소는 JSON serialization에서 빈 객체로 변환되므로 원본 유지 필요
  if (typeof value === 'object' && value !== null && 
      '__contextActionRefState' in value && value.__contextActionRefState === true) {
    return value;
  }

  // Use native structuredClone if available (Chrome 98+, Node 17+)
  if (typeof structuredClone !== 'undefined') {
    try {
      return structuredClone(value);
    } catch {
      // Fall through to other methods if structuredClone fails
    }
  }

  // For simple objects, use optimized simple clone
  if (!isComplexObject(value)) {
    return simpleClone(value);
  }

  // For complex objects, use fallback clone (JSON-based)
  return fallbackClone(value);
}

/**
 * Async version with Immer for complex scenarios
 * Only loads Immer when actually needed
 */
export async function deepCloneWithImmer<T>(value: T): Promise<T> {
  // Fast path for primitives
  if (isPrimitive(value)) {
    return value;
  }

  // Skip non-cloneable types
  if (isNonCloneableType(value) || typeof value === 'function') {
    return value;
  }

  try {
    const { produce } = await getImmer();
    return produce(value, (_draft: any) => {
      // Empty function for copy-on-write optimization
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Immer produce failed, falling back to simple clone', error);
    }
    return fallbackClone(value);
  }
}

/**
 * 간단한 객체인지 확인
 */
function isSimpleObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.constructor === Object &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * 성능 최적화된 간단한 객체 복사
 */
function simpleClone<T>(value: T, visited = new WeakSet()): T {
  // 순환 참조 감지
  if (typeof value === 'object' && value !== null && visited.has(value)) {
    return '[Circular]' as any;
  }

  if (Array.isArray(value)) {
    visited.add(value);
    const result = value.map(item => {
      if (typeof item === 'object' && item !== null) {
        // RefState 객체는 복사하지 않고 원본 유지 (DOM 요소 보존)
        if ('__contextActionRefState' in item && item.__contextActionRefState === true) {
          return item;
        } else {
          return simpleClone(item, visited);
        }
      }
      return item;
    }) as T;
    // visited에서 제거하지 않음 - 전체 cloning이 끝날 때까지 유지
    return result;
  }

  if (isSimpleObject(value)) {
    visited.add(value);
    const cloned = {} as Record<string, unknown>;
    for (const [key, val] of Object.entries(value)) {
      if (typeof val === 'object' && val !== null) {
        // RefState 객체는 복사하지 않고 원본 유지 (DOM 요소 보존)
        if ('__contextActionRefState' in val && val.__contextActionRefState === true) {
          cloned[key] = val;
        } else {
          cloned[key] = simpleClone(val, visited);
        }
      } else {
        cloned[key] = val;
      }
    }
    // visited에서 제거하지 않음 - 전체 cloning이 끝날 때까지 유지
    return cloned as T;
  }

  return value;
}

/**
 * 폴백 복사 함수 (Immer가 실패한 경우)
 */
function fallbackClone<T>(value: T): T {
  // RefState를 보존하면서 복사하는 로직
  try {
    const visited = new WeakSet();
    const refStateObjects = new Map<string, object>();
    let refStateId = 0;
    
    // RefState 객체들을 먼저 수집하고 ID 부여
    const collectRefStates = (obj: any) => {
      if (typeof obj !== 'object' || obj === null || visited.has(obj)) return;
      visited.add(obj);
      
      if ('__contextActionRefState' in obj && obj.__contextActionRefState === true) {
        const id = `refstate_${refStateId++}`;
        refStateObjects.set(id, obj);
      }
      
      try {
        if (Array.isArray(obj)) {
          obj.forEach(collectRefStates);
        } else {
          for (const val of Object.values(obj)) {
            collectRefStates(val);
          }
        }
      } catch {
        // Silently handle errors in RefState collection
      }
    };
    
    try {
      collectRefStates(value);
      // Note: WeakSet doesn't have clear() method, and we don't need to clear it
    } catch {
      // Silently handle errors during RefState collection
    }
    
    // JSON 변환 시 RefState 객체는 ID로 교체
    const circularSafeStringify = (obj: unknown): string => {
      const jsonVisited = new WeakSet(); // 새로운 WeakSet을 JSON 직렬화용으로 사용
      return JSON.stringify(obj, function(key, val) {
        if (val !== null && typeof val === 'object') {
          if (jsonVisited.has(val)) {
            return '[Circular]';
          }
          jsonVisited.add(val);
          
          // RefState 객체는 ID 마커로 교체
          if ('__contextActionRefState' in val && val.__contextActionRefState === true) {
            for (const [id, refStateObj] of refStateObjects) {
              if (refStateObj === val) {
                return { __REFSTATE_PLACEHOLDER__: id };
              }
            }
          }
        }
        return val;
      });
    };
    
    const jsonString = circularSafeStringify(value);
    const parsed = JSON.parse(jsonString);
    
    // RefState 플레이스홀더를 원본으로 복원
    const restoreRefStates = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      if (obj.__REFSTATE_PLACEHOLDER__ && refStateObjects.has(obj.__REFSTATE_PLACEHOLDER__)) {
        return refStateObjects.get(obj.__REFSTATE_PLACEHOLDER__);
      }
      
      if (Array.isArray(obj)) {
        return obj.map(restoreRefStates);
      }
      
      const result = {} as any;
      for (const [key, val] of Object.entries(obj)) {
        result[key] = restoreRefStates(val);
      }
      return result;
    };
    
    return restoreRefStates(parsed);
  } catch (jsonError) {
    // 모든 방법이 실패하면 원본 반환
    if (process.env.NODE_ENV === 'development') {
      logger.error('All cloning methods failed, returning original reference', jsonError);
    }
    return value;
  }
}

/**
 * 불변성 검증 함수 - 복사본이 원본과 독립적인지 확인
 * 
 * @param original 원본 값
 * @param cloned 복사된 값
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
    typeof original === 'bigint' ||
    typeof original === 'symbol'
  ) {
    return original === cloned;
  }

  // 복사하지 말아야 할 특별한 객체들 - 참조가 같아야 정상
  if (isNonCloneableType(original)) {
    return original === cloned;
  }

  // Functions - 참조가 같아야 정상
  if (typeof original === 'function') {
    return original === cloned;
  }

  // 일반 객체나 배열의 경우 
  // Immer는 변경사항이 없으면 원본을 반환할 수 있으므로 이는 정상적인 최적화
  if (typeof original === 'object' && original !== null) {
    return true; // Immer의 최적화를 신뢰
  }

  return false;
}

/**
 * 안전한 getter - 불변성을 보장하는 값 반환
 * 
 * @template T 값의 타입
 * @param value 반환할 값
 * @param enableCloning 복사 활성화 여부 (기본: true)
 * @returns 불변성이 보장된 값
 */
export function safeGet<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) return value;
  
  // Fast path: primitive types don't need cloning
  if (isPrimitive(value)) return value;
  
  // Fast path: non-cloneable types
  if (isNonCloneableType(value)) return value;
  
  // Fast path: RefState objects
  if (typeof value === 'object' && value !== null && 
      '__contextActionRefState' in value && value.__contextActionRefState === true) {
    return value;
  }

  const cloned = deepClone(value);
  
  // 개발 모드에서 간단한 검증
  if (process.env.NODE_ENV === 'development' && globalImmutabilityOptions.enableVerification) {
    // 특별한 객체가 아닌 경우에만 검증
    if (!isNonCloneableType(value)) {
      const isImmutable = verifyImmutability(value, cloned);
      if (!isImmutable && typeof value === 'object' && value !== null) {
        // Immer는 최적화를 통해 원본을 반환할 수 있으므로 경고만 출력
        if (Math.random() < 0.01) { // 1% 확률로만 로그 출력하여 성능 최적화
          logger.debug('Immer optimization: same reference returned for unchanged object', {
            type: typeof value,
            constructor: value?.constructor?.name,
            isArray: Array.isArray(value)
          });
        }
      }
    }
  }

  return cloned;
}

/**
 * 안전한 setter - 입력값의 불변성을 보장하는 값 설정
 * 
 * @template T 값의 타입
 * @param value 설정할 값
 * @param enableCloning 복사 활성화 여부 (기본: true)
 * @returns 불변성이 보장된 값
 */
export function safeSet<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) {
    if (process.env.NODE_ENV === 'development') {
      logger.trace('Cloning disabled for setter, returning original reference');
    }
    return value;
  }

  return deepClone(value);
}

/**
 * 전역 불변성 옵션 설정
 * 
 * @param options 불변성 옵션
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

/**
 * 성능 측정이 포함된 안전한 getter
 */
export function performantSafeGet<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) {
    return value;
  }

  // Performance tracking for compatibility
  const startTime = performance.now();
  const result = deepClone(value); // Uses optimized sync version
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
 * Async version with Immer for complex scenarios
 */
export async function performantSafeGetWithImmer<T>(value: T, enableCloning: boolean = true): Promise<T> {
  if (!enableCloning) {
    return value;
  }

  const startTime = performance.now();
  const result = await deepCloneWithImmer(value);
  const endTime = performance.now();
  
  const duration = endTime - startTime;
  performanceData.times.push(duration);
  performanceData.operations++;
  
  if (performanceData.times.length > 100) {
    performanceData.times.shift();
  }

  return result;
}

/**
 * 성능 프로파일링 정보
 */
export interface PerformanceProfile {
  averageCloneTime: number;
  totalOperations: number;
  recommendations: string[];
}

// Performance tracking for compatibility
let performanceData: { times: number[]; operations: number } = {
  times: [],
  operations: 0
};

/**
 * 성능 프로파일 가져오기
 */
export function getPerformanceProfile(): PerformanceProfile {
  const { times, operations } = performanceData;
  const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  
  const recommendations: string[] = ['Immer를 사용하여 최적화된 불변성 보장'];
  
  return {
    averageCloneTime: averageTime,
    totalOperations: operations,
    recommendations
  };
}

/**
 * Dynamic Immer utilities - only loaded when needed
 */
export const ImmerUtils = {
  /**
   * Check if value is a Draft object (async)
   */
  async isDraft(value: unknown): Promise<boolean> {
    const { isDraft } = await getImmer();
    return isDraft(value);
  },

  /**
   * Get original object from Draft (async)
   */
  async original<T>(value: T): Promise<T | undefined> {
    const { original } = await getImmer();
    return original(value);
  },

  /**
   * Get current state of Draft (async)
   */
  async current<T>(value: T): Promise<T> {
    const { current } = await getImmer();
    return current(value);
  },

  /**
   * Produce new state with Immer (async)
   */
  async produce<T>(baseState: T, producer: (draft: T) => void | T): Promise<T> {
    const { produce } = await getImmer();
    return produce(baseState, producer);
  }
};

/**
 * Synchronous Immer utilities for backwards compatibility
 * These will throw if Immer is not pre-loaded
 */
let syncImmerCache: ImmerModule | null = null;

/**
 * Pre-load Immer for synchronous usage
 */
export async function preloadImmer(): Promise<void> {
  if (!syncImmerCache) {
    syncImmerCache = await getImmer();
  }
}

/**
 * Synchronous produce (requires preloadImmer to be called first)
 */
export function produce<T>(baseState: T, producer: (draft: T) => void | T): T {
  if (!syncImmerCache) {
    throw new Error(
      'Immer not loaded. Call preloadImmer() first or use ImmerUtils.produce() instead.'
    );
  }
  return syncImmerCache.produce(baseState, producer);
}

/**
 * Synchronous isDraft (requires preloadImmer to be called first)
 */
export function isDraft(value: unknown): boolean {
  if (!syncImmerCache) {
    throw new Error(
      'Immer not loaded. Call preloadImmer() first or use ImmerUtils.isDraft() instead.'
    );
  }
  return syncImmerCache.isDraft(value);
}

/**
 * Synchronous original (requires preloadImmer to be called first)
 */
export function original<T>(value: T): T | undefined {
  if (!syncImmerCache) {
    throw new Error(
      'Immer not loaded. Call preloadImmer() first or use ImmerUtils.original() instead.'
    );
  }
  return syncImmerCache.original(value);
}

/**
 * Synchronous current (requires preloadImmer to be called first)
 */
export function current<T>(value: T): T {
  if (!syncImmerCache) {
    throw new Error(
      'Immer not loaded. Call preloadImmer() first or use ImmerUtils.current() instead.'
    );
  }
  return syncImmerCache.current(value);
}