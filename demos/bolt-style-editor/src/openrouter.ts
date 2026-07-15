import type { ActionSchemaMap, ToolRegistry } from '@context-action/react';
import { recordToolList } from './tool-trace';

const API_KEY_STORAGE_KEY = 'context-action.openrouter.api-key';
const MODEL_STORAGE_KEY = 'context-action.openrouter.model';
const ENDPOINT_STORAGE_KEY = 'context-action.openrouter.endpoint';

export type OpenRouterSettings = {
  apiKey: string;
  model: string;
  endpoint: string;
};

export type AgentRunResult = {
  toolNames: string[];
  response: string;
  failedTool?: string;
  revisionConflict?: boolean;
  failed?: boolean;
  retryable?: boolean;
};

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

export const DEFAULT_OPENROUTER_SETTINGS: OpenRouterSettings = {
  apiKey: '',
  model: 'openai/gpt-4o-mini',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
};

function readStorage(key: string): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(key)?.trim() ?? '';
}

export function readOpenRouterSettings(): OpenRouterSettings {
  return {
    apiKey: readStorage(API_KEY_STORAGE_KEY),
    model: readStorage(MODEL_STORAGE_KEY) || DEFAULT_OPENROUTER_SETTINGS.model,
    endpoint:
      readStorage(ENDPOINT_STORAGE_KEY) || DEFAULT_OPENROUTER_SETTINGS.endpoint,
  };
}

export function saveOpenRouterSettings(
  settings: OpenRouterSettings
): OpenRouterSettings {
  const next = {
    apiKey: settings.apiKey.trim(),
    model: settings.model.trim() || DEFAULT_OPENROUTER_SETTINGS.model,
    endpoint: settings.endpoint.trim() || DEFAULT_OPENROUTER_SETTINGS.endpoint,
  };

  if (typeof window !== 'undefined') {
    if (next.apiKey) {
      window.localStorage.setItem(API_KEY_STORAGE_KEY, next.apiKey);
    } else {
      window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
    window.localStorage.setItem(MODEL_STORAGE_KEY, next.model);
    window.localStorage.setItem(ENDPOINT_STORAGE_KEY, next.endpoint);
  }

  return next;
}

type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | {
      role: 'assistant';
      content: string | null;
      tool_calls?: OpenRouterToolCall[];
    }
  | { role: 'tool'; tool_call_id: string; content: string };

type OpenRouterToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      role: 'assistant';
      content?: string | null;
      tool_calls?: OpenRouterToolCall[];
    };
  }>;
  error?: { message?: string };
};

function responseErrorCode(status: number): {
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

async function readOpenRouterResponse(
  response: Response
): Promise<OpenRouterResponse> {
  const body = await response.text();
  if (!body.trim()) return {};
  try {
    return JSON.parse(body) as OpenRouterResponse;
  } catch (error) {
    throw new OpenRouterRequestError(
      response.ok
        ? `Endpoint returned an invalid JSON response (HTTP ${response.status}). Check the chat-completions endpoint.`
        : `Request failed with a non-JSON response (HTTP ${response.status})${compactResponseText(body) ? `: ${compactResponseText(body)}` : '.'}`,
      {
        code: 'OPENROUTER_INVALID_RESPONSE',
        retryable: false,
        status: response.status,
        cause: error,
      }
    );
  }
}

function toolResultContent(result: {
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

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const reason = signal.reason;
  throw reason instanceof Error
    ? reason
    : new DOMException('Execution cancelled.', 'AbortError');
}

export async function runOpenRouterAgent<TSchema extends ActionSchemaMap>(
  registry: ToolRegistry<TSchema>,
  prompt: string,
  settings: OpenRouterSettings,
  signal?: AbortSignal
): Promise<AgentRunResult> {
  if (!settings.apiKey) {
    throw new OpenRouterRequestError('API key is not configured.', {
      code: 'OPENROUTER_CONFIGURATION_ERROR',
      retryable: false,
    });
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a realtime web coding assistant. Use the available tools to inspect or update the small HTML/CSS/JS workspace. Use workspace.getStatus or workspace.listFiles to inspect the current workspace before planning mutations. Use workspace.openFile when the user asks to open or show a file in the editor, workspace.downloadFile when the user explicitly asks to download or export a workspace file, workspace.createFile for a new text file, workspace.renameFile when the user asks to rename or move a workspace file, workspace.deleteFile when a file removal is requested, workspace.revertFile only when the user explicitly asks to discard unsaved changes, workspace.undo or workspace.redo when the user explicitly asks to undo or redo the latest workspace edit, and workspace.applyPatch for a bounded exact text replacement when the current source is known. Use preview.refresh when the user explicitly asks to refresh or remount the sandbox preview. Use workspace.saveAll when the user asks to save, persist, or apply the current changes to the opened local folder; it is the explicit filesystem boundary and requires a writable folder. Use workspace.saveCheckpoint only after workspace.getStatus confirms that no writable folder is connected and the user wants to mark the browser-only checkpoint clean. Use workspace.reloadFolder only when the user explicitly asks to re-read or refresh the already connected local folder; it replaces the browser workspace and should be preceded by workspace.getStatus. Use workspace.disconnectFolder when the user wants to stop syncing the local folder while keeping the browser workspace. When workspace.readFile or workspace.listFiles returns a revision, pass it as expectedRevision to workspace.createFile, workspace.renameFile, workspace.deleteFile, workspace.writeFile, workspace.applyPatch, workspace.revertFile, workspace.undo, workspace.redo, or workspace.saveCheckpoint when possible so stale mutations are rejected. Prefer preview.setTheme, preview.addFeature, and preview.updateHero for visual requests. After tool calls, briefly explain what changed.',
    },
    { role: 'user', content: prompt },
  ];
  const listedTools = registry.listTools({ method: 'tools/list' });
  recordToolList(listedTools.tools.length, 'openrouter');
  const toolNames: string[] = [];

  for (let turn = 0; turn < 5; turn += 1) {
    throwIfAborted(signal);
    let response: Response;
    try {
      response = await fetch(settings.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Context-Action Web Coding Studio',
        },
        signal,
        body: JSON.stringify({
          model: settings.model,
          messages,
          tools: registry.toOpenAI(),
          tool_choice: 'auto',
          max_tokens: 1200,
        }),
      });
    } catch (error) {
      throwIfAborted(signal);
      throw new OpenRouterRequestError(
        error instanceof Error
          ? `Network request failed: ${error.message}`
          : 'Network request failed.',
        {
          code: 'OPENROUTER_NETWORK_ERROR',
          retryable: true,
          cause: error,
        }
      );
    }
    const payload = await readOpenRouterResponse(response);

    if (!response.ok) {
      const errorType = responseErrorCode(response.status);
      throw new OpenRouterRequestError(
        payload.error?.message || `Request failed (HTTP ${response.status}).`,
        {
          ...errorType,
          status: response.status,
        }
      );
    }

    const message = payload.choices?.[0]?.message;
    if (!message) {
      throw new OpenRouterRequestError(
        'Provider returned no assistant message.',
        {
          code: 'OPENROUTER_NO_ASSISTANT_MESSAGE',
          retryable: true,
        }
      );
    }

    if (!message.tool_calls?.length) {
      return {
        toolNames,
        response:
          message.content?.trim() ||
          `OpenRouter completed ${toolNames.length} tool call(s).`,
      };
    }

    messages.push({
      role: 'assistant',
      content: message.content ?? null,
      tool_calls: message.tool_calls,
    });

    for (const toolCall of message.tool_calls) {
      throwIfAborted(signal);
      let argumentsValue: Record<string, unknown>;
      try {
        const parsed: unknown = JSON.parse(toolCall.function.arguments);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Tool arguments must be a JSON object.');
        }
        argumentsValue = parsed as Record<string, unknown>;
      } catch (error) {
        throw new OpenRouterRequestError(
          `Model returned invalid JSON arguments for tool "${toolCall.function.name}".`,
          {
            code: 'OPENROUTER_INVALID_TOOL_CALL',
            retryable: true,
            cause: error,
          }
        );
      }

      const result = await registry.executeModelToolCall(
        {
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: argumentsValue,
        },
        { context: { source: 'model' }, signal }
      );
      throwIfAborted(signal);
      toolNames.push(toolCall.function.name);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolResultContent(result),
      });
    }
  }

  throw new OpenRouterRequestError('Tool loop reached the five-step limit.', {
    code: 'OPENROUTER_TOOL_LOOP_LIMIT',
    retryable: false,
  });
}
