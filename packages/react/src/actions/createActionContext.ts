/**
 * @fileoverview Simple Action Context
 * 
 * createRefContext와 동일한 심플한 스타일의 액션 시스템
 * 불필요한 복잡성 없이 핵심 기능만 제공
 */

import React, { createContext, useContext, useEffect, useId, useMemo, useRef, ReactNode } from 'react';
import { ActionRegister, ActionHandler, HandlerConfig } from '@context-action/core';

/**
 * ActionContext 반환 타입 - 심플하고 명확한 API
 */
export interface SimpleActionContextReturn<T extends Record<string, any>> {
  // Provider 컴포넌트
  Provider: React.FC<{ children: ReactNode }>;
  
  // 액션 디스패치
  useAction: () => <K extends keyof T>(
    action: K,
    payload?: T[K]
  ) => Promise<void>;
  
  // 핸들러 등록
  useActionHandler: <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => void;
  
  // Context 이름
  contextName: string;
}

/**
 * 심플한 액션 컨텍스트 생성 함수
 * 
 * @param contextName 컨텍스트 이름
 * @returns ActionContext API
 * 
 * @example
 * ```typescript
 * // 타입 정의와 컨텍스트 생성
 * const AuthActions = createActionContext<{
 *   login: { username: string; password: string };
 *   logout: void;
 *   updateProfile: { name: string; email: string };
 * }>('AuthActions');
 * 
 * // 컴포넌트에서 사용
 * function AuthComponent() {
 *   const dispatch = AuthActions.useAction();
 *   
 *   // 핸들러 등록
 *   AuthActions.useActionHandler('login', async ({ username, password }) => {
 *     const response = await api.login(username, password);
 *     return response;
 *   });
 *   
 *   AuthActions.useActionHandler('logout', async () => {
 *     await api.logout();
 *   });
 *   
 *   return (
 *     <AuthActions.Provider>
 *       <button onClick={() => dispatch('login', { username: 'user', password: 'pass' })}>
 *         Login
 *       </button>
 *       <button onClick={() => dispatch('logout')}>
 *         Logout
 *       </button>
 *     </AuthActions.Provider>
 *   );
 * }
 * ```
 */
export function createActionContext<T extends Record<string, any>>(
  contextName: string
): SimpleActionContextReturn<T> {
  
  // Context 타입 정의
  interface ActionContextValue {
    actionRegister: ActionRegister<T>;
  }
  
  // Context 생성
  const ActionContext = createContext<ActionContextValue | null>(null);
  
  // Provider 컴포넌트
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // ActionRegister를 한 번만 생성
    const actionRegister = useMemo(() => new ActionRegister<T>({ name: contextName }), []);
    
    const contextValue = useMemo<ActionContextValue>(() => ({
      actionRegister
    }), [actionRegister]);
    
    return React.createElement(
      ActionContext.Provider,
      { value: contextValue },
      children
    );
  };
  
  // Context hook
  const useActionContext = (): ActionContextValue => {
    const context = useContext(ActionContext);
    if (!context) {
      throw new Error(`useAction must be used within ${contextName}.Provider`);
    }
    return context;
  };
  
  // 액션 디스패치 hook
  const useAction = () => {
    const { actionRegister } = useActionContext();
    
    return useMemo(() => {
      return <K extends keyof T>(action: K, payload?: T[K]) => {
        return actionRegister.dispatch(action, payload);
      };
    }, [actionRegister]);
  };
  
  // 핸들러 등록 hook
  const useActionHandler = <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => {
    const { actionRegister } = useActionContext();
    const handlerRef = useRef(handler);
    const actionId = useId();
    
    // Update ref when handler changes
    handlerRef.current = handler;
    
    useEffect(() => {
      // Register handler
      const unregister = actionRegister.register(
        action,
        handlerRef.current,
        { ...config, id: actionId }
      );
      
      // Cleanup on unmount
      return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [action, actionId, actionRegister]);
  };
  
  return {
    Provider,
    useAction,
    useActionHandler,
    contextName
  };
}