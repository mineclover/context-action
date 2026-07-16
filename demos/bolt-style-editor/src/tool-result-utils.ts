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

export function formatToolSuccessMessage(
  name: string,
  result: { structuredContent?: unknown }
): string {
  const value = result.structuredContent;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return `Executed ${name}.`;
  }

  const structured = value as Record<string, unknown>;
  const revision =
    typeof structured.revision === 'number'
      ? ` Revision ${structured.revision}.`
      : '';

  if (name === 'workspace.getStatus') {
    const fileCount =
      typeof structured.fileCount === 'number' ? structured.fileCount : 0;
    const filesystem =
      structured.filesystem &&
      typeof structured.filesystem === 'object' &&
      !Array.isArray(structured.filesystem)
        ? (structured.filesystem as Record<string, unknown>)
        : undefined;
    const storage = filesystem?.folderLinked
      ? 'local folder connected'
      : 'browser-only workspace';
    const permission =
      typeof filesystem?.permission === 'string'
        ? `, write access ${filesystem.permission}`
        : '';
    return `Workspace status: ${fileCount} file(s), ${storage}${permission}.${revision}`;
  }

  if (name === 'preview.getStatus') {
    const status =
      typeof structured.status === 'string' ? structured.status : 'unknown';
    const diagnostics = Array.isArray(structured.diagnostics)
      ? structured.diagnostics.length
      : 0;
    return `Preview status: ${status}, ${diagnostics} diagnostic(s).${revision}`;
  }

  if (name === 'workspace.reset') {
    const fileCount =
      typeof structured.fileCount === 'number' ? structured.fileCount : 0;
    return `Reset the browser workspace to the demo seed (${fileCount} file(s)). Preview revision acknowledged.${revision}`;
  }

  if (name === 'workspace.listFiles' && Array.isArray(structured.files)) {
    return `Listed ${structured.files.length} workspace file(s).${revision}`;
  }

  if (name === 'workspace.readFile' && typeof structured.path === 'string') {
    const source =
      typeof structured.source === 'string' ? structured.source : '';
    return `Read ${structured.path} (${source.split('\n').length} lines).${revision}`;
  }

  if (
    name === 'workspace.downloadFile' &&
    typeof structured.path === 'string'
  ) {
    const size = typeof structured.size === 'number' ? structured.size : 0;
    return `Downloaded ${structured.path} (${size} bytes).`;
  }

  if (name === 'workspace.openFile' && typeof structured.path === 'string') {
    return `Opened ${structured.path} in the editor.${revision}`;
  }

  if (name === 'workspace.applyPatch') {
    const replacements =
      typeof structured.replacements === 'number' ? structured.replacements : 0;
    return `Patched ${String(structured.path ?? 'the file')} (${replacements} replacement${replacements === 1 ? '' : 's'}).${revision}`;
  }

  if (
    name === 'workspace.renameFile' &&
    typeof structured.fromPath === 'string' &&
    typeof structured.toPath === 'string'
  ) {
    return `Renamed ${structured.fromPath} → ${structured.toPath}. Preview revision acknowledged.${revision}`;
  }

  if (name === 'workspace.saveAll') {
    const savedCount = Array.isArray(structured.savedPaths)
      ? structured.savedPaths.length
      : 0;
    const deletedCount = Array.isArray(structured.deletedPaths)
      ? structured.deletedPaths.length
      : 0;
    const pendingChanges = structured.checkpointUpdated === false;
    const pendingSuffix = pendingChanges
      ? ' Newer editor changes remain unsaved.'
      : '';
    return `Saved ${savedCount} file(s)${deletedCount ? ` and deleted ${deletedCount} file(s)` : ''}.${pendingSuffix}${revision}`;
  }

  if (name === 'workspace.saveCheckpoint') {
    const savedCount = Array.isArray(structured.savedPaths)
      ? structured.savedPaths.length
      : 0;
    const deletedCount = Array.isArray(structured.deletedPaths)
      ? structured.deletedPaths.length
      : 0;
    return `Saved the browser checkpoint for ${savedCount} file(s)${deletedCount ? ` and cleared ${deletedCount} deletion marker(s)` : ''}.${revision}`;
  }

  if (name === 'workspace.reloadFolder') {
    const fileCount =
      typeof structured.fileCount === 'number' ? structured.fileCount : 0;
    const skippedCount = Array.isArray(structured.skipped)
      ? structured.skipped.length
      : 0;
    const skippedSuffix = skippedCount
      ? ` Skipped ${skippedCount} invalid, unsupported, or oversized file(s).`
      : '';
    return `Reloaded the connected folder with ${fileCount} file(s).${skippedSuffix}${revision}`;
  }

  if (name === 'workspace.disconnectFolder') {
    return 'Disconnected the local folder. Future saves stay in the browser workspace until another folder is opened.';
  }

  if (typeof structured.path === 'string') {
    return `Updated ${structured.path}. Preview revision acknowledged.${revision}`;
  }
  if (typeof structured.theme === 'string') {
    return `Applied the ${structured.theme} theme. Preview revision acknowledged.${revision}`;
  }
  if (typeof structured.title === 'string') {
    return 'Updated the preview content. Preview revision acknowledged.';
  }

  return `Executed ${name}. Preview revision acknowledged.${revision}`;
}
