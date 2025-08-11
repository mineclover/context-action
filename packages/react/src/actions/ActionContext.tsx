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
  /**
   * @deprecated Use useActionHandler instead. This hook will be removed in v2.0.0
   * @example 
   * // Old way (deprecated):
   * const register = useActionRegister();
   * // New way (recommended):
   * const addHandler = useActionHandler();
   */
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
 * // Alternative: Using useActionRegister for direct registration in useEffect
 * function AuthComponentAlt() {
 *   const dispatch = useAction();
 *   const register = useActionRegister();
 *   
 *   useEffect(() => {
 *     if (!register) return;
 *     
 *     const unregisterLogin = register.register('login', async ({ username, password }) => {
 *       // Handle login logic
 *     });
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
    const abortControllerRef = useRef<AbortController | null>(null);

    const contextValue = useMemo(() => ({
      actionRegisterRef,
      abortControllerRef,
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

  // Hook to get the dispatch function with automatic abort on unmount
  const useAction = (): ActionRegister<T>['dispatch'] => {
    const context = useFactoryActionContext();
    const componentAbortRef = useRef<AbortController | null>(null);
    
    // Get or create component-specific abort controller
    const getComponentAbortController = useCallback(() => {
      if (!componentAbortRef.current || componentAbortRef.current.signal.aborted) {
        componentAbortRef.current = new AbortController();
      }
      return componentAbortRef.current;
    }, []);
    
    // Create wrapped dispatch that includes component-specific abort signal
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
      
      const controller = getComponentAbortController();
      // Merge component abort signal with any existing options
      const dispatchOptions: DispatchOptions = {
        ...options,
        signal: options?.signal || controller.signal,
      };
      return register.dispatch(action, payload, dispatchOptions);
    }, [context.actionRegisterRef, getComponentAbortController]);
    
    // Cleanup: abort all pending actions on unmount
    useEffect(() => {
      return () => {
        if (componentAbortRef.current && !componentAbortRef.current.signal.aborted) {
          componentAbortRef.current.abort();
        }
      };
    }, []);
    
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
    }, [action, actionId, actionRegisterRef]);
  };

  // Hook to get the ActionRegister instance directly for use in useEffect
  /**
   * Hook that provides direct access to the ActionRegister instance
   * 
   * This hook is useful when you need to register handlers directly in useEffect
   * instead of using the useActionHandler hook. This pattern can be helpful
   * for complex handler registration logic or when you need more control over
   * the registration lifecycle.
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
   *     const unregisterHandler = register.register('myAction', async (payload, controller) => {
   *       // Handler logic
   *     });
   *     
   *     return () => {
   *       unregisterHandler();
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

  // Hook for enhanced dispatch with abort control (similar to old useActionDispatchWithResult)
  const useFactoryActionDispatchWithResult = () => {
    const context = useFactoryActionContext();
    const componentAbortRef = useRef<AbortController | null>(null);
    
    // Get or create component-specific abort controller
    const getComponentAbortController = useCallback(() => {
      if (!componentAbortRef.current || componentAbortRef.current.signal.aborted) {
        componentAbortRef.current = new AbortController();
      }
      return componentAbortRef.current;
    }, []);
    
    // Create wrapped dispatch
    const dispatch = useCallback(<K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<void> => {
      const register = context.actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }
      
      const controller = getComponentAbortController();
      const dispatchOptions: DispatchOptions = {
        ...options,
        signal: options?.signal || controller.signal,
      };
      return register.dispatch(action, payload, dispatchOptions);
    }, [context.actionRegisterRef, getComponentAbortController]);
    
    // Create wrapped dispatchWithResult
    const dispatchWithResult = useCallback(<K extends keyof T, R = void>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<ExecutionResult<R>> => {
      const register = context.actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }
      
      const controller = getComponentAbortController();
      const dispatchOptions: DispatchOptions = {
        ...options,
        signal: options?.signal || controller.signal,
      };
      return register.dispatchWithResult<K, R>(action, payload, dispatchOptions);
    }, [context.actionRegisterRef, getComponentAbortController]);
    
    // Method to manually abort all pending actions
    const abortAll = useCallback(() => {
      if (componentAbortRef.current && !componentAbortRef.current.signal.aborted) {
        componentAbortRef.current.abort();
        componentAbortRef.current = null;
      }
    }, []);
    
    // Method to create a new abort scope
    const resetAbortScope = useCallback(() => {
      abortAll();
      componentAbortRef.current = new AbortController();
    }, [abortAll]);
    
    // Cleanup: abort all pending actions on unmount
    useEffect(() => {
      return () => {
        if (componentAbortRef.current && !componentAbortRef.current.signal.aborted) {
          componentAbortRef.current.abort();
        }
      };
    }, []);
    
    return {
      dispatch,
      dispatchWithResult,
      abortAll,
      resetAbortScope,
    };
  };

  // Add deprecation warning for old useActionRegister hook
  const useActionRegisterWithWarning = (): ActionRegister<T> | null => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '⚠️ useActionRegister is deprecated. Use useActionHandler instead. ' +
        'This hook will be removed in v2.0.0. ' +
        'Migration: const register = useActionRegister() → const addHandler = useActionHandler()'
      );
    }
    return useFactoryActionRegister();
  };

  return {
    Provider,
    useActionContext: useFactoryActionContext,
    useActionDispatch: useAction,
    // New preferred naming (prioritized in order)
    useActionHandler,
    // Deprecated naming (with warnings)
    useActionRegister: useActionRegisterWithWarning,
    useActionDispatchWithResult: useFactoryActionDispatchWithResult,
    context: FactoryActionContext,
  };
}