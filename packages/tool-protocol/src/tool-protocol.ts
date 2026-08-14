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
} from './json-schema.js';
import type { ToolExecutionProvenance } from './execution-provenance.js';

/** Canonical error codes emitted by the managed tool-call boundary. */
export const TOOL_CALL_ERROR_CODES = {
  NOT_FOUND: 'TOOL_NOT_FOUND',
  NOT_ALLOWED: 'TOOL_NOT_ALLOWED',
  VALIDATION_FAILED: 'TOOL_VALIDATION_FAILED',
  OUTPUT_VALIDATION_FAILED: 'TOOL_OUTPUT_VALIDATION_FAILED',
  OUTPUT_LIMIT_EXCEEDED: 'TOOL_OUTPUT_LIMIT_EXCEEDED',
  RESULT_VALIDATION_FAILED: 'TOOL_RESULT_VALIDATION_FAILED',
  POLICY_FAILED: 'TOOL_POLICY_FAILED',
  POLICY_DENIED: 'TOOL_POLICY_DENIED',
  APPROVAL_REQUIRED: 'TOOL_APPROVAL_REQUIRED',
  CANCELLED: 'TOOL_CANCELLED',
  TIMEOUT: 'TOOL_TIMEOUT',
  INVALID_OPTIONS: 'TOOL_INVALID_OPTIONS',
  IDEMPOTENCY_CONFLICT: 'TOOL_IDEMPOTENCY_CONFLICT',
  IDEMPOTENCY_PENDING: 'TOOL_IDEMPOTENCY_PENDING',
  IDEMPOTENCY_UNKNOWN: 'TOOL_IDEMPOTENCY_UNKNOWN',
  IDEMPOTENCY_STORE_FAILED: 'TOOL_IDEMPOTENCY_STORE_FAILED',
  EXECUTION_ABORTED: 'TOOL_EXECUTION_ABORTED',
  /** The handler may have applied a partial external side effect. */
  EXECUTION_UNKNOWN: 'TOOL_EXECUTION_UNKNOWN',
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

/**
 * Provider-neutral approval snapshot for a pending tools/call request.
 *
 * The snapshot is intentionally metadata-only: an approval surface may
 * resolve it, but execution remains owned by the ToolManagementInterface.
 */
export interface ToolApprovalSnapshot {
  /** Queue-lifetime request ID used by `resolve`; distinct from `toolCallId`. */
  readonly id: string;
  readonly method: 'tools/call';
  readonly toolCallId?: ToolCallId;
  readonly sessionId?: string;
  readonly name: string;
  readonly description: string;
  readonly source: ToolCallSource;
  readonly mode?: ToolCallMode;
  readonly argumentKeys: readonly string[];
  readonly safeArgumentPreview?: string;
  readonly createdAt: number;
}

/** Decisions supported by a UI or host approval surface. */
export type ToolApprovalDecision = 'allow' | 'deny';

/** Provider-neutral input used to create a pending approval snapshot. */
export interface ToolApprovalRequestInput {
  readonly request: ToolCallRequest;
  readonly definition: ToolDefinition;
  readonly context?: ToolCallContext;
  readonly signal?: AbortSignal;
}

/** Request passed to a transport-neutral, canonical interaction boundary. */
export interface ToolInteractionRequest extends ToolApprovalRequestInput {
  readonly kind: 'approval' | 'user-interaction';
  readonly call: ModelToolCall;
}

/** An interaction may approve or deny policy-gated execution. */
export type ToolInteractionHandler = (
  request: ToolInteractionRequest,
) => Promise<'approved' | 'denied'>;

/** Configuration for a canonical approval queue. */
export interface ToolApprovalQueueOptions {
  readonly idPrefix?: string;
  readonly safeArgumentNames?: readonly string[];
}

/** Reactive snapshot boundary for approval surfaces. */
export interface ToolApprovalStore {
  readonly getSnapshot: () => readonly ToolApprovalSnapshot[];
  readonly subscribe: (listener: () => void) => () => void;
}

/** Shared approval lifecycle used by browser and host tool surfaces. */
export interface ToolApprovalQueue {
  readonly store: ToolApprovalStore;
  readonly request: (
    input: ToolApprovalRequestInput
  ) => Promise<ToolApprovalDecision>;
  readonly resolve: (id: string, decision: ToolApprovalDecision) => void;
  readonly denyAll: () => void;
}

/**
 * Create a provider-neutral approval queue for `tools/call` requests.
 *
 * The queue owns only metadata and promise resolution. It does not execute a
 * tool, persist arguments, or depend on React, so an application can attach a
 * browser dialog, a host prompt, or an audit surface to the same contract.
 */
export function createToolApprovalQueue(
  options: ToolApprovalQueueOptions = {}
): ToolApprovalQueue {
  let sequence = 0;
  let pending: ToolApprovalSnapshot[] = [];
  const pendingApprovals = new Map<
    string,
    {
      readonly approval: ToolApprovalSnapshot;
      readonly settle: (decision: ToolApprovalDecision) => void;
    }
  >();
  const listeners = new Set<() => void>();
  const safeArgumentNames = new Set(options.safeArgumentNames ?? []);
  const idPrefix = options.idPrefix ?? 'approval';

  const allocateApprovalId = (baseId: string): string => {
    // Every request receives a fresh queue-lifetime ID, including the first
    // request for a toolCallId. This prevents stale resolve calls from ever
    // targeting a later request without retaining an unbounded tombstone set.
    return `${baseId}-${sequence++}`;
  };

  const buildSafeArgumentPreview = (
    argumentsValue: Record<string, unknown> | undefined
  ): string | undefined => {
    const entries = Object.entries(argumentsValue ?? {}).filter(
      ([name, value]) =>
        safeArgumentNames.has(name) &&
        (typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean')
    );
    if (!entries.length) return undefined;
    return entries
      .map(([name, value]) => `${name}: ${String(value).slice(0, 120)}`)
      .join(' · ');
  };

  const notify = (): void => {
    for (const listener of listeners) listener();
  };

  const resolve = (id: string, decision: ToolApprovalDecision): void => {
    const pendingApproval = pendingApprovals.get(id);
    if (!pendingApproval) return;
    pendingApprovals.delete(id);
    pending = pending.filter(
      (approval) => approval !== pendingApproval.approval
    );
    notify();
    pendingApproval.settle(decision);
  };

  const request = (
    input: ToolApprovalRequestInput
  ): Promise<ToolApprovalDecision> => {
    if (input.signal?.aborted) return Promise.resolve('deny');

    const baseId = String(
      input.request.id ?? `${idPrefix}-${Date.now()}`
    );
    const id = allocateApprovalId(baseId);
    const approval: ToolApprovalSnapshot = {
      id,
      method: input.request.method,
      ...(input.request.id === undefined ? {} : { toolCallId: input.request.id }),
      ...(input.context?.sessionId
        ? { sessionId: input.context.sessionId }
        : {}),
      name: input.request.params.name,
      description: input.definition.description ?? 'No description provided.',
      source: input.context?.source ?? 'model',
      ...(input.context?.mode ? { mode: input.context.mode } : {}),
      argumentKeys: Object.keys(input.request.params.arguments ?? {}),
      safeArgumentPreview: buildSafeArgumentPreview(
        input.request.params.arguments
      ),
      createdAt: Date.now(),
    };

    return new Promise((resolvePromise) => {
      let abortHandler: (() => void) | undefined;
      const settle = (decision: ToolApprovalDecision): void => {
        if (abortHandler && input.signal) {
          input.signal.removeEventListener('abort', abortHandler);
        }
        resolvePromise(decision);
      };

      pending = [approval, ...pending];
      pendingApprovals.set(id, { approval, settle });
      if (input.signal) {
        abortHandler = () => resolve(id, 'deny');
        input.signal.addEventListener('abort', abortHandler, { once: true });
        if (input.signal.aborted) abortHandler();
      }
      notify();
    });
  };

  const denyAll = (): void => {
    for (const approval of [...pending]) resolve(approval.id, 'deny');
  };

  const store: ToolApprovalStore = {
    getSnapshot: (): readonly ToolApprovalSnapshot[] => pending,
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  return { store, request, resolve, denyAll };
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

/** Bounds a paged discovery walk without preventing explicit unbounded use. */
export interface ListAllToolsOptions {
  /** Maximum number of pages, including the first page. Defaults to 1000. */
  readonly maxPages?: number;
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

function isToolCallSource(value: unknown): value is ToolCallSource {
  return (
    value === 'model' ||
    value === 'mcp' ||
    value === 'iframe' ||
    value === 'local'
  );
}

function isToolCallMode(value: unknown): value is ToolCallMode {
  return value === 'agent' || value === 'direct';
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

/** Runtime guard for approval metadata crossing a UI or audit boundary. */
export function isToolApprovalSnapshot(
  value: unknown
): value is ToolApprovalSnapshot {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.id.trim().length === 0 ||
    value.method !== 'tools/call' ||
    typeof value.name !== 'string' ||
    value.name.trim().length === 0 ||
    typeof value.description !== 'string' ||
    !isToolCallSource(value.source) ||
    !Array.isArray(value.argumentKeys) ||
    !value.argumentKeys.every(
      (key) => typeof key === 'string' && key.trim().length > 0
    ) ||
    typeof value.createdAt !== 'number' ||
    !Number.isFinite(value.createdAt) ||
    value.createdAt < 0
  ) {
    return false;
  }
  if (value.toolCallId !== undefined && !isToolCallId(value.toolCallId)) {
    return false;
  }
  if (value.sessionId !== undefined && typeof value.sessionId !== 'string') {
    return false;
  }
  if (value.mode !== undefined && !isToolCallMode(value.mode)) {
    return false;
  }
  return (
    value.safeArgumentPreview === undefined ||
    typeof value.safeArgumentPreview === 'string'
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

/** Convert one canonical content block into a readable model/UI message. */
export function stringifyToolContentBlock(block: ToolContent): string {
  if (block.type === 'text') return block.text;
  try {
    return JSON.stringify(block.json) ?? '';
  } catch {
    return '[unserializable JSON content]';
  }
}

/** Convert canonical result content blocks without dropping structured JSON. */
export function stringifyToolContent(content: readonly ToolContent[]): string {
  return content.map(stringifyToolContentBlock).join('\n');
}

/** Standard tool result; content blocks and structuredContent are both preserved. */
export interface ToolCallResult<TResult = unknown> {
  readonly toolCallId?: ToolCallId;
  /** Content remains the stable transport surface; structuredContent carries JSON output. */
  readonly content: ToolContent[];
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

function isToolJsonContent(value: unknown): value is ToolJsonContent {
  return (
    isRecord(value) &&
    value.type === 'json' &&
    Object.getOwnPropertyDescriptor(value, 'json') !== undefined
  );
}

function isToolContent(value: unknown): value is ToolContent {
  return isToolTextContent(value) || isToolJsonContent(value);
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
  if (value.error !== undefined && value.isError !== true) return false;
  if (value.isError === true && value.error === undefined) return false;
  return value.content.every(isToolContent);
}

/** Transport-independent options accepted by a managed tool call. */
export interface ToolCallOptions {
  readonly signal?: AbortSignal;
  /** Wall-clock timeout covering policy evaluation and tool execution. */
  readonly timeout?: number;
  /** Optional output budget enforced at the canonical result boundary. */
  readonly maxOutputBytes?: number;
  /** Optional logical owner override for execution provenance. */
  readonly executionOwnerId?: string;
  /** Stable key for one logical mutation across provider retries. */
  readonly idempotencyKey?: string;
  /** Invoked only after argument validation and a policy `ask` decision. */
  readonly interaction?: ToolInteractionHandler;
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
      readonly provenance: ToolExecutionProvenance;
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
      readonly provenance: ToolExecutionProvenance;
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
 * handling. A repeated cursor and a configurable page limit are rejected so a
 * malformed remote manager cannot make an adapter loop forever.
 */
export function listAllTools<
  TDefinition extends ToolDefinition = ToolDefinition,
>(
  manager: Pick<ToolManagementInterface<TDefinition>, 'listTools'>,
  options: ListAllToolsOptions = {}
): TDefinition[] {
  const maxPages = options.maxPages ?? 1000;
  if (
    maxPages !== Infinity &&
    (!Number.isInteger(maxPages) || maxPages < 1)
  ) {
    throw new RangeError('listAllTools maxPages must be a positive integer or Infinity.');
  }

  const tools: TDefinition[] = [];
  const seenCursors = new Set<string>();
  let pageCount = 1;
  let page: unknown = manager.listTools(toToolListRequest());
  if (!isToolListResult<TDefinition>(page)) {
    throw new Error('Invalid tools/list result.');
  }

  tools.push(...page.tools);
  while (page.nextCursor !== undefined) {
    if (pageCount >= maxPages) {
      throw new Error('Invalid tools/list pagination: page limit exceeded.');
    }
    if (seenCursors.has(page.nextCursor)) {
      throw new Error('Invalid tools/list pagination: cursor did not advance.');
    }
    seenCursors.add(page.nextCursor);
    page = manager.listTools(toToolListRequest({ cursor: page.nextCursor }));
    if (!isToolListResult<TDefinition>(page)) {
      throw new Error('Invalid tools/list result.');
    }
    tools.push(...page.tools);
    pageCount += 1;
  }

  return tools;
}

/**
 * Convert one canonical tools/list definition into an OpenAI-compatible
 * function payload without consulting a second registry export.
 *
 * The input schema is preserved as-is so provider adapters do not silently
 * drop nested constraints, enums, descriptions, or additional-properties
 * policy while translating the transport envelope.
 */
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
  if (typeof message !== 'string' || !message.trim()) {
    throw new TypeError('createToolCallError requires a non-empty message.');
  }
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
