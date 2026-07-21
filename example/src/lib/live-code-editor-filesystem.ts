/**
 * Example compatibility facade for the shared workspace filesystem package.
 *
 * The example keeps its Blob-oriented repository contract and UI naming, while
 * the browser directory traversal, path validation, limits, permissions, and
 * folder writes are owned by @context-action/live-code-editor.
 */

import {
  BrowserWorkspaceFileSystemAdapter,
  type DirectoryHandlePersistence,
  type FileSystemDirectoryHandleLike,
  isBinaryWorkspacePath,
  languageForWorkspacePath,
  normalizeWorkspacePath as normalizePackageWorkspacePath,
  type WorkspaceFile,
} from '@context-action/live-code-editor';

export type { DirectoryHandlePersistence, FileSystemDirectoryHandleLike };

export interface WorkspaceBlobFile {
  readonly path: string;
  readonly blob: Blob;
  readonly mimeType: string;
  readonly size: number;
}

export interface WorkspaceFileSystemAdapter {
  readonly isSupported: boolean;
  readonly isWritable: boolean;
  readonly supportsDirectoryPicker: boolean;
  subscribe(listener: () => void): () => void;
  openDirectory(): Promise<{
    readonly files: WorkspaceBlobFile[];
    readonly rootName: string;
  }>;
  openFileList(files: readonly File[]): Promise<{
    readonly files: WorkspaceBlobFile[];
    readonly rootName: string;
  }>;
  readFile(path: string): Promise<WorkspaceBlobFile | undefined>;
  saveFile(path: string, blob: Blob): Promise<void>;
}

type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?: (options?: {
    mode?: 'read' | 'readwrite';
  }) => Promise<FileSystemDirectoryHandleLike>;
};

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
  return normalizePackageWorkspacePath(path);
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
  if (isBinaryWorkspacePath(path)) return false;
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/xml' ||
    /\.(?:css|html|js|json|md|mjs|ts|tsx|txt|vue|yaml|yml)$/i.test(path)
  );
}

function toBlobFile(file: WorkspaceFile): WorkspaceBlobFile {
  const mimeType = inferWorkspaceMimeType(file.path, file.mimeType);
  const blob =
    file.kind === 'asset' && file.blob
      ? file.blob
      : new Blob([file.source], { type: mimeType });
  return {
    path: file.path,
    blob,
    mimeType: blob.type || mimeType,
    size: blob.size,
  };
}

async function toWorkspaceFile(
  path: string,
  blob: Blob
): Promise<WorkspaceFile> {
  const normalizedPath = normalizeWorkspacePath(path);
  const mimeType = inferWorkspaceMimeType(normalizedPath, blob.type);
  const isText = isTextWorkspaceFile(normalizedPath, mimeType);
  if (isText) {
    return {
      path: normalizedPath,
      language: languageForWorkspacePath(normalizedPath),
      source: await blob.text(),
      kind: 'text',
      mimeType,
    };
  }
  return {
    path: normalizedPath,
    language: 'asset',
    source: '',
    kind: 'asset',
    mimeType,
    blob,
  };
}

export class BrowserFileSystemWorkspaceAdapter
  implements WorkspaceFileSystemAdapter
{
  private readonly adapter: BrowserWorkspaceFileSystemAdapter;

  constructor(persistence?: DirectoryHandlePersistence) {
    this.adapter = new BrowserWorkspaceFileSystemAdapter(persistence);
  }

  subscribe = (listener: () => void): (() => void) =>
    this.adapter.subscribe(listener);

  get supportsDirectoryPicker(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof (window as WindowWithDirectoryPicker).showDirectoryPicker ===
        'function'
    );
  }

  get isSupported(): boolean {
    return this.supportsDirectoryPicker || typeof document !== 'undefined';
  }

  get isWritable(): boolean {
    return this.adapter.hasWritableFolder;
  }

  async openDirectory(): Promise<{
    readonly files: WorkspaceBlobFile[];
    readonly rootName: string;
  }> {
    const imported = await this.adapter.pickFolder();
    return {
      rootName: imported.rootName,
      files: imported.files.map(toBlobFile),
    };
  }

  async openFileList(fileList: readonly File[]): Promise<{
    readonly files: WorkspaceBlobFile[];
    readonly rootName: string;
  }> {
    const imported = await this.adapter.importFileList(fileList);
    return {
      rootName: imported.rootName,
      files: imported.files.map(toBlobFile),
    };
  }

  async saveFile(path: string, blob: Blob): Promise<void> {
    await this.adapter.writeFiles([await toWorkspaceFile(path, blob)]);
  }

  async readFile(path: string): Promise<WorkspaceBlobFile | undefined> {
    const file = await this.adapter.readFile(path);
    return file ? toBlobFile(file) : undefined;
  }
}
