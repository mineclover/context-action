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
   * Hook to get the dispatch function with automatic abort support
   * 
   * Returns a type-safe dispatch function for triggering actions within React components.
   * This is the recommended approach for dispatching actions in React applications.
   * 
   * @returns Type-safe dispatch function
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-access
   */
  const useAction = (): ActionRegister<T>['dispatch'] => {
    const context = useFactoryActionContext();
    
    // Create wrapped dispatch that uses core's autoAbort feature
    const wrappedDispatch = useCallback(<K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<void> => {
      const register = context.actionRegisterRef.current;
      if (!register) {
        throw new Error(
          'ActionRegister is not initialized. ' +
          'Make sure the ActionContext Provider is properly set up.'
        );
      }
      
      // Use core's autoAbort feature if no signal is provided
      const dispatchOptions: DispatchOptions = {
        ...options,
        // Enable autoAbort if no signal is provided
        autoAbort: options?.signal ? undefined : {
          enabled: true,
          allowHandlerAbort: true
        }
      };
      
      return register.dispatch(action, payload, dispatchOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // actionRegisterRef는 ref이므로 의존성에 포함하지 않음
    
    return wrappedDispatch as ActionRegister<T>['dispatch'];
  };

  // Hook to register action handlers with automatic cleanup
  const useActionHandler = <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ): void => {
    const { actionRegisterRef } = useFactoryActionContext();
    const handlerRef = useRef(handler);
    const configRef = useRef(config);
    const actionId = useId();

    // Update refs when dependencies change
    handlerRef.current = handler;
    configRef.current = config;

    useEffect(() => {
      const register = actionRegisterRef.current;
      if (!register) {
        return;
      }

      // Register the handler with a unique ID
      const unregister = register.register(
        action,
        handlerRef.current,
        { ...configRef.current, id: actionId }
      );

      // Cleanup on unmount or when dependencies change
      return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [action, actionId]); // actionRegisterRef는 ref이므로 의존성에 포함하지 않음
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
      
      const dispatchOptions: DispatchOptions = {
        ...options,
        // Enable autoAbort if no signal is provided
        autoAbort: options?.signal ? undefined : {
          enabled: true,
          allowHandlerAbort: true,
          onControllerCreated: (controller) => {
            activeControllersRef.current.add(controller);
          }
        }
      };
      return register.dispatch(action, payload, dispatchOptions);
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
      
      const dispatchOptions: DispatchOptions = {
        ...options,
        // Enable autoAbort if no signal is provided
        autoAbort: options?.signal ? undefined : {
          enabled: true,
          allowHandlerAbort: true,
          onControllerCreated: (controller) => {
            activeControllersRef.current.add(controller);
          }
        }
      };
      return register.dispatchWithResult<K, R>(action, payload, dispatchOptions);
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