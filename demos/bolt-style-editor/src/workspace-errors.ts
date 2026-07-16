export type WorkspaceToolErrorCode =
  | 'WORKSPACE_REVISION_CONFLICT'
  | 'WORKSPACE_SOURCE_LIMIT'
  | 'WORKSPACE_FOLDER_STALE'
  | 'WORKSPACE_FOLDER_NOT_CONNECTED'
  | 'WORKSPACE_FOLDER_PERMISSION_DENIED'
  | 'PREVIEW_RUNTIME_ERROR'
  | 'PREVIEW_ACK_TIMEOUT'
  | 'PREVIEW_REVISION_SUPERSEDED'
  | 'PREVIEW_TARGET_NOT_FOUND';

export class WorkspaceToolError extends Error {
  override name = 'WorkspaceToolError';

  readonly code: WorkspaceToolErrorCode;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(
    message: string,
    options: {
      code: WorkspaceToolErrorCode;
      retryable: boolean;
      details?: unknown;
    }
  ) {
    super(message);
    this.code = options.code;
    this.retryable = options.retryable;
    this.details = options.details;
    Object.setPrototypeOf(this, WorkspaceToolError.prototype);
  }
}
