import React, { createContext, ReactNode, useContext, useRef, useEffect, useId, useMemo } from 'react';
import { ActionPayloadMap, ActionRegister, ActionHandler, HandlerConfig, ActionRegisterConfig } from '@context-action/core';

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
 * Context type for ActionRegister with enhanced type safety
 */
export interface ActionContextType<T extends ActionPayloadMap = ActionPayloadMap> {
  actionRegisterRef: React.RefObject<ActionRegister<T>>;
}

/**
 * Return type for createActionContext
 */
export interface ActionContextReturn<T extends ActionPayloadMap = ActionPayloadMap> {
  Provider: React.FC<{ children: ReactNode }>;
  useActionContext: () => ActionContextType<T>;
  useAction: () => ActionRegister<T>['dispatch'];
  useActionHandler: <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => void;
  useActionRegister: () => ActionRegister<T> | null;
}

/**
 * Enhanced action context factory with automatic type inference
 * 
 * @template T - Action payload map type for complete type safety
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
 * const { Provider, useAction, useActionHandler } = createActionContext<MyActions>({
 *   name: 'AuthActions'
 * });
 * 
 * function AuthComponent() {
 *   const dispatch = useAction();
 *   
 *   useActionHandler('login', async ({ username, password }) => {
 *     // Handle login logic
 *   });
 *   
 *   return (
 *     <button onClick={() => dispatch('login', { username: 'user', password: 'pass' })}>
 *       Login
 *     </button>
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
export function createActionContext<T extends ActionPayloadMap = ActionPayloadMap>(
  config: ActionContextConfig = {}
): ActionContextReturn<T> {
  // Create the context with a default value
  const ActionContext = createContext<ActionContextType<T> | null>(null);

  // Provider component
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const actionRegisterRef = useRef<ActionRegister<T>>(new ActionRegister<T>(config));

    const contextValue = useMemo(() => ({
      actionRegisterRef,
    }), []);

    return (
      <ActionContext.Provider value={contextValue}>
        {children}
      </ActionContext.Provider>
    );
  };

  // Hook to get the action context
  const useActionContext = (): ActionContextType<T> => {
    const context = useContext(ActionContext);
    if (!context) {
      throw new Error('useActionContext must be used within an ActionContext Provider');
    }
    return context;
  };

  // Hook to get the dispatch function with full type safety
  const useAction = (): ActionRegister<T>['dispatch'] => {
    const context = useActionContext();
    
    return useMemo(() => {
      if (context.actionRegisterRef.current) {
        // Create bound dispatch function for consistency
        const register = context.actionRegisterRef.current;
        return register.dispatch.bind(register);
      }

      return (..._args: any[]) => {
        throw new Error(
          'ActionRegister is not initialized. ' +
          'Make sure the ActionContext Provider is properly set up.'
        );
      };
    }, [context.actionRegisterRef]);
  };

  // Hook to register action handlers with automatic cleanup
  const useActionHandler = <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ): void => {
    const { actionRegisterRef } = useActionContext();
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
  const useActionRegister = (): ActionRegister<T> | null => {
    const context = useActionContext();
    return context.actionRegisterRef.current;
  };

  return {
    Provider,
    useActionContext,
    useAction,
    useActionHandler,
    useActionRegister,
  };
}