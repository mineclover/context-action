# Context-Action React Package - Complete Code

Total Files: 34
Total Lines: 4037

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
export type Unsubscribe = () => void;
export type Subscribe = (listener: Listener) => Unsubscribe;
export interface Snapshot<T = any> {
  value: T;
  name: string;
  lastUpdate: number;
}
export interface IStore<T = any> {
  readonly name: string;
  subscribe: Subscribe;
  getSnapshot: () => Snapshot<T>;
  setValue: (value: T) => void;
  getValue: () => T;
  getListenerCount?: () => number;
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
}
export interface EventHandler<T = any> {
  (data: T): void;  
}
export interface IEventBus {
  on: <T = any>(event: string, handler: EventHandler<T>) => Unsubscribe;  
  emit: <T = any>(event: string, data?: T) => void;                       
  off: (event: string, handler?: EventHandler) => void;                   
  clear: () => void;                                                      
}
export interface StoreSyncConfig<T, R = Snapshot<T>> {
  defaultValue?: T;                           
  selector?: (snapshot: Snapshot<T>) => R;    
}
export interface HookOptions<T> {
  defaultValue?: T;                     
  onError?: (error: Error) => void;     
  dependencies?: React.DependencyList;  
}
export interface RegistryStoreMap {
  [key: string]: any;  
}
export interface DynamicStoreOptions<T> {
  defaultValue?: T;                              
  createIfNotExists?: boolean;                   
  onNotFound?: (storeName: string) => void;      
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
  const useAction = (): ActionRegister<T>['dispatch'] => {
    const context = useFactoryActionContext();
    const wrappedDispatch = useCallback(<K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<void> => {
      const register = context.actionRegisterRef.current;
      if (!register) {
        throw new Error(
          'ActionRegister is not initialized. ' +
          'Make sure the ActionContext Provider is properly set up.'
        );
      }
      const dispatchOptions: DispatchOptions = {
        ...options,
        autoAbort: options?.signal ? undefined : {
          enabled: true,
          allowHandlerAbort: true
        }
      };
      return register.dispatch(action, payload, dispatchOptions);
    }, []); 
    return wrappedDispatch as ActionRegister<T>['dispatch'];
  };
  const useActionHandler = <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ): void => {
    const { actionRegisterRef } = useFactoryActionContext();
    const handlerRef = useRef(handler);
    const configRef = useRef(config);
    const actionId = useId();
    handlerRef.current = handler;
    configRef.current = config;
    useEffect(() => {
      const register = actionRegisterRef.current;
      if (!register) {
        return;
      }
      const unregister = register.register(
        action,
        handlerRef.current,
        { ...configRef.current, id: actionId }
      );
      return unregister;
    }, [action, actionId]); 
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
        autoAbort: options?.signal ? undefined : {
          enabled: true,
          allowHandlerAbort: true,
          onControllerCreated: (controller) => {
            activeControllersRef.current.add(controller);
          }
        }
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
        autoAbort: options?.signal ? undefined : {
          enabled: true,
          allowHandlerAbort: true,
          onControllerCreated: (controller) => {
            activeControllersRef.current.add(controller);
          }
        }
      };
      return register.dispatchWithResult<K, R>(action, payload, dispatchOptions);
    }, []); 
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

### hooks/index.ts

```typescript
export { createActionContext, type ActionContextConfig, type ActionContextReturn } from '../actions';
export * from '../stores/hooks';
export { useStoreValue, useStoreValues } from '../stores/hooks/useStoreValue';
export { useLocalStore } from '../stores/hooks/useLocalStore';
```

### index.ts

```typescript
export * from './actions';
export * from './stores';
export * from './patterns';
export * from './hooks';
export * from './refs';
export type {
	ActionPayloadMap,
	ActionHandler,
	HandlerConfig,
	PipelineController,
	ActionRegisterConfig,
	ExecutionMode,
	UnregisterFunction
} from "@context-action/core";
export { 
	ActionRegister,
} from "@context-action/core";
```

### patterns/index.ts

```typescript
export * from '../stores/patterns';
export * from '../actions/ActionContext';
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
  RefInitConfig,
  InferRefTypes
} from './types';
interface InternalRefState<T> {
  target: T | null;
  isMounted: boolean;
  mountPromise: Promise<T> | null;
  mountResolvers: Set<(target: T) => void>;
  mountRejectors: Set<(error: Error) => void>;
  operationInProgress: boolean;
  listeners: Set<() => void>;
  mountCallbacks: Set<(target: T) => void>;
}
export interface RefContextReturn<T> {
  Provider: React.FC<{ children: ReactNode }>;
  useRefHandler: <K extends keyof T>(refName: K) => {
    setRef: (target: T[K]) => void;
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
    options?: {
      interval?: number;
      timeout?: number;
      onTick?: (elapsed: number, isMounted: boolean) => void;
      onTimeout?: (elapsed: number) => void;
      onSuccess?: (elapsed: number, target: T[K]) => void;
    }
  ) => {
    promise: Promise<T[K]>;
    cancel: () => void;
    isMounted: () => boolean;
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
            console.error('Error in mount callback:', error);
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
      throw new Error(`useRefHandler must be used within ${contextName}.Provider`);
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
    return useMemo(() => ({
      setRef: (target: T[K]) => {
        setRefTarget(refNameStr, target);
      },
      get target(): T[K] | null {
        return refState.target;
      },
      waitForMount: async (): Promise<T[K]> => {
        if (refState.target && refState.isMounted) {
          return refState.target as T[K];
        }
        if (refState.mountPromise) {
          return refState.mountPromise as Promise<T[K]>;
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
        refState.mountPromise = new Promise<T[K]>((resolve, reject) => {
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
            const cleanupResolve = (value: T[K]) => {
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
      },
      withTarget: async <Result>(
        operation: RefOperation<T[K] & RefTarget, Result>,
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
            refState.mountPromise = new Promise<any>((resolve, reject) => {
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
            const operationPromise = operation(target, options);
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
      },
      get isMounted() {
        return refState.isMounted;
      },
      get isWaitingForMount() {
        return !refState.isMounted && refState.mountPromise !== null;
      },
      onMount: (callback: (target: T[K]) => void) => {
        refState.mountCallbacks.add(callback);
        if (refState.isMounted && refState.target) {
          callback(refState.target as T[K]);
        }
        return () => {
          refState.mountCallbacks.delete(callback);
        };
      },
      executeIfMounted: <Result>(
        operation: (target: T[K] & RefTarget) => Result
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
      }
    }), [refState, setRefTarget, refNameStr, definitionsRef, optionsRef]);
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
    return useCallback(<K extends keyof T>(
      refName: K,
      options: {
        interval?: number;
        timeout?: number;
        onTick?: (elapsed: number, isMounted: boolean) => void;
        onTimeout?: (elapsed: number) => void;
        onSuccess?: (elapsed: number, target: T[K]) => void;
      } = {}
    ) => {
      const {
        interval = 100,
        timeout = 4000,
        onTick,
        onTimeout,
        onSuccess
      } = options;
      let cancelled = false;
      let startTime = performance.now();
      let intervalId: NodeJS.Timeout;
      let timeoutId: NodeJS.Timeout;
      const refNameStr = String(refName);
      const refState = getRefState(refNameStr);
      const getCurrentMountedState = () => {
        const currentRefState = getRefState(refNameStr);
        return currentRefState.isMounted && currentRefState.target !== null;
      };
      const promise = new Promise<T[K]>((resolve, reject) => {
        if (getCurrentMountedState()) {
          const elapsed = performance.now() - startTime;
          const target = refState.target as T[K];
          onSuccess?.(elapsed, target);
          resolve(target);
          return;
        }
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            cancelled = true;
            clearInterval(intervalId);
            const elapsed = performance.now() - startTime;
            onTimeout?.(elapsed);
            reject(new Error(`Ref polling timeout after ${elapsed.toFixed(0)}ms for ref '${refNameStr}'`));
          }
        }, timeout);
        intervalId = setInterval(() => {
          if (cancelled) return;
          const elapsed = performance.now() - startTime;
          const isMounted = getCurrentMountedState();
          onTick?.(elapsed, isMounted);
          if (isMounted) {
            cancelled = true;
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            const currentRefState = getRefState(refNameStr);
            const target = currentRefState.target as T[K];
            onSuccess?.(elapsed, target);
            resolve(target);
          }
        }, interval);
      });
      return {
        promise,
        cancel: () => {
          if (!cancelled) {
            cancelled = true;
            clearInterval(intervalId);
            clearTimeout(timeoutId);
          }
        },
        isMounted: getCurrentMountedState
      };
    }, [getRefState]);
  };
  return {
    Provider,
    useRefHandler,
    useWaitForRefs,
    useGetAllRefs,
    useRefPolling,
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
  config: Partial<Omit<RefInitConfig<T>, 'objectType'>> & { 
    name: string;
    cleanup?: (target: T) => void | Promise<void>;
  }
): RefInitConfig<T> {
  return {
    objectType: 'custom',
    autoCleanup: true,
    ...config
  } as RefInitConfig<T>;
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
    <StoreErrorBoundary {...errorBoundaryProps}>
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
          console.error(`Error in event handler for "${event}":`, error);
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
    this.eventHistory.push({
      event,
      data,
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
import type { IStore, Listener, Snapshot, Unsubscribe } from './types';
import { safeGet, safeSet, getGlobalImmutabilityOptions, performantSafeGet } from '../utils/immutable';
import { 
  compareValues, 
  fastCompare, 
  ComparisonOptions
} from '../utils/comparison';
import { TypeGuards } from '../utils/type-guards';
import { ErrorHandlers } from '../utils/error-handling';
export class Store<T = any> implements IStore<T> {
  private listeners = new Set<Listener>();
  protected _value: T;
  protected _snapshot: Snapshot<T>;
  private isUpdating = false;
  private updateQueue: Array<() => void> = [];
  private notificationMode: 'batched' | 'immediate' = 'batched';
  private pendingNotification = false;
  private batchedUpdates = new Set<() => void>();
  private batchTimeoutId: number | null = null;
  private readonly BATCH_DELAY_MS = 16; 
  public readonly name: string;
  private customComparator?: (oldValue: T, newValue: T) => boolean;
  private comparisonOptions?: Partial<ComparisonOptions<T>>;
  constructor(name: string, initialValue: T) {
    this.name = name;
    this._value = initialValue;
    this._snapshot = this._createSnapshot();
  }
  subscribe = (listener: Listener): Unsubscribe => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = (): Snapshot<T> => {
    return this._snapshot;
  };
  getValue(): T {
    const options = getGlobalImmutabilityOptions();
    const clonedValue = performantSafeGet(this._value, options.enableCloning);
    return clonedValue;
  }
  setValue(value: T): void {
    if (TypeGuards.isObject(value)) {
      if (!TypeGuards.isRefState(value) && TypeGuards.isSuspiciousEventObject(value)) {
        const hasEventTarget = TypeGuards.hasTargetProperty(value);
        const hasPreventDefault = TypeGuards.isEventLike(value);
        const isEvent = TypeGuards.isDOMEvent(value);
        console.error(
          '[Context-Action] ⚠️ Event object detected in Store.setValue!',
          '\nStore name:', this.name,
          '\nValue type:', typeof value,
          '\nConstructor:', value?.constructor?.name,
          '\nIs Event:', isEvent,
          '\nHas target property:', hasEventTarget,
          '\nHas preventDefault:', hasPreventDefault,
          '\nStack trace:', new Error().stack?.split('\n').slice(1, 10).join('\n')
        );
        const problematicKeys = TypeGuards.findProblematicProperties(value);
        if (problematicKeys.length > 0) {
          console.error('[Context-Action] Event object properties:', problematicKeys);
        }
      }
    }
    const options = getGlobalImmutabilityOptions();
    const safeValue = safeSet(value, options.enableCloning);
    const hasChanged = this._compareValues(this._value, safeValue);
    if (hasChanged) {
      this._value = safeValue;
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
      const options = getGlobalImmutabilityOptions();
      const safeCurrentValue = performantSafeGet(this._value, options.enableCloning);
      const updatedValue = updater(safeCurrentValue);
      if (TypeGuards.isObject(updatedValue)) {
        if (!TypeGuards.isRefState(updatedValue) && TypeGuards.isSuspiciousEventObject(updatedValue)) {
          const hasEventTarget = TypeGuards.hasTargetProperty(updatedValue);
          const hasPreventDefault = TypeGuards.isEventLike(updatedValue);
          const isEvent = TypeGuards.isDOMEvent(updatedValue);
          console.error(
            '[Context-Action] ⚠️ Event object detected in Store.update result!',
            '\nStore name:', this.name,
            '\nUpdated value type:', typeof updatedValue,
            '\nConstructor:', updatedValue?.constructor?.name,
            '\nIs Event:', isEvent,
            '\nHas target property:', hasEventTarget,
            '\nHas preventDefault:', hasPreventDefault,
            '\nStack trace:', new Error().stack?.split('\n').slice(1, 10).join('\n')
          );
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
  dispose(): void {
    this.clearListeners();
    if (this.batchTimeoutId !== null) {
      cancelAnimationFrame(this.batchTimeoutId);
      this.batchTimeoutId = null;
    }
    this.batchedUpdates.clear();
    this.updateQueue.length = 0;
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
    const options = getGlobalImmutabilityOptions();
    const clonedValue = safeGet(this._value, options.enableCloning);
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
      this._addToBatch(() => this._notifyListeners());
    }
  }
  private _addToBatch(updateFn: () => void): void {
    this.batchedUpdates.add(updateFn);
    if (this.batchTimeoutId === null) {
      this.batchTimeoutId = requestAnimationFrame(() => {
        this._flushBatchedUpdates();
      });
    }
  }
  private _flushBatchedUpdates(): void {
    this.batchTimeoutId = null;
    if (this.batchedUpdates.size > 0) {
      const updates = Array.from(this.batchedUpdates);
      this.batchedUpdates.clear();
      updates.forEach(updateFn => {
        try {
          updateFn();
        } catch (error) {
          ErrorHandlers.store(
            'Error during batched update execution',
            { 
              storeName: this.name,
              batchSize: updates.length
            },
            error instanceof Error ? error : undefined
          );
        }
      });
    }
  }
  private _notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        ErrorHandlers.store(
          'Error in store listener execution',
          { 
            storeName: this.name,
            listenerCount: this.listeners.size
          },
          error instanceof Error ? error : undefined
        );
      }
    });
  }
}
export function createStore<T>(name: string, initialValue: T): Store<T> {
  const store = new Store<T>(name, initialValue);
  return store;
}
export interface StoreConfig<T = any> {
  name: string;
  initialValue: T;
  registry?: import('./StoreRegistry').StoreRegistry;
  autoRegister?: boolean;
}
export class ManagedStore<T> extends Store<T> {
  private registry?: import('./StoreRegistry').StoreRegistry;
  private autoRegister: boolean;
  constructor(config: StoreConfig<T>) {
    super(config.name, config.initialValue);
    this.registry = config.registry;
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
  private stores = new Map<string, IStore>();
  private metadata = new WeakMap<IStore, StoreMetadata>();
  private listeners = new Set<Listener>();
  private _snapshot: Array<[string, IStore]> = [];
  public readonly name: string;
  constructor(name: string = 'default') {
    this.name = name;
  }
  subscribe = (listener: Listener): Unsubscribe => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = (): Array<[string, IStore]> => {
    return this._snapshot;
  };
  register(name: string, store: IStore, metadata?: Partial<StoreMetadata>): void {
    if (this.stores.has(name)) {
    }
    this.stores.set(name, store);
    this.metadata.set(store, {
      registeredAt: Date.now(),
      name,
      ...metadata
    });
    this._updateSnapshot();
  }
  unregister(name: string): boolean {
    const store = this.stores.get(name);
    if (store) {
      if ('destroy' in store && typeof store.destroy === 'function') {
        store.destroy();
      }
      this.stores.delete(name);
      this._updateSnapshot();
      return true;
    }
    return false;
  }
  getStore(name: string): IStore | undefined {
    const store = this.stores.get(name);
    return store;
  }
  getAllStores(): Map<string, IStore> {
    return new Map(this.stores);
  }
  hasStore(name: string): boolean {
    return this.stores.has(name);
  }
  getStoreCount(): number {
    return this.stores.size;
  }
  getStoreNames(): string[] {
    return Array.from(this.stores.keys());
  }
  getStoreMetadata(name: string): StoreMetadata | undefined {
    const store = this.stores.get(name);
    return store ? this.metadata.get(store) : undefined;
  }
  updateStoreMetadata(name: string, updates: Partial<StoreMetadata>): boolean {
    const store = this.stores.get(name);
    if (!store) return false;
    const currentMetadata = this.metadata.get(store);
    if (!currentMetadata) return false;
    this.metadata.set(store, {
      ...currentMetadata,
      ...updates
    });
    return true;
  }
  clear(): void {
    this.stores.forEach((store) => {
      if ('destroy' in store && typeof store.destroy === 'function') {
        store.destroy();
      }
    });
    this.stores.clear();
    this._updateSnapshot();
  }
  forEach(callback: (store: IStore, name: string) => void): void {
    this.stores.forEach((store, name) => {
      callback(store, name);
    });
  }
  filter(predicate: (store: IStore, name: string) => boolean): StoreRegistry {
    const filtered = new StoreRegistry(`${this.name}-filtered`);
    this.stores.forEach((store, name) => {
      if (predicate(store, name)) {
        filtered.register(name, store);
      }
    });
    return filtered;
  }
  private _updateSnapshot(): void {
    this._snapshot = Array.from(this.stores.entries());
    this._notifyListeners();
  }
  private _notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error(`Error in registry listener for "${this.name}":`, error);
      }
    });
  }
}
```

### stores/hooks/index.ts

```typescript
export { useStoreSelector as useStore } from '../utils/store-selector';
export { useStoreValue, useStoreValues, assertStoreValue } from './useStoreValue';
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
import { useEffect, useRef, useState, useMemo } from 'react';
import type { Store } from '../core/Store';
function defaultEqualityFn<T>(a: T, b: T): boolean {
  return Object.is(a, b);
}
export function shallowEqual<T>(a: T, b: T): boolean {
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
}
export function deepEqual<T>(a: T, b: T): boolean {
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
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}
export function useStoreSelector<T, R>(
  store: Store<T>,
  selector: (value: T) => R,
  equalityFn: (a: R, b: R) => boolean = defaultEqualityFn
): R {
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(equalityFn);
  const selectorWarningShownRef = useRef(false);
  const equalityWarningShownRef = useRef(false);
  if (process.env.NODE_ENV === 'development') {
    if (selectorRef.current !== selector && !selectorWarningShownRef.current) {
      console.warn(
        'useStoreSelector: selector function changed. ' +
        'Consider wrapping it with useCallback to avoid unnecessary recalculations.',
        'Store:', store.name
      );
      selectorWarningShownRef.current = true;
    }
    if (equalityFnRef.current !== equalityFn && !equalityWarningShownRef.current) {
      console.warn(
        'useStoreSelector: equalityFn changed. ' +
        'Consider using a stable reference or defining it outside the component.',
        'Store:', store.name
      );
      equalityWarningShownRef.current = true;
    }
  }
  selectorRef.current = selector;
  equalityFnRef.current = equalityFn;
  const initialSelectedValue = useMemo(() => {
    try {
      return selector(store.getValue());
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('useStoreSelector: Error in selector function:', error);
      }
      throw error;
    }
  }, [store, selector]);
  const [selectedValue, setSelectedValue] = useState<R>(initialSelectedValue);
  const selectedValueRef = useRef<R>(initialSelectedValue);
  selectedValueRef.current = selectedValue;
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const newStoreValue = store.getValue();
      try {
        const newSelectedValue = selectorRef.current(newStoreValue);
        if (!equalityFnRef.current(selectedValueRef.current, newSelectedValue)) {
          setSelectedValue(newSelectedValue);
          selectedValueRef.current = newSelectedValue;
          if (process.env.NODE_ENV === 'development') {
            console.debug('useStoreSelector: Value updated', {
              storeName: store.name,
              previousValue: selectedValueRef.current,
              newValue: newSelectedValue
            });
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('useStoreSelector: Error in selector during subscription:', error);
        }
        throw error;
      }
    });
    try {
      const currentStoreValue = store.getValue();
      const currentSelectedValue = selectorRef.current(currentStoreValue);
      if (!equalityFnRef.current(selectedValueRef.current, currentSelectedValue)) {
        setSelectedValue(currentSelectedValue);
        selectedValueRef.current = currentSelectedValue;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('useStoreSelector: Error checking current value:', error);
      }
    }
    return unsubscribe;
  }, [store]);
  return selectedValue;
}
export function useMultiStoreSelector<R>(
  stores: Store<any>[],
  selector: (values: any[]) => R,
  equalityFn?: (a: R, b: R) => boolean
): R {
  const finalEqualityFn = equalityFn || defaultEqualityFn;
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(finalEqualityFn);
  selectorRef.current = selector;
  equalityFnRef.current = finalEqualityFn;
  const initialSelectedValue = useMemo(() => {
    const storeValues = stores.map(store => store.getValue());
    return selector(storeValues);
  }, [stores, selector]);
  const [selectedValue, setSelectedValue] = useState<R>(initialSelectedValue);
  const selectedValueRef = useRef<R>(initialSelectedValue);
  selectedValueRef.current = selectedValue;
  useEffect(() => {
    const unsubscribes = stores.map((store) => 
      store.subscribe(() => {
        try {
          const storeValues = stores.map(s => s.getValue());
          const newSelectedValue = selectorRef.current(storeValues);
          if (!equalityFnRef.current(selectedValueRef.current, newSelectedValue)) {
            setSelectedValue(newSelectedValue);
            selectedValueRef.current = newSelectedValue;
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('useMultiStoreSelector: Error in selector:', error);
          }
          throw error;
        }
      })
    );
    try {
      const currentStoreValues = stores.map(store => store.getValue());
      const currentSelectedValue = selectorRef.current(currentStoreValues);
      if (!equalityFnRef.current(selectedValueRef.current, currentSelectedValue)) {
        setSelectedValue(currentSelectedValue);
        selectedValueRef.current = currentSelectedValue;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('useMultiStoreSelector: Error checking current values:', error);
      }
    }
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [stores]);
  return selectedValue;
}
export function useStorePathSelector<T>(
  store: Store<T>,
  path: (string | number)[],
  equalityFn: (a: any, b: any) => boolean = defaultEqualityFn
): any {
  const selector = useMemo(() => {
    return (value: T) => {
      let current: any = value;
      for (const key of path) {
        if (current == null) return undefined;
        current = current[key];
      }
      return current;
    };
  }, [path]);
  return useStoreSelector(store, selector, equalityFn);
}
export { defaultEqualityFn };
```

### stores/hooks/useStoreValue.ts

```typescript
import { useEffect, useRef, useState, useMemo } from 'react';
import { useStoreSelector, shallowEqual, defaultEqualityFn } from './useStoreSelector';
import type { Store } from '../core/Store';
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
    name = store?.name || 'unknown'
  } = finalOptions;
  const [isActive, setIsActive] = useState(() => store && !lazy && (!condition || condition()));
  const conditionRef = useRef(condition);
  conditionRef.current = condition;
  useEffect(() => {
    if (!condition) return;
    const checkCondition = () => {
      const shouldBeActive = condition();
      setIsActive(current => {
        if (current !== shouldBeActive) {
          if (debug) {
            console.debug(`useStoreValue [${name}]: Subscription ${shouldBeActive ? 'activated' : 'suspended'}`);
          }
          return shouldBeActive;
        }
        return current;
      });
    };
    checkCondition();
    const interval = setInterval(checkCondition, 100);
    return () => clearInterval(interval);
  }, [condition, debug, name]);
  useEffect(() => {
    if (lazy && !isActive && (!condition || condition())) {
      setIsActive(true);
    }
  }, [lazy, isActive, condition]);
  const [debouncedValue, setDebouncedValue] = useState<T | R | undefined>(initialValue);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const throttleLastExecRef = useRef<number>(0);
  const latestValueRef = useRef<T | R | undefined>(initialValue);
  const selectorFunction = useMemo(() => {
    if (selector) {
      return selector;
    }
    return (value: T) => value as unknown as R;
  }, [selector]);
  const dummyStore = useMemo(() => {
    if (store) return store;
    return { getValue: () => undefined, subscribe: () => () => {}, getSnapshot: () => ({ value: undefined }) } as any;
  }, [store]);
  const rawStoreValue = useStoreSelector(dummyStore, selectorFunction, equalityFn as (a: R, b: R) => boolean);
  const currentStoreValue = useMemo(() => {
    if (!isActive) {
      return suspendedValue !== undefined ? suspendedValue : initialValue;
    }
    return rawStoreValue;
  }, [rawStoreValue, isActive, suspendedValue, initialValue]);
  const processedValue = useMemo(() => {
    if (!isActive) {
      return suspendedValue !== undefined ? suspendedValue : initialValue;
    }
    latestValueRef.current = currentStoreValue as T | R | undefined;
    if (debounce && debounce > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedValue(latestValueRef.current);
        if (debug) {
          console.debug(`useStoreValue [${name}]: Debounced value updated after ${debounce}ms`);
        }
      }, debounce);
      return debouncedValue;
    }
    if (throttle && throttle > 0) {
      const now = Date.now();
      if (now - throttleLastExecRef.current >= throttle) {
        throttleLastExecRef.current = now;
        if (debug) {
          console.debug(`useStoreValue [${name}]: Throttled value updated`);
        }
        return currentStoreValue;
      }
      return debouncedValue; 
    }
    return currentStoreValue;
  }, [currentStoreValue, isActive, debounce, throttle, debouncedValue, suspendedValue, initialValue, debug, name]);
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  return processedValue;
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
  const dummyStoreForValues = useMemo(() => {
    if (store) return store;
    return { getValue: () => undefined as any, subscribe: () => () => {}, getSnapshot: () => ({ value: undefined }) } as any;
  }, [store]);
  const storeValue = useStoreSelector(dummyStoreForValues, selectorFunction, shallowEqual);
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
class StoreManager<T extends Record<string, any>> {
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
    this.registry.register(String(storeName), store, {
      name: String(storeName),
      tags,
      description: description || `Store: ${String(storeName)}`,
      version,
      debug
    });
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
export type CustomComparator<T = any> = (oldValue: T, newValue: T) => boolean;
export interface ComparisonOptions<T = any> {
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
  const oldKeys = Object.keys(oldValue as any).filter(key => !ignoreKeys.includes(key));
  const newKeys = Object.keys(newValue as any).filter(key => !ignoreKeys.includes(key));
  if (oldKeys.length !== newKeys.length) {
    return false;
  }
  for (const key of oldKeys) {
    if (!newKeys.includes(key)) {
      return false;
    }
    if (!Object.is((oldValue as any)[key], (newValue as any)[key])) {
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
  const visited = enableCircularCheck ? new WeakSet() : null;
  function deepCompare(a: any, b: any, depth: number): boolean {
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
    if (visited) {
      if (visited.has(a) || visited.has(b)) {
        return Object.is(a, b);
      }
      visited.add(a);
      visited.add(b);
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
        if (!deepCompare(a[i], b[i], depth + 1)) {
          return false;
        }
      }
      return true;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
      return false;
    }
    const aKeys = Object.keys(a).filter(key => !ignoreKeys.includes(key));
    const bKeys = Object.keys(b).filter(key => !ignoreKeys.includes(key));
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    for (const key of aKeys) {
      if (!bKeys.includes(key)) {
        return false;
      }
      if (!deepCompare(a[key], b[key], depth + 1)) {
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
      case 'deep':
        result = deepEquals(oldValue, newValue, { 
          maxDepth, 
          ignoreKeys, 
          enableCircularCheck 
        });
        break;
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
  const oldKeys = Object.keys(oldValue as any);
  if (oldKeys.length <= 5) { 
    const newKeys = Object.keys(newValue as any);
    if (oldKeys.length === newKeys.length) {
      return oldKeys.every(key => 
        newKeys.includes(key) && 
        Object.is((oldValue as any)[key], (newValue as any)[key])
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
  public readonly context?: Record<string, unknown>;
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
    this.context = context;
    this.timestamp = Date.now();
    if (originalError) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContextActionError);
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
}
const defaultErrorConfig: ErrorHandlingConfig = {
  logLevel: process.env.NODE_ENV === 'development' ? ErrorLogLevel.DEBUG : ErrorLogLevel.ERROR,
  throwOnError: process.env.NODE_ENV === 'development',
  enableStackTrace: true,
  maxLogEntries: 100,
  suppressRepeatedErrors: true
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
    handleError(
      errorType,
      `Async operation failed: ${error instanceof Error ? error.message : String(error)}`,
      context,
      error instanceof Error ? error : undefined
    );
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
    handleError(
      errorType,
      `Sync operation failed: ${error instanceof Error ? error.message : String(error)}`,
      context,
      error instanceof Error ? error : undefined
    );
    return null;
  }
}
export const ErrorHandlers = {
  store: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.STORE_ERROR, message, context, originalError),
  action: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.ACTION_ERROR, message, context, originalError),
  ref: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.REF_ERROR, message, context, originalError),
  validation: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.VALIDATION_ERROR, message, context, originalError),
  initialization: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.INITIALIZATION_ERROR, message, context, originalError),
  timeout: (message: string, context?: Record<string, unknown>, originalError?: Error) =>
    handleError(ContextActionErrorType.TIMEOUT_ERROR, message, context, originalError),
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
const logger = {
  warn: (message: string, ...args: any[]) => console.warn(`[Context-Action] ${message}`, ...args),
  trace: (message: string, ...args: any[]) => console.debug(`[Context-Action] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[Context-Action] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[Context-Action] ${message}`, ...args)
};
function hasUnclonableContent(value: unknown, depth: number = 3): boolean {
  if (depth <= 0) return false;
  if (Array.isArray(value)) {
    return value.some(item => isUnclonable(item) || hasUnclonableContent(item, depth - 1));
  }
  if (value && typeof value === 'object') {
    if (isUnclonable(value)) return true;
    try {
      const keys = Object.keys(value).slice(0, 10);
      return keys.some(key => {
        const prop = (value as Record<string, unknown>)[key];
        return isUnclonable(prop) || hasUnclonableContent(prop, depth - 1);
      });
    } catch {
      return true;
    }
  }
  return false;
}
function isDOMElement(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return (
    (typeof Element !== 'undefined' && value instanceof Element) ||
    (typeof Node !== 'undefined' && value instanceof Node) ||
    (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) ||
    (typeof (value as Record<string, unknown>).nodeType === 'number' && ((value as Record<string, unknown>).nodeType as number) > 0) ||
    (typeof (value as Record<string, unknown>).nodeName === 'string') ||
    (typeof (value as Record<string, unknown>).tagName === 'string') ||
    (value as Record<string, unknown>)._owner !== undefined ||  
    (value as Record<string, unknown>).stateNode !== undefined  
  );
}
function isUnclonable(value: unknown): boolean {
  if (typeof value === 'function') return true;
  if (value instanceof Promise) return true;
  if (value instanceof WeakMap) return true;
  if (value instanceof WeakSet) return true;
  if (typeof Event !== 'undefined' && value instanceof Event) return true;
  if (isDOMElement(value)) return true;
  return false;
}
export function deepClone<T>(value: T): T {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return value;
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T;
  }
  if (typeof value === 'function') {
    logger.warn('Functions cannot be deep cloned, returning original reference');
    return value;
  }
  if (typeof value === 'symbol') {
    logger.warn('Symbols cannot be deep cloned, returning original reference');
    return value;
  }
  if (value instanceof Promise) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Promise objects cannot be deep cloned, returning original reference');
    }
    return value;
  }
  if (value instanceof Error) {
    const ErrorClass = value.constructor as new (message: string) => Error;
    const clonedError = new ErrorClass(value.message) as T;
    if ('stack' in value && typeof value.stack === 'string') {
      (clonedError as any).stack = value.stack;
    }
    if ('cause' in value) {
      (clonedError as any).cause = value.cause;
    }
    return clonedError;
  }
  if (value instanceof Map) {
    const clonedMap = new Map();
    for (const [key, val] of value) {
      clonedMap.set(deepClone(key), deepClone(val));
    }
    return clonedMap as T;
  }
  if (value instanceof Set) {
    const clonedSet = new Set();
    for (const val of value) {
      clonedSet.add(deepClone(val));
    }
    return clonedSet as T;
  }
  if (value instanceof WeakMap || value instanceof WeakSet) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('WeakMap/WeakSet objects cannot be deep cloned, returning original reference');
    }
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    if (isDOMElement(value)) {
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
        logger.trace('HTML/DOM element detected, returning original reference to avoid circular references', {
          type: typeof value,
          constructor: value?.constructor?.name,
          nodeType: (value as Record<string, unknown>)?.nodeType,
          tagName: (value as Record<string, unknown>)?.tagName,
          nodeName: (value as Record<string, unknown>)?.nodeName
        });
      }
      return value;
    }
    if (hasUnclonableContent(value)) {
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) {
        console.warn('[Context-Action] Object contains unclonable content (Promise, DOM, Function), returning original reference');
      }
      return value;
    }
  }
  try {
    const cloned = structuredClone(value);
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.001) {
      logger.trace('Deep clone successful', { 
        type: typeof value,
        isArray: Array.isArray(value),
        constructor: value?.constructor?.name 
      });
    }
    return cloned;
  } catch (error) {
    const errorMessage = error?.toString() || '';
    if (
      errorMessage.includes('circular') ||
      errorMessage.includes('HTMLDivElement') ||
      errorMessage.includes('HTMLElement') ||
      errorMessage.includes('could not be cloned') ||
      errorMessage.includes('Promise') ||
      errorMessage.includes('DataCloneError')
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          '[Context-Action] Unclonable object detected, returning original reference',
          {
            type: typeof value,
            constructor: value?.constructor?.name,
            isPromise: value instanceof Promise,
            errorType: errorMessage.includes('Promise') ? 'Promise' : 
                      errorMessage.includes('DataCloneError') ? 'DataCloneError' : 'Other'
          }
        );
      }
      return value;
    }
    logger.warn('structuredClone failed, falling back to circular-safe JSON clone', error);
    try {
      const visited = new WeakSet();
      const circularSafeStringify = (obj: any, space?: string | number): string => {
        return JSON.stringify(obj, function(key, val) {
          if (val !== null && typeof val === 'object') {
            if (visited.has(val)) {
              return '[Circular]';
            }
            visited.add(val);
          }
          return val;
        }, space);
      };
      const jsonString = circularSafeStringify(value);
      const jsonCloned = JSON.parse(jsonString);
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Used circular-safe JSON fallback for deep clone - some data types may be lost');
      }
      return jsonCloned;
    } catch (jsonError) {
      logger.warn('JSON fallback failed, trying manual clone', jsonError);
      try {
        const manualCloned = manualDeepClone(value, new WeakMap());
        return manualCloned;
      } catch (manualError) {
        logger.error('All cloning methods failed, returning original reference', manualError);
        return value;
      }
    }
  }
}
function manualDeepClone<T>(value: T, visited: WeakMap<object, any>): T {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol'
  ) {
    return value;
  }
  if (typeof value === 'function') {
    return value;
  }
  if (value instanceof Promise || value instanceof WeakMap || value instanceof WeakSet) {
    return value;
  }
  if (isDOMElement(value)) {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    if (visited.has(value)) {
      return visited.get(value);
    }
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T;
  }
  if (value instanceof Error) {
    const ErrorClass = value.constructor as new (message: string) => Error;
    const clonedError = new ErrorClass(value.message) as T;
    if ('stack' in value && typeof value.stack === 'string') {
      (clonedError as any).stack = value.stack;
    }
    return clonedError;
  }
  if (Array.isArray(value)) {
    const clonedArray: any[] = [];
    visited.set(value, clonedArray);
    for (let i = 0; i < value.length; i++) {
      try {
        clonedArray[i] = manualDeepClone(value[i], visited);
      } catch {
        clonedArray[i] = value[i];
      }
    }
    return clonedArray as T;
  }
  if (value instanceof Map) {
    const clonedMap = new Map();
    visited.set(value, clonedMap);
    for (const [key, val] of value) {
      try {
        clonedMap.set(
          manualDeepClone(key, visited),
          manualDeepClone(val, visited)
        );
      } catch {
        clonedMap.set(key, val);
      }
    }
    return clonedMap as T;
  }
  if (value instanceof Set) {
    const clonedSet = new Set();
    visited.set(value, clonedSet);
    for (const val of value) {
      try {
        clonedSet.add(manualDeepClone(val, visited));
      } catch {
        clonedSet.add(val);
      }
    }
    return clonedSet as T;
  }
  if (typeof value === 'object' && value !== null) {
    const clonedObj: any = {};
    visited.set(value, clonedObj);
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        try {
          clonedObj[key] = manualDeepClone((value as any)[key], visited);
        } catch {
          clonedObj[key] = (value as any)[key];
        }
      }
    }
    return clonedObj as T;
  }
  return value;
}
export function verifyImmutability<T>(original: T, cloned: T): boolean {
  if (
    original === null ||
    original === undefined ||
    typeof original === 'string' ||
    typeof original === 'number' ||
    typeof original === 'boolean' ||
    typeof original === 'bigint'
  ) {
    return original === cloned;
  }
  if (typeof original === 'object' && original !== null) {
    if (isDOMElement(original)) {
      return original === cloned;
    }
    if (typeof original === 'function') {
      return original === cloned;
    }
    if (original instanceof Promise || 
        (typeof (original as Record<string, unknown>).then === 'function' && typeof (original as Record<string, unknown>).catch === 'function')) {
      return original === cloned;
    }
  }
  if (typeof original === 'object' && original !== null) {
    return original !== cloned; 
  }
  return false;
}
export function safeGet<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) {
    logger.trace('Cloning disabled, returning original reference');
    return value;
  }
  const cloned = deepClone(value);
  if (process.env.NODE_ENV === 'development') {
    const isNonCloneableObject = (obj: unknown): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      if (isDOMElement(obj)) return true;
      if (typeof obj === 'function') {
        return true;
      }
      if (obj instanceof Promise) return true;
      const objRecord = obj as Record<string, unknown>;
      if (typeof objRecord.then === 'function' && typeof objRecord.catch === 'function') {
        return true;
      }
      return false;
    };
    const shouldSkipVerification = isNonCloneableObject(value);
    if (shouldSkipVerification && Math.random() < 0.1) {
      logger.trace('Skipping immutability verification for special object', {
        type: typeof value,
        constructor: value?.constructor?.name,
        nodeType: (value as Record<string, unknown>)?.nodeType,
        tagName: (value as Record<string, unknown>)?.tagName,
        nodeName: (value as Record<string, unknown>)?.nodeName,
        isElement: value instanceof Element,
        isNode: value instanceof Node,
        isHTMLElement: value instanceof HTMLElement
      });
    }
    if (!shouldSkipVerification) {
      const isImmutable = verifyImmutability(value, cloned);
      if (!isImmutable && typeof value === 'object' && value !== null) {
        logger.warn('Immutability verification failed - references are identical', {
          type: typeof value,
          constructor: value?.constructor?.name,
          isElement: value instanceof Element,
          isNode: value instanceof Node,
          nodeType: (value as Record<string, unknown>)?.nodeType,
          sameReference: value === cloned
        });
      }
    }
  }
  return cloned;
}
export function safeSet<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) {
    logger.trace('Cloning disabled for setter, returning original reference');
    return value;
  }
  return deepClone(value);
}
export interface ImmutabilityOptions {
  enableCloning?: boolean;      
  enableVerification?: boolean; 
  warnOnFallback?: boolean;     
  shallowCloneThreshold?: number; 
}
let globalImmutabilityOptions: ImmutabilityOptions = {
  enableCloning: true,
  enableVerification: process.env.NODE_ENV === 'development',
  warnOnFallback: true,
  shallowCloneThreshold: 3
};
export function setGlobalImmutabilityOptions(options: Partial<ImmutabilityOptions>): void {
  globalImmutabilityOptions = { ...globalImmutabilityOptions, ...options };
  logger.debug('Global immutability options updated', globalImmutabilityOptions);
}
export function getGlobalImmutabilityOptions(): ImmutabilityOptions {
  return { ...globalImmutabilityOptions };
}
function optimizedClone<T>(value: T): T {
  return deepClone(value);
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
export function performantSafeGet<T>(value: T, enableCloning: boolean = true): T {
  if (!enableCloning) {
    return value;
  }
  const startTime = performance.now();
  const result = optimizedClone(value);
  const endTime = performance.now();
  const duration = endTime - startTime;
  performanceData.times.push(duration);
  performanceData.operations++;
  if (performanceData.times.length > 100) {
    performanceData.times.shift();
  }
  return result;
}
export function getPerformanceProfile(): PerformanceProfile {
  const { times, operations } = performanceData;
  const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const recommendations: string[] = [];
  if (averageTime > 5) {
    recommendations.push('복사 시간이 5ms를 초과합니다. 얕은 복사 임계값 조정을 고려하세요.');
  }
  if (operations > 100) {
    recommendations.push('많은 복사 작업이 감지되었습니다. 복사 빈도를 줄일 수 있는지 검토하세요.');
  }
  return {
    averageCloneTime: averageTime,
    totalOperations: operations,
    recommendations
  };
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
export function isSuspiciousEventObject(value: unknown): boolean {
  if (!isObject(value) || isRefState(value)) {
    return false;
  }
  const hasEventTarget = hasTargetProperty(value);
  const hasPreventDefault = isEventLike(value);
  const isEvent = isDOMEvent(value);
  return hasEventTarget || hasPreventDefault || isEvent;
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
	): Store<T> {
		const debouncedStore = new Store(name, sourceStore.getSnapshot().value);
		let timeoutId: any;
		sourceStore.subscribe(() => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				const { value } = sourceStore.getSnapshot();
				debouncedStore.setValue(value);
			}, delay);
		});
		return debouncedStore;
	}
}
```
