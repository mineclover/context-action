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

function toolResultContent(result: {
  isError?: boolean;
  error?: { code?: string; message?: string };
  content?: Array<{ text: string }>;
  structuredContent?: unknown;
}): string {
  if (result.isError) {
    return JSON.stringify({
      status: 'error',
      code: result.error?.code,
      message: result.error?.message,
    });
  }

  return JSON.stringify(
    result.structuredContent ?? {
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
): Promise<{ toolNames: string[]; response: string }> {
  if (!settings.apiKey) {
    throw new Error('OpenRouter API key is not configured.');
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a realtime web coding assistant. Use the available tools to inspect or update the small HTML/CSS/JS workspace. Use workspace.createFile for a new text file, workspace.deleteFile when a file removal is requested, and workspace.revertFile only when the user explicitly asks to discard unsaved changes. Prefer preview.setTheme, preview.addFeature, and preview.updateHero for visual requests. After tool calls, briefly explain what changed.',
    },
    { role: 'user', content: prompt },
  ];
  const listedTools = registry.listTools({ method: 'tools/list' });
  recordToolList(listedTools.tools.length, 'openrouter');
  const toolNames: string[] = [];

  for (let turn = 0; turn < 5; turn += 1) {
    throwIfAborted(signal);
    const response = await fetch(settings.endpoint, {
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
    const payload = (await response.json()) as OpenRouterResponse;

    if (!response.ok) {
      throw new Error(
        payload.error?.message ||
          `OpenRouter request failed (${response.status}).`
      );
    }

    const message = payload.choices?.[0]?.message;
    if (!message) throw new Error('OpenRouter returned no assistant message.');

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
        argumentsValue = JSON.parse(toolCall.function.arguments) as Record<
          string,
          unknown
        >;
      } catch {
        argumentsValue = {};
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

  throw new Error('OpenRouter tool loop reached the five-step limit.');
}
