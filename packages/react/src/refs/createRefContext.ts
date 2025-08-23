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
  RefInitConfig,
  InferRefTypes
} from './types';

/**
 * 내부 Ref 상태 타입
 */
interface InternalRefState<T> {
  target: T | null;
  isMounted: boolean;
  mountPromise: Promise<T> | null;
  mountResolvers: Set<(target: T) => void>;
  mountRejectors: Set<(error: Error) => void>;
  operationInProgress: boolean;
  listeners: Set<() => void>;
}

/**
 * RefContext 반환 타입 - 향상된 타입 추론 지원
 */
export interface RefContextReturn<T> {
  Provider: React.FC<{ children: ReactNode }>;
  
  useRefHandler: <K extends keyof T>(refName: K) => {
    setRef: (target: T[K]) => void;
    target: T[K] | null;
    waitForMount: () => Promise<T[K]>;
    withTarget: <Result>(
      operation: RefOperation<T[K] & RefTarget, Result>,
      options?: RefOperationOptions
    ) => Promise<RefOperationResult<Result>>;
    isMounted: boolean;
  };
  
  useWaitForRefs: () => <K extends keyof T>(...refNames: K[]) => Promise<Pick<T, K>>;
  useGetAllRefs: () => () => Partial<T>;
  
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
  
  // Context hook
  const useRefContext = () => {
    const context = useContext(RefContext);
    if (!context) {
      throw new Error(`useRefHandler must be used within ${contextName}.Provider`);
    }
    return context;
  };
  
  // 개별 ref 사용 hook
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
    
    return useMemo(() => ({
      setRef: (target: T[K]) => {
        setRefTarget(refNameStr, target);
      },
      get target(): T[K] | null {
        return refState.target;
      },
      waitForMount: async (): Promise<T[K]> => {
        // 이미 마운트된 경우
        if (refState.target && refState.isMounted) {
          return refState.target as T[K];
        }
        
        // 기존 Promise가 있으면 재사용
        if (refState.mountPromise) {
          return refState.mountPromise as Promise<T[K]>;
        }
        
        // 타임아웃 설정 계산
        const globalOptions = optionsRef.current;
        const refConfig = definitionsRef.current?.[refNameStr] as RefInitConfig<any> | undefined;
        
        let timeoutMs: number | undefined;
        if (globalOptions?.disableTimeout) {
          // 글로벌 타임아웃 비활성화
          timeoutMs = undefined;
        } else if (refConfig?.mountTimeout !== undefined) {
          // 개별 ref 타임아웃 설정
          timeoutMs = refConfig.mountTimeout;
        } else if (globalOptions?.defaultMountTimeout !== undefined) {
          // 글로벌 기본 타임아웃
          timeoutMs = globalOptions.defaultMountTimeout;
        }
        // undefined면 타임아웃 없음
        
        // 새로운 Promise 생성
        refState.mountPromise = new Promise<T[K]>((resolve, reject) => {
          refState.mountResolvers.add(resolve);
          refState.mountRejectors.add(reject);
          
          // 타임아웃 설정
          if (timeoutMs !== undefined && timeoutMs > 0) {
            const timeoutId = setTimeout(() => {
              // 타임아웃 발생 시 rejector들 실행
              const error = new Error(`Mount timeout after ${timeoutMs}ms for ref '${refNameStr}'`);
              refState.mountRejectors.forEach(rejector => rejector(error));
              refState.mountRejectors.clear();
              refState.mountResolvers.clear();
              refState.mountPromise = null;
            }, timeoutMs);
            
            // resolve/reject 시 타임아웃 정리
            const originalResolve = resolve;
            const originalReject = reject;
            
            const cleanupResolve = (value: T[K]) => {
              clearTimeout(timeoutId);
              originalResolve(value);
            };
            
            const cleanupReject = (error: Error) => {
              clearTimeout(timeoutId);
              originalReject(error);
            };
            
            // resolver/rejector 교체
            refState.mountResolvers.delete(resolve);
            refState.mountRejectors.delete(reject);
            refState.mountResolvers.add(cleanupResolve);
            refState.mountRejectors.add(cleanupReject);
          }
        });
        
        return refState.mountPromise;
      },
      withTarget: async <Result>(
        operation: RefOperation<T[K] & RefTarget, Result>,
        options?: RefOperationOptions
      ): Promise<RefOperationResult<Result>> => {
        try {
          // 마운트 대기
          const target = await (async () => {
            if (refState.target && refState.isMounted) {
              return refState.target;
            }
            
            if (refState.mountPromise) {
              return refState.mountPromise;
            }
            
            refState.mountPromise = new Promise<any>((resolve, reject) => {
              refState.mountResolvers.add(resolve);
              refState.mountRejectors.add(reject);
            });
            
            return refState.mountPromise;
          })();
          
          // 순차 실행 보장
          while (refState.operationInProgress) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          refState.operationInProgress = true;
          const startTime = Date.now();
          
          try {
            // AbortSignal 체크
            if (options?.signal?.aborted) {
              throw new Error('Operation aborted');
            }
            
            // 타임아웃 설정
            const timeoutPromise = options?.timeout
              ? new Promise<never>((_, reject) => {
                  setTimeout(() => reject(new Error('Operation timed out')), options.timeout);
                })
              : null;
            
            // 작업 실행
            const operationPromise = operation(target, options);
            
            const result = timeoutPromise
              ? await Promise.race([operationPromise, timeoutPromise])
              : await operationPromise;
            
            return {
              success: true,
              result,
              duration: Date.now() - startTime,
              timestamp: Date.now()
            };
          } catch (error) {
            return {
              success: false,
              error: error as Error,
              duration: Date.now() - startTime,
              timestamp: Date.now()
            };
          } finally {
            refState.operationInProgress = false;
          }
        } catch (error) {
          return {
            success: false,
            error: error as Error,
            timestamp: Date.now()
          };
        }
      },
      get isMounted() {
        return refState.isMounted;
      }
    }), [refState, setRefTarget, refNameStr, definitionsRef, optionsRef]);
  };
  
  // 여러 ref 동시 대기 hook
  const useWaitForRefs = () => {
    const { getRefState } = useRefContext();
    
    return useCallback(async <K extends keyof T>(...refNames: K[]): Promise<Pick<T, K>> => {
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
        
        const target = await refState.mountPromise;
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
  
  return {
    Provider,
    useRefHandler,
    useWaitForRefs,
    useGetAllRefs,
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
    listeners: new Set()
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