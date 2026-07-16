import {
  type ActionSchemaMap,
  type ToolRegistry,
  toToolListRequest,
} from '@context-action/react';
import type { OpenRouterToolCall } from './openrouter-protocol';
import {
  assertOpenRouterToolCallBudget,
  OPENROUTER_MAX_TOOL_TURNS,
  OPENROUTER_MAX_TRANSIENT_RETRIES,
  OpenRouterRequestError,
  openRouterRetryDelayMs,
  readOpenRouterResponse,
  responseErrorCode,
  throwIfAborted,
  toolResultContent,
} from './openrouter-protocol';
import { recordToolList } from './tool-trace';

export type { OpenRouterErrorCode } from './openrouter-protocol';
export { OpenRouterRequestError } from './openrouter-protocol';

const API_KEY_STORAGE_KEY = 'context-action.openrouter.api-key';
const MODEL_STORAGE_KEY = 'context-action.openrouter.model';
const ENDPOINT_STORAGE_KEY = 'context-action.openrouter.endpoint';
export const OPENROUTER_REQUEST_TIMEOUT_MS = 20_000;
const settingsSubscribers = new Set<() => void>();
let storageListenerAttached = false;
const sessionFallback = new Map<string, string>();

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function notifySettingsSubscribers(): void {
  for (const subscriber of settingsSubscribers) subscriber();
}

function ensureStorageListener(): void {
  if (storageListenerAttached || typeof window === 'undefined') return;
  const storage = getLocalStorage();
  window.addEventListener('storage', (event) => {
    if (event.storageArea && event.storageArea !== storage) return;
    if (
      event.key === API_KEY_STORAGE_KEY ||
      event.key === MODEL_STORAGE_KEY ||
      event.key === ENDPOINT_STORAGE_KEY ||
      event.key === null
    ) {
      notifySettingsSubscribers();
    }
  });
  storageListenerAttached = true;
}

export type OpenRouterSettings = {
  apiKey: string;
  model: string;
  endpoint: string;
};

export type AgentRunResult = {
  toolNames: string[];
  response: string;
  failedTool?: string;
  errorCode?: string;
  revisionConflict?: boolean;
  failed?: boolean;
  retryable?: boolean;
};

export type OpenRouterRetryEvent = {
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  reason: 'network' | 'provider' | 'timeout';
};

export const DEFAULT_OPENROUTER_SETTINGS: OpenRouterSettings = {
  apiKey: '',
  model: 'openai/gpt-4o-mini',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
};

function readStorage(key: string): string {
  if (typeof window === 'undefined') return '';
  const storage = getLocalStorage();
  if (!storage) return sessionFallback.get(key) ?? '';
  try {
    return storage.getItem(key)?.trim() ?? '';
  } catch {
    return sessionFallback.get(key) ?? '';
  }
}

function writeStorage(key: string, value: string): void {
  if (value) sessionFallback.set(key, value);
  else sessionFallback.delete(key);

  const storage = getLocalStorage();
  try {
    if (value) storage?.setItem(key, value);
    else storage?.removeItem(key);
  } catch {
    // Keep the current tab usable when browser storage is blocked or full.
  }
}

function waitForRetry(delayMs: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);
  return new Promise((resolve, reject) => {
    let timeoutId: number | undefined;
    const finish = (callback: () => void) => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abort);
      callback();
    };
    const abort = () =>
      finish(() =>
        reject(
          signal?.reason instanceof Error
            ? signal.reason
            : new DOMException('Execution cancelled.', 'AbortError')
        )
      );
    timeoutId = window.setTimeout(() => finish(resolve), delayMs);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
  });
}

async function fetchWithTimeout(
  endpoint: string,
  init: RequestInit,
  signal?: AbortSignal
): Promise<Response> {
  const requestController = new AbortController();
  const timeoutId = window.setTimeout(
    () =>
      requestController.abort(
        new DOMException('OpenRouter request timed out.', 'TimeoutError')
      ),
    OPENROUTER_REQUEST_TIMEOUT_MS
  );
  const forwardAbort = () => requestController.abort(signal?.reason);
  signal?.addEventListener('abort', forwardAbort, { once: true });
  if (signal?.aborted) forwardAbort();

  try {
    return await fetch(endpoint, {
      ...init,
      signal: requestController.signal,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw signal.reason instanceof Error
        ? signal.reason
        : new DOMException('Execution cancelled.', 'AbortError');
    }
    if (requestController.signal.aborted) {
      throw new OpenRouterRequestError(
        'OpenRouter did not respond before the request timeout.',
        {
          code: 'OPENROUTER_TIMEOUT',
          retryable: true,
          cause: error,
        }
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

export function readOpenRouterSettings(): OpenRouterSettings {
  return {
    apiKey: readStorage(API_KEY_STORAGE_KEY),
    model: readStorage(MODEL_STORAGE_KEY) || DEFAULT_OPENROUTER_SETTINGS.model,
    endpoint:
      readStorage(ENDPOINT_STORAGE_KEY) || DEFAULT_OPENROUTER_SETTINGS.endpoint,
  };
}

/** Subscribe to same-origin provider setting changes from this or another tab. */
export function subscribeOpenRouterSettings(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  ensureStorageListener();
  settingsSubscribers.add(listener);
  return () => settingsSubscribers.delete(listener);
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
    writeStorage(API_KEY_STORAGE_KEY, next.apiKey);
    writeStorage(MODEL_STORAGE_KEY, next.model);
    writeStorage(ENDPOINT_STORAGE_KEY, next.endpoint);
  }

  notifySettingsSubscribers();

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

export async function runOpenRouterAgent<TSchema extends ActionSchemaMap>(
  registry: ToolRegistry<TSchema>,
  prompt: string,
  settings: OpenRouterSettings,
  signal?: AbortSignal,
  sessionId?: string,
  onRetry?: (event: OpenRouterRetryEvent) => void
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
        'You are a realtime web coding assistant. Use the available tools to inspect or update the small HTML/CSS/JS workspace. Use workspace.getStatus or workspace.listFiles to inspect the current workspace before planning mutations. Use workspace.openFile when the user asks to open or show a file in the editor, workspace.downloadFile when the user explicitly asks to download or export a workspace file, workspace.createFile for a new text file, workspace.renameFile when the user asks to rename or move a workspace file, workspace.deleteFile when a file removal is requested, workspace.revertFile only when the user explicitly asks to discard unsaved changes, workspace.undo or workspace.redo when the user explicitly asks to undo or redo the latest workspace edit, and workspace.applyPatch for a bounded exact text replacement when the current source is known. Use workspace.reset only when the user explicitly asks to restore or reset the browser demo workspace; it requires no writable folder and replaces the browser workspace with the four-file seed. Use preview.refresh when the user explicitly asks to refresh or remount the sandbox preview. Use workspace.saveAll when the user asks to save, persist, or apply the current changes to the opened local folder; it is the explicit filesystem boundary and requires a writable folder. Use workspace.saveCheckpoint only after workspace.getStatus confirms that no writable folder is connected and the user wants to mark the browser-only checkpoint clean. Use workspace.reloadFolder only when the user explicitly asks to re-read or refresh the already connected local folder; it replaces the browser workspace and should be preceded by workspace.getStatus. Use workspace.disconnectFolder when the user wants to stop syncing the local folder while keeping the browser workspace. When workspace.readFile or workspace.listFiles returns a revision, pass it as expectedRevision to workspace.reset, workspace.createFile, workspace.renameFile, workspace.deleteFile, workspace.writeFile, workspace.applyPatch, workspace.revertFile, workspace.undo, workspace.redo, workspace.saveCheckpoint, workspace.saveAll, or workspace.reloadFolder when possible so stale mutations are rejected. Prefer preview.setTheme, preview.addFeature, and preview.updateHero for visual requests. After tool calls, briefly explain what changed.',
    },
    { role: 'user', content: prompt },
  ];
  const listedTools = registry.listTools(toToolListRequest());
  recordToolList(listedTools.tools.length, 'openrouter', sessionId);
  const toolNames: string[] = [];

  let completedToolCalls = 0;
  for (let turn = 0; turn < OPENROUTER_MAX_TOOL_TURNS; turn += 1) {
    throwIfAborted(signal);
    let response: Response;
    let transientRetryCount = 0;
    while (true) {
      throwIfAborted(signal);
      try {
        response = await fetchWithTimeout(
          settings.endpoint,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${settings.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': window.location.origin,
              'X-Title': 'Context-Action Web Coding Studio',
            },
            body: JSON.stringify({
              model: settings.model,
              messages,
              tools: registry.toOpenAI(),
              tool_choice: 'auto',
              max_tokens: 1200,
            }),
          },
          signal
        );
      } catch (error) {
        throwIfAborted(signal);
        if (error instanceof OpenRouterRequestError) {
          if (
            error.code === 'OPENROUTER_TIMEOUT' &&
            transientRetryCount < OPENROUTER_MAX_TRANSIENT_RETRIES
          ) {
            const delayMs = openRouterRetryDelayMs(transientRetryCount);
            onRetry?.({
              attempt: transientRetryCount + 1,
              maxAttempts: OPENROUTER_MAX_TRANSIENT_RETRIES,
              delayMs,
              reason: 'timeout',
            });
            await waitForRetry(delayMs, signal);
            transientRetryCount += 1;
            continue;
          }
          throw error;
        }
        if (transientRetryCount < OPENROUTER_MAX_TRANSIENT_RETRIES) {
          const delayMs = openRouterRetryDelayMs(transientRetryCount);
          onRetry?.({
            attempt: transientRetryCount + 1,
            maxAttempts: OPENROUTER_MAX_TRANSIENT_RETRIES,
            delayMs,
            reason: 'network',
          });
          await waitForRetry(delayMs, signal);
          transientRetryCount += 1;
          continue;
        }
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

      const responseType = responseErrorCode(response.status);
      if (
        !response.ok &&
        responseType.retryable &&
        transientRetryCount < OPENROUTER_MAX_TRANSIENT_RETRIES
      ) {
        await response.body?.cancel().catch(() => undefined);
        const delayMs = openRouterRetryDelayMs(
          transientRetryCount,
          response.headers.get('retry-after')
        );
        onRetry?.({
          attempt: transientRetryCount + 1,
          maxAttempts: OPENROUTER_MAX_TRANSIENT_RETRIES,
          delayMs,
          reason: 'provider',
        });
        await waitForRetry(delayMs, signal);
        transientRetryCount += 1;
        continue;
      }
      break;
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

    assertOpenRouterToolCallBudget(
      completedToolCalls,
      message.tool_calls.length
    );

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
        {
          context: {
            source: 'model',
            mode: 'agent',
            ...(sessionId ? { sessionId } : {}),
          },
          signal,
        }
      );
      throwIfAborted(signal);
      toolNames.push(toolCall.function.name);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolResultContent(result),
      });
      completedToolCalls += 1;
    }
  }

  throw new OpenRouterRequestError(
    `Tool loop reached the ${OPENROUTER_MAX_TOOL_TURNS}-turn limit.`,
    {
      code: 'OPENROUTER_TOOL_LOOP_LIMIT',
      retryable: false,
    }
  );
}
