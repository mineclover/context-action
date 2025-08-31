/**
 * @fileoverview Type Guards Utility
 * 
 * 타입 안전성을 위한 타입 가드 함수들
 * Store.ts에서 사용하던 as any 제거를 위한 안전한 타입 검사 함수들
 */

/**
 * RefState 객체인지 확인하는 타입 가드
 */
export interface RefState {
  target: unknown;
  isReady: boolean;
  isMounted: boolean;
  mountPromise: Promise<unknown> | null;
}

export function isRefState(value: unknown): value is RefState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'target' in value &&
    'isReady' in value &&
    'isMounted' in value &&
    'mountPromise' in value &&
    typeof (value as any).isReady === 'boolean' &&
    typeof (value as any).isMounted === 'boolean'
  );
}

/**
 * DOM Event 객체인지 확인하는 타입 가드
 */
export function isDOMEvent(value: unknown): value is Event {
  return value instanceof Event;
}

/**
 * Event-like 객체인지 확인하는 타입 가드 (preventDefault 메서드를 가진 객체)
 */
export function isEventLike(value: unknown): value is { preventDefault: () => void } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).preventDefault === 'function'
  );
}

/**
 * target 프로퍼티를 가진 객체인지 확인하는 타입 가드
 */
export function hasTargetProperty(value: unknown): value is { target: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'target' in value
  );
}

/**
 * DOM Element인지 확인하는 타입 가드
 */
export function isDOMElement(value: unknown): value is Element {
  return value instanceof Element;
}

/**
 * 객체인지 확인하는 타입 가드 (null 제외)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 복합 타입 가드: Event 객체로 의심되는 객체인지 확인
 * RefState가 아니면서 Event 관련 속성을 가진 객체를 감지
 */
export function isSuspiciousEventObject(value: unknown, checkNested = true): boolean {
  if (!isObject(value) || isRefState(value)) {
    return false;
  }

  // Check the object itself
  if (isEventLikeObject(value)) {
    return true;
  }
  
  // Check nested objects if enabled
  if (checkNested) {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const nestedValue = value[key];
        if (isEventLikeObject(nestedValue)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * 단일 객체가 이벤트와 같은지 확인
 */
function isEventLikeObject(value: unknown): boolean {
  if (!isObject(value)) {
    return false;
  }

  const hasEventTarget = hasTargetProperty(value);
  const hasPreventDefault = isEventLike(value);
  const isEvent = isDOMEvent(value);
  
  // Check for event-like properties that indicate this might be an event object
  const hasEventType = 'type' in value && typeof (value as any).type === 'string';
  const hasEventProperties = hasEventType && (hasEventTarget || hasPreventDefault);
  
  // Check for React synthetic event markers
  const hasReactMarkers = ('nativeEvent' in value) || ('persist' in value) || ('$$typeof' in value) || ('_reactInternalFiber' in value) || ('_owner' in value);
  
  // Check constructor name for event-like objects
  const constructorName = value?.constructor?.name;
  const hasEventConstructor = constructorName ? (
    constructorName.includes('Event') || 
    constructorName === 'SyntheticEvent' ||
    constructorName.includes('MouseEvent') ||
    constructorName.includes('KeyboardEvent') ||
    constructorName.includes('TouchEvent') ||
    constructorName.includes('FocusEvent') ||
    constructorName.includes('SubmitEvent')
  ) : false;
  
  return isEvent || hasEventProperties || hasReactMarkers || hasEventConstructor;
}

/**
 * 문제가 될 수 있는 속성들을 찾아내는 함수
 */
export function findProblematicProperties(value: unknown): string[] {
  if (!isObject(value)) {
    return [];
  }

  const problematicKeys: string[] = [];
  
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const prop = value[key];
      if (isDOMElement(prop) || isDOMEvent(prop) || (isObject(prop) && hasTargetProperty(prop))) {
        problematicKeys.push(key);
      }
    }
  }
  
  return problematicKeys;
}

/**
 * 통합 타입 가드 객체
 * 모든 타입 가드 함수들을 하나의 객체로 export
 */
export const TypeGuards = {
  isRefState,
  isDOMEvent,
  isEventLike,
  hasTargetProperty,
  isDOMElement,
  isObject,
  isSuspiciousEventObject,
  findProblematicProperties
} as const;