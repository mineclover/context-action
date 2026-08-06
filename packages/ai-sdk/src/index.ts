/**
 * AI SDK v7 adapter for the Context-Action canonical tool boundary.
 *
 * This package intentionally depends on `ToolManagementInterface`, not React
 * or `ActionRegister`. It can therefore adapt a browser ToolContext, a server
 * manager, or an MCP-backed manager without creating another execution path.
 */

import {
  stringifyToolContent,
  type ToolCallContext,
  type ToolCallOptions,
  type ToolCallResult,
  type ToolDefinition,
  type ToolManagementInterface,
} from '@context-action/tool-protocol';
import {
  dynamicTool,
  jsonSchema,
  type ToolSet,
} from 'ai';

/** A model tool failure that should be surfaced by AI SDK as `tool-error`. */
export class AISDKToolExecutionError extends Error {
  override name = 'AISDKToolExecutionError';

  constructor(
    public readonly toolName: string,
    public readonly toolCallId: string,
    public readonly result: ToolCallResult,
  ) {
    super(
      result.error?.message || `Tool "${toolName}" failed during execution.`,
    );
    Object.setPrototypeOf(this, AISDKToolExecutionError.prototype);
  }
}

export type AISDKToolErrorMode = 'result' | 'throw';

export interface AISDKToolInvocation {
  readonly toolName: string;
  readonly toolCallId: string;
  readonly input: unknown;
  readonly definition: ToolDefinition;
  readonly sessionId: string;
}

/**
 * Maps a model tool invocation to a logical mutation identity.
 *
 * The default is the provider's `toolCallId`, while the canonical manager
 * already namespaces it by tool name and session. Return `undefined` to
 * disable replay protection for a particular call.
 */
export type AISDKToolIdempotencyKeyFactory = (
  invocation: AISDKToolInvocation,
) => string | undefined;

/**
 * Requests AI SDK's native approval turn before a sensitive tool executes.
 * ToolContext policy remains the final authorization boundary after approval.
 */
export type AISDKToolApprovalPolicy = boolean | (
  (invocation: Omit<AISDKToolInvocation, 'toolCallId'>) => boolean | Promise<boolean>
);

export interface AISDKToolSetOptions {
  /** Stable identifier for one model conversation or agent run. */
  readonly sessionId: string;

  /**
   * Explicit capability scope for this generation. Derive this from the active
   * ContextScope; use an empty array for a model turn that must not call tools.
   */
  readonly toolNames: readonly string[];

  /** Extra provenance fields; source/mode/session are adapter-owned. */
  readonly context?: Omit<ToolCallContext, 'source' | 'mode' | 'sessionId'>;

  /** Per-call execution budgets applied by the canonical manager. */
  readonly callOptions?: Omit<
    ToolCallOptions,
    'signal' | 'context' | 'idempotencyKey'
  >;

  /**
   * Defaults to the AI SDK `toolCallId`, which is safe for same-call retries.
   * Supply a domain operation identity when recovery must span a new model call.
   */
  readonly getIdempotencyKey?: AISDKToolIdempotencyKeyFactory;

  /** Native AI SDK approval gate, evaluated before the tool's execute function. */
  readonly needsApproval?: AISDKToolApprovalPolicy;

  /** Preserve canonical errors as data, or expose them as AI SDK tool errors. */
  readonly errorMode?: AISDKToolErrorMode;
}

export interface AISDKToolScope {
  /** Tool definitions ready for `generateText` or `streamText`. */
  readonly tools: ToolSet;
  /** Mirrors the exact capability scope for AI SDK's `activeTools` option. */
  readonly activeTools: readonly string[];
}

/**
 * Build an AI SDK ToolSet from the canonical manager.
 *
 * The returned `activeTools` is intentionally redundant with the ToolSet: it
 * documents and carries the same scope into AI SDK generation options, so a
 * caller cannot accidentally advertise a broader catalog than it executes.
 */
export function createAISDKToolScope(
  manager: ToolManagementInterface,
  options: AISDKToolSetOptions,
): AISDKToolScope {
  const sessionId = canonicalSessionId(options.sessionId);
  const definitions = resolveDefinitions(manager, options.toolNames);
  const activeTools = definitions.map((definition) => definition.name);
  const tools = Object.fromEntries(
    definitions.map((definition) => [
      definition.name,
      createAISDKTool(manager, definition, sessionId, options),
    ]),
  ) as ToolSet;

  return { tools, activeTools };
}

/** Convenience form for callers that do not need to pass `activeTools` separately. */
export function createAISDKTools(
  manager: ToolManagementInterface,
  options: AISDKToolSetOptions,
): ToolSet {
  return createAISDKToolScope(manager, options).tools;
}

function createAISDKTool(
  manager: ToolManagementInterface,
  definition: ToolDefinition,
  sessionId: string,
  options: AISDKToolSetOptions,
) {
  return dynamicTool({
    ...(definition.title === undefined ? {} : { title: definition.title }),
    ...(definition.description === undefined
      ? {}
      : { description: definition.description }),
    inputSchema: jsonSchema(definition.inputSchema),
    ...(definition.outputSchema === undefined
      ? {}
      : { outputSchema: jsonSchema(definition.outputSchema) }),
    ...(options.needsApproval === undefined
      ? {}
      : {
          needsApproval: toAISDKApprovalPolicy(
            options.needsApproval,
            definition,
            sessionId,
          ),
    }),
    execute: async (input, executionOptions) => {
      const toolCallId = canonicalToolCallId(executionOptions.toolCallId);
      const invocation: AISDKToolInvocation = {
        toolName: definition.name,
        toolCallId,
        input,
        definition,
        sessionId,
      };
      const result = await manager.executeModelToolCall(
        {
          id: toolCallId,
          name: definition.name,
          arguments: asToolArguments(input),
        },
        {
          ...options.callOptions,
          signal: executionOptions.abortSignal,
          idempotencyKey: options.getIdempotencyKey?.(invocation) ?? toolCallId,
          context: {
            ...options.context,
            source: 'model',
            mode: 'agent',
            sessionId,
          },
        },
      );

      if (result.isError) {
        if (options.errorMode === 'throw') {
          throw new AISDKToolExecutionError(
            definition.name,
            toolCallId,
            result,
          );
        }
        return toAISDKErrorResult(definition.name, result);
      }

      return result.structuredContent ?? {
        tool: definition.name,
        status: 'completed',
        message: stringifyToolContent(result.content),
      };
    },
  });
}

function toAISDKApprovalPolicy(
  policy: AISDKToolApprovalPolicy,
  definition: ToolDefinition,
  sessionId: string,
) {
  if (typeof policy !== 'function') return policy;
  return (input: unknown) => policy({
    toolName: definition.name,
    input,
    definition,
    sessionId,
  });
}

function resolveDefinitions(
  manager: ToolManagementInterface,
  requestedToolNames: readonly string[],
): ToolDefinition[] {
  if (!Array.isArray(requestedToolNames)) {
    throw new TypeError('AI SDK toolNames must be an array for every generation.');
  }
  const definitions: ToolDefinition[] = [];
  const seen = new Set<string>();
  for (const name of requestedToolNames) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new TypeError('AI SDK tool scope names must be non-empty strings.');
    }
    if (seen.has(name)) continue;
    seen.add(name);

    const definition = manager.getToolDefinition(name);
    if (!manager.hasTool(name) || definition === undefined) {
      throw new Error(`AI SDK tool scope contains unavailable tool "${name}".`);
    }
    if (definition.name !== name) {
      throw new Error(
        `AI SDK tool scope received a mismatched definition for "${name}".`,
      );
    }
    definitions.push(definition);
  }
  return definitions;
}

function canonicalSessionId(value: string): string {
  return canonicalVisibleIdentifier(value, 'sessionId');
}

function canonicalToolCallId(value: string): string {
  return canonicalVisibleIdentifier(value, 'toolCallId');
}

function canonicalVisibleIdentifier(value: string, label: string): string {
  if (typeof value !== 'string') {
    throw new TypeError(`AI SDK ${label} must be visible text within 256 characters.`);
  }
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > 256 ||
    /[\u0000-\u001F\u007F-\u009F]/u.test(normalized)
  ) {
    throw new TypeError(`AI SDK ${label} must be visible text within 256 characters.`);
  }
  return normalized;
}

function asToolArguments(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new TypeError('AI SDK tool input must be an object after schema validation.');
}

function toAISDKErrorResult(toolName: string, result: ToolCallResult) {
  const message = stringifyToolContent(result.content);
  return {
    tool: toolName,
    status: 'error' as const,
    error: result.error ?? {
      code: 'TOOL_EXECUTION_FAILED',
      message: message || `Tool ${toolName} failed`,
    },
    message,
  };
}
