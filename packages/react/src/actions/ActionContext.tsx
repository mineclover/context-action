import React, { createContext, ReactNode, useContext, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import {  ActionRegister, ActionHandler, HandlerConfig, ActionRegisterConfig, DispatchOptions, ExecutionResult } from '@context-action/core';

/**
 * @fileoverview createActionContext - Advanced type-safe action context factory
 * Provides enhanced type compatibility and automatic type inference for complex applications
 */

/**
 * Configuration options for createActionContext
 */
export interface ActionContextConfig extends ActionRegisterConfig {
  /** Name identifier for this ActionRegister instance */
  name?: string
}

/**
 * Context type for ActionRegister with enhanced type safety and abort support
 */
export interface ActionContextType<T extends {}> {
  actionRegisterRef: React.RefObject<ActionRegister<T>>;
  // abortControllerRef: React.RefObject<AbortController | null>;
}

/**
 * Return type for createActionContext with abort support
 */
export interface ActionContextReturn<T extends {}> {
  Provider: React.FC<{ children: ReactNode }>;
  useActionContext: () => ActionContextType<T>;
  useActionDispatch: () => ActionRegister<T>['dispatch'];
  useActionHandler: <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => void;
  useActionRegister: () => ActionRegister<T> | null;
  useActionDispatchWithResult: () => {
    dispatch: <K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ) => Promise<void>;
    dispatchWithResult: <K extends keyof T, R = void>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ) => Promise<ExecutionResult<R>>;
    abortAll: () => void;
    resetAbortScope: () => void;
  };
  context: React.Context<ActionContextType<T> | null>;
}

/**
 * Enhanced action context factory with automatic type inference
 * 
 * @template T Action payload map type for complete type safety
 * @param config - Configuration options for the ActionRegister
 * @returns Object containing Provider, hooks, and utility functions
 * 
 * @example
 * ```typescript
 * interface MyActions extends ActionPayloadMap {
 *   login: { username: string; password: string };
 *   logout: void;
 * }
 * 
 * const { 
 *   Provider, 
 *   useAction, 
 *   useActionHandler, 
 *   useActionWithResult 
 * } = createActionContext<MyActions>({
 *   name: 'AuthActions'
 * });
 * 
 * function AuthComponent() {
 *   const dispatch = useAction();
 *   const dispatchWithResult = useActionWithResult();
 *   
 *   useActionHandler('login', async ({ username, password }) => {
 *     // Handle login logic
 *     return { success: true, userId: '123' };
 *   });
 *   
 *   const handleLogin = async () => {
 *     const result = await dispatchWithResult('login', 
 *       { username: 'user', password: 'pass' }, 
 *       { result: { collect: true } }
 *     );
 *     console.log('Login result:', result.results);
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleLogin}>
 *         Login with Result
 *       </button>
 *       <button onClick={() => dispatch('login', { username: 'user', password: 'pass' })}>
 *         Login (no result)
 *       </button>
 *     </div>
 *   );
 * }
 * 
 * // Alternative: Using useActionRegister for direct ActionRegister access
 * function AuthComponentAlt() {
 *   const dispatch = useAction();
 *   const register = useActionRegister();
 *   
 *   useEffect(() => {
 *     if (!register) return;
 *     
 *     // Clear existing handlers if needed
 *     register.clearAction('login');
 *     
 *     // Register handlers with full control
 *     const unregisterLogin = register.register('login', async ({ username, password }) => {
 *       // Handle login logic
 *     }, { priority: 100 });
 *     
 *     // Can also use dispatchWithResult directly from register
 *     const handleLoginWithResult = async () => {
 *       const result = await register.dispatchWithResult('login', 
 *         { username: 'user', password: 'pass' }
 *       );
 *       console.log('Login result:', result);
 *     };
 *     
 *     return () => {
 *       unregisterLogin();
 *     };
 *   }, [register]);
 *   
 *   return (
 *     <button onClick={() => dispatch('login', { username: 'user', password: 'pass' })}>
 *       Login
 *     </button>
 *   );
 * }
 * 
 * function App() {
 *   return (
 *     <Provider>
 *       <AuthComponent />
 *     </Provider>
 *   );
 * }
 * ```
 */
// === UNIFIED ACTION CONTEXT SYSTEM ===
// Factory-based action context with built-in abort support

export function createActionContext<T extends {}>(
  config: ActionContextConfig = {}
): ActionContextReturn<T> {
  // Create the factory-specific context with a default value
  const FactoryActionContext = createContext<ActionContextType<T> | null>(null);

  // Provider component with abort support
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const actionRegisterRef = useRef<ActionRegister<T>>(new ActionRegister<T>(config));
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

  // Hook to get the dispatch function with automatic abort support
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
    }, [context.actionRegisterRef.current]);
    
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
    }, [action, actionId, actionRegisterRef.current]);
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
   * @example
   * ```typescript
   * function MyComponent() {
   *   const register = useActionRegister();
   *   
   *   useEffect(() => {
   *     if (!register) return;
   *     
   *     // Clear all handlers for an action
   *     register.clearAction('myAction');
   *     
   *     // Register multiple handlers
   *     const unregister1 = register.register('myAction', handler1, { priority: 100 });
   *     const unregister2 = register.register('myAction', handler2, { priority: 50 });
   *     
   *     // Access other methods
   *     const handlers = register.getHandlers('myAction');
   *     
   *     return () => {
   *       unregister1();
   *       unregister2();
   *     };
   *   }, [register]);
   * }
   * ```
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
   * @example
   * ```typescript
   * function MyComponent() {
   *   const dispatchWithResult = useActionWithResult();
   *   
   *   const handleAction = async () => {
   *     const result = await dispatchWithResult('myAction', { data: 'test' }, {
   *       result: { 
   *         collect: true, 
   *         strategy: 'all' 
   *       },
   *       filter: { 
   *         tags: ['important'] 
   *       }
   *     });
   *     
   *     console.log('Execution successful:', result.success);
   *     console.log('Results:', result.results);
   *     console.log('Duration:', result.execution.duration);
   *   };
   * }
   * ```
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
    }, [context.actionRegisterRef.current]);
    
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
      return () => {
        activeControllersRef.current.forEach(controller => {
          if (!controller.signal.aborted) {
            controller.abort();
          }
        });
        activeControllersRef.current.clear();
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