/**
 * @fileoverview Simple Reference Context
 * 
 * 심플하고 직관적인 참조 관리 시스템
 * 불필요한 복잡성 없이 핵심 기능만 제공
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { RefStore, createRefStore } from './RefStore';
import type { RefTarget, RefOperation, RefOperationOptions, RefOperationResult } from './types';

/**
 * RefContext 반환 타입 - 심플하고 명확한 API
 */
export interface RefContextReturn<T extends Record<string, RefTarget>> {
  // Provider 컴포넌트
  Provider: React.FC<{ children: ReactNode }>;
  
  // 개별 ref 접근
  useRef: <K extends keyof T>(refName: K) => {
    setRef: (target: T[K] | null) => void;
    target: T[K] | null;
    waitForMount: () => Promise<T[K]>;
    withTarget: <Result>(
      operation: RefOperation<T[K], Result>,
      options?: RefOperationOptions
    ) => Promise<RefOperationResult<Result>>;
  };
  
  // 여러 ref 동시 대기
  waitForRefs: <K extends keyof T>(...refNames: K[]) => Promise<Pick<T, K>>;
  
  // Context 이름
  contextName: string;
}

/**
 * 심플한 참조 컨텍스트 생성 함수
 * 
 * @param contextName 컨텍스트 이름
 * @returns RefContext API
 * 
 * @example
 * ```typescript
 * // 타입 정의와 컨텍스트 생성
 * const GameRefs = createRefContext<{
 *   canvas: HTMLCanvasElement;
 *   scene: THREE.Scene;
 *   camera: THREE.Camera;
 * }>('GameRefs');
 * 
 * // 컴포넌트에서 사용
 * function GameComponent() {
 *   const canvas = GameRefs.useRef('canvas');
 *   const scene = GameRefs.useRef('scene');
 *   
 *   const initGame = async () => {
 *     // 모든 ref가 준비될 때까지 대기
 *     const refs = await GameRefs.waitForRefs('canvas', 'scene', 'camera');
 *     
 *     // 타입 안전한 사용
 *     refs.canvas.width = 800;
 *     refs.scene.add(mesh);
 *   };
 *   
 *   return (
 *     <GameRefs.Provider>
 *       <canvas ref={canvas.setRef} />
 *       <button onClick={initGame}>Initialize</button>
 *     </GameRefs.Provider>
 *   );
 * }
 * ```
 */
export function createRefContext<T extends Record<string, RefTarget>>(
  contextName: string
): RefContextReturn<T> {
  
  // Context 타입 정의
  interface RefContextValue {
    stores: Map<keyof T, RefStore<any>>;
  }
  
  // Context 생성
  const RefContext = createContext<RefContextValue | null>(null);
  
  // Provider 컴포넌트
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // RefStore들을 한 번만 생성
    const stores = useMemo(() => {
      const map = new Map<keyof T, RefStore<any>>();
      
      // 타입의 각 키에 대해 RefStore 생성
      const keys = Object.keys({} as T) as (keyof T)[];
      
      // 런타임에는 키를 알 수 없으므로, 동적으로 생성
      // 실제 사용 시점에 lazy 생성하는 방식 사용
      
      return map;
    }, []);
    
    const contextValue = useMemo<RefContextValue>(() => ({
      stores
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
      throw new Error(`useRef must be used within ${contextName}.Provider`);
    }
    return context;
  };
  
  // 개별 ref 사용 hook
  const useRefHook = <K extends keyof T>(refName: K) => {
    const { stores } = useRefContext();
    
    // Store가 없으면 생성 (lazy initialization)
    if (!stores.has(refName)) {
      stores.set(refName, createRefStore({
        name: String(refName),
        objectType: 'custom',
        autoCleanup: true
      }));
    }
    
    const store = stores.get(refName)!;
    
    // Store 구독
    const [state, setState] = React.useState(() => store.getSnapshot().value);
    
    React.useEffect(() => {
      const unsubscribe = store.subscribe(() => {
        setState(store.getSnapshot().value);
      });
      return unsubscribe;
    }, [store]);
    
    return useMemo(() => ({
      setRef: (target: T[K] | null) => store.setRef(target),
      target: state.target as T[K] | null,
      waitForMount: () => store.waitForMount() as Promise<T[K]>,
      withTarget: <Result>(
        operation: RefOperation<T[K], Result>,
        options?: RefOperationOptions
      ) => store.withTarget(operation, options)
    }), [store, state]);
  };
  
  // 여러 ref 동시 대기 (Provider 외부에서 사용 가능)
  const waitForRefsImpl = async function<K extends keyof T>(this: RefContextValue, ...refNames: K[]): Promise<Pick<T, K>> {
    const { stores } = this;
    
    const promises = refNames.map(async (refName) => {
      if (!stores.has(refName)) {
        stores.set(refName, createRefStore({
          name: String(refName),
          objectType: 'custom',
          autoCleanup: true
        }));
      }
      const store = stores.get(refName)!;
      const target = await store.waitForMount();
      return [refName, target] as const;
    });
    
    const results = await Promise.all(promises);
    return Object.fromEntries(results) as Pick<T, K>;
  };
  
  // Context를 사용하는 waitForRefs wrapper
  const waitForRefsWrapper = <K extends keyof T>(...refNames: K[]): Promise<Pick<T, K>> => {
    const context = useRefContext();
    return waitForRefsImpl.call(context, ...refNames);
  };
  
  return {
    Provider,
    useRef: useRefHook,
    waitForRefs: waitForRefsWrapper,
    contextName
  };
}