/**
 * @fileoverview useActionDebouncer - 액션 중복 실행 방지를 위한 디바운싱 훅
 * 동일한 액션의 연속 호출을 지정된 시간 동안 방지합니다.
 */

import { useCallback, useRef } from 'react';
import type { ActionPayloadMap } from '@context-action/react';

export interface DebounceOptions {
  /** 디바운스 지연 시간 (밀리초) */
  delay?: number;
  /** 디바운스 키를 생성하는 함수 (기본값: 액션명 사용) */
  keyGenerator?: (actionName: string, payload?: any) => string;
  /** 개발 모드에서 디버깅 로그 출력 여부 */
  debug?: boolean;
}

interface DebounceState {
  timestamp: number;
  timeoutId?: NodeJS.Timeout;
}

// 전역 디바운스 상태 저장소 (메모리 효율적인 WeakMap 사용 고려했지만 string key 필요로 Map 사용)
const globalDebounceMap = new Map<string, DebounceState>();

/**
 * 액션 중복 실행을 방지하는 디바운싱 훅
 * 
 * @example
 * ```typescript
 * const debouncedAction = useActionDebouncer('addToCart', { delay: 1000 });
 * 
 * const handleAddToCart = () => {
 *   if (debouncedAction.canExecute(product)) {
 *     dispatch('addToCart', product);
 *     debouncedAction.markExecuted('addToCart', product);
 *   }
 * };
 * ```
 */
export function useActionDebouncer<T extends ActionPayloadMap>(
  options: DebounceOptions = {}
) {
  const {
    delay = 1000,
    keyGenerator = (actionName: string, payload?: any) => {
      // payload가 객체인 경우 주요 식별자로 키 생성
      if (payload && typeof payload === 'object') {
        const id = payload.id || payload.productId || payload.key;
        return id ? `${actionName}:${id}` : actionName;
      }
      return actionName;
    },
    debug = process.env.NODE_ENV === 'development'
  } = options;

  const optionsRef = useRef({ delay, keyGenerator, debug });
  optionsRef.current = { delay, keyGenerator, debug };

  /**
   * 액션 실행 가능 여부를 확인합니다.
   */
  const canExecute = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ): boolean => {
    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const state = globalDebounceMap.get(key);
    const now = Date.now();

    if (!state) {
      if (optionsRef.current.debug) {
        console.log(`[ActionDebouncer] ✅ First execution for ${key}`);
      }
      return true;
    }

    const timeDiff = now - state.timestamp;
    const canRun = timeDiff >= optionsRef.current.delay;

    if (optionsRef.current.debug) {
      if (canRun) {
        console.log(`[ActionDebouncer] ✅ Execution allowed for ${key} (${timeDiff}ms elapsed)`);
      } else {
        console.log(`[ActionDebouncer] 🛑 Execution blocked for ${key} (${timeDiff}ms < ${optionsRef.current.delay}ms)`);
      }
    }

    return canRun;
  }, []);

  /**
   * 액션 실행을 기록하고 자동 정리를 예약합니다.
   */
  const markExecuted = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ): void => {
    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const now = Date.now();

    // 기존 타이머가 있다면 정리
    const existingState = globalDebounceMap.get(key);
    if (existingState?.timeoutId) {
      clearTimeout(existingState.timeoutId);
    }

    // 새로운 상태 설정 및 자동 정리 예약
    const timeoutId = setTimeout(() => {
      globalDebounceMap.delete(key);
      if (optionsRef.current.debug) {
        console.log(`[ActionDebouncer] 🧹 Cleaned up ${key}`);
      }
    }, optionsRef.current.delay);

    globalDebounceMap.set(key, {
      timestamp: now,
      timeoutId
    });

    if (optionsRef.current.debug) {
      console.log(`[ActionDebouncer] 📝 Marked execution for ${key}`);
    }
  }, []);

  /**
   * 특정 액션의 디바운스 상태를 강제로 초기화합니다.
   */
  const reset = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ): void => {
    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const state = globalDebounceMap.get(key);
    
    if (state?.timeoutId) {
      clearTimeout(state.timeoutId);
    }
    
    globalDebounceMap.delete(key);
    
    if (optionsRef.current.debug) {
      console.log(`[ActionDebouncer] 🔄 Reset ${key}`);
    }
  }, []);

  /**
   * 모든 디바운스 상태를 초기화합니다. (테스트나 특별한 경우에만 사용)
   */
  const resetAll = useCallback((): void => {
    // 모든 타이머 정리
    globalDebounceMap.forEach(state => {
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
      }
    });
    
    globalDebounceMap.clear();
    
    if (optionsRef.current.debug) {
      console.log('[ActionDebouncer] 🧹 Reset all debounce states');
    }
  }, []);

  /**
   * 현재 디바운스 상태를 조회합니다. (디버깅용)
   */
  const getDebounceState = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ) => {
    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const state = globalDebounceMap.get(key);
    
    if (!state) return null;
    
    return {
      key,
      timestamp: state.timestamp,
      remainingTime: Math.max(0, optionsRef.current.delay - (Date.now() - state.timestamp)),
      isActive: (Date.now() - state.timestamp) < optionsRef.current.delay
    };
  }, []);

  return {
    canExecute,
    markExecuted,
    reset,
    resetAll,
    getDebounceState
  };
}

/**
 * 액션을 디바운싱과 함께 실행하는 편의 훅
 * 
 * @example
 * ```typescript
 * const executeWithDebounce = useActionDebounceExecutor(dispatch, { delay: 1000 });
 * 
 * const handleClick = () => {
 *   executeWithDebounce('addToCart', product);
 * };
 * ```
 */
export function useActionDebounceExecutor<T extends ActionPayloadMap>(
  dispatch: <K extends keyof T>(actionName: K, payload: T[K]) => void,
  options: DebounceOptions = {}
) {
  const debouncer = useActionDebouncer<T>(options);

  const executeWithDebounce = useCallback(<K extends keyof T>(
    actionName: K,
    payload: T[K]
  ): boolean => {
    if (debouncer.canExecute(actionName, payload)) {
      dispatch(actionName, payload);
      debouncer.markExecuted(actionName, payload);
      return true;
    }
    return false;
  }, [dispatch, debouncer]);

  return {
    executeWithDebounce,
    ...debouncer
  };
}