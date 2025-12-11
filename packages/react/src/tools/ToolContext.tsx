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
  useCallback,
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
    const actionRegisterRef = useRef<ActionRegister<TPayloadMap>>(
      new ActionRegister<TPayloadMap>({
        name: contextName,
        registry: {
          schema: schema as ActionSchemaMap,
          validationMode,
          validateOnDispatch,
        },
      })
    );

    const contextValue = useMemo(
      () => ({
        actionRegisterRef,
        registry,
      }),
      []
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
   * Hook to dispatch tools with validation
   */
  const useToolDispatch = () => {
    const { actionRegisterRef } = useToolContext();

    const dispatch = useCallback(
      <K extends keyof TPayloadMap>(
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

        const dispatchOptions: DispatchOptions = {
          ...options,
          ...(options?.signal
            ? {}
            : {
                autoAbort: {
                  enabled: true,
                  allowHandlerAbort: true,
                },
              }),
        };

        return register.dispatch(toolName, payload, dispatchOptions);
      },
      [actionRegisterRef]
    );

    return dispatch;
  };

  /**
   * Hook to register tool handlers
   */
  const useToolHandler = <K extends keyof TSchema>(
    toolName: K,
    handler: ActionHandler<TPayloadMap[K]>,
    handlerConfig?: HandlerConfig
  ): void => {
    const { actionRegisterRef } = useToolContext();
    const handlerId = useId();

    // Store latest handler in ref
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    // Extract config properties for stable dependencies
    const priority = handlerConfig?.priority ?? 0;
    const id = handlerConfig?.id || `tool_${String(toolName)}_${handlerId}`;
    const blocking = handlerConfig?.blocking ?? false;
    const once = handlerConfig?.once ?? false;
    const debounce = handlerConfig?.debounce;
    const throttle = handlerConfig?.throttle;

    const stableConfig = useMemo(
      (): HandlerConfig => ({
        priority,
        id,
        blocking,
        once,
        replaceExisting: true,
        ...(debounce !== undefined && { debounce }),
        ...(throttle !== undefined && { throttle }),
      }),
      [priority, id, blocking, once, debounce, throttle]
    );

    useEffect(() => {
      const register = actionRegisterRef.current;
      if (!register) return;

      // Wrapper handler that calls the latest handler
      const wrapperHandler: ActionHandler<TPayloadMap[K]> = (payload, controller) => {
        return handlerRef.current(payload, controller);
      };

      if (debug) {
        console.log(`[${contextName}] Registering handler for tool '${String(toolName)}'`);
      }

      const unregister = register.register(
        toolName as unknown as keyof TPayloadMap,
        wrapperHandler as ActionHandler<TPayloadMap[keyof TPayloadMap]>,
        stableConfig
      );

      return unregister;
    }, [toolName, actionRegisterRef, stableConfig]);
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
    const { actionRegisterRef } = useToolContext();
    const activeControllersRef = useRef<Set<AbortController>>(new Set());

    const dispatch = useCallback(
      <K extends keyof TPayloadMap>(
        toolName: K,
        payload: TPayloadMap[K],
        options?: DispatchOptions
      ): Promise<void> => {
        const register = actionRegisterRef.current;
        if (!register) {
          throw new Error(`ActionRegister not initialized in ${contextName}`);
        }

        let createdController: AbortController | undefined;

        const dispatchOptions: DispatchOptions = {
          ...options,
          ...(options?.signal
            ? {}
            : {
                autoAbort: {
                  enabled: true,
                  allowHandlerAbort: true,
                  onControllerCreated: (controller) => {
                    createdController = controller;
                    activeControllersRef.current.add(controller);
                  },
                },
              }),
        };

        return register.dispatch(toolName, payload, dispatchOptions).finally(() => {
          if (createdController) {
            activeControllersRef.current.delete(createdController);
          }
        });
      },
      [actionRegisterRef]
    );

    const dispatchWithResult = useCallback(
      <K extends keyof TPayloadMap, R = void>(
        toolName: K,
        payload: TPayloadMap[K],
        options?: DispatchOptions
      ): Promise<ToolExecutionResult<R>> => {
        const register = actionRegisterRef.current;
        if (!register) {
          throw new Error(`ActionRegister not initialized in ${contextName}`);
        }

        let createdController: AbortController | undefined;

        const dispatchOptions: DispatchOptions = {
          ...options,
          ...(options?.signal
            ? {}
            : {
                autoAbort: {
                  enabled: true,
                  allowHandlerAbort: true,
                  onControllerCreated: (controller) => {
                    createdController = controller;
                    activeControllersRef.current.add(controller);
                  },
                },
              }),
        };

        return register
          .dispatchWithResult<K, R>(toolName, payload, dispatchOptions)
          .then((result) => ({
            ...result,
            validationPassed: true,
          }))
          .finally(() => {
            if (createdController) {
              activeControllersRef.current.delete(createdController);
            }
          });
      },
      [actionRegisterRef]
    );

    const abortAll = useCallback(() => {
      activeControllersRef.current.forEach((controller) => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      });
      activeControllersRef.current.clear();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
      const controllers = activeControllersRef;
      return () => {
        controllers.current.forEach((controller) => {
          if (!controller.signal.aborted) {
            controller.abort();
          }
        });
        controllers.current.clear();
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
