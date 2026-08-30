/**
 * @fileoverview Development-track ToolContext type definitions
 *
 * Repository source only: React 3 intentionally does not publish this as an
 * installed subpath. The registry combines React lifecycle with Tool Protocol
 * schemas and canonical tool-call contracts.
 */

import type { DispatchArgs } from '@context-action/core';
import {
  ActionHandler,
  ActionRegister,
  ActionResultHandler,
  DispatchOptions,
  ExecutionResult,
  HandlerConfig,
} from '@context-action/core';
import type {
  DurableOperationRecord,
  DurableOperationResolution,
  DurableOperationFence,
  DurableOperationStore,
} from '@context-action/tool-durable-operations';
import type {
  ActionSchemaMap,
  AnthropicToolDefinition,
  InferActionPayloadMap,
  InferActionInputMap,
  InferActionResultMap,
  MCPToolDefinition,
  ModelToolCall,
  OpenAIToolDefinition,
  ToolApprovalRequestInput,
  ToolCallContext,
  ToolCallObserver,
  ToolCallOptions,
  ToolCallRequest,
  ToolCallResult,
  ToolIdempotencyRegistryOptions,
  ToolListRequest,
  ToolListResult,
  ToolManagementInterface,
  ToolObservabilityPolicy,
} from '@context-action/tool-protocol';
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

/** Canonical input shared by runtime policy callbacks and approval queues. */
export type ToolPolicyInput = ToolApprovalRequestInput;

export type ToolPolicy = (
  input: ToolPolicyInput
) => ToolPolicyDecision | Promise<ToolPolicyDecision>;

/**
 * Domain-owned decision used by `recoverOperation` after an unknown durable
 * operation has been queried, compensated, or confirmed by the application.
 */
export type ToolOperationRecoveryResolver = (
  record: DurableOperationRecord<ToolCallResult>,
  context?: ToolCallContext
) => DurableOperationResolution<ToolCallResult> | Promise<DurableOperationResolution<ToolCallResult>>;

/**
 * Configuration options for createToolContext
 */
export interface ToolContextConfig<TSchema extends ActionSchemaMap> {
  /**
   * Tool schema map (required). The factory snapshots map membership; create
   * a new context rather than mutating this object to change the catalog.
   */
  schema: TSchema;

  /**
   * Validation mode for tool execution.
   * - 'strict': canonical tools/call returns a validation error before policy
   *   or handlers and passes parsed defaults/transforms to the handler.
   * - 'warn' and 'silent': preserve ActionRegister's permissive raw-dispatch
   *   behavior.
   */
  validationMode?: ToolValidationMode;

  /**
   * Enable/disable validation on dispatch
   * @default true
   */
  validateOnDispatch?: boolean;

  /** Enable debug logging */
  debug?: boolean;

  /**
   * Optional execution allowlist applied to discovery and calls. The factory
   * snapshots this list, so later caller mutations do not change the catalog.
   */
  allowedToolNames?: readonly string[];

  /** Optional page size for canonical tools/list discovery. Defaults to all tools. */
  toolListPageSize?: number;

  /** Optional runtime policy for allow/ask/deny decisions. */
  toolPolicy?: ToolPolicy;

  /** Receives normalized tool lifecycle events for traces and audit UI. */
  onToolCall?: ToolCallObserver;

  /** Stable logical owner recorded in tool-call execution provenance. */
  executionOwnerId?: string;

  /**
   * Bounded in-memory replay guard for calls that provide idempotencyKey.
   * Durable stores belong at the application/server mutation boundary.
   */
  idempotency?: ToolIdempotencyRegistryOptions;

  /** Optional durable record store for cross-reload/process mutation recovery. */
  durableOperationStore?: DurableOperationStore<ToolCallResult>;

  /** Stable process/worker identity used for durable operation ownership. */
  durableOperationOwnerId?: string;

  /** Pending-operation lease duration. Defaults to five minutes. */
  durableOperationLeaseMs?: number;

  /**
   * Policy used when durable failed/unknown diagnostics are projected.
   * Create it with `createToolObservabilityPolicy()`; the shared default is
   * used when omitted.
   */
  durableDiagnosticPolicy?: ToolObservabilityPolicy;
}

// ============================================
// Tool Registry Interface
// ============================================

/**
 * Source-track Tool Registry. It owns canonical discovery and calls, while
 * compatibility exporters remain available for provider adapters.
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

  /** Compatibility export. Prefer listTools() for new provider adapters. */
  toMCP(): MCPToolDefinition[];

  /** Compatibility export. Prefer listTools() for new provider adapters. */
  toOpenAI(): OpenAIToolDefinition[];

  /** Compatibility export. Prefer listTools() for new provider adapters. */
  toAnthropic(): AnthropicToolDefinition[];

  /** Compatibility export. Prefer getToolDefinition() for a single tool. */
  toMCPFiltered<K extends keyof TSchema>(toolNames: K[]): MCPToolDefinition[];

  /** Compatibility export. Prefer getToolDefinition() for a single tool. */
  toOpenAIFiltered<K extends keyof TSchema>(toolNames: K[]): OpenAIToolDefinition[];

  /** Compatibility export. Prefer getToolDefinition() for a single tool. */
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

  /** Query a durable operation without starting or retrying its handler. */
  getOperationStatus(
    toolName: string,
    idempotencyKey: string,
    context?: ToolCallContext
  ): Promise<DurableOperationRecord<ToolCallResult> | undefined>;

  /**
   * Record a domain-confirmed outcome for an `unknown` durable operation.
   * This does not invoke the tool handler or decide whether compensation is
   * safe; the caller owns that domain decision. Pass the full fence captured
   * with the unknown record as the fifth argument. The omitted and numeric
   * legacy forms remain in the positional ABI but fail closed at runtime;
   * use the full fence or `recoverOperation()`.
   */
  reconcileOperation(
    toolName: string,
    idempotencyKey: string,
    resolution: DurableOperationResolution<ToolCallResult>,
    context?: ToolCallContext,
    expectedFence?: DurableOperationFence | number
  ): Promise<DurableOperationRecord<ToolCallResult> | undefined>;

  /**
   * Query an operation and invoke the resolver only for an unknown record.
   * The resolver owns domain status checks and compensation; this method never
   * starts the tool handler and reconciles with the observed full fence.
   */
  recoverOperation(
    toolName: string,
    idempotencyKey: string,
    resolver: ToolOperationRecoveryResolver,
    context?: ToolCallContext
  ): Promise<DurableOperationRecord<ToolCallResult> | undefined>;
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
 * Raw ActionRegister dispatch retained for ActionContext compatibility.
 * It bypasses canonical policy, lifecycle observation, idempotency, durable
 * operation handling, and output budgets.
 *
 * @deprecated Use ToolCallFunction through useToolCall() for new invocations.
 */
export type ToolDispatchFunction<TPayloadMap> = <K extends Extract<keyof TPayloadMap, string>>(
  toolName: K,
  payload: TPayloadMap[K],
  options?: DispatchOptions
) => Promise<void>;

/**
 * Options for a direct React-originated canonical tool call. ToolContext
 * accepts timeout only as a safe integer from 0 through 2,147,483,647 ms so
 * lifecycle provenance and the JavaScript timer keep the same contract.
 */
export interface DirectToolCallOptions extends ToolCallOptions {
  /** Optional stable ID used to correlate the canonical `tools/call` request. */
  readonly toolCallId?: ToolCallRequest['id'];
}

/**
 * The canonical UI-side tool invocation contract.
 *
 * Unlike the raw dispatch hooks, this always crosses the ToolRegistry boundary
 * and therefore applies policy, lifecycle observation, output budgets,
 * idempotency, and durable-operation handling. Strict handlers receive parsed
 * defaults and transforms, while the canonical request and durable fingerprint
 * retain the original transport arguments. Callers use the unparsed Zod input
 * map, so defaulted fields may be omitted when the parameter schema allows it.
 * The returned structuredContent type is selected from the action result map.
 */
export type ToolCallFunction<TInputMap, TResultMap = {}> = <K extends Extract<keyof TInputMap, string>>(
  toolName: K,
  payload: TInputMap[K],
  options?: DirectToolCallOptions
) => Promise<ToolCallResult<K extends keyof TResultMap ? TResultMap[K] : unknown>>;

/**
 * Raw ActionRegister result helpers for advanced compatibility integrations.
 * They do not cross the canonical ToolRegistry boundary.
 */
export interface ToolDispatchWithResultReturn<TPayloadMap> {
  dispatch: ToolDispatchFunction<TPayloadMap>;
  dispatchWithResult: <K extends Extract<keyof TPayloadMap, string>, R = void>(
    toolName: K,
    ...args: DispatchArgs<TPayloadMap[K]>
  ) => Promise<ToolExecutionResult<R>>;
  abortAll: () => void;
}

// ============================================
// createToolContext Return Type
// ============================================

/**
 * Return type for the source-only createToolContext factory.
 */
export interface ToolContextReturn<TSchema extends ActionSchemaMap> {
  /** Provider component that wraps children with tool context */
  Provider: React.FC<{ children: ReactNode }>;

  /**
   * Raw ActionRegister dispatch retained for compatibility.
   * @deprecated Use useToolCall() for new tool invocations.
   */
  useToolDispatch: () => ToolDispatchFunction<InferActionPayloadMap<TSchema>>;

  /**
   * Invoke a tool through the canonical `tools/call` path.
   * Direct UI calls accept unparsed Zod input and default to
   * `{ source: 'local', mode: 'direct' }`.
   */
  useToolCall: () => ToolCallFunction<
    InferActionInputMap<TSchema>,
    InferActionResultMap<TSchema>
  >;

  /**
   * Register a legacy tool handler with the full PipelineController.
   * Use this only when its control-flow capabilities are required.
   */
  useToolHandler: <K extends Extract<keyof TSchema, string>, R = void>(
    toolName: K,
    handler: ActionHandler<InferActionPayloadMap<TSchema>[K], R>,
    config?: HandlerConfig<InferActionPayloadMap<TSchema>[K]>
  ) => void;

  /**
   * Register a result-producing handler in core's explicit result phase.
   * It receives the narrower result controller; retain useToolHandler() when
   * a legacy full PipelineController is required.
   */
  useToolResultHandler: <K extends Extract<keyof TSchema, string>>(
    toolName: K,
    handler: ActionResultHandler<
      InferActionPayloadMap<TSchema>[K],
      InferActionResultMap<TSchema>[K]
    >,
    config?: HandlerConfig<InferActionPayloadMap<TSchema>[K]>
  ) => void;

  /**
   * Hook to access the canonical registry. Prefer listTools(),
   * getToolDefinition(), and callTool() for new integrations.
   */
  useToolRegistry: () => ToolRegistry<TSchema>;

  /**
   * Raw ActionRegister result API for advanced compatibility integrations.
   * It does not cross the canonical ToolRegistry boundary.
   */
  useToolDispatchWithResult: () => ToolDispatchWithResultReturn<InferActionPayloadMap<TSchema>>;

  /**
   * Hook to access raw ActionRegister for advanced integrations. It bypasses
   * the canonical ToolRegistry boundary.
   */
  useActionRegister: () => ActionRegister<InferActionPayloadMap<TSchema>> | null;

  /** The underlying React Context */
  context: React.Context<ToolContextType<TSchema> | null>;
}
