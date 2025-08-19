/**
 * @fileoverview Simple Reference Context
 * 
 * 심플하고 직관적인 참조 관리 시스템
 * ref만 선언적으로 관리, 불필요한 복잡성 제거
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { RefStore, createRefStore } from './RefStore';
import type { 
  RefTarget, 
  RefOperation, 
  RefOperationOptions, 
  RefOperationResult,
  RefDefinitions
} from './types';

/**
 * RefContext 반환 타입 - 심플하고 명확한 API
 */
export interface RefContextReturn<T> {
  // Provider 컴포넌트
  Provider: React.FC<{ children: ReactNode }>;
  
  // 개별 ref 접근
  useRefHandler: <K extends keyof T>(refName: K) => {
    /** ref 값 설정 */
    setRef: (target: any) => void;
    /** 현재 ref 값 */
    target: any;
    /** ref가 마운트될 때까지 대기 */
    waitForMount: () => Promise<any>;
    /** ref와 함께 안전한 작업 수행 */
    withTarget: <Result>(
      operation: RefOperation<any, Result>,
      options?: RefOperationOptions
    ) => Promise<RefOperationResult<Result>>;
    /** ref가 마운트되어 있는지 확인 */
    isMounted: boolean;
  };
  
  // 여러 ref 동시 대기 hook - 함수를 반환하여 callback에서도 사용 가능
  useWaitForRefs: () => <K extends keyof T>(...refNames: K[]) => Promise<Partial<T>>;
  
  // 모든 ref 상태 가져오기 hook - 함수를 반환하여 callback에서도 사용 가능  
  useGetAllRefs: () => () => Partial<T>;
  
  // Context 이름
  contextName: string;
  
  // 선언적 정의 (있을 경우)
  refDefinitions?: T extends RefDefinitions ? T : undefined;
}

// Overload 1: 심플한 타입 지원 (legacy)
export function createRefContext<T extends Record<string, RefTarget>>(
  contextName: string
): RefContextReturn<T>;

// Overload 2: RefDefinitions 지원 (선언적 관리)
export function createRefContext<T extends RefDefinitions>(
  contextName: string,
  refDefinitions: T
): RefContextReturn<T>;

/**
 * 참조 컨텍스트 생성 함수 (구현)
 * 
 * @param contextName 컨텍스트 이름
 * @param refDefinitions 참조 정의 (선언적 사용 시)
 * @returns RefContext API
 * 
 * @example
 * ```typescript
 * // 방법 1: 심플한 타입 지정 (legacy)
 * const GameRefs = createRefContext<{
 *   canvas: HTMLCanvasElement;
 *   scene: THREE.Scene;
 * }>('GameRefs');
 * 
 * // 방법 2: 선언적 정의 (권장)
 * const GameRefs = createRefContext('GameRefs', {
 *   canvas: { name: 'canvas', objectType: 'dom' as const },
 *   scene: { name: 'scene', objectType: 'three' as const }
 * });
 * 
 * // 사용법 (직관적이고 간단함)
 * function GameComponent() {
 *   const canvas = GameRefs.useRefHandler('canvas');
 *   const scene = GameRefs.useRefHandler('scene');
 *   
 *   // ✅ 올바른 패턴: Hook을 먼저 호출하여 함수 추출
 *   const waitForRefs = GameRefs.useWaitForRefs();
 *   
 *   const initGame = async () => {
 *     // ✅ 추출한 함수 사용
 *     const refs = await waitForRefs('canvas', 'scene');
 *     // 타입 안전한 사용
 *     refs.canvas?.focus?.();
 *     console.log('Game initialized with:', refs);
 *   };
 *   
 *   return (
 *     <GameRefs.Provider>
 *       <canvas ref={canvas.setRef} />
 *       <button onClick={initGame}>Initialize Game</button>
 *       <button onClick={() => canvas.waitForMount().then(c => console.log('Canvas ready:', c))}>
 *         Check Canvas
 *       </button>
 *     </GameRefs.Provider>
 *   );
 * }
 * ```
 */
export function createRefContext<T = any>(
  contextName: string,
  refDefinitions?: T extends RefDefinitions ? T : undefined
): RefContextReturn<T> {
  
  // RefDefinitions인지 확인
  const hasDefinitions = Boolean(refDefinitions);
  
  // Context 타입 정의
  interface RefContextValue {
    stores: Map<string, RefStore<any>>;
    definitions?: T extends RefDefinitions ? T : undefined;
  }
  
  // Context 생성
  const RefContext = createContext<RefContextValue | null>(null);
  
  // Provider 컴포넌트
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // RefStore들을 한 번만 생성
    const stores = useMemo(() => {
      const map = new Map<string, RefStore<any>>();
      
      // RefDefinitions인 경우 미리 생성
      if (hasDefinitions && refDefinitions) {
        Object.entries(refDefinitions).forEach(([refName, definition]) => {
          map.set(refName, createRefStore(definition as any));
        });
      }
      
      return map;
    }, []);
    
    const contextValue = useMemo<RefContextValue>(() => ({
      stores,
      definitions: refDefinitions
    }), [stores]);
    
    return React.createElement(
      RefContext.Provider,
      { value: contextValue },
      children
    );
  };
  
  // Context hook
  const useRefContext = (): RefContextValue => {
    const context = useContext(RefContext);
    if (!context) {
      throw new Error(`useRefHandler must be used within ${contextName}.Provider`);
    }
    return context;
  };
  
  // 개별 ref 사용 hook
  const useRefHook = <K extends keyof T>(refName: K) => {
    const { stores, definitions } = useRefContext();
    
    const refNameStr = String(refName);
    
    // Store가 없으면 생성 (lazy initialization)
    if (!stores.has(refNameStr)) {
      // RefDefinitions에서 정의 찾기
      const definition = definitions?.[refName as string];
      
      if (definition) {
        // 선언적 정의 사용
        stores.set(refNameStr, createRefStore(definition));
      } else {
        // 기본 설정 사용
        stores.set(refNameStr, createRefStore({
          name: refNameStr,
          objectType: 'custom',
          autoCleanup: true
        }));
      }
    }
    
    const store = stores.get(refNameStr)!;
    
    // 간단한 React 상태로 구독 처리
    const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);
    
    // Store 구독
    React.useEffect(() => {
      const unsubscribe = store.subscribe(() => {
        forceUpdate();
      });
      return unsubscribe;
    }, [store]);
    
    // 현재 상태 가져오기
    const currentState = store.getValue();
    
    return useMemo(() => ({
      setRef: (target: any) => {
        try {
          store.setRef(target);
        } catch (error) {
          console.error(`Error setting ref "${refNameStr}":`, error);
          throw error;
        }
      },
      target: currentState.target,
      waitForMount: () => store.waitForMount(),
      withTarget: <Result>(
        operation: RefOperation<any, Result>,
        options?: RefOperationOptions
      ): Promise<RefOperationResult<Result>> => {
        return store.withTarget(operation, options);
      },
      isMounted: currentState.target !== null
    }), [store, currentState, refNameStr]);
  };
  
  // 여러 ref 동시 대기 함수
  const waitForRefsImpl = async <K extends keyof T>(
    stores: Map<string, RefStore<any>>,
    ...refNames: K[]
  ): Promise<Partial<T>> => {
    const promises = refNames.map(async (refName) => {
      const refNameStr = String(refName);
      if (!stores.has(refNameStr)) {
        // 동적 생성
        const definition = refDefinitions?.[refName as string];
        if (definition) {
          stores.set(refNameStr, createRefStore(definition));
        } else {
          stores.set(refNameStr, createRefStore({
            name: refNameStr,
            objectType: 'custom',
            autoCleanup: true
          }));
        }
      }
      const store = stores.get(refNameStr)!;
      const target = await store.waitForMount();
      return [refName, target] as const;
    });
    
    const results = await Promise.all(promises);
    return Object.fromEntries(results) as Partial<T>;
  };
  
  // 여러 ref 동시 대기 hook - 함수를 반환하여 callback에서도 사용 가능
  const useWaitForRefs = () => {
    const { stores } = useRefContext();
    return React.useCallback(<K extends keyof T>(...refNames: K[]): Promise<Partial<T>> => {
      return waitForRefsImpl(stores, ...refNames);
    }, [stores]);
  };
  
  // 모든 ref 상태 가져오기 hook - 함수를 반환하여 callback에서도 사용 가능
  const useGetAllRefs = () => {
    const { stores } = useRefContext();
    return React.useCallback((): Partial<T> => {
      const result: Partial<T> = {} as Partial<T>;
      
      stores.forEach((store, refName) => {
        const state = store.getValue();
        if (state.target !== null) {
          (result as any)[refName] = state.target;
        }
      });
      
      return result;
    }, [stores]);
  };
  
  return {
    Provider,
    useRefHandler: useRefHook,
    useWaitForRefs,
    useGetAllRefs,
    contextName,
    refDefinitions
  };
}