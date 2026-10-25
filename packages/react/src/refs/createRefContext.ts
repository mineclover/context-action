/**
 * @fileoverview Simplified Reference Context V2
 * 
 * useRef 기반의 간소화된 참조 관리 시스템
 * RefStore 클래스 없이 직접 상태 관리
 */

import React, { createContext, useContext, useMemo, useRef, useCallback, ReactNode, useInsertionEffect } from 'react';
import type { 
  RefTarget, 
  RefOperation, 
  RefOperationOptions, 
  RefOperationResult,
  RefDefinitions,
  InferRefTypes
} from './types';
import { useRefMount, useRefOperation, useRefPolling as useRefPollingHook, useRefMountState, useOnMountStateChange, useRefMountChecker, type InternalRefState, type RefPollingOptions } from './hooks';
import { ErrorHandlers } from '../stores/utils/error-handling';
import { disposeRefState, refDisposedError, waitForRefMount } from './ref-state';

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
  
  useRefMountState: <K extends keyof T>(refName: K) => {
    isMounted: boolean;
    isWaitingForMount: boolean;
    mountedTarget: T[K] | null;
  };
  
  useOnMountStateChange: <K extends keyof T>(
    refName: K,
    callback: (mounted: boolean, target: T[K] | null) => void
  ) => void;
  
  useRefMountChecker: <K extends keyof T>(refName: K) => () => {
    isMounted: boolean;
    isWaitingForMount: boolean;
    target: T[K] | null;
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
export function createRefContext<T extends object>(
  contextName: string,
  options?: CreateRefContextOptions
): RefContextReturn<T>;

export function createRefContext<T extends RefDefinitions>(
  contextName: string,
  refDefinitions: T,
  options?: CreateRefContextOptions
): RefContextReturn<InferRefTypes<T>>;

export function createRefContext<T extends object | RefDefinitions>(
  contextName: string,
  refDefinitionsOrOptions?: T extends RefDefinitions ? T : CreateRefContextOptions,
  optionsWhenDefs?: CreateRefContextOptions
): T extends RefDefinitions 
  ? RefContextReturn<InferRefTypes<T>>
  : RefContextReturn<T> {
  
  // 파라미터 정규화 - 더 안전한 타입 처리
  const refDefinitions = (typeof refDefinitionsOrOptions === 'object' && 
    refDefinitionsOrOptions !== null &&
    Object.values(refDefinitionsOrOptions as object).some(
      (value: unknown) => value !== null && typeof value === 'object' && 'name' in value
    )) ? (refDefinitionsOrOptions as unknown) as T extends RefDefinitions ? T : undefined : undefined;
  
  const options = refDefinitions ? optionsWhenDefs : refDefinitionsOrOptions as CreateRefContextOptions | undefined;
  
  const hasDefinitions = Boolean(refDefinitions);
  
  // Context 타입
  interface RefContextValue {
    refsMapRef: React.MutableRefObject<Map<string, InternalRefState<RefTarget>>>;
    definitionsRef: React.MutableRefObject<T extends RefDefinitions ? T : undefined>;
    optionsRef: React.MutableRefObject<CreateRefContextOptions | undefined>;
    getRefState: (refName: string) => InternalRefState<RefTarget>;
    setRefTarget: (refName: string, target: RefTarget) => void;
  }
  
  // Context 생성
  const RefContext = createContext<RefContextValue | null>(null);
  
  // Provider 컴포넌트
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 모든 ref 상태를 하나의 Map으로 관리
    const refsMapRef = useRef<Map<string, InternalRefState<RefTarget>>>(null!);
    
    // 초기화
    if (!refsMapRef.current) {
      const map = new Map<string, InternalRefState<RefTarget>>();
      
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
    const disposedRef = useRef(false);
    
    // Ref state belongs to the logical Provider lifetime, like Action/Store
    // resources. StrictMode replay and Activity hiding are not actual unmounts.
    useInsertionEffect(() => {
      return () => {
        disposedRef.current = true;
        // 모든 ref 상태 정리
        if (refsMapRef.current) {
          refsMapRef.current.forEach(disposeRefState);
          refsMapRef.current.clear();
        }
      };
    }, []);
    
    // ref 상태 가져오기
    const getRefState = useCallback((refName: string) => {
      if (disposedRef.current) throw refDisposedError();
      return getOrCreateRefState(refsMapRef.current, refName);
    }, []);
    
    // ref target 설정
    const setRefTarget = useCallback((refName: string, target: RefTarget) => {
      if (disposedRef.current) return;
      const refState = getOrCreateRefState(refsMapRef.current, refName);
      
      if (target === null) {
        // Unmount
        refState.target = null;
        refState.isMounted = false;
        
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
      getRefState,
      setRefTarget
    }), [getRefState, setRefTarget]);
    
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
    const { getRefState, setRefTarget, definitionsRef, optionsRef } = useRefContext();
    const refNameStr = String(refName);
    
    // 현재 상태
    const refState = getRefState(refNameStr);
    // A callback ref can attach before passive subscriptions are installed.
    // useSyncExternalStore checks again at commit so the initial mount is not lost.
    const { isMounted, isWaitingForMount } = useRefMountState(refState);
    
    // 분리된 hooks 사용
    const { waitForMount, onMount } = useRefMount(
      refState, 
      refNameStr, 
      optionsRef, 
      definitionsRef
    );
    
    const { withTarget, executeIfMounted } = useRefOperation(refState);
    const setRef = useCallback((target: T[K] | null) => {
      setRefTarget(refNameStr, target);
    }, [refNameStr, setRefTarget]);
    
    return useMemo(() => ({
      setRef,
      get target(): T[K] | null {
        return refState.target as T[K] | null;
      },
      waitForMount: () => waitForMount() as Promise<T[K]>,
      withTarget: withTarget as <Result>(
        operation: RefOperation<T[K] & RefTarget, Result>,
        options?: RefOperationOptions
      ) => Promise<RefOperationResult<Result>>,
      isMounted,
      isWaitingForMount,
      onMount: (callback: (target: T[K]) => void) => onMount(callback as (target: RefTarget) => void),
      executeIfMounted: executeIfMounted as <Result>(
        operation: (target: T[K] & RefTarget) => Result
      ) => Result | null
    }), [refState, setRef, waitForMount, withTarget, executeIfMounted, onMount, isMounted, isWaitingForMount]);
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
      const group = new AbortController();
      try {
        const results = await Promise.all(refNames.map(async refName => {
          const name = String(refName);
          const target = await waitForRefMount(getRefState(name), name, timeout, group.signal);
          return [refName, target] as const;
        }));
        return Object.fromEntries(results) as Pick<T, K>;
      } finally {
        // A failed group releases its other waits without cancelling callers
        // outside this useWaitForRefs invocation.
        group.abort();
      }
    }, [getRefState]);
  };
  
  // 모든 ref 상태 가져오기 hook
  const useGetAllRefs = () => {
    const { refsMapRef } = useRefContext();
    
    return useCallback((): Partial<T> => {
      const result: Partial<T> = {} as Partial<T>;
      
      refsMapRef.current.forEach((refState, refName) => {
        if (refState.target !== null && refState.isMounted) {
          (result as unknown as Record<string, unknown>)[String(refName)] = refState.target;
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
  
  // 새로운 mount state subscription hooks
  const useRefMountStateHook = <K extends keyof T>(refName: K) => {
    const { getRefState } = useRefContext();
    const refState = getRefState(String(refName));
    return useRefMountState(refState) as {
      isMounted: boolean;
      isWaitingForMount: boolean;
      mountedTarget: T[K] | null;
    };
  };
  
  const useOnMountStateChangeHook = <K extends keyof T>(
    refName: K,
    callback: (mounted: boolean, target: T[K] | null) => void
  ) => {
    const { getRefState } = useRefContext();
    const refState = getRefState(String(refName));
    useOnMountStateChange(refState as InternalRefState<T[K]>, callback);
  };
  
  const useRefMountCheckerHook = <K extends keyof T>(refName: K) => {
    const { getRefState } = useRefContext();
    const refState = getRefState(String(refName));
    return useRefMountChecker(refState) as () => {
      isMounted: boolean;
      isWaitingForMount: boolean;
      target: T[K] | null;
    };
  };

  return {
    Provider,
    useRefHandler,
    useWaitForRefs,
    useGetAllRefs,
    useRefPolling,
    useRefMountState: useRefMountStateHook,
    useOnMountStateChange: useOnMountStateChangeHook,
    useRefMountChecker: useRefMountCheckerHook,
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
