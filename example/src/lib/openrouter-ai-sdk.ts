/**
 * Browser-side OpenRouter adapter for AI SDK v7.
 *
 * The caller supplies a user-owned OpenRouter key. Do not use this runner
 * with application secrets because requests are made directly from the browser.
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { ActionSchemaMap } from '@context-action/core';
import {
  listAllTools,
  stringifyToolContent,
  type ToolRegistry,
} from '@context-action/react';
import {
  dynamicTool,
  generateText,
  jsonSchema,
  stepCountIs,
  type ToolSet,
} from 'ai';
import type {
  ToolTextGenerationRequest,
  ToolTextGenerator,
} from './ai-tool-runner';
import { createToolCallSessionId } from './tool-call-trace';

export interface BrowserOpenRouterToolRunnerOptions {
  apiKey: string;
  referer: string;
}

function createToolSet<TSchema extends ActionSchemaMap>(
  registry: ToolRegistry<TSchema>,
  sessionId: string
): ToolSet {
  const listedTools = listAllTools(registry);
  return Object.fromEntries(
    listedTools.map((listedTool) => {
      const toolName = listedTool.name;

      return [
        toolName,
        dynamicTool({
          description: listedTool.description,
          inputSchema: jsonSchema(listedTool.inputSchema),
          execute: async (input, executionOptions) => {
            const result = await registry.executeModelToolCall(
              {
                id: executionOptions.toolCallId,
                name: toolName,
                arguments: input as Record<string, unknown>,
              },
              {
                signal: executionOptions.abortSignal,
                context: { source: 'model', mode: 'agent', sessionId },
              }
            );
            const resultText = stringifyToolContent(result.content);

            if (result.isError) {
              return {
                tool: String(toolName),
                status: 'error',
                error: result.error ?? {
                  code: 'TOOL_EXECUTION_FAILED',
                  message: resultText || `Tool ${toolName} failed`,
                },
                message: resultText,
              };
            }

            return (
              result.structuredContent ?? {
                tool: toolName,
                status: 'completed',
                message: resultText,
              }
            );
          },
        }),
      ];
    })
  );
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
      const response = await generateText({
        model: openrouter.chatModel(request.model),
        messages: request.messages,
        tools: createToolSet(request.registry, sessionId),
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
