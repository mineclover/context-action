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
  type ToolInteractionHandler,
  type ToolDefinition,
  type ToolManagementInterface,
} from '@context-action/tool-protocol';

export interface WebMCPToolDefinition {
  readonly name: string;
  readonly title?: string;
  readonly description: string;
  readonly inputSchema: JSONSchema;
  readonly annotations?: WebMCPAnnotations;
  /** Current WebMCP Draft callback shape: exactly one input object. */
  readonly execute: (input: Record<string, unknown>) => Promise<unknown>;
}

/** The current Draft exposes only these annotations to page agents. */
export interface WebMCPAnnotations {
  readonly readOnlyHint?: boolean;
  readonly untrustedContentHint?: boolean;
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

/**
 * Isolates the volatile browser API surface from the canonical tool manager.
 * Profiles may adapt callback/registration shapes, but must receive the same
 * normalized browser tool definition.
 */
export interface WebMCPRuntimeProfile<TDocument = unknown> {
  readonly id: string;
  isSupported(document: unknown): document is TDocument;
  registerTool(
    document: TDocument,
    tool: WebMCPToolDefinition,
    options: WebMCPRegistrationOptions,
  ): Promise<void>;
}

/** Current browser draft profile. */
export const currentWebMCPProfile: WebMCPRuntimeProfile<WebMCPDocument> = {
  id: 'webmcp-current',
  isSupported(document): document is WebMCPDocument {
    return typeof (document as WebMCPDocument | undefined)?.modelContext?.registerTool === 'function';
  },
  registerTool(document, tool, options): Promise<void> {
    const modelContext = (document as WebMCPDocument).modelContext;
    if (!modelContext) return Promise.reject(new Error('WebMCP modelContext is unavailable.'));
    return Promise.resolve(modelContext.registerTool(tool, options));
  },
};

export interface WebMCPToolInvocation {
  readonly toolName: string;
  readonly toolCallId: string;
  readonly input: Record<string, unknown>;
  readonly definition: ToolDefinition;
  readonly sessionId: string;
  readonly signal: AbortSignal;
}

export type WebMCPIdempotencyKeyFactory = (
  invocation: WebMCPToolInvocation,
) => string | undefined;

/** Post-commit notification. It is deliberately detached from the browser
 * tool result, so notification failures cannot make a completed mutation look
 * retryable to an agent. */
export type WebMCPAfterExecute = (event: {
  readonly invocation: WebMCPToolInvocation;
  readonly result: ToolCallResult;
}) => void | Promise<void>;

/** Context-Action error representation for the WebMCP callback. */
export type WebMCPErrorMode = 'structured' | 'throw';

/** Values that change browser capability registration and require a new scope. */
export interface WebMCPRegistrationConfig<TDocument = WebMCPDocument> {
  /** Stable identity for the page agent session. */
  readonly sessionId: string;
  /** Explicit capability scope; an omitted list never exposes a whole registry. */
  readonly toolNames: readonly string[];
  /** Defaults to the ambient browser document when it is available. */
  readonly document?: TDocument;
  /** Defaults to the current WebMCP draft profile. */
  readonly profile?: WebMCPRuntimeProfile<TDocument>;
  /** Optional cross-origin documents allowed to discover and execute these tools. */
  readonly exposedTo?: readonly string[];
  /** Unregister all registered tools when aborted. */
  readonly signal?: AbortSignal;
}

/** Values read at browser-tool invocation time without re-registering tools. */
export interface WebMCPExecutionOptions {
  readonly context?: Omit<ToolCallContext, 'source' | 'mode' | 'sessionId'>;
  readonly callOptions?: Omit<ToolCallOptions, 'signal' | 'context' | 'idempotencyKey' | 'interaction'>;
  /** Detached notification after canonical execution has committed. */
  readonly afterExecute?: WebMCPAfterExecute;
  /** Receives detached post-execution notification failures. */
  readonly onObserverError?: (error: unknown) => void;
  /** Canonical approval handler, called only after validation and policy ask. */
  readonly interaction?: ToolInteractionHandler;
  /** Default `structured` preserves Context-Action's structured error envelope. */
  readonly errorMode?: WebMCPErrorMode;
  /** Domain-owned retry identity; omitted by default because WebMCP has no native call ID. */
  readonly getIdempotencyKey?: WebMCPIdempotencyKeyFactory;
}

export interface WebMCPToolScopeOptions<TDocument = WebMCPDocument>
  extends WebMCPRegistrationConfig<TDocument>, WebMCPExecutionOptions {
  /** Optional lazy execution configuration for UI frameworks with changing props. */
  readonly getExecutionOptions?: (
    invocation: WebMCPToolInvocation,
  ) => WebMCPExecutionOptions;
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
export async function createWebMCPToolScope<TDocument = WebMCPDocument>(
  manager: ToolManagementInterface,
  options: WebMCPToolScopeOptions<TDocument>,
): Promise<WebMCPToolScope> {
  const sessionId = canonicalSessionId(options.sessionId);
  const definitions = resolveDefinitions(manager, options.toolNames);
  validateDefinitions(definitions);
  const documentRef = options.document
    ?? getAmbientDocument() as TDocument | undefined;
  const profile: WebMCPRuntimeProfile<TDocument> = options.profile
    ?? currentWebMCPProfile as unknown as WebMCPRuntimeProfile<TDocument>;
  if (!profile.isSupported(documentRef)) return unsupportedScope();

  const exposedTo = normalizeExposedOrigins(options.exposedTo);
  const controller = new AbortController();
  const abortExternal = () => controller.abort(options.signal?.reason);
  if (options.signal) {
    if (options.signal.aborted) abortExternal();
    else options.signal.addEventListener('abort', abortExternal, { once: true });
  }

  const scopeId = createScopeId();
  const registeredNames: string[] = [];
  let sequence = 0;
  const dispose = () => {
    controller.abort();
    options.signal?.removeEventListener('abort', abortExternal);
  };

  if (controller.signal.aborted) return { supported: true, activeTools: [], dispose };

  try {
    for (const definition of definitions) {
      if (controller.signal.aborted) break;
      const annotations = toWebMCPAnnotations(definition);
      await profile.registerTool(documentRef, {
        name: definition.name,
        ...(definition.title === undefined ? {} : { title: definition.title }),
        description: definition.description!,
        inputSchema: definition.inputSchema,
        ...(annotations === undefined ? {} : { annotations }),
        execute: async (input) => {
          const toolCallId = `webmcp:${scopeId}:${++sequence}`;
          const invocation: WebMCPToolInvocation = {
            toolName: definition.name,
            toolCallId,
            input,
            definition,
            sessionId,
            signal: controller.signal,
          };
          const executionOptions = options.getExecutionOptions?.(invocation) ?? options;
          throwIfAborted(controller.signal);
          const result = await manager.executeModelToolCall({
            id: toolCallId,
            name: definition.name,
            arguments: input,
          }, {
            ...executionOptions.callOptions,
            signal: controller.signal,
            interaction: executionOptions.interaction,
            idempotencyKey: executionOptions.getIdempotencyKey?.(invocation),
            context: {
              ...executionOptions.context,
              source: 'model',
              mode: 'agent',
              sessionId,
              metadata: {
                ...executionOptions.context?.metadata,
                transport: 'webmcp',
              },
            },
          });
          // Detached observer failures and a disposed scope cannot turn an
          // already committed canonical tool call into a rejected browser result.
          void Promise.resolve().then(async () => {
            await executionOptions.afterExecute?.({
              invocation: snapshotWebMCPInvocation(invocation),
              result: snapshotToolCallResult(result),
            });
          }).catch(error => {
            try {
              executionOptions.onObserverError?.(error);
            } catch {
              // Diagnostic callbacks are isolated just like observers.
            }
          });
          return toWebMCPResult(result, executionOptions.errorMode ?? 'structured');
        },
      }, {
        signal: controller.signal,
        ...(exposedTo.length === 0 ? {} : { exposedTo }),
      });
      if (controller.signal.aborted) break;
      registeredNames.push(definition.name);
    }
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    supported: true,
    activeTools: registeredNames,
    dispose,
  };
}

const WEBMCP_TOOL_NAME = /^[A-Za-z0-9_.-]{1,128}$/;

function validateDefinitions(definitions: readonly ToolDefinition[]): void {
  for (const definition of definitions) {
    if (!WEBMCP_TOOL_NAME.test(definition.name)) {
      throw new TypeError(`WebMCP tool name "${definition.name}" must use 1-128 ASCII letters, digits, _, -, or ..`);
    }
    if (!definition.description?.trim()) {
      throw new TypeError(`WebMCP tool "${definition.name}" requires a non-empty description.`);
    }
  }
}

function toWebMCPAnnotations(
  definition: ToolDefinition,
): WebMCPAnnotations | undefined {
  const annotations = definition.annotations;
  const mapped: WebMCPAnnotations = {
    ...(annotations?.readOnlyHint === undefined ? {} : { readOnlyHint: annotations.readOnlyHint }),
    ...((definition.transports?.webmcp?.untrustedContentHint
      ?? annotations?.untrustedContentHint) === undefined
      ? {}
      : { untrustedContentHint: definition.transports?.webmcp?.untrustedContentHint
        ?? annotations?.untrustedContentHint }),
  };
  return Object.keys(mapped).length === 0 ? undefined : mapped;
}

function throwIfAborted(signal: AbortSignal): void {
  if (!signal.aborted) return;
  throw signal.reason instanceof Error
    ? signal.reason
    : new DOMException('WebMCP tool scope was disposed.', 'AbortError');
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
    if (!manager.hasTool(name) || !definition) {
      throw new Error(`WebMCP tool scope contains unavailable tool "${name}".`);
    }
    if (definition.name !== name) {
      throw new Error(`WebMCP tool scope received mismatched definition for "${name}".`);
    }
    return definition;
  });
}

function createScopeId(): string {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.randomUUID) return cryptoRef.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
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

/** Notifications are diagnostic-only. Clone JSON-compatible transport values
 * so a post-execution hook cannot mutate the browser result after commit. */
function snapshotToolValue<T>(value: T): T | undefined {
  try {
    return freezeToolSnapshot(structuredClone(value));
  } catch {
    try {
      return freezeToolSnapshot(JSON.parse(JSON.stringify(value)) as T);
    } catch {
      return undefined;
    }
  }
}

function freezeToolSnapshot<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) {
    freezeToolSnapshot(child, seen);
  }
  return Object.freeze(value);
}

function snapshotToolCallResult(result: ToolCallResult): ToolCallResult {
  const content = Object.freeze(result.content.map(block => Object.freeze(
    block.type === 'text'
      ? { type: 'text' as const, text: block.text }
      : { type: 'json' as const, json: snapshotToolValue(block.json) },
  ))) as ToolCallResult['content'];
  const structuredContent = snapshotToolValue(result.structuredContent);
  const error = snapshotToolValue(result.error);
  return Object.freeze({
    ...(result.toolCallId === undefined ? {} : { toolCallId: result.toolCallId }),
    content,
    ...(structuredContent === undefined ? {} : { structuredContent }),
    ...(result.isError === undefined ? {} : { isError: result.isError }),
    ...(error === undefined ? {} : { error }),
  });
}

function snapshotWebMCPInvocation(
  invocation: WebMCPToolInvocation,
): WebMCPToolInvocation {
  const definition = snapshotToolValue(invocation.definition) ?? Object.freeze({
    name: invocation.definition.name,
    description: invocation.definition.description,
    inputSchema: {},
  }) as ToolDefinition;
  return Object.freeze({
    toolName: invocation.toolName,
    toolCallId: invocation.toolCallId,
    input: snapshotToolValue(invocation.input) ?? {},
    definition,
    sessionId: invocation.sessionId,
    signal: invocation.signal,
  });
}

function toWebMCPResult(result: ToolCallResult, errorMode: WebMCPErrorMode): unknown {
  if (!result.isError && result.structuredContent !== undefined) {
    return result.structuredContent;
  }
  if (!result.isError) return stringifyToolContent(result.content);
  if (errorMode === 'throw') {
    throw new Error(result.error?.message ?? stringifyToolContent(result.content));
  }
  return {
    isError: true,
    content: result.content,
    ...(result.error === undefined ? {} : { error: result.error }),
  };
}
