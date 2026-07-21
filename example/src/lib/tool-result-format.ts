import {
  stringifyToolContent,
  type ToolContent,
} from '@context-action/tool-protocol';

export type ToolResultPresentationLike = {
  readonly content?: readonly ToolContent[];
  readonly error?: {
    readonly message?: string;
  };
  readonly isError?: boolean;
  readonly structuredContent?: unknown;
};

/**
 * Format canonical ToolContext results for local UI and agent messages.
 *
 * Registry execution stays in action hooks; this pure adapter only chooses a
 * readable representation for an already-produced result.
 */
export function formatToolResultText(
  result: ToolResultPresentationLike,
  fallback: string
): string {
  if (result.error?.message || result.isError) {
    return result.error?.message ?? fallback;
  }
  if (result.structuredContent !== undefined) {
    return JSON.stringify(result.structuredContent, null, 2);
  }
  const text = result.content
    ? stringifyToolContent(result.content).trim()
    : undefined;
  return text || fallback;
}
