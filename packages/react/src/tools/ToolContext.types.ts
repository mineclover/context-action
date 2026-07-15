/**
 * @fileoverview ToolContext Type Definitions
 *
 * Type definitions for the ToolContext system - a unified tool registry
 * combining ActionContext patterns with Zod schema-based definitions.
 */

import {
  ActionHandler,
  ActionRegister,
  ActionSchemaMap,
  AnthropicToolDefinition,
  DispatchOptions,
  ExecutionResult,
  HandlerConfig,
  InferActionPayloadMap,
  MCPToolDefinition,
  ModelToolCall,
  OpenAIToolDefinition,
  ToolCallContext,
  ToolCallObserver,
  ToolCallOptions,
  ToolCallRequest,
  ToolCallResult,
  ToolListRequest,
  ToolListResult,
  ToolManagementInterface,
} from '@context-action/core';
import { ReactNode } from 'react';
import type { ProviderDispatchLifecycle } from '../actions/ActionContext.types';

// ============================================
// Tool Context Configuration
// ============================================

/**
 * Validation mode for tool execution
 */
export type ToolValidationMode = 'strict' | 'warn' | 'silent';

export type ToolPolicyDecision = 'allow' | 'ask' | 'deny';

export interface ToolPolicyInput {
  readonly request: ToolCallRequest;
  readonly definition: MCPToolDefinition;
  readonly context?: ToolCallContext;
  /** Abort signal for approval/policy work that may outlive the provider call. */
  readonly signal?: AbortSignal;
}

export type ToolPolicy = (
  input: ToolPolicyInput
) => ToolPolicyDecision | Promise<ToolPolicyDecision>;

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

  /** Optional execution allowlist applied to discovery and calls. */
  allowedToolNames?: readonly string[];

  /** Optional runtime policy for allow/ask/deny decisions. */
  toolPolicy?: ToolPolicy;

  /** Receives normalized tool lifecycle events for traces and audit UI. */
  onToolCall?: ToolCallObserver;
}

// ============================================
// Tool Registry Interface
// ============================================

/**
 * Tool Registry - provides access to all defined tools
 * and their export methods for LLM integration
 */
export interface ToolRegistry<TSchema extends ActionSchemaMap>
  extends ToolManagementInterface<MCPToolDefinition> {
  /** Get all tool definitions */
  readonly tools: TSchema;

  /** Get a specific tool by name */
  getTool<K extends keyof TSchema>(name: K): TSchema[K];

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

  /** Discover tools using the standard tools/list contract */
  listTools(request?: ToolListRequest): ToolListResult<MCPToolDefinition>;

  /** Resolve a canonical definition for one tool */
  getToolDefinition(name: string): MCPToolDefinition | undefined;

  /** Execute a canonical tools/call request */
  callTool(
    request: ToolCallRequest,
    options?: ToolCallOptions
  ): Promise<ToolCallResult>;

  /** Normalize and execute a model-side tool call */
  executeModelToolCall(
    call: ModelToolCall,
    options?: ToolCallOptions
  ): Promise<ToolCallResult>;
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
  dispatchLifecycle: ProviderDispatchLifecycle;
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
  useToolHandler: <K extends keyof TSchema, R = void>(
    toolName: K,
    handler: ActionHandler<InferActionPayloadMap<TSchema>[K], R>,
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
