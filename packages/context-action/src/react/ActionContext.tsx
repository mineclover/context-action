import React, { createContext, ReactNode, useContext, useRef, useEffect, useId } from 'react';
import { ActionPayloadMap, ActionRegister, ActionHandler, HandlerConfig } from '../core';

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
  useAction: () => ActionRegister<T>;
  useActionHandler: <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => void;
}

/**
 * ActionRegister를 Context로 공유할 수 있는 헬퍼 함수
 * @returns Provider, hooks를 포함한 객체
 */
export function createActionContext<T extends ActionPayloadMap = ActionPayloadMap>(): ActionContextReturn<T> {

  const ActionContext = createContext<ActionContextType<T> | null>(null);

  // Provider 컴포넌트
  const Provider = ({ children }: { children: ReactNode }) => {
    const actionRegisterRef = useRef(new ActionRegister<T>());
    return (
      <ActionContext.Provider value={{ actionRegisterRef }}>
        {children}
      </ActionContext.Provider>
    );
  };

  // Context 접근 hook
  const useActionContext = () => {
    const context = useContext(ActionContext);
    if (!context) {
      throw new Error('useActionContext must be used within Provider');
    }
    return context;
  };

  // ActionRegister 인스턴스 반환 hook
  const useAction = () => {
    const { actionRegisterRef } = useActionContext();
    return actionRegisterRef.current!;
  };

  // Action Handler 등록 hook
  const useActionHandler = <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => {
    const actionRegister = useAction();
    const componentId = useId();
    
    useEffect(() => {
      const unregister = actionRegister.register(
        action,
        handler,
        { ...config, id: config?.id || componentId }
      );
      
      return unregister;
    }, [action, handler, config, componentId, actionRegister]);
  };

  return {
    Provider,
    useActionContext,
    useAction,
    useActionHandler,
  };
}
