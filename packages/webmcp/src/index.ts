/**
 * WebMCP imperative API adapter for canonical Context-Action tool managers.
 *
 * This package deliberately exposes browser tools without creating another
 * tool registry or execution path. ToolContext/ToolManagementInterface remains
 * responsible for validation, authorization, approvals, and durability.
 */
import {
  stringifyToolContent,
  type JSONSchema,
  type ToolCallContext,
  type ToolCallOptions,
  type ToolCallResult,
  type ToolDefinition,
  type ToolManagementInterface,
} from '@context-action/tool-protocol';

export interface WebMCPToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: JSONSchema;
  readonly annotations?: ToolDefinition['annotations'];
  readonly execute: (input: Record<string, unknown>) => Promise<unknown>;
}

export interface WebMCPRegistrationOptions {
  readonly signal?: AbortSignal;
  readonly exposedTo?: readonly string[];
}

/** Structural API shape so this package has no dependency on experimental DOM typings. */
export interface WebMCPModelContext {
  registerTool(
    tool: WebMCPToolDefinition,
    options?: WebMCPRegistrationOptions,
  ): Promise<void>;
}

export interface WebMCPDocument {
  readonly modelContext?: WebMCPModelContext;
}

export interface WebMCPToolInvocation {
  readonly toolName: string;
  readonly toolCallId: string;
  readonly input: Record<string, unknown>;
  readonly definition: ToolDefinition;
  readonly sessionId: string;
}

export type WebMCPIdempotencyKeyFactory = (
  invocation: WebMCPToolInvocation,
) => string | undefined;

export interface WebMCPToolScopeOptions {
  /** Stable identity for the page agent session. */
  readonly sessionId: string;
  /** Explicit capability scope; an omitted list never exposes a whole registry. */
  readonly toolNames: readonly string[];
  /** Defaults to the ambient browser document when it is available. */
  readonly document?: WebMCPDocument;
  /** Optional cross-origin documents allowed to discover and execute these tools. */
  readonly exposedTo?: readonly string[];
  /** Unregister all registered tools when aborted. */
  readonly signal?: AbortSignal;
  readonly context?: Omit<ToolCallContext, 'source' | 'mode' | 'sessionId'>;
  readonly callOptions?: Omit<ToolCallOptions, 'signal' | 'context' | 'idempotencyKey'>;
  readonly getIdempotencyKey?: WebMCPIdempotencyKeyFactory;
}

export interface WebMCPToolScope {
  /** Whether this page exposes the experimental WebMCP API. */
  readonly supported: boolean;
  /** Names successfully registered with the page's model context. */
  readonly activeTools: readonly string[];
  /** Abort the registration signal and unregister every tool in this scope. */
  readonly dispose: () => void;
}

/**
 * Register an explicit canonical capability scope with WebMCP's imperative
 * API. Unsupported browsers return an inert scope instead of failing SSR or
 * non-browser consumers.
 */
export async function createWebMCPToolScope(
  manager: ToolManagementInterface,
  options: WebMCPToolScopeOptions,
): Promise<WebMCPToolScope> {
  const sessionId = canonicalSessionId(options.sessionId);
  const definitions = resolveDefinitions(manager, options.toolNames);
  const documentRef = options.document ?? getAmbientDocument();
  const modelContext = documentRef?.modelContext;
  if (!modelContext) return unsupportedScope();

  const exposedTo = normalizeExposedOrigins(options.exposedTo);
  const controller = new AbortController();
  const abortExternal = () => controller.abort(options.signal?.reason);
  if (options.signal) {
    if (options.signal.aborted) abortExternal();
    else options.signal.addEventListener('abort', abortExternal, { once: true });
  }

  let sequence = 0;
  const dispose = () => {
    controller.abort();
    options.signal?.removeEventListener('abort', abortExternal);
  };

  if (controller.signal.aborted) return { supported: true, activeTools: [], dispose };

  try {
    for (const definition of definitions) {
      await modelContext.registerTool({
        name: definition.name,
        description: definition.description ?? `Execute ${definition.name}.`,
        inputSchema: definition.inputSchema,
        ...(definition.annotations === undefined ? {} : { annotations: definition.annotations }),
        execute: async (input) => {
          const toolCallId = `webmcp:${sessionId}:${definition.name}:${++sequence}`;
          const invocation: WebMCPToolInvocation = {
            toolName: definition.name,
            toolCallId,
            input,
            definition,
            sessionId,
          };
          const result = await manager.executeModelToolCall({
            id: toolCallId,
            name: definition.name,
            arguments: input,
          }, {
            ...options.callOptions,
            signal: controller.signal,
            idempotencyKey: options.getIdempotencyKey
              ? options.getIdempotencyKey(invocation)
              : toolCallId,
            context: {
              ...options.context,
              source: 'model',
              mode: 'agent',
              sessionId,
              metadata: {
                ...options.context?.metadata,
                transport: 'webmcp',
              },
            },
          });
          return toWebMCPResult(result);
        },
      }, {
        signal: controller.signal,
        ...(exposedTo.length === 0 ? {} : { exposedTo }),
      });
    }
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    supported: true,
    activeTools: definitions.map(definition => definition.name),
    dispose,
  };
}

function unsupportedScope(): WebMCPToolScope {
  return { supported: false, activeTools: [], dispose: () => {} };
}

function getAmbientDocument(): WebMCPDocument | undefined {
  if (typeof document === 'undefined') return undefined;
  return document as unknown as WebMCPDocument;
}

function canonicalSessionId(value: string): string {
  const sessionId = value.trim();
  const hasControlCharacter = [...sessionId].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
  if (!sessionId || hasControlCharacter) {
    throw new TypeError('WebMCP sessionId must be a non-empty printable string.');
  }
  return sessionId;
}

function resolveDefinitions(
  manager: ToolManagementInterface,
  toolNames: readonly string[],
): ToolDefinition[] {
  if (!Array.isArray(toolNames)) {
    throw new TypeError('WebMCP toolNames must be an array.');
  }
  const seen = new Set<string>();
  return toolNames.map((name) => {
    if (typeof name !== 'string' || !name.trim()) {
      throw new TypeError('WebMCP toolNames must contain non-empty strings.');
    }
    if (seen.has(name)) throw new Error(`WebMCP tool scope has duplicate tool "${name}".`);
    seen.add(name);
    const definition = manager.getToolDefinition(name);
    if (!definition) throw new Error(`WebMCP tool scope contains unavailable tool "${name}".`);
    if (definition.name !== name) {
      throw new Error(`WebMCP tool scope received mismatched definition for "${name}".`);
    }
    return definition;
  });
}

function normalizeExposedOrigins(origins: readonly string[] | undefined): readonly string[] {
  if (origins === undefined) return [];
  const seen = new Set<string>();
  return origins.map((value) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new TypeError(`WebMCP exposedTo contains an invalid origin: "${value}".`);
    }
    const localHttp = url.protocol === 'http:' && (
      url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]'
    );
    if ((url.protocol !== 'https:' && !localHttp) || url.origin !== value) {
      throw new TypeError(`WebMCP exposedTo requires a secure origin: "${value}".`);
    }
    if (seen.has(value)) throw new Error(`WebMCP exposedTo contains duplicate origin "${value}".`);
    seen.add(value);
    return value;
  });
}

function toWebMCPResult(result: ToolCallResult): unknown {
  if (!result.isError && result.structuredContent !== undefined) {
    return result.structuredContent;
  }
  if (!result.isError) return stringifyToolContent(result.content);
  return {
    isError: true,
    content: result.content,
    ...(result.error === undefined ? {} : { error: result.error }),
  };
}
