/**
 * Browser-side OpenRouter adapter for AI SDK v7.
 *
 * The caller supplies a user-owned OpenRouter key. Do not use this runner
 * with application secrets because requests are made directly from the browser.
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createAISDKToolScope } from '@context-action/ai-sdk';
import { type ActionSchemaMap } from '@context-action/tool-protocol';
import { generateText, stepCountIs } from 'ai';
import type {
  ToolTextGenerationRequest,
  ToolTextGenerator,
} from './ai-tool-runner';
import { createToolCallSessionId } from './tool-call-trace';

export interface BrowserOpenRouterToolRunnerOptions {
  apiKey: string;
  referer: string;
}

/**
 * Creates an AI SDK v7 tool runner that calls OpenRouter from the browser.
 *
 * This is intentionally a demo-only implementation: it accepts a user-owned
 * session key and must never receive an application-owned secret.
 */
export function createBrowserOpenRouterToolRunner(
  options: BrowserOpenRouterToolRunnerOptions
): ToolTextGenerator {
  const openrouter = createOpenAICompatible({
    name: 'openrouter',
    apiKey: options.apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
      'HTTP-Referer': options.referer,
      'X-Title': 'ToolContext AI SDK v7 Demo',
    },
  });

  return {
    async generate<TSchema extends ActionSchemaMap>(
      request: ToolTextGenerationRequest<TSchema>
    ) {
      const sessionId = request.sessionId ?? createToolCallSessionId();
      const toolScope = createAISDKToolScope(request.registry, {
        sessionId,
        toolNames: request.toolNames,
      });
      const response = await generateText({
        model: openrouter.chatModel(request.model),
        messages: request.messages,
        tools: toolScope.tools,
        activeTools: toolScope.activeTools,
        maxOutputTokens: 1024,
        stopWhen: stepCountIs(5),
        abortSignal: request.signal,
      });

      return {
        text: response.text,
        toolCallCount: response.toolCalls.length,
        responseMessages: response.responseMessages,
      };
    },
  };
}
