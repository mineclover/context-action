/**
 * 테스트용 Provider 컴포넌트
 * 실제 Provider들을 모방하면서 테스트에 최적화된 기능 제공
 */

import React, { createContext, useContext, useMemo } from 'react';
import { Store } from '../stores/core/Store';
import { MockStore } from './mock-store';
import { StoreRegistry } from '../stores/core/StoreRegistry';

export interface TestProviderProps {
  /** 자식 컴포넌트들 */
  children: React.ReactNode;
  /** Store들의 맵 */
  stores: Record<string, Store<any> | MockStore<any>>;
  /** 테스트 설정 */
  config?: {
    /** 디버그 모드 활성화 */
    debug?: boolean;
    /** Store 업데이트 로깅 */
    logUpdates?: boolean;
    /** 테스트 모드 식별자 */
    testMode?: boolean;
  };
}

interface TestContextValue {
  /** Store 레지스트리 */
  registry: StoreRegistry;
  /** Store들 */
  stores: Record<string, Store<any> | MockStore<any>>;
  /** 테스트 설정 */
  config: Required<NonNullable<TestProviderProps['config']>>;
}

const TestContext = createContext<TestContextValue | null>(null);

/**
 * 테스트용 Context Provider
 * 실제 애플리케이션의 Provider들을 대체하여 테스트 환경 구성
 */
export const TestProvider: React.FC<TestProviderProps> = ({
  children,
  stores,
  config = {}
}) => {
  const finalConfig = useMemo(() => ({
    debug: false,
    logUpdates: false,
    testMode: true,
    ...config
  }), [config]);

  // 테스트용 레지스트리 생성
  const registry = useMemo(() => {
    const testRegistry = new StoreRegistry('test-registry');
    
    // Store들을 레지스트리에 등록
    Object.entries(stores).forEach(([name, store]) => {
      testRegistry.register(name, store, {
        tags: ['test'],
        description: `Test store: ${name}`,
        debug: finalConfig.debug
      });
    });

    return testRegistry;
  }, [stores, finalConfig.debug]);

  // 업데이트 로깅 설정
  React.useEffect(() => {
    if (!finalConfig.logUpdates) return;

    const unsubscribers: Array<() => void> = [];

    Object.entries(stores).forEach(([name, store]) => {
      if ('subscribe' in store) {
        const unsubscribe = store.subscribe(() => {
          if (finalConfig.debug) {
            console.log(`[TestProvider] Store ${name} updated:`, store.getValue());
          }
        });
        unsubscribers.push(unsubscribe);
      }
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [stores, finalConfig.logUpdates, finalConfig.debug]);

  const contextValue = useMemo<TestContextValue>(() => ({
    registry,
    stores,
    config: finalConfig
  }), [registry, stores, finalConfig]);

  return (
    <TestContext.Provider value={contextValue}>
      {children}
    </TestContext.Provider>
  );
};

/**
 * 테스트 컨텍스트에 접근하는 훅
 */
export function useTestContext(): TestContextValue {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTestContext must be used within a TestProvider');
  }
  return context;
}

/**
 * 테스트 환경에서 Store에 접근하는 훅
 */
export function useTestStore<T>(storeName: string): Store<T> | MockStore<T> {
  const { stores } = useTestContext();
  const store = stores[storeName];
  
  if (!store) {
    throw new Error(`Store "${storeName}" not found in test context. Available stores: ${Object.keys(stores).join(', ')}`);
  }
  
  return store;
}

/**
 * 테스트 환경에서 레지스트리에 접근하는 훅
 */
export function useTestRegistry(): StoreRegistry {
  const { registry } = useTestContext();
  return registry;
}

/**
 * 테스트 설정에 접근하는 훅
 */
export function useTestConfig(): Required<NonNullable<TestProviderProps['config']>> {
  const { config } = useTestContext();
  return config;
}

/**
 * 테스트 환경 확인 훅
 */
export function useIsInTestMode(): boolean {
  const context = useContext(TestContext);
  if (!context) {
    return false;
  }
  return context.config.testMode;
}

/**
 * HOC: 컴포넌트를 TestProvider로 래핑
 */
export function withTestProvider<P extends object>(
  Component: React.ComponentType<P>,
  stores: Record<string, Store<any> | MockStore<any>>,
  config?: TestProviderProps['config']
) {
  const WrappedComponent = (props: P) => (
    <TestProvider stores={stores} config={config}>
      <Component {...props} />
    </TestProvider>
  );

  WrappedComponent.displayName = `withTestProvider(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * 다중 Provider를 중첩할 때 사용하는 컴포즈 헬퍼
 */
export interface ProviderConfig {
  component: React.ComponentType<any>;
  props?: any;
}

export function composeProviders(
  providers: ProviderConfig[],
  children: React.ReactNode
): React.ReactElement {
  return providers.reduceRight(
    (acc, { component: Provider, props = {} }) => (
      <Provider {...props}>{acc}</Provider>
    ),
    <>{children}</>
  );
}

/**
 * 테스트용 Provider 컴포즈 헬퍼
 */
export function createTestProviderComposer() {
  const providers: ProviderConfig[] = [];

  const composer = {
    add: (component: React.ComponentType<any>, props: any = {}) => {
      providers.push({ component, props });
      return composer;
    },
    addTestProvider: (stores: Record<string, Store<any> | MockStore<any>>, config?: TestProviderProps['config']) => {
      providers.push({ 
        component: TestProvider, 
        props: { stores, config } 
      });
      return composer;
    },
    render: (children: React.ReactNode) => composeProviders(providers, children)
  };

  return composer;
}

/**
 * 조건부 테스트 Provider
 * 조건에 따라 Provider를 적용하거나 무시
 */
export interface ConditionalTestProviderProps extends TestProviderProps {
  /** Provider 적용 조건 */
  condition: boolean;
  /** 조건이 false일 때 사용할 대체 래퍼 */
  fallback?: React.ComponentType<{ children: React.ReactNode }>;
}

export const ConditionalTestProvider: React.FC<ConditionalTestProviderProps> = ({
  condition,
  fallback: Fallback,
  children,
  ...testProviderProps
}) => {
  if (condition) {
    return <TestProvider {...testProviderProps}>{children}</TestProvider>;
  }

  if (Fallback) {
    return <Fallback>{children}</Fallback>;
  }

  return <>{children}</>;
};