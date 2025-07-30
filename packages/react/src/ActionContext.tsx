import React, { createContext, ReactNode, useContext, useRef, useEffect, useId, useMemo } from 'react';
import { ActionPayloadMap, ActionRegister, ActionHandler, HandlerConfig, Logger, LogLevel, ConsoleLogger, OtelConsoleLogger, OtelContext, getLogLevelFromEnv } from '@context-action/core';

/**
 * Configuration options for createActionContext
 */
export interface ActionContextConfig {
  /** Custom logger implementation. Defaults to ConsoleLogger */
  logger?: Logger
  /** Log level for the logger. Defaults to ERROR if not provided */
  logLevel?: LogLevel
  /** OpenTelemetry context for tracing */
  otelContext?: OtelContext
  /** Whether to use OTEL-aware logger. Defaults to false */
  useOtel?: boolean
}

/**
 * Context type for ActionRegister
 */
export interface ActionContextType<T extends ActionPayloadMap = ActionPayloadMap> {
  actionRegisterRef: React.RefObject<ActionRegister<T>>;
  logger: Logger;
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
}

/**
 * Create a React Context for sharing ActionRegister instance across components
 * @template T - The action payload map type
 * @param config 로거 설정 (선택사항)
 * @returns Object containing Provider component and hooks for action management
 * @example
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   increment: void;
 *   setCount: number;
 * }
 * 
 * const { Provider, useAction, useActionHandler } = createActionContext<AppActions>({
 *   logLevel: LogLevel.DEBUG,
 *   useOtel: true
 * });
 * 
 * function App() {
 *   return (
 *     <Provider>
 *       <Counter />
 *     </Provider>
 *   );
 * }
 * 
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   const dispatch = useAction();
 *   
 *   useActionHandler('increment', () => setCount(prev => prev + 1));
 *   
 *   return (
 *     <button onClick={() => dispatch('increment')}>
 *       Count: {count}
 *     </button>
 *   );
 * }
 * ```
 */
export function createActionContext<T extends ActionPayloadMap = ActionPayloadMap>(config?: ActionContextConfig): ActionContextReturn<T> {

  const ActionContext = createContext<ActionContextType<T> | null>(null);

  /**
   * Provider 컴포넌트
   * ActionRegister 인스턴스를 Context로 제공합니다
   */
  const Provider = ({ children }: { children: ReactNode }) => {
    // 로거 설정
    const envLogLevel = getLogLevelFromEnv()
    const configLogLevel = config?.logLevel ?? envLogLevel
    
    let logger: Logger
    if (config?.logger) {
      logger = config.logger
    } else if (config?.useOtel) {
      logger = new OtelConsoleLogger(configLogLevel)
    } else {
      logger = new ConsoleLogger(configLogLevel)
    }
    
    // OTEL 컨텍스트 설정
    if (config?.otelContext && logger instanceof OtelConsoleLogger) {
      logger.setContext(config.otelContext)
    }
    
    const actionRegisterRef = useRef(new ActionRegister<T>({
      logger,
      logLevel: configLogLevel,
      useOtel: config?.useOtel,
      otelContext: config?.otelContext
    }));
    
    logger.debug('ActionContext Provider initialized', { 
      logLevel: configLogLevel,
      useOtel: config?.useOtel ?? false,
      hasOtelContext: !!config?.otelContext
    })
    
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
          context.logger.trace('useAction dispatch called', { action, payload });
          return boundDispatch(action, payload);
        }) as ActionRegister<T>['dispatch'];
      }

      return (...args: any[]) => {
        context.logger.error('ActionRegister is not initialized', { args });
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
        logger.error('ActionRegister is not initialized in useActionHandler');
        throw new Error(
          'ActionRegister is not initialized. ' +
          'Make sure the ActionContext Provider is properly set up.'
        );
      }

      logger.debug('useActionHandler registering', {
        action: String(action),
        componentId,
        priority: config?.priority ?? 0,
        blocking: config?.blocking ?? false
      });
      
      const actionRegister = actionRegisterRef.current;
      const unregister = actionRegister.register(
        action,
        handler,
        { ...config, id: config?.id || componentId }
      );
      
      return () => {
        logger.debug('useActionHandler unregistering', {
          action: String(action),
          componentId
        });
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
