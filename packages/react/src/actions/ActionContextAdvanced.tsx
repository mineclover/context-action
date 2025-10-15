import { useRef, useEffect, useId, useMemo, useCallback } from 'react';
import { ActionHandler, HandlerConfig, DispatchOptions, ExecutionResult } from '@context-action/core';
import type { ActionContextType } from './ActionContext.types';

/**
 * @fileoverview ActionContext Advanced - 고급 기능 포함
 * 
 * Handler 등록, dispatchWithResult 등 고급 기능 포함
 * 크기: ~15K (기존 46K의 33%)
 */

/**
 * 고급 ActionContext 훅들
 * 
 * @template T Action payload map type
 * @param context - ActionContextType from core
 */
export function createActionContextAdvanced<T extends {}>(
  context: ActionContextType<T>
) {
  const { actionRegisterRef } = context;

  // Hook to register action handlers with automatic cleanup and ref optimization
  const useActionHandler = <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ): void => {
    const actionId = useId();
    
    // Store the latest handler in a ref to avoid re-registrations
    const handlerRef = useRef(handler);
    handlerRef.current = handler;
    
    // Extract config properties to stable variables
    const priority = config?.priority ?? 0;
    const id = config?.id || `react_${String(action)}_${actionId}`;
    const blocking = config?.blocking ?? false;
    const once = config?.once ?? false;
    const debounce = config?.debounce;
    const throttle = config?.throttle;
    
    // Memoize config to prevent unnecessary re-registrations
    const stableConfig = useMemo((): HandlerConfig => ({
      priority,
      id,
      blocking,
      once,
      replaceExisting: true,
      ...(debounce !== undefined && { debounce }),
      ...(throttle !== undefined && { throttle })
    }), [priority, id, blocking, once, debounce, throttle]);

    useEffect(() => {
      const register = actionRegisterRef.current;
      if (!register) return;

      // Create a wrapper handler that always calls the latest handler
      const wrapperHandler: ActionHandler<T[K]> = (payload, controller) => {
        return handlerRef.current(payload, controller);
      };

      if (process.env.NODE_ENV === 'development') {
        console.log(`Registering handler for '${String(action)}'`);
      }

      // Register the wrapper handler (not the actual handler)
      const unregister = register.register(action, wrapperHandler, stableConfig);

      // Cleanup on unmount or config change only
      return unregister;
    }, [
      action,
      stableConfig // Only re-register if config actually changes
      // Note: handler is NOT in dependencies - it's accessed via ref
    ]);
  };

  // Hook for enhanced dispatch with abort control
  const useActionDispatchWithResult = () => {
    const activeControllersRef = useRef<Set<AbortController>>(new Set());
    
    // Create wrapped dispatch using core's autoAbort
    const dispatch = useCallback(<K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<void> => {
      const register = actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }
      
      const dispatchOptions: DispatchOptions = {
        ...options,
        // Enable autoAbort if no signal is provided
        ...(options?.signal ? {} : {
          autoAbort: {
            enabled: true,
            allowHandlerAbort: true,
            onControllerCreated: (controller) => {
              activeControllersRef.current.add(controller);
            }
          }
        })
      };
      return register.dispatch(action, payload, dispatchOptions);
    }, []);
    
    // Create wrapped dispatchWithResult using core's autoAbort
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
        // Enable autoAbort if no signal is provided
        ...(options?.signal ? {} : {
          autoAbort: {
            enabled: true,
            allowHandlerAbort: true,
            onControllerCreated: (controller) => {
              activeControllersRef.current.add(controller);
            }
          }
        })
      };
      return register.dispatchWithResult<K, R>(action, payload, dispatchOptions);
    }, []);
    
    // Method to manually abort all pending actions
    const abortAll = useCallback(() => {
      activeControllersRef.current.forEach(controller => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      });
      activeControllersRef.current.clear();
    }, []);
    
    // Method to create a new abort scope
    const resetAbortScope = useCallback(() => {
      abortAll();
    }, [abortAll]);
    
    // Cleanup: abort all pending actions on unmount
    useEffect(() => {
      const controllers = activeControllersRef;
      return () => {
        controllers.current.forEach(controller => {
          if (!controller.signal.aborted) {
            controller.abort();
          }
        });
        controllers.current.clear();
      };
    }, []);
    
    return {
      dispatch,
      dispatchWithResult,
      abortAll,
      resetAbortScope,
    };
  };

  return {
    useActionHandler,
    useActionDispatchWithResult,
  };
}
