/**
 * Action Context Pattern - Store + Action integration
 * 
 * Provider별로 독립적인 StoreRegistry와 ActionRegister를 모두 생성하고,
 * 해당 Provider 범위 내에서만 Store와 Action에 접근할 수 있는 통합 패턴
 * 
 * Declarative Store Pattern과 호환되는 최신 스펙을 따릅니다.
 * 
 * @module patterns/action-context-pattern
 */

import React, { createContext, useContext, useMemo, ReactNode, useRef, useEffect } from 'react';
import { ActionPayloadMap, ActionRegister, ActionHandler, HandlerConfig, ActionRegisterConfig } from '@context-action/core';
import { LogLevel } from '@context-action/logger';
import { StoreRegistry } from '../stores/core/StoreRegistry';
import { createStore } from '../stores/core/Store';
import type { ComparisonOptions } from '../stores/utils/comparison';
import type { StoreConfig } from '../stores/patterns/declarative-store-registry';

/**
 * Action Context 설정 옵션
 */
export interface ActionContextPatternConfig extends ActionRegisterConfig {
  /** Log level for the logger */
  logLevel?: LogLevel;
  /** Whether to enable debug mode */
  debug?: boolean;
}

/**
 * Action Context 타입 - Store + Action
 */
export interface ActionContextType<T extends ActionPayloadMap = ActionPayloadMap> {
  storeRegistry: StoreRegistry;
  actionRegisterRef: React.RefObject<ActionRegister<T>>;
}

/**
 * Action Context 패턴 반환 타입 - 최신 Declarative Store 스펙 호환
 */
export interface ActionContextPatternReturn<T extends ActionPayloadMap = ActionPayloadMap> {
  // Provider 컴포넌트
  Provider: React.FC<{ children: ReactNode; registryId?: string }>;
  
  // Store 관련 hooks - Declarative Store 패턴과 호환
  useStoreRegistry: () => StoreRegistry;
  useStore: <V>(
    storeName: string,
    initialValue: V | (() => V),
    options?: Partial<StoreConfig<V>>
  ) => ReturnType<typeof createStore<V>>;
  
  // Action 관련 hooks
  useActionRegister: () => ActionRegister<T>;
  useAction: () => ActionRegister<T>['dispatch'];
  useActionHandler: <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => void;
  
  // 통합 관리 hooks - Declarative Store 패턴과 호환
  useContext: () => ActionContextType<T>;
  useRegistryInfo: () => {
    name: string;
    storeCount: number;
    actionCount: number;
    storeNames: string[];
    initialized: string[];
  };
  useRegistryActions: () => {
    clearStores: () => void;
    clearActions: () => void;
    clearAll: () => void;
    removeStore: (storeName: string) => boolean;
  };
  
  // HOC patterns - Declarative Store 패턴과 호환
  withProvider: (registryId?: string) => <P extends {}>(
    WrappedComponent: React.ComponentType<P>
  ) => React.FC<P>;
  withCustomProvider: (
    wrapperComponent: React.ComponentType<{ children: ReactNode }>,
    registryId?: string
  ) => <P extends {}>(
    WrappedComponent: React.ComponentType<P>
  ) => React.FC<P>;
  
  // Context 정보
  contextName: string;
}

/**
 * Helper function to get or create store from registry
 * Declarative Store Pattern 호환 버전
 */
function getOrCreateRegistryStore<T>(
  options: {
    storeName: string;
    initialValue: T;
    strategy?: 'reference' | 'shallow' | 'deep';
    debug?: boolean;
    comparisonOptions?: Partial<ComparisonOptions<T>>;
    description?: string;
    tags?: string[];
    version?: string;
  },
  registry: StoreRegistry
): { store: ReturnType<typeof createStore<T>>; wasCreated: boolean } {
  const { 
    storeName, 
    initialValue, 
    strategy = 'reference', 
    debug = false, 
    comparisonOptions,
    description,
    tags,
    version
  } = options;
  
  // Check if store already exists in registry
  const existingStore = registry.getStore(storeName);
  if (existingStore) {
    if (debug && process.env.NODE_ENV === 'development') {
      console.log(`🔄 Using existing store: ${storeName}`);
    }
    return { 
      store: existingStore as ReturnType<typeof createStore<T>>,
      wasCreated: false
    };
  }
  
  // Create new store
  const store = createStore(storeName, initialValue);
  
  // Set comparison options - Declarative Store Pattern 호환
  const finalComparisonOptions = {
    strategy,
    ...comparisonOptions
  };
  store.setComparisonOptions(finalComparisonOptions);
  
  // Register store with enhanced metadata
  registry.register(storeName, store, {
    name: storeName,
    tags: tags ?? ['action-context', strategy, ...(version ? [`v${version}`] : [])],
    description: description ?? `Action Context store: ${storeName} with ${strategy} comparison`
  });
  
  if (debug && process.env.NODE_ENV === 'development') {
    console.log(`🏪 Action Context store created: ${storeName}`, {
      strategy,
      registryName: registry.name,
      description,
      tags: tags ?? ['action-context', strategy],
      version
    });
  }
  
  return { store, wasCreated: true };
}

/**
 * Action Context 패턴 팩토리 함수
 * 
 * Store와 Action을 모두 포함하는 통합 Context 패턴을 생성합니다.
 * 각 Provider는 독립적인 Store Registry와 Action Register를 가지며, 완전한 격리를 보장합니다.
 * 
 * @template T Action payload map type
 * @param contextName - Context 이름 (Registry 식별용)
 * @param config - Context 설정 옵션
 * @returns Provider 컴포넌트와 Store/Action 접근 Hooks
 * 
 * @example
 * ```typescript
 * // 1. Action Context 패턴 생성 - Declarative Store 호환
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string };
 *   fetchData: { endpoint: string };
 * }
 * 
 * const AppContext = createActionContextPattern<AppActions>('app', {
 *   logLevel: LogLevel.DEBUG
 * });
 * 
 * // 2. Provider로 완전한 격리 - HOC 패턴 지원
 * const AppWithProviders = AppContext.withCustomProvider(
 *   ({ children }) => (
 *     <ThemeProvider>
 *       <ErrorBoundary>
 *         {children}
 *       </ErrorBoundary>
 *     </ThemeProvider>
 *   ),
 *   'app-main'
 * )(App);
 * 
 * // 3. Store와 Action 모두 사용 - 향상된 Store Config 지원
 * function UserProfile() {
 *   // Store 사용 - Declarative Store Config 지원
 *   const userStore = AppContext.useStore('user', { name: '', email: '' }, {
 *     strategy: 'shallow',
 *     description: 'User profile data',
 *     tags: ['user', 'profile'],
 *     version: '1.0.0'
 *   });
 *   const user = useStoreValue(userStore);
 *   
 *   // Action 사용
 *   const dispatch = AppContext.useAction();
 *   
 *   // Registry 액션 사용
 *   const { clearStores, removeStore } = AppContext.useRegistryActions();
 *   
 *   // Action Handler 등록
 *   AppContext.useActionHandler('updateUser', async (payload) => {
 *     userStore.setValue({ ...user, ...payload });
 *   });
 *   
 *   const handleUpdate = () => {
 *     dispatch('updateUser', { id: '1', name: 'John' });
 *   };
 *   
 *   return (
 *     <div>
 *       <div>User: {user.name}</div>
 *       <button onClick={handleUpdate}>Update</button>
 *       <button onClick={() => removeStore('user')}>Remove Store</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function createActionContextPattern<T extends ActionPayloadMap = ActionPayloadMap>(
  contextName: string,
  config?: ActionContextPatternConfig
): ActionContextPatternReturn<T> {
  
  const ActionContext = createContext<ActionContextType<T> | null>(null);
  
  /**
   * Provider - Store + Action 모두 제공
   */
  function Provider({ children, registryId }: { 
    children: ReactNode; 
    registryId?: string;
  }) {
    // Simple ID generation without useId
    const uniqueId = registryId || `${contextName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store Registry 생성
    const storeRegistry = useMemo(() => {
      const registryInstance = new StoreRegistry(uniqueId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏪 Store Registry created: ${uniqueId}`);
      }
      
      return registryInstance;
    }, [uniqueId]);
    
    // Action Register 생성
    const actionRegisterRef = useRef(new ActionRegister<T>({
      name: config?.name || `${contextName}-action-${uniqueId}`
    }));
    
    if (process.env.NODE_ENV === 'development' && config?.debug) {
      console.log(`🎯 Action Context Pattern created: ${contextName}`, {
        storeRegistry: storeRegistry.name,
        actionRegister: `${contextName}-action-${uniqueId}`
      });
    }
    
    const contextValue = useMemo(() => ({
      storeRegistry,
      actionRegisterRef
    }), [storeRegistry]);
    
    return (
      <ActionContext.Provider value={contextValue}>
        {children}
      </ActionContext.Provider>
    );
  }
  
  /**
   * Context 접근 Hook
   */
  function useActionContext(): ActionContextType<T> {
    const context = useContext(ActionContext);
    
    if (!context) {
      throw new Error(
        `Context hooks must be used within ${contextName} Provider. ` +
        `Make sure your component is wrapped with <${contextName}.Provider>.`
      );
    }
    
    return context;
  }
  
  /**
   * Store Registry 접근 Hook
   */
  function useStoreRegistry(): StoreRegistry {
    const { storeRegistry } = useActionContext();
    return storeRegistry;
  }
  
  /**
   * Store 생성/접근 Hook - Declarative Store Config 지원
   * 타입 안전성이 보장된 Store 반환
   */
  function useStore<V>(
    storeName: string,
    initialValue: V | (() => V),
    options: Partial<StoreConfig<V>> = {}
  ): ReturnType<typeof createStore<V>> {
    const registry = useStoreRegistry();
    
    // Declarative Store Config에서 옵션 추출
    const {
      strategy = 'reference',
      debug = process.env.NODE_ENV === 'development',
      comparisonOptions,
      description,
      tags,
      version
    } = options;
    
    return useMemo(() => {
      // 초기값 해결
      const resolvedInitialValue = typeof initialValue === 'function' 
        ? (initialValue as () => V)() 
        : initialValue;
      
      // 개발 모드에서 초기값 검증
      if (process.env.NODE_ENV === 'development') {
        if (resolvedInitialValue === undefined) {
          console.warn(
            `useStore: Store "${storeName}" initialized with undefined value. ` +
            'This might cause type safety issues. Consider using null or a default value instead.'
          );
        }
      }
      
      const { store } = getOrCreateRegistryStore({
        storeName,
        initialValue: resolvedInitialValue,
        strategy,
        debug,
        comparisonOptions,
        description,
        tags,
        version
      }, registry);
      
      // Store가 제대로 생성되었는지 검증
      if (!store) {
        throw new Error(
          `Failed to create store "${storeName}" in context "${contextName}". ` +
          'This might indicate a configuration issue.'
        );
      }
      
      return store;
    }, [storeName, registry]);
  }
  
  /**
   * Action Register 접근 Hook
   */
  function useActionRegister(): ActionRegister<T> {
    const { actionRegisterRef } = useActionContext();
    
    if (!actionRegisterRef.current) {
      throw new Error('ActionRegister is not initialized');
    }
    
    return actionRegisterRef.current;
  }
  
  /**
   * Action dispatch Hook
   */
  function useAction(): ActionRegister<T>['dispatch'] {
    const { actionRegisterRef } = useActionContext();
    
    return useMemo(() => {
      if (!actionRegisterRef.current) {
        throw new Error('ActionRegister is not initialized');
      }
      
      const boundDispatch = actionRegisterRef.current.dispatch.bind(actionRegisterRef.current);
      
      return boundDispatch as ActionRegister<T>['dispatch'];
    }, [actionRegisterRef.current]);
  }
  
  /**
   * Action Handler 등록 Hook
   */
  function useActionHandler<K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) {
    const { actionRegisterRef } = useActionContext();
    
    useEffect(() => {
      if (!actionRegisterRef.current) {
        throw new Error('ActionRegister is not initialized');
      }
      
      const unregister = actionRegisterRef.current.register(
        action,
        handler,
        config
      );
      
      return () => {
        unregister();
      };
    }, [action, handler, config?.id, config?.priority, config?.blocking]);
  }
  
  /**
   * Registry 정보 조회 Hook - Declarative Store 호환
   */
  function useRegistryInfo() {
    const { storeRegistry, actionRegisterRef } = useActionContext();
    
    return useMemo(() => ({
      name: storeRegistry.name,
      storeCount: storeRegistry.getStoreCount(),
      actionCount: 0, // ActionRegister doesn't expose total handler count
      storeNames: storeRegistry.getStoreNames(),
      initialized: storeRegistry.getStoreNames() // Action Context에서는 생성 즉시 초기화됨
    }), [storeRegistry, actionRegisterRef.current]);
  }
  
  /**
   * Registry 액션 관리 Hook - Declarative Store 호환
   */
  function useRegistryActions() {
    const { storeRegistry, actionRegisterRef } = useActionContext();
    
    return useMemo(() => ({
      clearStores: () => {
        storeRegistry.clear();
      },
      clearActions: () => {
        if (actionRegisterRef.current) {
          actionRegisterRef.current.clearAll();
        }
      },
      clearAll: () => {
        storeRegistry.clear();
        actionRegisterRef.current?.clearAll();
      },
      removeStore: (storeName: string) => {
        return storeRegistry.unregister(storeName);
      }
    }), [storeRegistry, actionRegisterRef.current]);
  }
  
  /**
   * HOC that wraps a component with this Action Context Provider
   */
  function withProvider(registryId?: string) {
    return function <P extends {}>(
      WrappedComponent: React.ComponentType<P>
    ): React.FC<P> {
      const WithActionProvider = (props: P) => (
        <Provider registryId={registryId}>
          <WrappedComponent {...props} />
        </Provider>
      );
      
      WithActionProvider.displayName = `with${contextName}Provider(${WrappedComponent.displayName || WrappedComponent.name})`;
      
      return WithActionProvider;
    };
  }
  
  /**
   * HOC factory that combines Action Context Provider with custom providers
   * Declarative Store Pattern 호환
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
      
      WithCustomProvider.displayName = `with${contextName}ActionCustomProvider(${WrappedComponent.displayName || WrappedComponent.name})`;
      
      return WithCustomProvider;
    };
  }
  
  return {
    // Provider 컴포넌트
    Provider,
    
    // Store 관련 hooks - Declarative Store 호환
    useStoreRegistry,
    useStore,
    
    // Action 관련 hooks
    useActionRegister,
    useAction,
    useActionHandler,
    
    // 통합 관리 hooks - Declarative Store 호환
    useContext: useActionContext,
    useRegistryInfo,
    useRegistryActions, // useClearAll을 useRegistryActions로 변경
    
    // HOC patterns - Declarative Store 호환
    withProvider,
    withCustomProvider, // 새로 추가
    
    // Context 정보
    contextName
  };
}

// Legacy export removed - use createActionContextPattern instead