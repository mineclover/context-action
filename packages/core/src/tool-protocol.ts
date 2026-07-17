/**
 * @fileoverview Standard tool protocol contracts
 *
 * Shared contracts for the browser/server boundary:
 * tools/list -> model tool call -> tools/call -> tool result.
 *
 * The contracts intentionally stay transport-agnostic. MCP, OpenAI-compatible
 * providers, and local ToolContext adapters can all map to these shapes.
 */

import type {
  AnthropicToolDefinition,
  JSONSchema,
  OpenAIToolDefinition,
  ToolDefinition,
} from './json-schema';

/** Canonical error codes emitted by the managed tool-call boundary. */
export const TOOL_CALL_ERROR_CODES = {
  NOT_FOUND: 'TOOL_NOT_FOUND',
  NOT_ALLOWED: 'TOOL_NOT_ALLOWED',
  VALIDATION_FAILED: 'TOOL_VALIDATION_FAILED',
  OUTPUT_VALIDATION_FAILED: 'TOOL_OUTPUT_VALIDATION_FAILED',
  RESULT_VALIDATION_FAILED: 'TOOL_RESULT_VALIDATION_FAILED',
  POLICY_FAILED: 'TOOL_POLICY_FAILED',
  POLICY_DENIED: 'TOOL_POLICY_DENIED',
  APPROVAL_REQUIRED: 'TOOL_APPROVAL_REQUIRED',
  CANCELLED: 'TOOL_CANCELLED',
  EXECUTION_ABORTED: 'TOOL_EXECUTION_ABORTED',
  EXECUTION_FAILED: 'TOOL_EXECUTION_FAILED',
  REGISTRY_NOT_READY: 'TOOL_REGISTRY_NOT_READY',
} as const;

export type ToolCallErrorCode =
  (typeof TOOL_CALL_ERROR_CODES)[keyof typeof TOOL_CALL_ERROR_CODES];

/** Arguments passed to a tool call after provider-specific normalization. */
export type ToolArguments = Record<string, unknown>;

/** Provider-neutral identifier used to correlate a model call and its result. */
export type ToolCallId = string | number;

/** Origin metadata carried through the tool execution boundary. */
export type ToolCallSource = 'model' | 'mcp' | 'iframe' | 'local';

/** Execution intent, independent of the transport source. */
export type ToolCallMode = 'agent' | 'direct';

export interface ToolCallContext {
  readonly source?: ToolCallSource;
  /** `agent` is model/prompt orchestration; `direct` is an explicit command. */
  readonly mode?: ToolCallMode;
  readonly sessionId?: string;
  /** Provider/session revision token; browser workspaces commonly use a number. */
  readonly revision?: string | number;
  readonly metadata?: Record<string, unknown>;
}

/** Structured error returned to the model instead of leaking an exception. */
export interface ToolCallError {
  /** Canonical codes are listed in TOOL_CALL_ERROR_CODES; applications may add their own. */
  readonly code: string;
  readonly message: string;
  readonly retryable?: boolean;
  readonly details?: unknown;
}

/** Metadata that a handler error may carry into the canonical tool result. */
export type ToolCallErrorMetadata = Partial<
  Pick<ToolCallError, 'code' | 'retryable' | 'details'>
>;

/**
 * Read optional structured error metadata from a handler-thrown value.
 * Applications can use a custom Error subclass without coupling handlers to a
 * transport-specific result object.
 */
export function getToolCallErrorMetadata(
  error: unknown
): ToolCallErrorMetadata {
  if (!error || typeof error !== 'object') return {};
  const candidate = error as Record<string, unknown>;
  const code =
    typeof candidate.code === 'string' && candidate.code.trim()
      ? candidate.code
      : undefined;
  const retryable =
    typeof candidate.retryable === 'boolean' ? candidate.retryable : undefined;
  return {
    ...(code === undefined ? {} : { code }),
    ...(retryable === undefined ? {} : { retryable }),
    ...('details' in candidate ? { details: candidate.details } : {}),
  };
}

/** JSON-RPC-shaped request for MCP tools/list. */
export interface ToolListRequest {
  readonly method: 'tools/list';
  readonly params?: {
    readonly cursor?: string;
  };
}

/** Options for creating a canonical tools/list request. */
export interface ToolListRequestOptions {
  readonly cursor?: string;
}

/** Result returned by a tools/list manager. */
export interface ToolListResult<
  TDefinition extends ToolDefinition = ToolDefinition,
> {
  readonly tools: TDefinition[];
  readonly nextCursor?: string;
}

/** JSON-RPC-shaped request for MCP tools/call. */
export interface ToolCallRequest {
  readonly id?: ToolCallId;
  readonly method: 'tools/call';
  readonly params: {
    readonly name: string;
    readonly arguments?: ToolArguments;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isToolCallId(value: unknown): value is ToolCallId {
  return (
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

function isToolDefinition(value: unknown): value is ToolDefinition {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    isRecord(value.inputSchema)
  );
}

/** Runtime guard for JSON received at the canonical tools/list boundary. */
export function isToolListRequest(value: unknown): value is ToolListRequest {
  if (!isRecord(value) || value.method !== 'tools/list') return false;
  if (value.params === undefined) return true;
  if (!isRecord(value.params)) return false;
  return value.params.cursor === undefined || typeof value.params.cursor === 'string';
}

/** Runtime guard for JSON returned by the canonical tools/list boundary. */
export function isToolListResult<
  TDefinition extends ToolDefinition = ToolDefinition,
>(value: unknown): value is ToolListResult<TDefinition> {
  if (!isRecord(value) || !Array.isArray(value.tools)) return false;
  if (
    value.nextCursor !== undefined &&
    typeof value.nextCursor !== 'string'
  ) {
    return false;
  }
  return value.tools.every(isToolDefinition);
}

/** Runtime guard for JSON received at the canonical tools/call boundary. */
export function isToolCallRequest(value: unknown): value is ToolCallRequest {
  if (!isRecord(value) || value.method !== 'tools/call') return false;
  if (!isRecord(value.params) || typeof value.params.name !== 'string') {
    return false;
  }
  if (!value.params.name.trim()) return false;
  if (value.id !== undefined && !isToolCallId(value.id)) return false;
  return (
    value.params.arguments === undefined || isRecord(value.params.arguments)
  );
}

/** Canonical model-side tool call before it is wrapped as tools/call. */
export interface ModelToolCall {
  readonly id?: ToolCallId;
  readonly name: string;
  readonly arguments?: ToolArguments;
}

/** Text content block shared by the current ToolContext result bridge. */
export interface ToolTextContent {
  readonly type: 'text';
  readonly text: string;
}

export interface ToolJsonContent {
  readonly type: 'json';
  readonly json: unknown;
}

export type ToolContent = ToolTextContent | ToolJsonContent;

/** Standard tool result; structuredContent preserves non-text handler output. */
export interface ToolCallResult<TResult = unknown> {
  readonly toolCallId?: ToolCallId;
  /** Text remains the stable transport surface; structuredContent carries JSON output. */
  readonly content: ToolTextContent[];
  readonly structuredContent?: TResult;
  readonly isError?: boolean;
  readonly error?: ToolCallError;
}

function isToolCallError(value: unknown): value is ToolCallError {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    value.code.trim().length > 0 &&
    typeof value.message === 'string' &&
    value.message.trim().length > 0 &&
    (value.retryable === undefined || typeof value.retryable === 'boolean')
  );
}

function isToolTextContent(value: unknown): value is ToolTextContent {
  return (
    isRecord(value) && value.type === 'text' && typeof value.text === 'string'
  );
}

/** Runtime guard for JSON returned by the canonical tools/call boundary. */
export function isToolCallResult<TResult = unknown>(
  value: unknown
): value is ToolCallResult<TResult> {
  if (!isRecord(value) || !Array.isArray(value.content)) return false;
  if (value.toolCallId !== undefined && !isToolCallId(value.toolCallId)) {
    return false;
  }
  if (value.isError !== undefined && typeof value.isError !== 'boolean') {
    return false;
  }
  if (value.error !== undefined && !isToolCallError(value.error)) {
    return false;
  }
  return value.content.every(isToolTextContent);
}

/** Transport-independent options accepted by a managed tool call. */
export interface ToolCallOptions {
  readonly signal?: AbortSignal;
  readonly context?: ToolCallContext;
}

export type ToolCallEvent =
  | {
      readonly type: 'started';
      readonly toolCallId?: ToolCallId;
      readonly name: string;
      /** Canonical tools/call request correlated with this lifecycle event. */
      readonly request: ToolCallRequest;
      readonly context?: ToolCallContext;
      readonly timestamp: number;
    }
  | {
      readonly type: 'completed' | 'failed';
      readonly toolCallId?: ToolCallId;
      readonly name: string;
      /** Canonical tools/call request correlated with this lifecycle event. */
      readonly request: ToolCallRequest;
      readonly context?: ToolCallContext;
      readonly timestamp: number;
      readonly durationMs: number;
      readonly result: ToolCallResult;
    };

export type ToolCallObserver = (event: ToolCallEvent) => void;

/**
 * Management surface implemented by a ToolContext-backed registry.
 *
 * `listTools` and `callTool` are the canonical boundaries. Existing format
 * exporters remain available for provider adapters, but should delegate to
 * these methods rather than inventing another execution contract.
 */
export interface ToolManagementInterface<
  TDefinition extends ToolDefinition = ToolDefinition,
> {
  listTools(request?: ToolListRequest): ToolListResult<TDefinition>;
  getToolDefinition(name: string): TDefinition | undefined;
  hasTool(name: string): boolean;
  callTool(
    request: ToolCallRequest,
    options?: ToolCallOptions
  ): Promise<ToolCallResult>;
  executeModelToolCall(
    call: ModelToolCall,
    options?: ToolCallOptions
  ): Promise<ToolCallResult>;
}

/** Create a tools/call request from a provider-neutral model tool call. */
export function toToolCallRequest(call: ModelToolCall): ToolCallRequest {
  return {
    ...(call.id === undefined ? {} : { id: call.id }),
    method: 'tools/call',
    params: {
      name: call.name,
      arguments: call.arguments ?? {},
    },
  };
}

/** Create an MCP-compatible tools/list request with an optional cursor. */
export function toToolListRequest(
  options?: ToolListRequestOptions
): ToolListRequest {
  return {
    method: 'tools/list',
    ...(options?.cursor === undefined
      ? {}
      : { params: { cursor: options.cursor } }),
  };
}

/**
 * Collect every page from a canonical tools/list manager.
 *
 * Provider adapters may use a paged registry without reimplementing cursor
 * handling. A repeated cursor is rejected so a malformed remote manager cannot
 * make an adapter loop forever.
 */
export function listAllTools<
  TDefinition extends ToolDefinition = ToolDefinition,
>(
  manager: Pick<ToolManagementInterface<TDefinition>, 'listTools'>
): TDefinition[] {
  const tools: TDefinition[] = [];
  const seenCursors = new Set<string>();
  let page: unknown = manager.listTools(toToolListRequest());
  if (!isToolListResult<TDefinition>(page)) {
    throw new Error('Invalid tools/list result.');
  }

  tools.push(...page.tools);
  while (page.nextCursor !== undefined) {
    if (seenCursors.has(page.nextCursor)) {
      throw new Error('Invalid tools/list pagination: cursor did not advance.');
    }
    seenCursors.add(page.nextCursor);
    page = manager.listTools(toToolListRequest({ cursor: page.nextCursor }));
    if (!isToolListResult<TDefinition>(page)) {
      throw new Error('Invalid tools/list result.');
    }
    tools.push(...page.tools);
  }

  return tools;
}

/**
 * Convert the canonical tools/list definitions into an OpenAI-compatible
 * function payload without consulting a second registry export.
 *
 * The input schema is preserved as-is so provider adapters do not silently
 * drop nested constraints, enums, descriptions, or additional-properties
 * policy while translating the transport envelope.
 */
/** Convert one canonical tools/list definition to an OpenAI function tool. */
export function toOpenAIToolDefinition(
  definition: ToolDefinition
): OpenAIToolDefinition {
  return {
    type: 'function',
    function: {
      name: definition.name,
      ...(definition.description === undefined
        ? {}
        : { description: definition.description }),
      parameters: definition.inputSchema,
    },
  };
}

/** Convert canonical tools/list definitions to OpenAI function tools. */
export function toOpenAIToolDefinitions(
  definitions: readonly ToolDefinition[]
): OpenAIToolDefinition[] {
  return definitions.map(toOpenAIToolDefinition);
}

/** Convert one canonical tools/list definition to an Anthropic tool. */
export function toAnthropicToolDefinition(
  definition: ToolDefinition
): AnthropicToolDefinition {
  return {
    name: definition.name,
    ...(definition.description === undefined
      ? {}
      : { description: definition.description }),
    input_schema: definition.inputSchema,
  };
}

/** Convert canonical tools/list definitions to Anthropic tools. */
export function toAnthropicToolDefinitions(
  definitions: readonly ToolDefinition[]
): AnthropicToolDefinition[] {
  return definitions.map(toAnthropicToolDefinition);
}

export function withToolCallId<TResult>(
  result: ToolCallResult<TResult>,
  toolCallId: ToolCallId | undefined
): ToolCallResult<TResult> {
  return toolCallId === undefined ? result : { ...result, toolCallId };
}

/** Create a successful result while preserving the handler's structured value. */
export function createToolCallSuccess<TResult>(
  value: TResult | undefined,
  options?: { readonly toolCallId?: ToolCallId }
): ToolCallResult<TResult> {
  const text = value === undefined ? 'Tool completed successfully.' : stringifyToolValue(value);

  return {
    ...(options?.toolCallId === undefined ? {} : { toolCallId: options.toolCallId }),
    content: [{ type: 'text', text }],
    ...(value === undefined ? {} : { structuredContent: value }),
  };
}

/** Create an MCP-compatible tool error without throwing across the tool boundary. */
export function createToolCallError(
  message: string,
  options?: {
    readonly code?: string;
    readonly details?: unknown;
    readonly retryable?: boolean;
    readonly toolCallId?: ToolCallId;
  }
): ToolCallResult<never> {
  return {
    ...(options?.toolCallId === undefined ? {} : { toolCallId: options.toolCallId }),
    content: [{ type: 'text', text: message }],
    error: {
      code: options?.code ?? TOOL_CALL_ERROR_CODES.EXECUTION_FAILED,
      message,
      ...(options?.details === undefined ? {} : { details: options.details }),
      ...(options?.retryable === undefined ? {} : { retryable: options.retryable }),
    },
    isError: true,
  };
}

function stringifyToolValue(value: unknown): string {
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/** Keep JSON Schema visible from the protocol module for adapter authors. */
export type { JSONSchema };
