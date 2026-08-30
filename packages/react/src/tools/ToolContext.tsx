/**
 * @fileoverview Development-track createToolContext for unified tool management
 *
 * This module is repository source only: React 3 intentionally does not
 * publish `@context-action/react/tools`. It combines React provider lifecycle
 * with Tool Protocol schemas to create a registry that can:
 * - Define tools with Tool Protocol schemas backed by Zod
 * - Register and execute tool handlers
 * - Serve canonical tools/list and tools/call requests
 * - Convert canonical definitions for provider adapters
 * - Validate payloads and normalize strict input at runtime
 *
 * @example
 * ```typescript
 * // Repository source-track sibling import; not an installed React 3 subpath.
 * import { createToolContext } from './ToolContext';
 * import { z } from 'zod';
 * import {
 *   createActionSchema,
 *   defineAction,
 *   toOpenAIToolDefinitions,
 * } from '@context-action/tool-protocol';
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
 *   useToolCall,
 *   useToolResultHandler,
 *   useToolRegistry,
 * } = createToolContext('ProductTools', { schema: toolSchema });
 *
 * // In your LLM integration:
 * function LLMIntegration() {
 *   const registry = useToolRegistry();
 *   const tools = toOpenAIToolDefinitions(registry.listTools().tools);
 *   // ... use tools with OpenAI API
 * }
 * ```
 */

import {
  ActionHandler,
  ActionRegister,
  ActionResultHandler,
  DispatchArgs,
  DispatchOptions,
  HandlerConfig,
} from '@context-action/core';
import {
  type DurableOperationClaim,
  hasDurableOperationFencingCapability,
} from '@context-action/tool-durable-operations';
import type {
  ToolCallContext,
  ToolCallEvent,
  ToolCallRequest,
  ToolCallResult,
  ToolIdempotencyRegistry,
} from '@context-action/tool-protocol';
import {
  ActionSchemaMap,
  createToolCallError,
  createToolCallFingerprint,
  createToolCallSuccess,
  createToolExecutionProvenance,
  createToolIdempotencyRegistry,
  createToolOperationKey,
  getToolCallErrorMetadata,
  InferActionPayloadMap,
  isToolCallRequest,
  isValidToolIdempotencyKey,
  measureToolOutputBytes,
  sanitizeToolCallDiagnostic,
  sanitizeToolCallDiagnosticReason,
  TOOL_CALL_ERROR_CODES,
  withToolCallId,
} from '@context-action/tool-protocol';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useId,
  useInsertionEffect,
  useMemo,
  useRef,
} from 'react';
import {
  ProviderDispatchLifecycleImpl,
  withProviderDispatchSignal,
} from '../actions/ActionContext';
import type {
  DirectToolCallOptions,
  ToolCallFunction,
  ToolContextConfig,
  ToolContextReturn,
  ToolContextType,
  ToolExecutionResult,
  ToolPolicy,
  ToolRegistry,
} from './ToolContext.types';
import {
  createToolRegistry,
  type ToolCallExecutor,
  type ToolOperationReconciler,
  type ToolOperationStatusReader,
} from './tool-registry';

const DEFAULT_DURABLE_OPERATION_LEASE_MS = 5 * 60 * 1000;
const MAX_DURABLE_ABORT_PERSISTENCE_WAIT_MS = 1000;
const MAX_TOOL_CALL_TIMEOUT_MS = 2_147_483_647;

type DurablePersistenceOutcome =
  | { readonly persisted: true }
  | { readonly persisted: false; readonly error: unknown };

type DurableAbortSettlement =
  | { readonly safe: true; readonly winner: 'known-terminal' | 'unknown' }
  | { readonly safe: false; readonly error: unknown };

function abortError(signal: AbortSignal): Error {
  const reason = signal.reason;
  if (reason instanceof Error) return reason;
  const error = new Error('Tool call cancelled.');
  error.name = 'AbortError';
  return error;
}

function awaitWithAbort<T>(
  promise: PromiseLike<T>,
  signal?: AbortSignal
): Promise<T> {
  if (!signal) return Promise.resolve(promise);
  if (signal.aborted) return Promise.reject(abortError(signal));

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal.removeEventListener('abort', onAbort);
    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(abortError(signal));
    };

    signal.addEventListener('abort', onAbort, { once: true });
    Promise.resolve(promise).then(
      value => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      },
      error => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      }
    );
  });
}

class ToolCallTimeoutError extends Error {
  override name = 'ToolCallTimeoutError';

  constructor(public readonly timeoutMs: number) {
    super(`Tool call timed out after ${timeoutMs}ms.`);
    Object.setPrototypeOf(this, ToolCallTimeoutError.prototype);
  }
}

interface ToolCallTimeoutState {
  readonly signal: AbortSignal;
  readonly timeoutMs: number;
  readonly cleanup: () => void;
}

function createToolCallTimeout(timeout: number | undefined): ToolCallTimeoutState | undefined {
  if (timeout === undefined) return undefined;
  if (!Number.isSafeInteger(timeout) || timeout < 0 || timeout > MAX_TOOL_CALL_TIMEOUT_MS) {
    throw new RangeError(
      `Tool call timeout must be a safe integer between 0 and ${MAX_TOOL_CALL_TIMEOUT_MS}ms.`
    );
  }

  const controller = new AbortController();
  const timeoutError = new ToolCallTimeoutError(timeout);
  const timer = setTimeout(() => controller.abort(timeoutError), timeout);
  return {
    signal: controller.signal,
    timeoutMs: timeout,
    cleanup: () => clearTimeout(timer),
  };
}

function mergeToolCallSignals(
  signals: readonly (AbortSignal | undefined)[]
): { signal?: AbortSignal; cleanup: () => void } {
  const activeSignals = signals.filter(
    (signal): signal is AbortSignal => signal !== undefined
  );
  if (activeSignals.length === 0) return { cleanup: () => {} };
  if (activeSignals.length === 1) {
    return { signal: activeSignals[0], cleanup: () => {} };
  }

  if (typeof AbortSignal.any === 'function') {
    return { signal: AbortSignal.any(activeSignals), cleanup: () => {} };
  }

  const controller = new AbortController();
  const listeners = activeSignals.map(signal => {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return undefined;
    }
    const listener = () => {
      if (!controller.signal.aborted) controller.abort(signal.reason);
    };
    signal.addEventListener('abort', listener, { once: true });
    return () => signal.removeEventListener('abort', listener);
  });
  return {
    signal: controller.signal,
    cleanup: () => listeners.forEach(listener => listener?.()),
  };
}

function isToolCallTimeoutError(error: unknown): error is ToolCallTimeoutError {
  return error instanceof ToolCallTimeoutError;
}

function validateOptionalOutputBudget(maxOutputBytes: number | undefined): void {
  if (maxOutputBytes !== undefined
    && (!Number.isSafeInteger(maxOutputBytes) || maxOutputBytes <= 0)) {
    throw new RangeError('Tool call maxOutputBytes must be a positive safe integer.');
  }
}

function validateOptionalExecutionOwnerId(ownerId: string | undefined, label = 'executionOwnerId'): void {
  if (ownerId === undefined) return;
  const normalized = ownerId.trim();
  if (normalized.length === 0 || normalized.length > 256 || normalized.includes('\0')) {
    throw new TypeError(`${label} must be visible text within 256 characters.`);
  }
}

function provenanceStateForResult(
  result: ToolCallResult,
): 'completed' | 'failed' | 'cancelled' | 'unknown' {
  if (!result.isError) return 'completed';
  const code = result.error?.code;
  if (code === TOOL_CALL_ERROR_CODES.TIMEOUT
    || code === TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED
    || code === TOOL_CALL_ERROR_CODES.EXECUTION_UNKNOWN) {
    return 'unknown';
  }
  if (code === TOOL_CALL_ERROR_CODES.CANCELLED) return 'cancelled';
  return 'failed';
}

function enforceToolOutputBudget(
  result: ToolCallResult,
  maxOutputBytes: number | undefined,
  toolCallId: ToolCallRequest['id'],
): ToolCallResult {
  if (maxOutputBytes === undefined) return result;
  const usedOutputBytes = measureToolOutputBytes({
    content: result.content,
    ...(result.structuredContent === undefined
      ? {}
      : { structuredContent: result.structuredContent }),
  });
  if (usedOutputBytes <= maxOutputBytes) return result;
  return createToolCallError(
    `Tool call output exceeded the ${maxOutputBytes}-byte limit.`,
    {
      code: TOOL_CALL_ERROR_CODES.OUTPUT_LIMIT_EXCEEDED,
      retryable: false,
      toolCallId,
      details: { maxOutputBytes, usedOutputBytes },
    }
  );
}

function observedToolOutputBytes(result: ToolCallResult): number {
  const details = result.error?.details;
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const usedOutputBytes = (details as Record<string, unknown>).usedOutputBytes;
    if (typeof usedOutputBytes === 'number' && Number.isSafeInteger(usedOutputBytes)
      && usedOutputBytes >= 0) {
      return usedOutputBytes;
    }
  }
  return measureToolOutputBytes({
    content: result.content,
    ...(result.structuredContent === undefined
      ? {}
      : { structuredContent: result.structuredContent }),
  });
}

/**
 * Creates a source-track Tool Context for LLM integration.
 *
 * This factory creates a complete tool system that:
 * - Uses Tool Protocol schemas as the Single Source of Truth
 * - Provides canonical tools/list and tools/call boundaries
 * - Normalizes strict input before it reaches handlers
 * - Keeps compatibility provider exporters separate from canonical discovery
 * - Separates result-producing handlers from legacy full-controller handlers
 *
 * React 3 does not publish this factory as an installed package subpath.
 *
 * @param contextName - Name identifier for this tool context
 * @param config - Configuration with required schema
 * @returns Tool context with Provider, hooks, and registry access
 *
 * @example
 * ```typescript
 * const { Provider, useToolCall, useToolRegistry } = createToolContext('MyTools', {
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

  const {
    schema: configuredSchema,
    validationMode = 'strict',
    validateOnDispatch = true,
    debug = false,
    allowedToolNames: configuredAllowedToolNames,
    toolListPageSize,
    toolPolicy,
    onToolCall,
    executionOwnerId,
    idempotency,
    durableOperationStore,
    durableOperationOwnerId,
    durableOperationLeaseMs = DEFAULT_DURABLE_OPERATION_LEASE_MS,
    durableDiagnosticPolicy,
  } = config;
  // A context factory owns one stable catalog. Keep caller mutations from
  // making discovery, validation, and execution observe different tool sets.
  const schema = Object.freeze({ ...configuredSchema }) as TSchema;
  const allowedToolNames = configuredAllowedToolNames === undefined
    ? undefined
    : Object.freeze([...new Set(configuredAllowedToolNames)]);

  if (
    durableOperationLeaseMs !== undefined &&
    (!Number.isFinite(durableOperationLeaseMs) || durableOperationLeaseMs <= 0)
  ) {
    throw new RangeError('durableOperationLeaseMs must be a positive finite number.');
  }
  validateOptionalExecutionOwnerId(durableOperationOwnerId, 'durableOperationOwnerId');
  validateOptionalExecutionOwnerId(executionOwnerId);
  if (durableOperationStore && !hasDurableOperationFencingCapability(durableOperationStore)) {
    throw new TypeError(
      'durableOperationStore must declare incarnation-revision fencing capability.'
    );
  }

  // Create the React context
  const ToolReactContext = createContext<ToolContextType<TSchema> | null>(null);

  // Provider component
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const providerInstanceId = useId();
    const durableOwnerId = durableOperationOwnerId ?? `${contextName}:${providerInstanceId}`;
    // Create singleton ActionRegister instance (only once per Provider mount)
    const actionRegisterRef = useRef<ActionRegister<TPayloadMap> | null>(null);
    const dispatchLifecycleRef = useRef<ProviderDispatchLifecycleImpl | null>(null);
    const idempotencyRegistryRef = useRef<ToolIdempotencyRegistry<ToolCallResult> | null>(null);
    if (!actionRegisterRef.current) {
      actionRegisterRef.current = new ActionRegister<TPayloadMap>({
        name: contextName,
        registry: {
          schema: schema as ActionSchemaMap,
          validationMode,
          validateOnDispatch,
          // Tool provider teardown must reject queued calls before handler
          // cleanup. Core queueing is opt-in, so this boundary opts in.
          useConcurrencyQueue: true,
        },
      });
    }
    if (!dispatchLifecycleRef.current) {
      dispatchLifecycleRef.current = new ProviderDispatchLifecycleImpl();
    }
    if (!idempotencyRegistryRef.current) {
      idempotencyRegistryRef.current = createToolIdempotencyRegistry<ToolCallResult>(
        idempotency
      );
    }
    const dispatchLifecycle = dispatchLifecycleRef.current;

    // Activity disconnects layout/passive effects while preserving the mounted
    // tree. Insertion effects remain connected, so Provider-owned resources
    // survive hide/reveal and are shut down only on an actual unmount.
    useInsertionEffect(() => {
      const register = actionRegisterRef.current;
      if (!register) {
        throw new Error('Tool provider resources were not initialized before commit.');
      }

      return () => {
        void dispatchLifecycle.shutdown(register);
        if (actionRegisterRef.current === register) {
          actionRegisterRef.current = null;
        }
        if (dispatchLifecycleRef.current === dispatchLifecycle) {
          dispatchLifecycleRef.current = null;
        }
        idempotencyRegistryRef.current = null;
      };
    }, [dispatchLifecycle]);

    // Create dispatch function (singleton)
    const dispatch = useMemo(() => {
      return <K extends Extract<keyof TPayloadMap, string>>(
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
            toolName as Extract<keyof TPayloadMap, string>,
            ...([payload, withProviderDispatchSignal(options, signal)] as DispatchArgs<TPayloadMap[K]>)
          )
        );
        void trackedPromise.catch(() => {});
        return trackedPromise;
      };
    }, [dispatchLifecycle]);

    // Canonical tools/call bridge used by MCP adapters and model tool calls.
    const executeToolCall = useMemo<ToolCallExecutor>(() => {
      return async (request, options) => {
        if (!isToolCallRequest(request)) {
          const rawRequest = request as unknown as {
            id?: unknown;
          } | null;
          const rawId = rawRequest?.id;
          const toolCallId =
            typeof rawId === 'string' ||
            (typeof rawId === 'number' && Number.isFinite(rawId))
              ? rawId
              : undefined;
          return createToolCallError('Invalid tools/call request.', {
            code: TOOL_CALL_ERROR_CODES.VALIDATION_FAILED,
            ...(toolCallId === undefined ? {} : { toolCallId }),
          });
        }
        const startedAt = Date.now();
        const idempotencyKey = options?.idempotencyKey;
        if (idempotencyKey !== undefined && !isValidToolIdempotencyKey(idempotencyKey)) {
          return createToolCallError(
            'Tool call idempotencyKey must be a non-empty string of at most 256 characters.',
            {
              code: TOOL_CALL_ERROR_CODES.INVALID_OPTIONS,
              retryable: false,
              toolCallId: request.id,
            }
          );
        }
        let timeoutState: ToolCallTimeoutState | undefined;
        try {
          timeoutState = createToolCallTimeout(options?.timeout);
          validateOptionalOutputBudget(options?.maxOutputBytes);
          validateOptionalExecutionOwnerId(options?.executionOwnerId);
        } catch (error) {
          timeoutState?.cleanup();
          return createToolCallError(
            error instanceof Error ? error.message : String(error),
            {
              code: TOOL_CALL_ERROR_CODES.INVALID_OPTIONS,
              retryable: false,
              toolCallId: request.id,
            }
          );
        }
        const signalState = mergeToolCallSignals([
          options?.signal,
          timeoutState?.signal,
        ]);
        const callSignal = signalState.signal;
        const context: ToolCallContext = options?.context ?? { source: 'mcp' };
        const provenanceOwnerId = options?.executionOwnerId ?? executionOwnerId ?? durableOwnerId;
        const toolName = request.params.name as keyof TPayloadMap;
        const hasOwnTool = Object.getOwnPropertyDescriptor(schema, request.params.name) !== undefined;
        const tool = hasOwnTool ? schema[request.params.name] : undefined;

        const emit = (event: ToolCallEvent): void => {
          try {
            onToolCall?.(event);
          } catch (error) {
            if (debug) console.warn(`[${contextName}] Tool observer failed`, error);
          }
        };

        emit({
          type: 'started',
          toolCallId: request.id,
          name: request.params.name,
          request,
          context,
          timestamp: startedAt,
          provenance: createToolExecutionProvenance({
            ownerId: provenanceOwnerId,
            state: 'pending',
            ...(options?.timeout === undefined ? {} : { timeoutMs: options.timeout }),
            ...(options?.maxOutputBytes === undefined ? {} : { maxOutputBytes: options.maxOutputBytes }),
            usedOutputBytes: 0,
            elapsedMs: 0,
          }),
        });

        const finish = (result: ToolCallResult): ToolCallResult => {
          timeoutState?.cleanup();
          signalState.cleanup();
          const normalized = withToolCallId(result, request.id);
          const usedOutputBytes = observedToolOutputBytes(normalized);
          const finalResult = normalized;
          const elapsedMs = Math.max(0, Date.now() - startedAt);
          emit({
            type: finalResult.isError ? 'failed' : 'completed',
            toolCallId: request.id,
            name: request.params.name,
            request,
            context,
            timestamp: Date.now(),
            durationMs: elapsedMs,
            result: finalResult,
            provenance: createToolExecutionProvenance({
              ownerId: provenanceOwnerId,
              state: provenanceStateForResult(finalResult),
              ...(options?.timeout === undefined ? {} : { timeoutMs: options.timeout }),
              ...(options?.maxOutputBytes === undefined ? {} : { maxOutputBytes: options.maxOutputBytes }),
              usedOutputBytes,
              elapsedMs,
            }),
          });
          return finalResult;
        };

        const timeoutResult = (): ToolCallResult => createToolCallError(
          `Tool call timed out after ${timeoutState!.timeoutMs}ms.`,
          {
            code: TOOL_CALL_ERROR_CODES.TIMEOUT,
            retryable: true,
            toolCallId: request.id,
            details: {
              timeoutMs: timeoutState!.timeoutMs,
              executionState: 'detached',
            },
          }
        );

        if (!tool) {
          return finish(createToolCallError(
            `Tool "${request.params.name}" not found in registry`,
            { code: TOOL_CALL_ERROR_CODES.NOT_FOUND, toolCallId: request.id }
          ));
        }

        if (allowedToolNames && !allowedToolNames.includes(request.params.name)) {
          return finish(createToolCallError(
            `Tool "${request.params.name}" is not allowed in this registry`,
            { code: TOOL_CALL_ERROR_CODES.NOT_ALLOWED, toolCallId: request.id }
          ));
        }

        let executionArguments = request.params.arguments ?? {};

        // Canonical tools/call requests must fail before policy/approval when
        // strict validation rejects their arguments. This keeps malformed
        // model input out of the approval UI and gives every transport the
        // same structured validation result. warn/silent modes intentionally
        // preserve ActionRegister's existing permissive dispatch behavior.
        if (validateOnDispatch && validationMode === 'strict') {
          const validation = tool.safeParse(request.params.arguments ?? {});
          if (!validation.success) {
            return finish(createToolCallError(
              `Tool "${request.params.name}" arguments failed validation`,
              {
                code: TOOL_CALL_ERROR_CODES.VALIDATION_FAILED,
                toolCallId: request.id,
                details: { issues: validation.error.issues },
              }
            ));
          }
          // The canonical handler path must receive the same defaulted or
          // transformed value that strict validation accepted.
          executionArguments = validation.data as Record<string, unknown>;
        }

        if (toolPolicy) {
          let decision: Awaited<ReturnType<ToolPolicy>>;
          let policySignal: AbortSignal | undefined;
          try {
            decision = await awaitWithAbort(
              dispatchLifecycle.run(
                [options?.signal, timeoutState?.signal],
                signal => {
                  policySignal = signal;
                  return awaitWithAbort(
                    Promise.resolve().then(() =>
                      toolPolicy({
                        request,
                        definition: tool.toMCP(),
                        context,
                        signal,
                      })
                    ),
                    signal
                  );
                }
              ),
              callSignal
            );
          } catch (error) {
            if (timeoutState && (timeoutState.signal.aborted || isToolCallTimeoutError(error))) {
              return finish(timeoutResult());
            }
            if (options?.signal?.aborted) {
              return finish(createToolCallError(
                'Tool call cancelled while waiting for policy.',
                {
                  code: TOOL_CALL_ERROR_CODES.CANCELLED,
                  retryable: true,
                  toolCallId: request.id,
                }
              ));
            }
            if (
              !options?.signal?.aborted &&
              (policySignal?.aborted ||
                (policySignal === undefined &&
                  error instanceof Error &&
                  error.name === 'AbortError'))
            ) {
              return finish(createToolCallError(
                error instanceof Error ? error.message : 'Tool provider unmounted.',
                {
                  code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED,
                  retryable: true,
                  toolCallId: request.id,
                  details: { executionState: 'detached' },
                }
              ));
            }
            return finish(createToolCallError(
              error instanceof Error ? error.message : String(error),
              {
                code: TOOL_CALL_ERROR_CODES.POLICY_FAILED,
                toolCallId: request.id,
                retryable: true,
              }
            ));
          }
          if (decision === 'ask' && options?.interaction) {
            let interactionSignal: AbortSignal | undefined;
            try {
              const interactionDecision = await awaitWithAbort(
                dispatchLifecycle.run(
                  [options?.signal, timeoutState?.signal],
                  signal => {
                    interactionSignal = signal;
                    return awaitWithAbort(
                      options.interaction!({
                        kind: 'approval',
                        call: {
                          ...(request.id === undefined ? {} : { id: request.id }),
                          name: request.params.name,
                          arguments: request.params.arguments ?? {},
                        },
                        request,
                        definition: tool.toMCP(),
                        context,
                        signal,
                      }),
                      signal
                    );
                  }
                ),
                callSignal,
              );
              decision = interactionDecision === 'approved' ? 'allow' : 'deny';
            } catch (error) {
              if (timeoutState && (timeoutState.signal.aborted || isToolCallTimeoutError(error))) {
                return finish(timeoutResult());
              }
              if (options?.signal?.aborted) {
                return finish(createToolCallError('Tool call cancelled while waiting for interaction.', {
                  code: TOOL_CALL_ERROR_CODES.CANCELLED,
                  retryable: true,
                  toolCallId: request.id,
                }));
              }
              if (
                !options?.signal?.aborted &&
                (interactionSignal?.aborted ||
                  (interactionSignal === undefined &&
                    error instanceof Error &&
                    error.name === 'AbortError'))
              ) {
                return finish(createToolCallError(
                  error instanceof Error ? error.message : 'Tool provider unmounted.',
                  {
                    code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED,
                    retryable: true,
                    toolCallId: request.id,
                    details: { executionState: 'detached' },
                  }
                ));
              }
              return finish(createToolCallError(
                error instanceof Error ? error.message : String(error),
                {
                  code: TOOL_CALL_ERROR_CODES.POLICY_FAILED,
                  retryable: true,
                  toolCallId: request.id,
                },
              ));
            }
          }

          if (decision !== 'allow') {
            return finish(createToolCallError(
              decision === 'ask'
                ? `Approval required for tool "${request.params.name}"`
                : `Tool "${request.params.name}" was denied by policy`,
              {
                code: decision === 'ask'
                  ? TOOL_CALL_ERROR_CODES.APPROVAL_REQUIRED
                  : TOOL_CALL_ERROR_CODES.POLICY_DENIED,
                retryable: decision === 'ask',
                toolCallId: request.id,
              }
            ));
          }
        }

        const register = actionRegisterRef.current;
        if (!register) {
          return finish(createToolCallError(`ActionRegister not initialized in ${contextName}`, {
            code: TOOL_CALL_ERROR_CODES.REGISTRY_NOT_READY,
            toolCallId: request.id,
            retryable: true,
          }));
        }

        const payload = executionArguments as TPayloadMap[typeof toolName];
        const operationKey = idempotencyKey === undefined
          ? undefined
          : createToolOperationKey(
              request.params.name,
              idempotencyKey,
              context.sessionId
            );
        const fingerprint = idempotencyKey === undefined
          ? undefined
          : createToolCallFingerprint(request.params.name, request.params.arguments ?? {});
        let durableAbortTransition: Promise<DurableAbortSettlement> | undefined;

        const storeFailureResult = (
          error: unknown,
          persistenceUncertain = false
        ): ToolCallResult => createToolCallError(
          `Durable operation state could not be persisted: ${
            error instanceof Error ? error.message : String(error)
          }`,
          {
            code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_STORE_FAILED,
            retryable: true,
            toolCallId: request.id,
            details: {
              ...(operationKey === undefined ? {} : { operationKey }),
              ...(persistenceUncertain
                ? {
                    persistenceState: 'uncertain',
                    automaticRetrySafe: false,
                  }
                : {}),
            },
          }
        );
        const unknownOperationResult = (): ToolCallResult => createToolCallError(
          `Operation "${request.params.name}" has an unknown outcome and requires reconciliation.`,
          {
            code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_UNKNOWN,
            retryable: false,
            toolCallId: request.id,
            details: {
              state: 'unknown',
              automaticRetrySafe: false,
            },
          }
        );
        const storedResultForDurability = (result: ToolCallResult): ToolCallResult => {
          if (result.toolCallId === undefined) return result;
          const { toolCallId: _toolCallId, ...withoutToolCallId } = result;
          return withoutToolCallId;
        };
        const transitionOutcome = (
          transition: () => unknown | PromiseLike<unknown>
        ): Promise<DurablePersistenceOutcome> => Promise.resolve()
          .then(transition)
          .then(
            () => ({ persisted: true as const }),
            error => ({ persisted: false as const, error })
          );

        const performExecution = async (
          signal: AbortSignal
        ): Promise<ToolCallResult> => {
          try {
            const execution = await register.dispatchWithResult(
              toolName as Extract<keyof TPayloadMap, string>,
              ...([
                payload,
                withProviderDispatchSignal({ signal }, signal),
              ] as DispatchArgs<TPayloadMap[typeof toolName]>)
            );

            if (!execution.success) {
              const validationMessage =
                execution.validation && !execution.validation.passed
                  ? execution.validation.errors.join('; ')
                  : undefined;
              const failedHandler = execution.failedResults.find(
                ({ error }) => Boolean(error?.message)
              );
              const lifecycleError = execution.errors.find(
                ({ error }) => Boolean(error?.message)
              );
              const handlerError = failedHandler?.error ?? lifecycleError?.error;
              const handlerMetadata = getToolCallErrorMetadata(handlerError);
              const executionMessage =
                execution.abortReason ??
                validationMessage ??
                failedHandler?.error.message ??
                lifecycleError?.error.message ??
                `Tool "${request.params.name}" failed`;
              const timedOut = timeoutState?.signal.aborted === true && !execution.aborted;
              const externallyCancelled = options?.signal?.aborted === true;
              return createToolCallError(executionMessage, {
                code: timedOut
                  ? TOOL_CALL_ERROR_CODES.TIMEOUT
                  : externallyCancelled
                  ? TOOL_CALL_ERROR_CODES.CANCELLED
                  : handlerMetadata.code ??
                    (execution.validation && !execution.validation.passed
                      ? TOOL_CALL_ERROR_CODES.VALIDATION_FAILED
                      : execution.aborted
                        ? TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED
                        : TOOL_CALL_ERROR_CODES.EXECUTION_FAILED),
                retryable:
                  timedOut ||
                  externallyCancelled ||
                  handlerMetadata.retryable === true ||
                  (handlerMetadata.retryable === undefined && execution.aborted),
                details: timedOut
                  ? {
                      timeoutMs: timeoutState!.timeoutMs,
                      executionState: 'detached',
                    }
                  : handlerMetadata.details ??
                    (failedHandler
                      ? {
                          handlerId: failedHandler.handlerId,
                          message: failedHandler.error.message,
                        }
                      : undefined),
              });
            }

            const output =
              execution.result ??
              (execution.successResults.length === 0
                ? undefined
                : execution.successResults.length === 1
                  ? execution.successResults[0]
                  : execution.successResults);
            const outputValidation = tool.safeParseOutput?.(output);
            if (outputValidation && !outputValidation.success) {
              return createToolCallError(
                `Tool "${request.params.name}" returned an invalid result`,
                {
                  code: TOOL_CALL_ERROR_CODES.OUTPUT_VALIDATION_FAILED,
                  details: { issues: outputValidation.error.issues },
                }
              );
            }
            const normalizedOutput = outputValidation?.success
              ? outputValidation.data
              : output;
            return createToolCallSuccess(normalizedOutput);
          } catch (error) {
            const errorMetadata = getToolCallErrorMetadata(error);
            const timedOut = timeoutState !== undefined && (
              timeoutState.signal.aborted || isToolCallTimeoutError(error)
            );
            const externallyCancelled = options?.signal?.aborted === true;
            const providerAborted =
              !timedOut &&
              !externallyCancelled &&
              (signal.aborted || (error instanceof Error && error.name === 'AbortError'));
            return createToolCallError(
              timedOut
                ? `Tool call timed out after ${timeoutState!.timeoutMs}ms.`
                : error instanceof Error ? error.message : String(error),
              {
                code: timedOut
                  ? TOOL_CALL_ERROR_CODES.TIMEOUT
                  : externallyCancelled
                  ? TOOL_CALL_ERROR_CODES.CANCELLED
                  : providerAborted
                  ? TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED
                  : errorMetadata.code ?? TOOL_CALL_ERROR_CODES.EXECUTION_FAILED,
                retryable:
                  timedOut ||
                  externallyCancelled ||
                  providerAborted ||
                  errorMetadata.retryable === true,
                ...(timedOut
                  ? {
                      details: {
                        timeoutMs: timeoutState!.timeoutMs,
                        executionState: 'detached',
                      },
                    }
                  : providerAborted
                  ? { details: { executionState: 'detached' } }
                  : errorMetadata.details === undefined
                  ? {}
                  : { details: errorMetadata.details }),
              }
            );
          }
        };

        const runLogicalOperation = async (
          operationSignal: AbortSignal
        ): Promise<ToolCallResult> => {
          const performExecutionWithBudget = async (): Promise<ToolCallResult> =>
            enforceToolOutputBudget(
              await performExecution(operationSignal),
              options?.maxOutputBytes,
              request.id,
            );

          if (!durableOperationStore || !operationKey || !fingerprint) {
            return performExecutionWithBudget();
          }

          let operationAborted = operationSignal.aborted;
          let resolveOperationAbort: (() => void) | undefined;
          let beginOwnedAbort: (() => void) | undefined;
          const operationAbortPromise = operationAborted
            ? Promise.resolve()
            : new Promise<void>(resolve => {
                resolveOperationAbort = resolve;
              });
          const onOperationAbort = (): void => {
            operationAborted = true;
            resolveOperationAbort?.();
            beginOwnedAbort?.();
          };
          if (!operationAborted) {
            operationSignal.addEventListener('abort', onOperationAbort, { once: true });
          }
          const cleanupOperationAbort = (): void => {
            operationSignal.removeEventListener('abort', onOperationAbort);
          };
          const abortResultForSignal = (): ToolCallResult => {
            if (timeoutState?.signal.aborted) return timeoutResult();
            if (options?.signal?.aborted) {
              const message = abortError(options.signal).message;
              return createToolCallError(message.trim() ? message : 'Tool call cancelled.', {
                code: TOOL_CALL_ERROR_CODES.CANCELLED,
                retryable: true,
                toolCallId: request.id,
              });
            }
            const message = abortError(operationSignal).message;
            return createToolCallError(
              message.trim() ? message : 'Tool execution was aborted.',
              {
                code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED,
                retryable: true,
                toolCallId: request.id,
                details: { executionState: 'detached' },
              }
            );
          };
          const boundDetachedAbortTransition = (
            transition: Promise<DurablePersistenceOutcome>
          ): Promise<DurablePersistenceOutcome> => {
            const waitMs = Math.max(
              1,
              Math.min(
                durableOperationLeaseMs,
                MAX_DURABLE_ABORT_PERSISTENCE_WAIT_MS
              )
            );
            return new Promise(resolve => {
              let settled = false;
              const finish = (outcome: DurablePersistenceOutcome): void => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(outcome);
              };
              const timer = setTimeout(() => {
                finish({
                  persisted: false,
                  error: new Error(
                    `Detached durable abort persistence did not settle within ${waitMs}ms.`
                  ),
                });
              }, waitMs);
              void transition.then(finish);
            });
          };

          const claimPromise = Promise.resolve().then(() =>
            durableOperationStore.claim(
              operationKey,
              fingerprint,
              durableOwnerId,
              { leaseMs: durableOperationLeaseMs }
            )
          );
          const claimRace = await Promise.race([
            claimPromise.then(
              claim => ({ kind: 'claim' as const, claim }),
              error => ({ kind: 'error' as const, error })
            ),
            operationAbortPromise.then(() => ({ kind: 'abort' as const })),
          ]);
          if (claimRace.kind === 'abort') {
            cleanupOperationAbort();
            idempotencyRegistryRef.current?.clear(operationKey);
            const abortResult = abortResultForSignal();
            void claimPromise.then(
              lateClaim => {
                if (lateClaim.status !== 'owner') return;
                const transition = transitionOutcome(() => {
                  const storedAbortResult = storedResultForDurability(abortResult);
                  const durableDiagnostic = sanitizeToolCallDiagnostic(
                    storedAbortResult,
                    durableDiagnosticPolicy
                  );
                  return durableOperationStore.markUnknown(
                    operationKey,
                    durableOwnerId,
                    sanitizeToolCallDiagnosticReason(abortResult),
                    durableDiagnostic,
                    lateClaim.fence
                  );
                });
                void boundDetachedAbortTransition(transition).then(outcome => {
                  if (!outcome.persisted && debug) {
                    console.warn(
                      `[${contextName}] Detached durable abort transition failed`,
                      outcome.error
                    );
                  }
                });
              },
              error => {
                if (debug) {
                  console.warn(`[${contextName}] Detached durable claim failed`, error);
                }
              }
            );
            return abortResult;
          }
          if (claimRace.kind === 'error') {
            cleanupOperationAbort();
            idempotencyRegistryRef.current?.clear(operationKey);
            return storeFailureResult(claimRace.error);
          }
          const durableClaim: DurableOperationClaim<ToolCallResult> = claimRace.claim;

          if (durableClaim.status === 'conflict') {
            cleanupOperationAbort();
            return createToolCallError(
              `Idempotency key was already used for a different "${request.params.name}" operation.`,
              {
                code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_CONFLICT,
                retryable: false,
              }
            );
          }
          if (durableClaim.status === 'pending') {
            cleanupOperationAbort();
            idempotencyRegistryRef.current?.clear(operationKey);
            return createToolCallError(
              `Operation "${request.params.name}" is already running in another owner.`,
              {
                code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_PENDING,
                retryable: true,
                details: {
                  state: durableClaim.record.state,
                  ownerId: durableClaim.record.ownerId,
                  leaseExpiresAt: durableClaim.record.leaseExpiresAt,
                },
              }
            );
          }
          if (durableClaim.status === 'unknown') {
            cleanupOperationAbort();
            idempotencyRegistryRef.current?.clear(operationKey);
            return createToolCallError(
              `Operation "${request.params.name}" has an unknown outcome and requires reconciliation.`,
              {
                code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_UNKNOWN,
                retryable: false,
                details: {
                  state: durableClaim.record.state,
                  reason: durableClaim.record.reason,
                  automaticRetrySafe: false,
                },
              }
            );
          }
          if (durableClaim.status === 'replay') {
            cleanupOperationAbort();
            if (durableClaim.record.result === undefined) {
              idempotencyRegistryRef.current?.clear(operationKey);
              return unknownOperationResult();
            }
            return durableClaim.record.result;
          }

          let terminalTransition: Promise<DurablePersistenceOutcome> | undefined;
          let terminalResult: ToolCallResult | undefined;
          let terminalWritesUnknown = false;
          const createAbortSettlement = (
            abortTransition: Promise<DurablePersistenceOutcome>,
            competingTerminal: Promise<DurablePersistenceOutcome> | undefined,
            competingTerminalWritesUnknown: boolean
          ): Promise<DurableAbortSettlement> => {
            const waitMs = Math.max(
              1,
              Math.min(
                durableOperationLeaseMs,
                MAX_DURABLE_ABORT_PERSISTENCE_WAIT_MS
              )
            );
            return new Promise(resolve => {
              let settled = false;
              let abortOutcome: DurablePersistenceOutcome | undefined;
              let terminalOutcome: DurablePersistenceOutcome | undefined;
              const finish = (outcome: DurableAbortSettlement): void => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                cleanupOperationAbort();
                resolve(outcome);
              };
              const evaluate = (): void => {
                if (abortOutcome?.persisted) {
                  finish({ safe: true, winner: 'unknown' });
                  return;
                }
                if (terminalOutcome?.persisted) {
                  finish({
                    safe: true,
                    winner: competingTerminalWritesUnknown
                      ? 'unknown'
                      : 'known-terminal',
                  });
                  return;
                }
                if (
                  abortOutcome &&
                  !abortOutcome.persisted &&
                  (
                    competingTerminal === undefined ||
                    (terminalOutcome !== undefined && !terminalOutcome.persisted)
                  )
                ) {
                  finish({ safe: false, error: abortOutcome.error });
                }
              };
              const timer = setTimeout(() => {
                finish({
                  safe: false,
                  error: new Error(
                    `Durable abort persistence did not settle within ${waitMs}ms.`
                  ),
                });
              }, waitMs);
              void abortTransition.then(outcome => {
                abortOutcome = outcome;
                evaluate();
              });
              void competingTerminal?.then(outcome => {
                terminalOutcome = outcome;
                evaluate();
              });
            });
          };
          const beginAbortTransition = (): void => {
            if (durableAbortTransition) return;
            idempotencyRegistryRef.current?.clear(operationKey);
            const rawAbortTransition = transitionOutcome(() => {
              const result = abortResultForSignal();
              const storedResult = storedResultForDurability(result);
              const durableDiagnostic = sanitizeToolCallDiagnostic(
                storedResult,
                durableDiagnosticPolicy
              );
              return durableOperationStore.markUnknown(
                operationKey,
                durableOwnerId,
                sanitizeToolCallDiagnosticReason(result),
                durableDiagnostic,
                durableClaim.fence
              );
            });
            durableAbortTransition = createAbortSettlement(
              rawAbortTransition,
              terminalTransition,
              terminalWritesUnknown
            );
            void durableAbortTransition.then(outcome => {
              if (!outcome.safe && debug) {
                console.warn(
                  `[${contextName}] Durable abort transition failed`,
                  outcome.error
                );
              }
            });
          };
          beginOwnedAbort = beginAbortTransition;
          if (operationAborted) beginAbortTransition();

          const settleAbortedOperation = async (): Promise<ToolCallResult> => {
            beginAbortTransition();
            const settlement = await durableAbortTransition!;
            if (!settlement.safe) {
              return storeFailureResult(settlement.error, true);
            }
            if (settlement.winner === 'known-terminal' && terminalResult) {
              return terminalResult;
            }
            return unknownOperationResult();
          };

          if (operationAborted) return settleAbortedOperation();
          const execution = performExecutionWithBudget();
          const executionRace = await Promise.race([
            execution.then(result => ({ kind: 'result' as const, result })),
            operationAbortPromise.then(() => ({ kind: 'abort' as const })),
          ]);
          if (executionRace.kind === 'abort') return settleAbortedOperation();

          terminalResult = executionRace.result;
          if (operationAborted) return settleAbortedOperation();
          const code = terminalResult.error?.code;
          const ambiguous =
            code === TOOL_CALL_ERROR_CODES.TIMEOUT ||
            code === TOOL_CALL_ERROR_CODES.CANCELLED ||
            code === TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED ||
            code === TOOL_CALL_ERROR_CODES.EXECUTION_UNKNOWN;
          terminalWritesUnknown = ambiguous;
          const storedResult = storedResultForDurability(terminalResult);
          const durableDiagnostic = terminalResult.isError
            ? sanitizeToolCallDiagnostic(storedResult, durableDiagnosticPolicy)
            : storedResult;
          terminalTransition = transitionOutcome(() => {
            if (ambiguous) {
              return durableOperationStore.markUnknown(
                operationKey,
                durableOwnerId,
                sanitizeToolCallDiagnosticReason(terminalResult!),
                durableDiagnostic,
                durableClaim.fence
              );
            }
            if (terminalResult!.isError) {
              return durableOperationStore.fail(
                operationKey,
                durableOwnerId,
                sanitizeToolCallDiagnosticReason(terminalResult!),
                durableDiagnostic,
                durableClaim.fence
              );
            }
            return durableOperationStore.complete(
              operationKey,
              durableOwnerId,
              storedResult,
              durableClaim.fence
            );
          });

          const terminalRace = await Promise.race([
            terminalTransition.then(outcome => ({
              kind: 'terminal' as const,
              outcome,
            })),
            operationAbortPromise.then(() => ({ kind: 'abort' as const })),
          ]);
          if (terminalRace.kind === 'abort') return settleAbortedOperation();
          if (terminalRace.outcome.persisted) {
            cleanupOperationAbort();
            if (ambiguous) idempotencyRegistryRef.current?.clear(operationKey);
            return terminalResult;
          }
          if (durableAbortTransition) return settleAbortedOperation();
          cleanupOperationAbort();
          idempotencyRegistryRef.current?.clear(operationKey);
          if (debug) {
            console.warn(
              `[${contextName}] Durable operation transition failed`,
              terminalRace.outcome.error
            );
          }
          return storeFailureResult(terminalRace.outcome.error, true);
        };

        const runProviderScopedOperation = (): Promise<ToolCallResult> =>
          dispatchLifecycle.run(
            [options?.signal, timeoutState?.signal],
            runLogicalOperation
          );

        try {
          const idempotencyClaim = operationKey === undefined
            ? undefined
            : idempotencyRegistryRef.current!.claim(
                operationKey,
                fingerprint!,
                runProviderScopedOperation
              );
          if (idempotencyClaim?.status === 'conflict') {
            return finish(createToolCallError(
              `Idempotency key was already used for a different "${request.params.name}" operation.`,
              {
                code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_CONFLICT,
                retryable: false,
                toolCallId: request.id,
              }
            ));
          }

          const result = await awaitWithAbort(
            idempotencyClaim?.promise ?? runProviderScopedOperation(),
            callSignal
          );
          return finish(withToolCallId(result, request.id));
        } catch (error) {
          const errorMetadata = getToolCallErrorMetadata(error);
          const timedOut = timeoutState !== undefined && (
            timeoutState.signal.aborted || isToolCallTimeoutError(error)
          );
          const externallyCancelled = options?.signal?.aborted === true;
          const providerAborted =
            !timedOut &&
            !externallyCancelled &&
            error instanceof Error &&
            error.name === 'AbortError';
          if (
            (timedOut || externallyCancelled || providerAborted) &&
            durableAbortTransition
          ) {
            const settlement = await durableAbortTransition;
            if (!settlement.safe) {
              return finish(storeFailureResult(settlement.error, true));
            }
          }
          return finish(createToolCallError(
            timedOut
              ? `Tool call timed out after ${timeoutState!.timeoutMs}ms.`
              : error instanceof Error ? error.message : String(error),
            {
              code: timedOut
                ? TOOL_CALL_ERROR_CODES.TIMEOUT
                : externallyCancelled
                ? TOOL_CALL_ERROR_CODES.CANCELLED
                : providerAborted
                ? TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED
                : errorMetadata.code ?? TOOL_CALL_ERROR_CODES.EXECUTION_FAILED,
              retryable:
                timedOut ||
                externallyCancelled ||
                providerAborted ||
                errorMetadata.retryable === true,
              ...(timedOut
                ? {
                    details: {
                      timeoutMs: timeoutState!.timeoutMs,
                      executionState: 'detached',
                    },
                  }
                : providerAborted
                ? { details: { executionState: 'detached' } }
                : errorMetadata.details === undefined
                ? {}
                : { details: errorMetadata.details }),
              toolCallId: request.id,
            }
          ));
        }
      };
    }, [
      dispatchLifecycle,
      durableOwnerId,
    ]);

    const getOperationStatus = useMemo<ToolOperationStatusReader>(
      () => async (toolName, idempotencyKey, context) => {
        if (!durableOperationStore) return undefined;
        const key = createToolOperationKey(
          toolName,
          idempotencyKey,
          context?.sessionId
        );
        return durableOperationStore.get(key);
      },
      []
    );

    const reconcileOperation = useMemo<ToolOperationReconciler>(
      () => async (toolName, idempotencyKey, resolution, context, expectedFence) => {
        if (!durableOperationStore) return undefined;
        const key = createToolOperationKey(
          toolName,
          idempotencyKey,
          context?.sessionId
        );
        return durableOperationStore.resolveUnknown(
          key,
          durableOwnerId,
          resolution,
          expectedFence
        );
      },
      [durableOwnerId]
    );

    const registry = useMemo(
      () => createToolRegistry(
        schema,
        executeToolCall,
        allowedToolNames,
        toolListPageSize,
        getOperationStatus,
        reconcileOperation
      ),
      [executeToolCall, getOperationStatus, reconcileOperation]
    );

    const contextValue = useMemo(
      () => ({
        actionRegisterRef,
        registry,
        dispatch,
        dispatchLifecycle,
      }),
      [dispatch, dispatchLifecycle, registry]
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
   * Raw ActionRegister dispatch for compatibility with existing ActionContext
   * code. It intentionally bypasses the canonical tool policy, lifecycle,
   * idempotency, durable-operation, and output-budget boundaries.
   *
   * @deprecated Use useToolCall() for new tool invocations.
   */
  const useToolDispatch = () => {
    const { dispatch: contextDispatch } = useToolContext();
    return contextDispatch;
  };

  /**
   * Invoke a UI-originated tool through the canonical ToolRegistry boundary.
   * This keeps direct UI use in the same policy and provenance path as model
   * and MCP calls without making React a transport implementation.
   */
  const useToolCall = (): ToolCallFunction<TPayloadMap> => {
    const { registry } = useToolContext();
    const hookId = useId();
    const sequenceRef = useRef(0);

    return useMemo(() => (
      <K extends Extract<keyof TPayloadMap, string>>(
        toolName: K,
        payload: TPayloadMap[K],
        options?: DirectToolCallOptions
      ): Promise<ToolCallResult> => {
        const { toolCallId, context, ...callOptions } = options ?? {};
        const name = String(toolName);
        const id = toolCallId ?? `${contextName}:direct:${hookId}:${++sequenceRef.current}`;
        const params = payload === undefined
          ? { name }
          : { name, arguments: payload as Record<string, unknown> };

        return registry.callTool(
          { id, method: 'tools/call', params },
          {
            ...callOptions,
            context: {
              ...context,
              source: context?.source ?? 'local',
              mode: context?.mode ?? 'direct',
            },
          }
        );
      }
    ), [hookId, registry]);
  };

  /** Internal registration hook shared by legacy and explicit result handlers. */
  const useRegisteredToolHandler = <K extends Extract<keyof TSchema, string>, R = void>(
    toolName: K,
    handler: ActionHandler<TPayloadMap[K], R>,
    handlerConfig: HandlerConfig<TPayloadMap[K]> | undefined,
    registrationRole: 'legacy' | 'result',
  ): void => {
    const { actionRegisterRef, dispatchLifecycle } = useToolContext();
    const handlerId = useId();
    const effectGenerationRef = useRef(0);
    const registrationRef = useRef<{
      register: ActionRegister<TPayloadMap>;
      toolName: keyof TPayloadMap;
      config: HandlerConfig<TPayloadMap[K]>;
      active: boolean;
      unregister: () => void;
    } | null>(null);

    // Publish handler updates only after React commits the render. Mutating the
    // ref during render would let an abandoned concurrent render leak its
    // handler into the currently registered wrapper.
    const handlerRef = useRef(handler);
    useInsertionEffect(() => {
      handlerRef.current = handler;
    }, [handler]);

    const priority = handlerConfig?.priority ?? 0;
    const id = handlerConfig?.id || `tool_${String(toolName)}_${handlerId}`;
    const blocking = handlerConfig?.blocking;
    const scheduling = handlerConfig?.scheduling;
    const errorPolicy = handlerConfig?.errorPolicy;
    const once = handlerConfig?.once ?? false;
    const debounce = handlerConfig?.debounce;
    const throttle = handlerConfig?.throttle;
    const cleanup = handlerConfig?.cleanup;
    const condition = handlerConfig?.condition;
    const stableHandlerConfig = useMemo((): HandlerConfig<TPayloadMap[K]> => ({
      priority,
      id,
      ...(blocking !== undefined && { blocking }),
      ...(scheduling !== undefined && { scheduling }),
      ...(errorPolicy !== undefined && { errorPolicy }),
      once,
      replaceExisting: true,
      ...(cleanup !== undefined && {
        cleanup: () => dispatchLifecycle.scheduleHandlerCleanup(cleanup),
      }),
      ...(condition !== undefined && { condition }),
      ...(debounce !== undefined && { debounce }),
      ...(throttle !== undefined && { throttle }),
    }), [
      priority,
      id,
      blocking,
      scheduling,
      errorPolicy,
      once,
      cleanup,
      condition,
      debounce,
      throttle,
      dispatchLifecycle,
    ]);

    // A tool handler belongs to the logical Provider lifetime. Insertion
    // registration stays connected while Activity hides passive/layout effects
    // and avoids a child-before-parent registration window on reveal.
    useInsertionEffect(() => {
      const register = actionRegisterRef.current;
      if (!register) return;
      const generation = ++effectGenerationRef.current;
      const normalizedToolName = toolName as K;
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

        // Tool schemas currently model payloads, not an action-keyed output
        // map. The adapter supplies `unknown` for that internal result map
        // while registerResult still selects core's narrower runtime controller.
        nextLease.unregister = registrationRole === 'result'
          ? (register as unknown as {
              registerResult: (
                action: K,
                handler: ActionResultHandler<TPayloadMap[K], unknown>,
                config?: HandlerConfig<TPayloadMap[K]>,
              ) => () => void;
            }).registerResult(
              normalizedToolName,
              wrapperHandler as ActionResultHandler<TPayloadMap[K], unknown>,
              stableHandlerConfig,
            )
          : register.register(
              normalizedToolName,
              wrapperHandler as ActionHandler<TPayloadMap[K], unknown>,
              stableHandlerConfig,
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
    }, [toolName, actionRegisterRef, dispatchLifecycle, stableHandlerConfig, registrationRole]);
  };

  /**
   * Register a legacy tool handler with the full PipelineController.
   * Keep this API for handlers that need legacy control-flow capabilities.
   */
  const useToolHandler = <K extends Extract<keyof TSchema, string>, R = void>(
    toolName: K,
    handler: ActionHandler<TPayloadMap[K], R>,
    handlerConfig?: HandlerConfig<TPayloadMap[K]>
  ): void => useRegisteredToolHandler(toolName, handler, handlerConfig, 'legacy');

  /** Register a result-producing tool handler in core's explicit result phase. */
  const useToolResultHandler = <K extends Extract<keyof TSchema, string>, R = unknown>(
    toolName: K,
    handler: ActionResultHandler<TPayloadMap[K], R>,
    handlerConfig?: HandlerConfig<TPayloadMap[K]>
  ): void => useRegisteredToolHandler(
    toolName,
    handler as unknown as ActionHandler<TPayloadMap[K], R>,
    handlerConfig,
    'result',
  );

  /**
   * Hook to access the tool registry
   */
  const useToolRegistry = (): ToolRegistry<TSchema> => {
    const { registry: contextRegistry } = useToolContext();
    return contextRegistry;
  };

  /**
   * Raw ActionRegister result API for advanced ActionContext integrations.
   * It is not a canonical tool invocation path; use useToolCall() for tools.
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
      return <K extends Extract<keyof TPayloadMap, string>>(
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
            toolName as Extract<keyof TPayloadMap, string>,
            ...([payload, withProviderDispatchSignal(options, signal)] as DispatchArgs<TPayloadMap[K]>)
          )
        ).finally(() => {
          activeControllersRef.current.delete(scopeController);
        });
        void trackedPromise.catch(() => {});
        return trackedPromise;
      };
    }, [actionRegisterRef, dispatchLifecycle]);

    const dispatchWithResult = useMemo(() => {
      return <K extends Extract<keyof TPayloadMap, string>, R = void>(
        toolName: K,
        ...args: DispatchArgs<TPayloadMap[K]>
      ): Promise<ToolExecutionResult<R>> => {
        const [payload, options] = args as [TPayloadMap[K] | undefined, DispatchOptions | undefined];
        const register = actionRegisterRef.current;
        if (!register) {
          throw new Error(`ActionRegister not initialized in ${contextName}`);
        }

        const scopeController = new AbortController();
        activeControllersRef.current.add(scopeController);

        const trackedPromise = dispatchLifecycle
          .run(
            [options?.signal, scopeController.signal],
            signal => register.dispatchWithResult<Extract<K, string>, R>(
              toolName as Extract<K, string>,
              ...([payload, withProviderDispatchSignal(options, signal)] as DispatchArgs<TPayloadMap[K]>)
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
    useToolCall,
    useToolHandler,
    useToolResultHandler,
    useToolRegistry,
    useToolDispatchWithResult,
    useActionRegister,
    context: ToolReactContext,
  };
}
