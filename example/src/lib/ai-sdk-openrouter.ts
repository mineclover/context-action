/**
 * AI SDK OpenRouter Integration
 *
 * Provides a factory function to create OpenRouter language models
 * with free tier and auto-routing support
 */

import { openrouter } from '@ai-sdk/openrouter';
import type { OpenRouterModel } from './openrouter-models';

/**
 * Create an OpenRouter language model using AI SDK
 *
 * @param apiKey - OpenRouter API key
 * @param modelId - Model ID from OpenRouter
 * @returns Language model instance
 *
 * @example
 * ```typescript
 * const model = createOpenRouterModel(apiKey, 'gpt-4-turbo-preview:free');
 * const result = await generateText({
 *   model,
 *   tools: [...],
 *   prompt: 'Your message',
 * });
 * ```
 */
export function createOpenRouterModel(apiKey: string, modelId: string) {
  return openrouter(modelId, {
    apiKey,
  });
}

/**
 * Generate text with tool support using OpenRouter
 *
 * @param apiKey - OpenRouter API key
 * @param modelId - Model ID with tool support
 * @param prompt - The prompt to send
 * @param tools - Tool definitions
 * @returns Promise with text and tool calls
 */
export async function generateWithTools(
  apiKey: string,
  modelId: string,
  prompt: string,
  tools: any
) {
  const model = createOpenRouterModel(apiKey, modelId);

  return generateText({
    model,
    tools,
    prompt,
    toolChoice: 'auto', // Auto-route to tools when needed
  });
}
