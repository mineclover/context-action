/**
 * @fileoverview Simple Action Context
 * 
 * createRefContext와 동일한 심플한 스타일의 액션 시스템
 * 불필요한 복잡성 없이 핵심 기능만 제공
 */

import * as React from 'react';
import { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { ActionRegister, ActionHandler, HandlerConfig, ActionRegisterConfig } from '@context-action/core';
import type { RefActionPayloadMap } from '../refs/types';

/**
 * 선언적 액션 정의 - 페이로드 타입과 설정을 통합
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
 * 액션 정의 맵
 */
export type ActionDefinitions = Record<string, ActionDefinition<any>>;

/**
 * 액션 정의로부터 페이로드 타입 추론
 */
export type InferActionTypes<T extends ActionDefinitions> = {
  [K in keyof T]: T[K] extends ActionDefinition<infer P> 
    ? P 
    : T[K] extends { payload: infer P }
      ? P
      : T[K];
};

/**
 * 액션과 참조를 함께 정의하는 통합 정의
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
 * DeclarativeActionContext 반환 타입
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
 * 통합 Context 반환 타입 (Actions + Refs)
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
 * Overload 1: 액션만 정의 (기본 사용)
 */
export function createDeclarativeActionPattern<A extends ActionDefinitions>(
  contextName: string,
  actions: A
): DeclarativeActionContextReturn<A>;

/**
 * Overload 2: 액션과 참조 통합 정의 (향후 확장)
 */
export function createDeclarativeActionPattern<
  A extends ActionDefinitions,
  R extends Record<string, any>
>(
  contextName: string,
  definitions: ActionRefDefinitions<A, R>
): DeclarativeActionRefContextReturn<A, R>;

/**
 * Overload 3: 통합 정의 객체
 */
export function createDeclarativeActionPattern<
  A extends ActionDefinitions,
  R extends Record<string, any> = Record<string, any>
>(
  definitions: ActionRefDefinitions<A, R>
): DeclarativeActionRefContextReturn<A, R>;

/**
 * 구현 함수
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
 * 메인 구현 함수
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
   * Provider 컴포넌트
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
   * ActionContext hook
   */
  const useActionContext = (): ActionContextValue => {
    const context = useContext(ActionContext);
    if (!context) {
      throw new Error(`useActionContext must be used within ${contextName}.Provider`);
    }
    return context;
  };

  /**
   * 액션 디스패치 hook
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
   * 액션 핸들러 등록 hook (런타임 오버라이드)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [action, actionId, actionRegister]);
  };

  /**
   * ActionRegister 직접 접근 hook
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
 * 액션 정의 헬퍼 함수들
 */

/**
 * 간단한 액션 정의 헬퍼
 */
export function action<T>(payload?: T): ActionDefinition<T> {
  return payload as ActionDefinition<T>;
}

/**
 * 핸들러와 함께 액션 정의 헬퍼
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
 * 설정과 함께 액션 정의 헬퍼
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