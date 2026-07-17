export type ToolResultPresentationLike = {
  readonly content?: readonly {
    readonly type?: string;
    readonly text?: string;
  }[];
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
    ?.filter((item) => item.type === 'text' && item.text)
    .map((item) => item.text)
    .join('\n');
  return text || fallback;
}
