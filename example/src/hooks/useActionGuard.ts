/**
 * @fileoverview useActionGuard - 통합 액션 가드 훅
 * 디바운싱, 스로틀링, 블로킹을 통합한 올인원 액션 보호 훅
 */

import { useCallback, useRef } from 'react';
import type { ActionPayloadMap } from '@context-action/react';
import { useActionDebouncer, type DebounceOptions } from './useActionDebouncer';
import { useActionThrottle, type ThrottleOptions } from './useActionThrottle';
import { useActionBlock, type BlockOptions } from './useActionBlock';

type GuardMode = 'debounce' | 'throttle' | 'block' | 'debounce+block' | 'throttle+block' | 'all';

interface ActionGuardOptions {
  /** 가드 모드 선택 */
  mode?: GuardMode;
  /** 디바운스 옵션 */
  debounce?: DebounceOptions;
  /** 스로틀 옵션 */
  throttle?: ThrottleOptions;
  /** 블록 옵션 */
  block?: BlockOptions;
  /** 액션별 개별 설정 */
  actionConfig?: {
    [actionName: string]: {
      mode?: GuardMode;
      debounce?: DebounceOptions;
      throttle?: ThrottleOptions;
      block?: BlockOptions;
    };
  };
  /** 개발 모드에서 디버깅 로그 출력 여부 */
  debug?: boolean;
}

/**
 * 통합 액션 가드 훅
 * 디바운싱, 스로틀링, 블로킹을 하나의 인터페이스로 관리합니다.
 * 
 * @example
 * ```typescript
 * // 기본 디바운싱 모드
 * const guard = useActionGuard({ mode: 'debounce', debounce: { delay: 1000 } });
 * 
 * // 액션별 개별 설정
 * const guard = useActionGuard({
 *   actionConfig: {
 *     'addToCart': { mode: 'debounce', debounce: { delay: 1000 } },
 *     'updatePosition': { mode: 'throttle', throttle: { interval: 100 } },
 *     'submitForm': { mode: 'block', block: { condition: () => isSubmitting } }
 *   }
 * });
 * 
 * const handleClick = () => {
 *   if (guard.canExecute('addToCart', product)) {
 *     dispatch('addToCart', product);
 *     guard.markExecuted('addToCart', product);
 *   }
 * };
 * ```
 */
export function useActionGuard<T extends ActionPayloadMap>(
  options: ActionGuardOptions = {}
) {
  const {
    mode = 'debounce',
    debounce: defaultDebounceOptions,
    throttle: defaultThrottleOptions,
    block: defaultBlockOptions,
    actionConfig = {},
    debug = process.env.NODE_ENV === 'development'
  } = options;

  // 각 개별 훅 초기화
  const debouncer = useActionDebouncer<T>({ 
    ...defaultDebounceOptions, 
    debug: debug && (mode.includes('debounce'))
  });
  const throttle = useActionThrottle<T>({ 
    ...defaultThrottleOptions, 
    debug: debug && (mode.includes('throttle'))
  });
  const blocker = useActionBlock<T>({ 
    ...defaultBlockOptions, 
    debug: debug && (mode.includes('block'))
  });

  const optionsRef = useRef({ mode, actionConfig, debug });
  optionsRef.current = { mode, actionConfig, debug };

  /**
   * 특정 액션에 대한 설정을 가져옵니다.
   */
  const getActionConfig = useCallback(<K extends keyof T>(actionName: K) => {
    const actionNameStr = actionName as string;
    const config = optionsRef.current.actionConfig[actionNameStr];
    
    return {
      mode: config?.mode || optionsRef.current.mode,
      debounce: config?.debounce || defaultDebounceOptions,
      throttle: config?.throttle || defaultThrottleOptions,
      block: config?.block || defaultBlockOptions
    };
  }, [defaultDebounceOptions, defaultThrottleOptions, defaultBlockOptions]);

  /**
   * 액션 실행 가능 여부를 확인합니다.
   */
  const canExecute = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K],
    customCondition?: () => boolean
  ): boolean => {
    const config = getActionConfig(actionName);
    const guardMode = config.mode;

    if (optionsRef.current.debug) {
      console.log(`[ActionGuard] Checking ${actionName as string} with mode: ${guardMode}`);
    }

    // 블록 체크 (모든 블록 모드에서 우선 확인)
    if (guardMode.includes('block')) {
      if (blocker.isBlocked(actionName, payload, customCondition)) {
        if (optionsRef.current.debug) {
          console.log(`[ActionGuard] 🛑 ${actionName as string} blocked`);
        }
        return false;
      }
    }

    // 디바운스 체크
    if (guardMode.includes('debounce')) {
      if (!debouncer.canExecute(actionName, payload)) {
        if (optionsRef.current.debug) {
          console.log(`[ActionGuard] 🛑 ${actionName as string} debounced`);
        }
        return false;
      }
    }

    // 스로틀 체크
    if (guardMode.includes('throttle')) {
      if (!throttle.canExecute(actionName, payload)) {
        if (optionsRef.current.debug) {
          console.log(`[ActionGuard] 🛑 ${actionName as string} throttled`);
        }
        return false;
      }
    }

    if (optionsRef.current.debug) {
      console.log(`[ActionGuard] ✅ ${actionName as string} can execute`);
    }

    return true;
  }, [getActionConfig, blocker, debouncer, throttle]);

  /**
   * 액션 실행을 기록합니다.
   */
  const markExecuted = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ): void => {
    const config = getActionConfig(actionName);
    const guardMode = config.mode;

    if (guardMode.includes('debounce')) {
      debouncer.markExecuted(actionName, payload);
    }

    if (guardMode.includes('throttle')) {
      throttle.markExecuted(actionName, payload);
    }

    if (optionsRef.current.debug) {
      console.log(`[ActionGuard] 📝 Marked execution for ${actionName as string}`);
    }
  }, [getActionConfig, debouncer, throttle]);

  /**
   * 액션을 가드와 함께 실행합니다.
   */
  const executeWithGuard = useCallback(<K extends keyof T>(
    actionName: K,
    payload: T[K],
    executor: (actionName: K, payload: T[K]) => void,
    customCondition?: () => boolean
  ): boolean => {
    if (canExecute(actionName, payload, customCondition)) {
      executor(actionName, payload);
      markExecuted(actionName, payload);
      return true;
    }

    // 스로틀링 모드에서 trailing 실행 예약
    const config = getActionConfig(actionName);
    if (config.mode.includes('throttle') && config.throttle?.trailing) {
      throttle.scheduleTrailing(actionName, payload, executor);
    }

    return false;
  }, [canExecute, markExecuted, getActionConfig, throttle]);

  /**
   * 특정 액션의 가드 상태를 초기화합니다.
   */
  const reset = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ): void => {
    const config = getActionConfig(actionName);
    const guardMode = config.mode;

    if (guardMode.includes('debounce')) {
      debouncer.reset(actionName, payload);
    }

    if (guardMode.includes('throttle')) {
      throttle.reset(actionName, payload);
    }

    if (guardMode.includes('block')) {
      blocker.unblock(actionName, payload);
    }

    if (optionsRef.current.debug) {
      console.log(`[ActionGuard] 🔄 Reset ${actionName as string}`);
    }
  }, [getActionConfig, debouncer, throttle, blocker]);

  /**
   * 모든 가드 상태를 초기화합니다.
   */
  const resetAll = useCallback((): void => {
    debouncer.resetAll();
    throttle.resetAll();
    blocker.resetAll();

    if (optionsRef.current.debug) {
      console.log('[ActionGuard] 🧹 Reset all guard states');
    }
  }, [debouncer, throttle, blocker]);

  /**
   * 액션의 종합 가드 상태를 조회합니다.
   */
  const getGuardState = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ) => {
    const config = getActionConfig(actionName);
    const guardMode = config.mode;

    const result: any = {
      actionName: actionName as string,
      mode: guardMode,
      canExecute: canExecute(actionName, payload)
    };

    if (guardMode.includes('debounce')) {
      result.debounce = debouncer.getDebounceState(actionName, payload);
    }

    if (guardMode.includes('throttle')) {
      result.throttle = throttle.getThrottleState(actionName, payload);
    }

    if (guardMode.includes('block')) {
      result.block = blocker.getBlockState(actionName, payload);
    }

    return result;
  }, [getActionConfig, canExecute, debouncer, throttle, blocker]);

  /**
   * 액션을 수동으로 블록합니다.
   */
  const blockAction = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K],
    reason?: string
  ): void => {
    blocker.block(actionName, payload, reason);
  }, [blocker]);

  /**
   * 액션 블록을 해제합니다.
   */
  const unblockAction = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ): void => {
    blocker.unblock(actionName, payload);
  }, [blocker]);

  return {
    // 핵심 기능
    canExecute,
    markExecuted,
    executeWithGuard,
    
    // 관리 기능
    reset,
    resetAll,
    getGuardState,
    
    // 블록 관리
    blockAction,
    unblockAction,
    
    // 개별 훅 접근 (고급 사용자용)
    debouncer,
    throttle,
    blocker
  };
}

/**
 * 통합 가드와 함께 액션을 실행하는 편의 훅
 * 
 * @example
 * ```typescript
 * const executeWithGuard = useActionGuardExecutor(
 *   dispatch,
 *   {
 *     mode: 'debounce+block',
 *     debounce: { delay: 1000 },
 *     block: { condition: () => isLoading }
 *   }
 * );
 * 
 * const handleClick = () => {
 *   executeWithGuard('addToCart', product);
 * };
 * ```
 */
export function useActionGuardExecutor<T extends ActionPayloadMap>(
  dispatch: <K extends keyof T>(actionName: K, payload: T[K]) => void,
  options: ActionGuardOptions = {}
) {
  const guard = useActionGuard<T>(options);

  const executeWithGuard = useCallback(<K extends keyof T>(
    actionName: K,
    payload: T[K],
    customCondition?: () => boolean
  ): boolean => {
    return guard.executeWithGuard(actionName, payload, dispatch, customCondition);
  }, [dispatch, guard]);

  return {
    execute: executeWithGuard,
    ...guard
  };
}

// 타입 익스포트
export type { ActionGuardOptions, GuardMode };