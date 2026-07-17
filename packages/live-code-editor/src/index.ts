/** A text or Blob-backed file in a browser code workspace. */
export type WorkspaceFile = {
  path: string;
  renamedFrom?: string;
  language: string;
  source: string;
  kind?: 'text' | 'asset';
  mimeType?: string;
  blob?: Blob;
};

export type WorkspaceStorageMode = 'loading' | 'indexed-db' | 'memory';

export type PreviewSnapshot = {
  revision: number;
  status: 'waiting' | 'synced' | 'error';
  message?: string;
};

export type WorkspaceSnapshot = {
  rootName: string;
  files: WorkspaceFile[];
  activePath: string;
  revision: number;
  preview: PreviewSnapshot;
  storageMode: WorkspaceStorageMode;
  storageError?: string;
};

/** Persistence boundary consumed by the stateful workspace manager. */
export type WorkspaceRepositorySnapshot = {
  rootName: string;
  activePath: string;
  files: WorkspaceFile[];
  deletedPaths: string[];
};

/** Async persistence operations kept independent from Dexie or a browser API. */
export interface WorkspaceRepository {
  ensureWorkspace(
    seedFiles: readonly WorkspaceFile[]
  ): Promise<WorkspaceRepositorySnapshot>;
  replaceWorkspace(
    files: readonly WorkspaceFile[],
    activePath: string,
    rootName: string,
    deletedPaths?: readonly string[]
  ): Promise<WorkspaceRepositorySnapshot>;
  saveFile(file: WorkspaceFile): Promise<void>;
  deleteFile(
    path: string,
    options?: { trackPendingDeletion?: boolean }
  ): Promise<void>;
  clearDeletedPaths(): Promise<void>;
  setActivePath(activePath: string): Promise<void>;
}

export type WorkspaceAssetUrls = Readonly<Record<string, string>>;

export type PreviewBridgeMessage =
  | { type: 'context-action.preview.ready'; revision: number }
  | {
      type: 'context-action.preview.error';
      revision: number;
      message: string;
    };

export type PreviewDiagnostic = {
  kind:
    | 'missing-reference'
    | 'blocked-external-reference'
    | 'unsupported-module-reference'
    | 'module-graph-limit';
  sourcePath: string;
  requestedPath: string;
  message: string;
};

export type ImportedFolder = {
  rootName: string;
  files: WorkspaceFile[];
  skipped: string[];
};

export type FileSystemPermissionStatus =
  | 'granted'
  | 'prompt'
  | 'denied'
  | 'unknown'
  | 'disconnected';

export function isPreviewBridgeMessage(
  value: unknown
): value is PreviewBridgeMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as {
    type?: unknown;
    revision?: unknown;
    message?: unknown;
  };
  return (
    typeof message.revision === 'number' &&
    Number.isSafeInteger(message.revision) &&
    message.revision >= 0 &&
    (message.type === 'context-action.preview.ready' ||
      (message.type === 'context-action.preview.error' &&
        typeof message.message === 'string'))
  );
}

export {
  buildPreviewDocument,
  collectPreviewDiagnostics,
  findPreviewHtmlFile,
  findPreviewStylesheetFile,
  rewriteJavaScriptModuleImports,
  workspaceJavaScriptModuleSpecifier,
} from './preview-document';

export {
  WorkspaceToolError,
  type WorkspaceToolErrorCode,
} from './workspace-errors';
export {
  BrowserWorkspaceFileSystemAdapter,
  type DirectoryHandlePersistence,
  type FileSystemDirectoryHandleLike,
  type WorkspaceFileSystemAdapter,
} from './workspace-filesystem';
export {
  WorkspaceDocumentManager,
  type WorkspaceDocumentManagerOptions,
  type WorkspaceImportOptions,
  type WorkspaceUpdateFileOptions,
} from './workspace-manager';
export {
  assertWorkspaceTextSourceLength,
  isBinaryWorkspacePath,
  languageForWorkspacePath,
  MAX_TEXT_SOURCE_LENGTH,
  mimeTypeForWorkspaceLanguage,
  normalizeWorkspacePath,
  selectWorkspaceActivePath,
} from './workspace-model';
