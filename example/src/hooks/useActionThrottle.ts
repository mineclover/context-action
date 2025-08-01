/**
 * @fileoverview useActionThrottle - 액션 스로틀링을 위한 훅
 * 지정된 시간 간격으로만 액션 실행을 허용합니다.
 */

import { useCallback, useRef } from 'react';
import type { ActionPayloadMap } from '@context-action/react';

export interface ThrottleOptions {
  /** 스로틀 간격 (밀리초) */
  interval?: number;
  /** 첫 번째 호출을 즉시 실행할지 여부 */
  leading?: boolean;
  /** 마지막 호출을 지연 실행할지 여부 */
  trailing?: boolean;
  /** 스로틀 키를 생성하는 함수 */
  keyGenerator?: (actionName: string, payload?: any) => string;
  /** 개발 모드에서 디버깅 로그 출력 여부 */
  debug?: boolean;
}

interface ThrottleState {
  lastExecuted: number;
  timeoutId?: NodeJS.Timeout;
  pendingArgs?: { actionName: string; payload?: any };
}

// 전역 스로틀 상태 저장소
const globalThrottleMap = new Map<string, ThrottleState>();

/**
 * 액션 스로틀링 훅
 * 지정된 간격으로만 액션 실행을 허용하여 고빈도 호출을 제어합니다.
 * 
 * @implements {ActionHandler}
 * @memberof CoreConcepts
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const throttle = useActionThrottle({ interval: 500, leading: true, trailing: true });
 * 
 * const handleScroll = () => {
 *   if (throttle.canExecute('updateScrollPosition')) {
 *     dispatch('updateScrollPosition', { scrollY: window.scrollY });
 *     throttle.markExecuted('updateScrollPosition');
 *   }
 * };
 * ```
 */
export function useActionThrottle<T extends ActionPayloadMap>(
  options: ThrottleOptions = {}
) {
  const {
    interval = 1000,
    leading = true,
    trailing = false,
    keyGenerator = (actionName: string, payload?: any) => {
      if (payload && typeof payload === 'object') {
        const id = payload.id || payload.key || payload.type;
        return id ? `${actionName}:${id}` : actionName;
      }
      return actionName;
    },
    debug = process.env.NODE_ENV === 'development'
  } = options;

  const optionsRef = useRef({ interval, leading, trailing, keyGenerator, debug });
  optionsRef.current = { interval, leading, trailing, keyGenerator, debug };

  /**
   * 액션 실행 가능 여부를 확인합니다.
   */
  const canExecute = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ): boolean => {
    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const state = globalThrottleMap.get(key);
    const now = Date.now();

    if (!state) {
      // 첫 번째 실행
      if (optionsRef.current.debug) {
        console.log(`[ActionThrottle] ✅ First execution for ${key}`);
      }
      return optionsRef.current.leading;
    }

    const timeSinceLastExecution = now - state.lastExecuted;
    const canRun = timeSinceLastExecution >= optionsRef.current.interval;

    if (optionsRef.current.debug) {
      if (canRun) {
        console.log(`[ActionThrottle] ✅ Execution allowed for ${key} (${timeSinceLastExecution}ms elapsed)`);
      } else {
        console.log(`[ActionThrottle] 🛑 Execution throttled for ${key} (${timeSinceLastExecution}ms < ${optionsRef.current.interval}ms)`);
      }
    }

    return canRun;
  }, []);

  /**
   * 액션 실행을 기록합니다.
   */
  const markExecuted = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ): void => {
    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const now = Date.now();

    // 기존 trailing 타이머가 있다면 정리
    const existingState = globalThrottleMap.get(key);
    if (existingState?.timeoutId) {
      clearTimeout(existingState.timeoutId);
    }

    globalThrottleMap.set(key, {
      lastExecuted: now,
      timeoutId: undefined,
      pendingArgs: undefined
    });

    if (optionsRef.current.debug) {
      console.log(`[ActionThrottle] 📝 Marked execution for ${key}`);
    }
  }, []);

  /**
   * 스로틀된 액션을 예약합니다 (trailing 옵션이 true일 때 사용).
   */
  const scheduleTrailing = useCallback(<K extends keyof T>(
    actionName: K,
    payload: T[K],
    executor: (actionName: K, payload: T[K]) => void
  ): void => {
    if (!optionsRef.current.trailing) return;

    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const state = globalThrottleMap.get(key);

    if (!state) return;

    // 기존 trailing 실행이 예약되어 있다면 취소
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
    }

    // 다음 실행 가능 시점까지의 시간 계산
    const timeSinceLastExecution = Date.now() - state.lastExecuted;
    const delay = Math.max(0, optionsRef.current.interval - timeSinceLastExecution);

    const timeoutId = setTimeout(() => {
      executor(actionName, payload);
      markExecuted(actionName, payload);
      
      if (optionsRef.current.debug) {
        console.log(`[ActionThrottle] ⏰ Trailing execution for ${key}`);
      }
    }, delay);

    // 상태 업데이트
    globalThrottleMap.set(key, {
      ...state,
      timeoutId,
      pendingArgs: { actionName: actionName as string, payload }
    });

    if (optionsRef.current.debug) {
      console.log(`[ActionThrottle] ⏰ Scheduled trailing execution for ${key} in ${delay}ms`);
    }
  }, [markExecuted]);

  /**
   * 특정 액션의 스로틀 상태를 초기화합니다.
   */
  const reset = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ): void => {
    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const state = globalThrottleMap.get(key);
    
    if (state?.timeoutId) {
      clearTimeout(state.timeoutId);
    }
    
    globalThrottleMap.delete(key);
    
    if (optionsRef.current.debug) {
      console.log(`[ActionThrottle] 🔄 Reset ${key}`);
    }
  }, []);

  /**
   * 모든 스로틀 상태를 초기화합니다.
   */
  const resetAll = useCallback((): void => {
    globalThrottleMap.forEach(state => {
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
      }
    });
    
    globalThrottleMap.clear();
    
    if (optionsRef.current.debug) {
      console.log('[ActionThrottle] 🧹 Reset all throttle states');
    }
  }, []);

  /**
   * 현재 스로틀 상태를 조회합니다.
   */
  const getThrottleState = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ) => {
    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const state = globalThrottleMap.get(key);
    
    if (!state) return null;
    
    const now = Date.now();
    const timeSinceLastExecution = now - state.lastExecuted;
    const remainingTime = Math.max(0, optionsRef.current.interval - timeSinceLastExecution);
    
    return {
      key,
      lastExecuted: state.lastExecuted,
      timeSinceLastExecution,
      remainingTime,
      isThrottled: remainingTime > 0,
      hasPendingTrailing: !!state.timeoutId
    };
  }, []);

  return {
    canExecute,
    markExecuted,
    scheduleTrailing,
    reset,
    resetAll,
    getThrottleState
  };
}

/**
 * 액션을 스로틀링과 함께 실행하는 편의 훅
 * 
 * @example
 * ```typescript
 * const executeWithThrottle = useActionThrottleExecutor(
 *   dispatch, 
 *   { interval: 500, leading: true, trailing: true }
 * );
 * 
 * const handleMouseMove = (event) => {
 *   executeWithThrottle('updateMousePosition', { x: event.clientX, y: event.clientY });
 * };
 * ```
 */
export function useActionThrottleExecutor<T extends ActionPayloadMap>(
  dispatch: <K extends keyof T>(actionName: K, payload: T[K]) => void,
  options: ThrottleOptions = {}
) {
  const throttle = useActionThrottle<T>(options);

  const executeWithThrottle = useCallback(<K extends keyof T>(
    actionName: K,
    payload: T[K]
  ): boolean => {
    if (throttle.canExecute(actionName, payload)) {
      dispatch(actionName, payload);
      throttle.markExecuted(actionName, payload);
      return true;
    } else {
      // trailing이 활성화된 경우 마지막 호출을 예약
      throttle.scheduleTrailing(actionName, payload, dispatch);
      return false;
    }
  }, [dispatch, throttle]);

  return {
    executeWithThrottle,
    ...throttle
  };
}