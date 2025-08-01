/**
 * @fileoverview useActionBlock - 액션 실행 차단을 위한 훅
 * 특정 조건에서 액션 실행을 완전히 차단합니다.
 */

import { useCallback, useRef } from 'react';
import type { ActionPayloadMap } from '@context-action/react';

export interface BlockOptions {
  /** 블록 조건을 확인하는 함수 */
  condition?: () => boolean;
  /** 블록 키를 생성하는 함수 */
  keyGenerator?: (actionName: string, payload?: any) => string;
  /** 블록된 액션에 대한 콜백 */
  onBlocked?: (actionName: string, payload?: any, reason?: string) => void;
  /** 개발 모드에서 디버깅 로그 출력 여부 */
  debug?: boolean;
}

interface BlockState {
  isBlocked: boolean;
  reason?: string;
  blockedAt: number;
  blockedCount: number;
}

// 전역 블록 상태 저장소
const globalBlockMap = new Map<string, BlockState>();

/**
 * 액션 실행 차단 훅
 * 특정 조건이나 상태에서 액션 실행을 완전히 차단합니다.
 * 
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const [isLoading, setIsLoading] = useState(false);
 * const blocker = useActionBlock({
 *   condition: () => isLoading,
 *   onBlocked: (actionName) => console.log(`${actionName} blocked due to loading`)
 * });
 * 
 * const handleSubmit = () => {
 *   if (!blocker.isBlocked('submitForm')) {
 *     setIsLoading(true);
 *     dispatch('submitForm', formData);
 *   }
 * };
 * ```
 */
export function useActionBlock<T extends ActionPayloadMap>(
  options: BlockOptions = {}
) {
  const {
    condition = () => false,
    keyGenerator = (actionName: string, payload?: any) => {
      if (payload && typeof payload === 'object') {
        const id = payload.id || payload.key || payload.type;
        return id ? `${actionName}:${id}` : actionName;
      }
      return actionName;
    },
    onBlocked,
    debug = process.env.NODE_ENV === 'development'
  } = options;

  const optionsRef = useRef({ condition, keyGenerator, onBlocked, debug });
  optionsRef.current = { condition, keyGenerator, onBlocked, debug };

  /**
   * 특정 액션이 블록되어 있는지 확인합니다.
   */
  const isBlocked = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K],
    customCondition?: () => boolean
  ): boolean => {
    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const state = globalBlockMap.get(key);
    
    // 커스텀 조건이나 글로벌 조건 확인
    const conditionResult = customCondition ? customCondition() : optionsRef.current.condition();
    
    // 명시적으로 블록된 상태이거나 조건이 참인 경우 블록
    const blocked = (state?.isBlocked) || conditionResult;
    
    if (blocked && optionsRef.current.debug) {
      const reason = state?.reason || 'Condition met';
      console.log(`[ActionBlock] 🛑 Action ${key} is blocked: ${reason}`);
    }

    return blocked;
  }, []);

  /**
   * 액션을 명시적으로 블록합니다.
   */
  const block = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K],
    reason?: string
  ): void => {
    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const existingState = globalBlockMap.get(key);
    
    globalBlockMap.set(key, {
      isBlocked: true,
      reason: reason || 'Manually blocked',
      blockedAt: Date.now(),
      blockedCount: (existingState?.blockedCount || 0) + 1
    });

    if (optionsRef.current.debug) {
      console.log(`[ActionBlock] 🔒 Blocked ${key}: ${reason || 'Manually blocked'}`);
    }
  }, []);

  /**
   * 액션 블록을 해제합니다.
   */
  const unblock = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ): void => {
    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const state = globalBlockMap.get(key);
    
    if (state) {
      globalBlockMap.set(key, {
        ...state,
        isBlocked: false,
        reason: undefined
      });

      if (optionsRef.current.debug) {
        console.log(`[ActionBlock] 🔓 Unblocked ${key}`);
      }
    }
  }, []);

  /**
   * 액션 실행을 시도합니다. 블록되지 않은 경우에만 실행됩니다.
   */
  const tryExecute = useCallback(<K extends keyof T>(
    actionName: K,
    payload: T[K],
    executor: (actionName: K, payload: T[K]) => void,
    customCondition?: () => boolean
  ): boolean => {
    if (isBlocked(actionName, payload, customCondition)) {
      const key = optionsRef.current.keyGenerator(actionName as string, payload);
      const state = globalBlockMap.get(key);
      
      // 블록 카운트 증가
      if (state) {
        globalBlockMap.set(key, {
          ...state,
          blockedCount: state.blockedCount + 1
        });
      }

      // 블록 콜백 호출
      if (optionsRef.current.onBlocked) {
        optionsRef.current.onBlocked(actionName as string, payload, state?.reason);
      }

      return false;
    }

    executor(actionName, payload);
    return true;
  }, [isBlocked]);

  /**
   * 모든 액션 블록을 해제합니다.
   */
  const unblockAll = useCallback((): void => {
    globalBlockMap.forEach((state, key) => {
      globalBlockMap.set(key, {
        ...state,
        isBlocked: false,
        reason: undefined
      });
    });

    if (optionsRef.current.debug) {
      console.log('[ActionBlock] 🔓 Unblocked all actions');
    }
  }, []);

  /**
   * 모든 블록 상태를 초기화합니다.
   */
  const resetAll = useCallback((): void => {
    globalBlockMap.clear();

    if (optionsRef.current.debug) {
      console.log('[ActionBlock] 🧹 Reset all block states');
    }
  }, []);

  /**
   * 블록 상태를 조회합니다.
   */
  const getBlockState = useCallback(<K extends keyof T>(
    actionName: K,
    payload?: T[K]
  ) => {
    const key = optionsRef.current.keyGenerator(actionName as string, payload);
    const state = globalBlockMap.get(key);
    
    if (!state) return null;
    
    return {
      key,
      isBlocked: state.isBlocked,
      reason: state.reason,
      blockedAt: state.blockedAt,
      blockedCount: state.blockedCount,
      blockedDuration: Date.now() - state.blockedAt
    };
  }, []);

  /**
   * 현재 모든 블록 상태를 조회합니다.
   */
  const getAllBlockStates = useCallback(() => {
    const states: Array<{
      key: string;
      isBlocked: boolean;
      reason?: string;
      blockedAt: number;
      blockedCount: number;
      blockedDuration: number;
    }> = [];

    globalBlockMap.forEach((state, key) => {
      states.push({
        key,
        isBlocked: state.isBlocked,
        reason: state.reason,
        blockedAt: state.blockedAt,
        blockedCount: state.blockedCount,
        blockedDuration: Date.now() - state.blockedAt
      });
    });

    return states;
  }, []);

  return {
    isBlocked,
    block,
    unblock,
    tryExecute,
    unblockAll,
    resetAll,
    getBlockState,
    getAllBlockStates
  };
}

/**
 * 액션을 블로킹 조건과 함께 실행하는 편의 훅
 * 
 * @example
 * ```typescript
 * const [isSubmitting, setIsSubmitting] = useState(false);
 * const executeWithBlock = useActionBlockExecutor(
 *   dispatch,
 *   {
 *     condition: () => isSubmitting,
 *     onBlocked: () => console.log('Form is being submitted, please wait')
 *   }
 * );
 * 
 * const handleSubmit = () => {
 *   if (executeWithBlock('submitForm', formData)) {
 *     setIsSubmitting(true);
 *   }
 * };
 * ```
 */
export function useActionBlockExecutor<T extends ActionPayloadMap>(
  dispatch: <K extends keyof T>(actionName: K, payload: T[K]) => void,
  options: BlockOptions = {}
) {
  const blocker = useActionBlock<T>(options);

  const executeWithBlock = useCallback(<K extends keyof T>(
    actionName: K,
    payload: T[K],
    customCondition?: () => boolean
  ): boolean => {
    return blocker.tryExecute(actionName, payload, dispatch, customCondition);
  }, [dispatch, blocker]);

  return {
    executeWithBlock,
    ...blocker
  };
}