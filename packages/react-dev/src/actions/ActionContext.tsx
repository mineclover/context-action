import React, { createContext, ReactNode, useContext, useRef, useEffect, useId, useMemo } from 'react';
import { ActionPayloadMap, ActionRegister, ActionHandler, HandlerConfig, ActionRegisterConfig } from '@context-action/core-dev';
import { Logger, LogLevel, createLogger, LogArtHelpers } from '@context-action/logger';

/**
 * @fileoverview createActionContext - Advanced type-safe action context factory
 * Provides enhanced type compatibility and automatic type inference for complex applications
 * 
 * @implements actioncontext
 * @implements viewmodel-layer
 * @implements mvvm-pattern
 * @memberof api-terms
 */

/**
 * Configuration options for createActionContext
 * Enhanced configuration with stronger type safety than ActionProvider
 */
export interface ActionContextConfig extends ActionRegisterConfig {
  /** Custom logger implementation. Defaults to ConsoleLogger */
  logger?: Logger
  /** Log level for the logger. Defaults to ERROR if not provided */
  logLevel?: LogLevel
  /** Name identifier for this ActionRegister instance */
  name?: string
  /** Whether to enable debug mode with additional logging */
  debug?: boolean
}

/**
 * Context type for ActionRegister with enhanced type safety
 * Provides stronger type inference than ActionProvider approach
 */
export interface ActionContextType<T extends ActionPayloadMap = ActionPayloadMap> {
  actionRegisterRef: React.RefObject<ActionRegister<T>>;
  logger: Logger;
}

/**
 * Return type for createActionContext
 * Provides automatic type inference for all hooks and components
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
}

/**
 * Create a React Context for sharing ActionRegister instance with enhanced type safety
 * 
 * **Primary recommendation for complex applications requiring strong type inference.**
 * This approach provides automatic type propagation and eliminates the need for 
 * manual type annotations in component code.
 * 
 * ## Key Advantages over ActionProvider:
 * - **Automatic Type Inference**: Define types once, use everywhere without manual annotations
 * - **Enhanced Type Safety**: Stronger compile-time checking for action payloads
 * - **Cleaner Component Code**: No need for `useActionDispatch<T>()` type parameters
 * - **Better IDE Support**: Superior autocomplete and error detection
 * 
 * ## Usage Patterns:
 * ```typescript
 * // 1. Define your action types once
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string };
 *   calculateTotal: void;
 *   fetchData: { endpoint: string };
 * }
 * 
 * // 2. Create typed context (types are locked in)
 * const { Provider, useAction, useActionHandler } = createActionContext<AppActions>({
 *   logLevel: LogLevel.DEBUG
 * });
 * 
 * // 3. Setup providers
 * function App() {
 *   return (
 *     <Provider>
 *       <UserProfile />
 *       <Calculator />
 *     </Provider>
 *   );
 * }
 * 
 * // 4. Use in components (automatic type inference)
 * function UserProfile() {
 *   const dispatch = useAction(); // ← No type annotation needed!
 *   
 *   // Fully typed dispatch calls with autocomplete
 *   const handleUpdate = () => {
 *     dispatch('updateUser', { id: '1', name: 'John' }); // ← Types enforced
 *   };
 *   
 *   // Handler registration with automatic type inference
 *   useActionHandler('updateUser', async (payload) => {
 *     // payload is automatically typed as { id: string; name: string }
 *     console.log(payload.id, payload.name);
 *   });
 *   
 *   return <button onClick={handleUpdate}>Update User</button>;
 * }
 * ```
 * 
 * ## When to use createActionContext vs ActionProvider:
 * - **createActionContext**: Complex apps, strong typing needs, team development
 * - **ActionProvider**: Simple apps, flexible typing, quick prototypes
 * 
 * @template T - The action payload map type (defined once, used everywhere)
 * @param config Configuration for ActionRegister with enhanced options
 * @returns Object containing Provider component and fully-typed hooks
 */
export function createActionContext<T extends ActionPayloadMap = ActionPayloadMap>(config?: ActionContextConfig): ActionContextReturn<T> {

  if (process.env.NODE_ENV === 'development' && config?.debug) {
    console.log(
      '🎯 createActionContext: Enhanced type-safe action context initialized\n' +
      'Features: Automatic type inference, stronger type safety, cleaner component code'
    );
  }

  const ActionContext = createContext<ActionContextType<T> | null>(null);

  /**
   * Enhanced Provider component with automatic type inference
   * Provides stronger type safety than generic ActionProvider
   */
  const Provider = ({ children }: { children: ReactNode }) => {
    const logger = config?.logger || createLogger(config?.logLevel);
    
    const actionRegisterRef = useRef(new ActionRegister<T>({
      logger,
      logLevel: config?.logLevel,
      name: config?.name || 'EnhancedActionContext',
      debug: config?.debug
    }));
    
    return (
      <ActionContext.Provider value={{ actionRegisterRef, logger }}>
        {children}
      </ActionContext.Provider>
    );
  };

  /**
   * Context 접근 hook
   * @returns ActionContextType - ActionRegister 참조를 포함한 컨텍스트
   * @throws Error - Provider 외부에서 사용될 경우
   */
  const useActionContext = () => {
    const context = useContext(ActionContext);
    if (!context) {
      throw new Error('useActionContext must be used within Provider');
    }
    return context;
  };

  /**
   * dispatch 함수 반환 hook
   * @returns ActionRegister의 dispatch 함수
   * @throws Error - Provider 외부에서 사용될 경우
   */
  const useAction = (): ActionRegister<T>['dispatch'] => {
    const context = useContext(ActionContext);
    
    if (!context) {
      throw new Error(
        'useAction must be used within Provider. ' +
        'Make sure your component is wrapped with the ActionContext Provider.'
      );
    }

    /** strict mode */
    if (!(context.actionRegisterRef.current instanceof ActionRegister)) {
      throw new Error(
        'ActionRegister is not initialized. ' +
        'Make sure the ActionContext Provider is properly set up.'
      );
    }

    const dispatch = useMemo(() => {
      if (context.actionRegisterRef.current instanceof ActionRegister) {
        const boundDispatch = context.actionRegisterRef.current.dispatch.bind(context.actionRegisterRef.current);
        
        // 로거를 포함한 dispatch 래퍼
        return ((action: any, payload?: any) => {
          context.logger.debug(LogArtHelpers.react.debug('액션 디스패치 호출', { action, payload }));
          return boundDispatch(action, payload);
        }) as ActionRegister<T>['dispatch'];
      }

      return (..._args: any[]) => {
        context.logger.error(LogArtHelpers.react.error('액션 디스패치', 'ActionRegister가 초기화되지 않음'));
        throw new Error(
          'ActionRegister is not initialized. ' +
          'Make sure the ActionContext Provider is properly set up.'
        );
      }
    }, [context.actionRegisterRef.current, context.logger]);

    return dispatch;
  };

  /**
   * Action Handler 등록 hook
   * @template K - 액션 키 타입
   * @param action - 등록할 액션 이름
   * @param handler - 액션 처리 함수
   * @param config - 핸들러 설정 (선택사항)
   * @description 성능 최적화를 위해 handler는 useCallback으로 메모이제이션하는 것을 권장합니다
   */
  const useActionHandler = <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => {
    const { actionRegisterRef, logger } = useActionContext();
    const componentId = useId();

    useEffect(() => {
      if (!actionRegisterRef.current) {
        logger.error(LogArtHelpers.react.error('핸들러 등록', 'ActionRegister가 초기화되지 않음'));
        throw new Error(
          'ActionRegister is not initialized. ' +
          'Make sure the ActionContext Provider is properly set up.'
        );
      }

      logger.debug(LogArtHelpers.react.debug('핸들러 등록 시작', {
        action: String(action),
        componentId,
        priority: config?.priority ?? 0,
        blocking: config?.blocking ?? false
      }));
      
      const actionRegister = actionRegisterRef.current;
      const unregister = actionRegister.register(
        action,
        handler,
        { ...config, id: config?.id || componentId }
      );
      
      return () => {
        logger.debug(LogArtHelpers.react.debug('핸들러 등록 해제', {
          action: String(action),
          componentId
        }));
        unregister();
      };
    }, [action, handler, config?.id, config?.priority, config?.blocking, componentId, actionRegisterRef.current, logger]);
  };

  return {
    Provider,
    useActionContext,
    useAction,
    useActionHandler,
  };
}
