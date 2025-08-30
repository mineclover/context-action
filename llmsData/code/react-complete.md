# Context-Action React Package - Complete Code

Total Files: 48
Total Lines: 6001

## Type Definitions

### actions/ActionContext.types.ts

```typescript
import { ReactNode } from 'react';
import { 
  ActionRegister, 
  ActionHandler, 
  HandlerConfig, 
  ActionRegisterConfig, 
  DispatchOptions, 
  ExecutionResult 
} from '@context-action/core';
export interface ActionContextConfig extends ActionRegisterConfig {
  name?: string;
}
export interface ActionContextType<T extends {}> {
  actionRegisterRef: React.RefObject<ActionRegister<T>>;
}
export interface ActionContextReturn<T extends {}> {
  Provider: React.FC<{ children: ReactNode }>;
  useActionContext: () => ActionContextType<T>;
  useActionDispatch: () => ActionRegister<T>['dispatch'];
  useActionHandler: <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => void;
  useActionRegister: () => ActionRegister<T> | null;
  useActionDispatchWithResult: () => {
    dispatch: <K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ) => Promise<void>;
    dispatchWithResult: <K extends keyof T, R = void>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ) => Promise<ExecutionResult<R>>;
    abortAll: () => void;
    resetAbortScope: () => void;
  };
  context: React.Context<ActionContextType<T> | null>;
}
```

### refs/types.ts

```typescript
export interface RefTarget {
  readonly [key: string]: any;
}
export interface DOMRefTarget extends RefTarget, Element {}
export interface ThreeRefTarget extends RefTarget {
  uuid: string;
  name?: string;
  type: string;
  parent?: ThreeRefTarget | null;
  children?: ThreeRefTarget[];
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  visible?: boolean;
  add?(object: ThreeRefTarget): void;
  remove?(object: ThreeRefTarget): void;
  traverse?(callback: (object: ThreeRefTarget) => void): void;
  dispose?(): void;
}
export interface RefState<T extends RefTarget = RefTarget> {
  target: T | null;
  isReady: boolean;
  isMounted: boolean;
  mountPromise: Promise<T> | null;
  mountedAt?: number;
  error?: Error | null;
  metadata?: Record<string, any>;
}
export interface RefOperationResult<T = any> {
  success: boolean;
  result?: T;
  error?: Error;
  duration?: number;
  timestamp: number;
}
export interface RefOperationOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
  priority?: number;
  operationId?: string;
  metadata?: Record<string, any>;
}
export type RefOperation<T extends RefTarget, R = any> = (
  target: T,
  options?: RefOperationOptions
) => R | Promise<R>;
export interface RefInitConfig<T extends RefTarget = RefTarget> {
  name: string;
  initialMetadata?: Record<string, any>;
  mountTimeout?: number;
  autoCleanup?: boolean;
  validator?: (target: any) => target is T;
  cleanup?: (target: T) => void | Promise<void>;
}
export type RefDefinitions = Record<string, RefInitConfig<any>>;
export type InferRefTypes<T extends RefDefinitions> = {
  [K in keyof T]: T[K] extends RefInitConfig<infer R> ? R : RefTarget;
};
export interface RefEvent<T extends RefTarget = RefTarget> {
  type: 'mount' | 'unmount' | 'error' | 'ready' | 'cleanup';
  refName: string;
  target?: T;
  error?: Error;
  timestamp: number;
  metadata?: Record<string, any>;
}
export type RefEventListener<T extends RefTarget = RefTarget> = (
  event: RefEvent<T>
) => void;
```

### stores/core/types.ts

```typescript
export type Listener = () => void;
export type EnhancedListener = {
  listener: Listener;
  errorCount: number;
  lastError?: number;
  componentName?: string;
};
export type Unsubscribe = () => void;
export type Subscribe = (listener: Listener) => Unsubscribe;
export type EnhancedSubscribe = (
  listener: Listener,
  options?: {
    enableRetry?: boolean;
    maxRetries?: number;
    componentName?: string;
  }
) => Unsubscribe;
export interface Snapshot<T = unknown> {
  value: T;
  name: string;
  lastUpdate: number;
  version?: number;
  isValid?: boolean;
  validationError?: string;
  metrics?: {
    creationTime: number;
    sizeEstimate?: number;
    notificationCount?: number;
  };
  security?: {
    validated: boolean;
    sanitized?: boolean;
    trustLevel?: number;
  };
}
export interface IStore<T = unknown> {
  readonly name: string;
  subscribe: Subscribe;
  getSnapshot: () => Snapshot<T>;
  setValue: (value: T, options?: StoreSetValueOptions<T>) => void;
  update: (updater: (current: T) => T) => void;
  getValue: () => T;
  getListenerCount?: () => number;
  dispose?: () => void;
  registerCleanup?: (task: () => void) => () => void;
  isStoreDisposed?: () => boolean;
  getMetrics?: () => StoreMetrics;
  resetMetrics?: () => void;
  setSecurityOptions?: (options: SecurityOptions) => void;
  getSecurityOptions?: () => SecurityOptions | undefined;
}
export interface IStoreRegistry {
  readonly name: string;
  subscribe: Subscribe;
  getSnapshot: () => Array<[string, IStore]>;
  register: (name: string, store: IStore, metadata?: any) => void;
  unregister: (name: string) => boolean;
  getStore: (name: string) => IStore | undefined;
  getAllStores: () => Map<string, IStore>;
  hasStore: (name: string) => boolean;
  getStoreCount: () => number;
  getStoreNames: () => string[];
  clear: () => void;
  forEach: (callback: (store: IStore, name: string) => void) => void;
  dispose?: () => void;
  isDisposed?: () => boolean;
  registerCleanup?: (task: () => void) => () => void;
  getHealthStatus?: () => {
    totalStores: number;
    healthyStores: number;
    errorStores: number;
    disposedStores: number;
    memoryUsage?: number;
  };
  performHealthCheck?: () => Promise<Map<string, boolean>>;
  setSecurityOptions?: (options: SecurityOptions) => void;
  setAutoCleanup?: (enabled: boolean) => void;
}
export interface EventHandler<T = unknown> {
  (data: T): void;  
}
export interface IEventBus {
  on: <T = unknown>(event: string, handler: EventHandler<T>) => Unsubscribe;
  emit: <T = unknown>(event: string, data?: T) => void;
  off: (event: string, handler?: EventHandler) => void;
  clear: () => void;
  getStats?: () => {
    totalEvents: number;
    activeHandlers: number;
    errorCount: number;
  };
  setSecurityOptions?: (options: SecurityOptions) => void;
}
export interface StoreSyncConfig<T, R = Snapshot<T>> {
  defaultValue?: T;
  selector?: (snapshot: Snapshot<T>) => R;
  isEqual?: (prev: R, next: R) => boolean;
  errorBoundary?: boolean;
  suspense?: boolean;
}
export interface HookOptions<T> {
  defaultValue?: T;
  onError?: (error: Error, retryCount?: number) => void | boolean;
  dependencies?: React.DependencyList;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableMetrics?: boolean;
  throttle?: number;
  debounce?: number;
}
export interface StoreSetValueOptions<T> {
  skipClone?: boolean;
  skipComparison?: boolean;
  eventHandling?: 'block' | 'transform' | 'allow';
  eventTransform?: (event: any) => T;
  sanitizer?: (value: T) => T;
  validator?: (value: T) => boolean | string;
}
export interface SubscriptionMetadata {
  subscribedAt: number;
  errorCount: number;
  enhancedListener: () => void;
  componentName?: string;
}
export interface ResourceMonitor {
  memoryUsage: number;
  activeSubscriptions: number;
  pendingOperations: number;
  lastActivity: number;
  dispose(): void;
}
export interface StoreMetrics {
  totalSets: number;
  totalGets: number;
  totalUpdates: number;
  totalNotifications: number;
  averageOperationTime: number;
  peakListenerCount: number;
  totalErrors: number;
}
export interface CleanupTask {
  task: () => void;
  id?: string;
  priority?: number;
  timeout?: number;
}
export interface SecurityOptions {
  preventPrototypePollution?: boolean;
  preventXSS?: boolean;
  maxDepth?: number;
  maxStringLength?: number;
  allowedProperties?: RegExp;
  blockedProperties?: RegExp;
}
export interface RegistryStoreMap {
  [key: string]: unknown;  
}
export type StrictStoreDefinitions<T extends Record<string, unknown>> = {
  [K in keyof T]: {
    initialValue: T[K];
  } | T[K];
};
export interface StrictStoreContextReturn<T extends Record<string, unknown>> {
  Provider: React.ComponentType<{ children: React.ReactNode }>;
  useStore: <K extends keyof T>(name: K) => IStore<T[K]>;
  useStoreManager?: () => {
    getStore: <K extends keyof T>(name: K) => IStore<T[K]> | undefined;
    getAllStores: () => Map<string, IStore>;
    hasStore: (name: string) => boolean;
  };
}
export interface DynamicStoreOptions<T> {
  defaultValue?: T;
  createIfNotExists?: boolean;
  onNotFound?: (storeName: string) => void;
  securityOptions?: SecurityOptions;
  autoCleanup?: boolean;
  enableMetrics?: boolean;
}
```

## Implementation Code

### actions/ActionContext.tsx

```typescript
import React, { createContext, ReactNode, useContext, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import {  ActionRegister, ActionHandler, HandlerConfig, DispatchOptions, ExecutionResult } from '@context-action/core';
import type {
  ActionContextConfig,
  ActionContextType,
  ActionContextReturn
} from './ActionContext.types';
export function createActionContext<T extends {}>(
  contextName: string,
  config?: ActionContextConfig
): ActionContextReturn<T>;
export function createActionContext<T extends {}>(
  config: ActionContextConfig
): ActionContextReturn<T>;
export function createActionContext<T extends {}>(
  contextNameOrConfig: string | ActionContextConfig = {},
  config?: ActionContextConfig
): ActionContextReturn<T> {
  let effectiveConfig: ActionContextConfig;
  let contextName: string;
  if (typeof contextNameOrConfig === 'string') {
    contextName = contextNameOrConfig;
    effectiveConfig = { ...config, name: config?.name || contextName };
  } else {
    effectiveConfig = contextNameOrConfig;
    contextName = effectiveConfig.name || 'ActionContext';
  }
  const FactoryActionContext = createContext<ActionContextType<T> | null>(null);
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const actionRegisterRef = useRef<ActionRegister<T>>(new ActionRegister<T>(effectiveConfig));
    const contextValue = useMemo(() => ({
      actionRegisterRef,
    }), []);
    return (
      <FactoryActionContext.Provider value={contextValue}>
        {children}
      </FactoryActionContext.Provider>
    );
  };
  const useFactoryActionContext = (): ActionContextType<T> => {
    const context = useContext(FactoryActionContext);
    if (!context) {
      throw new Error('useFactoryActionContext must be used within a factory ActionContext Provider');
    }
    return context;
  };
  const useActionDispatcher = () => {
    const { actionRegisterRef } = useFactoryActionContext();
    const dispatch = useCallback(<K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<void> => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`React dispatch called for '${String(action)}':`, {
        hasPayload: payload !== undefined,
        hasOptions: options !== undefined,
        timestamp: new Date().toISOString()
      });
      }
      const register = actionRegisterRef.current;
      if (!register) {
        throw new Error(
          'ActionRegister is not initialized. ' +
          'Make sure the ActionContext Provider is properly set up.'
        );
      }
      const dispatchOptions: DispatchOptions = {
        ...options,
        ...(options?.signal ? {} : {
          autoAbort: {
            enabled: true,
            allowHandlerAbort: true
          }
        })
      };
      return register.dispatch(action, payload, dispatchOptions);
    }, [actionRegisterRef]); 
    const dispatchWithResult = useCallback(<K extends keyof T, R = void>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<ExecutionResult<R>> => {
      const register = actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }
      const dispatchOptions: DispatchOptions = {
        ...options,
        ...(options?.signal ? {} : {
          autoAbort: {
            enabled: true,
            allowHandlerAbort: true
          }
        })
      };
      return register.dispatchWithResult<K, R>(action, payload, dispatchOptions);
    }, [actionRegisterRef]);
    return { dispatch, dispatchWithResult };
  };
  const useAction = (): ActionRegister<T>['dispatch'] => {
    const { dispatch } = useActionDispatcher();
    return dispatch;
  };
  const useActionHandler = <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ): void => {
    const { actionRegisterRef } = useFactoryActionContext();
    const actionId = useId();
    const handlerRef = useRef(handler);
    handlerRef.current = handler;
    const priority = config?.priority ?? 0;
    const id = config?.id || `react_${String(action)}_${actionId}`;
    const blocking = config?.blocking ?? false;
    const once = config?.once ?? false;
    const debounce = config?.debounce;
    const throttle = config?.throttle;
    const stableConfig = useMemo((): HandlerConfig => ({
      priority,
      id,
      blocking,
      once,
      replaceExisting: true,
      ...(debounce !== undefined && { debounce }),
      ...(throttle !== undefined && { throttle })
    }), [priority, id, blocking, once, debounce, throttle]);
    useEffect(() => {
      const register = actionRegisterRef.current;
      if (!register) return;
      const wrapperHandler: ActionHandler<T[K]> = (payload, controller) => {
        return handlerRef.current(payload, controller);
      };
      if (process.env.NODE_ENV === 'development') {
        console.log(`Registering handler for '${String(action)}'`);
      }
      const unregister = register.register(action, wrapperHandler, stableConfig);
      return unregister;
    }, [
      action,
      actionRegisterRef,
      stableConfig 
    ]);
  };
  const useFactoryActionRegister = (): ActionRegister<T> | null => {
    const context = useFactoryActionContext();
    return context.actionRegisterRef.current;
  };
  const useFactoryActionDispatchWithResult = () => {
    const context = useFactoryActionContext();
    const activeControllersRef = useRef<Set<AbortController>>(new Set());
    const dispatch = useCallback(<K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<void> => {
      const register = context.actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }
      const dispatchOptions: DispatchOptions = {
        ...options,
        ...(options?.signal ? {} : {
          autoAbort: {
            enabled: true,
            allowHandlerAbort: true,
            onControllerCreated: (controller) => {
              activeControllersRef.current.add(controller);
            }
          }
        })
      };
      return register.dispatch(action, payload, dispatchOptions);
    }, [context.actionRegisterRef]);
    const dispatchWithResult = useCallback(<K extends keyof T, R = void>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<ExecutionResult<R>> => {
      const register = context.actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }
      const dispatchOptions: DispatchOptions = {
        ...options,
        ...(options?.signal ? {} : {
          autoAbort: {
            enabled: true,
            allowHandlerAbort: true,
            onControllerCreated: (controller) => {
              activeControllersRef.current.add(controller);
            }
          }
        })
      };
      return register.dispatchWithResult<K, R>(action, payload, dispatchOptions);
    }, [context.actionRegisterRef]);
    const abortAll = useCallback(() => {
      activeControllersRef.current.forEach(controller => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      });
      activeControllersRef.current.clear();
    }, []);
    const resetAbortScope = useCallback(() => {
      abortAll();
    }, [abortAll]);
    useEffect(() => {
      const controllers = activeControllersRef;
      return () => {
        controllers.current.forEach(controller => {
          if (!controller.signal.aborted) {
            controller.abort();
          }
        });
        controllers.current.clear();
      };
    }, []);
    return {
      dispatch,
      dispatchWithResult,
      abortAll,
      resetAbortScope,
    };
  };
  return {
    Provider,
    useActionContext: useFactoryActionContext,
    useActionDispatch: useAction,
    useActionHandler,
    useActionRegister: useFactoryActionRegister,
    useActionDispatchWithResult: useFactoryActionDispatchWithResult,
    context: FactoryActionContext,
  };
}
```

### actions/index.ts

```typescript
export { 
  createActionContext
} from './ActionContext';
export type {
  ActionContextConfig,
  ActionContextType,
  ActionContextReturn
} from './ActionContext.types';
export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  PipelineController,
  ActionRegisterConfig
} from '@context-action/core';
```

### advanced.ts

```typescript
export { StoreRegistry } from './stores/core/StoreRegistry';
export { EventBus } from './stores/core/EventBus';
export type { 
  DynamicStoreOptions,
  HookOptions,
  StoreSyncConfig
} from './stores/core/types';
export { useComputedStore } from './stores/hooks/useComputedStore';
export { useStoreSelector } from './stores/hooks/useStoreSelector';
export { usePersistedStore } from './stores/hooks/usePersistedStore';
export { useLocalStore } from './stores/hooks/useLocalStore';
export { 
  composeProviders
} from './stores/utils/provider-composition';
export type {
  ProviderComponent
} from './stores/utils/provider-composition';
export { 
  deepClone,
  deepCloneWithImmer,
  preloadImmer,
  ImmerUtils,
  safeGet,
  safeSet,
  performantSafeGet,
  performantSafeGetWithImmer
} from './stores/utils/immutable';
export {
  ContextActionError,
  ContextActionErrorType,
  handleError as handleContextActionError,
  safeAsync,
  safeSync
} from './stores/utils/error-handling';
export {
  StoreErrorBoundary,
  withStoreErrorBoundary,
  createStoreErrorBoundary
} from './stores/components/StoreErrorBoundary';
export type {
  StoreErrorBoundaryProps,
  StoreErrorBoundaryState
} from './stores/components/StoreErrorBoundary';
export * from './patterns';
export * from './hooks';
```

### hooks/index.ts

```typescript
export { createActionContext, type ActionContextConfig, type ActionContextReturn } from '../actions';
export * from '../stores/hooks';
export { useStoreValue, useStoreValues } from '../stores/hooks/useStoreValue';
export { useLocalStore } from '../stores/hooks/useLocalStore';
```

### hooks/react18-hooks.ts

```typescript
import { 
  useDeferredValue, 
  useTransition, 
  useCallback, 
  useState, 
  useMemo,
  startTransition,
  useSyncExternalStore
} from 'react';
import type { IStore } from '../stores/core/types';
export interface React18Options {
  enableDeferred?: boolean;
  enableTransition?: boolean;
  priorityThreshold?: number;
  enableConcurrent?: boolean;
}
export function useStoreValueOptimized<T>(
  store: IStore<T>,
  options: React18Options = {}
): T {
  const {
    enableDeferred = true
  } = options;
  const storeValue = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot 
  );
  const currentValue = storeValue.value;
  const deferredValue = useDeferredValue(currentValue);
  const shouldUseDeferred = useMemo(() => {
    if (!enableDeferred) return false;
    if (typeof currentValue === 'object' && currentValue !== null) {
      try {
        const keys = Object.keys(currentValue);
        const estimatedSize = keys.length * 50; 
        if (Array.isArray(currentValue)) {
          return currentValue.length > 100; 
        }
        if (keys.length > 10 || estimatedSize > 1000) {
          const objectSize = JSON.stringify(currentValue).length;
          return objectSize > 1000; 
        }
        return false;
      } catch {
        return true;
      }
    }
    return false;
  }, [currentValue, enableDeferred]);
  return shouldUseDeferred ? deferredValue : currentValue;
}
export function useStoreTransition<T>(
  store: IStore<T>
): [
  (newValue: T | ((prev: T) => T)) => void,
  boolean
] {
  const [isPending, startTransition] = useTransition();
  const updateWithTransition = useCallback((
    newValue: T | ((prev: T) => T)
  ) => {
    startTransition(() => {
      if (typeof newValue === 'function') {
        const updater = newValue as (prev: T) => T;
        store.update(updater);
      } else {
        store.setValue(newValue);
      }
    });
  }, [store]);
  return [updateWithTransition, isPending];
}
export function useStoreUpdateSmart<T>(
  store: IStore<T>,
  options: React18Options = {}
): [
  (newValue: T | ((prev: T) => T)) => void,
  boolean,
  (newValue: T | ((prev: T) => T)) => void
] {
  const {
    enableTransition = true,
    priorityThreshold = 1000
  } = options;
  const [isPending, startTransition] = useTransition();
  const smartUpdate = useCallback((
    newValue: T | ((prev: T) => T)
  ) => {
    let isComplex = false;
    if (typeof newValue === 'function') {
      isComplex = true; 
    } else if (typeof newValue === 'object' && newValue !== null) {
      try {
        if (Array.isArray(newValue)) {
          isComplex = newValue.length > (priorityThreshold / 10); 
        } else {
          const keys = Object.keys(newValue);
          if (keys.length > 10) {
            const size = JSON.stringify(newValue).length;
            isComplex = size > priorityThreshold;
          } else {
            isComplex = false;
          }
        }
      } catch {
        isComplex = true;
      }
    }
    if (enableTransition && isComplex) {
      startTransition(() => {
        if (typeof newValue === 'function') {
          const updater = newValue as (prev: T) => T;
          store.update(updater);
        } else {
          store.setValue(newValue);
        }
      });
    } else {
      if (typeof newValue === 'function') {
        const updater = newValue as (prev: T) => T;
        store.update(updater);
      } else {
        store.setValue(newValue);
      }
    }
  }, [store, enableTransition, priorityThreshold]);
  const immediateUpdate = useCallback((
    newValue: T | ((prev: T) => T)
  ) => {
    if (typeof newValue === 'function') {
      const updater = newValue as (prev: T) => T;
      store.update(updater);
    } else {
      store.setValue(newValue);
    }
  }, [store]);
  return [smartUpdate, isPending, immediateUpdate];
}
export function useStoreSelector<T, K>(
  store: IStore<T>,
  selector: (value: T) => K,
  options: React18Options = {}
): K {
  const {
    enableDeferred = true
  } = options;
  const storeValue = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  const selectedValue = useMemo(() => {
    return selector(storeValue.value);
  }, [selector, storeValue.value]);
  const deferredValue = useDeferredValue(selectedValue);
  const shouldUseDeferred = useMemo(() => {
    if (!enableDeferred) return false;
    if (typeof selectedValue === 'object' && selectedValue !== null) {
      return true;
    }
    return false;
  }, [selectedValue, enableDeferred]);
  return shouldUseDeferred ? deferredValue : selectedValue;
}
export function useBatchUpdate() {
  const [isPending, startTransition] = useTransition();
  const batchUpdate = useCallback((updates: (() => void)[]) => {
    startTransition(() => {
      updates.forEach(update => {
        try {
          update();
        } catch (error) {
          console.error('Error in batch update:', error);
        }
      });
    });
  }, []);
  return [batchUpdate, isPending] as const;
}
export interface React18Stats {
  transitionCount: number;
  deferredUpdates: number;
  averageTransitionTime: number;
  pendingOperations: number;
}
export function useReact18Stats(): React18Stats {
  const [stats] = useState<React18Stats>({
    transitionCount: 0,
    deferredUpdates: 0,
    averageTransitionTime: 0,
    pendingOperations: 0
  });
  return stats;
}
export const React18Utils = {
  startTransition: (callback: () => void) => {
    startTransition(callback);
  },
  conditionalTransition: (
    condition: boolean, 
    callback: () => void
  ) => {
    if (condition) {
      startTransition(callback);
    } else {
      callback();
    }
  },
  calculateUpdateComplexity: <T>(value: T): number => {
    if (typeof value === 'object' && value !== null) {
      try {
        const size = JSON.stringify(value).length;
        return Math.min(size / 100, 10); 
      } catch {
        return 5; 
      }
    }
    return 1; 
  },
  getRecommendedThreshold: (deviceType: 'mobile' | 'desktop' = 'desktop'): number => {
    return deviceType === 'mobile' ? 500 : 1000;
  }
};
export function useReact18Compatibility() {
  const hasUseDeferredValue = typeof useDeferredValue === 'function';
  const hasUseTransition = typeof useTransition === 'function';
  const hasUseSyncExternalStore = typeof useSyncExternalStore === 'function';
  return {
    isReact18Compatible: hasUseDeferredValue && hasUseTransition,
    features: {
      deferredValue: hasUseDeferredValue,
      transition: hasUseTransition,
      syncExternalStore: hasUseSyncExternalStore
    }
  };
}
```

### index.ts

```typescript
export { createActionContext } from './actions/ActionContext';
export type { 
  ActionContextConfig,
  ActionContextReturn,
  ActionContextType
} from './actions/ActionContext.types';
export { createStore, Store } from './stores/core/Store';
export { useStoreValue } from './stores/hooks/useStoreValue';
export { useStoreSelector } from './stores/hooks/useStoreSelector';
export type { IStore, Snapshot } from './stores/core/types';
export { StoreErrorBoundary } from './stores/components/StoreErrorBoundary';
export type { StoreErrorBoundaryProps } from './stores/components/StoreErrorBoundary';
export { createStoreContext, StoreManager } from './stores/patterns/declarative-store-pattern-v2';
export type { InitialStores, StoreConfig } from './stores/patterns/declarative-store-pattern-v2';
export { createRefContext } from './refs/createRefContext';
export type { RefContextReturn, CreateRefContextOptions } from './refs/createRefContext';
export type { RefTarget, RefOperationOptions, RefOperationResult } from './refs/types';
export type {
  ActionPayloadMap,
  ActionHandler,
  HandlerConfig,
  PipelineController,
  ActionRegisterConfig,
  ExecutionMode,
  UnregisterFunction
} from '@context-action/core';
export { ActionRegister } from '@context-action/core';
```

### patterns/index.ts

```typescript
export * from '../stores/patterns';
export * from '../actions/ActionContext';
```

### react18.ts

```typescript
export * from './hooks/react18-hooks';
```

### refs/createRefContext.ts

```typescript
import React, { createContext, useContext, useMemo, useRef, useCallback, ReactNode, useState, useEffect } from 'react';
import type { 
  RefTarget, 
  RefOperation, 
  RefOperationOptions, 
  RefOperationResult,
  RefDefinitions,
  InferRefTypes
} from './types';
import { useRefMount, useRefOperation, useRefPolling as useRefPollingHook, useRefMountState, useOnMountStateChange, useRefMountChecker, type InternalRefState, type RefPollingOptions } from './hooks';
import { ErrorHandlers } from '../stores/utils/error-handling';
export interface RefContextReturn<T> {
  Provider: React.FC<{ children: ReactNode }>;
  useRefHandler: <K extends keyof T>(refName: K) => {
    setRef: (target: T[K] | null) => void;
    target: T[K] | null;
    waitForMount: () => Promise<T[K]>;
    withTarget: <Result>(
      operation: RefOperation<T[K] & RefTarget, Result>,
      options?: RefOperationOptions
    ) => Promise<RefOperationResult<Result>>;
    isMounted: boolean;
    isWaitingForMount: boolean;
    onMount: (callback: (target: T[K]) => void) => () => void;
    executeIfMounted: <Result>(
      operation: (target: T[K] & RefTarget) => Result
    ) => Result | null;
  };
  useWaitForRefs: () => {
    <K extends keyof T>(...refNames: K[]): Promise<Pick<T, K>>;
    <K extends keyof T>(timeout: number, ...refNames: K[]): Promise<Pick<T, K>>;
  };
  useGetAllRefs: () => () => Partial<T>;
  useRefPolling: () => <K extends keyof T>(
    refName: K,
    options?: RefPollingOptions
  ) => {
    promise: Promise<T[K]>;
    cancel: () => void;
    isMounted: () => boolean;
  };
  useRefMountState: <K extends keyof T>(refName: K) => {
    isMounted: boolean;
    isWaitingForMount: boolean;
    mountedTarget: T[K] | null;
  };
  useOnMountStateChange: <K extends keyof T>(
    refName: K,
    callback: (mounted: boolean, target: T[K] | null) => void
  ) => void;
  useRefMountChecker: <K extends keyof T>(refName: K) => () => {
    isMounted: boolean;
    isWaitingForMount: boolean;
    target: T[K] | null;
  };
  contextName: string;
  refDefinitions?: T extends RefDefinitions ? T : undefined;
}
export interface CreateRefContextOptions {
  defaultMountTimeout?: number;
  disableTimeout?: boolean;
}
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
  const refDefinitions = (typeof refDefinitionsOrOptions === 'object' && 
    refDefinitionsOrOptions !== null &&
    Object.values(refDefinitionsOrOptions as any).some(
      (value: any) => value && typeof value === 'object' && 'name' in value
    )) ? (refDefinitionsOrOptions as unknown) as T extends RefDefinitions ? T : undefined : undefined;
  const options = refDefinitions ? optionsWhenDefs : refDefinitionsOrOptions as CreateRefContextOptions | undefined;
  const hasDefinitions = Boolean(refDefinitions);
  interface RefContextValue {
    refsMapRef: React.MutableRefObject<Map<string, InternalRefState<any>>>;
    definitionsRef: React.MutableRefObject<T extends RefDefinitions ? T : undefined>;
    optionsRef: React.MutableRefObject<CreateRefContextOptions | undefined>;
    subscribeToRef: (refName: string, listener: () => void) => () => void;
    getRefState: (refName: string) => InternalRefState<any>;
    setRefTarget: (refName: string, target: any) => void;
  }
  const RefContext = createContext<RefContextValue | null>(null);
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const refsMapRef = useRef<Map<string, InternalRefState<any>>>(null!);
    if (!refsMapRef.current) {
      const map = new Map<string, InternalRefState<any>>();
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
    useEffect(() => {
      return () => {
        if (refsMapRef.current) {
          refsMapRef.current.forEach((refState) => {
            refState.mountRejectors.forEach(reject => {
              reject(new Error('Context provider unmounted'));
            });
            refState.mountResolvers.clear();
            refState.mountRejectors.clear();
            refState.mountPromise = null;
            refState.mountCallbacks.clear();
            refState.listeners.clear();
            refState.target = null;
            refState.isMounted = false;
            refState.operationInProgress = false;
          });
          refsMapRef.current.clear();
        }
      };
    }, []);
    const subscribeToRef = useCallback((refName: string, listener: () => void) => {
      const refState = getOrCreateRefState(refsMapRef.current, refName);
      refState.listeners.add(listener);
      return () => {
        refState.listeners.delete(listener);
      };
    }, []);
    const getRefState = useCallback((refName: string) => {
      return getOrCreateRefState(refsMapRef.current, refName);
    }, []);
    const setRefTarget = useCallback((refName: string, target: any) => {
      const refState = getOrCreateRefState(refsMapRef.current, refName);
      if (target === null) {
        refState.target = null;
        refState.isMounted = false;
        refState.mountPromise = null;
        refState.listeners.forEach(listener => listener());
      } else {
        refState.target = target;
        refState.isMounted = true;
        refState.mountResolvers.forEach(resolve => resolve(target));
        refState.mountResolvers.clear();
        refState.mountRejectors.clear();
        refState.mountPromise = null;
        refState.mountCallbacks.forEach(callback => {
          try {
            callback(target);
          } catch (error) {
            ErrorHandlers.ref(
              'Error in mount callback',
              { 
                refName: String(refName),
                targetType: typeof target
              },
              error instanceof Error ? error : undefined
            );
          }
        });
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
  const useRefContext = () => {
    const context = useContext(RefContext);
    if (!context) {
      throw new Error(
        `useRefHandler must be used within ${contextName}.Provider. ` +
        `Wrap your component with <${contextName}.Provider>`
      );
    }
    return context;
  };
  const useRefHandler = <K extends keyof T>(refName: K) => {
    const { subscribeToRef, getRefState, setRefTarget, definitionsRef, optionsRef } = useRefContext();
    const refNameStr = String(refName);
    const [, forceUpdate] = useState({});
    useEffect(() => {
      const unsubscribe = subscribeToRef(refNameStr, () => {
        forceUpdate({});
      });
      return unsubscribe;
    }, [refNameStr, subscribeToRef]);
    const refState = getRefState(refNameStr);
    const { waitForMount, onMount, isMounted, isWaitingForMount } = useRefMount(
      refState, 
      refNameStr, 
      optionsRef, 
      definitionsRef
    );
    const { withTarget, executeIfMounted } = useRefOperation(refState);
    return useMemo(() => ({
      setRef: (target: T[K] | null) => {
        setRefTarget(refNameStr, target);
      },
      get target(): T[K] | null {
        return refState.target;
      },
      waitForMount: () => waitForMount() as Promise<T[K]>,
      withTarget: withTarget as <Result>(
        operation: RefOperation<T[K] & RefTarget, Result>,
        options?: RefOperationOptions
      ) => Promise<RefOperationResult<Result>>,
      isMounted,
      isWaitingForMount,
      onMount: (callback: (target: T[K]) => void) => onMount(callback as (target: any) => void),
      executeIfMounted: executeIfMounted as <Result>(
        operation: (target: T[K] & RefTarget) => Result
      ) => Result | null
    }), [refState, setRefTarget, refNameStr, waitForMount, withTarget, executeIfMounted, onMount, isMounted, isWaitingForMount]);
  };
  const useWaitForRefs = () => {
    const { getRefState } = useRefContext();
    return useCallback(async <K extends keyof T>(...args: [number, ...K[]] | K[]): Promise<Pick<T, K>> => {
      let timeout: number | undefined;
      let refNames: K[];
      if (typeof args[0] === 'number') {
        timeout = args[0];
        refNames = args.slice(1) as K[];
      } else {
        timeout = 1000; 
        refNames = args as K[];
      }
      const promises = refNames.map(async (refName) => {
        const refNameStr = String(refName);
        const refState = getRefState(refNameStr);
        if (refState.target && refState.isMounted) {
          return [refName, refState.target] as const;
        }
        if (!refState.mountPromise) {
          refState.mountPromise = new Promise<any>((resolve, reject) => {
            refState.mountResolvers.add(resolve);
            refState.mountRejectors.add(reject);
          });
        }
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Mount timeout after ${timeout}ms for ref '${refNameStr}'`));
          }, timeout);
        });
        const target = await Promise.race([refState.mountPromise, timeoutPromise]);
        return [refName, target] as const;
      });
      const results = await Promise.all(promises);
      return Object.fromEntries(results) as Pick<T, K>;
    }, [getRefState]);
  };
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
  const useRefPolling = () => {
    const { getRefState } = useRefContext();
    const createPolling = useRefPollingHook();
    return useCallback(<K extends keyof T>(
      refName: K,
      options: RefPollingOptions = {}
    ) => {
      const refNameStr = String(refName);
      const refState = getRefState(refNameStr);
      return createPolling(refState, refNameStr, options) as {
        promise: Promise<T[K]>;
        cancel: () => void;
        isMounted: () => boolean;
      };
    }, [getRefState, createPolling]);
  };
  const useRefMountStateHook = <K extends keyof T>(refName: K) => {
    const { getRefState } = useRefContext();
    const refState = getRefState(String(refName));
    return useRefMountState(refState) as {
      isMounted: boolean;
      isWaitingForMount: boolean;
      mountedTarget: T[K] | null;
    };
  };
  const useOnMountStateChangeHook = <K extends keyof T>(
    refName: K,
    callback: (mounted: boolean, target: T[K] | null) => void
  ) => {
    const { getRefState } = useRefContext();
    const refState = getRefState(String(refName));
    useOnMountStateChange(refState, callback);
  };
  const useRefMountCheckerHook = <K extends keyof T>(refName: K) => {
    const { getRefState } = useRefContext();
    const refState = getRefState(String(refName));
    return useRefMountChecker(refState) as () => {
      isMounted: boolean;
      isWaitingForMount: boolean;
      target: T[K] | null;
    };
  };
  return {
    Provider,
    useRefHandler,
    useWaitForRefs,
    useGetAllRefs,
    useRefPolling,
    useRefMountState: useRefMountStateHook,
    useOnMountStateChange: useOnMountStateChangeHook,
    useRefMountChecker: useRefMountCheckerHook,
    contextName,
    refDefinitions
  } as T extends RefDefinitions 
    ? RefContextReturn<InferRefTypes<T>>
    : RefContextReturn<T>;
}
function createInitialRefState<T>(): InternalRefState<T> {
  return {
    target: null,
    isMounted: false,
    mountPromise: null,
    mountResolvers: new Set(),
    mountRejectors: new Set(),
    operationInProgress: false,
    listeners: new Set(),
    mountCallbacks: new Set()
  };
}
function getOrCreateRefState<T>(
  refsMap: Map<string, InternalRefState<T>>,
  refName: string
): InternalRefState<T> {
  if (!refsMap.has(refName)) {
    refsMap.set(refName, createInitialRefState());
  }
  return refsMap.get(refName)!;
}
```

### refs/helpers.ts

```typescript
import type { 
  RefInitConfig, 
  RefTarget
} from './types';
export function customRef<T extends RefTarget>(
  config: Partial<RefInitConfig<T>> & { 
    name: string;
    cleanup?: (target: T) => void | Promise<void>;
  }
): RefInitConfig<T> {
  return {
    autoCleanup: true,
    ...config
  } as RefInitConfig<T>;
}
```

### refs/hooks/index.ts

```typescript
export { useRefMount, type InternalRefState } from './useRefMount';
export { useRefOperation } from './useRefOperation';
export { useRefPolling, type RefPollingOptions, type RefPollingReturn } from './useRefPolling';
export { useRefMountState, useOnMountStateChange, useRefMountChecker } from './useRefMountState';
```

### refs/hooks/useRefMount.ts

```typescript
import { useCallback } from 'react';
import type { RefInitConfig } from '../types';
import type { CreateRefContextOptions } from '../createRefContext';
export interface InternalRefState<T> {
  target: T | null;
  isMounted: boolean;
  mountPromise: Promise<T> | null;
  mountResolvers: Set<(target: T) => void>;
  mountRejectors: Set<(error: Error) => void>;
  operationInProgress: boolean;
  listeners: Set<() => void>;
  mountCallbacks: Set<(target: T) => void>;
}
export function useRefMount<T>(
  refState: InternalRefState<T>,
  refNameStr: string,
  optionsRef: React.MutableRefObject<CreateRefContextOptions | undefined>,
  definitionsRef: React.MutableRefObject<any>
) {
  const waitForMount = useCallback(async (): Promise<T> => {
    if (refState.target && refState.isMounted) {
      return refState.target;
    }
    if (refState.mountPromise) {
      return refState.mountPromise;
    }
    const globalOptions = optionsRef.current;
    const refConfig = definitionsRef.current?.[refNameStr] as RefInitConfig<any> | undefined;
    let timeoutMs: number | undefined;
    if (globalOptions?.disableTimeout) {
      timeoutMs = undefined;
    } else if (refConfig?.mountTimeout !== undefined) {
      timeoutMs = refConfig.mountTimeout;
    } else if (globalOptions?.defaultMountTimeout !== undefined) {
      timeoutMs = globalOptions.defaultMountTimeout;
    }
    refState.mountPromise = new Promise<T>((resolve, reject) => {
      refState.mountResolvers.add(resolve);
      refState.mountRejectors.add(reject);
      if (timeoutMs !== undefined && timeoutMs > 0) {
        const timeoutId = setTimeout(() => {
          const error = new Error(`Mount timeout after ${timeoutMs}ms for ref '${refNameStr}'`);
          refState.mountRejectors.forEach(rejector => rejector(error));
          refState.mountRejectors.clear();
          refState.mountResolvers.clear();
          refState.mountPromise = null;
        }, timeoutMs);
        const originalResolve = resolve;
        const originalReject = reject;
        const cleanupResolve = (value: T) => {
          clearTimeout(timeoutId);
          originalResolve(value);
        };
        const cleanupReject = (error: Error) => {
          clearTimeout(timeoutId);
          originalReject(error);
        };
        refState.mountResolvers.delete(resolve);
        refState.mountRejectors.delete(reject);
        refState.mountResolvers.add(cleanupResolve);
        refState.mountRejectors.add(cleanupReject);
      }
    });
    return refState.mountPromise;
  }, [refState, refNameStr, optionsRef, definitionsRef]);
  const onMount = useCallback((callback: (target: T) => void) => {
    refState.mountCallbacks.add(callback);
    if (refState.isMounted && refState.target) {
      callback(refState.target);
    }
    return () => {
      refState.mountCallbacks.delete(callback);
    };
  }, [refState]);
  return {
    waitForMount,
    onMount,
    isMounted: refState.isMounted,
    isWaitingForMount: !refState.isMounted && refState.mountPromise !== null
  };
}
```

### refs/hooks/useRefMountState.ts

```typescript
import { useEffect, useSyncExternalStore, useCallback, useRef } from 'react';
import type { InternalRefState } from './useRefMount';
export function useRefMountState<T>(refState: InternalRefState<T>): {
  isMounted: boolean;
  isWaitingForMount: boolean;
  mountedTarget: T | null;
} {
  const subscribe = useCallback((callback: () => void) => {
    if (!refState) return () => {};
    refState.listeners.add(callback);
    return () => {
      refState.listeners.delete(callback);
    };
  }, [refState]);
  const cachedSnapshotRef = useRef<{
    isMounted: boolean;
    isWaitingForMount: boolean;
    mountedTarget: T | null;
  }>();
  const getSnapshot = useCallback(() => {
    if (!refState) {
      const snapshot = {
        isMounted: false,
        isWaitingForMount: false,
        mountedTarget: null as T | null
      };
      cachedSnapshotRef.current = snapshot;
      return snapshot;
    }
    const isWaitingForMount = !refState.isMounted && refState.mountPromise !== null;
    const newSnapshot = {
      isMounted: refState.isMounted,
      isWaitingForMount,
      mountedTarget: refState.isMounted ? refState.target : null as T | null
    };
    if (cachedSnapshotRef.current &&
        cachedSnapshotRef.current.isMounted === newSnapshot.isMounted &&
        cachedSnapshotRef.current.isWaitingForMount === newSnapshot.isWaitingForMount &&
        cachedSnapshotRef.current.mountedTarget === newSnapshot.mountedTarget) {
      return cachedSnapshotRef.current;
    }
    cachedSnapshotRef.current = newSnapshot;
    return newSnapshot;
  }, [refState]);
  const serverSnapshotRef = useRef({
    isMounted: false,
    isWaitingForMount: false,
    mountedTarget: null as T | null
  });
  const getServerSnapshot = useCallback(() => {
    return serverSnapshotRef.current;
  }, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
export function useOnMountStateChange<T>(
  refState: InternalRefState<T>,
  callback: (mounted: boolean, target: T | null) => void
): void {
  const { isMounted, mountedTarget } = useRefMountState(refState);
  const stableCallback = useCallback(callback, [callback]);
  useEffect(() => {
    stableCallback(isMounted, mountedTarget);
  }, [isMounted, mountedTarget, stableCallback]);
}
export function useRefMountChecker<T>(refState: InternalRefState<T>) {
  return useCallback(() => {
    return {
      isMounted: refState.isMounted,
      isWaitingForMount: !refState.isMounted && refState.mountPromise !== null,
      target: refState.target
    };
  }, [refState]);
}
```

### refs/hooks/useRefOperation.ts

```typescript
import { useCallback } from 'react';
import type { RefOperation, RefOperationOptions, RefOperationResult, RefTarget } from '../types';
import type { InternalRefState } from './useRefMount';
export function useRefOperation<T>(
  refState: InternalRefState<T>
) {
  const withTarget = useCallback(async <Result>(
    operation: RefOperation<T & RefTarget, Result>,
    options?: RefOperationOptions
  ): Promise<RefOperationResult<Result>> => {
    try {
      const target = await (async () => {
        if (refState.target && refState.isMounted) {
          return refState.target;
        }
        if (refState.mountPromise) {
          return refState.mountPromise;
        }
        refState.mountPromise = new Promise<T>((resolve, reject) => {
          refState.mountResolvers.add(resolve);
          refState.mountRejectors.add(reject);
        });
        return refState.mountPromise;
      })();
      while (refState.operationInProgress) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      refState.operationInProgress = true;
      const startTime = Date.now();
      try {
        if (options?.signal?.aborted) {
          throw new Error('Operation aborted');
        }
        const timeoutPromise = options?.timeout
          ? new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Operation timed out')), options.timeout);
            })
          : null;
        const operationPromise = operation(target as T & RefTarget, options);
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
  }, [refState]);
  const executeIfMounted = useCallback(<Result>(
    operation: (target: T & RefTarget) => Result
  ): Result | null => {
    if (refState.target && refState.isMounted) {
      try {
        return operation(refState.target);
      } catch (error) {
        console.error('Error in executeIfMounted:', error);
        return null;
      }
    }
    return null;
  }, [refState]);
  return {
    withTarget,
    executeIfMounted
  };
}
```

### refs/hooks/useRefPolling.ts

```typescript
import { useCallback } from 'react';
import type { InternalRefState } from './useRefMount';
export interface RefPollingOptions {
  interval?: number;
  timeout?: number;
  onTick?: (elapsed: number, isMounted: boolean) => void;
  onTimeout?: (elapsed: number) => void;
  onSuccess?: (elapsed: number, target: any) => void;
}
export interface RefPollingReturn<T> {
  promise: Promise<T>;
  cancel: () => void;
  isMounted: () => boolean;
}
export function useRefPolling() {
  const createPolling = useCallback(<T>(
    refState: InternalRefState<T>,
    refName: string,
    options: RefPollingOptions = {}
  ): RefPollingReturn<T> => {
    const {
      interval = 100,
      timeout,
      onTick,
      onTimeout,
      onSuccess
    } = options;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const startTime = Date.now();
    const promise = new Promise<T>((resolve, reject) => {
      const cleanup = () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };
      const check = () => {
        if (cancelled) {
          cleanup();
          reject(new Error('Polling cancelled'));
          return;
        }
        const elapsed = Date.now() - startTime;
        const isMounted = refState.isMounted && refState.target !== null;
        if (onTick) {
          try {
            onTick(elapsed, isMounted);
          } catch (error) {
            console.error('Error in polling onTick callback:', error);
          }
        }
        if (isMounted && refState.target) {
          cleanup();
          if (onSuccess) {
            try {
              onSuccess(elapsed, refState.target);
            } catch (error) {
              console.error('Error in polling onSuccess callback:', error);
            }
          }
          resolve(refState.target);
          return;
        }
      };
      if (timeout && timeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup();
          const elapsed = Date.now() - startTime;
          if (onTimeout) {
            try {
              onTimeout(elapsed);
            } catch (error) {
              console.error('Error in polling onTimeout callback:', error);
            }
          }
          reject(new Error(`Polling timeout after ${timeout}ms for ref '${refName}'`));
        }, timeout);
      }
      check();
      intervalId = setInterval(check, interval);
    });
    const cancel = () => {
      cancelled = true;
    };
    const isMounted = () => {
      return refState.isMounted && refState.target !== null;
    };
    return {
      promise,
      cancel,
      isMounted
    };
  }, []);
  return createPolling;
}
```

### refs/index.ts

```typescript
export type {
  RefTarget,
  RefState,
  RefOperationResult,
  RefOperationOptions,
  RefOperation,
  RefInitConfig
} from './types';
export { 
  createRefContext
} from './createRefContext';
export type { 
  RefContextReturn
} from './createRefContext';
export { 
  customRef
} from './helpers';
```

### stores/components/index.ts

```typescript
export {
  StoreErrorBoundary,
  withStoreErrorBoundary,
  createStoreErrorBoundary
} from './StoreErrorBoundary';
export type {
  StoreErrorBoundaryProps,
  StoreErrorBoundaryState
} from './StoreErrorBoundary';
```

### stores/components/StoreErrorBoundary.tsx

```typescript
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorHandlers, getErrorStatistics, type ContextActionError } from '../utils/error-handling';
export interface StoreErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: ContextActionError, errorInfo: ErrorInfo) => ReactNode);
  onError?: (error: ContextActionError, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}
export interface StoreErrorBoundaryState {
  hasError: boolean;
  error: ContextActionError | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}
export class StoreErrorBoundary extends Component<StoreErrorBoundaryProps, StoreErrorBoundaryState> {
  private resetTimeoutId: number | null = null;
  constructor(props: StoreErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }
  static getDerivedStateFromError(error: Error): Partial<StoreErrorBoundaryState> {
    const isContextActionError = error instanceof Error && error.name === 'ContextActionError';
    const contextActionError = isContextActionError ? (error as any) : null;
    return {
      hasError: true,
      error: contextActionError,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error.name === 'ContextActionError') {
      const contextActionError = error as any;
      this.setState({ errorInfo });
      this.props.onError?.(contextActionError, errorInfo);
    } else {
      const contextActionError = ErrorHandlers.store(
        `Unhandled error in Store component: ${error.message}`,
        {
          component: 'StoreErrorBoundary',
          stack: error.stack,
          componentStack: errorInfo.componentStack
        },
        error
      );
      this.setState({ 
        error: contextActionError,
        errorInfo 
      });
      this.props.onError?.(contextActionError, errorInfo);
    }
  }
  componentDidUpdate(prevProps: StoreErrorBoundaryProps) {
    const { hasError } = this.state;
    const { resetOnPropsChange, resetKeys } = this.props;
    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(key => {
          const prevKey = (prevProps as any)[key];
          const currentKey = (this.props as any)[key];
          return prevKey !== currentKey;
        });
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      } else if (prevProps !== this.props) {
        this.resetErrorBoundary();
      }
    }
  }
  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }
  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };
  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;
    if (hasError) {
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error!, errorInfo!);
        }
        return fallback;
      }
      return this.renderDefaultFallback();
    }
    return children;
  }
  private renderDefaultFallback(): ReactNode {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      return this.renderDevelopmentFallback();
    } else {
      return this.renderProductionFallback();
    }
  }
  private renderDevelopmentFallback(): ReactNode {
    const { error, errorInfo, errorId } = this.state;
    const stats = getErrorStatistics();
    return (
      <div style={{
        padding: '20px',
        margin: '20px',
        border: '2px solid #ff6b6b',
        borderRadius: '8px',
        backgroundColor: '#ffe0e0',
        fontFamily: 'monospace'
      }}>
        <h2 style={{ color: '#d63031', margin: '0 0 10px 0' }}>
          🚨 Store Error Boundary
        </h2>
        <div style={{ marginBottom: '15px' }}>
          <strong>Error ID:</strong> {errorId}
        </div>
        {error && (
          <div style={{ marginBottom: '15px' }}>
            <strong>Error Type:</strong> {error.type}<br />
            <strong>Message:</strong> {error.message}<br />
            <strong>Timestamp:</strong> {new Date(error.timestamp).toISOString()}
          </div>
        )}
        {error?.context && (
          <div style={{ marginBottom: '15px' }}>
            <strong>Context:</strong>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(error.context, null, 2)}
            </pre>
          </div>
        )}
        <div style={{ marginBottom: '15px' }}>
          <strong>Error Statistics:</strong><br />
          Total Errors: {stats.totalErrors}<br />
          Recent Errors: {stats.recentErrors.length}
        </div>
        {errorInfo && (
          <details style={{ marginBottom: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Component Stack
            </summary>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '11px',
              whiteSpace: 'pre-wrap'
            }}>
              {errorInfo.componentStack}
            </pre>
          </details>
        )}
        <button
          onClick={this.resetErrorBoundary}
          style={{
            padding: '8px 16px',
            backgroundColor: '#00b894',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }
  private renderProductionFallback(): ReactNode {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h3 style={{ color: '#6c757d', margin: '0 0 10px 0' }}>
          Something went wrong
        </h3>
        <p style={{ color: '#6c757d', margin: '0 0 15px 0' }}>
          We're sorry, but something unexpected happened. Please try again.
        </p>
        <button
          onClick={this.resetErrorBoundary}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }
}
export function withStoreErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<StoreErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WithStoreErrorBoundaryComponent = (props: P) => (
    <StoreErrorBoundary 
      {...errorBoundaryProps}
    >
      <WrappedComponent {...props} />
    </StoreErrorBoundary>
  );
  WithStoreErrorBoundaryComponent.displayName = 
    `withStoreErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  return WithStoreErrorBoundaryComponent;
}
export function createStoreErrorBoundary(
  storeName: string,
  customFallback?: ReactNode
): React.ComponentType<{ children: ReactNode }> {
  return ({ children }) => (
    <StoreErrorBoundary
      fallback={customFallback}
      onError={(error, errorInfo) => {
        console.group(`Store Error in ${storeName}`);
        console.error('Error:', error);
        console.error('Component Stack:', errorInfo.componentStack);
        console.groupEnd();
      }}
      resetKeys={[storeName]}
    >
      {children}
    </StoreErrorBoundary>
  );
}
```

### stores/core/EventBus.ts

```typescript
import type { EventHandler, IEventBus, Unsubscribe } from './types';
import { ErrorHandlers } from '../utils/error-handling';
export class EventBus implements IEventBus {
  private events = new Map<string, Set<EventHandler>>();
  private eventHistory: Array<{ event: string; data: any; timestamp: number }> = [];
  private maxHistorySize: number;
  constructor(maxHistorySize: number = 100) {
    this.maxHistorySize = maxHistorySize;
  }
  on<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    const handlers = this.events.get(event)!;
    handlers.add(handler as EventHandler);
    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    };
  }
  once<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    const wrappedHandler = (data: T) => {
      handler(data);
      unsubscribe();
    };
    const unsubscribe = this.on(event, wrappedHandler);
    return unsubscribe;
  }
  emit<T = any>(event: string, data?: T): void {
    this._addToHistory(event, data);
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          ErrorHandlers.store(
            `Error in event handler for "${event}"`,
            { 
              event,
              handlerCount: handlers.size
            },
            error instanceof Error ? error : undefined
          );
        }
      });
    }
  }
  off(event: string, handler?: EventHandler): void {
    if (!handler) {
      this.events.delete(event);
    } else {
      const handlers = this.events.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.events.delete(event);
        }
      }
    }
  }
  clear(): void {
    this.events.clear();
  }
  getEventNames(): string[] {
    return Array.from(this.events.keys());
  }
  getHandlerCount(event: string): number {
    const handlers = this.events.get(event);
    return handlers ? handlers.size : 0;
  }
  getTotalHandlerCount(): number {
    let total = 0;
    this.events.forEach(handlers => {
      total += handlers.size;
    });
    return total;
  }
  getHistory(): ReadonlyArray<{ event: string; data: any; timestamp: number }> {
    return this.eventHistory;
  }
  clearHistory(): void {
    this.eventHistory = [];
  }
  scope(prefix: string): ScopedEventBus {
    return new ScopedEventBus(this, prefix);
  }
  private _addToHistory(event: string, data: any): void {
    let safeData = data;
    if (data && typeof data === 'object') {
      if (
        (typeof Element !== 'undefined' && data instanceof Element) ||
        (typeof Node !== 'undefined' && data instanceof Node) ||
        data?.nodeType !== undefined ||
        data?._reactInternalFiber !== undefined ||
        data?._owner !== undefined ||
        data?.$$typeof !== undefined
      ) {
        safeData = {
          __eventBusDataType: 'DOMElement',
          tagName: data.tagName || data.constructor?.name,
          id: data.id,
          className: data.className,
          timestamp: Date.now()
        };
      } else if (data.constructor && data.constructor.name !== 'Object' && data.constructor.name !== 'Array') {
        safeData = {
          __eventBusDataType: data.constructor.name,
          summary: typeof data.toString === 'function' ? data.toString().slice(0, 100) : '[Object]',
          timestamp: Date.now()
        };
      }
    }
    this.eventHistory.push({
      event,
      data: safeData,
      timestamp: Date.now()
    });
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}
export class ScopedEventBus implements IEventBus {
  constructor(
    private parent: EventBus,
    private prefix: string
  ) {}
  on<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    return this.parent.on(this._scopedEvent(event), handler);
  }
  emit<T = any>(event: string, data?: T): void {
    this.parent.emit(this._scopedEvent(event), data);
  }
  off(event: string, handler?: EventHandler): void {
    this.parent.off(this._scopedEvent(event), handler);
  }
  clear(): void {
    this.parent.getEventNames()
      .filter(name => name.startsWith(this.prefix + ':'))
      .forEach(name => this.parent.off(name));
  }
  private _scopedEvent(event: string): string {
    return `${this.prefix}:${event}`;
  }
}
```

### stores/core/index.ts

```typescript
export { Store, createStore } from './Store';
export { StoreRegistry } from './StoreRegistry';
export { EventBus } from './EventBus';
export type {
  IStore,
  IStoreRegistry,
  Listener,
  Unsubscribe,
  Snapshot,
  IEventBus,
  EventHandler as StoreEventHandler
} from './types';
```

### stores/core/Store.ts

```typescript
import type { IStore, Listener, Snapshot, Unsubscribe, StoreSetValueOptions } from './types';
import type { StoreRegistry } from './StoreRegistry';
import { safeGet, safeSet, produce } from '../utils/immutable';
import { 
  compareValues, 
  fastCompare, 
  ComparisonOptions
} from '../utils/comparison';
import { TypeGuards } from '../utils/type-guards';
import { ErrorHandlers } from '../utils/error-handling';
export class Store<T = unknown> implements IStore<T> {
  private listeners = new Set<Listener>();
  protected _value: T;
  protected _snapshot: Snapshot<T>;
  private _lastClonedValue: T | null = null;
  private _lastClonedVersion = 0;
  private _version = 0;
  private isUpdating = false;
  private updateQueue: Array<() => void> = [];
  private notificationMode: 'batched' | 'immediate' = 'batched';
  private pendingNotification = false;
  private animationFrameId: number | null = null;
  private pendingUpdatesCount = 0; 
  private cleanupTasks = new Set<() => void>();
  private isDisposed = false;
  private errorCount = 0;
  private lastErrorTime = 0;
  private readonly MAX_ERROR_COUNT = 5;
  private readonly ERROR_RESET_TIME = 60000; 
  private subscriptionRegistry = new WeakMap<Listener, {
    subscribedAt: number;
    errorCount: number;
    enhancedListener: () => void;
  }>();
  public readonly name: string;
  private customComparator: ((oldValue: T, newValue: T) => boolean) | undefined;
  private comparisonOptions: Partial<ComparisonOptions<T>> | undefined;
  private cloningEnabled: boolean = true;
  constructor(name: string, initialValue: T) {
    this.name = name;
    this._value = initialValue;
    this._snapshot = this._createSnapshot();
  }
  subscribe = (listener: Listener): Unsubscribe => {
    if (this.isDisposed) {
      console.warn(`Cannot subscribe to disposed store "${this.name}"`);
      return () => {};
    }
    const enhancedListener = () => {
      if (this.isDisposed) return;
      try {
        listener();
        if (this.errorCount > 0) {
          this.errorCount = 0;
        }
      } catch (error) {
        this._handleListenerError(error, listener);
      }
    };
    this.subscriptionRegistry.set(listener, {
      subscribedAt: Date.now(),
      errorCount: 0,
      enhancedListener
    });
    this.listeners.add(enhancedListener);
    return () => {
      this.listeners.delete(enhancedListener);
      this.subscriptionRegistry.delete(listener);
    };
  };
  getSnapshot = (): Snapshot<T> => {
    return this._snapshot;
  };
  getValue(): T {
    if (this.cloningEnabled) {
      if (this._lastClonedVersion === this._version && this._lastClonedValue !== null) {
        return this._lastClonedValue;
      }
      this._lastClonedValue = safeGet(this._value, this.cloningEnabled);
      this._lastClonedVersion = this._version;
      return this._lastClonedValue;
    }
    return this._value;
  }
  setValue(value: T, options?: StoreSetValueOptions<T>): void {
    if (TypeGuards.isObject(value)) {
      if (!TypeGuards.isRefState(value) && TypeGuards.isSuspiciousEventObject(value)) {
        const eventHandling = options?.eventHandling || 'block';
        const hasEventTarget = TypeGuards.hasTargetProperty(value);
        const hasPreventDefault = TypeGuards.isEventLike(value);
        const isEvent = TypeGuards.isDOMEvent(value);
        switch (eventHandling) {
          case 'allow':
            break;
          case 'transform':
            if (options?.eventTransform) {
              try {
                value = options.eventTransform(value);
              } catch (error) {
                ErrorHandlers.store(
                  'Event transformation failed in Store.setValue',
                  {
                    storeName: this.name,
                    valueType: typeof value,
                    error: error instanceof Error ? error.message : String(error)
                  }
                );
                return;
              }
            } else {
              ErrorHandlers.store(
                'Event transformation requested but no transform function provided',
                { storeName: this.name, valueType: typeof value }
              );
              return;
            }
            break;
          case 'block':
          default:
            ErrorHandlers.store(
              'Event object detected in Store.setValue - this may cause memory leaks',
              {
                storeName: this.name,
                valueType: typeof value,
                constructorName: value?.constructor?.name,
                isEvent,
                hasTargetProperty: hasEventTarget,
                hasPreventDefault,
                problematicProperties: TypeGuards.findProblematicProperties(value)
              }
            );
            return;
        }
      }
    }
    const safeValue = options?.skipClone ? value : safeSet(value, this.cloningEnabled);
    let hasChanged = true;
    if (!options?.skipComparison) {
      hasChanged = this._compareValues(this._value, safeValue);
    }
    if (hasChanged) {
      this._value = safeValue;
      this._version++;
      this._snapshot = this._createSnapshot();
      this._scheduleNotification();
    }
  }
  update(updater: (current: T) => T): void {
    if (this.isUpdating) {
      this.updateQueue.push(() => this.update(updater));
      return;
    }
    try {
      this.isUpdating = true;
      let updatedValue: T;
      try {
        updatedValue = produce(this._value, (draft: T) => {
          const result = updater(draft);
          return result !== undefined ? result : draft;
        });
      } catch (immerError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Store] Immer update failed, falling back to safe copy method', immerError);
        }
        const safeCurrentValue = safeGet(this._value, this.cloningEnabled);
        updatedValue = updater(safeCurrentValue);
      }
      if (TypeGuards.isObject(updatedValue)) {
        if (!TypeGuards.isRefState(updatedValue) && TypeGuards.isSuspiciousEventObject(updatedValue)) {
          const hasEventTarget = TypeGuards.hasTargetProperty(updatedValue);
          const hasPreventDefault = TypeGuards.isEventLike(updatedValue);
          const isEvent = TypeGuards.isDOMEvent(updatedValue);
          ErrorHandlers.store(
            'Event object detected in Store.update result - this may cause memory leaks',
            {
              storeName: this.name,
              updatedValueType: typeof updatedValue,
              constructorName: updatedValue?.constructor?.name,
              isEvent,
              hasTargetProperty: hasEventTarget,
              hasPreventDefault,
              problematicProperties: TypeGuards.findProblematicProperties(updatedValue)
            }
          );
          return;
        }
      }
      this.setValue(updatedValue);
    } finally {
      this.isUpdating = false;
      if (this.updateQueue.length > 0) {
        const nextUpdate = this.updateQueue.shift();
        if (nextUpdate) {
          Promise.resolve().then(nextUpdate);
        }
      }
    }
  }
  getListenerCount(): number {
    return this.listeners.size;
  }
  clearListeners(): void {
    this.listeners.clear();
  }
  registerCleanup(task: () => void): () => void {
    if (this.isDisposed) {
      console.warn(`Store "${this.name}" is already disposed, cleanup task ignored`);
      return () => {};
    }
    this.cleanupTasks.add(task);
    return () => this.cleanupTasks.delete(task);
  }
  dispose(): void {
    if (this.isDisposed) {
      return; 
    }
    this.isDisposed = true;
    try {
      this.cleanupTasks.forEach(task => {
        try {
          task();
        } catch (error) {
          ErrorHandlers.store(
            'Error during cleanup task execution',
            { storeName: this.name },
            error instanceof Error ? error : undefined
          );
        }
      });
      this.cleanupTasks.clear();
      this.subscriptionRegistry = new WeakMap();
      this.clearListeners();
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.pendingNotification = false;
      this.updateQueue.length = 0;
    } catch (error) {
      ErrorHandlers.store(
        'Critical error during store disposal',
        { storeName: this.name },
        error instanceof Error ? error : undefined
      );
    }
  }
  isStoreDisposed(): boolean {
    return this.isDisposed;
  }
  setCustomComparator(comparator: (oldValue: T, newValue: T) => boolean): void {
    this.customComparator = comparator;
  }
  setComparisonOptions(options: Partial<ComparisonOptions<T>>): void {
    this.comparisonOptions = options;
  }
  getComparisonOptions(): Partial<ComparisonOptions<T>> | undefined {
    return this.comparisonOptions ? { ...this.comparisonOptions } : undefined;
  }
  clearCustomComparator(): void {
    this.customComparator = undefined;
  }
  clearComparisonOptions(): void {
    this.comparisonOptions = undefined;
  }
  setCloningEnabled(enabled: boolean): void {
    this.cloningEnabled = enabled;
  }
  isCloningEnabled(): boolean {
    return this.cloningEnabled;
  }
  getValueUnsafe(): T {
    return this._value;
  }
  protected _compareValues(oldValue: T, newValue: T): boolean {
    let result: boolean;
    try {
      if (this.customComparator) {
        const areEqual = this.customComparator(oldValue, newValue);
        result = !areEqual; 
      }
      else if (this.comparisonOptions) {
        const areEqual = compareValues(oldValue, newValue, this.comparisonOptions);
        result = !areEqual;
      }
      else {
        const areEqual = fastCompare(oldValue, newValue);
        result = !areEqual;
      }
    } catch (error) {
      ErrorHandlers.store(
        'Error during value comparison, falling back to reference comparison',
        { storeName: this.name },
        error instanceof Error ? error : undefined
      );
      result = !Object.is(oldValue, newValue);
    }
    return result;
  }
  protected _createSnapshot(): Snapshot<T> {
    const clonedValue = safeGet(this._value, this.cloningEnabled);
    return {
      value: clonedValue,
      name: this.name,
      lastUpdate: Date.now()
    };
  }
  setNotificationMode(mode: 'batched' | 'immediate'): void {
    this.notificationMode = mode;
  }
  getNotificationMode(): 'batched' | 'immediate' {
    return this.notificationMode;
  }
  protected _scheduleNotification(): void {
    if (this.notificationMode === 'immediate') {
      this._notifyListeners();
    } else {
      this._scheduleWithRAF();
    }
  }
  private _scheduleWithRAF(): void {
    this.pendingUpdatesCount++;
    if (!this.pendingNotification) {
      this.pendingNotification = true;
      this.animationFrameId = requestAnimationFrame(() => {
        this._executeNotification();
      });
    }
  }
  private _executeNotification(): void {
    this.pendingNotification = false;
    this.animationFrameId = null;
    const batchedUpdates = this.pendingUpdatesCount;
    this.pendingUpdatesCount = 0;
    this._notifyListeners();
    if (process.env.NODE_ENV === 'development' && batchedUpdates > 1) {
      console.debug(`[Store:${this.name}] Batched ${batchedUpdates} updates in single frame`);
    }
  }
  private _handleListenerError(error: unknown, listener: Listener): void {
    const now = Date.now();
    if (now - this.lastErrorTime > this.ERROR_RESET_TIME) {
      this.errorCount = 0;
    }
    this.errorCount++;
    this.lastErrorTime = now;
    const metadata = this.subscriptionRegistry.get(listener);
    if (metadata) {
      metadata.errorCount++;
    }
    ErrorHandlers.store(
      'Error in store listener execution',
      { 
        storeName: this.name,
        listenerCount: this.listeners.size,
        errorCount: this.errorCount,
        subscriptionAge: metadata ? now - metadata.subscribedAt : 'unknown'
      },
      error instanceof Error ? error : undefined
    );
    if (metadata && metadata.errorCount >= 3) {
      console.warn(
        `Removing problematic listener from store "${this.name}" after ${metadata.errorCount} errors`
      );
      this.listeners.delete(metadata.enhancedListener);
      this.subscriptionRegistry.delete(listener);
    }
    if (this.errorCount >= this.MAX_ERROR_COUNT) {
      console.error(
        `Store "${this.name}" disabled due to excessive errors (${this.errorCount})`
      );
      this.clearListeners();
    }
  }
  private _notifyListeners(): void {
    if (this.isDisposed) return;
    this.listeners.forEach(listener => {
      if (this.isDisposed) return; 
      listener(); 
    });
  }
}
export function createStore<T>(name: string, initialValue: T): Store<T> {
  const store = new Store<T>(name, initialValue);
  return store;
}
export interface StoreConfig<T = unknown> {
  name: string;
  initialValue: T;
  registry?: StoreRegistry;
  autoRegister?: boolean;
}
export class ManagedStore<T> extends Store<T> {
  private registry: StoreRegistry | undefined;
  private autoRegister: boolean;
  constructor(config: StoreConfig<T>) {
    super(config.name, config.initialValue);
    this.registry = config.registry ?? undefined;
    this.autoRegister = config.autoRegister ?? true;
    if (this.autoRegister && this.registry) {
      this.registry.register(this.name, this);
    }
  }
  dispose(): void {
    if (this.registry) {
      this.registry.unregister(this.name);
    }
    this.clearListeners();
  }
}
export function createManagedStore<T>(config: StoreConfig<T>): ManagedStore<T> {
  return new ManagedStore<T>(config);
}
export interface AdvancedStoreConfig<T> extends StoreConfig<T> {
  comparisonStrategy?: 'reference' | 'shallow' | 'deep' | 'custom';
  customComparator?: (oldValue: T, newValue: T) => boolean;
  enablePersistence?: boolean;
  persistenceKey?: string;
  enablePerformanceMonitoring?: boolean;
  notificationMode?: 'batched' | 'immediate';
  enableCloning?: boolean;
}
export class StoreFactory {
  static create<T>(config: AdvancedStoreConfig<T>): Store<T> {
    const store = new Store(config.name, config.initialValue);
    if (config.comparisonStrategy && config.comparisonStrategy !== 'reference') {
      store.setComparisonOptions({ strategy: config.comparisonStrategy });
    }
    if (config.customComparator) {
      store.setCustomComparator(config.customComparator);
    }
    if (config.notificationMode) {
      store.setNotificationMode(config.notificationMode);
    }
    if (config.enableCloning !== undefined) {
      store.setCloningEnabled(config.enableCloning);
    }
    if (config.enablePersistence && config.persistenceKey) {
    }
    return store;
  }
  static createManaged<T>(config: AdvancedStoreConfig<T>): ManagedStore<T> {
    const managedStore = new ManagedStore<T>(config);
    if (config.comparisonStrategy && config.comparisonStrategy !== 'reference') {
      managedStore.setComparisonOptions({ strategy: config.comparisonStrategy });
    }
    if (config.customComparator) {
      managedStore.setCustomComparator(config.customComparator);
    }
    if (config.notificationMode) {
      managedStore.setNotificationMode(config.notificationMode);
    }
    if (config.enableCloning !== undefined) {
      managedStore.setCloningEnabled(config.enableCloning);
    }
    return managedStore;
  }
  static createBatch<T extends Record<string, any>>(
    stores: { [K in keyof T]: { initialValue: T[K] } & Partial<AdvancedStoreConfig<T[K]>> }
  ): { [K in keyof T]: Store<T[K]> } {
    const result = {} as { [K in keyof T]: Store<T[K]> };
    for (const [storeName, storeConfig] of Object.entries(stores)) {
      const fullConfig: AdvancedStoreConfig<T[keyof T]> = {
        name: storeName,
        ...storeConfig
      };
      result[storeName as keyof T] = StoreFactory.create(fullConfig);
    }
    return result;
  }
}
```

### stores/core/StoreRegistry.ts

```typescript
import type { IStore, IStoreRegistry, Listener, Unsubscribe } from './types';
export interface StoreMetadata {
  registeredAt: number;
  name: string;
  tags?: string[];
  description?: string;
  version?: string;
  debug?: boolean;
}
export class StoreRegistry implements IStoreRegistry {
  private stores = new Map<string, IStore<any>>();
  private metadata = new WeakMap<IStore<any>, StoreMetadata>();
  private listeners = new Set<Listener>();
  private _snapshot: Array<[string, IStore<any>]> = [];
  public readonly name: string;
  constructor(name: string = 'default') {
    this.name = name;
  }
  subscribe(listener: Listener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  register(name: string, store: IStore<any>, metadata?: Partial<StoreMetadata>): void {
    if (this.stores.has(name)) {
      const oldStore = this.stores.get(name);
      if (oldStore) {
      }
    }
    this.stores.set(name, store);
    if (metadata) {
      this.metadata.set(store, {
        registeredAt: Date.now(),
        name,
        ...metadata
      });
    }
    this._updateSnapshot();
    this._notifyListeners();
  }
  unregister(name: string): boolean {
    const store = this.stores.get(name);
    if (!store) {
      return false;
    }
    this.stores.delete(name);
    this._updateSnapshot();
    this._notifyListeners();
    return true;
  }
  getStore(name: string): IStore<any> | undefined {
    return this.stores.get(name);
  }
  hasStore(name: string): boolean {
    return this.stores.has(name);
  }
  getStoreNames(): string[] {
    return Array.from(this.stores.keys());
  }
  getAllStores(): Map<string, IStore<any>> {
    return new Map(this.stores);
  }
  getStoreMetadata(nameOrStore: string | IStore<any>): StoreMetadata | undefined {
    const store = typeof nameOrStore === 'string' ? this.stores.get(nameOrStore) : nameOrStore;
    return store ? this.metadata.get(store) : undefined;
  }
  updateStoreMetadata(nameOrStore: string | IStore<any>, metadata: Partial<StoreMetadata>): boolean {
    const store = typeof nameOrStore === 'string' ? this.stores.get(nameOrStore) : nameOrStore;
    if (!store) {
      return false;
    }
    const currentMetadata = this.metadata.get(store);
    this.metadata.set(store, {
      registeredAt: Date.now(),
      name: typeof nameOrStore === 'string' ? nameOrStore : currentMetadata?.name || 'unknown',
      ...currentMetadata,
      ...metadata
    });
    return true;
  }
  getSnapshot(): Array<[string, IStore<any>]> {
    return this._snapshot;
  }
  clear(): void {
    this.stores.clear();
    this._updateSnapshot();
    this._notifyListeners();
  }
  dispose(): void {
    this.clear();
    this.listeners.clear();
  }
  getStoreCount(): number {
    return this.stores.size;
  }
  forEach(callback: (store: IStore<any>, name: string) => void): void {
    this.stores.forEach((store, name) => {
      callback(store, name);
    });
  }
  getStats() {
    return {
      totalStores: this.stores.size,
      storeNames: this.getStoreNames(),
      registryName: this.name
    };
  }
  private _updateSnapshot(): void {
    this._snapshot = Array.from(this.stores.entries());
  }
  private _notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in registry listener:', error);
      }
    });
  }
}
export const globalStoreRegistry = new StoreRegistry('global');
```

### stores/hooks/index.ts

```typescript
export { useStoreSelector as useStore } from '../utils/store-selector';
export { useStoreValue, useStoreValues, assertStoreValue } from './useStoreValue';
export { 
  useSafeStoreSubscription,
  useConditionalStoreSubscription,
  useMultiStoreSubscription,
  equalityFunctions,
  type EnhancedSubscriptionOptions
} from '../utils/sync-external-store-utils';
export { useLocalStore } from './useLocalStore';
export { usePersistedStore } from './usePersistedStore';
export { 
  useStoreSelector, 
  useMultiStoreSelector, 
  useStorePathSelector,
  shallowEqual,
  deepEqual,
  defaultEqualityFn 
} from './useStoreSelector';
export { 
  useComputedStore, 
  useMultiComputedStore, 
  useComputedStoreInstance,
  useAsyncComputedStore 
} from './useComputedStore';
export {
  useOptimizedStoreValue,
  useBulkStoreValues,
  useConditionalStoreValue,
  useStoreValuePath,
  useLazyStoreValue,
  useStoreMetrics,
  type OptimizedStoreOptions,
  type SubscriptionMetrics
} from './useOptimizedStoreValue';
```

### stores/hooks/useComputedStore.ts

```typescript
import { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { createStore } from '../core/Store';
import type { Store } from '../core/Store';
import { useStoreValue } from './useStoreValue';
import { defaultEqualityFn } from './useStoreSelector';
export interface ComputedStoreConfig<R> {
  equalityFn?: (a: R, b: R) => boolean;
  debug?: boolean;
  name?: string;
  initialValue?: R;
  onError?: (error: Error) => void;
  debounceMs?: number;
  enableCache?: boolean;
  cacheSize?: number;
}
export function useComputedStore<T, R>(
  store: Store<T>,
  compute: (value: T) => R,
  config: ComputedStoreConfig<R> = {}
): R {
  const {
    equalityFn = defaultEqualityFn,
    debug = false,
    name = 'computed',
    onError,
    debounceMs,
    enableCache = false,
    cacheSize = 10
  } = config;
  const computeRef = useRef(compute);
  const equalityFnRef = useRef(equalityFn);
  const cacheRef = useRef<Array<{ input: T; output: R }>>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  computeRef.current = compute;
  equalityFnRef.current = equalityFn;
  const currentValue = useStoreValue(store);
  const [computedValue, setComputedValue] = useState<R>(() => {
    try {
      return config.initialValue !== undefined 
        ? config.initialValue 
        : compute(currentValue);
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else if (debug) {
        console.error(`useComputedStore [${name}]: Error in initial computation:`, error);
      }
      throw error;
    }
  });
  const findCachedValue = useCallback((input: T): R | undefined => {
    if (!enableCache) return undefined;
    const cached = cacheRef.current.find(entry => 
      defaultEqualityFn(entry.input, input)
    );
    return cached?.output;
  }, [enableCache]);
  const setCachedValue = useCallback((input: T, output: R) => {
    if (!enableCache) return;
    const existingIndex = cacheRef.current.findIndex(entry => 
      defaultEqualityFn(entry.input, input)
    );
    if (existingIndex !== -1) {
      cacheRef.current[existingIndex] = { input, output };
    } else {
      cacheRef.current.push({ input, output });
      if (cacheRef.current.length > cacheSize) {
        cacheRef.current.shift(); 
      }
    }
    if (debug) {
      console.debug(`useComputedStore [${name}]: Cache updated`, {
        cacheSize: cacheRef.current.length,
        input,
        output
      });
    }
  }, [enableCache, cacheSize, debug, name]);
  const performComputation = useCallback((input: T) => {
    try {
      const cachedValue = findCachedValue(input);
      if (cachedValue !== undefined) {
        if (debug) {
          console.debug(`useComputedStore [${name}]: Using cached value`);
        }
        return cachedValue;
      }
      const startTime = debug ? Date.now() : 0;
      const result = computeRef.current(input);
      if (debug) {
        const duration = Date.now() - startTime;
        console.debug(`useComputedStore [${name}]: Computed in ${duration}ms`, {
          input,
          result
        });
      }
      setCachedValue(input, result);
      return result;
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else if (debug) {
        console.error(`useComputedStore [${name}]: Error in computation:`, error);
      }
      throw error;
    }
  }, [findCachedValue, setCachedValue, debug, name, onError]);
  const updateComputedValue = useCallback((newInput: T) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const doUpdate = () => {
      const newComputedValue = performComputation(newInput);
      if (!equalityFnRef.current(computedValue, newComputedValue)) {
        setComputedValue(newComputedValue);
      }
    };
    if (debounceMs && debounceMs > 0) {
      debounceTimerRef.current = setTimeout(doUpdate, debounceMs);
    } else {
      doUpdate();
    }
  }, [computedValue, performComputation, debounceMs]);
  useEffect(() => {
    updateComputedValue(currentValue);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentValue, updateComputedValue]);
  return computedValue;
}
export function useMultiComputedStore<R>(
  stores: Store<any>[],
  compute: (values: any[]) => R,
  config?: ComputedStoreConfig<R>
): R {
  const finalConfig = config || {};
  const {
    equalityFn = defaultEqualityFn,
    debug = false,
    name = 'multiComputed',
    onError,
    debounceMs,
    enableCache = false,
    cacheSize = 10
  } = finalConfig;
  const computeRef = useRef(compute);
  const equalityFnRef = useRef(equalityFn);
  const cacheRef = useRef<Array<{ inputs: any[]; output: R }>>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  computeRef.current = compute;
  equalityFnRef.current = equalityFn;
  const currentValues = useMemo(() => {
    return stores.map(store => store.getValue());
  }, [stores]);
  useEffect(() => {
    const unsubscribeFunctions: Array<() => void> = [];
    stores.forEach(store => {
      const unsubscribe = store.subscribe(() => {
        setComputedValue(prev => {
          const newValues = stores.map(s => s.getValue());
          try {
            const newComputed = computeRef.current(newValues);
            return equalityFnRef.current(prev, newComputed) ? prev : newComputed;
          } catch (error) {
            if (onError) {
              onError(error as Error);
            } else if (debug) {
              console.error(`useMultiComputedStore [${name}]: Error in computation:`, error);
            }
            return prev;
          }
        });
      });
      unsubscribeFunctions.push(unsubscribe);
    });
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [stores, name, debug, onError]);
  const [computedValue, setComputedValue] = useState<R>(() => {
    try {
      return finalConfig.initialValue !== undefined 
        ? finalConfig.initialValue 
        : compute(currentValues);
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else if (debug) {
        console.error(`useMultiComputedStore [${name}]: Error in initial computation:`, error);
      }
      throw error;
    }
  });
  const findCachedValue = useCallback((inputs: any[]): R | undefined => {
    if (!enableCache) return undefined;
    const cached = cacheRef.current.find(entry => 
      entry.inputs.length === inputs.length &&
      entry.inputs.every((input, index) => defaultEqualityFn(input, inputs[index]))
    );
    return cached?.output;
  }, [enableCache]);
  const setCachedValue = useCallback((inputs: any[], output: R) => {
    if (!enableCache) return;
    cacheRef.current.push({ inputs: [...inputs], output });
    if (cacheRef.current.length > cacheSize) {
      cacheRef.current.shift(); 
    }
    if (debug) {
      console.debug(`useMultiComputedStore [${name}]: Cache updated`, {
        cacheSize: cacheRef.current.length,
        inputs,
        output
      });
    }
  }, [enableCache, cacheSize, debug, name]);
  const performComputation = useCallback((inputs: any[]) => {
    try {
      const cachedValue = findCachedValue(inputs);
      if (cachedValue !== undefined) {
        if (debug) {
          console.debug(`useMultiComputedStore [${name}]: Using cached value`);
        }
        return cachedValue;
      }
      const startTime = debug ? Date.now() : 0;
      const result = computeRef.current(inputs);
      if (debug) {
        const duration = Date.now() - startTime;
        console.debug(`useMultiComputedStore [${name}]: Computed in ${duration}ms`, {
          inputs,
          result
        });
      }
      setCachedValue(inputs, result);
      return result;
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else if (debug) {
        console.error(`useMultiComputedStore [${name}]: Error in computation:`, error);
      }
      throw error;
    }
  }, [findCachedValue, setCachedValue, debug, name, onError]);
  const updateComputedValue = useCallback((newInputs: any[]) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const doUpdate = () => {
      const newComputedValue = performComputation(newInputs);
      if (!equalityFnRef.current(computedValue, newComputedValue)) {
        setComputedValue(newComputedValue);
      }
    };
    if (debounceMs && debounceMs > 0) {
      debounceTimerRef.current = setTimeout(doUpdate, debounceMs);
    } else {
      doUpdate();
    }
  }, [computedValue, performComputation, debounceMs]);
  useEffect(() => {
    updateComputedValue(currentValues);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentValues, updateComputedValue]);
  return computedValue;
}
export function useComputedStoreInstance<R>(
  dependencies: Store<any>[],
  compute: (values: any[]) => R,
  config?: ComputedStoreConfig<R>
): Store<R> {
  const finalConfig = config || {};
  const computedValue = useMultiComputedStore(dependencies, compute, config);
  const computedStore = useMemo(() => {
    const storeName = finalConfig.name || `computed-${Date.now()}`;
    const store = createStore(storeName, computedValue);
    if (finalConfig.debug) {
      console.log(`useComputedStoreInstance: Created store [${storeName}]`);
    }
    return store;
  }, [finalConfig.name, finalConfig.debug, computedValue]);
  useEffect(() => {
    computedStore.setValue(computedValue);
  }, [computedValue, computedStore]);
  return computedStore;
}
export function useAsyncComputedStore<R>(
  dependencies: Store<any>[],
  compute: (values: any[]) => Promise<R>,
  config: ComputedStoreConfig<R> & { 
    loadingValue?: R;
    errorValue?: R;
  } = {}
): { 
  value: R; 
  loading: boolean; 
  error: Error | null; 
  reload: () => void;
} {
  const {
    initialValue,
    loadingValue,
    errorValue,
    name = 'asyncComputed',
    debug = false,
    onError
  } = config;
  const currentValues = useMemo(() => {
    return dependencies.map(store => store.getValue());
  }, [dependencies]);
  const [state, setState] = useState<{
    value: R;
    loading: boolean;
    error: Error | null;
  }>(() => ({
    value: initialValue || loadingValue as R,
    loading: false,
    error: null
  }));
  const computeRef = useRef(compute);
  computeRef.current = compute;
  const reload = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await computeRef.current(currentValues);
      setState({ value: result, loading: false, error: null });
      if (debug) {
        console.debug(`useAsyncComputedStore [${name}]: Async computation completed`, result);
      }
    } catch (error) {
      const err = error as Error;
      setState({ 
        value: errorValue !== undefined ? errorValue : state.value, 
        loading: false, 
        error: err 
      });
      if (onError) {
        onError(err);
      } else if (debug) {
        console.error(`useAsyncComputedStore [${name}]: Async computation failed:`, err);
      }
    }
  }, [currentValues, errorValue, state.value, name, debug, onError]);
  useEffect(() => {
    reload();
  }, [reload]);
  return {
    value: state.value,
    loading: state.loading,
    error: state.error,
    reload
  };
}
```

### stores/hooks/useLocalStore.ts

```typescript
import { useRef } from 'react';
import { Store, createStore } from '../core/Store';
import { useStoreSelector } from '../utils/store-selector';
import type { Snapshot } from '../core/types';
export function useLocalStore<T>(
  initialValue: T, 
  name?: string
): Snapshot<T> & { store: Store<T> } {
  const storeRef = useRef<Store<T> | null>(null);
  if (!storeRef.current) {
    const storeName = name || `localStore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    storeRef.current = createStore(storeName, initialValue);
  }
  const snapshot = useStoreSelector(storeRef.current);
  return {
    ...snapshot,
    store: storeRef.current
  };
}
```

### stores/hooks/useOptimizedStoreValue.ts

```typescript
import { useSyncExternalStore, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Store } from '../core/Store';
import { useSafeStoreSubscription } from '../utils/sync-external-store-utils';
export interface OptimizedStoreOptions<T, R = T> {
  selector?: (value: T) => R;
  isEqual?: (prev: R, next: R) => boolean;
  throttle?: number;
  debounce?: number;
  enableMemoization?: boolean;
  maxCacheSize?: number;
  enableMetrics?: boolean;
  defaultValue?: R;
  enableRetry?: boolean;
  maxRetries?: number;
}
export interface SubscriptionMetrics {
  totalUpdates: number;
  throttledUpdates: number;
  debouncedUpdates: number;
  cacheHits: number;
  cacheMisses: number;
  averageSelectorTime: number;
  lastUpdate: number;
}
interface CacheEntry<T, R> {
  readonly input: T;
  readonly output: R;
  timestamp: number;
  hitCount: number;
}
function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}
function isValidSelector<T, R>(selector: unknown): selector is (value: T) => R {
  return typeof selector === 'function';
}
function isValidEqualityFunction<R>(isEqual: unknown): isEqual is (prev: R, next: R) => boolean {
  return typeof isEqual === 'function';
}
export function useOptimizedStoreValue<T, R = T>(
  store: Store<T>,
  options: OptimizedStoreOptions<T, R> = {}
): R {
  const {
    selector,
    isEqual = Object.is,
    throttle,
    debounce,
    enableMemoization = false,
    maxCacheSize = 10,
    defaultValue,
    enableRetry = true,
    maxRetries = 3,
    enableMetrics = false
  } = options;
  if (throttle !== undefined && !isPositiveNumber(throttle)) {
    throw new TypeError('throttle must be a positive number');
  }
  if (debounce !== undefined && !isPositiveNumber(debounce)) {
    throw new TypeError('debounce must be a positive number');
  }
  if (!isPositiveNumber(maxCacheSize)) {
    throw new TypeError('maxCacheSize must be a positive number');
  }
  if (!isPositiveNumber(maxRetries)) {
    throw new TypeError('maxRetries must be a positive number');
  }
  if (selector !== undefined && !isValidSelector(selector)) {
    throw new TypeError('selector must be a function');
  }
  if (isEqual !== Object.is && !isValidEqualityFunction(isEqual)) {
    throw new TypeError('isEqual must be a function');
  }
  const metricsRef = useRef<SubscriptionMetrics>({
    totalUpdates: 0,
    throttledUpdates: 0,
    debouncedUpdates: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageSelectorTime: 0,
    lastUpdate: 0
  });
  const cacheRef = useRef<CacheEntry<T, R>[]>([]);
  const lastValueRef = useRef<R | undefined>();
  const errorCountRef = useRef(0);
  const optimizedSelector = useCallback((value: T): R => {
    const startTime = performance.now();
    try {
      let result: R;
      if (selector) {
        if (enableMemoization) {
          const cached = cacheRef.current.find(entry => 
            Object.is(entry.input, value)
          );
          if (cached) {
            metricsRef.current.cacheHits++;
            cached.hitCount++;
            cached.timestamp = Date.now();
            result = cached.output;
          } else {
            metricsRef.current.cacheMisses++;
            result = selector(value);
            const entry: CacheEntry<T, R> = {
              input: value,
              output: result,
              timestamp: Date.now(),
              hitCount: 1
            };
            cacheRef.current.push(entry);
            if (cacheRef.current.length > maxCacheSize) {
              cacheRef.current.sort((a, b) => a.timestamp - b.timestamp);
              cacheRef.current.shift();
            }
          }
        } else {
          result = selector(value);
        }
      } else {
        result = value as unknown as R;
      }
      errorCountRef.current = 0;
      return result;
    } catch (error) {
      errorCountRef.current++;
      console.warn(
        `Selector error (attempt ${errorCountRef.current}/${maxRetries}):`,
        error
      );
      if (enableRetry && errorCountRef.current < maxRetries) {
        return lastValueRef.current ?? (defaultValue as R);
      }
      throw error; 
    } finally {
      if (enableMetrics) {
        const duration = performance.now() - startTime;
        const metrics = metricsRef.current;
        metrics.averageSelectorTime = 
          (metrics.averageSelectorTime * metrics.totalUpdates + duration) / 
          (metrics.totalUpdates + 1);
        metrics.totalUpdates++;
        metrics.lastUpdate = Date.now();
      }
    }
  }, [selector, enableMemoization, maxCacheSize, defaultValue, enableRetry, maxRetries, enableMetrics]);
  const subscriptionOptions = {
    debug: enableMetrics,
    name: `optimized-${store.name}`,
    equalityFn: isEqual as (a: R, b: R) => boolean,
    initialValue: defaultValue as R,
    ...(throttle !== undefined && { throttle }),
    ...(debounce !== undefined && { debounce })
  };
  const currentValue = useSafeStoreSubscription(
    store,
    optimizedSelector,
    subscriptionOptions
  ) as R;
  useEffect(() => {
    lastValueRef.current = currentValue;
    if (enableMetrics && currentValue !== undefined) {
      const metrics = metricsRef.current;
      metrics.totalUpdates++;
    }
  }, [currentValue, enableMetrics]);
  useEffect(() => {
    return () => {
      cacheRef.current = [];
    };
  }, []);
  return currentValue;
}
export function useStoreMetrics(): SubscriptionMetrics | null {
  return null;
}
export function useBulkStoreValues<T extends Record<string, unknown>>(
  stores: { readonly [K in keyof T]: Store<T[K]> },
  options: OptimizedStoreOptions<unknown> = {}
): T {
  if (!stores || typeof stores !== 'object') {
    throw new TypeError('stores must be an object');
  }
  if (Object.keys(stores).length === 0) {
    throw new Error('stores object cannot be empty');
  }
  const storeArray = useMemo(() => Object.values(stores) as Store<unknown>[], [stores]);
  const storeKeys = useMemo(() => Object.keys(stores), [stores]);
  return useSyncExternalStore(
    useCallback((callback: () => void) => {
      const unsubscribes = storeArray.map(store => store.subscribe(callback));
      return () => unsubscribes.forEach(unsub => unsub());
    }, [storeArray]),
    useCallback((): T => {
      const result = {} as T;
      storeKeys.forEach((key, index) => {
        const store = storeArray[index];
        if (store) {
          (result as Record<string, unknown>)[key] = store.getValue();
        }
      });
      return result;
    }, [storeArray, storeKeys]),
    useCallback((): T => {
      const result = {} as T;
      storeKeys.forEach(key => {
        (result as Record<string, unknown>)[key] = options.defaultValue;
      });
      return result;
    }, [storeKeys, options.defaultValue])
  );
}
export function useConditionalStoreValue<T>(
  store: Store<T>,
  condition: boolean,
  options: OptimizedStoreOptions<T> = {}
): T | undefined {
  if (typeof condition !== 'boolean') {
    throw new TypeError('condition must be a boolean');
  }
  return useSafeStoreSubscription(
    condition ? store : null,
    undefined,
    {
      initialValue: options.defaultValue as T,
      name: `conditional-${store.name}`
    }
  );
}
export function useStoreValuePath<
  T extends Record<string, unknown>, 
  K extends string
>(
  store: Store<T>,
  path: K,
  options: OptimizedStoreOptions<T> = {}
): unknown {
  if (typeof path !== 'string' || path.length === 0) {
    throw new TypeError('path must be a non-empty string');
  }
  if (path.includes('..') || path.startsWith('.') || path.endsWith('.')) {
    throw new Error('path cannot contain relative path components or start/end with dots');
  }
  const pathSelector = useCallback((value: T) => {
    const pathParts = path.split('.');
    let result: unknown = value;
    for (const part of pathParts) {
      if (result && typeof result === 'object' && part in result) {
        result = (result as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return result;
  }, [path]);
  return useSafeStoreSubscription(
    store,
    pathSelector,
    {
      equalityFn: options.isEqual as (a: unknown, b: unknown) => boolean,
      initialValue: options.defaultValue,
      name: `path-${store.name}-${path}`
    }
  );
}
export function useLazyStoreValue<T>(
  store: Store<T>,
  options: OptimizedStoreOptions<T> & {
    suspense?: boolean;
    loader?: () => Promise<T>;
  } = {}
): T {
  const { suspense = false, loader, ...restOptions } = options;
  const value = useOptimizedStoreValue(store, restOptions);
  if (suspense && loader && value === undefined) {
    throw loader(); 
  }
  return value as T;
}
```

### stores/hooks/usePersistedStore.ts

```typescript
import { useRef, useEffect } from 'react';
import { Store } from '../core/Store';
import { useStoreSelector } from '../utils/store-selector';
interface PersistOptions {
  storage?: Storage;                        
  serialize?: (value: any) => string;       
  deserialize?: (value: string) => any;     
}
export function usePersistedStore<T>(
  key: string,
  initialValue: T,
  options: PersistOptions = {}
) {
  const {
    storage = localStorage,           
    serialize = JSON.stringify,       
    deserialize = JSON.parse          
  } = options;
  const storeRef = useRef<Store<T> | null>(null);
  if (!storeRef.current) {
    let value = initialValue;
    try {
      const stored = storage.getItem(key);
      if (stored !== null) {
        value = deserialize(stored);
      }
    } catch (error) {
      console.warn(`Failed to load persisted value for "${key}":`, error);
    }
    storeRef.current = new Store(key, value);
  }
  const store = storeRef.current;
  useStoreSelector(store);
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      try {
        const value = store.getValue();
        storage.setItem(key, serialize(value));
      } catch (error) {
        console.warn(`Failed to persist value for "${key}":`, error);
      }
    });
    return unsubscribe;
  }, [store, key, storage, serialize]);
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const value = deserialize(e.newValue);
          store.setValue(value);
        } catch (error) {
          console.warn(`Failed to sync value for "${key}":`, error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [store, key, deserialize]);
  return store;
}
```

### stores/hooks/useStoreSelector.ts

```typescript
import { useSyncExternalStore, useCallback, useRef } from 'react';
import type { Store } from '../core/Store';
import { equalityFunctions } from '../utils/sync-external-store-utils';
export const defaultEqualityFn = equalityFunctions.smart; 
export const shallowEqual = equalityFunctions.shallow;
export const deepEqual = equalityFunctions.deep;
export const smartEqual = equalityFunctions.smart;
export function useStoreSelector<T, R>(
  store: Store<T>,
  selector: (value: T) => R,
  equalityFn: (a: R, b: R) => boolean = defaultEqualityFn
): R {
  const stableSelector = useCallback(selector, [selector]);
  const stableEqualityFn = useCallback(equalityFn, [equalityFn]);
  const selectorWarningShownRef = useRef(false);
  if (process.env.NODE_ENV === 'development') {
    if (selector !== stableSelector && !selectorWarningShownRef.current) {
      console.warn(
        'useStoreSelector: selector function changed. ' +
        'Consider wrapping it with useCallback to avoid unnecessary recalculations.',
        'Store:', store.name
      );
      selectorWarningShownRef.current = true;
    }
  }
  const previousValueRef = useRef<R>();
  const subscribe = useCallback((callback: () => void) => {
    return store.subscribe(callback);
  }, [store]);
  const getSnapshot = useCallback((): R => {
    try {
      const storeValue = store.getValue();
      const selectedValue = stableSelector(storeValue);
      if (previousValueRef.current !== undefined && stableEqualityFn(previousValueRef.current, selectedValue)) {
        return previousValueRef.current;
      }
      previousValueRef.current = selectedValue;
      return selectedValue;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('useStoreSelector: Error in selector function:', error);
      }
      throw error;
    }
  }, [store, stableSelector, stableEqualityFn]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
export function useMultiStoreSelector<R>(
  stores: Store<any>[],
  selector: (values: any[]) => R,
  equalityFn: (a: R, b: R) => boolean = defaultEqualityFn
): R {
  const stableSelector = useCallback(selector, [selector]);
  const stableEqualityFn = useCallback(equalityFn, [equalityFn]);
  const previousValueRef = useRef<R>();
  const subscribe = useCallback((callback: () => void) => {
    const unsubscribes = stores.map(store => store.subscribe(callback));
    return () => unsubscribes.forEach(unsub => unsub());
  }, [stores]);
  const getSnapshot = useCallback((): R => {
    try {
      const storeValues = stores.map(store => store.getValue());
      const selectedValue = stableSelector(storeValues);
      if (previousValueRef.current !== undefined && stableEqualityFn(previousValueRef.current, selectedValue)) {
        return previousValueRef.current;
      }
      previousValueRef.current = selectedValue;
      return selectedValue;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('useMultiStoreSelector: Error in selector:', error);
      }
      throw error;
    }
  }, [stores, stableSelector, stableEqualityFn]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
export function useStorePathSelector<T>(
  store: Store<T>,
  path: (string | number)[],
  equalityFn: (a: any, b: any) => boolean = defaultEqualityFn
): any {
  const pathSelector = useCallback((value: T) => {
    let current: any = value;
    for (const key of path) {
      if (current == null) return undefined;
      current = current[key];
    }
    return current;
  }, [path]);
  return useStoreSelector(store, pathSelector, equalityFn);
}
```

### stores/hooks/useStoreValue.ts

```typescript
import { useMemo, useDeferredValue } from 'react';
import { shallowEqual, defaultEqualityFn } from './useStoreSelector';
import type { Store } from '../core/Store';
import type { React18Options } from '../../hooks/react18-hooks';
import { 
  useSafeStoreSubscription
} from '../utils/sync-external-store-utils';
export function assertStoreValue<T>(value: T | undefined, storeName: string): T {
  if (value === undefined) {
    throw new Error(
      `Store "${storeName}" returned undefined value. ` +
      'This should not happen with properly initialized stores.'
    );
  }
  return value;
}
export interface StoreValueOptions<R> {
  equalityFn?: (a: R, b: R) => boolean;
  lazy?: boolean;
  condition?: () => boolean;
  debounce?: number;
  throttle?: number;
  initialValue?: R;
  suspendedValue?: R;
  debug?: boolean;
  name?: string;
  react18?: React18Options;
}
export function useStoreValue<T>(
  store: Store<T>, 
  options?: StoreValueOptions<T>
): T;
export function useStoreValue<T>(
  store: Store<T> | undefined | null,
  options?: StoreValueOptions<T>
): T | undefined;
export function useStoreValue<T, R>(
  store: Store<T>, 
  selector: (value: T) => R,
  options?: StoreValueOptions<R>
): R;
export function useStoreValue<T, R>(
  store: Store<T> | undefined | null, 
  selector: (value: T) => R,
  options?: StoreValueOptions<R>
): R | undefined;
export function useStoreValue<T, R>(
  store: Store<T> | undefined | null,
  selectorOrOptions?: ((value: T) => R) | StoreValueOptions<T>,
  options?: StoreValueOptions<R>
): T | R | undefined {
  const selector = typeof selectorOrOptions === 'function' ? selectorOrOptions : undefined;
  const finalOptions = (typeof selectorOrOptions === 'function' ? options : selectorOrOptions) || {};
  const {
    equalityFn = defaultEqualityFn,
    lazy = false,
    condition,
    debounce,
    throttle,
    initialValue,
    suspendedValue,
    debug = false,
    name = store?.name || 'unknown',
    react18 = {}
  } = finalOptions;
  const subscriptionOptions = {
    debug,
    name,
    equalityFn: equalityFn as (a: R, b: R) => boolean,
    initialValue: initialValue as R,
    ...(debounce !== undefined && { debounce }),
    ...(throttle !== undefined && { throttle }),
    ...(condition && { condition }),
    ...(lazy && !condition && { condition: () => false })
  };
  const rawValue = useSafeStoreSubscription(
    store,
    selector,
    subscriptionOptions
  );
  const processedValue = useMemo(() => {
    if (lazy && condition && !condition()) {
      return suspendedValue !== undefined ? suspendedValue : initialValue;
    }
    return rawValue;
  }, [rawValue, lazy, condition, suspendedValue, initialValue]);
  const {
    enableDeferred = false,
    priorityThreshold = 1000
  } = react18;
  const deferredProcessedValue = useDeferredValue(processedValue);
  const finalValue = useMemo(() => {
    if (!enableDeferred) return processedValue;
    const shouldDefer = (() => {
      if (typeof processedValue === 'object' && processedValue !== null) {
        try {
          const size = JSON.stringify(processedValue).length;
          return size > priorityThreshold;
        } catch {
          return true; 
        }
      }
      return false;
    })();
    if (shouldDefer && debug) {
      console.debug(`useStoreValue [${name}]: Using deferred value for complex state`);
    }
    return shouldDefer ? deferredProcessedValue : processedValue;
  }, [processedValue, deferredProcessedValue, enableDeferred, priorityThreshold, debug, name]);
  return finalValue;
}
export function useStoreValues<T, S extends Record<string, (value: T) => any>>(
  store: Store<T> | undefined | null,
  selectors: S
): { [K in keyof S]: ReturnType<S[K]> } | undefined {
  const selectorFunction = useMemo(() => {
    return (value: T) => {
      const result = {} as { [K in keyof S]: ReturnType<S[K]> };
      for (const [key, selector] of Object.entries(selectors)) {
        result[key as keyof S] = selector(value);
      }
      return result;
    };
  }, [selectors]);
  const storeValue = useSafeStoreSubscription(
    store,
    selectorFunction,
    {
      equalityFn: shallowEqual,
      name: `${store?.name || 'unknown'}-values`
    }
  ) as { [K in keyof S]: ReturnType<S[K]> } | undefined;
  return store ? storeValue : undefined;
}
```

### stores/index.ts

```typescript
export * from './patterns';
export * from './core';
export * from './hooks';
export * from './utils';
export { createStoreContext } from './patterns';
export type {
  StoreConfig,
  StoreSchema,
  InitialStores,
  StoreDefinitions,
  InferStoreTypes,
  InferInitialStores,
  StoreValues,
  WithProviderConfig
} from './patterns';
export type {
  IStore,
  IStoreRegistry,
  Snapshot
} from './core';
export type {
  ComparisonOptions,
  ComparisonStrategy
} from './utils';
```

### stores/patterns/declarative-store-pattern-v2.tsx

```typescript
import React, { createContext, useContext, ReactNode, useRef, useMemo } from 'react';
import { StoreRegistry } from '../core/StoreRegistry';
import { createStore } from '../core/Store';
import type { Store } from '../core/Store';
import type { ComparisonOptions } from '../utils/comparison';
export interface StoreConfig<T = any> {
  initialValue: T;
  strategy?: 'reference' | 'shallow' | 'deep';
  description?: string;
  debug?: boolean;
  tags?: string[];
  version?: string;
  comparisonOptions?: Partial<ComparisonOptions<T>>;
}
export type InitialStores<T extends Record<string, any>> = {
  [K in keyof T]: StoreConfig<T[K]> | T[K];  
};
export type StoreDefinitions = Record<string, StoreConfig<any> | any>;
export type InferStoreTypes<T extends StoreDefinitions> = {
  [K in keyof T]: T[K] extends StoreConfig<infer V> 
    ? V 
    : T[K] extends (...args: any[]) => any
      ? never  
      : T[K] extends object
        ? T[K] extends { length: number }
          ? T[K]  
          : T[K] extends Date
            ? T[K]  
            : T[K]  
        : T[K];  
};
export type StoreSchema<T extends Record<string, any>> = InitialStores<T>;
export class StoreManager<T extends Record<string, any>> {
  public readonly registry: StoreRegistry;
  public readonly initialStores: InitialStores<T>;
  public readonly stores = new Map<keyof T, Store<any>>();
  constructor(
    public readonly name: string,
    initialStores: InitialStores<T>
  ) {
    this.registry = new StoreRegistry(name);
    this.initialStores = initialStores;
  }
  getStore<K extends keyof T>(storeName: K): Store<T[K]> {
    const existing = this.stores.get(storeName);
    if (existing) {
      return existing;
    }
    const storeConfig = this.initialStores[storeName];
    let initialValue: T[K];
    let strategy: 'reference' | 'shallow' | 'deep' = 'reference';
    let description: string | undefined;
    let debug = false;
    let tags: string[] = ['declarative'];
    let version: string | undefined;
    let comparisonOptions: StoreConfig<T[K]>['comparisonOptions'];
    if (storeConfig && typeof storeConfig === 'object' && 'initialValue' in storeConfig) {
      const config = storeConfig as StoreConfig<T[K]>;
      initialValue = config.initialValue;
      strategy = config.strategy || 'reference';
      description = config.description;
      debug = config.debug || false;
      tags = config.tags ? ['declarative', ...config.tags] : ['declarative', strategy];
      version = config.version;
      comparisonOptions = config.comparisonOptions;
    } else {
      initialValue = storeConfig as T[K];
      tags = ['declarative', strategy];
    }
    const store = createStore(String(storeName), initialValue);
    const finalComparisonOptions = {
      strategy,
      ...comparisonOptions
    };
    store.setComparisonOptions(finalComparisonOptions);
    const metadata = {
      name: String(storeName),
      tags,
      description: description || `Store: ${String(storeName)}`,
      debug,
      ...(version !== undefined && { version })
    };
    this.registry.register(String(storeName), store, metadata);
    if (debug && process.env.NODE_ENV === 'development') {
      console.log(`🏪 Store context store created: ${String(storeName)}`, {
        strategy,
        tags,
        version,
        description,
        hasCustomComparison: !!comparisonOptions?.customComparator,
        ignoreKeys: comparisonOptions?.ignoreKeys
      });
    }
    this.stores.set(storeName, store);
    return store;
  }
  clear(): void {
    this.registry.clear();
    this.stores.clear();
  }
  getInfo() {
    return {
      name: this.name,
      storeCount: this.stores.size,
      availableStores: Object.keys(this.initialStores)
    };
  }
}
interface StoreContextValue<T extends Record<string, any>> {
  managerRef: React.RefObject<StoreManager<T> | null>;
}
export function createStoreContext<T extends Record<string, any>>(
  contextName: string,
  initialStores: InitialStores<T>
): ReturnType<typeof createStoreContextImpl<T>>;
export function createStoreContext<T extends StoreDefinitions>(
  contextName: string,
  storeDefinitions: T
): ReturnType<typeof createStoreContextImpl<InferStoreTypes<T>>>;
export function createStoreContext(
  contextName: string,
  initialStores: any
): any {
  return createStoreContextImpl(contextName, initialStores);
}
function createStoreContextImpl<T extends Record<string, any>>(
  contextName: string,
  initialStores: InitialStores<T>
) {
  const StoreContext = createContext<StoreContextValue<T> | null>(null);
  function Provider({ 
    children, 
    registryId 
  }: { 
    children: ReactNode;
    registryId?: string;
  }) {
    const effectiveRegistryId = registryId || contextName;
    const managerRef = useRef<StoreManager<T> | null>(null);
    if (!managerRef.current) {
      managerRef.current = new StoreManager(effectiveRegistryId, initialStores);
    }
    return (
      <StoreContext.Provider value={{ managerRef }}>
        {children}
      </StoreContext.Provider>
    );
  }
  function useStore<K extends keyof T>(storeName: K): Store<T[K]> {
    const context = useContext(StoreContext);
    if (!context || !context.managerRef.current) {
      throw new Error(
        `useStore must be used within ${contextName}.Provider. ` +
        `Wrap your component with <${contextName}.Provider>`
      );
    }
    return useMemo(() => {
      return context.managerRef.current!.getStore(storeName);
    }, [context.managerRef, storeName]);
  }
  function useStoreManager(): StoreManager<T> {
    const context = useContext(StoreContext);
    if (!context || !context.managerRef.current) {
      throw new Error(
        `useStoreManager must be used within ${contextName}.Provider`
      );
    }
    return context.managerRef.current;
  }
  function useStoreInfo() {
    const manager = useStoreManager();
    return manager.getInfo();
  }
  function useStoreClear() {
    const manager = useStoreManager();
    return () => manager.clear();
  }
  function withProvider<P extends {}>(
    Component: React.ComponentType<P>,
    config?: WithProviderConfig
  ): React.FC<P> {
    const registryId = config?.registryId || contextName;
    const WithStoreProvider = (props: P) => {
      const managerRef = useRef<StoreManager<T> | null>(null);
      if (!managerRef.current) {
        managerRef.current = new StoreManager(registryId, initialStores);
      }
      return (
        <StoreContext.Provider value={{ managerRef }}>
          <Component {...props} />
        </StoreContext.Provider>
      );
    };
    WithStoreProvider.displayName = 
      config?.displayName || `with${contextName}Provider(${Component.displayName || Component.name})`;
    return WithStoreProvider;
  }
  return {
    Provider,
    useStore,        
    useStoreManager, 
    useStoreInfo,
    useStoreClear,
    withProvider,
    contextName,
    initialStores
  } as const;
}
export type InferInitialStores<T> = T extends InitialStores<infer U> ? U : never;
export interface WithProviderConfig {
  displayName?: string;
  registryId?: string;
  autoCleanup?: boolean;
  errorBoundary?: boolean;
}
export type StoreValues<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends StoreConfig<infer V> ? V : T[K];
};
```

### stores/patterns/index.ts

```typescript
export { 
  createStoreContext,
  type InitialStores,
  type StoreConfig,
  type StoreDefinitions,
  type InferStoreTypes,
  type InferInitialStores,
  type StoreValues,
  type WithProviderConfig
} from './declarative-store-pattern-v2';
export { 
  type StoreConfig as StoreSchema
} from './declarative-store-pattern-v2';
```

### stores/utils/comparison.ts

```typescript
export type ComparisonStrategy = 'reference' | 'shallow' | 'deep' | 'custom';
export type CustomComparator<T = unknown> = (oldValue: T, newValue: T) => boolean;
export interface ComparisonOptions<T = unknown> {
  strategy: ComparisonStrategy;
  customComparator?: CustomComparator<T>;
  maxDepth?: number;
  ignoreKeys?: string[];
  enableCircularCheck?: boolean;
}
const DEFAULT_COMPARISON_OPTIONS: ComparisonOptions = {
  strategy: 'reference',
  maxDepth: 5,
  enableCircularCheck: true,
};
let globalComparisonOptions: ComparisonOptions = { ...DEFAULT_COMPARISON_OPTIONS };
export function setGlobalComparisonOptions(options: Partial<ComparisonOptions>): void {
  globalComparisonOptions = { ...DEFAULT_COMPARISON_OPTIONS, ...options };
}
export function getGlobalComparisonOptions(): ComparisonOptions {
  return { ...globalComparisonOptions };
}
export function referenceEquals<T>(oldValue: T, newValue: T): boolean {
  const result = Object.is(oldValue, newValue);
  return result;
}
export function shallowEquals<T>(oldValue: T, newValue: T, ignoreKeys: string[] = []): boolean {
  if (Object.is(oldValue, newValue)) {
    return true;
  }
  if (oldValue == null || newValue == null) {
    const result = oldValue === newValue;
    return result;
  }
  if (typeof oldValue !== 'object' || typeof newValue !== 'object') {
    const result = oldValue === newValue;
    return result;
  }
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (oldValue.length !== newValue.length) {
      return false;
    }
    for (let i = 0; i < oldValue.length; i++) {
      if (!Object.is(oldValue[i], newValue[i])) {
        return false;
      }
    }
    return true;
  }
  const oldKeys = Object.keys(oldValue as Record<string, unknown>).filter(key => !ignoreKeys.includes(key));
  const newKeys = Object.keys(newValue as Record<string, unknown>).filter(key => !ignoreKeys.includes(key));
  if (oldKeys.length !== newKeys.length) {
    return false;
  }
  for (const key of oldKeys) {
    if (!newKeys.includes(key)) {
      return false;
    }
    if (!Object.is((oldValue as Record<string, unknown>)[key], (newValue as Record<string, unknown>)[key])) {
      return false;
    }
  }
  return true;
}
export function deepEquals<T>(
  oldValue: T, 
  newValue: T, 
  options: {
    maxDepth?: number;
    ignoreKeys?: string[];
    enableCircularCheck?: boolean;
  } = {}
): boolean {
  const { maxDepth = 5, ignoreKeys = [], enableCircularCheck = true } = options;
  const visitedPairs = enableCircularCheck ? new WeakMap<object, WeakSet<object>>() : null;
  function deepCompare(a: unknown, b: unknown, depth: number, path = ''): boolean {
    if (depth > maxDepth) {
      return Object.is(a, b);
    }
    if (Object.is(a, b)) {
      return true;
    }
    if (a == null || b == null) {
      return a === b;
    }
    if (typeof a !== typeof b) {
      return false;
    }
    if (typeof a !== 'object') {
      return a === b;
    }
    if (visitedPairs && typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      if (visitedPairs.has(a)) {
        const pairedSet = visitedPairs.get(a)!;
        if (pairedSet.has(b)) {
          return Object.is(a, b);
        }
      }
      if (!visitedPairs.has(a)) {
        visitedPairs.set(a, new WeakSet());
      }
      visitedPairs.get(a)!.add(b);
      if (!visitedPairs.has(b)) {
        visitedPairs.set(b, new WeakSet());
      }
      visitedPairs.get(b)!.add(a);
    }
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString();
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!deepCompare(a[i], b[i], depth + 1, `${path}[${i}]`)) {
          return false;
        }
      }
      return true;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      return false;
    }
    const aKeys = Object.keys(a as Record<string, unknown>).filter(key => !ignoreKeys.includes(key));
    const bKeys = Object.keys(b as Record<string, unknown>).filter(key => !ignoreKeys.includes(key));
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    for (const key of aKeys) {
      if (!bKeys.includes(key)) {
        return false;
      }
      if (!deepCompare((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], depth + 1, `${path}.${key}`)) {
        return false;
      }
    }
    return true;
  }
  const result = deepCompare(oldValue, newValue, 0);
  return result;
}
export function compareValues<T>(
  oldValue: T, 
  newValue: T, 
  options: Partial<ComparisonOptions<T>> = {}
): boolean {
  const finalOptions = { ...globalComparisonOptions, ...options };
  const { strategy, customComparator, maxDepth, ignoreKeys, enableCircularCheck } = finalOptions;
  let result: boolean;
  try {
    if (strategy !== 'reference' && strategy !== 'custom' && typeof oldValue === 'object' && typeof newValue === 'object') {
      try {
        const oldStr = JSON.stringify(oldValue);
        const newStr = JSON.stringify(newValue);
        if (oldStr.length < 1000 && newStr.length < 1000) {
          result = oldStr === newStr;
          return result;
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[ComparisonOptimization] JSON serialization failed, falling back to original strategy:', error);
        }
      }
    }
    switch (strategy) {
      case 'reference':
        result = referenceEquals(oldValue, newValue);
        break;
      case 'shallow':
        result = shallowEquals(oldValue, newValue, ignoreKeys);
        break;
      case 'deep': {
        const deepOptions = {
          ...(maxDepth !== undefined && { maxDepth }),
          ...(ignoreKeys !== undefined && { ignoreKeys }),
          ...(enableCircularCheck !== undefined && { enableCircularCheck })
        };
        result = deepEquals(oldValue, newValue, deepOptions);
        break;
      }
      case 'custom':
        if (!customComparator) {
          result = referenceEquals(oldValue, newValue);
        } else {
          result = customComparator(oldValue, newValue);
        }
        break;
      default:
        result = referenceEquals(oldValue, newValue);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CompareValues] Comparison failed, falling back to reference equality:', error);
    }
    result = referenceEquals(oldValue, newValue);
  }
  return result;
}
export function fastCompare<T>(oldValue: T, newValue: T): boolean {
  if (Object.is(oldValue, newValue)) {
    return true;
  }
  if (oldValue == null || newValue == null) {
    return oldValue === newValue;
  }
  if (typeof oldValue !== 'object' || typeof newValue !== 'object') {
    return oldValue === newValue;
  }
  if (typeof oldValue === 'object' && oldValue !== null) {
    const isDOMElement = (
      (typeof Element !== 'undefined' && oldValue instanceof Element) ||
      (typeof Node !== 'undefined' && oldValue instanceof Node) ||
      (typeof HTMLElement !== 'undefined' && oldValue instanceof HTMLElement) ||
      (oldValue as any).nodeType !== undefined ||
      (oldValue as any)._owner !== undefined ||
      (oldValue as any).stateNode !== undefined
    );
    if (isDOMElement) {
      return Object.is(oldValue, newValue);
    }
  }
  try {
    const oldStr = JSON.stringify(oldValue);
    const newStr = JSON.stringify(newValue);
    if (oldStr.length <= 1000 && newStr.length <= 1000) { 
      return oldStr === newStr;
    }
  } catch (error) {
    const errorMessage = error?.toString() || '';
    if (
      errorMessage.includes('circular') ||
      errorMessage.includes('HTMLDivElement') ||
      errorMessage.includes('HTMLElement') ||
      errorMessage.includes('Converting circular structure')
    ) {
      return Object.is(oldValue, newValue);
    }
    if (process.env.NODE_ENV === 'development') {
      console.debug('[FastCompare] JSON serialization failed, using fallback comparison:', error);
    }
  }
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (oldValue.length !== newValue.length) {
      return false;
    }
    if (oldValue.length <= 10) { 
      return oldValue.every((item, index) => Object.is(item, newValue[index]));
    }
  }
  const oldKeys = Object.keys(oldValue as Record<string, unknown>);
  if (oldKeys.length <= 5) { 
    const newKeys = Object.keys(newValue as Record<string, unknown>);
    if (oldKeys.length === newKeys.length) {
      return oldKeys.every(key => 
        newKeys.includes(key) && 
        Object.is((oldValue as Record<string, unknown>)[key], (newValue as Record<string, unknown>)[key])
      );
    }
  }
  return compareValues(oldValue, newValue);
}
export function createStoreComparator<T>(
  options: Partial<ComparisonOptions<T>> = {}
): (oldValue: T, newValue: T) => boolean {
  const finalOptions = { ...globalComparisonOptions, ...options };
  return (oldValue: T, newValue: T) => {
    return compareValues(oldValue, newValue, finalOptions);
  };
}
export interface ComparisonMetrics {
  strategy: ComparisonStrategy;
  duration: number;
  result: boolean;
  complexity: 'simple' | 'medium' | 'complex';
  timestamp: number;
}
export function measureComparison<T>(
  oldValue: T,
  newValue: T,
  options: Partial<ComparisonOptions<T>> = {}
): ComparisonMetrics {
  const startTime = performance.now();
  const result = compareValues(oldValue, newValue, options);
  const duration = performance.now() - startTime;
  let complexity: 'simple' | 'medium' | 'complex' = 'simple';
  if (typeof oldValue === 'object' && oldValue !== null) {
    const size = JSON.stringify(oldValue).length;
    if (size > 1000) complexity = 'complex';
    else if (size > 100) complexity = 'medium';
  }
  const metrics: ComparisonMetrics = {
    strategy: options.strategy || globalComparisonOptions.strategy,
    duration,
    result,
    complexity,
    timestamp: Date.now()
  };
  return metrics;
}
function isDOMElement(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof Element !== 'undefined' && value instanceof Element) return true;
  if (typeof Node !== 'undefined' && value instanceof Node) return true;
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return true;
  return (
    typeof obj.nodeType === 'number' ||
    typeof obj.nodeName === 'string' ||
    obj._owner !== undefined ||  
    obj.stateNode !== undefined  
  );
}
function isUnsafeObject(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  if (dangerousKeys.some(key => Object.prototype.hasOwnProperty.call(obj, key))) {
    const protoValue = obj.__proto__;
    const constructorValue = obj.constructor;
    if (protoValue === Object.prototype || protoValue === Array.prototype) {
    } else if (constructorValue === Object || constructorValue === Array) {
    } else {
      return true; 
    }
  }
  const stringValues = Object.values(obj).filter((v): v is string => typeof v === 'string');
  const hasScriptTags = stringValues.some(str => 
    /<script[^>]*>|javascript:|data:text\/html|eval\(|Function\(/i.test(str)
  );
  if (hasScriptTags) {
    console.warn('Potentially unsafe string content detected in object comparison');
    return true;
  }
  try {
    const serialized = JSON.stringify(obj);
    if (serialized.length > 100000) { 
      console.warn('Extremely large object detected in comparison');
      return true;
    }
  } catch {
  }
  return false;
}
export function sanitizeValue<T>(value: T): T {
  if (typeof value === 'string') {
    const sanitizedString = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    return sanitizedString as T;
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  try {
    const sanitized = JSON.parse(JSON.stringify(value));
    function cleanObject(obj: Record<string, unknown>): Record<string, unknown> {
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      const clean = { ...obj };
      dangerousKeys.forEach(key => {
        delete clean[key];
      });
      Object.keys(clean).forEach(key => {
        if (typeof clean[key] === 'object' && clean[key] !== null) {
          clean[key] = cleanObject(clean[key] as Record<string, unknown>);
        }
      });
      return clean;
    }
    return cleanObject(sanitized as Record<string, unknown>) as T;
  } catch (error) {
    console.warn('Failed to sanitize value, returning original:', error);
    return value;
  }
}
export function validateSecurity<T>(value: T, options: SecurityOptions = {}): boolean {
  const {
    preventPrototypePollution = true,
    preventXSS = true,
    maxDepth = 10,
    maxStringLength = 10000
  } = options;
  if (typeof value !== 'object' || value === null) {
    if (typeof value === 'string' && value.length > maxStringLength) {
      return false;
    }
    return true;
  }
  let currentDepth = 0;
  function checkDepth(obj: unknown): boolean {
    if (currentDepth > maxDepth) return false;
    if (typeof obj === 'object' && obj !== null) {
      currentDepth++;
      if (Array.isArray(obj)) {
        return obj.every(item => checkDepth(item));
      } else {
        return Object.values(obj as Record<string, unknown>).every(val => checkDepth(val));
      }
    }
    return true;
  }
  if (!checkDepth(value)) {
    console.warn('Object depth exceeds security limit');
    return false;
  }
  if (preventPrototypePollution && isUnsafeObject(value)) {
    return false;
  }
  if (preventXSS) {
    const stringValues = JSON.stringify(value);
    if (/<script|javascript:|data:text\/html|eval\(|Function\(/i.test(stringValues)) {
      console.warn('Potentially unsafe content detected');
      return false;
    }
  }
  return true;
}
export interface SecurityOptions {
  preventPrototypePollution?: boolean;
  preventXSS?: boolean;
  maxDepth?: number;
  maxStringLength?: number;
  allowedProperties?: RegExp;
  blockedProperties?: RegExp;
}
```

### stores/utils/error-handling.ts

```typescript
export enum ContextActionErrorType {
  STORE_ERROR = 'STORE_ERROR',
  ACTION_ERROR = 'ACTION_ERROR',
  REF_ERROR = 'REF_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CIRCULAR_REFERENCE_ERROR = 'CIRCULAR_REFERENCE_ERROR'
}
export class ContextActionError extends Error {
  public readonly type: ContextActionErrorType;
  public readonly context: Record<string, unknown> | undefined;
  public readonly timestamp: number;
  constructor(
    type: ContextActionErrorType,
    message: string,
    context?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ContextActionError';
    this.type = type;
    this.context = context ?? undefined;
    this.timestamp = Date.now();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContextActionError);
    }
    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}
export enum ErrorLogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}
export interface ErrorHandlingConfig {
  logLevel: ErrorLogLevel;
  throwOnError: boolean;
  enableStackTrace: boolean;
  maxLogEntries: number;
  suppressRepeatedErrors: boolean;
  logErrors: boolean;
}
const defaultErrorConfig: ErrorHandlingConfig = {
  logLevel: process.env.NODE_ENV === 'development' ? ErrorLogLevel.DEBUG : ErrorLogLevel.ERROR,
  throwOnError: process.env.NODE_ENV === 'development',
  enableStackTrace: true,
  maxLogEntries: 100,
  suppressRepeatedErrors: true,
  logErrors: true
};
let currentErrorConfig: ErrorHandlingConfig = { ...defaultErrorConfig };
interface ErrorLogEntry {
  error: ContextActionError;
  count: number;
  lastOccurred: number;
}
let errorLog: ErrorLogEntry[] = [];
let errorSignatures: Map<string, ErrorLogEntry> = new Map();
export function setErrorHandlingConfig(config: Partial<ErrorHandlingConfig>): void {
  currentErrorConfig = { ...currentErrorConfig, ...config };
}
export function getErrorHandlingConfig(): ErrorHandlingConfig {
  return { ...currentErrorConfig };
}
function createErrorSignature(error: ContextActionError): string {
  return `${error.type}:${error.message}:${error.context?.component || 'unknown'}`;
}
export function handleError(
  type: ContextActionErrorType,
  message: string,
  context?: Record<string, unknown>,
  originalError?: Error
): ContextActionError {
  const error = new ContextActionError(type, message, context, originalError);
  logError(error);
  if (currentErrorConfig.throwOnError) {
    throw error;
  }
  return error;
}
export function handleContextActionError(
  type: ContextActionErrorType,
  message: string,
  context?: Record<string, unknown>,
  originalError?: Error
): ContextActionError {
  return handleError(type, message, context, originalError);
}
function logError(error: ContextActionError): void {
  const signature = createErrorSignature(error);
  if (currentErrorConfig.suppressRepeatedErrors) {
    const existingEntry = errorSignatures.get(signature);
    if (existingEntry) {
      existingEntry.count++;
      existingEntry.lastOccurred = Date.now();
      if (existingEntry.count % 10 === 0) {
        console.warn(
          `[Context-Action] Repeated error occurred ${existingEntry.count} times:`,
          error
        );
      }
      return;
    }
  }
  const logEntry: ErrorLogEntry = {
    error,
    count: 1,
    lastOccurred: Date.now()
  };
  errorLog.push(logEntry);
  errorSignatures.set(signature, logEntry);
  if (errorLog.length > currentErrorConfig.maxLogEntries) {
    const removedEntry = errorLog.shift();
    if (removedEntry) {
      const removedSignature = createErrorSignature(removedEntry.error);
      errorSignatures.delete(removedSignature);
    }
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).globalErrorBoundary) {
    (globalThis as any).globalErrorBoundary.reportError(error);
  }
  switch (currentErrorConfig.logLevel) {
    case ErrorLogLevel.DEBUG:
      console.debug('[Context-Action] Debug:', error);
      break;
    case ErrorLogLevel.INFO:
      console.info('[Context-Action] Info:', error);
      break;
    case ErrorLogLevel.WARN:
      console.warn('[Context-Action] Warning:', error);
      break;
    case ErrorLogLevel.ERROR:
      console.error('[Context-Action] Error:', error);
      if (currentErrorConfig.enableStackTrace && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      break;
    case ErrorLogLevel.SILENT:
      break;
  }
}
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorType: ContextActionErrorType,
  context?: Record<string, unknown>
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const contextError = handleContextActionError(
      errorType,
      error instanceof Error ? error.message : 'Unknown async error',
      context,
      error instanceof Error ? error : undefined
    );
    if (currentErrorConfig.logErrors) {
      console.error(`[${errorType}] Async operation failed:`, contextError);
    }
    return null;
  }
}
export function safeSync<T>(
  operation: () => T,
  errorType: ContextActionErrorType,
  context?: Record<string, unknown>
): T | null {
  try {
    return operation();
  } catch (error) {
    const contextError = handleContextActionError(
      errorType,
      error instanceof Error ? error.message : 'Unknown sync error',
      context,
      error instanceof Error ? error : undefined
    );
    if (currentErrorConfig.logErrors) {
      console.error(`[${errorType}] Sync operation failed:`, contextError);
    }
    return null;
  }
}
export const ErrorHandlers = {
  store: (message: string, context?: Record<string, unknown>, originalError?: Error) => {
    const enhancedMessage = `[Store Error] ${message}\nContext: ${JSON.stringify(context, null, 2)}`;
    return handleError(ContextActionErrorType.STORE_ERROR, enhancedMessage, context, originalError);
  },
  action: (message: string, context?: Record<string, unknown>, originalError?: Error) => {
    const enhancedMessage = `[Action Error] ${message}\nContext: ${JSON.stringify(context, null, 2)}`;
    return handleError(ContextActionErrorType.ACTION_ERROR, enhancedMessage, context, originalError);
  },
  ref: (message: string, context?: Record<string, unknown>, originalError?: Error) => {
    const enhancedMessage = `[Ref Error] ${message}\nContext: ${JSON.stringify(context, null, 2)}`;
    return handleError(ContextActionErrorType.REF_ERROR, enhancedMessage, context, originalError);
  },
  validation: (message: string, context?: Record<string, unknown>, originalError?: Error) => {
    const enhancedMessage = `[Validation Error] ${message}\nContext: ${JSON.stringify(context, null, 2)}`;
    return handleError(ContextActionErrorType.VALIDATION_ERROR, enhancedMessage, context, originalError);
  },
  initialization: (message: string, context?: Record<string, unknown>, originalError?: Error) => {
    const enhancedMessage = `[Initialization Error] ${message}\nContext: ${JSON.stringify(context, null, 2)}`;
    return handleError(ContextActionErrorType.INITIALIZATION_ERROR, enhancedMessage, context, originalError);
  },
  timeout: (message: string, context?: Record<string, unknown>, originalError?: Error) => {
    const enhancedMessage = `[Timeout Error] ${message}\nContext: ${JSON.stringify(context, null, 2)}`;
    return handleError(ContextActionErrorType.TIMEOUT_ERROR, enhancedMessage, context, originalError);
  },
  circularReference: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.CIRCULAR_REFERENCE_ERROR, message, context, originalError)
} as const;
export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Record<ContextActionErrorType, number>;
  mostFrequentErrors: Array<{
    signature: string;
    count: number;
    lastOccurred: number;
  }>;
  recentErrors: ContextActionError[];
}
export function getErrorStatistics(): ErrorStatistics {
  const errorsByType = Object.values(ContextActionErrorType).reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as Record<ContextActionErrorType, number>);
  errorLog.forEach(entry => {
    errorsByType[entry.error.type] += entry.count;
  });
  const mostFrequentErrors = Array.from(errorSignatures.entries())
    .map(([signature, entry]) => ({
      signature,
      count: entry.count,
      lastOccurred: entry.lastOccurred
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const recentErrors = errorLog
    .slice(-10)
    .map(entry => entry.error);
  return {
    totalErrors: errorLog.reduce((sum, entry) => sum + entry.count, 0),
    errorsByType,
    mostFrequentErrors,
    recentErrors
  };
}
export function clearErrorLog(): void {
  errorLog = [];
  errorSignatures.clear();
}
export function getFilteredErrors(
  filter: {
    type?: ContextActionErrorType;
    since?: number;
    limit?: number;
  } = {}
): ErrorLogEntry[] {
  let filtered = [...errorLog];
  if (filter.type) {
    filtered = filtered.filter(entry => entry.error.type === filter.type);
  }
  if (filter.since !== undefined) {
    filtered = filtered.filter(entry => entry.lastOccurred >= filter.since!);
  }
  if (filter.limit) {
    filtered = filtered.slice(-filter.limit);
  }
  return filtered;
}
```

### stores/utils/immutable.ts

```typescript
import { 
  produce as immerProduce, 
  isDraft as immerIsDraft, 
  original as immerOriginal, 
  current as immerCurrent 
} from 'immer';
function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol'
  );
}
function isComplexObject(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return true;
  if (value.constructor === Object) {
    const obj = value as Record<string, unknown>;
    return Object.values(obj).some(val => 
      typeof val === 'object' && val !== null
    );
  }
  return value.constructor !== Object;
}
const logger = {
  warn: (message: string, ...args: any[]) => console.warn(`[Context-Action] ${message}`, ...args),
  trace: (message: string, ...args: any[]) => console.trace(`[Context-Action] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[Context-Action] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[Context-Action] ${message}`, ...args)
};
export interface ImmutabilityOptions {
  enableCloning?: boolean;      
  enableVerification?: boolean; 
  warnOnFallback?: boolean;     
}
let globalImmutabilityOptions: ImmutabilityOptions = {
  enableCloning: true,
  enableVerification: process.env.NODE_ENV === 'development',
  warnOnFallback: true
};
function isNonCloneableType(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (typeof Element !== 'undefined' && value instanceof Element) return true;
  if (typeof Node !== 'undefined' && value instanceof Node) return true;
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return true;
  const record = value as Record<string, unknown>;
  if (typeof record.nodeType === 'number' && record.nodeType > 0) return true;
  if (typeof record.nodeName === 'string') return true;
  if (typeof record.tagName === 'string') return true;
  if (record._owner !== undefined || record.stateNode !== undefined) return true;
  if (typeof value === 'function') return true;
  if (value instanceof Promise) return true;
  if (typeof record.then === 'function' && typeof record.catch === 'function') return true;
  if (value instanceof WeakMap || value instanceof WeakSet) return true;
  return false;
}
export function deepClone<T>(value: T, _options?: { skipProducer?: boolean }): T {
  if (isPrimitive(value)) {
    return value;
  }
  if (typeof value === 'function') {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Functions cannot be deep cloned, returning original reference');
    }
    return value;
  }
  if (isNonCloneableType(value)) {
    return value;
  }
  if (typeof value === 'object' && value !== null && 
      '__contextActionRefState' in value && value.__contextActionRefState === true) {
    return value;
  }
  try {
    return immerProduce(value, (_draft: any) => {
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Immer produce failed, falling back to native methods', error);
    }
  }
  if (typeof structuredClone !== 'undefined') {
    try {
      return structuredClone(value);
    } catch {
    }
  }
  if (!isComplexObject(value)) {
    return simpleClone(value);
  }
  return fallbackClone(value);
}
export function deepCloneWithImmer<T>(value: T): T {
  if (isPrimitive(value)) {
    return value;
  }
  if (isNonCloneableType(value) || typeof value === 'function') {
    return value;
  }
  try {
    return immerProduce(value, (_draft: any) => {
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Immer produce failed, falling back to simple clone', error);
    }
    return fallbackClone(value);
  }
}
function isSimpleObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.constructor === Object &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
function simpleClone<T>(value: T, visited = new WeakSet()): T {
  if (typeof value === 'object' && value !== null && visited.has(value)) {
    return '[Circular]' as any;
  }
  if (Array.isArray(value)) {
    visited.add(value);
    const result = value.map(item => {
      if (typeof item === 'object' && item !== null) {
        if ('__contextActionRefState' in item && item.__contextActionRefState === true) {
          return item;
        } else {
          return simpleClone(item, visited);
        }
      }
      return item;
    }) as T;
    return result;
  }
  if (isSimpleObject(value)) {
    visited.add(value);
    const cloned = {} as Record<string, unknown>;
    for (const [key, val] of Object.entries(value)) {
      if (typeof val === 'object' && val !== null) {
        if ('__contextActionRefState' in val && val.__contextActionRefState === true) {
          cloned[key] = val;
        } else {
          cloned[key] = simpleClone(val, visited);
        }
      } else {
        cloned[key] = val;
      }
    }
    return cloned as T;
  }
  return value;
}
function fallbackClone<T>(value: T): T {
  try {
    const visited = new WeakSet();
    const refStateObjects = new Map<string, object>();
    let refStateId = 0;
    const collectRefStates = (obj: any) => {
      if (typeof obj !== 'object' || obj === null || visited.has(obj)) return;
      visited.add(obj);
      if ('__contextActionRefState' in obj && obj.__contextActionRefState === true) {
        const id = `refstate_${refStateId++}`;
        refStateObjects.set(id, obj);
      }
      try {
        if (Array.isArray(obj)) {
          obj.forEach(collectRefStates);
        } else {
          for (const val of Object.values(obj)) {
            collectRefStates(val);
          }
        }
      } catch {
      }
    };
    try {
      collectRefStates(value);
    } catch {
    }
    const circularSafeStringify = (obj: unknown): string => {
      const jsonVisited = new WeakSet(); 
      return JSON.stringify(obj, function(key, val) {
        if (val !== null && typeof val === 'object') {
          if (jsonVisited.has(val)) {
            return '[Circular]';
          }
          jsonVisited.add(val);
          if ('__contextActionRefState' in val && val.__contextActionRefState === true) {
            for (const [id, refStateObj] of refStateObjects) {
              if (refStateObj === val) {
                return { __REFSTATE_PLACEHOLDER__: id };
              }
            }
          }
        }
        return val;
      });
    };
    const jsonString = circularSafeStringify(value);
    const parsed = JSON.parse(jsonString);
    const restoreRefStates = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      if (obj.__REFSTATE_PLACEHOLDER__ && refStateObjects.has(obj.__REFSTATE_PLACEHOLDER__)) {
        return refStateObjects.get(obj.__REFSTATE_PLACEHOLDER__);
      }
      if (Array.isArray(obj)) {
        return obj.map(restoreRefStates);
      }
      const result = {} as any;
      for (const [key, val] of Object.entries(obj)) {
        result[key] = restoreRefStates(val);
      }
      return result;
    };
    return restoreRefStates(parsed);
  } catch (jsonError) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('All cloning methods failed, returning original reference', jsonError);
    }
    return value;
  }
}
export function verifyImmutability<T>(original: T, cloned: T): boolean {
  if (
    original === null ||
    original === undefined ||
    typeof original === 'string' ||
    typeof original === 'number' ||
    typeof original === 'boolean' ||
    typeof original === 'bigint' ||
    typeof original === 'symbol'
  ) {
    return original === cloned;
  }
  if (isNonCloneableType(original)) {
    return original === cloned;
  }
  if (typeof original === 'function') {
    return original === cloned;
  }
  if (typeof original === 'object' && original !== null) {
    return true; 
  }
  return false;
}
export function safeGet<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) return value;
  if (isPrimitive(value)) return value;
  if (isNonCloneableType(value)) return value;
  if (typeof value === 'object' && value !== null && 
      '__contextActionRefState' in value && value.__contextActionRefState === true) {
    return value;
  }
  const cloned = deepClone(value);
  if (process.env.NODE_ENV === 'development' && globalImmutabilityOptions.enableVerification) {
    if (!isNonCloneableType(value)) {
      const isImmutable = verifyImmutability(value, cloned);
      if (!isImmutable && typeof value === 'object' && value !== null) {
        if (Math.random() < 0.01) { 
          logger.debug('Immer optimization: same reference returned for unchanged object', {
            type: typeof value,
            constructor: value?.constructor?.name,
            isArray: Array.isArray(value)
          });
        }
      }
    }
  }
  return cloned;
}
export function safeSet<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) {
    if (process.env.NODE_ENV === 'development') {
      logger.trace('Cloning disabled for setter, returning original reference');
    }
    return value;
  }
  return deepClone(value);
}
export function setGlobalImmutabilityOptions(options: Partial<ImmutabilityOptions>): void {
  globalImmutabilityOptions = { ...globalImmutabilityOptions, ...options };
  logger.debug('Global immutability options updated', globalImmutabilityOptions);
}
export function getGlobalImmutabilityOptions(): ImmutabilityOptions {
  return { ...globalImmutabilityOptions };
}
export function performantSafeGet<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) {
    return value;
  }
  const startTime = performance.now();
  const result = deepClone(value); 
  const endTime = performance.now();
  const duration = endTime - startTime;
  performanceData.times.push(duration);
  performanceData.operations++;
  if (performanceData.times.length > 100) {
    performanceData.times.shift();
  }
  return result;
}
export function performantSafeGetWithImmer<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) {
    return value;
  }
  const startTime = performance.now();
  const result = deepCloneWithImmer(value);
  const endTime = performance.now();
  const duration = endTime - startTime;
  performanceData.times.push(duration);
  performanceData.operations++;
  if (performanceData.times.length > 100) {
    performanceData.times.shift();
  }
  return result;
}
export interface PerformanceProfile {
  averageCloneTime: number;
  totalOperations: number;
  recommendations: string[];
}
let performanceData: { times: number[]; operations: number } = {
  times: [],
  operations: 0
};
export function getPerformanceProfile(): PerformanceProfile {
  const { times, operations } = performanceData;
  const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const recommendations: string[] = ['Immer를 사용하여 최적화된 불변성 보장'];
  return {
    averageCloneTime: averageTime,
    totalOperations: operations,
    recommendations
  };
}
export const ImmerUtils = {
  isDraft(value: unknown): boolean {
    return immerIsDraft(value);
  },
  original<T>(value: T): T | undefined {
    return immerOriginal(value);
  },
  current<T>(value: T): T {
    return immerCurrent(value);
  },
  produce<T>(baseState: T, producer: (draft: T) => void | T): T {
    return immerProduce(baseState, producer);
  }
};
export function preloadImmer(): void {
}
export function produce<T>(baseState: T, producer: (draft: T) => void | T): T {
  try {
    return immerProduce(baseState, producer);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Immer produce failed, falling back to deep clone simulation', error);
    }
    try {
      const draft = deepClone(baseState);
      const result = producer(draft);
      return result !== undefined ? result : draft;
    } catch (fallbackError) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Produce fallback failed, returning original state', fallbackError);
      }
      return baseState;
    }
  }
}
export function isDraft(value: unknown): boolean {
  return immerIsDraft(value);
}
export function original<T>(value: T): T | undefined {
  return immerOriginal(value);
}
export function current<T>(value: T): T {
  return immerCurrent(value);
}
```

### stores/utils/index.ts

```typescript
export { 
  compareValues,
  setGlobalComparisonOptions,
  getGlobalComparisonOptions,
  type ComparisonOptions, 
  type ComparisonStrategy,
  type CustomComparator 
} from './comparison';
export { 
  safeGet, 
  safeSet, 
  deepClone,
  getGlobalImmutabilityOptions,
  performantSafeGet 
} from './immutable';
export { createRegistrySync, RegistryUtils } from './registry-sync';
export { 
  composeProviders,
  type ProviderComponent
} from './provider-composition';
export {
  SubscriptionManager,
  useSubscriptionManager,
  globalSubscriptionTracker,
  type SubscriptionEntry,
  type SubscriptionStats
} from './subscription-manager';
export {
  performanceMonitor,
  measurePerformance,
  type StorePerformanceMetrics,
  type PerformanceStats,
  type PerformanceThresholds
} from './performance-monitor';
export {
  isStore,
  isValidStoreValue,
  extractStoreValue,
  extractStoreValues,
  createSafeEqualityFn,
  createStoreConfig,
  TypeUtils,
  type StoreValue,
  type StoresValues,
  type StoreRecordValues,
  type StoreSelector,
  type EqualityFunction,
  type StoreListener,
  type StoreUpdater,
  type DeepReadonly,
  type StoreInitConfig,
  type PartialBy,
  type RequiredBy
} from './type-helpers';
```

### stores/utils/performance-monitor.ts

```typescript
export interface StorePerformanceMetrics {
  operationType: 'setValue' | 'update' | 'subscribe' | 'getSnapshot';
  storeName: string;
  duration: number;
  timestamp: number;
  payload?: {
    valueSize?: number;
    listenerCount?: number;
    batchSize?: number;
    hasError?: boolean;
  };
}
export interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  slowestOperation: StorePerformanceMetrics | null;
  operationsByType: Record<string, number>;
  operationsByStore: Record<string, number>;
  recentOperations: StorePerformanceMetrics[];
}
export interface PerformanceThresholds {
  setValue: number;
  update: number;
  subscribe: number;
  getSnapshot: number;
  batchUpdate: number;
}
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  setValue: 10,
  update: 15,
  subscribe: 5,
  getSnapshot: 2,
  batchUpdate: 20
};
class PerformanceMonitor {
  private metrics: StorePerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds = { ...DEFAULT_THRESHOLDS };
  private maxMetrics = 1000;
  private isEnabled = process.env.NODE_ENV === 'development';
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
  record(metric: StorePerformanceMetrics): void {
    if (!this.isEnabled) return;
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
    const threshold = this.thresholds[metric.operationType];
    if (metric.duration > threshold) {
      console.warn(
        `[Context-Action] Performance warning: ${metric.operationType} on "${metric.storeName}" took ${metric.duration}ms (threshold: ${threshold}ms)`,
        metric
      );
    }
  }
  measure<T>(
    operationType: StorePerformanceMetrics['operationType'],
    storeName: string,
    operation: () => T,
    payload?: StorePerformanceMetrics['payload']
  ): T {
    if (!this.isEnabled) {
      return operation();
    }
    const startTime = performance.now();
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      const metrics = {
        operationType,
        storeName,
        duration,
        timestamp: Date.now(),
        ...(payload && { payload })
      };
      this.record(metrics);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.record({
        operationType,
        storeName,
        duration,
        timestamp: Date.now(),
        payload: { ...payload, hasError: true }
      });
      throw error;
    }
  }
  getStats(): PerformanceStats {
    const recentOperations = this.metrics.slice(-50); 
    const operationsByType: Record<string, number> = {};
    const operationsByStore: Record<string, number> = {};
    let totalDuration = 0;
    let slowestOperation: StorePerformanceMetrics | null = null;
    this.metrics.forEach(metric => {
      operationsByType[metric.operationType] = (operationsByType[metric.operationType] || 0) + 1;
      operationsByStore[metric.storeName] = (operationsByStore[metric.storeName] || 0) + 1;
      totalDuration += metric.duration;
      if (!slowestOperation || metric.duration > slowestOperation.duration) {
        slowestOperation = metric;
      }
    });
    return {
      totalOperations: this.metrics.length,
      averageDuration: this.metrics.length > 0 ? totalDuration / this.metrics.length : 0,
      slowestOperation,
      operationsByType,
      operationsByStore,
      recentOperations
    };
  }
  getWarnings(): string[] {
    const warnings: string[] = [];
    const stats = this.getStats();
    if (stats.averageDuration > 5) {
      warnings.push(`Average operation duration is high: ${stats.averageDuration.toFixed(2)}ms`);
    }
    for (const [storeName] of Object.entries(stats.operationsByStore)) {
      const storeMetrics = this.metrics.filter(m => m.storeName === storeName);
      const averageDuration = storeMetrics.reduce((sum, m) => sum + m.duration, 0) / storeMetrics.length;
      if (averageDuration > 10) {
        warnings.push(`Store "${storeName}" has slow operations: ${averageDuration.toFixed(2)}ms average`);
      }
    }
    return warnings;
  }
  clear(): void {
    this.metrics = [];
  }
  exportMetrics(): StorePerformanceMetrics[] {
    return [...this.metrics];
  }
}
export const performanceMonitor = new PerformanceMonitor();
export function measurePerformance<T extends (...args: any[]) => any>(
  operationType: StorePerformanceMetrics['operationType'],
  storeName: string
) {
  return function (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<T>) {
    const method = descriptor.value!;
    descriptor.value = function (this: any, ...args: any[]) {
      return performanceMonitor.measure(
        operationType,
        storeName,
        () => method.apply(this, args),
        {
          listenerCount: this.getListenerCount?.(),
        }
      );
    } as T;
  };
}
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__contextActionPerformance = performanceMonitor;
}
```

### stores/utils/provider-composition.ts

```typescript
import React from 'react';
export type ProviderComponent = React.ComponentType<{ children: React.ReactNode }>;
export function composeProviders(
  ...providers: ProviderComponent[]
): ProviderComponent {
  return ({ children }: { children: React.ReactNode }) => {
    return providers.reduceRight(
      (children, Provider) => React.createElement(Provider, null, children),
      children
    );
  };
}
```

### stores/utils/registry-sync.ts

```typescript
import { useStoreSelector } from './store-selector';
import type { IStoreRegistry, IStore } from '../core/types';
export function createRegistrySync<T = any>() {
  return {
    useDynamicStore(
      registry: IStoreRegistry | undefined | null,
      storeName: string
    ): T | undefined {
      const store = registry?.getStore(storeName);
      return useStoreSelector(store, {
        selector: (snapshot: any) => snapshot.value as T
      });
    }
  };
}
export class RegistryUtils {
  static getTypedStore<T>(
    registry: IStoreRegistry | undefined | null,
    name: string
  ): IStore<T> | undefined {
    return registry?.getStore(name) as IStore<T> | undefined;
  }
  static hasStore(
    registry: IStoreRegistry | undefined | null,
    name: string
  ): boolean {
    return registry?.hasStore(name) ?? false;
  }
}
```

### stores/utils/store-selector.ts

```typescript
import { useSyncExternalStore } from 'react';
import type { IStore, Snapshot, StoreSyncConfig } from '../core/types';
const CONSTANTS = {
  EMPTY_SUBSCRIBE: () => () => {},
  EMPTY_SNAPSHOT: <T>(): Snapshot<T> => ({
    value: undefined as T,
    name: 'empty',
    lastUpdate: 0
  })
} as const;
export function useStoreSelector<T, R = Snapshot<T>>(
  store: IStore<T> | undefined | null,
  config?: StoreSyncConfig<T, R>
): R {
  const { defaultValue, selector } = config ?? {};
  const getSnapshot = store?.getSnapshot ?? (() => ({
    ...CONSTANTS.EMPTY_SNAPSHOT<T>(),
    ...(defaultValue !== undefined && { value: defaultValue })
  }));
  const selectedGetSnapshot = selector
    ? () => selector(getSnapshot())
    : getSnapshot;
  return useSyncExternalStore(
    store?.subscribe ?? CONSTANTS.EMPTY_SUBSCRIBE,
    selectedGetSnapshot as () => R
  );
}
export function useStore<T>(store: IStore<T> | undefined | null): Snapshot<T> {
  return useStoreSelector(store);
}
export function createTypedStoreHooks<T>() {
  return {
    useStoreValue(store: IStore<T> | undefined | null): T | undefined {
      return useStoreSelector(store, {
        selector: (snapshot: any) => snapshot.value
      });
    },
    useStoreSnapshot(store: IStore<T> | undefined | null): Snapshot<T> {
      return useStoreSelector(store);
    }
  };
}
```

### stores/utils/subscription-manager.ts

```typescript
import type { Store } from '../core/Store';
import { ErrorHandlers } from './error-handling';
export interface SubscriptionEntry {
  unsubscribe: () => void;
  storeName: string;
  createdAt: number;
  isActive: boolean;
}
export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  averageAge: number;
  oldestSubscription: number;
  subscriptionsByStore: Record<string, number>;
}
export class SubscriptionManager {
  private subscriptions = new Map<string, SubscriptionEntry>();
  private subscriptionCounter = 0;
  private isDisposed = false;
  add(unsubscribe: () => void, storeName: string = 'unknown'): string {
    if (this.isDisposed) {
      throw new Error('SubscriptionManager has been disposed');
    }
    const subscriptionId = `sub_${++this.subscriptionCounter}_${Date.now()}`;
    const entry: SubscriptionEntry = {
      unsubscribe,
      storeName,
      createdAt: Date.now(),
      isActive: true
    };
    this.subscriptions.set(subscriptionId, entry);
    return subscriptionId;
  }
  addStoreSubscription<T>(store: Store<T>, listener: () => void): string {
    try {
      const unsubscribe = store.subscribe(listener);
      return this.add(unsubscribe, store.name);
    } catch (error) {
      ErrorHandlers.store(
        'Failed to create store subscription',
        { storeName: store.name },
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }
  remove(subscriptionId: string): boolean {
    const entry = this.subscriptions.get(subscriptionId);
    if (!entry) {
      return false;
    }
    if (entry.isActive) {
      try {
        entry.unsubscribe();
        entry.isActive = false;
      } catch (error) {
        ErrorHandlers.store(
          'Error during subscription cleanup',
          { 
            subscriptionId,
            storeName: entry.storeName 
          },
          error instanceof Error ? error : undefined
        );
      }
    }
    this.subscriptions.delete(subscriptionId);
    return true;
  }
  removeByStore(storeName: string): number {
    let removed = 0;
    for (const [id, entry] of this.subscriptions.entries()) {
      if (entry.storeName === storeName) {
        if (this.remove(id)) {
          removed++;
        }
      }
    }
    return removed;
  }
  removeOlderThan(maxAge: number): number {
    const cutoffTime = Date.now() - maxAge;
    let removed = 0;
    for (const [id, entry] of this.subscriptions.entries()) {
      if (entry.createdAt < cutoffTime) {
        if (this.remove(id)) {
          removed++;
        }
      }
    }
    return removed;
  }
  cleanupAll(): void {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    subscriptionIds.forEach(id => {
      this.remove(id);
    });
  }
  getStats(): SubscriptionStats {
    const now = Date.now();
    const activeSubscriptions = Array.from(this.subscriptions.values()).filter(s => s.isActive);
    const subscriptionsByStore: Record<string, number> = {};
    let totalAge = 0;
    let oldestTime = now;
    activeSubscriptions.forEach(entry => {
      subscriptionsByStore[entry.storeName] = (subscriptionsByStore[entry.storeName] || 0) + 1;
      const age = now - entry.createdAt;
      totalAge += age;
      oldestTime = Math.min(oldestTime, entry.createdAt);
    });
    return {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: activeSubscriptions.length,
      averageAge: activeSubscriptions.length > 0 ? totalAge / activeSubscriptions.length : 0,
      oldestSubscription: activeSubscriptions.length > 0 ? now - oldestTime : 0,
      subscriptionsByStore
    };
  }
  checkForLeaks(): string[] {
    const warnings: string[] = [];
    const stats = this.getStats();
    if (stats.activeSubscriptions > 50) {
      warnings.push(`High subscription count: ${stats.activeSubscriptions}`);
    }
    if (stats.oldestSubscription > 5 * 60 * 1000) { 
      warnings.push(`Old subscriptions detected: oldest is ${Math.round(stats.oldestSubscription / 1000)}s old`);
    }
    for (const [storeName, count] of Object.entries(stats.subscriptionsByStore)) {
      if (count > 10) {
        warnings.push(`Store "${storeName}" has ${count} subscriptions`);
      }
    }
    return warnings;
  }
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.cleanupAll();
    this.subscriptions.clear();
    this.isDisposed = true;
  }
  isManagerDisposed(): boolean {
    return this.isDisposed;
  }
}
export function useSubscriptionManager(): SubscriptionManager {
  const { useRef, useEffect } = require('react');
  const managerRef = useRef(null as SubscriptionManager | null);
  if (!managerRef.current) {
    managerRef.current = new SubscriptionManager();
  }
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, []);
  return managerRef.current;
}
class GlobalSubscriptionTracker {
  private managers = new Set<SubscriptionManager>();
  register(manager: SubscriptionManager): void {
    this.managers.add(manager);
  }
  unregister(manager: SubscriptionManager): void {
    this.managers.delete(manager);
  }
  getGlobalStats(): {
    totalManagers: number;
    totalSubscriptions: number;
    warnings: string[];
  } {
    let totalSubscriptions = 0;
    const allWarnings: string[] = [];
    for (const manager of this.managers) {
      if (!manager.isManagerDisposed()) {
        const stats = manager.getStats();
        totalSubscriptions += stats.activeSubscriptions;
        const warnings = manager.checkForLeaks();
        allWarnings.push(...warnings);
      }
    }
    return {
      totalManagers: this.managers.size,
      totalSubscriptions,
      warnings: allWarnings
    };
  }
  dispose(): void {
    for (const manager of this.managers) {
      manager.dispose();
    }
    this.managers.clear();
  }
}
export const globalSubscriptionTracker = new GlobalSubscriptionTracker();
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__contextActionSubscriptions = globalSubscriptionTracker;
}
```

### stores/utils/sync-external-store-utils.ts

```typescript
import { useSyncExternalStore, useCallback, useMemo, useRef } from 'react';
import type { Store } from '../core/Store';
export interface EnhancedSubscriptionOptions {
  debounce?: number;
  throttle?: number;
  condition?: () => boolean;
  debug?: boolean;
  name?: string;
}
export function createEnhancedSubscriber<T>(
  store: Store<T>,
  options: EnhancedSubscriptionOptions = {}
) {
  const { debounce, throttle, condition, debug, name = 'unknown' } = options;
  return (callback: () => void) => {
    if (!store) return () => {};
    let debounceTimer: NodeJS.Timeout | null = null;
    let throttleTimer: NodeJS.Timeout | null = null;
    let lastThrottleTime = 0;
    const enhancedCallback = () => {
      if (condition && !condition()) {
        if (debug) {
          console.debug(`[${name}] Subscription suspended due to condition`);
        }
        return;
      }
      const now = performance.now();
      if (throttle && throttle > 0) {
        if (now - lastThrottleTime < throttle) {
          if (throttleTimer) clearTimeout(throttleTimer);
          throttleTimer = setTimeout(() => {
            lastThrottleTime = performance.now();
            callback();
          }, throttle - (now - lastThrottleTime));
          return;
        }
        lastThrottleTime = now;
      }
      if (debounce && debounce > 0) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          callback();
          if (debug) {
            console.debug(`[${name}] Debounced callback executed after ${debounce}ms`);
          }
        }, debounce);
        return;
      }
      callback();
    };
    const unsubscribe = store.subscribe(enhancedCallback);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (throttleTimer) clearTimeout(throttleTimer);
      unsubscribe();
    };
  };
}
export function createSnapshotSelector<T, R>(
  selector?: (value: T) => R
) {
  return (store: Store<T> | undefined | null): R | T | undefined => {
    if (!store) return undefined;
    const snapshot = store.getSnapshot();
    return selector ? selector(snapshot.value) : snapshot.value;
  };
}
export function useSafeStoreSubscription<T, R = T>(
  store: Store<T> | undefined | null,
  selector?: (value: T) => R,
  options: EnhancedSubscriptionOptions & {
    equalityFn?: (a: R, b: R) => boolean;
    initialValue?: R;
  } = {}
): R | T | undefined {
  const { initialValue, equalityFn, ...subscriptionOptions } = options;
  const subscribe = useCallback((callback: () => void) => {
    if (!store) return () => {};
    if (subscriptionOptions.debounce || subscriptionOptions.throttle || subscriptionOptions.condition) {
      return createEnhancedSubscriber(store, subscriptionOptions)(callback);
    }
    return store.subscribe(callback);
  }, [store, subscriptionOptions]);
  const getSnapshot = useCallback((): R | T | undefined => {
    if (!store) return initialValue;
    const snapshot = store.getSnapshot();
    const value = selector ? selector(snapshot.value) : snapshot.value;
    return value as R | T;
  }, [store, selector, initialValue]);
  const cachedSnapshotRef = useRef<R | T | undefined>();
  const stableGetSnapshot = useCallback((): R | T | undefined => {
    const currentSnapshot = getSnapshot();
    if (equalityFn && cachedSnapshotRef.current !== undefined) {
      if (equalityFn(cachedSnapshotRef.current as R, currentSnapshot as R)) {
        return cachedSnapshotRef.current;
      }
    }
    cachedSnapshotRef.current = currentSnapshot;
    return currentSnapshot;
  }, [getSnapshot, equalityFn]);
  const getServerSnapshot = useCallback((): R | T | undefined => {
    return initialValue;
  }, [initialValue]);
  const currentValue = useSyncExternalStore(
    subscribe,
    equalityFn ? stableGetSnapshot : getSnapshot,
    getServerSnapshot
  );
  return currentValue;
}
export function useConditionalStoreSubscription<T>(
  store: Store<T> | undefined | null,
  condition: boolean,
  initialValue?: T
): T | undefined {
  const subscribe = useCallback((callback: () => void) => {
    if (!store || !condition) return () => {};
    return store.subscribe(callback);
  }, [store, condition]);
  const getSnapshot = useCallback((): T | undefined => {
    if (!store || !condition) return initialValue;
    return store.getSnapshot().value;
  }, [store, condition, initialValue]);
  const getServerSnapshot = useCallback((): T | undefined => {
    return initialValue;
  }, [initialValue]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
export function useMultiStoreSubscription<T extends readonly Store<any>[], R>(
  stores: T,
  selector: (values: { [K in keyof T]: T[K] extends Store<infer U> ? U : never }) => R,
  equalityFn?: (a: R, b: R) => boolean
): R {
  const subscribe = useCallback((callback: () => void) => {
    const unsubscribes = stores.map(store => store.subscribe(callback));
    return () => unsubscribes.forEach(unsub => unsub());
  }, [stores]);
  const getSnapshot = useCallback((): R => {
    const values = stores.map(store => store.getSnapshot().value) as any;
    return selector(values);
  }, [stores, selector]);
  const previousValueRef = useRef<R>();
  const currentValue = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return useMemo(() => {
    if (equalityFn && previousValueRef.current !== undefined) {
      if (equalityFn(previousValueRef.current, currentValue)) {
        return previousValueRef.current;
      }
    }
    previousValueRef.current = currentValue;
    return currentValue;
  }, [currentValue, equalityFn]);
}
export const equalityFunctions = {
  reference: <T>(a: T, b: T): boolean => Object.is(a, b),
  shallow: <T>(a: T, b: T): boolean => {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
    }
    const keysA = Object.keys(a) as Array<keyof T>;
    const keysB = Object.keys(b) as Array<keyof T>;
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key) || !Object.is(a[key], b[key])) {
        return false;
      }
    }
    return true;
  },
  deep: <T>(a: T, b: T): boolean => {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
    }
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keysA = Object.keys(a) as Array<keyof T>;
    const keysB = Object.keys(b) as Array<keyof T>;
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!equalityFunctions.deep(a[key], b[key])) return false;
    }
    return true;
  },
  smart: <T>(a: T, b: T): boolean => {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => {
        const bItem = b[index];
        if (typeof item === 'object' && item !== null && typeof bItem === 'object' && bItem !== null) {
          return equalityFunctions.shallow(item, bItem);
        }
        return Object.is(item, bItem);
      });
    }
    return equalityFunctions.shallow(a, b);
  }
};
```

### stores/utils/type-guards.ts

```typescript
export interface RefState {
  target: unknown;
  isReady: boolean;
  isMounted: boolean;
  mountPromise: Promise<unknown> | null;
}
export function isRefState(value: unknown): value is RefState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'target' in value &&
    'isReady' in value &&
    'isMounted' in value &&
    'mountPromise' in value &&
    typeof (value as any).isReady === 'boolean' &&
    typeof (value as any).isMounted === 'boolean'
  );
}
export function isDOMEvent(value: unknown): value is Event {
  return value instanceof Event;
}
export function isEventLike(value: unknown): value is { preventDefault: () => void } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).preventDefault === 'function'
  );
}
export function hasTargetProperty(value: unknown): value is { target: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'target' in value
  );
}
export function isDOMElement(value: unknown): value is Element {
  return value instanceof Element;
}
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).then === 'function' &&
    typeof (value as any).catch === 'function'
  );
}
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
export function isSuspiciousEventObject(value: unknown, checkNested = true): boolean {
  if (!isObject(value) || isRefState(value)) {
    return false;
  }
  if (isEventLikeObject(value)) {
    return true;
  }
  if (checkNested) {
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const nestedValue = value[key];
        if (isEventLikeObject(nestedValue)) {
          return true;
        }
      }
    }
  }
  return false;
}
function isEventLikeObject(value: unknown): boolean {
  if (!isObject(value)) {
    return false;
  }
  const hasEventTarget = hasTargetProperty(value);
  const hasPreventDefault = isEventLike(value);
  const isEvent = isDOMEvent(value);
  const hasEventType = 'type' in value && typeof (value as any).type === 'string';
  const hasEventProperties = hasEventType && (hasEventTarget || hasPreventDefault);
  const hasReactMarkers = ('nativeEvent' in value) || ('persist' in value) || ('$$typeof' in value) || ('_reactInternalFiber' in value) || ('_owner' in value);
  const constructorName = value?.constructor?.name;
  const hasEventConstructor = constructorName ? (
    constructorName.includes('Event') || 
    constructorName === 'SyntheticEvent' ||
    constructorName.includes('MouseEvent') ||
    constructorName.includes('KeyboardEvent') ||
    constructorName.includes('TouchEvent') ||
    constructorName.includes('FocusEvent') ||
    constructorName.includes('SubmitEvent')
  ) : false;
  return isEvent || hasEventProperties || hasReactMarkers || hasEventConstructor;
}
export function findProblematicProperties(value: unknown): string[] {
  if (!isObject(value)) {
    return [];
  }
  const problematicKeys: string[] = [];
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const prop = value[key];
      if (isDOMElement(prop) || isDOMEvent(prop) || (isObject(prop) && hasTargetProperty(prop))) {
        problematicKeys.push(key);
      }
    }
  }
  return problematicKeys;
}
export const TypeGuards = {
  isRefState,
  isDOMEvent,
  isEventLike,
  hasTargetProperty,
  isDOMElement,
  isPromise,
  isFunction,
  isObject,
  isArray,
  isSuspiciousEventObject,
  findProblematicProperties
} as const;
```

### stores/utils/type-helpers.ts

```typescript
import type { Store } from '../core/Store';
export type StoreValue<S> = S extends Store<infer T> ? T : never;
export type StoresValues<S extends readonly Store<any>[]> = {
  [K in keyof S]: StoreValue<S[K]>
};
export type StoreRecordValues<S extends Record<string, Store<any>>> = {
  [K in keyof S]: StoreValue<S[K]>
};
export type StoreSelector<T, R> = (value: T) => R;
export type EqualityFunction<T> = (a: T, b: T) => boolean;
export type StoreListener = () => void;
export type StoreUpdater<T> = (current: T) => T;
export function isStore<T = any>(value: any): value is Store<T> {
  return (
    value != null &&
    typeof value === 'object' &&
    'subscribe' in value &&
    'getSnapshot' in value &&
    'setValue' in value &&
    'getValue' in value &&
    'name' in value &&
    typeof value.subscribe === 'function' &&
    typeof value.getSnapshot === 'function' &&
    typeof value.setValue === 'function' &&
    typeof value.getValue === 'function' &&
    typeof value.name === 'string'
  );
}
export function isValidStoreValue<T>(value: unknown): value is T {
  return value !== undefined;
}
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? DeepReadonlyArray<U>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};
interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}
export interface StoreInitConfig<T> {
  name: string;
  initialValue: T;
  validateValue?: (value: unknown) => value is T;
  transformValue?: (value: unknown) => T;
}
export function createStoreConfig<T>(config: StoreInitConfig<T>): StoreInitConfig<T> {
  return {
    ...config,
    validateValue: config.validateValue || isValidStoreValue,
  };
}
export function extractStoreValue<T>(store: Store<T> | undefined | null): T | undefined {
  if (!store || !isStore(store)) {
    return undefined;
  }
  try {
    return store.getValue();
  } catch {
    return undefined;
  }
}
export function extractStoreValues<S extends Record<string, Store<any>>>(
  stores: S
): Partial<StoreRecordValues<S>> {
  const result = {} as Partial<StoreRecordValues<S>>;
  for (const [key, store] of Object.entries(stores)) {
    const value = extractStoreValue(store);
    if (value !== undefined) {
      (result as any)[key] = value;
    }
  }
  return result;
}
export function createSafeEqualityFn<T>(
  customFn?: EqualityFunction<T>
): EqualityFunction<T> {
  return (a: T, b: T) => {
    try {
      return customFn ? customFn(a, b) : Object.is(a, b);
    } catch {
      return Object.is(a, b);
    }
  };
}
export const TypeUtils = {
  validateStoreConfig<T>(config: any): config is StoreInitConfig<T> {
    return (
      config != null &&
      typeof config === 'object' &&
      typeof config.name === 'string' &&
      config.name.length > 0 &&
      'initialValue' in config
    );
  },
  validateStore<T>(store: any): store is Store<T> {
    return isStore(store);
  },
  getSafeValue<T>(value: unknown, fallback: T): T {
    return value !== undefined && value !== null ? value as T : fallback;
  }
} as const;
```

### stores/utils/utils.ts

```typescript
import type { IStore, IStoreRegistry } from "../core/types";
import { Store } from "../core/Store";
export function createStore<T>(initialValue: T, name?: string): Store<T> {
  const storeName = name || `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return new Store(storeName, initialValue);
}
export class StoreUtils {
	static copyStore(sourceStore: IStore, targetStore: IStore): void {
		const { value } = sourceStore.getSnapshot();
		targetStore.setValue(value);
	}
	static syncRegistries(
		sourceRegistry: IStoreRegistry,
		targetRegistry: IStoreRegistry,
		options?: {
			filter?: (name: string, store: IStore) => boolean;
			createMissing?: boolean;
		},
	): void {
		const sourceStores = sourceRegistry.getAllStores();
		sourceStores.forEach((store, name) => {
			if (options?.filter && !options.filter(name, store)) {
				return;
			}
			const targetStore = targetRegistry.getStore(name);
			if (targetStore) {
				this.copyStore(store, targetStore);
			} else if (options?.createMissing) {
				const clonedStore = this.cloneStore(store);
				targetRegistry.register(name, clonedStore);
			}
		});
	}
	static cloneStore<T = any>(store: IStore<T>): Store<T> {
		const { value, name } = store.getSnapshot();
		return new Store(name, value);
	}
	static createAutoSync(
		sourceStore: IStore,
		targetStore: IStore,
		options?: {
			immediate?: boolean;
			transform?: (value: any) => any;
		},
	): () => void {
		if (options?.immediate) {
			const { value } = sourceStore.getSnapshot();
			const transformedValue = options.transform
				? options.transform(value)
				: value;
			targetStore.setValue(transformedValue);
		}
		const unsubscribe = sourceStore.subscribe(() => {
			const { value } = sourceStore.getSnapshot();
			const transformedValue = options?.transform
				? options.transform(value)
				: value;
			targetStore.setValue(transformedValue);
		});
		return unsubscribe;
	}
	static createBidirectionalSync(
		storeA: IStore,
		storeB: IStore,
		options?: {
			immediate?: boolean;
			transformAtoB?: (value: any) => any;
			transformBtoA?: (value: any) => any;
		},
	): () => void {
		let syncing = false;
		const syncAtoB = () => {
			if (syncing) return;
			syncing = true;
			const { value } = storeA.getSnapshot();
			const transformedValue = options?.transformAtoB
				? options.transformAtoB(value)
				: value;
			storeB.setValue(transformedValue);
			syncing = false;
		};
		const syncBtoA = () => {
			if (syncing) return;
			syncing = true;
			const { value } = storeB.getSnapshot();
			const transformedValue = options?.transformBtoA
				? options.transformBtoA(value)
				: value;
			storeA.setValue(transformedValue);
			syncing = false;
		};
		if (options?.immediate) {
			syncAtoB();
		}
		const unsubscribeA = storeA.subscribe(syncAtoB);
		const unsubscribeB = storeB.subscribe(syncBtoA);
		return () => {
			unsubscribeA();
			unsubscribeB();
		};
	}
	static mergeRegistries(
		targetRegistry: IStoreRegistry,
		...sourceRegistries: IStoreRegistry[]
	): void {
		sourceRegistries.forEach((sourceRegistry) => {
			sourceRegistry.getAllStores().forEach((store, name) => {
				if (!targetRegistry.hasStore(name)) {
					targetRegistry.register(name, this.cloneStore(store));
				}
			});
		});
	}
	static createDebouncedStore<T>(
		name: string,
		sourceStore: IStore<T>,
		delay: number,
	): Store<T> & { cleanup: () => void } {
		const debouncedStore = new Store(name, sourceStore.getSnapshot().value);
		let timeoutId: NodeJS.Timeout | null = null;
		const unsubscribe = sourceStore.subscribe(() => {
			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				const { value } = sourceStore.getSnapshot();
				debouncedStore.setValue(value);
				timeoutId = null;
			}, delay);
		});
		return Object.assign(debouncedStore, {
			cleanup: () => {
				unsubscribe();
				if (timeoutId) {
					clearTimeout(timeoutId);
					timeoutId = null;
				}
			}
		});
	}
}
```
