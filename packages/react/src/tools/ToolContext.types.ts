/**
 * @fileoverview ToolContext Type Definitions
 *
 * Type definitions for the ToolContext system - a unified tool registry
 * combining ActionContext patterns with Zod schema-based definitions.
 */

import { ReactNode } from 'react';
import {
  ActionRegister,
  ActionHandler,
  HandlerConfig,
  DispatchOptions,
  ExecutionResult,
  ActionSchemaMap,
  UnifiedAction,
  InferActionPayloadMap,
  MCPToolDefinition,
  OpenAIToolDefinition,
  AnthropicToolDefinition,
} from '@context-action/core';

// ============================================
// Tool Context Configuration
// ============================================

/**
 * Validation mode for tool execution
 */
export type ToolValidationMode = 'strict' | 'warn' | 'silent';

/**
 * Configuration options for createToolContext
 */
export interface ToolContextConfig<TSchema extends ActionSchemaMap> {
  /** Tool schema map (required) - defines all available tools */
  schema: TSchema;

  /**
   * Validation mode for tool execution
   * - 'strict': Throws ActionValidationError on invalid payload (default)
   * - 'warn': Logs warning but continues execution
   * - 'silent': Silently ignores validation errors
   */
  validationMode?: ToolValidationMode;

  /**
   * Enable/disable validation on dispatch
   * @default true
   */
  validateOnDispatch?: boolean;

  /** Enable debug logging */
  debug?: boolean;
}

// ============================================
// Tool Registry Interface
// ============================================

/**
 * Tool Registry - provides access to all defined tools
 * and their export methods for LLM integration
 */
export interface ToolRegistry<TSchema extends ActionSchemaMap> {
  /** Get all tool definitions */
  readonly tools: TSchema;

  /** Get a specific tool by name */
  getTool<K extends keyof TSchema>(name: K): TSchema[K];

  /** Check if a tool exists */
  hasTool(name: string): boolean;

  /** Get all tool names */
  getToolNames(): (keyof TSchema)[];

  // ---- Batch Export Methods ----

  /** Export all tools as MCP format */
  toMCP(): MCPToolDefinition[];

  /** Export all tools as OpenAI format */
  toOpenAI(): OpenAIToolDefinition[];

  /** Export all tools as Anthropic format */
  toAnthropic(): AnthropicToolDefinition[];

  /** Export specific tools as MCP format */
  toMCPFiltered<K extends keyof TSchema>(toolNames: K[]): MCPToolDefinition[];

  /** Export specific tools as OpenAI format */
  toOpenAIFiltered<K extends keyof TSchema>(toolNames: K[]): OpenAIToolDefinition[];

  /** Export specific tools as Anthropic format */
  toAnthropicFiltered<K extends keyof TSchema>(toolNames: K[]): AnthropicToolDefinition[];
}

// ============================================
// Tool Execution Result
// ============================================

/**
 * Result of tool execution with validation info
 */
export interface ToolExecutionResult<R = void> extends ExecutionResult<R> {
  /** Whether validation passed */
  validationPassed: boolean;
  /** Validation errors if any */
  validationErrors?: string[];
}

// ============================================
// Context Types
// ============================================

/**
 * Internal context type for ToolContext
 */
export interface ToolContextType<TSchema extends ActionSchemaMap> {
  actionRegisterRef: React.RefObject<ActionRegister<InferActionPayloadMap<TSchema>> | null>;
  registry: ToolRegistry<TSchema>;
  dispatch: ToolDispatchFunction<InferActionPayloadMap<TSchema>>;
}

// ============================================
// Hook Return Types
// ============================================

/**
 * Return type for useToolDispatch hook
 */
export type ToolDispatchFunction<TPayloadMap> = <K extends keyof TPayloadMap>(
  toolName: K,
  payload: TPayloadMap[K],
  options?: DispatchOptions
) => Promise<void>;

/**
 * Return type for useToolDispatchWithResult hook
 */
export interface ToolDispatchWithResultReturn<TPayloadMap> {
  dispatch: ToolDispatchFunction<TPayloadMap>;
  dispatchWithResult: <K extends keyof TPayloadMap, R = void>(
    toolName: K,
    payload: TPayloadMap[K],
    options?: DispatchOptions
  ) => Promise<ToolExecutionResult<R>>;
  abortAll: () => void;
}

// ============================================
// createToolContext Return Type
// ============================================

/**
 * Return type for createToolContext factory
 */
export interface ToolContextReturn<TSchema extends ActionSchemaMap> {
  /** Provider component that wraps children with tool context */
  Provider: React.FC<{ children: ReactNode }>;

  /**
   * Hook to dispatch tools (execute with validation)
   * @returns Dispatch function that validates and executes tools
   */
  useToolDispatch: () => ToolDispatchFunction<InferActionPayloadMap<TSchema>>;

  /**
   * Hook to register tool handlers
   * Similar to useActionHandler but for tool execution
   */
  useToolHandler: <K extends keyof TSchema>(
    toolName: K,
    handler: ActionHandler<InferActionPayloadMap<TSchema>[K]>,
    config?: HandlerConfig
  ) => void;

  /**
   * Hook to access the tool registry
   * Provides methods to export tools in various formats
   */
  useToolRegistry: () => ToolRegistry<TSchema>;

  /**
   * Hook for dispatch with detailed result
   */
  useToolDispatchWithResult: () => ToolDispatchWithResultReturn<InferActionPayloadMap<TSchema>>;

  /**
   * Hook to access raw ActionRegister
   * For advanced use cases
   */
  useActionRegister: () => ActionRegister<InferActionPayloadMap<TSchema>> | null;

  /** The underlying React Context */
  context: React.Context<ToolContextType<TSchema> | null>;
}
