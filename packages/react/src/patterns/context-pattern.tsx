/**
 * Unified Context Pattern - Store + Action integration
 * 
 * Provider별로 독립적인 StoreRegistry와 ActionRegister를 모두 생성하고,
 * 해당 Provider 범위 내에서만 Store와 Action에 접근할 수 있는 통합 패턴
 * 
 * @module patterns/context-pattern
 * @version 1.0.0
 */

import React, { createContext, useContext, useMemo, ReactNode, useId, useRef } from 'react';
import { ActionPayloadMap, ActionRegister, ActionHandler, HandlerConfig, ActionRegisterConfig } from '@context-action/core';
import { LogLevel } from '@context-action/logger';
import { StoreRegistry } from '../stores/core/StoreRegistry';
import { generateStoreName, getOrCreateRegistryStore } from '../stores/patterns/isolation-utils';
import { createStore } from '../stores/core/Store';
import type { ComparisonOptions } from '../stores/utils/comparison';

/**
 * 통합 Context 설정 옵션
 */
export interface ContextPatternConfig extends ActionRegisterConfig {
  /** Log level for the logger */
  logLevel?: LogLevel;
  /** Whether to enable debug mode */
  debug?: boolean;
}

/**
 * 통합 Context 타입 - Store + Action
 */
export interface UnifiedContextType<T extends ActionPayloadMap = ActionPayloadMap> {
  storeRegistry: StoreRegistry;
  actionRegisterRef: React.RefObject<ActionRegister<T>>;
}

/**
 * 통합 Context 패턴 반환 타입
 */
export interface ContextPatternReturn<T extends ActionPayloadMap = ActionPayloadMap> {
  // Provider 컴포넌트
  Provider: React.FC<{ children: ReactNode; registryId?: string }>;
  
  // Store 관련 hooks
  useStoreRegistry: () => StoreRegistry;
  useStore: <V>(
    storeName: string,
    initialValue: V | (() => V),
    options?: {
      strategy?: 'reference' | 'shallow' | 'deep';
      debug?: boolean;
      comparisonOptions?: Partial<ComparisonOptions<V>>;
    }
  ) => ReturnType<typeof createStore<V>>;
  useIsolatedStore: <V>(
    domain: string,
    initialValue: V | (() => V),
    options?: {
      strategy?: 'reference' | 'shallow' | 'deep';
      debug?: boolean;
      comparisonOptions?: Partial<ComparisonOptions<V>>;
    }
  ) => ReturnType<typeof createStore<V>>;
  
  // Action 관련 hooks
  useActionRegister: () => ActionRegister<T>;
  useAction: () => ActionRegister<T>['dispatch'];
  useActionHandler: <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => void;
  
  // 통합 관리 hooks
  useContext: () => UnifiedContextType<T>;
  useRegistryInfo: () => {
    name: string;
    storeCount: number;
    actionCount: number;
    storeNames: string[];
  };
  useClearAll: () => {
    clearStores: () => void;
    clearActions: () => void;
    clearAll: () => void;
  };
  
  // HOC patterns
  withProvider: (registryId?: string) => <P extends {}>(
    WrappedComponent: React.ComponentType<P>
  ) => React.FC<P>;
  
  // Context 정보
  contextName: string;
}

/**
 * 통합 Context 패턴 팩토리 함수
 * 
 * Store와 Action을 모두 포함하는 통합 Context 패턴을 생성합니다.
 * 각 Provider는 독립적인 Store Registry와 Action Register를 가지며, 완전한 격리를 보장합니다.
 * 
 * @template T - Action payload map type
 * @param contextName - Context 이름 (Registry 식별용)
 * @param config - Context 설정 옵션
 * @returns Provider 컴포넌트와 Store/Action 접근 Hooks
 * 
 * @example
 * ```typescript
 * // 1. 통합 Context 패턴 생성
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string };
 *   fetchData: { endpoint: string };
 * }
 * 
 * const AppContext = createContextPattern<AppActions>('app', {
 *   logLevel: LogLevel.DEBUG
 * });
 * 
 * // 2. Provider로 완전한 격리
 * function App() {
 *   return (
 *     <AppContext.Provider>
 *       <UserProfile />
 *       <DataFetcher />
 *     </AppContext.Provider>
 *   );
 * }
 * 
 * // 3. Store와 Action 모두 사용
 * function UserProfile() {
 *   // Store 사용
 *   const userStore = AppContext.useStore('user', { name: '', email: '' });
 *   const user = useStoreValue(userStore);
 *   
 *   // Action 사용
 *   const dispatch = AppContext.useAction();
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
 *     </div>
 *   );
 * }
 * ```
 */
export function createContextPattern<T extends ActionPayloadMap = ActionPayloadMap>(
  contextName: string,
  config?: ContextPatternConfig
): ContextPatternReturn<T> {
  
  const UnifiedContext = createContext<UnifiedContextType<T> | null>(null);
  
  /**
   * 통합 Provider - Store + Action 모두 제공
   */
  function Provider({ children, registryId }: { 
    children: ReactNode; 
    registryId?: string;
  }) {
    const componentId = useId();
    
    // Store Registry 생성
    const storeRegistry = useMemo(() => {
      const uniqueId = registryId || `${contextName}-store-${componentId}`;
      const registryInstance = new StoreRegistry(uniqueId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏪 Store Registry created: ${uniqueId}`);
      }
      
      return registryInstance;
    }, [registryId, componentId]);
    
    // Action Register 생성
    const actionRegisterRef = useRef(new ActionRegister<T>({
      name: config?.name || `${contextName}-action-${componentId}`
    }));
    
    if (process.env.NODE_ENV === 'development' && config?.debug) {
      console.log(`🎯 Unified Context Pattern created: ${contextName}`, {
        storeRegistry: storeRegistry.name,
        actionRegister: `${contextName}-action-${componentId}`
      });
    }
    
    const contextValue = useMemo(() => ({
      storeRegistry,
      actionRegisterRef
    }), [storeRegistry]);
    
    return (
      <UnifiedContext.Provider value={contextValue}>
        {children}
      </UnifiedContext.Provider>
    );
  }
  
  /**
   * Context 접근 Hook
   */
  function useUnifiedContext(): UnifiedContextType<T> {
    const context = useContext(UnifiedContext);
    
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
    const { storeRegistry } = useUnifiedContext();
    return storeRegistry;
  }
  
  /**
   * Store 생성/접근 Hook - 타입 안전성이 보장된 Store 반환
   */
  function useStore<V>(
    storeName: string,
    initialValue: V | (() => V),
    options: {
      strategy?: 'reference' | 'shallow' | 'deep';
      debug?: boolean;
      comparisonOptions?: Partial<ComparisonOptions<V>>;
    } = {}
  ): ReturnType<typeof createStore<V>> {
    const registry = useStoreRegistry();
    const { strategy = 'reference', debug = process.env.NODE_ENV === 'development', comparisonOptions } = options;
    
    return useMemo(() => {
      // 초기값 검증
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
        comparisonOptions
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
   * 격리된 Store Hook
   */
  function useIsolatedStore<V>(
    domain: string,
    initialValue: V | (() => V),
    options: {
      strategy?: 'reference' | 'shallow' | 'deep';
      debug?: boolean;
      comparisonOptions?: Partial<ComparisonOptions<V>>;
    } = {}
  ): ReturnType<typeof createStore<V>> {
    const registry = useStoreRegistry();
    const componentId = useId();
    const storeName = generateStoreName(domain, componentId);
    
    const { strategy = 'reference', debug = process.env.NODE_ENV === 'development', comparisonOptions } = options;
    
    return useMemo(() => {
      const resolvedInitialValue = typeof initialValue === 'function' 
        ? (initialValue as () => V)() 
        : initialValue;
      
      const { store } = getOrCreateRegistryStore({
        storeName,
        initialValue: resolvedInitialValue,
        strategy,
        debug,
        comparisonOptions
      }, registry);
      
      return store;
    }, [storeName, registry]);
  }
  
  /**
   * Action Register 접근 Hook
   */
  function useActionRegister(): ActionRegister<T> {
    const { actionRegisterRef } = useUnifiedContext();
    
    if (!actionRegisterRef.current) {
      throw new Error('ActionRegister is not initialized');
    }
    
    return actionRegisterRef.current;
  }
  
  /**
   * Action dispatch Hook
   */
  function useAction(): ActionRegister<T>['dispatch'] {
    const { actionRegisterRef } = useUnifiedContext();
    
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
    const { actionRegisterRef } = useUnifiedContext();
    const componentId = useId();
    
    React.useEffect(() => {
      if (!actionRegisterRef.current) {
        throw new Error('ActionRegister is not initialized');
      }
      
      const unregister = actionRegisterRef.current.register(
        action,
        handler,
        { ...config, id: config?.id || componentId }
      );
      
      return () => {
        unregister();
      };
    }, [action, handler, config?.id, config?.priority, config?.blocking, componentId, actionRegisterRef.current]);
  }
  
  /**
   * Registry 정보 조회 Hook
   */
  function useRegistryInfo() {
    const { storeRegistry, actionRegisterRef } = useUnifiedContext();
    
    return useMemo(() => ({
      name: storeRegistry.name,
      storeCount: storeRegistry.getStoreCount(),
      actionCount: 0, // ActionRegister doesn't expose total handler count
      storeNames: storeRegistry.getStoreNames()
    }), [storeRegistry, actionRegisterRef.current]);
  }
  
  /**
   * 전체 정리 Hook
   */
  function useClearAll() {
    const { storeRegistry, actionRegisterRef } = useUnifiedContext();
    
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
      }
    }), [storeRegistry, actionRegisterRef.current]);
  }
  
  /**
   * HOC that wraps a component with this Unified Provider
   */
  function withProvider(registryId?: string) {
    return function <P extends {}>(
      WrappedComponent: React.ComponentType<P>
    ): React.FC<P> {
      const WithUnifiedProvider = (props: P) => (
        <Provider registryId={registryId}>
          <WrappedComponent {...props} />
        </Provider>
      );
      
      WithUnifiedProvider.displayName = `with${contextName}Provider(${WrappedComponent.displayName || WrappedComponent.name})`;
      
      return WithUnifiedProvider;
    };
  }
  
  return {
    // Provider 컴포넌트
    Provider,
    
    // Store 관련 hooks
    useStoreRegistry,
    useStore,
    useIsolatedStore,
    
    // Action 관련 hooks
    useActionRegister,
    useAction,
    useActionHandler,
    
    // 통합 관리 hooks
    useContext: useUnifiedContext,
    useRegistryInfo,
    useClearAll,
    
    // HOC patterns
    withProvider,
    
    // Context 정보
    contextName
  };
}