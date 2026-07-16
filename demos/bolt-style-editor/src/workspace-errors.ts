export type WorkspaceToolErrorCode =
  | 'WORKSPACE_REVISION_CONFLICT'
  | 'WORKSPACE_SOURCE_LIMIT';

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
