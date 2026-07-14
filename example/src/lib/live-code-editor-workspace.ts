/**
 * UI-facing workspace state for the Live Code Editor.
 *
 * Dexie owns persisted metadata and Blob content. This manager keeps the
 * current text projection and dirty state that React and ToolContext consume.
 */

import {
  inferWorkspaceMimeType,
  isTextWorkspaceFile,
  normalizeWorkspacePath,
} from './live-code-editor-filesystem';

export type WorkspaceStorageMode = 'memory' | 'indexed-db';

export interface LiveEditorWorkspaceFile {
  readonly path: string;
  readonly source: string;
  readonly initialSource: string;
  readonly kind: 'file';
  readonly mimeType: string;
  readonly size: number;
  readonly isText: boolean;
  readonly previewUrl?: string;
}

export interface LiveEditorWorkspaceSnapshot {
  readonly files: LiveEditorWorkspaceFile[];
  readonly activePath: string;
  readonly dirtyPaths: string[];
  readonly storageMode: WorkspaceStorageMode;
  readonly rootName: string;
}

function selectActivePath(files: readonly LiveEditorWorkspaceFile[]): string {
  return (
    files.find(
      (file) => file.path.split('/').pop()?.toLowerCase() === 'index.html'
    )?.path ??
    files.find((file) => file.isText)?.path ??
    files[0]?.path ??
    ''
  );
}

export class LiveEditorWorkspaceManager {
  private snapshot: LiveEditorWorkspaceSnapshot;
  private readonly listeners = new Set<
    (snapshot: LiveEditorWorkspaceSnapshot) => void
  >();

  constructor(
    files: LiveEditorWorkspaceFile[],
    options?: {
      readonly activePath?: string;
      readonly rootName?: string;
      readonly storageMode?: WorkspaceStorageMode;
    }
  ) {
    const normalizedFiles = files.map((file) => ({
      ...file,
      path: normalizeWorkspacePath(file.path),
    }));
    this.snapshot = {
      files: normalizedFiles,
      activePath:
        options?.activePath &&
        normalizedFiles.some((file) => file.path === options.activePath)
          ? options.activePath
          : selectActivePath(normalizedFiles),
      dirtyPaths: [],
      storageMode: options?.storageMode ?? 'memory',
      rootName: options?.rootName ?? 'context-action-workspace',
    };
  }

  getSnapshot = (): LiveEditorWorkspaceSnapshot => this.snapshot;

  subscribe = (
    listener: (snapshot: LiveEditorWorkspaceSnapshot) => void
  ): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getActiveFile = (): LiveEditorWorkspaceFile | undefined =>
    this.snapshot.files.find((file) => file.path === this.snapshot.activePath);

  getInitialSource = (path: string): string =>
    this.snapshot.files.find((file) => file.path === path)?.initialSource ?? '';

  setActivePath(path: string): LiveEditorWorkspaceSnapshot {
    if (!this.snapshot.files.some((file) => file.path === path))
      return this.snapshot;
    this.snapshot = { ...this.snapshot, activePath: path };
    this.emit();
    return this.snapshot;
  }

  updateFile(path: string, source: string): LiveEditorWorkspaceSnapshot {
    const normalizedPath = normalizeWorkspacePath(path);
    const existingFile = this.snapshot.files.find(
      (file) => file.path === normalizedPath
    );
    const files = existingFile
      ? this.snapshot.files.map((file) =>
          file.path === normalizedPath
            ? {
                ...file,
                source,
                size: new Blob([source]).size,
                isText: true,
              }
            : file
        )
      : [...this.snapshot.files, createWorkspaceFile(normalizedPath, source)];
    const dirtyPaths = this.snapshot.dirtyPaths.includes(normalizedPath)
      ? this.snapshot.dirtyPaths
      : [...this.snapshot.dirtyPaths, normalizedPath];
    this.snapshot = { ...this.snapshot, files, dirtyPaths };
    this.emit();
    return this.snapshot;
  }

  replaceFiles(
    files: LiveEditorWorkspaceFile[],
    options: {
      readonly rootName: string;
      readonly storageMode: WorkspaceStorageMode;
      readonly activePath?: string;
    }
  ): LiveEditorWorkspaceSnapshot {
    const normalizedFiles = files
      .map((file) => ({ ...file, path: normalizeWorkspacePath(file.path) }))
      .filter((file) => file.path.length > 0);
    const activePath =
      options.activePath &&
      normalizedFiles.some((file) => file.path === options.activePath)
        ? options.activePath
        : selectActivePath(normalizedFiles);
    this.snapshot = {
      ...this.snapshot,
      files: normalizedFiles,
      activePath,
      dirtyPaths: [],
      rootName: options.rootName,
      storageMode: options.storageMode,
    };
    this.emit();
    return this.snapshot;
  }

  markSaved(path: string, source?: string): LiveEditorWorkspaceSnapshot {
    const normalizedPath = normalizeWorkspacePath(path);
    const files = this.snapshot.files.map((file) =>
      file.path !== normalizedPath
        ? file
        : {
            ...file,
            ...(source === undefined ? {} : { source, initialSource: source }),
          }
    );
    this.snapshot = {
      ...this.snapshot,
      files,
      dirtyPaths: this.snapshot.dirtyPaths.filter(
        (item) => item !== normalizedPath
      ),
    };
    this.emit();
    return this.snapshot;
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.snapshot);
  }
}

export function createWorkspaceFile(
  path: string,
  source: string,
  options?: { readonly mimeType?: string }
): LiveEditorWorkspaceFile {
  const normalizedPath = normalizeWorkspacePath(path);
  const mimeType = inferWorkspaceMimeType(normalizedPath, options?.mimeType);
  return {
    path: normalizedPath,
    source,
    initialSource: source,
    kind: 'file',
    mimeType,
    size: new Blob([source]).size,
    isText: isTextWorkspaceFile(normalizedPath, mimeType),
  };
}
