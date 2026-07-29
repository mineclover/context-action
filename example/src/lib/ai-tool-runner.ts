/**
 * Provider- and credential-agnostic contract for a ToolContext-backed AI turn.
 *
 * Views depend on this contract instead of a browser key, provider SDK, or
 * transport. A browser demo runner, a server proxy runner, and an OAuth runner
 * can therefore share the same ToolContext execution boundary.
 */

import type { ToolRegistry } from '@context-action/react/tools';
import type { ActionSchemaMap } from '@context-action/tool-protocol';
import type { ModelMessage } from 'ai';

export interface ToolTextGenerationRequest<TSchema extends ActionSchemaMap> {
  model: string;
  messages: ModelMessage[];
  registry: ToolRegistry<TSchema>;
  signal?: AbortSignal;
  sessionId?: string;
}

export interface ToolTextGenerationResult {
  text: string;
  toolCallCount: number;
  /** Preserve assistant tool calls and tool results for the next model turn. */
  responseMessages: ModelMessage[];
}

/**
 * Executes one model turn, including any tool loop required by its transport.
 *
 * Implementations own authentication and provider configuration. They must not
 * require a view to expose an application-owned credential.
 */
export interface ToolTextGenerator {
  generate<TSchema extends ActionSchemaMap>(
    request: ToolTextGenerationRequest<TSchema>
  ): Promise<ToolTextGenerationResult>;
}
