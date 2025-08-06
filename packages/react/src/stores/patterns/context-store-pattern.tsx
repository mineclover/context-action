/**
 * Context Store Pattern for domain-scoped store isolation
 * 
 * @deprecated Use createDeclarativeStores for type-safe declarative store management
 * @module store/context-store-pattern
 * @since 1.0.0
 * 
 * This pattern is being superseded by the Declarative Store Pattern which provides:
 * - Compile-time type inference for store access
 * - Schema-based store definition similar to Action Registry
 * - Singleton behavior for consistent data management
 * - Better integration with action-store coordination
 */

import React, { createContext, useContext, useMemo, ReactNode, useId } from 'react';
import { StoreRegistry } from '../core/StoreRegistry';
import { generateStoreName, getOrCreateRegistryStore } from './isolation-utils';
import { createStore } from '../core/Store';
import type { ComparisonOptions } from '../utils/comparison';

/**
 * Context Store Pattern factory function
 * 
 * @deprecated Use createDeclarativeStores instead for better type safety
 * @implements cross-store-coordination
 * @implements store-factory-functions
 * @implements separation-of-concerns
 * @implements mvvm-pattern
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Creates Provider and hooks for domain-scoped store management.
 * Each Provider maintains independent Store Registry with isolation guarantees.
 * 
 * @param contextName Context identifier for registry naming
 * @returns Provider component and store access hooks
 * 
 * @example
 * // ❌ Old approach (limited type inference)
 * const { useStore } = createContextStorePattern('User');
 * const store = useStore('profile'); // Type: any
 * 
 * // ✅ New approach (full type safety)
 * const UserStores = createDeclarativeStores('User', {
 *   profile: { initialValue: { id: '', name: '' } }
 * });
 * const store = UserStores.useStore('profile'); // Type: Store<{id: string, name: string}>
 */
export function createContextStorePattern(contextName: string) {
  // Create Registry Context
  const RegistryContext = createContext<StoreRegistry | null>(null);
  
  /**
   * Store Registry Provider
   * 
   * Provides independent Store Registry within this Provider scope.
   * Multiple Provider instances maintain isolated store domains.
   */
  function Provider({ children, registryId }: { 
    children: ReactNode; 
    registryId?: string;
  }) {
    const componentId = useId();
    
    // Create unique Registry per Provider - useId + contextName
    const registry = useMemo(() => {
      const uniqueId = registryId || `${contextName}-${componentId}`;
      const registryInstance = new StoreRegistry(uniqueId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏭 Context Store Pattern created: ${uniqueId}`);
      }
      
      return registryInstance;
    }, [registryId, componentId]);
    
    return (
      <RegistryContext.Provider value={registry}>
        {children}
      </RegistryContext.Provider>
    );
  }
  
  /**
   * Registry 접근 Hook
   * 
   * 현재 Provider의 Registry에 접근합니다.
   */
  function useRegistry(): StoreRegistry {
    const registry = useContext(RegistryContext);
    
    if (!registry) {
      throw new Error(
        `useRegistry must be used within ${contextName} Provider. ` +
        `Make sure your component is wrapped with <${contextName}.Provider>.`
      );
    }
    
    return registry;
  }
  
  /**
   * Context-aware Store 생성 함수 (Hook)
   * 
   * 현재 Provider의 registry에서 Store를 생성합니다.
   * Action handler와 component에서 동일한 이름으로 접근 가능합니다.
   * 
   * ⚠️ 주의: React Hook이므로 React 컴포넌트나 Hook 내에서만 사용 가능합니다.
   * 
   * @template T Store 값 타입
   * @param storeName - Store 이름 (양방향 접근을 위해 고정 문자열 사용)
   * @param initialValue - 초기값
   * @param options - Store 옵션
   * @returns Store 인스턴스
   */
  function useCreateStore<T>(
    storeName: string,
    initialValue: T | (() => T),
    options: {
      strategy?: 'reference' | 'shallow' | 'deep';
      debug?: boolean;
      comparisonOptions?: Partial<ComparisonOptions<T>>;
    } = {}
  ): ReturnType<typeof createStore<T>> {
    const registry = useRegistry();
    const { strategy = 'reference', debug = process.env.NODE_ENV === 'development', comparisonOptions } = options;
    
    return useMemo(() => {
      const resolvedInitialValue = typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue;
      
      const { store } = getOrCreateRegistryStore({
        storeName,
        initialValue: resolvedInitialValue,
        strategy,
        debug,
        comparisonOptions
      }, registry);
      
      return store;
    }, [storeName, registry]); // initialValue는 의존성에서 제외
  }

  /**
   * Provider 영역 내 Store 접근 Hook
   * 
   * 현재 Provider 범위 내에서 기존 Store에 접근합니다.
   * Store가 존재하지 않으면 오류가 발생하므로, 미리 useCreateStore로 생성되어 있어야 합니다.
   * 
   * @template T Store 값 타입
   * @param storeName - Store 이름 (양방향 접근을 위해 고정 문자열 사용)
   * @returns Store 인스턴스
   */
  function useStore<T = any>(storeName: string): ReturnType<typeof createStore<T>> {
    const registry = useRegistry();
    
    return useMemo(() => {
      const existingStore = registry.getStore(storeName);
      
      if (!existingStore) {
        throw new Error(
          `Store '${storeName}' not found in ${contextName} context. ` +
          `Make sure you've created it first using useCreateStore('${storeName}', initialValue).`
        );
      }
      
      return existingStore as ReturnType<typeof createStore<T>>;
    }, [storeName, registry]);
  }
  
  /**
   * Provider 영역 내 컴포넌트별 격리 Store Hook
   * 
   * useId를 사용하여 컴포넌트별로 고유한 Store를 생성합니다.
   * Provider 범위 + 컴포넌트별 격리의 이중 격리 패턴입니다.
   * 
   * @template T Store 값 타입
   * @param domain - Store 도메인 이름
   * @param initialValue - 초기값
   * @param options - Store 옵션
   * @returns Store 인스턴스
   */
  function useIsolatedStore<T>(
    domain: string,
    initialValue: T | (() => T),
    options: {
      strategy?: 'reference' | 'shallow' | 'deep';
      debug?: boolean;
      comparisonOptions?: Partial<ComparisonOptions<T>>;
    } = {}
  ): ReturnType<typeof createStore<T>> {
    const registry = useRegistry();
    const componentId = useId();
    const storeName = generateStoreName(domain, componentId);
    
    const { strategy = 'reference', debug = process.env.NODE_ENV === 'development', comparisonOptions } = options;
    
    return useMemo(() => {
      const resolvedInitialValue = typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue;
      
      const { store } = getOrCreateRegistryStore({
        storeName,
        initialValue: resolvedInitialValue,
        strategy,
        debug,
        comparisonOptions
      }, registry);
      
      return store;
    }, [storeName, registry]); // initialValue는 의존성에서 제외
  }
  
  /**
   * Registry 상태 조회 Hook (디버깅/모니터링용)
   * 
   * 현재 Provider의 Registry 상태를 조회합니다.
   */
  function useRegistryInfo() {
    const registry = useRegistry();
    
    return useMemo(() => ({
      name: registry.name,
      storeCount: registry.getStoreCount(),
      storeNames: registry.getStoreNames(),
      stores: registry.getAllStores()
    }), [registry]);
  }
  
  /**
   * Registry 정리 Hook
   * 
   * Provider 범위의 모든 Store를 정리합니다.
   * 주로 테스트나 특수한 경우에 사용합니다.
   */
  function useClearRegistry() {
    const registry = useRegistry();
    
    return useMemo(() => ({
      clearAll: () => {
        const clearedCount = registry.getStoreCount();
        registry.clear();
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🧹 Registry cleared: ${clearedCount} stores removed from ${registry.name}`);
        }
      },
      clearStore: (storeName: string) => {
        const removed = registry.unregister(storeName);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🗑️ Store ${removed ? 'removed' : 'not found'}: ${storeName} from ${registry.name}`);
        }
        
        return removed;
      }
    }), [registry]);
  }
  
  /**
   * HOC that wraps a component with this Context Store Provider
   * 
   * Automatically wraps any component with the Provider, making it easy to
   * isolate stores for specific components or component trees.
   * 
   * @param registryId - Optional registry ID for the Provider
   * @returns HOC function that wraps components with the Provider
   * 
   * @example
   * ```typescript
   * const {
   *   withProvider: withUserStores,
   *   useCreateStore: useCreateUserStore,
   *   useStore: useUserStore
   * } = createContextStorePattern('User');
   * 
   * // Create HOC with specific registry ID
   * const withUserProvider = withUserStores('user-management');
   * 
   * // Wrap component automatically
   * const UserDashboard = withUserProvider(() => {
   *   const userStore = useUserStore<User>('current-user');
   *   const user = useStoreValue(userStore);
   *   
   *   return <div>Welcome, {user.name}!</div>;
   * });
   * 
   * // Or wrap existing component
   * const EnhancedUserProfile = withUserProvider(UserProfile);
   * 
   * // Usage - no need to manually wrap with Provider
   * function App() {
   *   return (
   *     <div>
   *       <UserDashboard />
   *       <EnhancedUserProfile />
   *     </div>
   *   );
   * }
   * ```
   */
  function withProvider(registryId?: string) {
    return function <P extends {}>(
      WrappedComponent: React.ComponentType<P>
    ): React.FC<P> {
      const WithContextStoreProvider = (props: P) => (
        <Provider registryId={registryId}>
          <WrappedComponent {...props} />
        </Provider>
      );
      
      WithContextStoreProvider.displayName = `with${contextName}StoreProvider(${WrappedComponent.displayName || WrappedComponent.name})`;
      
      return WithContextStoreProvider;
    };
  }

  /**
   * Create a HOC factory that can combine Context Store Provider with other providers
   * 
   * This is a flexible factory that allows you to create HOCs that combine
   * the Context Store Provider with any other provider (like ActionProvider).
   * 
   * @param wrapperComponent - A component that will wrap the Context Store Provider
   * @param registryId - Optional registry ID for the Provider
   * @returns HOC function that wraps components with both providers
   * 
   * @example
   * ```typescript
   * const {
   *   withCustomProvider: withFeatureCustomProvider,
   *   useStore: useFeatureStore
   * } = createContextStorePattern('Feature');
   * 
   * // Create a HOC that combines with ActionProvider
   * const withFeatureAndAction = withFeatureCustomProvider(
   *   ({ children }) => (
   *     <ActionProvider config={{ logLevel: LogLevel.DEBUG }}>
   *       {children}
   *     </ActionProvider>
   *   ),
   *   'feature-module'
   * );
   * 
   * const FeatureModule = withFeatureAndAction(() => {
   *   const dataStore = useFeatureStore('feature-data');
   *   const data = useStoreValue(dataStore);
   *   
   *   return <div>Feature: {data}</div>;
   * });
   * 
   * // Usage - completely self-contained
   * function App() {
   *   return <FeatureModule />;
   * }
   * ```
   */
  function withCustomProvider(
    wrapperComponent: React.ComponentType<{ children: ReactNode }>,
    registryId?: string
  ) {
    return function <P extends {}>(
      WrappedComponent: React.ComponentType<P>
    ): React.FC<P> {
      const WrapperComponent = wrapperComponent;
      
      const WithCustomProvider = (props: P) => (
        <Provider registryId={registryId}>
          <WrapperComponent>
            <WrappedComponent {...props} />
          </WrapperComponent>
        </Provider>
      );
      
      WithCustomProvider.displayName = `with${contextName}CustomProvider(${WrappedComponent.displayName || WrappedComponent.name})`;
      
      return WithCustomProvider;
    };
  }

  // 패턴 객체 반환
  return {
    // Provider 컴포넌트
    Provider,
    
    // Registry 접근
    useRegistry,
    
    // Store 생성/접근 Hooks
    useCreateStore,
    useStore,
    useIsolatedStore,
    
    // 유틸리티 Hooks
    useRegistryInfo,
    useClearRegistry,
    
    // HOC 패턴 (새로 추가)
    withProvider,
    withCustomProvider,
    
    // Context 정보 (디버깅용)
    contextName,
    RegistryContext
  };
}

/**
 * Pre-defined Context Store Patterns
 * 
 * Common patterns ready to use. These demonstrate the standard approach
 * for domain-scoped store management in Context-Action framework.
 * 
 * @example
 * // ✅ Standard usage pattern
 * const { Provider, useStore, useCreateStore } = createContextStorePattern('myDomain');
 * 
 * // ✅ Using pre-defined patterns
 * const { Provider: PageProvider, useStore: usePageStore } = PageStores;
 */

/**
 * Page-level Store isolation pattern
 * 
 * Provides independent Store domain for each page/route.
 * Recommended for page-specific state management.
 */
export const PageStores = createContextStorePattern('page');

/**
 * Component-level Store isolation pattern
 * 
 * Provides independent Store domain for reusable components.
 * Use when components need isolated state across instances.
 */
export const ComponentStores = createContextStorePattern('component');

/**
 * Demo/Example Store isolation pattern
 * 
 * For demonstrations and examples. Shows standard usage patterns
 * for Context Store Pattern implementation.
 */
export const DemoStores = createContextStorePattern('demo');

/**
 * Test Store isolation pattern
 * 
 * For testing environments. Provides clean isolation for test cases
 * without affecting other test suites or application state.
 */
export const TestStores = createContextStorePattern('test');

