import type {
  FileSystemPermissionStatus,
  ImportedFolder,
  WorkspaceFile,
} from './index';
import { WorkspaceToolError } from './workspace-errors';
import {
  normalizeWorkspacePath,
  selectWorkspaceActivePath,
} from './workspace-model';

export type {
  FileSystemPermissionStatus,
  ImportedFolder,
} from './index';

type FileSystemFileHandleLike = {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable?: () => Promise<FileSystemWritableFileStreamLike>;
};

type FileSystemWritableFileStreamLike = {
  write(data: string | Blob): Promise<void>;
  close(): Promise<void>;
};

type DirectoryHandleOptions = { create?: boolean };

export type FileSystemDirectoryHandleLike = {
  kind: 'directory';
  name: string;
  getDirectoryHandle(
    name: string,
    options?: DirectoryHandleOptions
  ): Promise<FileSystemDirectoryHandleLike>;
  getFileHandle(
    name: string,
    options?: DirectoryHandleOptions
  ): Promise<FileSystemFileHandleLike>;
  entries(): AsyncIterableIterator<
    [string, FileSystemFileHandleLike | FileSystemDirectoryHandleLike]
  >;
  removeEntry?: (
    name: string,
    options?: { recursive?: boolean }
  ) => Promise<void>;
  queryPermission?: (descriptor?: {
    mode?: 'read' | 'readwrite';
  }) => Promise<'granted' | 'prompt' | 'denied'>;
  requestPermission?: (descriptor?: {
    mode?: 'read' | 'readwrite';
  }) => Promise<'granted' | 'prompt' | 'denied'>;
};

type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?: (options?: {
    mode?: 'read' | 'readwrite';
  }) => Promise<FileSystemDirectoryHandleLike>;
};

export type DirectoryHandlePersistence = {
  getDirectoryHandle: () => Promise<FileSystemDirectoryHandleLike | undefined>;
  setDirectoryHandle: (handle: FileSystemDirectoryHandleLike) => Promise<void>;
  clearDirectoryHandle: () => Promise<void>;
  /** Optional durable identity for the selected folder destination. */
  getDirectoryScopeId?: () => Promise<string | undefined>;
  setDirectoryScopeId?: (scopeId: string) => Promise<void>;
  clearDirectoryScopeId?: () => Promise<void>;
};

const MAX_FILES = 200;
const MAX_SCANNED_ENTRIES = 2_000;
const MAX_TEXT_FILE_BYTES = 512 * 1024;
const MAX_ASSET_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 12 * 1024 * 1024;
const EMPTY_FOLDER_ERROR =
  'No supported HTML, CSS, JS, text, or preview asset files were found.';
const STALE_FOLDER_ERROR =
  'The connected folder is no longer available. Open the folder again to continue saving.';

function createFolderScopeId(): string {
  const randomUUID = globalThis.crypto?.randomUUID;
  return `folder:${
    typeof randomUUID === 'function'
      ? randomUUID.call(globalThis.crypto)
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }`;
}

const languageByExtension: Record<string, string> = {
  '.css': 'css',
  '.htm': 'html',
  '.html': 'html',
  '.js': 'javascript',
  '.json': 'json',
  '.mjs': 'javascript',
  '.md': 'markdown',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.txt': 'text',
};

const assetMimeTypeByExtension: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const normalizePath = normalizeWorkspacePath;

function languageForPath(path: string): string | null {
  const extension = `.${path.split('.').pop()?.toLowerCase() ?? ''}`;
  return languageByExtension[extension] ?? null;
}
function assetMimeTypeForPath(path: string): string | null {
  const extension = `.${path.split('.').pop()?.toLowerCase() ?? ''}`;
  return assetMimeTypeByExtension[extension] ?? null;
}

function isLikelyText(file: File): boolean {
  return file.type.startsWith('text/') || file.type === 'application/json';
}

const selectActivePath = selectWorkspaceActivePath;

function isNotFoundFileSystemError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (
    'name' in error && (error as { name?: unknown }).name === 'NotFoundError'
  );
}

function createStaleFolderError(
  operation: 'reload' | 'read' | 'write' | 'delete',
  folderName: string,
  cause: unknown
): WorkspaceToolError {
  return new WorkspaceToolError(STALE_FOLDER_ERROR, {
    code: 'WORKSPACE_FOLDER_STALE',
    retryable: true,
    details: {
      operation,
      folderName,
      cause: cause instanceof Error ? cause.message : String(cause),
    },
  });
}

function createFolderAccessError(
  code: 'WORKSPACE_FOLDER_NOT_CONNECTED' | 'WORKSPACE_FOLDER_PERMISSION_DENIED',
  message: string,
  operation: 'reload' | 'read' | 'write' | 'delete',
  permission?: FileSystemPermissionStatus
): WorkspaceToolError {
  return new WorkspaceToolError(message, {
    code,
    retryable: true,
    details: {
      operation,
      ...(permission ? { permission } : {}),
    },
  });
}

function sortFiles(files: WorkspaceFile[]): WorkspaceFile[] {
  return files.sort((left, right) => {
    const leftRank =
      left.path === 'index.html'
        ? 0
        : left.path === 'styles.css'
          ? 1
          : left.path === 'app.js'
            ? 2
            : 3;
    const rightRank =
      right.path === 'index.html'
        ? 0
        : right.path === 'styles.css'
          ? 1
          : right.path === 'app.js'
            ? 2
            : 3;
    return leftRank - rightRank || left.path.localeCompare(right.path);
  });
}

/** Public filesystem port used by browser workspace consumers. */
export interface WorkspaceFileSystemAdapter {
  readonly hasWritableFolder: boolean;
  readonly folderPermission: FileSystemPermissionStatus;
  /** Stable identity for the connected destination, when available. */
  readonly folderScopeId?: string;
  subscribe(listener: () => void): () => void;
  restorePersistedFolder(): Promise<boolean>;
  pickFolder(): Promise<ImportedFolder>;
  reloadFolder(): Promise<ImportedFolder>;
  disconnectFolder(): Promise<void>;
  refreshWritePermission(): Promise<FileSystemPermissionStatus>;
  requestWritePermission(): Promise<FileSystemPermissionStatus>;
  importDirectoryHandle(
    handle: FileSystemDirectoryHandleLike
  ): Promise<ImportedFolder>;
  importFileList(fileList: FileList | readonly File[]): Promise<ImportedFolder>;
  /** Read one connected-folder file for external side-effect reconciliation. */
  readFile(path: string): Promise<WorkspaceFile | undefined>;
  writeFiles(files: readonly WorkspaceFile[]): Promise<number>;
  removeFiles(paths: readonly string[]): Promise<number>;
}

export class BrowserWorkspaceFileSystemAdapter
  implements WorkspaceFileSystemAdapter
{
  private directoryHandle: FileSystemDirectoryHandleLike | null = null;
  private directoryScopeId: string | null = null;
  private writePermission: FileSystemPermissionStatus = 'disconnected';
  private readonly listeners = new Set<() => void>();

  constructor(private readonly persistence?: DirectoryHandlePersistence) {}

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  get hasWritableFolder(): boolean {
    return this.directoryHandle !== null;
  }

  get folderPermission(): FileSystemPermissionStatus {
    return this.writePermission;
  }

  get folderScopeId(): string | undefined {
    return this.directoryScopeId ?? undefined;
  }

  async restorePersistedFolder(): Promise<boolean> {
    let handle: FileSystemDirectoryHandleLike | undefined;
    let persistedScopeId: string | undefined;
    try {
      handle = await this.persistence?.getDirectoryHandle();
      persistedScopeId = await this.persistence?.getDirectoryScopeId?.();
    } catch {
      return false;
    }
    if (!handle) return false;
    this.directoryHandle = handle;
    this.directoryScopeId = persistedScopeId?.trim() || createFolderScopeId();
    if (!persistedScopeId?.trim()) {
      await this.persistDirectoryScope(this.directoryScopeId);
    }
    await this.refreshWritePermission();
    this.notify();
    return true;
  }

  async pickFolder(): Promise<ImportedFolder> {
    const picker = (window as WindowWithDirectoryPicker).showDirectoryPicker;
    if (!picker) {
      throw new Error(
        'Directory picker is not available. Use the folder upload fallback.'
      );
    }
    const previousHandle = this.directoryHandle;
    const previousScopeId = this.directoryScopeId;
    const handle = await picker({ mode: 'readwrite' });
    this.directoryHandle = handle;
    this.directoryScopeId = createFolderScopeId();
    try {
      const imported = await this.importDirectoryHandle(handle);
      if (imported.files.length === 0) {
        throw new Error(EMPTY_FOLDER_ERROR);
      }
      await this.refreshWritePermission();
      return imported;
    } catch (error) {
      this.directoryHandle = previousHandle;
      this.directoryScopeId = previousScopeId;
      this.writePermission = previousHandle
        ? await this.readWritePermission(previousHandle)
        : 'disconnected';
      try {
        if (previousHandle) {
          await this.persistence?.setDirectoryHandle(previousHandle);
          if (previousScopeId) {
            await this.persistence?.setDirectoryScopeId?.(previousScopeId);
          }
        } else {
          await this.persistence?.clearDirectoryHandle();
          await this.persistence?.clearDirectoryScopeId?.();
        }
      } catch {
        // Keep the in-memory handle consistent even if persistence recovery fails.
      }
      this.notify();
      throw error;
    }
  }

  async reloadFolder(): Promise<ImportedFolder> {
    if (!this.directoryHandle) {
      throw createFolderAccessError(
        'WORKSPACE_FOLDER_NOT_CONNECTED',
        'No writable folder is connected to this workspace.',
        'reload'
      );
    }
    const previousHandle = this.directoryHandle;
    try {
      const imported = await this.importDirectoryHandle(previousHandle);
      if (imported.files.length === 0) {
        throw new Error(EMPTY_FOLDER_ERROR);
      }
      await this.refreshWritePermission();
      return imported;
    } catch (error) {
      if (isNotFoundFileSystemError(error)) {
        try {
          await this.disconnectFolder();
        } catch {
          // Keep the in-memory disconnect even if the persisted handle cannot be cleared.
        }
        throw createStaleFolderError('reload', previousHandle.name, error);
      }
      this.directoryHandle = previousHandle;
      this.writePermission = await this.readWritePermission(previousHandle);
      try {
        await this.persistence?.setDirectoryHandle(previousHandle);
      } catch {
        // Keep the in-memory handle consistent even if persistence recovery fails.
      }
      this.notify();
      throw error;
    }
  }

  async disconnectFolder(): Promise<void> {
    try {
      await this.persistence?.clearDirectoryHandle();
      await this.persistence?.clearDirectoryScopeId?.();
    } finally {
      this.directoryHandle = null;
      this.directoryScopeId = null;
      this.writePermission = 'disconnected';
      this.notify();
    }
  }

  async refreshWritePermission(): Promise<FileSystemPermissionStatus> {
    const directory = this.directoryHandle;
    if (!directory) {
      this.writePermission = 'disconnected';
      this.notify();
      return this.writePermission;
    }

    const permission = await this.readWritePermission(directory);
    this.writePermission = permission;
    this.notify();
    return permission;
  }

  async requestWritePermission(): Promise<FileSystemPermissionStatus> {
    const directory = this.directoryHandle;
    if (!directory) {
      this.writePermission = 'disconnected';
      this.notify();
      return this.writePermission;
    }

    try {
      const descriptor = { mode: 'readwrite' as const };
      const current = await directory.queryPermission?.(descriptor);
      if (current === 'granted') {
        this.writePermission = current;
      } else if (directory.requestPermission) {
        this.writePermission = await directory.requestPermission(descriptor);
      } else {
        this.writePermission = current ?? 'unknown';
      }
    } catch {
      this.writePermission = 'denied';
    }
    this.notify();
    return this.writePermission;
  }

  async importDirectoryHandle(
    handle: FileSystemDirectoryHandleLike
  ): Promise<ImportedFolder> {
    const handleChanged = this.directoryHandle !== handle;
    this.directoryHandle = handle;
    if (handleChanged || !this.directoryScopeId) {
      this.directoryScopeId = createFolderScopeId();
    }
    this.notify();
    const files: WorkspaceFile[] = [];
    const skipped: string[] = [];
    let totalBytes = 0;
    let fileLimitReported = false;
    let totalLimitReported = false;
    let scannedEntries = 0;
    let scanLimitReported = false;

    const shouldStopTraversal = (prefix: string): boolean => {
      if (scannedEntries >= MAX_SCANNED_ENTRIES) {
        if (!scanLimitReported) {
          skipped.push(`${prefix || '.'} · scan limit reached`);
          scanLimitReported = true;
        }
        return true;
      }
      if (files.length >= MAX_FILES) {
        if (!fileLimitReported) {
          skipped.push(`${prefix || '.'} · file limit reached`);
          fileLimitReported = true;
        }
        return true;
      }
      if (totalBytes >= MAX_TOTAL_BYTES) {
        if (!totalLimitReported) {
          skipped.push(`${prefix || '.'} · workspace limit reached`);
          totalLimitReported = true;
        }
        return true;
      }
      return false;
    };

    const visit = async (
      directory: FileSystemDirectoryHandleLike,
      prefix: string
    ): Promise<void> => {
      if (shouldStopTraversal(prefix)) return;
      for await (const [name, entry] of directory.entries()) {
        if (shouldStopTraversal(prefix)) return;
        scannedEntries += 1;
        const rawPath = `${prefix}/${name}`;
        let path: string;
        try {
          path = normalizePath(rawPath);
        } catch {
          skipped.push(`${rawPath} · invalid workspace path`);
          continue;
        }
        if (entry.kind === 'directory') {
          await visit(entry, path);
          continue;
        }
        const file = await entry.getFile();
        const accepted = await this.collectImportedFile(
          file,
          path,
          files,
          skipped,
          totalBytes
        );
        totalBytes = accepted.totalBytes;
      }
    };

    await visit(handle, '');
    const imported = {
      rootName: handle.name || 'workspace',
      files: sortFiles(files),
      skipped,
    };
    await this.persistDirectoryHandle(handle);
    await this.persistDirectoryScope(this.directoryScopeId);
    return imported;
  }

  async importFileList(
    fileList: FileList | readonly File[]
  ): Promise<ImportedFolder> {
    const files: WorkspaceFile[] = [];
    const skipped: string[] = [];
    let totalBytes = 0;
    let rootName = 'workspace';
    let scannedEntries = 0;
    let scanLimitReported = false;

    for (const file of Array.from(fileList)) {
      if (scannedEntries >= MAX_SCANNED_ENTRIES) {
        if (!scanLimitReported) {
          skipped.push('. · scan limit reached');
          scanLimitReported = true;
        }
        break;
      }
      scannedEntries += 1;
      const relativePath = file.webkitRelativePath || file.name;
      const segments = relativePath.split('/');
      if (segments.length > 1 && segments[0]) rootName = segments[0];
      const rawPath = segments.slice(1).join('/') || file.name;
      let path: string;
      try {
        path = normalizePath(rawPath);
      } catch {
        skipped.push(`${rawPath} · invalid workspace path`);
        continue;
      }
      const accepted = await this.collectImportedFile(
        file,
        path,
        files,
        skipped,
        totalBytes
      );
      totalBytes = accepted.totalBytes;
      if (files.length >= MAX_FILES) break;
    }

    const imported = { rootName, files: sortFiles(files), skipped };
    if (imported.files.length === 0) return imported;

    this.directoryHandle = null;
    this.directoryScopeId = null;
    this.writePermission = 'disconnected';
    this.notify();
    await this.persistence?.clearDirectoryHandle();
    await this.persistence?.clearDirectoryScopeId?.();
    return imported;
  }

  async writeFiles(files: readonly WorkspaceFile[]): Promise<number> {
    const directory = this.directoryHandle;
    if (!directory) {
      throw createFolderAccessError(
        'WORKSPACE_FOLDER_NOT_CONNECTED',
        'This workspace was imported without a writable folder.',
        'write'
      );
    }

    const permission = await this.ensureWritePermission(directory);
    if (permission !== 'granted') {
      throw createFolderAccessError(
        'WORKSPACE_FOLDER_PERMISSION_DENIED',
        'Write permission for the selected folder was not granted.',
        'write',
        permission
      );
    }

    try {
      for (const file of files) {
        await this.writeFile(directory, file);
      }
    } catch (error) {
      if (isNotFoundFileSystemError(error)) {
        try {
          await this.disconnectFolder();
        } catch {
          // Keep the in-memory disconnect even if the persisted handle cannot be cleared.
        }
        throw createStaleFolderError('write', directory.name, error);
      }
      throw error;
    }
    return files.length;
  }

  async readFile(path: string): Promise<WorkspaceFile | undefined> {
    const root = this.directoryHandle;
    if (!root) {
      throw createFolderAccessError(
        'WORKSPACE_FOLDER_NOT_CONNECTED',
        'No folder is connected to this workspace.',
        'read'
      );
    }

    const permission = await this.readPermission(root);
    if (permission !== 'granted') {
      throw createFolderAccessError(
        'WORKSPACE_FOLDER_PERMISSION_DENIED',
        'Read permission for the selected folder was not granted.',
        'read',
        permission
      );
    }

    const normalizedPath = normalizePath(path);
    const parts = normalizedPath.split('/').filter(Boolean);
    const filename = parts.pop();
    if (!filename) throw new Error(`Invalid workspace path: ${path}`);

    try {
      let directory = root;
      for (const segment of parts) {
        directory = await directory.getDirectoryHandle(segment);
      }
      const file = await (await directory.getFileHandle(filename)).getFile();
      const files: WorkspaceFile[] = [];
      const skipped: string[] = [];
      await this.collectImportedFile(file, normalizedPath, files, skipped, 0);
      return files[0];
    } catch (error) {
      if (isNotFoundFileSystemError(error)) return undefined;
      throw error;
    }
  }

  async removeFiles(paths: readonly string[]): Promise<number> {
    const directory = this.directoryHandle;
    if (!directory) {
      throw createFolderAccessError(
        'WORKSPACE_FOLDER_NOT_CONNECTED',
        'This workspace was imported without a writable folder.',
        'delete'
      );
    }

    const permission = await this.ensureWritePermission(directory);
    if (permission !== 'granted') {
      throw createFolderAccessError(
        'WORKSPACE_FOLDER_PERMISSION_DENIED',
        'Write permission for the selected folder was not granted.',
        'delete',
        permission
      );
    }

    try {
      for (const path of paths) {
        await this.removeFile(directory, path);
      }
    } catch (error) {
      if (isNotFoundFileSystemError(error)) {
        try {
          await this.disconnectFolder();
        } catch {
          // Keep the in-memory disconnect even if the persisted handle cannot be cleared.
        }
        throw createStaleFolderError('delete', directory.name, error);
      }
      throw error;
    }
    return paths.length;
  }

  private async ensureWritePermission(
    directory: FileSystemDirectoryHandleLike
  ): Promise<'granted' | 'prompt' | 'denied'> {
    try {
      const descriptor = { mode: 'readwrite' as const };
      const current = await directory.queryPermission?.(descriptor);
      if (current === 'granted') {
        this.writePermission = current;
        this.notify();
        return current;
      }
      if (!directory.requestPermission) {
        this.writePermission = current ?? 'unknown';
        this.notify();
        return current ?? 'granted';
      }
      const requested = await directory.requestPermission(descriptor);
      this.writePermission = requested;
      this.notify();
      return requested;
    } catch (error) {
      this.writePermission = 'denied';
      this.notify();
      throw error;
    }
  }

  private async readWritePermission(
    directory: FileSystemDirectoryHandleLike
  ): Promise<FileSystemPermissionStatus> {
    try {
      return (
        (await directory.queryPermission?.({ mode: 'readwrite' })) ?? 'unknown'
      );
    } catch {
      return 'unknown';
    }
  }

  private async readPermission(
    directory: FileSystemDirectoryHandleLike
  ): Promise<FileSystemPermissionStatus> {
    try {
      return (await directory.queryPermission?.({ mode: 'read' })) ?? 'granted';
    } catch {
      return 'unknown';
    }
  }

  private async writeFile(
    root: FileSystemDirectoryHandleLike,
    file: WorkspaceFile
  ): Promise<void> {
    const path = normalizePath(file.path);
    const parts = path.split('/').filter(Boolean);
    const filename = parts.pop();
    if (!filename) throw new Error(`Invalid workspace path: ${file.path}`);

    let directory = root;
    for (const segment of parts) {
      directory = await directory.getDirectoryHandle(segment, { create: true });
    }

    const fileHandle = await directory.getFileHandle(filename, {
      create: true,
    });
    if (!fileHandle.createWritable) {
      throw new Error('The selected browser does not support folder writes.');
    }
    const writable = await fileHandle.createWritable();
    await writable.write(
      file.kind === 'asset' && file.blob ? file.blob : file.source
    );
    await writable.close();
  }

  private async removeFile(
    root: FileSystemDirectoryHandleLike,
    filePath: string
  ): Promise<void> {
    const parts = normalizePath(filePath).split('/').filter(Boolean);
    const filename = parts.pop();
    if (!filename) throw new Error(`Invalid workspace path: ${filePath}`);

    let directory = root;
    for (const segment of parts) {
      directory = await directory.getDirectoryHandle(segment);
    }
    if (!directory.removeEntry) {
      throw new Error('The selected browser does not support folder deletes.');
    }
    try {
      await directory.removeEntry(filename);
    } catch (error) {
      if (isNotFoundFileSystemError(error)) return;
      throw error;
    }
  }

  private async collectImportedFile(
    file: File,
    path: string,
    files: WorkspaceFile[],
    skipped: string[],
    totalBytes: number
  ): Promise<{ totalBytes: number }> {
    const language = languageForPath(path);
    const assetMimeType = assetMimeTypeForPath(path);
    if ((!language && !assetMimeType) || !path) {
      skipped.push(`${path || file.name} · unsupported file type`);
      return { totalBytes };
    }
    if (files.length >= MAX_FILES) {
      skipped.push(`${path} · file limit reached`);
      return { totalBytes };
    }
    if (files.some((candidate) => candidate.path === path)) {
      skipped.push(`${path} · duplicate workspace path`);
      return { totalBytes };
    }
    const maxBytes = assetMimeType ? MAX_ASSET_BYTES : MAX_TEXT_FILE_BYTES;
    if (file.size > maxBytes) {
      skipped.push(
        `${path} · larger than ${assetMimeType ? '4 MB' : '512 KB'}`
      );
      return { totalBytes };
    }
    if (totalBytes + file.size > MAX_TOTAL_BYTES) {
      skipped.push(`${path} · workspace limit reached`);
      return { totalBytes };
    }
    if (assetMimeType) {
      files.push({
        path,
        language: 'asset',
        source: '',
        kind: 'asset',
        mimeType: file.type || assetMimeType,
        blob: file,
      });
      return { totalBytes: totalBytes + file.size };
    }

    if (!language || (!isLikelyText(file) && file.type !== '')) {
      skipped.push(`${path} · binary file`);
      return { totalBytes };
    }

    files.push({
      path,
      language,
      source: await file.text(),
      kind: 'text',
      mimeType: file.type || undefined,
    });
    return { totalBytes: totalBytes + file.size };
  }

  static activePathFor(files: readonly WorkspaceFile[]): string {
    return selectActivePath(files);
  }

  private async persistDirectoryHandle(
    handle: FileSystemDirectoryHandleLike
  ): Promise<void> {
    try {
      await this.persistence?.setDirectoryHandle(handle);
    } catch {
      // Keep the current session usable when IndexedDB cannot clone the handle.
    }
  }

  private async persistDirectoryScope(scopeId: string | null): Promise<void> {
    if (!scopeId) return;
    try {
      await this.persistence?.setDirectoryScopeId?.(scopeId);
    } catch {
      // Keep the current session usable when scope metadata cannot be persisted.
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
