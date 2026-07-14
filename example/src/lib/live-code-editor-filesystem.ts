/**
 * Generic file-system contracts for the Live Code Editor.
 *
 * The workspace database owns the canonical files. File-system adapters only
 * import a directory or write an explicitly requested file back to it.
 */

export interface WorkspaceBlobFile {
  readonly path: string;
  readonly blob: Blob;
  readonly mimeType: string;
  readonly size: number;
}

export interface WorkspaceFileSystemAdapter {
  readonly isSupported: boolean;
  readonly isWritable: boolean;
  openDirectory(): Promise<{
    readonly files: WorkspaceBlobFile[];
    readonly rootName: string;
  }>;
  saveFile(path: string, blob: Blob): Promise<void>;
}

export interface FileSystemReadableFileLike {
  readonly size: number;
  readonly type?: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface FileSystemFileHandleLike {
  readonly kind: 'file';
  readonly name: string;
  getFile(): Promise<FileSystemReadableFileLike>;
  createWritable(): Promise<{
    write(data: Blob): Promise<void>;
    close(): Promise<void>;
  }>;
}

export interface FileSystemDirectoryHandleLike {
  readonly kind: 'directory';
  readonly name: string;
  values(): AsyncIterable<FileSystemEntryHandleLike>;
  getDirectoryHandle(
    name: string,
    options?: { readonly create?: boolean }
  ): Promise<FileSystemDirectoryHandleLike>;
  getFileHandle(
    name: string,
    options?: { readonly create?: boolean }
  ): Promise<FileSystemFileHandleLike>;
}

export type FileSystemEntryHandleLike =
  | FileSystemFileHandleLike
  | FileSystemDirectoryHandleLike;

interface FileSystemWindow extends Window {
  showDirectoryPicker?: (options?: {
    readonly mode?: 'read' | 'readwrite';
  }) => Promise<FileSystemDirectoryHandleLike>;
}

const MAX_FILES = 500;
const MAX_FILE_SIZE = 10_000_000;
const MAX_TOTAL_SIZE = 50_000_000;

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.mjs': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.xml': 'application/xml',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
};

export function normalizeWorkspacePath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .filter((segment) => segment !== '.' && segment !== '..')
    .join('/');
}

export function inferWorkspaceMimeType(
  path: string,
  providedType?: string
): string {
  if (providedType) return providedType;
  const dot = path.lastIndexOf('.');
  return (
    (dot > -1 && MIME_TYPES[path.slice(dot).toLowerCase()]) ||
    'application/octet-stream'
  );
}

export function isTextWorkspaceFile(path: string, mimeType: string): boolean {
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/xml' ||
    /\.(?:css|html|js|json|md|mjs|ts|tsx|txt|vue|yaml|yml)$/i.test(path)
  );
}

export class BrowserFileSystemWorkspaceAdapter
  implements WorkspaceFileSystemAdapter
{
  private directoryHandle: FileSystemDirectoryHandleLike | null = null;

  get isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof (window as FileSystemWindow).showDirectoryPicker === 'function'
    );
  }

  get isWritable(): boolean {
    return this.directoryHandle !== null;
  }

  async openDirectory(): Promise<{
    readonly files: WorkspaceBlobFile[];
    readonly rootName: string;
  }> {
    const picker = (window as FileSystemWindow).showDirectoryPicker;
    if (!picker) {
      throw new Error(
        'This browser does not support the File System Access API.'
      );
    }
    this.directoryHandle = await picker({ mode: 'readwrite' });
    const files: WorkspaceBlobFile[] = [];
    let totalSize = 0;
    await this.readDirectory(this.directoryHandle, '', files, (size) => {
      totalSize += size;
      return totalSize <= MAX_TOTAL_SIZE;
    });
    if (files.length === 0) {
      throw new Error('No supported files were found in this directory.');
    }
    return { files, rootName: this.directoryHandle.name };
  }

  async saveFile(path: string, blob: Blob): Promise<void> {
    if (!this.directoryHandle) {
      throw new Error('Open a workspace directory before saving files.');
    }
    const segments = normalizeWorkspacePath(path).split('/').filter(Boolean);
    const fileName = segments.pop();
    if (!fileName) throw new Error('Cannot save a file without a path.');

    let directory = this.directoryHandle;
    for (const segment of segments) {
      directory = await directory.getDirectoryHandle(segment, { create: true });
    }
    const fileHandle = await directory.getFileHandle(fileName, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  private async readDirectory(
    directory: FileSystemDirectoryHandleLike,
    prefix: string,
    files: WorkspaceBlobFile[],
    acceptSize: (size: number) => boolean
  ): Promise<void> {
    for await (const entry of directory.values()) {
      if (files.length >= MAX_FILES) return;
      const path = normalizeWorkspacePath(`${prefix}/${entry.name}`);
      if (entry.kind === 'directory') {
        await this.readDirectory(entry, path, files, acceptSize);
        continue;
      }
      const file = await entry.getFile();
      if (file.size > MAX_FILE_SIZE || !acceptSize(file.size)) continue;
      const blob = new Blob([await file.arrayBuffer()], {
        type: inferWorkspaceMimeType(path, file.type),
      });
      files.push({
        path,
        blob,
        mimeType: blob.type,
        size: file.size,
      });
    }
  }
}
