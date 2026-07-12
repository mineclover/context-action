/**
 * @fileoverview createToolContext - Unified Tool Registry for LLM Integration
 *
 * Combines ActionContext patterns with Zod schema-based definitions to create
 * a unified tool registry that can:
 * - Define tools with Zod schemas (Single Source of Truth)
 * - Register and execute tool handlers
 * - Export tools in MCP, OpenAI, Anthropic formats
 * - Validate payloads at runtime
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { createToolContext, defineAction, createActionSchema } from '@context-action/react';
 *
 * const toolSchema = createActionSchema({
 *   searchProducts: defineAction({
 *     name: 'searchProducts',
 *     description: 'Search for products in the catalog',
 *     parameters: z.object({
 *       query: z.string().min(1),
 *       category: z.enum(['electronics', 'clothing', 'home']).optional(),
 *     }),
 *   }, z),
 * });
 *
 * const {
 *   Provider: ToolProvider,
 *   useToolDispatch,
 *   useToolHandler,
 *   useToolRegistry,
 * } = createToolContext('ProductTools', { schema: toolSchema });
 *
 * // In your LLM integration:
 * function LLMIntegration() {
 *   const registry = useToolRegistry();
 *   const tools = registry.toOpenAI(); // Export for OpenAI
 *   // ... use tools with OpenAI API
 * }
 * ```
 */

import React, {
  createContext,
  ReactNode,
  useContext,
  useRef,
  useEffect,
  useId,
  useMemo,
} from 'react';
import {
  ActionRegister,
  ActionHandler,
  HandlerConfig,
  DispatchOptions,
  ActionSchemaMap,
  InferActionPayloadMap,
} from '@context-action/core';
import type {
  ToolContextConfig,
  ToolContextType,
  ToolContextReturn,
  ToolRegistry,
  ToolExecutionResult,
} from './ToolContext.types';
import {
  ProviderDispatchLifecycleImpl,
  withProviderDispatchSignal,
} from '../actions/ActionContext';

/**
 * Creates a ToolRegistry from an ActionSchemaMap
 */
function createToolRegistry<TSchema extends ActionSchemaMap>(
  schema: TSchema
): ToolRegistry<TSchema> {
  const toolNames = Object.keys(schema) as (keyof TSchema)[];

  return {
    tools: schema,

    getTool<K extends keyof TSchema>(name: K): TSchema[K] {
      const tool = schema[name];
      if (!tool) {
        throw new Error(`Tool "${String(name)}" not found in registry`);
      }
      return tool;
    },

    hasTool(name: string): boolean {
      return name in schema;
    },

    getToolNames(): (keyof TSchema)[] {
      return toolNames;
    },

    // ---- Batch Export Methods ----

    toMCP() {
      return toolNames.map((name) => schema[name]!.toMCP());
    },

    toOpenAI() {
      return toolNames.map((name) => schema[name]!.toOpenAI());
    },

    toAnthropic() {
      return toolNames.map((name) => schema[name]!.toAnthropic());
    },

    toMCPFiltered<K extends keyof TSchema>(names: K[]) {
      return names.map((name) => schema[name]!.toMCP());
    },

    toOpenAIFiltered<K extends keyof TSchema>(names: K[]) {
      return names.map((name) => schema[name]!.toOpenAI());
    },

    toAnthropicFiltered<K extends keyof TSchema>(names: K[]) {
      return names.map((name) => schema[name]!.toAnthropic());
    },
  };
}

/**
 * Creates a unified Tool Context for LLM integration
 *
 * This factory creates a complete tool system that:
 * - Uses Zod schemas as the Single Source of Truth
 * - Provides runtime payload validation
 * - Exports tools in MCP, OpenAI, Anthropic formats
 * - Manages tool handlers with priority-based execution
 *
 * @param contextName - Name identifier for this tool context
 * @param config - Configuration with required schema
 * @returns Tool context with Provider, hooks, and registry access
 *
 * @example
 * ```typescript
 * const { Provider, useToolDispatch, useToolRegistry } = createToolContext('MyTools', {
 *   schema: myToolSchema,
 *   validationMode: 'strict',
 * });
 * ```
 */
export function createToolContext<TSchema extends ActionSchemaMap>(
  contextName: string,
  config: ToolContextConfig<TSchema>
): ToolContextReturn<TSchema> {
  type TPayloadMap = InferActionPayloadMap<TSchema>;

  const { schema, validationMode = 'strict', validateOnDispatch = true, debug = false } = config;

  // Create the tool registry
  const registry = createToolRegistry(schema);

  // Create the React context
  const ToolReactContext = createContext<ToolContextType<TSchema> | null>(null);

  // Provider component
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Create singleton ActionRegister instance (only once per Provider mount)
    const actionRegisterRef = useRef<ActionRegister<TPayloadMap> | null>(null);
    const dispatchLifecycleRef = useRef<ProviderDispatchLifecycleImpl | null>(null);
    const lifecycleGenerationRef = useRef(0);
    if (!actionRegisterRef.current) {
      actionRegisterRef.current = new ActionRegister<TPayloadMap>({
        name: contextName,
        registry: {
          schema: schema as ActionSchemaMap,
          validationMode,
          validateOnDispatch,
        },
      });
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
          // StrictMode replays setup before this microtask; compare against the
          // latest generation to distinguish replay from real unmount.
          // eslint-disable-next-line react-hooks/exhaustive-deps
          if (lifecycleGenerationRef.current === generation && register) {
            void dispatchLifecycle.shutdown(register);
          }
        });
      };
    }, [dispatchLifecycle]);

    // Create dispatch function (singleton)
    const dispatch = useMemo(() => {
      return <K extends keyof TPayloadMap>(
        toolName: K,
        payload: TPayloadMap[K],
        options?: DispatchOptions
      ): Promise<void> => {
        if (debug) {
          console.log(`[${contextName}] Dispatching tool '${String(toolName)}':`, payload);
        }

        const register = actionRegisterRef.current;
        if (!register) {
          throw new Error(`ActionRegister not initialized in ${contextName}`);
        }

        const trackedPromise = dispatchLifecycle.run(
          [options?.signal],
          signal => register.dispatch(
            toolName,
            payload,
            withProviderDispatchSignal(options, signal)
          )
        );
        void trackedPromise.catch(() => {});
        return trackedPromise;
      };
    }, [dispatchLifecycle]);

    const contextValue = useMemo(
      () => ({
        actionRegisterRef,
        registry,
        dispatch,
        dispatchLifecycle,
      }),
      [dispatch, dispatchLifecycle]
    );

    return (
      <ToolReactContext.Provider value={contextValue}>{children}</ToolReactContext.Provider>
    );
  };

  // Internal hook to get context
  const useToolContext = (): ToolContextType<TSchema> => {
    const context = useContext(ToolReactContext);
    if (!context) {
      throw new Error(
        `useToolContext must be used within a ${contextName} ToolContext Provider`
      );
    }
    return context;
  };

  /**
   * Hook to dispatch tools
   * Returns the singleton dispatch function
   */
  const useToolDispatch = () => {
    const { dispatch: contextDispatch } = useToolContext();
    return contextDispatch;
  };

  /**
   * Hook to register tool handlers
   * Handler is kept up-to-date via ref to always call the latest version
   */
  const useToolHandler = <K extends keyof TSchema, R = void>(
    toolName: K,
    handler: ActionHandler<TPayloadMap[K], R>,
    handlerConfig?: HandlerConfig
  ): void => {
    const { actionRegisterRef, dispatchLifecycle } = useToolContext();
    const handlerId = useId();
    const effectGenerationRef = useRef(0);
    const registrationRef = useRef<{
      register: ActionRegister<TPayloadMap>;
      toolName: keyof TPayloadMap;
      config: HandlerConfig;
      active: boolean;
      unregister: () => void;
    } | null>(null);

    // Keep handler up-to-date via ref
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    const priority = handlerConfig?.priority ?? 0;
    const id = handlerConfig?.id || `tool_${String(toolName)}_${handlerId}`;
    const blocking = handlerConfig?.blocking ?? false;
    const once = handlerConfig?.once ?? false;
    const debounce = handlerConfig?.debounce;
    const throttle = handlerConfig?.throttle;
    const cleanup = handlerConfig?.cleanup;
    const condition = handlerConfig?.condition;
    const stableHandlerConfig = useMemo((): HandlerConfig => ({
      priority,
      id,
      blocking,
      once,
      replaceExisting: true,
      ...(cleanup !== undefined && { cleanup }),
      ...(condition !== undefined && { condition }),
      ...(debounce !== undefined && { debounce }),
      ...(throttle !== undefined && { throttle }),
    }), [priority, id, blocking, once, cleanup, condition, debounce, throttle]);

    useEffect(() => {
      const register = actionRegisterRef.current;
      if (!register) return;
      const generation = ++effectGenerationRef.current;
      const normalizedToolName = toolName as unknown as K & keyof TPayloadMap;
      let lease = registrationRef.current;

      if (lease && (
        lease.register !== register ||
        lease.toolName !== normalizedToolName ||
        lease.config !== stableHandlerConfig
      )) {
        lease.active = false;
        lease.unregister();
        registrationRef.current = null;
        lease = null;
      }

      if (!lease) {
        const nextLease = {
          register,
          toolName: normalizedToolName,
          config: stableHandlerConfig,
          active: true,
          unregister: () => {},
        };

        if (debug) {
          console.log(`[${contextName}] Registering handler for tool '${String(toolName)}'`);
        }

        const wrapperHandler: ActionHandler<TPayloadMap[K], R> = (payload, controller) => {
          if (!nextLease.active) return;
          return handlerRef.current(payload, controller);
        };

        nextLease.unregister = register.register(
          normalizedToolName,
          wrapperHandler,
          stableHandlerConfig
        );
        registrationRef.current = nextLease;
        lease = nextLease;
      } else {
        lease.active = true;
      }

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
    }, [toolName, actionRegisterRef, dispatchLifecycle, stableHandlerConfig]);
  };

  /**
   * Hook to access the tool registry
   */
  const useToolRegistry = (): ToolRegistry<TSchema> => {
    const { registry: contextRegistry } = useToolContext();
    return contextRegistry;
  };

  /**
   * Hook for dispatch with detailed result
   */
  const useToolDispatchWithResult = () => {
    const { actionRegisterRef, dispatchLifecycle } = useToolContext();
    const activeControllersRef = useRef<Set<AbortController>>(new Set());
    const cleanupGenerationRef = useRef(0);

    // Cleanup on unmount
    useEffect(() => {
      const generation = ++cleanupGenerationRef.current;
      const activeControllers = activeControllersRef.current;
      return () => {
        queueMicrotask(() => {
          // eslint-disable-next-line react-hooks/exhaustive-deps -- replay cancellation requires the latest generation
          if (cleanupGenerationRef.current !== generation) return;
          activeControllers.forEach((controller) => {
            if (!controller.signal.aborted) controller.abort();
          });
          activeControllers.clear();
        });
      };
    }, []);

    const dispatch = useMemo(() => {
      return <K extends keyof TPayloadMap>(
        toolName: K,
        payload: TPayloadMap[K],
        options?: DispatchOptions
      ): Promise<void> => {
        const register = actionRegisterRef.current;
        if (!register) {
          throw new Error(`ActionRegister not initialized in ${contextName}`);
        }

        const scopeController = new AbortController();
        activeControllersRef.current.add(scopeController);

        const trackedPromise = dispatchLifecycle.run(
          [options?.signal, scopeController.signal],
          signal => register.dispatch(
            toolName,
            payload,
            withProviderDispatchSignal(options, signal)
          )
        ).finally(() => {
          activeControllersRef.current.delete(scopeController);
        });
        void trackedPromise.catch(() => {});
        return trackedPromise;
      };
    }, [actionRegisterRef, dispatchLifecycle]);

    const dispatchWithResult = useMemo(() => {
      return <K extends keyof TPayloadMap, R = void>(
        toolName: K,
        payload: TPayloadMap[K],
        options?: DispatchOptions
      ): Promise<ToolExecutionResult<R>> => {
        const register = actionRegisterRef.current;
        if (!register) {
          throw new Error(`ActionRegister not initialized in ${contextName}`);
        }

        const scopeController = new AbortController();
        activeControllersRef.current.add(scopeController);

        const trackedPromise = dispatchLifecycle
          .run(
            [options?.signal, scopeController.signal],
            signal => register.dispatchWithResult<K, R>(
              toolName,
              payload,
              withProviderDispatchSignal(options, signal)
            )
          )
          .then((result) => {
            const validationPassed = result.validation?.passed ?? true;
            return {
              ...result,
              validationPassed,
              ...(!validationPassed && result.validation
                ? { validationErrors: result.validation.errors }
                : {}),
            };
          })
          .finally(() => {
            activeControllersRef.current.delete(scopeController);
          });
        void trackedPromise.catch(() => {});
        return trackedPromise;
      };
    }, [actionRegisterRef, dispatchLifecycle]);

    const abortAll = useMemo(() => {
      return () => {
        activeControllersRef.current.forEach((controller) => {
          if (!controller.signal.aborted) {
            controller.abort();
          }
        });
        activeControllersRef.current.clear();
      };
    }, []);

    return { dispatch, dispatchWithResult, abortAll };
  };

  /**
   * Hook to access raw ActionRegister
   */
  const useActionRegister = (): ActionRegister<TPayloadMap> | null => {
    const { actionRegisterRef } = useToolContext();
    return actionRegisterRef.current;
  };

  return {
    Provider,
    useToolDispatch,
    useToolHandler,
    useToolRegistry,
    useToolDispatchWithResult,
    useActionRegister,
    context: ToolReactContext,
  };
}
