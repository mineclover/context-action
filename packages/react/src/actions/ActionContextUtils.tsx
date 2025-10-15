import { useCallback, useMemo } from 'react';
import { DispatchOptions, ExecutionResult } from '@context-action/core';
import type { ActionContextType } from './ActionContext.types';

/**
 * @fileoverview ActionContext Utils - 유틸리티 함수들
 * 
 * 성능 최적화, 디버깅, 개발자 도구 등 유틸리티 기능
 * 크기: ~11K (기존 46K의 24%)
 */

/**
 * ActionContext 유틸리티 함수들
 * 
 * @template T Action payload map type
 * @param context - ActionContextType from core
 */
export function createActionContextUtils<T extends {}>(
  context: ActionContextType<T>
) {
  const { actionRegisterRef } = context;

  // Optimized hook to get stable dispatch functions
  const useActionDispatcher = () => {
    // Stable dispatch function with useCallback optimization
    const dispatch = useCallback(<K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<void> => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`React dispatch called for '${String(action)}':`, {
          hasPayload: payload !== undefined,
          hasOptions: options !== undefined,
          timestamp: new Date().toISOString()
        });
      }
      
      const register = actionRegisterRef.current;
      if (!register) {
        throw new Error(
          'ActionRegister is not initialized. ' +
          'Make sure the ActionContext Provider is properly set up.'
        );
      }
      
      // Use core's autoAbort feature if no signal is provided
      const dispatchOptions: DispatchOptions = {
        ...options,
        ...(options?.signal ? {} : {
          autoAbort: {
            enabled: true,
            allowHandlerAbort: true
          }
        })
      };
      
      return register.dispatch(action, payload, dispatchOptions);
    }, []); // actionRegisterRef is stable and doesn't need to be in dependencies

    // Stable dispatchWithResult function
    const dispatchWithResult = useCallback(<K extends keyof T, R = void>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<ExecutionResult<R>> => {
      const register = actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }
      
      const dispatchOptions: DispatchOptions = {
        ...options,
        ...(options?.signal ? {} : {
          autoAbort: {
            enabled: true,
            allowHandlerAbort: true
          }
        })
      };
      
      return register.dispatchWithResult<K, R>(action, payload, dispatchOptions);
    }, []); // actionRegisterRef is stable and doesn't need to be in dependencies

    return { dispatch, dispatchWithResult };
  };

  // Legacy hook for backwards compatibility
  const useAction = () => {
    const { dispatch } = useActionDispatcher();
    return dispatch;
  };

  // Performance monitoring utilities
  const usePerformanceMonitor = () => {
    const performanceData = useMemo(() => ({
      dispatchCount: 0,
      lastDispatchTime: 0,
      averageDispatchTime: 0,
    }), []);

    const trackDispatch = useCallback((actionName: string, duration: number) => {
      if (process.env.NODE_ENV === 'development') {
        performanceData.dispatchCount++;
        performanceData.lastDispatchTime = duration;
        performanceData.averageDispatchTime = 
          (performanceData.averageDispatchTime * (performanceData.dispatchCount - 1) + duration) / 
          performanceData.dispatchCount;
        
        if (duration > 100) { // 100ms 이상
          console.warn(`Slow action dispatch: ${actionName} took ${duration}ms`);
        }
      }
    }, [performanceData]);

    return {
      performanceData,
      trackDispatch,
    };
  };

  // Debug utilities
  const useDebugUtils = () => {
    const getActionInfo = useCallback(() => {
      const register = actionRegisterRef.current;
      if (!register) return null;
      
      // ActionRegister의 내부 상태를 통해 정보 수집
      const pipelines = (register as any).pipelines;
      const registeredActions = pipelines ? Array.from(pipelines.keys()) : [];
      const handlerCount = pipelines ? Array.from(pipelines.values())
        .reduce((total: number, handlers: any) => total + (Array.isArray(handlers) ? handlers.length : 0), 0) : 0;
      const isActive = true; // ActionRegister는 항상 활성 상태
      
      return {
        registeredActions,
        handlerCount,
        isActive,
      };
    }, []);

    const logActionState = useCallback(() => {
      if (process.env.NODE_ENV === 'development') {
        const info = getActionInfo();
        console.log('ActionContext Debug Info:', info);
      }
    }, [getActionInfo]);

    return {
      getActionInfo,
      logActionState,
    };
  };

  return {
    useActionDispatcher,
    useAction,
    usePerformanceMonitor,
    useDebugUtils,
  };
}
