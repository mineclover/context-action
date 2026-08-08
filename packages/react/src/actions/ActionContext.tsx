import {
  ActionHandler,
  ActionEffectHandler,
  ActionGuardHandler,
  ActionObserverHandler,
  ObserverConfig,
  ActionNames,
  ActionPayloadMap,
  ActionRegister,
  ActionRegisterConfig,
  ActionResult,
  ActionResultHandler,
  ActionResultMap,
  DispatchArgs,
  DispatchOptions,
  ExecutionResult,
  HandlerConfig,
  EffectConfig,
  GuardConfig,
} from '@context-action/core';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useId, useMemo, useRef } from 'react';
import type {
  ActionContextConfig,
  ActionContextReturn,
  ActionContextType,
  ProviderDispatchLifecycle
} from './ActionContext.types';

function createProviderAbortError(): Error {
  const error = new Error('Action provider unmounted');
  error.name = 'AbortError';
  return error;
}

function mergeAbortSignals(signals: AbortSignal[]): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  if (signals.length === 1) {
    return { signal: signals[0]!, cleanup: () => {} };
  }

  if (typeof AbortSignal.any === 'function') {
    return { signal: AbortSignal.any(signals), cleanup: () => {} };
  }

  const controller = new AbortController();
  const cleanups: Array<() => void> = [];
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    const forwardAbort = () => controller.abort(signal.reason);
    signal.addEventListener('abort', forwardAbort, { once: true });
    cleanups.push(() => signal.removeEventListener('abort', forwardAbort));
  }

  return {
    signal: controller.signal,
    cleanup: () => cleanups.forEach(cleanup => cleanup()),
  };
}

/** @internal Shared by ActionContext and ToolContext providers. */
export class ProviderDispatchLifecycleImpl implements ProviderDispatchLifecycle {
  private accepting = true;
  private finalized = false;
  private activeOperations = new Set<Promise<unknown>>();
  private controllers = new Set<AbortController>();
  private pendingHandlerCleanups = new Set<() => void>();
  private shutdownPromise: Promise<void> | null = null;

  run<R>(
    externalSignals: Array<AbortSignal | undefined>,
    operation: (signal: AbortSignal) => Promise<R>
  ): Promise<R> {
    if (!this.accepting) {
      const rejectedPromise = Promise.reject<R>(createProviderAbortError());
      void rejectedPromise.catch(() => {});
      return rejectedPromise;
    }

    const controller = new AbortController();
    const { signal, cleanup: cleanupSignals } = mergeAbortSignals([
      controller.signal,
      ...externalSignals.filter((candidate): candidate is AbortSignal => Boolean(candidate)),
    ]);
    this.controllers.add(controller);

    let operationPromise: Promise<R>;
    try {
      operationPromise = operation(signal);
    } catch (error) {
      operationPromise = Promise.reject(error);
    }
    this.activeOperations.add(operationPromise);

    const abortPromise = new Promise<never>((_, reject) => {
      const rejectOnProviderAbort = () => reject(createProviderAbortError());
      controller.signal.addEventListener('abort', rejectOnProviderAbort, { once: true });

      const finish = () => {
        controller.signal.removeEventListener('abort', rejectOnProviderAbort);
        this.controllers.delete(controller);
        this.activeOperations.delete(operationPromise);
        cleanupSignals();
      };
      void operationPromise.then(finish, finish);
    });

    const exposedPromise = Promise.race([operationPromise, abortPromise]);
    void exposedPromise.catch(() => {});
    return exposedPromise;
  }

  scheduleHandlerCleanup(cleanup: () => void): void {
    queueMicrotask(() => {
      if (this.finalized) {
        cleanup();
      } else if (this.accepting) {
        cleanup();
      } else {
        this.pendingHandlerCleanups.add(cleanup);
      }
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: cross-context lifecycle boundary.
  shutdown(register: ActionRegister<any, any>): Promise<void> {
    if (this.shutdownPromise) return this.shutdownPromise;

    this.accepting = false;
    this.controllers.forEach(controller => {
      if (!controller.signal.aborted) controller.abort(createProviderAbortError());
    });
    const registerShutdown = register.destroyAsync();

    this.shutdownPromise = Promise.allSettled([...this.activeOperations])
      .then(() => registerShutdown)
      .then(() => {
        this.pendingHandlerCleanups.forEach(cleanup => cleanup());
        this.pendingHandlerCleanups.clear();
        this.finalized = true;
      });
    return this.shutdownPromise;
  }
}

export function withProviderDispatchSignal(
  options: DispatchOptions | undefined,
  signal: AbortSignal
): DispatchOptions {
  return {
    ...options,
    signal,
    ...(!options?.signal && !options?.autoAbort
      ? { autoAbort: { enabled: true, allowHandlerAbort: true } }
      : {}),
  };
}

/**
 * @fileoverview createActionContext - Advanced type-safe action context factory
 * Provides enhanced type compatibility and automatic type inference for complex applications
 */


/**
 * Enhanced action context factory with automatic type inference
 * 
 * @template T Action payload map type for complete type safety
 * @param contextName - Stable name used to identify this action context
 * @param config - Optional configuration for the ActionRegister
 * @returns Object containing Provider, hooks, and utility functions
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation
 */
// === UNIFIED ACTION CONTEXT SYSTEM ===
// Factory-based action context with built-in abort support

// Context name is explicit so registrations remain discoverable in source and
// the public API has one unambiguous construction form.
export function createActionContext<
  T extends ActionPayloadMap,
  TResultMap extends ActionResultMap<T> = {},
>(
  contextName: string,
  config?: ActionContextConfig
): ActionContextReturn<T, TResultMap>;

// Implementation
export function createActionContext<
  T extends ActionPayloadMap,
  TResultMap extends ActionResultMap<T> = {},
>(
  contextName: string,
  config?: ActionContextConfig
): ActionContextReturn<T, TResultMap> {
  if (typeof contextName !== 'string' || contextName.trim().length === 0) {
    throw new TypeError(
      'createActionContext requires a non-empty context name as its first argument.'
    );
  }

  let effectiveConfig: ActionContextConfig & Pick<ActionRegisterConfig, 'name'> = {
    ...config,
    registry: {
      ...config?.registry,
      // A Provider owns handler teardown and exposes a serialized lifecycle to
      // its descendants. Keep that higher-level guarantee explicit instead of
      // relying on the lightweight core default.
      useConcurrencyQueue: config?.registry?.useConcurrencyQueue ?? true,
    },
    // The positional name is canonical; a legacy config.name must not
    // silently change the identity advertised by the factory call.
    name: contextName,
  };

  // 🆕 Merge schema option into registry.schema (shorthand support)
  if (effectiveConfig.schema && !effectiveConfig.registry?.schema) {
    effectiveConfig = {
      ...effectiveConfig,
      registry: {
        ...effectiveConfig.registry,
        schema: effectiveConfig.schema,
      },
    };
  }
  
  // Create the factory-specific context with a default value
  const FactoryActionContext = createContext<ActionContextType<T, TResultMap> | null>(null);

  // Provider component with abort support
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const actionRegisterRef = useRef<ActionRegister<T, TResultMap> | null>(null);
    const dispatchLifecycleRef = useRef<ProviderDispatchLifecycleImpl | null>(null);
    const lifecycleGenerationRef = useRef(0);
    if (!actionRegisterRef.current) {
      actionRegisterRef.current = new ActionRegister<T, TResultMap>(effectiveConfig);
    }
    if (!dispatchLifecycleRef.current) {
      dispatchLifecycleRef.current = new ProviderDispatchLifecycleImpl();
    }
    const dispatchLifecycle = dispatchLifecycleRef.current;

    useEffect(() => {
      const register = actionRegisterRef.current;
      const generation = ++lifecycleGenerationRef.current;

      return () => {
        queueMicrotask(() => {
          // StrictMode replays setup before this microtask; the latest generation
          // is intentionally read here to distinguish replay from real unmount.
          // eslint-disable-next-line react-hooks/exhaustive-deps
          if (lifecycleGenerationRef.current === generation && register) {
            void dispatchLifecycle.shutdown(register);
          }
        });
      };
    }, [dispatchLifecycle]);

    const contextValue = useMemo(() => ({
      actionRegisterRef,
      dispatchLifecycle,
    }), [dispatchLifecycle]);

    return (
      <FactoryActionContext.Provider value={contextValue}>
        {children}
      </FactoryActionContext.Provider>
    );
  };

  // Hook to get the factory action context (different from simple ActionContext)
  const useFactoryActionContext = (): ActionContextType<T, TResultMap> => {
    const context = useContext(FactoryActionContext);
    if (!context) {
      throw new Error('useFactoryActionContext must be used within a factory ActionContext Provider');
    }
    return context;
  };

  /**
   * Optimized hook to get stable dispatch functions
   * 
   * Returns stable dispatch functions that prevent re-renders and maintain
   * reference equality across component renders.
   * 
   * @returns Object with dispatch and dispatchWithResult functions
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-access
   */
  const useActionDispatcher = () => {
    const { actionRegisterRef, dispatchLifecycle } = useFactoryActionContext();
    
    // Stable dispatch function with useCallback optimization
    const dispatch = useCallback(<K extends ActionNames<T>>(
      action: K,
      ...args: DispatchArgs<T[K]>
    ): Promise<void> => {
      const [payload, options] = args as [T[K] | undefined, DispatchOptions | undefined];
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
      
      return dispatchLifecycle.run(
        [options?.signal],
        signal => register.dispatch(
          action,
          ...([payload as T[K], withProviderDispatchSignal(options, signal)] as DispatchArgs<T[K]>)
        )
      );
    }, [actionRegisterRef, dispatchLifecycle]);

    // Stable dispatchWithResult function
    const dispatchWithResult = useCallback(<K extends ActionNames<T>, R = void>(
      action: K,
      ...args: DispatchArgs<T[K]>
    ): Promise<ExecutionResult<R>> => {
      const [payload, options] = args as [T[K] | undefined, DispatchOptions | undefined];
      const register = actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }
      
      const dispatchResult = register.dispatchWithResult.bind(register) as unknown as <
        ActionKey extends ActionNames<T>,
        Result = void,
      >(
        action: ActionKey,
        ...dispatchArgs: DispatchArgs<T[ActionKey]>
      ) => Promise<ExecutionResult<Result>>;

      return dispatchLifecycle.run(
        [options?.signal],
        signal => dispatchResult<K, R>(
          action,
          ...([payload, withProviderDispatchSignal(options, signal)] as DispatchArgs<T[K]>)
        )
      );
    }, [actionRegisterRef, dispatchLifecycle]);

    return { dispatch, dispatchWithResult };
  };

  // Legacy hook for backwards compatibility
  const useAction = (): ActionRegister<T, TResultMap>['dispatch'] => {
    const { dispatch } = useActionDispatcher();
    return dispatch;
  };

  // Hook to register action handlers with automatic cleanup and ref optimization
  const useActionHandler = <K extends ActionNames<T>, R = ActionResult<TResultMap, K>>(
    action: K,
    handler: K extends keyof TResultMap
      ? ActionResultHandler<T[K], ActionResult<TResultMap, K>>
      : ActionHandler<T[K], R>,
    config?: HandlerConfig<T[K]> | EffectConfig<T[K]>,
    registrationRole: 'legacy' | 'effect' | 'guard' | 'observer' | 'result' = 'legacy',
  ): void => {
    const { actionRegisterRef, dispatchLifecycle } = useFactoryActionContext();
    const actionId = useId();
    const effectGenerationRef = useRef(0);
    const registrationRef = useRef<{
      register: ActionRegister<T, TResultMap>;
      action: keyof T;
      config: HandlerConfig<T[K]>;
      active: boolean;
      unregister: () => void;
    } | null>(null);
    
    // Store the latest handler in a ref to avoid re-registrations
    const handlerRef = useRef(handler);
    handlerRef.current = handler;
    
    // Extract config properties to stable variables
    const priority = config?.priority ?? 0;
    const id = config?.id || `react_${String(action)}_${actionId}`;
    const blocking = config?.blocking;
    const scheduling = config?.scheduling;
    const errorPolicy = config?.errorPolicy;
    const once = config?.once ?? false;
    const debounce = config?.debounce;
    const throttle = config?.throttle;
    const cleanup = config?.cleanup;
    const condition = config?.condition;
    const metadata = config?.metadata;
    const when = config?.when;
    const effectKind = config && 'effectKind' in config ? config.effectKind : undefined;
    const replaceExisting = config?.replaceExisting ?? true;
    
    // Memoize config to prevent unnecessary re-registrations
    const stableConfig = useMemo((): HandlerConfig<T[K]> => ({
      priority,
      id,
      ...(blocking !== undefined && { blocking }),
      ...(scheduling !== undefined && { scheduling }),
      ...(errorPolicy !== undefined && { errorPolicy }),
      once,
      replaceExisting,
      ...(cleanup !== undefined && { cleanup }),
      ...(condition !== undefined && { condition }),
      ...(metadata !== undefined && { metadata }),
      ...(when !== undefined && { when }),
      ...(effectKind !== undefined && { effectKind }),
      ...(debounce !== undefined && { debounce }),
      ...(throttle !== undefined && { throttle })
    }), [priority, id, blocking, scheduling, errorPolicy, once, replaceExisting, cleanup, condition, metadata, when, effectKind, debounce, throttle]);

    useEffect(() => {
      const register = actionRegisterRef.current;
      if (!register) return;
      const generation = ++effectGenerationRef.current;
      let lease = registrationRef.current;

      if (lease && (
        lease.register !== register ||
        lease.action !== action ||
        lease.config !== stableConfig
      )) {
        lease.active = false;
        lease.unregister();
        registrationRef.current = null;
        lease = null;
      }

      if (!lease) {
        const nextLease = {
          register,
          action,
          config: stableConfig,
          active: true,
          unregister: () => {},
        };
        const wrapperHandler: ActionHandler<T[K], R> = (payload, controller) => {
          if (!nextLease.active) return;
          return (handlerRef.current as ActionHandler<T[K], R>)(payload, controller);
        };

        if (process.env.NODE_ENV === 'development') {
          console.log(`Registering handler for '${String(action)}'`);
        }

        const registerMethod = registrationRole === 'effect'
          ? register.registerEffect
          : registrationRole === 'guard'
            ? register.registerGuard
            : registrationRole === 'observer'
              ? register.registerObserver
          : registrationRole === 'result'
            ? register.registerResult
            : register.register;
        const registerHandler = registerMethod.bind(register) as unknown as (
          action: K,
          handler: ActionHandler<T[K], R>,
          config: HandlerConfig<T[K]>,
        ) => () => void;
        nextLease.unregister = registerHandler(action, wrapperHandler, stableConfig);
        registrationRef.current = nextLease;
        lease = nextLease;
      } else {
        lease.active = true;
      }

      if (!lease) return;
      const currentLease = lease;
      return () => {
        currentLease.active = false;
        queueMicrotask(() => {
          // eslint-disable-next-line react-hooks/exhaustive-deps -- replay cancellation requires the latest generation
          if (effectGenerationRef.current !== generation) return;
          dispatchLifecycle.scheduleHandlerCleanup(() => {
            if (registrationRef.current === currentLease) {
              registrationRef.current = null;
            }
            currentLease.unregister();
          });
        });
      };
      }, [
        action,
        actionRegisterRef,
        dispatchLifecycle,
        stableConfig, // Only re-register if config actually changes
        registrationRole,
      // Note: handler is NOT in dependencies - it's accessed via ref
    ]);
  };

  /**
   * Hook that provides direct access to the ActionRegister instance
   * 
   * This hook is useful when you need to:
   * - Register multiple handlers dynamically
   * - Access other ActionRegister methods like clearAction, getHandlers, etc.
   * - Implement complex handler registration logic
   * - Have more control over the registration lifecycle
   * 
   * @returns ActionRegister instance or null if not initialized
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-access
   */
  const useFactoryActionRegister = (): ActionRegister<T, TResultMap> | null => {
    const context = useFactoryActionContext();
    return context.actionRegisterRef.current;
  };

  const useActionEffectHandler = <K extends ActionNames<T>>(
    action: K,
    handler: ActionEffectHandler<T[K]> | ActionGuardHandler<T[K]>,
    config: EffectConfig<T[K]>,
  ): void => {
    useActionHandler(action, handler as never, config, 'effect');
  };

  const useActionResultHandler = <K extends ActionNames<T> & keyof TResultMap>(
    action: K,
    handler: ActionResultHandler<T[K], ActionResult<TResultMap, K>>,
    config?: HandlerConfig<T[K]>,
  ): void => {
    useActionHandler(action, handler as never, config, 'result');
  };

  const useActionGuard = <K extends ActionNames<T>>(
    action: K,
    handler: ActionGuardHandler<T[K]>,
    config?: GuardConfig<T[K]>,
  ): void => {
    useActionHandler(action, handler as never, config, 'guard');
  };

  const useActionObserver = <K extends ActionNames<T>, R = ActionResult<TResultMap, K>>(
    action: K,
    handler: ActionObserverHandler<T[K], R>,
    config?: ObserverConfig<T[K]>,
  ): void => {
    useActionHandler(action, handler as never, config, 'observer');
  };

  // Hook to get the dispatchWithResult function with full type safety
  /**
   * Hook that provides access to the dispatchWithResult function
   * 
   * This hook returns a function that dispatches actions and returns detailed
   * execution results including collected handler results, execution metadata,
   * and error information.
   * 
   * @returns dispatchWithResult function with full type safety
   * 
   * @see https://mineclover.github.io/context-action/en/guide/patterns/action/dispatch-with-result
   */

  // Hook for enhanced dispatch with abort control
  const useFactoryActionDispatchWithResult = () => {
    const context = useFactoryActionContext();
    const activeControllersRef = useRef<Set<AbortController>>(new Set());
    const cleanupGenerationRef = useRef(0);

    // Create wrapped dispatch using core's autoAbort
    const dispatch = useCallback(<K extends ActionNames<T>>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<void> => {
      const register = context.actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }

      const scopeController = new AbortController();
      activeControllersRef.current.add(scopeController);

      const trackedPromise = context.dispatchLifecycle.run(
        [options?.signal, scopeController.signal],
        signal => register.dispatch(
          action,
          ...([payload as T[K], withProviderDispatchSignal(options, signal)] as DispatchArgs<T[K]>)
        )
      ).finally(() => {
        activeControllersRef.current.delete(scopeController);
      });
      void trackedPromise.catch(() => {});
      return trackedPromise;
    }, [context.actionRegisterRef, context.dispatchLifecycle]);

    // Create wrapped dispatchWithResult using core's autoAbort
    const dispatchWithResult = useCallback(<K extends ActionNames<T>, R = void>(
      action: K,
      ...args: DispatchArgs<T[K]>
    ): Promise<ExecutionResult<R>> => {
      const [payload, options] = args as [T[K] | undefined, DispatchOptions | undefined];
      const register = context.actionRegisterRef.current;
      if (!register) {
        throw new Error('ActionRegister not initialized');
      }

      const scopeController = new AbortController();
      activeControllersRef.current.add(scopeController);

      const dispatchResult = register.dispatchWithResult.bind(register) as unknown as <
        ActionKey extends ActionNames<T>,
        Result = void,
      >(
        action: ActionKey,
        ...dispatchArgs: DispatchArgs<T[ActionKey]>
      ) => Promise<ExecutionResult<Result>>;

      const trackedPromise = context.dispatchLifecycle.run(
        [options?.signal, scopeController.signal],
        signal => dispatchResult<K, R>(
          action,
          ...([payload, withProviderDispatchSignal(options, signal)] as DispatchArgs<T[K]>)
        )
      ).finally(() => {
        activeControllersRef.current.delete(scopeController);
      });
      void trackedPromise.catch(() => {});
      return trackedPromise;
    }, [context.actionRegisterRef, context.dispatchLifecycle]);
    
    // Method to manually abort all pending actions
    const abortAll = useCallback(() => {
      activeControllersRef.current.forEach(controller => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      });
      activeControllersRef.current.clear();
    }, []);
    
    // Method to create a new abort scope
    const resetAbortScope = useCallback(() => {
      abortAll();
    }, [abortAll]);
    
    // Cleanup: abort all pending actions on unmount
    useEffect(() => {
      const generation = ++cleanupGenerationRef.current;
      return () => {
        queueMicrotask(() => {
          // eslint-disable-next-line react-hooks/exhaustive-deps -- replay cancellation requires the latest generation
          if (cleanupGenerationRef.current === generation) abortAll();
        });
      };
    }, [abortAll]);
    
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
    useActionEffectHandler,
    useActionGuard,
    useActionObserver,
    useActionResultHandler,
    useActionRegister: useFactoryActionRegister,
    useActionDispatchWithResult: useFactoryActionDispatchWithResult,
    context: FactoryActionContext,
  } satisfies ActionContextReturn<T, TResultMap>;
}
