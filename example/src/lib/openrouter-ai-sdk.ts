/**
 * Browser-side OpenRouter adapter for AI SDK v7.
 *
 * The caller supplies a user-owned OpenRouter key. Do not use this runner
 * with application secrets because requests are made directly from the browser.
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { ActionSchemaMap } from '@context-action/core';
import type { ToolRegistry } from '@context-action/react';
import { dynamicTool, generateText, stepCountIs, type ToolSet } from 'ai';
import type {
  ToolTextGenerationRequest,
  ToolTextGenerator,
} from './ai-tool-runner';

export interface BrowserOpenRouterToolRunnerOptions {
  apiKey: string;
  referer: string;
}

function createToolSet<TSchema extends ActionSchemaMap>(
  registry: ToolRegistry<TSchema>
): ToolSet {
  return Object.fromEntries(
    registry.getToolNames().map((toolName) => {
      const definition = registry.getTool(toolName);

      return [
        String(toolName),
        dynamicTool({
          description: definition.description,
          inputSchema: definition.zodSchema,
          execute: async (input, executionOptions) => {
            const result = await registry.executeModelToolCall(
              {
                id: executionOptions.toolCallId,
                name: String(toolName),
                arguments: input as Record<string, unknown>,
              },
              {
                signal: executionOptions.abortSignal,
                context: { source: 'model' },
              }
            );
            const resultText = result.content
              .map((block) => block.text)
              .join('\n');

            if (result.isError) {
              return {
                tool: String(toolName),
                status: 'error',
                error: result.error ?? {
                  code: 'TOOL_EXECUTION_FAILED',
                  message: resultText || `Tool ${String(toolName)} failed`,
                },
                message: resultText,
              };
            }

            return (
              result.structuredContent ?? {
                tool: String(toolName),
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
      const response = await generateText({
        model: openrouter.chatModel(request.model),
        messages: request.messages,
        tools: createToolSet(request.registry),
        maxOutputTokens: 1024,
        stopWhen: stepCountIs(5),
      });

      return {
        text: response.text,
        toolCallCount: response.toolCalls.length,
      };
    },
  };
}
