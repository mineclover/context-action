/**
 * Context API 기반 Registry 영역 격리 패턴
 * 
 * Provider별로 독립적인 StoreRegistry를 생성하고,
 * 해당 Provider 범위 내에서만 Store에 접근할 수 있는 패턴
 * 
 * @module store/context-store-pattern
 * @version 1.0.0
 */

import React, { createContext, useContext, useMemo, ReactNode, useId } from 'react';
import { StoreRegistry } from './StoreRegistry';
import { generateStoreName, getOrCreateRegistryStore } from './isolation-utils';
import { createStore } from './Store';
import type { ComparisonOptions } from './comparison';

/**
 * Context Store 패턴 팩토리 함수
 * 
 * Provider와 해당 Provider 영역 내에서 사용할 수 있는 Hooks를 함께 생성합니다.
 * 
 * @param contextName - Context 이름 (Registry 식별용)
 * @returns Provider 컴포넌트와 Store 접근 Hooks
 * 
 * @example
 * ```typescript
 * // 1. Context Store 패턴 생성
 * const DemoStores = createContextStorePattern('demo');
 * 
 * // 2. Provider로 영역 격리
 * function App() {
 *   return (
 *     <DemoStores.Provider>
 *       <UserProfile />
 *       <Settings />
 *     </DemoStores.Provider>
 *   );
 * }
 * 
 * // 3. 영역 내에서 Store 사용
 * function UserProfile() {
 *   const userStore = DemoStores.useStore('user', { name: '', email: '' });
 *   const user = useStoreValue(userStore);
 *   
 *   return <div>User: {user.name}</div>;
 * }
 * ```
 */
export function createContextStorePattern(contextName: string) {
  // Registry Context 생성
  const RegistryContext = createContext<StoreRegistry | null>(null);
  
  /**
   * Store Registry Provider
   * 
   * 이 Provider 범위 내에서 독립적인 Store Registry를 제공합니다.
   * 여러 Provider 인스턴스는 서로 격리된 Store 영역을 가집니다.
   */
  function Provider({ children, registryId }: { 
    children: ReactNode; 
    registryId?: string;
  }) {
    const componentId = useId();
    
    // Provider별 고유 Registry 생성 - useId + contextName으로 간결하게
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
   * Provider 영역 내 Store 생성/접근 Hook
   * 
   * 현재 Provider 범위 내에서 Store를 생성하거나 기존 Store에 접근합니다.
   * 이름이 같으면 동일한 Store를 반환하고, 없으면 새로 생성합니다.
   * 
   * @template T - Store 값 타입
   * @param storeName - Store 이름
   * @param initialValue - 초기값 (Store가 없을 때만 사용)
   * @param options - Store 옵션
   * @returns Store 인스턴스
   */
  function useStore<T>(
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
    }, [storeName, registry]); // initialValue는 의존성에서 제외 (기존 Store 사용 시 무시)
  }
  
  /**
   * Provider 영역 내 컴포넌트별 격리 Store Hook
   * 
   * useId를 사용하여 컴포넌트별로 고유한 Store를 생성합니다.
   * Provider 범위 + 컴포넌트별 격리의 이중 격리 패턴입니다.
   * 
   * @template T - Store 값 타입
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
   * const UserStores = createContextStorePattern('User');
   * 
   * // Create HOC with specific registry ID
   * const withUserStores = UserStores.withProvider('user-management');
   * 
   * // Wrap component automatically
   * const UserDashboard = withUserStores(() => {
   *   const userStore = UserStores.useStore('current-user', { name: '', email: '' });
   *   const user = useStoreValue(userStore);
   *   
   *   return <div>Welcome, {user.name}!</div>;
   * });
   * 
   * // Or wrap existing component
   * const EnhancedUserProfile = withUserStores(UserProfile);
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
   * const FeatureStores = createContextStorePattern('Feature');
   * 
   * // Create a HOC that combines with ActionProvider
   * const withFeatureAndAction = FeatureStores.withCustomProvider(
   *   ({ children }) => (
   *     <ActionProvider config={{ logLevel: LogLevel.DEBUG }}>
   *       {children}
   *     </ActionProvider>
   *   ),
   *   'feature-module'
   * );
   * 
   * const FeatureModule = withFeatureAndAction(() => {
   *   const dataStore = FeatureStores.useStore('feature-data', {});
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
 * 사전 정의된 Context Store 패턴들
 * 
 * 일반적으로 사용되는 패턴들을 미리 정의해둡니다.
 */

/**
 * 페이지별 Store 격리 패턴
 * 
 * 각 페이지마다 독립적인 Store 영역을 제공합니다.
 */
export const PageStores = createContextStorePattern('page');

/**
 * 컴포넌트별 Store 격리 패턴
 * 
 * 컴포넌트별로 독립적인 Store 영역을 제공합니다.
 */
export const ComponentStores = createContextStorePattern('component');

/**
 * 데모/예제용 Store 격리 패턴
 * 
 * 데모나 예제에서 사용할 독립적인 Store 영역을 제공합니다.
 */
export const DemoStores = createContextStorePattern('demo');

/**
 * 테스트용 Store 격리 패턴
 * 
 * 테스트에서 사용할 독립적인 Store 영역을 제공합니다.
 */
export const TestStores = createContextStorePattern('test');

/**
 * 사용 예시와 패턴 가이드
 * 
 * @example
 * // 1. 기본 사용법
 * const MyStores = createContextStorePattern('my-app');
 * 
 * function App() {
 *   return (
 *     <MyStores.Provider>
 *       <UserProfile />
 *     </MyStores.Provider>
 *   );
 * }
 * 
 * function UserProfile() {
 *   const userStore = MyStores.useStore('user', { name: '', email: '' });
 *   const user = useStoreValue(userStore);
 *   
 *   return <div>User: {user.name}</div>;
 * }
 * 
 * @example
 * // Multiple Provider isolation
 * function App() {
 *   return (
 *     <div>
 *       <MyStores.Provider registryId="area-1">
 *         <UserProfile />
 *       </MyStores.Provider>
 *       <MyStores.Provider registryId="area-2">
 *         <UserProfile />
 *       </MyStores.Provider>
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Component-level isolation
 * function UserProfile({ userId }) {
 *   const userStore = MyStores.useIsolatedStore('user', { id: userId, name: '' });
 *   const user = useStoreValue(userStore);
 *   return <div>User {userId}: {user.name}</div>;
 * }
 */