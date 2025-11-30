import React, { createContext, ReactNode, useContext, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import {  ActionRegister, ActionHandler, HandlerConfig, DispatchOptions, ExecutionResult } from '@context-action/core';
import type {
  ActionContextConfig,
  ActionContextType,
  ActionContextReturn
} from './ActionContext.types';

/**
 * @fileoverview createActionContext - Advanced type-safe action context factory
 * Provides enhanced type compatibility and automatic type inference for complex applications
 */


/**
 * Enhanced action context factory with automatic type inference
 * 
 * @template T Action payload map type for complete type safety
 * @param config - Configuration options for the ActionRegister
 * @returns Object containing Provider, hooks, and utility functions
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation
 */
// === UNIFIED ACTION CONTEXT SYSTEM ===
// Factory-based action context with built-in abort support

// Function overload for new API (contextName first)
export function createActionContext<T extends {}>(
  contextName: string,
  config?: ActionContextConfig
): ActionContextReturn<T>;

// Function overload for legacy API (config only)
export function createActionContext<T extends {}>(
  config: ActionContextConfig
): ActionContextReturn<T>;

// Implementation
export function createActionContext<T extends {}>(
  contextNameOrConfig: string | ActionContextConfig = {},
  config?: ActionContextConfig
): ActionContextReturn<T> {
  let effectiveConfig: ActionContextConfig;
  let contextName: string;
  
  // Handle both API styles
  if (typeof contextNameOrConfig === 'string') {
    // New API: createActionContext<T>('ContextName', config?)
    contextName = contextNameOrConfig;
    effectiveConfig = { ...config, name: config?.name || contextName };
  } else {
    // Legacy API: createActionContext<T>({ name: 'ContextName', ...config })
    effectiveConfig = contextNameOrConfig;
    contextName = effectiveConfig.name || 'ActionContext';
  }
  
  // Create the factory-specific context with a default value
  const FactoryActionContext = createContext<ActionContextType<T> | null>(null);

  // Provider component with abort support
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const actionRegisterRef = useRef<ActionRegister<T>>(new ActionRegister<T>(effectiveConfig));
    // const abortControllerRef = useRef<AbortController | null>(null);

    const contextValue = useMemo(() => ({
      actionRegisterRef,
      // abortControllerRef,
    }), []);

    return (
      <FactoryActionContext.Provider value={contextValue}>
        {children}
      </FactoryActionContext.Provider>
    );
  };

  // Hook to get the factory action context (different from simple ActionContext)
  const useFactoryActionContext = (): ActionContextType<T> => {
    const context = useContext(FactoryActionContext);
    if (!context) {
      throw new Error('useFactoryActionContext must be used within a factory ActionContext Provider');
    }
    return context;
  };

  /**
   * Optimized hook to get stable dispatch functions
   * 
   * Returns stable dispatch functions that prevent re-renders and maintain
   * reference equality across component renders.
   * 
   * @returns Object with dispatch and dispatchWithResult functions
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-access
   */
  const useActionDispatcher = () => {
    const { actionRegisterRef } = useFactoryActionContext();
    
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
      
      return register.dispatch(action, payload as T[K], dispatchOptions);
    }, [actionRegisterRef]); // Include actionRegisterRef dependency

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
    }, [actionRegisterRef]);

    return { dispatch, dispatchWithResult };
  };

  // Legacy hook for backwards compatibility
  const useAction = (): ActionRegister<T>['dispatch'] => {
    const { dispatch } = useActionDispatcher();
    return dispatch;
  };

  // Hook to register action handlers with automatic cleanup and ref optimization
  const useActionHandler = <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ): void => {
    const { actionRegisterRef } = useFactoryActionContext();
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
      actionRegisterRef,
      stableConfig // Only re-register if config actually changes
      // Note: handler is NOT in dependencies - it's accessed via ref
    ]);
  };

  /**
   * Hook that provides direct access to the ActionRegister instance
   * 
   * This hook is useful when you need to:
   * - Register multiple handlers dynamically
   * - Access other ActionRegister methods like clearAction, getHandlers, etc.
   * - Implement complex handler registration logic
   * - Have more control over the registration lifecycle
   * 
   * @returns ActionRegister instance or null if not initialized
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-access
   */
  const useFactoryActionRegister = (): ActionRegister<T> | null => {
    const context = useFactoryActionContext();
    return context.actionRegisterRef.current;
  };

  // Hook to get the dispatchWithResult function with full type safety
  /**
   * Hook that provides access to the dispatchWithResult function
   * 
   * This hook returns a function that dispatches actions and returns detailed
   * execution results including collected handler results, execution metadata,
   * and error information.
   * 
   * @returns dispatchWithResult function with full type safety
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-with-result
   */

  // Hook for enhanced dispatch with abort control
  const useFactoryActionDispatchWithResult = () => {
    const context = useFactoryActionContext();
    const activeControllersRef = useRef<Set<AbortController>>(new Set());

    // Create wrapped dispatch using core's autoAbort
    const dispatch = useCallback(<K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<void> => {
      const register = context.actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }

      // 🔧 Performance: Track controller for cleanup after completion
      let createdController: AbortController | undefined;

      const dispatchOptions: DispatchOptions = {
        ...options,
        // Enable autoAbort if no signal is provided
        ...(options?.signal ? {} : {
          autoAbort: {
            enabled: true,
            allowHandlerAbort: true,
            onControllerCreated: (controller) => {
              createdController = controller;
              activeControllersRef.current.add(controller);
            }
          }
        })
      };

      // 🔧 Performance: Remove controller from Set after dispatch completes
      return register.dispatch(action, payload as T[K], dispatchOptions).finally(() => {
        if (createdController) {
          activeControllersRef.current.delete(createdController);
        }
      });
    }, [context.actionRegisterRef]);

    // Create wrapped dispatchWithResult using core's autoAbort
    const dispatchWithResult = useCallback(<K extends keyof T, R = void>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<ExecutionResult<R>> => {
      const register = context.actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }

      // 🔧 Performance: Track controller for cleanup after completion
      let createdController: AbortController | undefined;

      const dispatchOptions: DispatchOptions = {
        ...options,
        // Enable autoAbort if no signal is provided
        ...(options?.signal ? {} : {
          autoAbort: {
            enabled: true,
            allowHandlerAbort: true,
            onControllerCreated: (controller) => {
              createdController = controller;
              activeControllersRef.current.add(controller);
            }
          }
        })
      };

      // 🔧 Performance: Remove controller from Set after dispatch completes
      return register.dispatchWithResult<K, R>(action, payload, dispatchOptions).finally(() => {
        if (createdController) {
          activeControllersRef.current.delete(createdController);
        }
      });
    }, [context.actionRegisterRef]);
    
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
    Provider,
    useActionContext: useFactoryActionContext,
    useActionDispatch: useAction,
    useActionHandler,
    useActionRegister: useFactoryActionRegister,
    useActionDispatchWithResult: useFactoryActionDispatchWithResult,
    context: FactoryActionContext,
  };
}