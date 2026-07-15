export type OpenRouterErrorCode =
  | 'OPENROUTER_CONFIGURATION_ERROR'
  | 'OPENROUTER_AUTHENTICATION_FAILED'
  | 'OPENROUTER_ACCESS_DENIED'
  | 'OPENROUTER_RATE_LIMITED'
  | 'OPENROUTER_PROVIDER_ERROR'
  | 'OPENROUTER_NETWORK_ERROR'
  | 'OPENROUTER_INVALID_RESPONSE'
  | 'OPENROUTER_INVALID_TOOL_CALL'
  | 'OPENROUTER_NO_ASSISTANT_MESSAGE'
  | 'OPENROUTER_TOOL_LOOP_LIMIT';

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
  try {
    return JSON.parse(body) as OpenRouterResponse;
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
  if (result.isError) {
    return JSON.stringify({
      status: 'error',
      code: result.error?.code,
      message: result.error?.message,
      ...(result.error?.retryable === undefined
        ? {}
        : { retryable: result.error.retryable }),
      ...(result.error?.details === undefined
        ? {}
        : { details: result.error.details }),
    });
  }

  return JSON.stringify(
    result.structuredContent !== undefined
      ? result.structuredContent
      : {
          status: 'completed',
          content: result.content?.map((block) => block.text).join('\n'),
        }
  );
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const reason = signal.reason;
  throw reason instanceof Error
    ? reason
    : new DOMException('Execution cancelled.', 'AbortError');
}
