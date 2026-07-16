export type OpenRouterErrorCode =
  | 'OPENROUTER_CONFIGURATION_ERROR'
  | 'OPENROUTER_AUTHENTICATION_FAILED'
  | 'OPENROUTER_ACCESS_DENIED'
  | 'OPENROUTER_RATE_LIMITED'
  | 'OPENROUTER_PROVIDER_ERROR'
  | 'OPENROUTER_NETWORK_ERROR'
  | 'OPENROUTER_TIMEOUT'
  | 'OPENROUTER_INVALID_RESPONSE'
  | 'OPENROUTER_INVALID_TOOL_CALL'
  | 'OPENROUTER_NO_ASSISTANT_MESSAGE'
  | 'OPENROUTER_TOOL_LOOP_LIMIT'
  | 'OPENROUTER_TOOL_CALL_LIMIT';

export class OpenRouterRequestError extends Error {
  readonly code: OpenRouterErrorCode;
  readonly retryable: boolean;
  readonly status?: number;

  constructor(
    message: string,
    options: {
      code: OpenRouterErrorCode;
      retryable: boolean;
      status?: number;
      cause?: unknown;
    }
  ) {
    super(`[${options.code}] ${message}`, { cause: options.cause });
    this.name = 'OpenRouterRequestError';
    this.code = options.code;
    this.retryable = options.retryable;
    this.status = options.status;
  }
}

export const OPENROUTER_MAX_TRANSIENT_RETRIES = 2;
export const OPENROUTER_MAX_TOOL_TURNS = 5;
export const OPENROUTER_MAX_TOOL_CALLS = 12;

export function openRouterRetryDelayMs(
  attempt: number,
  retryAfterHeader?: string | null
): number {
  const retryAfter = retryAfterHeader?.trim() ?? '';
  const seconds = Number(retryAfter);
  if (retryAfter && Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, 4_000);
  }

  if (retryAfter) {
    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) {
      return Math.min(Math.max(0, retryAt - Date.now()), 4_000);
    }
  }

  return Math.min(350 * 2 ** Math.max(0, attempt), 4_000);
}

export type OpenRouterToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      role: 'assistant';
      content?: string | null;
      tool_calls?: OpenRouterToolCall[];
    };
  }>;
  error?: { message?: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function invalidProviderResponse(
  message: string,
  cause?: unknown
): OpenRouterRequestError {
  return new OpenRouterRequestError(message, {
    code: 'OPENROUTER_INVALID_RESPONSE',
    retryable: false,
    cause,
  });
}

export function assertOpenRouterToolCallBudget(
  completedToolCalls: number,
  upcomingToolCalls: number
): void {
  if (
    completedToolCalls < 0 ||
    upcomingToolCalls < 0 ||
    !Number.isInteger(completedToolCalls) ||
    !Number.isInteger(upcomingToolCalls)
  ) {
    throw new OpenRouterRequestError(
      'Tool call budget values must be integers.',
      {
        code: 'OPENROUTER_TOOL_CALL_LIMIT',
        retryable: false,
      }
    );
  }

  if (completedToolCalls + upcomingToolCalls <= OPENROUTER_MAX_TOOL_CALLS) {
    return;
  }

  throw new OpenRouterRequestError(
    `OpenRouter tool-call budget reached (${OPENROUTER_MAX_TOOL_CALLS} calls per run).`,
    {
      code: 'OPENROUTER_TOOL_CALL_LIMIT',
      retryable: false,
    }
  );
}

function normalizeToolCalls(value: unknown): OpenRouterToolCall[] {
  if (!Array.isArray(value)) {
    throw invalidProviderResponse(
      'Provider returned a non-array assistant tool_calls value.'
    );
  }

  const ids = new Set<string>();
  return value.map((candidate, index) => {
    if (!isRecord(candidate)) {
      throw invalidProviderResponse(
        `Provider returned an invalid tool call at index ${index}.`
      );
    }
    const id = candidate.id;
    const type = candidate.type;
    const functionValue = candidate.function;
    if (typeof id !== 'string' || !id.trim()) {
      throw invalidProviderResponse(
        `Provider returned a tool call without a valid id at index ${index}.`
      );
    }
    if (type !== 'function' || !isRecord(functionValue)) {
      throw invalidProviderResponse(
        `Provider returned a non-function tool call at index ${index}.`
      );
    }
    const name = functionValue.name;
    const argumentsValue = functionValue.arguments;
    if (typeof name !== 'string' || !name.trim()) {
      throw invalidProviderResponse(
        `Provider returned a tool call without a function name at index ${index}.`
      );
    }
    if (typeof argumentsValue !== 'string') {
      throw invalidProviderResponse(
        `Provider returned non-string JSON arguments for tool "${name}".`
      );
    }
    const normalizedId = id.trim();
    if (ids.has(normalizedId)) {
      throw invalidProviderResponse(
        `Provider returned duplicate tool call id "${normalizedId}".`
      );
    }
    ids.add(normalizedId);
    return {
      id: normalizedId,
      type: 'function',
      function: { name: name.trim(), arguments: argumentsValue },
    };
  });
}

export function responseErrorCode(status: number): {
  code: OpenRouterErrorCode;
  retryable: boolean;
} {
  if (status === 401) {
    return {
      code: 'OPENROUTER_AUTHENTICATION_FAILED',
      retryable: false,
    };
  }
  if (status === 403) {
    return { code: 'OPENROUTER_ACCESS_DENIED', retryable: false };
  }
  if (status === 429) {
    return { code: 'OPENROUTER_RATE_LIMITED', retryable: true };
  }
  if (status >= 500) {
    return { code: 'OPENROUTER_PROVIDER_ERROR', retryable: true };
  }
  return { code: 'OPENROUTER_CONFIGURATION_ERROR', retryable: false };
}

function compactResponseText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 240);
}

export async function readOpenRouterResponse(
  response: Response
): Promise<OpenRouterResponse> {
  const body = await response.text();
  if (!body.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch (error) {
    const errorType = response.ok
      ? { code: 'OPENROUTER_INVALID_RESPONSE' as const, retryable: false }
      : responseErrorCode(response.status);
    throw new OpenRouterRequestError(
      response.ok
        ? `Endpoint returned an invalid JSON response (HTTP ${response.status}). Check the chat-completions endpoint.`
        : `Request failed with a non-JSON response (HTTP ${response.status})${compactResponseText(body) ? `: ${compactResponseText(body)}` : '.'}`,
      {
        ...errorType,
        status: response.status,
        cause: error,
      }
    );
  }

  if (!isRecord(parsed)) {
    if (!response.ok) return {};
    throw invalidProviderResponse(
      'Endpoint returned a non-object JSON response.'
    );
  }
  if (!response.ok) return parsed as OpenRouterResponse;

  const choices = parsed.choices;
  if (choices !== undefined && !Array.isArray(choices)) {
    throw invalidProviderResponse(
      'Endpoint returned an invalid choices value.'
    );
  }

  const firstChoice = choices?.[0];
  if (isRecord(firstChoice) && isRecord(firstChoice.message)) {
    const message = firstChoice.message;
    if (message.role !== 'assistant') {
      throw invalidProviderResponse(
        'Endpoint returned a non-assistant message role.'
      );
    }
    if (
      message.content !== undefined &&
      message.content !== null &&
      typeof message.content !== 'string'
    ) {
      throw invalidProviderResponse(
        'Endpoint returned non-string assistant message content.'
      );
    }
    if (message.tool_calls !== undefined) {
      const normalizedToolCalls = normalizeToolCalls(message.tool_calls);
      const normalizedChoices = [...(choices ?? [])];
      normalizedChoices[0] = {
        ...firstChoice,
        message: { ...message, tool_calls: normalizedToolCalls },
      };
      return { ...parsed, choices: normalizedChoices } as OpenRouterResponse;
    }
  }

  return parsed as OpenRouterResponse;
}

export function toolResultContent(result: {
  isError?: boolean;
  error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
    details?: unknown;
  };
  content?: Array<{ text: string }>;
  structuredContent?: unknown;
}): string {
  const value = result.isError
    ? {
        status: 'error',
        code: result.error?.code,
        message: result.error?.message,
        ...(result.error?.retryable === undefined
          ? {}
          : { retryable: result.error.retryable }),
        ...(result.error?.details === undefined
          ? {}
          : { details: result.error.details }),
      }
    : result.structuredContent !== undefined
      ? result.structuredContent
      : {
          status: 'completed',
          content: result.content?.map((block) => block.text).join('\n'),
        };

  try {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) return serialized;
  } catch {
    // Provider tool results must remain a JSON string even when an application
    // handler accidentally returns BigInt or a circular object.
  }

  return JSON.stringify({
    status: 'error',
    code: 'TOOL_RESULT_SERIALIZATION_FAILED',
    message: 'Tool result could not be serialized for the provider.',
  });
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const reason = signal.reason;
  throw reason instanceof Error
    ? reason
    : new DOMException('Execution cancelled.', 'AbortError');
}
