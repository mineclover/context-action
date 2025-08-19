/**
 * @fileoverview Declarative Action Pattern - Simplified action management system
 * 
 * Provides a simplified action system similar to createRefContext style with core functionality
 * without unnecessary complexity. Follows the Action Only Pattern for pure action dispatching
 * without state management dependencies.
 * 
 * @module actions/declarative-action-pattern
 */

import * as React from 'react';
import { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { ActionRegister, ActionHandler, HandlerConfig } from '@context-action/core';

/**
 * Declarative action definition combining payload types and configuration
 * 
 * Flexible action definition that supports both simple payload types and
 * extended configurations with handlers, priorities, and metadata.
 * 
 * @template T - The payload type for this action
 * 
 * @example Simple Action Definition
 * ```typescript
 * type UserActions = {
 *   updateProfile: { name: string; email: string }  // Simple payload
 *   deleteAccount: void                             // No payload
 * }
 * ```
 * 
 * @example Extended Action Definition
 * ```typescript
 * type UserActions = {
 *   updateProfile: {
 *     payload: { name: string; email: string }
 *     handler: ActionHandler<{ name: string; email: string }>
 *     priority: 100
 *     tags: ['user', 'profile']
 *   }
 * }
 * ```
 * 
 * @public
 */
export type ActionDefinition<T = any> = 
  | T  // 직접 페이로드 타입 (간단한 사용)
  | {  // 확장된 정의 (고급 사용)
      payload?: T;
      handler?: ActionHandler<T>;
      priority?: number;
      timeout?: number;
      tags?: string[];
      config?: HandlerConfig;
    };

/**
 * Action definitions mapping interface
 * 
 * Maps action names to their definitions, supporting both simple payload types
 * and extended configurations. Used as the foundation for type-safe action handling.
 * 
 * @example
 * ```typescript
 * const actions: ActionDefinitions = {
 *   login: { email: string; password: string },
 *   logout: void,
 *   updateProfile: {
 *     payload: { name: string },
 *     handler: async (payload, controller) => {
 *       await userService.updateProfile(payload)
 *     },
 *     priority: 100
 *   }
 * }
 * ```
 * 
 * @public
 */
export type ActionDefinitions = Record<string, ActionDefinition<any>>;

/**
 * Infer action payload types from action definitions
 * 
 * Utility type that extracts payload types from action definitions,
 * supporting both simple and extended definition formats.
 * 
 * @template T - Action definitions record
 * 
 * @example
 * ```typescript
 * const definitions = {
 *   updateUser: { name: string; email: string },
 *   deleteUser: { id: string },
 *   resetApp: void
 * }
 * 
 * type ActionTypes = InferActionTypes<typeof definitions>
 * // Result: {
 * //   updateUser: { name: string; email: string }
 * //   deleteUser: { id: string }
 * //   resetApp: void
 * // }
 * ```
 * 
 * @public
 */
export type InferActionTypes<T extends ActionDefinitions> = {
  [K in keyof T]: T[K] extends ActionDefinition<infer P> 
    ? P 
    : T[K] extends { payload: infer P }
      ? P
      : T[K];
};

/**
 * Unified definitions combining actions and refs for integrated patterns
 * 
 * Interface for defining both actions and refs together for future integration
 * with ref management systems. Currently focuses on actions with placeholder
 * support for refs.
 * 
 * @template A - Action definitions type
 * @template R - Refs definitions type
 * 
 * @example
 * ```typescript
 * const definitions: ActionRefDefinitions<UserActions, UserRefs> = {
 *   contextName: 'UserManagement',
 *   actions: {
 *     updateProfile: { name: string; email: string },
 *     deleteAccount: void
 *   },
 *   refs: {
 *     profileForm: HTMLFormElement,
 *     avatarInput: HTMLInputElement
 *   }
 * }
 * ```
 * 
 * @public
 */
export interface ActionRefDefinitions<
  A extends ActionDefinitions = ActionDefinitions,
  R extends Record<string, any> = Record<string, any>
> {
  actions: A;
  refs?: R;
  contextName?: string;
}

/**
 * Return type for DeclarativeActionContext pattern
 * 
 * Defines the complete API returned by createDeclarativeActionPattern,
 * including Provider component, action dispatch hooks, handler registration,
 * and direct ActionRegister access.
 * 
 * @template A - Action definitions type
 * 
 * @public
 */
export interface DeclarativeActionContextReturn<A extends ActionDefinitions> {
  // 핵심 컴포넌트
  Provider: React.FC<{ children: ReactNode }>;
  
  // 액션 디스패치
  useAction: () => <K extends keyof A>(
    action: K,
    payload?: InferActionTypes<A>[K]
  ) => Promise<void>;
  
  // 핸들러 등록 (런타임 오버라이드 가능)
  useActionHandler: <K extends keyof A>(
    action: K,
    handler: ActionHandler<InferActionTypes<A>[K]>,
    config?: HandlerConfig
  ) => void;
  
  // ActionRegister 직접 접근
  useActionRegister: () => ActionRegister<InferActionTypes<A>> | null;
  
  // 메타데이터
  contextName: string;
  actionDefinitions: A;
}

/**
 * Unified context return type combining actions and refs
 * 
 * Extended return type that includes both action management and ref management
 * capabilities for integrated patterns. Currently includes placeholder hooks
 * for future ref system integration.
 * 
 * @template A - Action definitions type
 * @template R - Refs definitions type
 * 
 * @public
 */
export interface DeclarativeActionRefContextReturn<
  A extends ActionDefinitions,
  R extends Record<string, any>
> extends DeclarativeActionContextReturn<A> {
  // Ref 관리 기능 (추후 통합 시)
  useRef?: <K extends keyof R>(refName: K) => any;
  useRefManager?: () => any;
}

/**
 * Overload 1: Actions only definition (basic usage)
 * 
 * Creates a declarative action pattern with only action definitions.
 * This is the most common usage for pure action dispatching scenarios.
 * 
 * @template A - Action definitions type
 * @param contextName - Name for the action context
 * @param actions - Action definitions mapping
 * @returns Action context with Provider, hooks, and utilities
 */
export function createDeclarativeActionPattern<A extends ActionDefinitions>(
  contextName: string,
  actions: A
): DeclarativeActionContextReturn<A>;

/**
 * Overload 2: Actions and refs unified definition (future expansion)
 * 
 * Creates a declarative action pattern with both actions and refs for
 * integrated patterns. Currently focuses on actions with placeholder
 * support for future ref integration.
 * 
 * @template A - Action definitions type
 * @template R - Refs definitions type
 * @param contextName - Name for the context
 * @param definitions - Unified definitions with actions and refs
 * @returns Extended context with action and ref capabilities
 */
export function createDeclarativeActionPattern<
  A extends ActionDefinitions,
  R extends Record<string, any>
>(
  contextName: string,
  definitions: ActionRefDefinitions<A, R>
): DeclarativeActionRefContextReturn<A, R>;

/**
 * Overload 3: Unified definition object
 * 
 * Creates a declarative action pattern from a unified definition object
 * that includes context name, actions, and optional refs.
 * 
 * @template A - Action definitions type
 * @template R - Refs definitions type
 * @param definitions - Complete definition object with context name
 * @returns Extended context with full capabilities
 */
export function createDeclarativeActionPattern<
  A extends ActionDefinitions,
  R extends Record<string, any> = Record<string, any>
>(
  definitions: ActionRefDefinitions<A, R>
): DeclarativeActionRefContextReturn<A, R>;

/**
 * Implementation function handling all overloads
 * 
 * Processes different overload parameters and delegates to the main
 * implementation function with normalized parameters.
 * 
 * @param contextNameOrDefinitions - Context name or unified definitions
 * @param actionsOrDefinitions - Action definitions or unified definitions
 * @returns Context implementation based on provided parameters
 * 
 * @internal
 */
export function createDeclarativeActionPattern(
  contextNameOrDefinitions: string | ActionRefDefinitions<any, any>,
  actionsOrDefinitions?: ActionDefinitions | ActionRefDefinitions<any, any>
): any {
  // 오버로드 파라미터 처리
  let contextName: string;
  let actionDefinitions: ActionDefinitions;
  let refDefinitions: Record<string, any> | undefined;

  if (typeof contextNameOrDefinitions === 'string') {
    // Overload 1 or 2: contextName이 첫 번째 파라미터
    contextName = contextNameOrDefinitions;
    
    if (actionsOrDefinitions && 'actions' in actionsOrDefinitions) {
      // Overload 2: 통합 정의
      const defs = actionsOrDefinitions as ActionRefDefinitions<any, any>;
      actionDefinitions = defs.actions;
      refDefinitions = defs.refs;
    } else {
      // Overload 1: 액션만
      actionDefinitions = actionsOrDefinitions as ActionDefinitions;
    }
  } else {
    // Overload 3: 통합 정의 객체
    const defs = contextNameOrDefinitions as ActionRefDefinitions<any, any>;
    contextName = defs.contextName || 'ActionContext';
    actionDefinitions = defs.actions;
    refDefinitions = defs.refs;
  }

  return createDeclarativeActionPatternImpl(contextName, actionDefinitions, refDefinitions);
}

/**
 * Main implementation function for declarative action pattern
 * 
 * Creates the complete action context with Provider component, action dispatch hooks,
 * handler registration capabilities, and direct ActionRegister access. Follows the
 * Action Only Pattern for pure action management without state dependencies.
 * 
 * @template A - Action definitions type
 * @template R - Refs definitions type (for future use)
 * 
 * @param contextName - Name identifier for the context
 * @param actionDefinitions - Map of action names to their definitions
 * @param refDefinitions - Optional ref definitions for future integration
 * 
 * @returns Complete action context API
 * 
 * @example Basic Usage
 * ```typescript
 * const UserActions = createDeclarativeActionPattern('UserActions', {
 *   login: { email: string; password: string },
 *   logout: void,
 *   updateProfile: {
 *     payload: { name: string; avatar?: string },
 *     handler: async (payload, controller) => {
 *       const result = await userService.updateProfile(payload)
 *       controller.setResult(result)
 *     },
 *     priority: 100,
 *     tags: ['user', 'profile']
 *   }
 * })
 * 
 * function App() {
 *   return (
 *     <UserActions.Provider>
 *       <UserProfile />
 *     </UserActions.Provider>
 *   )
 * }
 * 
 * function UserProfile() {
 *   const dispatch = UserActions.useAction()
 * 
 *   const handleLogin = async () => {
 *     await dispatch('login', { email: 'user@example.com', password: 'secret' })
 *   }
 * 
 *   const handleLogout = async () => {
 *     await dispatch('logout') // No payload needed
 *   }
 * 
 *   return <div>User Profile Component</div>
 * }
 * ```
 * 
 * @internal
 */
function createDeclarativeActionPatternImpl<
  A extends ActionDefinitions,
  R extends Record<string, any> = Record<string, any>
>(
  contextName: string,
  actionDefinitions: A,
  refDefinitions?: R
): DeclarativeActionContextReturn<A> {
  
  // Context 생성
  interface ActionContextValue {
    actionRegister: ActionRegister<InferActionTypes<A>>;
    actionDefinitions: A;
  }
  
  const ActionContext = createContext<ActionContextValue | null>(null);

  /**
   * Provider component for action context
   * 
   * Provides action register and definitions to child components.
   * Automatically registers any predefined handlers from action definitions.
   * 
   * @param props - Component props with children
   * @returns JSX provider element
   */
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const actionRegister = React.useMemo(() => {
      const register = new ActionRegister<InferActionTypes<A>>({ name: contextName });
      
      // 기본 핸들러들을 등록
      Object.entries(actionDefinitions).forEach(([actionName, definition]) => {
        if (typeof definition === 'object' && definition && 'handler' in definition && definition.handler) {
          const config: HandlerConfig = {
            priority: definition.priority || 0,
            timeout: definition.timeout,
            tags: definition.tags,
            ...definition.config
          };
          
          register.register(actionName as keyof InferActionTypes<A>, definition.handler, config);
        }
      });
      
      return register;
    }, []);

    const contextValue = useMemo<ActionContextValue>(() => ({
      actionRegister,
      actionDefinitions
    }), [actionRegister]);

    return React.createElement(
      ActionContext.Provider,
      { value: contextValue },
      children
    );
  };

  /**
   * Internal hook for accessing action context
   * 
   * Provides access to the action register and definitions with proper
   * error handling for usage outside of Provider.
   * 
   * @returns Action context value with register and definitions
   * @throws Error if used outside of Provider
   * 
   * @internal
   */
  const useActionContext = (): ActionContextValue => {
    const context = useContext(ActionContext);
    if (!context) {
      throw new Error(`useActionContext must be used within ${contextName}.Provider`);
    }
    return context;
  };

  /**
   * Hook for action dispatching
   * 
   * Returns a type-safe dispatch function that can trigger actions
   * with appropriate payload validation. The returned function is
   * memoized for performance optimization.
   * 
   * @returns Type-safe action dispatch function
   * 
   * @example
   * ```typescript
   * function MyComponent() {
   *   const dispatch = UserActions.useAction()
   * 
   *   const handleUpdate = async () => {
   *     // Type-safe dispatch with payload validation
   *     await dispatch('updateProfile', { name: 'John Doe' })
   *   }
   * 
   *   const handleReset = async () => {
   *     // No payload needed for void actions
   *     await dispatch('resetData')
   *   }
   * 
   *   return <button onClick={handleUpdate}>Update Profile</button>
   * }
   * ```
   */
  const useAction = () => {
    const { actionRegister } = useActionContext();
    
    return useCallback(<K extends keyof A>(
      action: K,
      payload?: InferActionTypes<A>[K]
    ) => {
      return actionRegister.dispatch(action, payload);
    }, [actionRegister]);
  };

  /**
   * Hook for runtime action handler registration
   * 
   * Allows components to register action handlers at runtime, overriding
   * or extending predefined handlers. Handlers are automatically cleaned up
   * when the component unmounts.
   * 
   * @template K - Action name key type
   * @param action - Name of the action to handle
   * @param handler - Handler function for the action
   * @param config - Optional handler configuration
   * 
   * @example
   * ```typescript
   * function UserProfile() {
   *   const dispatch = UserActions.useAction()
   * 
   *   // Register runtime handler with cleanup
   *   UserActions.useActionHandler('updateProfile', async (payload, controller) => {
   *     try {
   *       const result = await userService.updateProfile(payload)
   *       controller.setResult({ success: true, user: result })
   *     } catch (error) {
   *       controller.abort(`Update failed: ${error.message}`)
   *     }
   *   }, {
   *     priority: 200, // Higher priority than predefined handlers
   *     tags: ['runtime', 'user']
   *   })
   * 
   *   return <div>Profile Component</div>
   * }
   * ```
   */
  const useActionHandler = <K extends keyof A>(
    action: K,
    handler: ActionHandler<InferActionTypes<A>[K]>,
    config?: HandlerConfig
  ) => {
    const { actionRegister } = useActionContext();
    const handlerRef = React.useRef(handler);
    const configRef = React.useRef(config);
    const actionId = React.useId();

    // Update refs when dependencies change
    handlerRef.current = handler;
    configRef.current = config;

    React.useEffect(() => {
      // Register the handler with a unique ID
      const unregister = actionRegister.register(
        action,
        handlerRef.current,
        { ...configRef.current, id: actionId }
      );

      // Cleanup on unmount or when dependencies change
      return unregister;
     
    }, [action, actionId, actionRegister]);
  };

  /**
   * Hook for direct ActionRegister access
   * 
   * Provides direct access to the underlying ActionRegister instance
   * for advanced use cases like introspection, debugging, or custom
   * handler management.
   * 
   * @returns ActionRegister instance or null if outside Provider
   * 
   * @example
   * ```typescript
   * function DebugPanel() {
   *   const register = UserActions.useActionRegister()
   * 
   *   const handleInspect = () => {
   *     if (register) {
   *       const info = register.getRegistryInfo()
   *       console.log('Registered actions:', info.registeredActions)
   *       console.log('Handler count:', info.totalHandlers)
   *     }
   *   }
   * 
   *   return <button onClick={handleInspect}>Inspect Actions</button>
   * }
   * ```
   */
  const useActionRegister = (): ActionRegister<InferActionTypes<A>> | null => {
    const { actionRegister } = useActionContext();
    return actionRegister;
  };

  // 결과 반환
  const result: DeclarativeActionContextReturn<A> = {
    Provider,
    useAction,
    useActionHandler,
    useActionRegister,
    contextName,
    actionDefinitions
  };

  // Ref 기능이 포함된 경우 (향후 확장)
  if (refDefinitions) {
    // TODO: Ref 기능 통합
    return {
      ...result,
      useRef: undefined,
      useRefManager: undefined
    } as any;
  }

  return result;
}

/**
 * Action definition helper functions
 * 
 * Utility functions for creating action definitions with proper typing
 * and configuration. These helpers make it easier to define actions
 * with handlers, priorities, and other configuration options.
 */

/**
 * Simple action definition helper
 * 
 * Creates a basic action definition from a payload type.
 * Useful for simple actions without additional configuration.
 * 
 * @template T - Payload type
 * @param payload - Optional payload type (for type inference)
 * @returns Action definition
 * 
 * @example
 * ```typescript
 * const userActions = {
 *   updateName: action<{ name: string }>(),
 *   deleteAccount: action<void>(),
 *   login: action<{ email: string; password: string }>()
 * }
 * ```
 * 
 * @public
 */
export function action<T>(payload?: T): ActionDefinition<T> {
  return payload as ActionDefinition<T>;
}

/**
 * Action definition helper with handler
 * 
 * Creates an action definition that includes a predefined handler
 * and optional configuration. The handler will be automatically
 * registered when the Provider is created.
 * 
 * @template T - Payload type
 * @param payload - Payload type for type inference
 * @param handler - Action handler function
 * @param config - Optional handler configuration
 * @returns Extended action definition with handler
 * 
 * @example
 * ```typescript
 * const userActions = {
 *   login: actionWithHandler(
 *     { email: string; password: string },
 *     async (payload, controller) => {
 *       const result = await authService.login(payload)
 *       controller.setResult(result)
 *     },
 *     {
 *       priority: 100,
 *       timeout: 5000,
 *       tags: ['auth', 'login']
 *     }
 *   )
 * }
 * ```
 * 
 * @public
 */
export function actionWithHandler<T>(
  payload: T,
  handler: ActionHandler<T>,
  config?: {
    priority?: number;
    timeout?: number;
    tags?: string[];
  }
): ActionDefinition<T> {
  return {
    payload,
    handler,
    ...config
  };
}

/**
 * Action definition helper with configuration
 * 
 * Creates an action definition with comprehensive configuration options
 * including optional handler, priority, timeout, and tags.
 * 
 * @template T - Payload type
 * @param payload - Payload type for type inference
 * @param config - Configuration object with optional handler and settings
 * @returns Configured action definition
 * 
 * @example
 * ```typescript
 * const userActions = {
 *   updateProfile: actionWithConfig(
 *     { name: string; avatar?: string },
 *     {
 *       handler: async (payload, controller) => {
 *         await userService.updateProfile(payload)
 *       },
 *       priority: 50,
 *       timeout: 3000,
 *       tags: ['user', 'profile', 'update']
 *     }
 *   )
 * }
 * ```
 * 
 * @public
 */
export function actionWithConfig<T>(
  payload: T,
  config: {
    handler?: ActionHandler<T>;
    priority?: number;
    timeout?: number;
    tags?: string[];
  }
): ActionDefinition<T> {
  return {
    payload,
    ...config
  };
}