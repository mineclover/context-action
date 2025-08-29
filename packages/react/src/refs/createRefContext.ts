/**
 * @fileoverview Simplified Reference Context V2
 * 
 * useRef 기반의 간소화된 참조 관리 시스템
 * RefStore 클래스 없이 직접 상태 관리
 */

import React, { createContext, useContext, useMemo, useRef, useCallback, ReactNode, useState, useEffect } from 'react';
import type { 
  RefTarget, 
  RefOperation, 
  RefOperationOptions, 
  RefOperationResult,
  RefDefinitions,
  InferRefTypes
} from './types';
import { useRefMount, useRefOperation, useRefPolling as useRefPollingHook, type InternalRefState, type RefPollingOptions } from './hooks';
import { ErrorHandlers } from '../stores/utils/error-handling';

// InternalRefState is now imported from ./hooks

/**
 * RefContext 반환 타입 - 향상된 타입 추론 지원
 */
export interface RefContextReturn<T> {
  Provider: React.FC<{ children: ReactNode }>;
  
  useRefHandler: <K extends keyof T>(refName: K) => {
    setRef: (target: T[K] | null) => void;
    target: T[K] | null;
    waitForMount: () => Promise<T[K]>;
    withTarget: <Result>(
      operation: RefOperation<T[K] & RefTarget, Result>,
      options?: RefOperationOptions
    ) => Promise<RefOperationResult<Result>>;
    isMounted: boolean;
    isWaitingForMount: boolean;
    onMount: (callback: (target: T[K]) => void) => () => void;
    executeIfMounted: <Result>(
      operation: (target: T[K] & RefTarget) => Result
    ) => Result | null;
  };
  
  useWaitForRefs: () => {
    <K extends keyof T>(...refNames: K[]): Promise<Pick<T, K>>;
    <K extends keyof T>(timeout: number, ...refNames: K[]): Promise<Pick<T, K>>;
  };
  useGetAllRefs: () => () => Partial<T>;
  useRefPolling: () => <K extends keyof T>(
    refName: K,
    options?: RefPollingOptions
  ) => {
    promise: Promise<T[K]>;
    cancel: () => void;
    isMounted: () => boolean;
  };
  
  contextName: string;
  refDefinitions?: T extends RefDefinitions ? T : undefined;
}

/**
 * createRefContext 옵션
 */
export interface CreateRefContextOptions {
  /** 글로벌 마운트 타임아웃 (ms). undefined면 타임아웃 없음 */
  defaultMountTimeout?: number;
  
  /** 개별 ref의 타임아웃 설정을 무시하고 타임아웃을 비활성화 */
  disableTimeout?: boolean;
}

/**
 * 간소화된 참조 컨텍스트 생성 함수 - 향상된 타입 추론
 */
export function createRefContext<T extends Record<string, RefTarget>>(
  contextName: string,
  options?: CreateRefContextOptions
): RefContextReturn<T>;

export function createRefContext<T extends RefDefinitions>(
  contextName: string,
  refDefinitions: T,
  options?: CreateRefContextOptions
): RefContextReturn<InferRefTypes<T>>;

export function createRefContext<T extends Record<string, any> | RefDefinitions>(
  contextName: string,
  refDefinitionsOrOptions?: T extends RefDefinitions ? T : CreateRefContextOptions,
  optionsWhenDefs?: CreateRefContextOptions
): T extends RefDefinitions 
  ? RefContextReturn<InferRefTypes<T>>
  : RefContextReturn<T> {
  
  // 파라미터 정규화 - 더 안전한 타입 처리
  const refDefinitions = (typeof refDefinitionsOrOptions === 'object' && 
    refDefinitionsOrOptions !== null &&
    Object.values(refDefinitionsOrOptions as any).some(
      (value: any) => value && typeof value === 'object' && 'name' in value
    )) ? (refDefinitionsOrOptions as unknown) as T extends RefDefinitions ? T : undefined : undefined;
  
  const options = refDefinitions ? optionsWhenDefs : refDefinitionsOrOptions as CreateRefContextOptions | undefined;
  
  const hasDefinitions = Boolean(refDefinitions);
  
  // Context 타입
  interface RefContextValue {
    refsMapRef: React.MutableRefObject<Map<string, InternalRefState<any>>>;
    definitionsRef: React.MutableRefObject<T extends RefDefinitions ? T : undefined>;
    optionsRef: React.MutableRefObject<CreateRefContextOptions | undefined>;
    subscribeToRef: (refName: string, listener: () => void) => () => void;
    getRefState: (refName: string) => InternalRefState<any>;
    setRefTarget: (refName: string, target: any) => void;
  }
  
  // Context 생성
  const RefContext = createContext<RefContextValue | null>(null);
  
  // Provider 컴포넌트
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 모든 ref 상태를 하나의 Map으로 관리
    const refsMapRef = useRef<Map<string, InternalRefState<any>>>(null!);
    
    // 초기화
    if (!refsMapRef.current) {
      const map = new Map<string, InternalRefState<any>>();
      
      // RefDefinitions가 있으면 미리 초기화
      if (hasDefinitions && refDefinitions) {
        Object.keys(refDefinitions).forEach((refName) => {
          map.set(refName, createInitialRefState());
        });
      }
      
      refsMapRef.current = map;
    }
    
    const definitionsRef = useRef<T extends RefDefinitions ? T : undefined>(
      refDefinitions as T extends RefDefinitions ? T : undefined
    );
    
    const optionsRef = useRef<CreateRefContextOptions | undefined>(options);
    
    // Provider 언마운트 시 모든 리소스 정리
    useEffect(() => {
      return () => {
        // 모든 ref 상태 정리
        if (refsMapRef.current) {
          refsMapRef.current.forEach((refState) => {
            // 진행 중인 Promise들 정리
            refState.mountRejectors.forEach(reject => {
              reject(new Error('Context provider unmounted'));
            });
            refState.mountResolvers.clear();
            refState.mountRejectors.clear();
            refState.mountPromise = null;
            
            // 콜백과 리스너 정리
            refState.mountCallbacks.clear();
            refState.listeners.clear();
            
            // 상태 초기화
            refState.target = null;
            refState.isMounted = false;
            refState.operationInProgress = false;
          });
          refsMapRef.current.clear();
        }
      };
    }, []);
    
    // ref 상태 구독 함수
    const subscribeToRef = useCallback((refName: string, listener: () => void) => {
      const refState = getOrCreateRefState(refsMapRef.current, refName);
      refState.listeners.add(listener);
      
      return () => {
        refState.listeners.delete(listener);
      };
    }, []);
    
    // ref 상태 가져오기
    const getRefState = useCallback((refName: string) => {
      return getOrCreateRefState(refsMapRef.current, refName);
    }, []);
    
    // ref target 설정
    const setRefTarget = useCallback((refName: string, target: any) => {
      const refState = getOrCreateRefState(refsMapRef.current, refName);
      
      if (target === null) {
        // Unmount
        refState.target = null;
        refState.isMounted = false;
        refState.mountPromise = null;
        
        // 알림
        refState.listeners.forEach(listener => listener());
      } else {
        // Mount
        refState.target = target;
        refState.isMounted = true;
        
        // 대기 중인 resolver들 실행
        refState.mountResolvers.forEach(resolve => resolve(target));
        refState.mountResolvers.clear();
        refState.mountRejectors.clear();
        refState.mountPromise = null;
        
        // 마운트 콜백들 실행
        refState.mountCallbacks.forEach(callback => {
          try {
            callback(target);
          } catch (error) {
            // Use standardized error handling (static import)
            ErrorHandlers.ref(
              'Error in mount callback',
              { 
                refName: String(refName),
                targetType: typeof target
              },
              error instanceof Error ? error : undefined
            );
          }
        });
        
        // 알림
        refState.listeners.forEach(listener => listener());
      }
    }, []);
    
    const contextValue = useMemo<RefContextValue>(() => ({
      refsMapRef,
      definitionsRef,
      optionsRef,
      subscribeToRef,
      getRefState,
      setRefTarget
    }), [subscribeToRef, getRefState, setRefTarget]);
    
    return React.createElement(
      RefContext.Provider,
      { value: contextValue },
      children
    );
  };
  
  // Enhanced context hook with disposal checking
  const useRefContext = () => {
    const context = useContext(RefContext);
    if (!context) {
      throw new Error(
        `useRefHandler must be used within ${contextName}.Provider. ` +
        `Wrap your component with <${contextName}.Provider>`
      );
    }
    
    // Disposal check would go here when implemented
    
    return context;
  };


  
  // 개별 ref 사용 hook - 리팩터링된 버전 (분리된 hooks 사용)
  const useRefHandler = <K extends keyof T>(refName: K) => {
    const { subscribeToRef, getRefState, setRefTarget, definitionsRef, optionsRef } = useRefContext();
    const refNameStr = String(refName);
    
    // 상태 변경 구독
    const [, forceUpdate] = useState({});
    
    useEffect(() => {
      const unsubscribe = subscribeToRef(refNameStr, () => {
        forceUpdate({});
      });
      return unsubscribe;
    }, [refNameStr, subscribeToRef]);
    
    // 현재 상태
    const refState = getRefState(refNameStr);
    
    // 분리된 hooks 사용
    const { waitForMount, onMount, isMounted, isWaitingForMount } = useRefMount(
      refState, 
      refNameStr, 
      optionsRef, 
      definitionsRef
    );
    
    const { withTarget, executeIfMounted } = useRefOperation(refState);
    
    return useMemo(() => ({
      setRef: (target: T[K] | null) => {
        setRefTarget(refNameStr, target);
      },
      get target(): T[K] | null {
        return refState.target;
      },
      waitForMount: () => waitForMount() as Promise<T[K]>,
      withTarget: withTarget as <Result>(
        operation: RefOperation<T[K] & RefTarget, Result>,
        options?: RefOperationOptions
      ) => Promise<RefOperationResult<Result>>,
      isMounted,
      isWaitingForMount,
      onMount: (callback: (target: T[K]) => void) => onMount(callback as (target: any) => void),
      executeIfMounted: executeIfMounted as <Result>(
        operation: (target: T[K] & RefTarget) => Result
      ) => Result | null
    }), [refState, setRefTarget, refNameStr, waitForMount, withTarget, executeIfMounted, onMount, isMounted, isWaitingForMount]);
  };
  
  // 여러 ref 동시 대기 hook
  const useWaitForRefs = () => {
    const { getRefState } = useRefContext();
    
    return useCallback(async <K extends keyof T>(...args: [number, ...K[]] | K[]): Promise<Pick<T, K>> => {
      // 첫 번째 인수가 숫자인지 확인하여 timeout과 refNames 분리
      let timeout: number | undefined;
      let refNames: K[];
      
      if (typeof args[0] === 'number') {
        timeout = args[0];
        refNames = args.slice(1) as K[];
      } else {
        timeout = 1000; // 기본 1초 타임아웃
        refNames = args as K[];
      }
      const promises = refNames.map(async (refName) => {
        const refNameStr = String(refName);
        const refState = getRefState(refNameStr);
        
        // 마운트 대기
        if (refState.target && refState.isMounted) {
          return [refName, refState.target] as const;
        }
        
        if (!refState.mountPromise) {
          refState.mountPromise = new Promise<any>((resolve, reject) => {
            refState.mountResolvers.add(resolve);
            refState.mountRejectors.add(reject);
          });
        }
        
        // 타임아웃 처리 (항상 적용됨)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Mount timeout after ${timeout}ms for ref '${refNameStr}'`));
          }, timeout);
        });
        
        const target = await Promise.race([refState.mountPromise, timeoutPromise]);
        return [refName, target] as const;
      });
      
      const results = await Promise.all(promises);
      return Object.fromEntries(results) as Pick<T, K>;
    }, [getRefState]);
  };
  
  // 모든 ref 상태 가져오기 hook
  const useGetAllRefs = () => {
    const { refsMapRef } = useRefContext();
    
    return useCallback((): Partial<T> => {
      const result: Partial<T> = {} as Partial<T>;
      
      refsMapRef.current.forEach((refState, refName) => {
        if (refState.target !== null && refState.isMounted) {
          (result as any)[refName] = refState.target;
        }
      });
      
      return result;
    }, [refsMapRef]);
  };
  
  // ref 폴링 유틸리티 hook - 리팩터링된 버전 (분리된 hook 사용)
  const useRefPolling = () => {
    const { getRefState } = useRefContext();
    const createPolling = useRefPollingHook();
    
    return useCallback(<K extends keyof T>(
      refName: K,
      options: RefPollingOptions = {}
    ) => {
      const refNameStr = String(refName);
      const refState = getRefState(refNameStr);
      
      return createPolling(refState, refNameStr, options) as {
        promise: Promise<T[K]>;
        cancel: () => void;
        isMounted: () => boolean;
      };
    }, [getRefState, createPolling]);
  };
  
  return {
    Provider,
    useRefHandler,
    useWaitForRefs,
    useGetAllRefs,
    useRefPolling,
    contextName,
    refDefinitions
  } as T extends RefDefinitions 
    ? RefContextReturn<InferRefTypes<T>>
    : RefContextReturn<T>;
}

// 헬퍼 함수: 초기 ref 상태 생성
function createInitialRefState<T>(): InternalRefState<T> {
  return {
    target: null,
    isMounted: false,
    mountPromise: null,
    mountResolvers: new Set(),
    mountRejectors: new Set(),
    operationInProgress: false,
    listeners: new Set(),
    mountCallbacks: new Set()
  };
}

// 헬퍼 함수: ref 상태 가져오기 또는 생성
function getOrCreateRefState<T>(
  refsMap: Map<string, InternalRefState<T>>,
  refName: string
): InternalRefState<T> {
  if (!refsMap.has(refName)) {
    refsMap.set(refName, createInitialRefState());
  }
  return refsMap.get(refName)!;
}