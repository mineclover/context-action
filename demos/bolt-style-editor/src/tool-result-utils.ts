export type ToolResultLike = {
  isError?: boolean;
  error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
    details?: unknown;
  };
  content?: Array<{ text?: string }>;
  structuredContent?: unknown;
};

export function formatToolResultText(result: ToolResultLike): string {
  if (result.isError) {
    const message =
      result.error?.message?.trim() ||
      result.content
        ?.map((block) => block.text?.trim())
        .find((text): text is string => Boolean(text));
    const code = result.error?.code ? `[${result.error.code}] ` : '';
    const details = result.error?.details;
    const detailText =
      details === undefined ? '' : `\n${JSON.stringify(details, null, 2)}`;
    return `${code}${message || 'Tool call failed.'}${detailText}`;
  }
  return JSON.stringify(
    result.structuredContent !== undefined ? result.structuredContent : {},
    null,
    2
  );
}
