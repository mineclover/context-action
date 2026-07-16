export type ToolErrorRecovery = {
  folderAction?: 'reconnect' | 'grant';
  previewAction?: true;
  retryLabel?: string;
};

export function getToolErrorRecovery(
  code?: string,
  options: { revisionConflict?: boolean } = {}
): ToolErrorRecovery {
  const revisionConflict =
    options.revisionConflict === true || code === 'WORKSPACE_REVISION_CONFLICT';

  return {
    ...(code === 'WORKSPACE_FOLDER_STALE' ||
    code === 'WORKSPACE_FOLDER_NOT_CONNECTED'
      ? { folderAction: 'reconnect' as const }
      : code === 'WORKSPACE_FOLDER_PERMISSION_DENIED'
        ? { folderAction: 'grant' as const }
        : {}),
    ...(code === 'PREVIEW_ACK_TIMEOUT' || code === 'PREVIEW_REVISION_SUPERSEDED'
      ? { previewAction: true as const }
      : {}),
    ...(revisionConflict ? { retryLabel: 'Re-read & retry' } : {}),
  };
}
