import React, { createContext, ReactNode, useContext, useRef, useMemo } from 'react';
import { StoreRegistry } from './StoreRegistry';
import type { StoreContextType, StoreContextReturn } from './types';

/**
 * Error messages for context-related failures
 */
const CONTEXT_ERRORS = {
  PROVIDER_MISSING: 'useStoreContext must be used within StoreContext.Provider',
  REGISTRY_MISSING: 'useStoreRegistry must be used within StoreContext.Provider. Make sure your component is wrapped with the StoreContext Provider.',
  REGISTRY_NOT_INITIALIZED: 'StoreRegistry is not initialized. Make sure the StoreContext Provider is properly set up.'
} as const;

/**
 * Store Context 팩토리 함수 - 고급 사용 시나리오용
 * 
 * 핵심 기능: 독립적인 StoreRegistry 인스턴스를 가진 Context 생성
 * 사용 시나리오: 
 * - 여러 독립적인 Store 영역이 필요한 경우
 * - 라이브러리에서 격리된 Store 컨텍스트가 필요한 경우
 * 
 * 참고: 일반적인 사용에는 StoreProvider를 권장
 * 
 * @param name - StoreRegistry 인스턴스 이름
 * @returns Provider 컴포넌트와 훅들을 포함한 객체
 * 
 * @example
 * ```typescript
 * // 독립적인 Store 영역 생성
 * const FeatureContext = createStoreContext('feature');
 * 
 * function FeatureApp() {
 *   return (
 *     <FeatureContext.Provider>
 *       <FeatureComponent />
 *     </FeatureContext.Provider>
 *   );
 * }
 * ```
 */
export function createStoreContext(name?: string): StoreContextReturn {
  const StoreContext = createContext<StoreContextType | null>(null);

  /**
   * Provider component
   * Provides StoreRegistry instance through Context
   */
  const Provider = ({ children }: { children: ReactNode }) => {
    const storeRegistryRef = useRef(new StoreRegistry(name));
    
    return (
      <StoreContext.Provider value={{ storeRegistryRef }}>
        {children}
      </StoreContext.Provider>
    );
  };

  /**
   * Standardized context access hook
   * @returns StoreContextType - Context containing StoreRegistry reference
   * @throws Error - When used outside of Provider
   */
  const useStoreContext = (): StoreContextType => {
    const context = useContext(StoreContext);
    if (!context) {
      throw new Error(CONTEXT_ERRORS.PROVIDER_MISSING);
    }
    return context;
  };

  /**
   * Standardized StoreRegistry access hook with enhanced error handling
   * @returns StoreRegistry instance
   * @throws Error - When used outside of Provider or registry not initialized
   */
  const useStoreRegistry = (): StoreRegistry => {
    const context = useContext(StoreContext);
    
    if (!context) {
      throw new Error(CONTEXT_ERRORS.REGISTRY_MISSING);
    }

    // Enhanced strict mode validation
    if (!(context.storeRegistryRef.current instanceof StoreRegistry)) {
      throw new Error(CONTEXT_ERRORS.REGISTRY_NOT_INITIALIZED);
    }

    const registry = context.storeRegistryRef.current;
    
    // Memoized registry reference for performance
    return useMemo(() => registry, [registry]);
  };

  return {
    Provider,
    useStoreContext,
    useStoreRegistry,
  };
}

/**
 * Default app-level store context
 * @example
 * ```typescript
 * import { StoreProvider, useStoreRegistry } from '@context-action/react';
 * 
 * function App() {
 *   return (
 *     <StoreProvider>
 *       <MyComponent />
 *     </StoreProvider>
 *   );
 * }
 * 
 * function MyComponent() {
 *   const registry = useStoreRegistry();
 *   // Use registry...
 * }
 * ```
 */
const defaultStoreContext = createStoreContext('app');

export const StoreProvider = defaultStoreContext.Provider;
export const useStoreContext = defaultStoreContext.useStoreContext;
export const useStoreRegistry = defaultStoreContext.useStoreRegistry;