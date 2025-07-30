import React, { createContext, ReactNode, useContext, useRef, useEffect, useId } from 'react';
import { ActionPayloadMap, ActionRegister, ActionHandler, HandlerConfig } from '@context-action/core';

/**
 * Context type for ActionRegister
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
}

/**
 * Create a React Context for sharing ActionRegister instance across components
 * @template T - The action payload map type
 * @returns Object containing Provider component and hooks for action management
 * @example
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   increment: void;
 *   setCount: number;
 * }
 * 
 * const { Provider, useAction, useActionHandler } = createActionContext<AppActions>();
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
export function createActionContext<T extends ActionPayloadMap = ActionPayloadMap>(): ActionContextReturn<T> {

  const ActionContext = createContext<ActionContextType<T> | null>(null);

  /**
   * Provider 컴포넌트
   * ActionRegister 인스턴스를 Context로 제공합니다
   */
  const Provider = ({ children }: { children: ReactNode }) => {
    const actionRegisterRef = useRef(new ActionRegister<T>());
    return (
      <ActionContext.Provider value={{ actionRegisterRef }}>
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
    
    if (!context || !context.actionRegisterRef.current) {
      /**
       * Provider 외부에서 사용되거나 actionRegister가 없는 경우
       * 에러를 던지는 함수를 반환합니다
       */
      return (...args: any[]) => {
        throw new Error(
          `useAction dispatch called outside of Provider context. ` +
          `Action: ${args[0]}, Payload: ${JSON.stringify(args[1] || 'undefined')}. ` +
          `Make sure your component is wrapped with the ActionContext Provider.`
        );
      } 
    }
    
    return context.actionRegisterRef.current.dispatch;
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
    const { actionRegisterRef } = useActionContext();
    const componentId = useId();

    console.log('useActionHandler:',action, handler, config);
    
    useEffect(() => {
      const actionRegister = actionRegisterRef.current!;
      const unregister = actionRegister.register(
        action,
        handler,
        { ...config, id: config?.id || componentId }
      );
      
      return unregister;
    }, [action, handler, config, componentId, actionRegisterRef]);
  };

  return {
    Provider,
    useActionContext,
    useAction,
    useActionHandler,
  };
}
