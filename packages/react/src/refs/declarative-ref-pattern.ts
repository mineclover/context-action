/**
 * @fileoverview Declarative Reference Pattern
 * 
 * 기존 Context-Action의 우수한 타입 추론과 선언적 관리 방식을 
 * 참조 관리에 적용한 새로운 패턴
 */

import * as React from 'react';
import { createContext, useContext, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { createActionContext } from '../actions/ActionContext';
import { RefStore, createRefStore } from './RefStore';
import type { ActionHandler } from '@context-action/core';
import type { 
  RefTarget,
  RefInitConfig,
  RefOperationOptions,
  RefOperationResult,
  RefOperation,
  RefActionPayloadMap
} from './types';

/**
 * 선언적 참조 정의 - 직접 값 또는 설정 객체
 */
export type RefDefinition<T extends RefTarget = RefTarget> = 
  | T // 직접 타입 (타입 추론용)
  | RefInitConfig<T>; // 설정 객체

/**
 * 참조 정의 맵
 */
export type RefDefinitions = Record<string, RefDefinition<any>>;

/**
 * 참조 정의로부터 타입 추론 (강화된 버전)
 */
export type InferRefTypes<T extends RefDefinitions> = {
  [K in keyof T]: T[K] extends RefInitConfig<infer R> 
    ? R 
    : T[K] extends RefTarget
      ? T[K]
      : never;
};

/**
 * 타입 안전성을 위한 추가 유틸리티 타입들
 */
export type ExtractRefType<T> = T extends RefInitConfig<infer R> ? R : 
  T extends RefDefinition<infer R> ? R : never;

export type RefDefinitionValue<T extends RefDefinitions, K extends keyof T> = 
  T[K] extends RefInitConfig<infer R> ? R : never;

/**
 * 런타임 타입 검증을 위한 타입 가드
 */
export interface TypeValidator<T extends RefTarget> {
  validate: (target: unknown) => target is T;
  expectedType: string;
  errorMessage?: string;
}

/**
 * DOM 요소 타입 검증기들
 */
export const DOMValidators = {
  HTMLElement: {
    validate: (target: unknown): target is HTMLElement => target instanceof HTMLElement,
    expectedType: 'HTMLElement'
  },
  HTMLCanvasElement: {
    validate: (target: unknown): target is HTMLCanvasElement => 
      target instanceof HTMLCanvasElement,
    expectedType: 'HTMLCanvasElement'
  },
  HTMLInputElement: {
    validate: (target: unknown): target is HTMLInputElement => 
      target instanceof HTMLInputElement,
    expectedType: 'HTMLInputElement'
  },
  HTMLDivElement: {
    validate: (target: unknown): target is HTMLDivElement => 
      target instanceof HTMLDivElement,
    expectedType: 'HTMLDivElement'
  }
} as const;


/**
 * 참조 에러 타입 정의
 */
export enum RefErrorCode {
  REF_NOT_FOUND = 'REF_NOT_FOUND',
  MOUNT_TIMEOUT = 'MOUNT_TIMEOUT',
  CLEANUP_FAILED = 'CLEANUP_FAILED',
  INVALID_TARGET = 'INVALID_TARGET',
  OPERATION_FAILED = 'OPERATION_FAILED',
  TYPE_VALIDATION_FAILED = 'TYPE_VALIDATION_FAILED',
  CONTEXT_NOT_FOUND = 'CONTEXT_NOT_FOUND'
}

export class RefError extends Error {
  constructor(
    message: string,
    public code: RefErrorCode,
    public refName: string,
    public operation?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'RefError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      refName: this.refName,
      operation: this.operation,
      cause: this.cause?.message,
      stack: this.stack
    };
  }
}

/**
 * 에러 복구 전략
 */
export interface ErrorRecoveryStrategy<T extends RefTarget = RefTarget> {
  strategy: 'retry' | 'fallback' | 'fail';
  maxRetries?: number;
  retryDelay?: number;
  fallbackValue?: T | (() => T | Promise<T>);
  onError?: (error: RefError) => void;
}

// 헬퍼 함수들을 re-export
export { customRef } from './helpers';
// domRef, threeRef는 examples/refs/ 디렉토리에서 참고하세요

/**
 * 액션과 참조를 함께 정의하는 통합 정의
 */
export interface RefActionDefinitions<
  R extends RefDefinitions = RefDefinitions,
  A extends RefActionPayloadMap = RefActionPayloadMap
> {
  refs: R;
  actions?: A;
  contextName: string;
}

/**
 * RefContext 반환 타입 - 향상된 타입 추론
 */
export interface DeclarativeRefContextReturn<
  R extends RefDefinitions,
  A extends RefActionPayloadMap = RefActionPayloadMap
> {
  // 핵심 컴포넌트
  Provider: React.FC<{ children: ReactNode }>;
  
  // 향상된 ref hooks
  useRef: <K extends keyof R>(refName: K, options?: {
    errorRecovery?: ErrorRecoveryStrategy<InferRefTypes<R>[K]>;
    validateOnSet?: boolean;
  }) => {
    store: RefStore<InferRefTypes<R>[K]>;
    setRef: (target: InferRefTypes<R>[K] | null) => void;
    ref: React.RefCallback<InferRefTypes<R>[K]>;
    target: InferRefTypes<R>[K] | null;
    isReady: boolean;
    waitForMount: () => Promise<InferRefTypes<R>[K]>;
    withTarget: <Result>(
      operation: RefOperation<InferRefTypes<R>[K], Result>,
      options?: RefOperationOptions
    ) => Promise<RefOperationResult<Result>>;
    error: Error | null;
    hasError: boolean;
    metadata: Record<string, any>;
  };
  
  useRefState: <K extends keyof R>(refName: K) => {
    target: InferRefTypes<R>[K] | null;
    isReady: boolean;
    isMounted: boolean;
    error: Error | null;
    metadata: Record<string, any>;
  };
  
  useRefValue: <K extends keyof R>(refName: K) => InferRefTypes<R>[K] | null;
  
  // 여러 참조 관리
  useRefs: <Keys extends (keyof R)[]>(
    ...refNames: Keys
  ) => {
    [I in keyof Keys]: Keys[I] extends keyof R 
      ? {
          target: InferRefTypes<R>[Keys[I]] | null;
          isReady: boolean;
          ref: (target: InferRefTypes<R>[Keys[I]] | null) => void; // React ref callback
          setRef: (target: InferRefTypes<R>[Keys[I]] | null) => void;
          withTarget: <Result>(
            operation: RefOperation<InferRefTypes<R>[Keys[I]], Result>,
            options?: RefOperationOptions
          ) => Promise<RefOperationResult<Result>>;
        }
      : never;
  };
  
  // 참조 관리자
  useRefManager: () => {
    getAllRefs: () => Partial<InferRefTypes<R>>;
    getRefState: <K extends keyof R>(refName: K) => {
      target: InferRefTypes<R>[K] | null;
      isReady: boolean;
      isMounted: boolean;
    };
    waitForRefs: <Keys extends (keyof R)[]>(
      ...refNames: Keys
    ) => Promise<{
      [K in Keys[number]]: K extends keyof R ? InferRefTypes<R>[K] : never;
    }>;
    withRefs: <Keys extends (keyof R)[], Result>(
      refNames: Keys,
      operation: (refs: {
        [K in Keys[number]]: K extends keyof R ? InferRefTypes<R>[K] : never;
      }) => Result | Promise<Result>,
      options?: RefOperationOptions
    ) => Promise<RefOperationResult<Result>>;
  };
  
  // 액션 시스템 (선택적)
  useAction?: () => <K extends keyof A>(
    action: K,
    payload?: A[K],
    options?: RefOperationOptions
  ) => Promise<void>;
  
  useActionHandler?: <K extends keyof A>(
    action: K,
    handler: ActionHandler<A[K]>,
    config?: any
  ) => void;
  
  // 메타데이터
  contextName: string;
  refDefinitions: R;
}

/**
 * Overload 1: 참조만 정의 (간단한 사용)
 */
export function createDeclarativeRefPattern<R extends RefDefinitions>(
  contextName: string,
  refs: R
): DeclarativeRefContextReturn<R>;

/**
 * Overload 2: 참조와 액션 통합 정의
 */
export function createDeclarativeRefPattern<
  R extends RefDefinitions,
  A extends RefActionPayloadMap
>(
  contextName: string,
  definitions: RefActionDefinitions<R, A>
): DeclarativeRefContextReturn<R, A>;

/**
 * Overload 3: 통합 정의 객체
 */
export function createDeclarativeRefPattern<
  R extends RefDefinitions,
  A extends RefActionPayloadMap = RefActionPayloadMap
>(
  definitions: RefActionDefinitions<R, A>
): DeclarativeRefContextReturn<R, A>;

/**
 * 구현 함수
 */
export function createDeclarativeRefPattern(
  contextNameOrDefinitions: string | RefActionDefinitions<any, any>,
  refsOrDefinitions?: RefDefinitions | RefActionDefinitions<any, any>
): any {
  // 오버로드 파라미터 처리
  let contextName: string;
  let refDefinitions: RefDefinitions;
  let actionDefinitions: RefActionPayloadMap | undefined;

  if (typeof contextNameOrDefinitions === 'string') {
    // Overload 1 or 2: contextName이 첫 번째 파라미터
    contextName = contextNameOrDefinitions;
    
    if (refsOrDefinitions && 'refs' in refsOrDefinitions) {
      // Overload 2: 통합 정의
      const defs = refsOrDefinitions as RefActionDefinitions<any, any>;
      refDefinitions = defs.refs;
      actionDefinitions = defs.actions;
    } else {
      // Overload 1: 참조만
      refDefinitions = refsOrDefinitions as RefDefinitions;
    }
  } else {
    // Overload 3: 통합 정의 객체
    const defs = contextNameOrDefinitions as RefActionDefinitions<any, any>;
    contextName = defs.contextName;
    refDefinitions = defs.refs;
    actionDefinitions = defs.actions;
  }

  return createDeclarativeRefPatternImpl(contextName, refDefinitions, actionDefinitions);
}

/**
 * 메인 구현 함수
 */
function createDeclarativeRefPatternImpl<
  R extends RefDefinitions,
  A extends RefActionPayloadMap = RefActionPayloadMap
>(
  contextName: string,
  refDefinitions: R,
  actionDefinitions?: A
): DeclarativeRefContextReturn<R, A> {
  
  // Context 생성
  interface RefContextValue {
    stores: Map<keyof R, RefStore<any>>;
    getStore: <K extends keyof R>(refName: K) => RefStore<InferRefTypes<R>[K]>;
  }
  
  const RefContext = createContext<RefContextValue | null>(null);
  
  // 액션 시스템 조건적 생성
  const actionContext = actionDefinitions 
    ? createActionContext<A>(contextName + 'Actions')
    : null;

  /**
   * Provider 컴포넌트
   */
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const storesMap = React.useMemo(() => {
      const map = new Map<keyof R, RefStore<any>>();
      
      // RefStore 생성
      for (const [refName, definition] of Object.entries(refDefinitions)) {
        let config: RefInitConfig<any>;
        
        if (definition && typeof definition === 'object' && 'objectType' in definition) {
          // 설정 객체
          config = { ...definition, name: definition.name || refName };
        } else {
          // 타입 추론용 정의 - 기본 DOM으로 처리
          config = {
            name: refName,
            objectType: 'dom',
            autoCleanup: true
          };
        }
        
        const store = createRefStore(config);
        map.set(refName as keyof R, store);
      }
      
      return map;
    }, []);

    const getStore = useCallback(<K extends keyof R>(refName: K): RefStore<InferRefTypes<R>[K]> => {
      const store = storesMap.get(refName);
      if (!store) {
        throw new Error(`RefStore '${String(refName)}' not found in context '${contextName}'`);
      }
      return store;
    }, [storesMap]);

    const contextValue = useMemo<RefContextValue>(() => ({
      stores: storesMap,
      getStore
    }), [storesMap, getStore]);

    // cleanup on unmount
    useEffect(() => {
      return () => {
        storesMap.forEach(store => {
          store.cleanup().catch(console.warn);
        });
      };
    }, [storesMap]);

    // Provider 렌더링
    if (actionContext) {
      return React.createElement(
        RefContext.Provider,
        { value: contextValue },
        React.createElement(actionContext.Provider, null, children)
      );
    } else {
      return React.createElement(
        RefContext.Provider,
        { value: contextValue },
        children
      );
    }
  };

  /**
   * RefContext hook
   */
  const useRefContext = (): RefContextValue => {
    const context = useContext(RefContext);
    if (!context) {
      throw new Error(`useRefContext must be used within ${contextName}.Provider`);
    }
    return context;
  };

  /**
   * 향상된 useRef hook (타입 검증 및 에러 처리 강화)
   */
  const useRef = <K extends keyof R>(refName: K, options?: {
    errorRecovery?: ErrorRecoveryStrategy<InferRefTypes<R>[K]>;
    validateOnSet?: boolean;
  }) => {
    const { getStore } = useRefContext();
    
    // Store 가져오기 (에러 처리 포함)
    const store = useMemo(() => {
      try {
        return getStore(refName);
      } catch (error) {
        throw new RefError(
          `RefStore '${String(refName)}' not found`,
          RefErrorCode.REF_NOT_FOUND,
          String(refName),
          'getStore',
          error instanceof Error ? error : undefined
        );
      }
    }, [getStore, refName]);

    const state = React.useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getSnapshot
    );
    
    // 성능 최적화: refDefinition을 memoize
    const refDefinition = React.useMemo(() => refDefinitions[refName], [refName]);

    // 타입 검증이 포함된 refCallback (최적화됨)
    const refCallback = useCallback((target: InferRefTypes<R>[K] | null) => {
      if (target && options?.validateOnSet !== false) {
        const config = refDefinition as RefInitConfig<InferRefTypes<R>[K]>;
        
        // 런타임 타입 검증 강화
        if (config?.validator) {
          try {
            if (!config.validator(target)) {
              const error = new RefError(
                `Type validation failed for ref '${String(refName)}': expected ${config.objectType} type`,
                RefErrorCode.TYPE_VALIDATION_FAILED,
                String(refName),
                'setRef'
              );
              
              // 에러 복구 처리 강화
              if (options?.errorRecovery?.onError) {
                options.errorRecovery.onError(error);
              }
              
              if (options?.errorRecovery?.strategy === 'fail') {
                throw error;
              } else if (options?.errorRecovery?.strategy === 'fallback') {
                const fallback = options?.errorRecovery?.fallbackValue;
                if (typeof fallback === 'function') {
                  try {
                    const fallbackResult = fallback();
                    target = fallbackResult instanceof Promise ? null : fallbackResult; // Promise는 동기적으로 처리 불가
                  } catch (fallbackError) {
                    console.warn(`Fallback function failed for ref '${String(refName)}':`, fallbackError);
                    target = null;
                  }
                } else if (fallback !== undefined) {
                  target = fallback;
                } else {
                  target = null; // fallback이 없으면 null로 설정
                }
              }
              // 'retry' strategy는 상위에서 처리
            }
          } catch (validationError) {
            // validator 함수 자체에서 에러가 발생한 경우
            const error = new RefError(
              `Validator function error for ref '${String(refName)}': ${validationError}`,
              RefErrorCode.TYPE_VALIDATION_FAILED,
              String(refName),
              'validator',
              validationError instanceof Error ? validationError : undefined
            );
            
            if (options?.errorRecovery?.onError) {
              options.errorRecovery.onError(error);
            }
            
            if (options?.errorRecovery?.strategy === 'fail') {
              throw error;
            } else {
              target = null; // 안전한 fallback
            }
          }
        }
      }
      
      store.setRef(target);
    }, [store, refName, refDefinition, options?.validateOnSet, options?.errorRecovery]);

    // Enhanced withTarget with error recovery
    const withTargetEnhanced = useCallback(async <Result>(
      operation: RefOperation<InferRefTypes<R>[K], Result>,
      operationOptions?: RefOperationOptions
    ) => {
      const maxRetries = options?.errorRecovery?.maxRetries || 0;
      const retryDelay = options?.errorRecovery?.retryDelay || 1000;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await store.withTarget(operation, operationOptions);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      // 모든 재시도 실패 시
      const refError = new RefError(
        `Operation failed after ${maxRetries + 1} attempts`,
        RefErrorCode.OPERATION_FAILED,
        String(refName),
        'withTarget',
        lastError!
      );

      if (options?.errorRecovery?.onError) {
        options.errorRecovery.onError(refError);
      }

      if (options?.errorRecovery?.strategy === 'fail') {
        throw refError;
      }

      // Fallback 결과 반환
      return {
        success: false,
        error: refError,
        timestamp: Date.now()
      } as RefOperationResult<Result>;
    }, [store, refName]);

    const stableObject = useMemo(() => ({
      // 기존 API 유지
      store,
      setRef: store.setRef,
      ref: refCallback, // React ref callback
      target: null as InferRefTypes<R>[K] | null,
      isReady: false,
      
      // 강화된 기능
      waitForMount: () => store.waitForMount(),
      withTarget: withTargetEnhanced,
      
      // 에러 정보
      error: null as Error | null,
      hasError: false,
      
      // 메타데이터
      metadata: {} as Record<string, any>
    }), [store, refCallback, withTargetEnhanced]);

    // Update the stable object properties with current state
    stableObject.target = state.value.target;
    stableObject.isReady = state.value.isReady;
    stableObject.error = state.value.error || null;
    stableObject.hasError = !!state.value.error;
    stableObject.metadata = state.value.metadata || {};

    return stableObject;
  };

  /**
   * useRefState hook
   */
  const useRefState = <K extends keyof R>(refName: K) => {
    const { getStore } = useRefContext();
    const store = getStore(refName);
    const state = React.useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getSnapshot
    );

    return useMemo(() => ({
      target: state.value.target,
      isReady: state.value.isReady,
      isMounted: state.value.isMounted,
      error: state.value.error || null,
      metadata: state.value.metadata || {}
    }), [state.value]);
  };

  /**
   * useRefValue hook - 값만 가져오기
   */
  const useRefValue = <K extends keyof R>(refName: K): InferRefTypes<R>[K] | null => {
    const { getStore } = useRefContext();
    const store = getStore(refName);
    const state = React.useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getSnapshot
    );
    return state.value.target;
  };

  /**
   * 여러 참조를 한 번에 관리하는 hook (API 일관성 개선)
   */
  const useRefs = <Keys extends (keyof R)[]>(...refNames: Keys) => {
    const { getStore } = useRefContext();
    
    return useMemo(() => {
      return refNames.map((refName) => {
        const store = getStore(refName);
        const state = store.getSnapshot();
        
        // 개별 ref에 대한 일관된 refCallback 생성
        const refCallback = (target: any) => store.setRef(target);
        
        return {
          target: state.value.target,
          isReady: state.value.isReady,
          ref: refCallback,       // ✅ 일관된 React ref callback
          setRef: store.setRef,   // ✅ 명시적 setter (기존 호환성)
          error: state.value.error || null,
          hasError: !!state.value.error,
          withTarget: <Result>(
            operation: RefOperation<any, Result>,
            options?: RefOperationOptions
          ) => store.withTarget(operation, options)
        };
      }) as {
        [I in keyof Keys]: Keys[I] extends keyof R 
          ? {
              target: InferRefTypes<R>[Keys[I]] | null;
              isReady: boolean;
              ref: React.RefCallback<InferRefTypes<R>[Keys[I]]>;
              setRef: (target: InferRefTypes<R>[Keys[I]] | null) => void;
              error: Error | null;
              hasError: boolean;
              withTarget: <Result>(
                operation: RefOperation<InferRefTypes<R>[Keys[I]], Result>,
                options?: RefOperationOptions
              ) => Promise<RefOperationResult<Result>>;
            }
          : never;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getStore]);
  };

  /**
   * 참조 관리자 hook
   */
  const useRefManager = () => {
    const { stores, getStore } = useRefContext();

    const waitForRefs = useCallback(async <Keys extends (keyof R)[]>(...refNames: Keys) => {
      const results = await Promise.all(
        refNames.map(async (refName) => {
          const store = getStore(refName);
          return await store.waitForMount();
        })
      );
      
      const resultObj = {} as any;
      refNames.forEach((refName, index) => {
        resultObj[refName] = results[index];
      });
      return resultObj;
    }, [getStore]);

    return useMemo(() => ({
      getAllRefs: (): Partial<InferRefTypes<R>> => {
        const result = {} as Partial<InferRefTypes<R>>;
        stores.forEach((store, refName) => {
          const state = store.getSnapshot();
          if (state.value.target) {
            (result as any)[refName] = state.value.target;
          }
        });
        return result;
      },
      
      getRefState: <K extends keyof R>(refName: K) => {
        const store = getStore(refName);
        const state = store.getSnapshot();
        return {
          target: state.value.target,
          isReady: state.value.isReady,
          isMounted: state.value.isMounted
        };
      },
      
      waitForRefs,
      
      withRefs: async <Keys extends (keyof R)[], Result>(
        refNames: Keys,
        operation: (refs: any) => Result | Promise<Result>,
        _options?: RefOperationOptions
      ): Promise<RefOperationResult<Result>> => {
        try {
          const refs = await waitForRefs(...refNames);
          const result = await operation(refs);
          return {
            success: true,
            result,
            timestamp: Date.now()
          };
        } catch (error) {
          return {
            success: false,
            error: error as Error,
            timestamp: Date.now()
          };
        }
      }
    }), [stores, getStore, waitForRefs]);
  };

  /**
   * 액션 관련 hooks (조건적)
   */
  const useAction = actionContext ? actionContext.useActionDispatch : (null as never);

  const useActionHandler = actionContext ? (<K extends keyof A>(
    action: K,
    handler: ActionHandler<A[K]>,
    config?: any
  ) => {
    actionContext.useActionHandler(action, handler, config);
  }) : (null as never);

  // 결과 반환
  const result: DeclarativeRefContextReturn<R, A> = {
    Provider,
    useRef,
    useRefState,
    useRefValue,
    useRefs,
    useRefManager,
    contextName,
    refDefinitions,
    ...(actionContext ? { useAction, useActionHandler } : {})
  } as DeclarativeRefContextReturn<R, A>;

  return result;
}