/**
 * Declarative Store Registry Pattern
 * 
 * Action Registry와 유사한 선언적 패턴으로 Store를 관리합니다.
 * 컴파일타임에 타입이 추론되고, 싱글톤 패턴으로 Store가 관리됩니다.
 * 
 * @module store/declarative-store-registry
 * @since 2.0.0
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { StoreRegistry } from '../core/StoreRegistry';
import { createStore } from '../core/Store';
import type { ComparisonOptions } from '../utils/comparison';



/**
 * Store Configuration 인터페이스
 */
export interface StoreConfig<T = any> {
  initialValue: T | (() => T);
  strategy?: 'reference' | 'shallow' | 'deep';
  debug?: boolean;
  comparisonOptions?: Partial<ComparisonOptions<T>>;
  description?: string;
  tags?: string[];
  version?: string;
}

/**
 * Store Schema Definition
 * 컴파일타임에 Store 타입을 정의하는 스키마
 */
export type StoreSchema<T extends {}> = {
  [K in keyof T]: StoreConfig<T[K]>;
};

/**
 * Store Access Interface
 * Registry로부터 타입 안전한 Store 접근을 제공
 */
export interface StoreAccess<T extends {}> {
  <K extends keyof T>(storeName: K): ReturnType<typeof createStore<T[K]>>;
}

/**
 * Store Creation Interface
 * 새로운 Store를 동적으로 생성
 */
export interface StoreCreation<T extends {}> {
  <K extends keyof T>(storeName: K, config?: Partial<StoreConfig<T[K]>>): ReturnType<typeof createStore<T[K]>>;
}

/**
 * Declarative Store Registry
 * 
 * Action Registry와 동일한 패턴으로 Store를 선언적으로 관리합니다.
 * 
 * @example
 * ```typescript
 * interface AppStores extends StorePayloadMap {
 *   user: { id: string; name: string };
 *   settings: { theme: 'light' | 'dark' };
 *   counter: number;
 * }
 * 
 * const storeSchema: StoreSchema<AppStores> = {
 *   user: { 
 *     initialValue: { id: '', name: '' },
 *     description: 'User profile data'
 *   },
 *   settings: { 
 *     initialValue: { theme: 'light' },
 *     strategy: 'shallow'
 *   },
 *   counter: { 
 *     initialValue: 0
 *   }
 * };
 * 
 * const storeRegistry = new DeclarativeStoreRegistry('App', storeSchema);
 * 
 * // 타입 안전한 접근
 * const userStore = storeRegistry.getStore('user'); // 타입: Store<{id: string, name: string}>
 * const counter = storeRegistry.getStore('counter'); // 타입: Store<number>
 * ```
 */
export class DeclarativeStoreRegistry<T extends {}> {
  private registry: StoreRegistry;
  private schema: StoreSchema<T>;
  private initialized = new Set<keyof T>();

  constructor(
    public readonly name: string,
    schema: StoreSchema<T>
  ) {
    this.registry = new StoreRegistry(name);
    this.schema = schema;
  }

  /**
   * 선언된 스키마에서 Store 가져오기
   * 
   * 스키마에 정의된 Store만 접근 가능하며, 컴파일타임에 타입이 추론됩니다.
   * 
   * @param storeName 스키마에 정의된 Store 이름
   * @returns 타입 안전한 Store 인스턴스
   */
  getStore<K extends keyof T>(storeName: K): ReturnType<typeof createStore<T[K]>> {
    // 스키마에 정의되지 않은 Store 접근 방지
    if (!(storeName in this.schema)) {
      throw new Error(
        `Store '${String(storeName)}' is not defined in schema. ` +
        `Available stores: ${Object.keys(this.schema).join(', ')}`
      );
    }

    // 기존 Store가 있으면 반환
    const existingStore = this.registry.getStore(String(storeName));
    if (existingStore) {
      return existingStore as ReturnType<typeof createStore<T[K]>>;
    }

    // 스키마 기반으로 새 Store 생성
    return this.createStoreFromSchema(storeName);
  }

  /**
   * 스키마에 정의된 모든 Store를 미리 초기화
   * 
   * 성능 최적화나 사전 초기화가 필요한 경우 사용합니다.
   */
  initializeAll(): void {
    for (const storeName of Object.keys(this.schema) as Array<keyof T>) {
      if (!this.initialized.has(storeName)) {
        this.createStoreFromSchema(storeName);
      }
    }
  }

  /**
   * 특정 Store 초기화 여부 확인
   */
  isInitialized<K extends keyof T>(storeName: K): boolean {
    return this.initialized.has(storeName);
  }

  /**
   * 초기화된 Store 개수
   */
  getInitializedCount(): number {
    return this.initialized.size;
  }

  /**
   * 사용 가능한 Store 이름 목록
   */
  getAvailableStores(): Array<keyof T> {
    return Object.keys(this.schema) as Array<keyof T>;
  }

  /**
   * Store 스키마 정보 가져오기
   */
  getStoreSchema<K extends keyof T>(storeName: K): StoreConfig<T[K]> {
    if (!(storeName in this.schema)) {
      throw new Error(`Store '${String(storeName)}' is not defined in schema`);
    }
    return this.schema[storeName];
  }

  /**
   * Registry 정보 (디버깅용)
   */
  getRegistryInfo(): {
    name: string;
    totalStores: number;
    initializedStores: number;
    availableStores: Array<keyof T>;
    initializedStoreNames: Array<keyof T>;
  } {
    return {
      name: this.name,
      totalStores: Object.keys(this.schema).length,
      initializedStores: this.initialized.size,
      availableStores: this.getAvailableStores(),
      initializedStoreNames: Array.from(this.initialized),
    };
  }

  /**
   * 모든 Store 정리
   */
  clear(): void {
    this.registry.clear();
    this.initialized.clear();
  }

  /**
   * 특정 Store 제거
   */
  removeStore<K extends keyof T>(storeName: K): boolean {
    const removed = this.registry.unregister(String(storeName));
    if (removed) {
      this.initialized.delete(storeName);
    }
    return removed;
  }

  /**
   * 스키마에서 Store 생성
   */
  private createStoreFromSchema<K extends keyof T>(storeName: K): ReturnType<typeof createStore<T[K]>> {
    const config = this.schema[storeName];
    const { initialValue, strategy = 'reference', debug = process.env.NODE_ENV === 'development', comparisonOptions } = config;

    // initialValue 해결
    const resolvedInitialValue = typeof initialValue === 'function' 
      ? (initialValue as () => T[K])() 
      : initialValue;

    // Store 생성
    const store = createStore(String(storeName), resolvedInitialValue);
    
    // 비교 옵션 설정
    const finalComparisonOptions = {
      strategy,
      ...comparisonOptions
    };
    store.setComparisonOptions(finalComparisonOptions);

    // Registry에 등록
    this.registry.register(String(storeName), store, {
      name: String(storeName),
      tags: config.tags ?? ['declarative', strategy],
      description: config.description ?? `Declarative store: ${String(storeName)} with ${strategy} comparison`
    });

    // 초기화 마킹
    this.initialized.add(storeName);

    if (debug) {
      console.log(`🏭 Declarative store created: ${String(storeName)}`, {
        strategy,
        registryName: this.name,
        initializedCount: this.initialized.size
      });
    }

    return store;
  }
}

/**
 * Context-based Declarative Store Registry Pattern
 * 
 * Context Store Pattern과 Declarative Store Registry를 결합한 패턴입니다.
 * React Context를 통해 Store Registry를 제공하며, 타입 안전성을 보장합니다.
 */
export function createDeclarativeStorePattern<T extends {}>(
  contextName: string,
  schema: StoreSchema<T>
) {
  // Registry Context 생성
  const RegistryContext = createContext<DeclarativeStoreRegistry<T> | null>(null);

  /**
   * Store Registry Provider
   * 
   * 선언적 Store Registry를 Context로 제공합니다.
   */
  function Provider({ children, registryId = contextName }: { 
    children: ReactNode; 
    registryId?: string;
  }) {
    // 간단한 Registry 생성 - 복잡한 ID 생성 로직 제거
    const registry = useMemo(() => {
      const registryInstance = new DeclarativeStoreRegistry(registryId, schema);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏭 Declarative Store Pattern created: ${registryId}`, {
          availableStores: registryInstance.getAvailableStores(),
          totalStores: Object.keys(schema).length
        });
      }
      
      return registryInstance;
    }, [registryId]);
    
    return (
      <RegistryContext.Provider value={registry}>
        {children}
      </RegistryContext.Provider>
    );
  }

  /**
   * Registry 접근 Hook
   */
  function useRegistry(): DeclarativeStoreRegistry<T> {
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
   * 타입 안전한 Store 접근 Hook
   * 
   * 스키마에 정의된 Store에만 접근 가능하며, 컴파일타임에 타입이 추론됩니다.
   * 
   * @param storeName 스키마에 정의된 Store 이름
   * @returns 타입 안전한 Store 인스턴스
   */
  function useStore<K extends keyof T>(storeName: K): ReturnType<typeof createStore<T[K]>> {
    const registry = useRegistry();
    
    return useMemo(() => {
      return registry.getStore(storeName);
    }, [storeName, registry]);
  }

  /**
   * Registry 상태 조회 Hook (디버깅/모니터링용)
   */
  function useRegistryInfo() {
    const registry = useRegistry();
    
    return useMemo(() => {
      return registry.getRegistryInfo();
    }, [registry]);
  }

  /**
   * Registry 관리 Hook
   */
  function useRegistryActions() {
    const registry = useRegistry();
    
    return useMemo(() => ({
      initializeAll: () => registry.initializeAll(),
      clear: () => registry.clear(),
      removeStore: <K extends keyof T>(storeName: K) => registry.removeStore(storeName),
      getStoreSchema: <K extends keyof T>(storeName: K) => registry.getStoreSchema(storeName),
      isInitialized: <K extends keyof T>(storeName: K) => registry.isInitialized(storeName),
    }), [registry]);
  }

  /**
   * HOC that wraps a component with this Declarative Store Provider
   */
  function withProvider(registryId?: string) {
    return function <P extends {}>(
      WrappedComponent: React.ComponentType<P>
    ): React.FC<P> {
      const WithDeclarativeStoreProvider = (props: P) => (
        <Provider registryId={registryId}>
          <WrappedComponent {...props} />
        </Provider>
      );
      
      WithDeclarativeStoreProvider.displayName = `with${contextName}DeclarativeStoreProvider(${WrappedComponent.displayName || WrappedComponent.name})`;
      
      return WithDeclarativeStoreProvider;
    };
  }

  /**
   * Create a HOC factory that can combine Declarative Store Provider with other providers
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
      
      WithCustomProvider.displayName = `with${contextName}DeclarativeCustomProvider(${WrappedComponent.displayName || WrappedComponent.name})`;
      
      return WithCustomProvider;
    };
  }

  // 패턴 객체 반환
  return {
    // Provider 컴포넌트
    Provider,
    
    // Registry 접근
    useRegistry,
    
    // 타입 안전한 Store 접근
    useStore,
    
    // 유틸리티 Hooks
    useRegistryInfo,
    useRegistryActions,
    
    // HOC 패턴
    withProvider,
    withCustomProvider,
    
    // Schema와 Registry 클래스 (고급 사용)
    schema,
    DeclarativeStoreRegistry,
    
    // Context 정보 (디버깅용)
    contextName,
    RegistryContext
  };
}

/**
 * Declarative Store Pattern 생성 함수 (간편 사용)
 * 
 * @example
 * ```typescript
 * interface UserStores extends {} {
 *   profile: { id: string; name: string };
 *   preferences: { theme: 'light' | 'dark' };
 * }
 * 
 * const UserStores = createDeclarativeStores('User', {
 *   profile: { initialValue: { id: '', name: '' } },
 *   preferences: { initialValue: { theme: 'light' } }
 * });
 * 
 * // Usage
 * function UserProfile() {
 *   const profileStore = UserStores.useStore('profile'); // 완전 타입 안전함
 *   const profile = useStoreValue(profileStore);
 *   
 *   return <div>Hello, {profile.name}!</div>;
 * }
 * ```
 */
export function createDeclarativeStores<T extends {}>(
  contextName: string,
  schema: StoreSchema<T>
) {
  return createDeclarativeStorePattern(contextName, schema);
}