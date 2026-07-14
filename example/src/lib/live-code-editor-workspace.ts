/**
 * File-system-backed workspace contracts for the Live Code Editor.
 *
 * The workspace manager is UI/framework agnostic. The browser adapter is the
 * only layer that touches File System Access API handles, keeping handles out
 * of ToolContext payloads and iframe messages.
 */

export type WorkspaceStorageMode = 'memory' | 'file-system';

export interface LiveEditorWorkspaceFile {
  readonly path: string;
  readonly source: string;
  readonly initialSource: string;
  readonly kind: 'file';
}

export interface LiveEditorWorkspaceSnapshot {
  readonly files: LiveEditorWorkspaceFile[];
  readonly activePath: string;
  readonly dirtyPaths: string[];
  readonly storageMode: WorkspaceStorageMode;
  readonly rootName: string;
}

export interface OpenWorkspaceResult {
  readonly files: LiveEditorWorkspaceFile[];
  readonly rootName: string;
}

export interface FileSystemFileHandleLike {
  readonly kind: 'file';
  readonly name: string;
  getFile(): Promise<{ readonly size: number; text(): Promise<string> }>;
  createWritable(): Promise<{
    write(data: string): Promise<void>;
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

const TEXT_FILE_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '.vue',
  '.yaml',
  '.yml',
]);

const MAX_FILES = 200;
const MAX_FILE_SIZE = 1_000_000;

function hasTextExtension(name: string): boolean {
  const dot = name.lastIndexOf('.');
  return dot > -1 && TEXT_FILE_EXTENSIONS.has(name.slice(dot).toLowerCase());
}

function normalizeWorkspacePath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .filter((segment) => segment !== '.' && segment !== '..')
    .join('/');
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
    const firstPath = normalizedFiles[0]?.path ?? '';
    this.snapshot = {
      files: normalizedFiles,
      activePath: options?.activePath ?? firstPath,
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
    const exists = this.snapshot.files.some(
      (file) => file.path === normalizedPath
    );
    const files = exists
      ? this.snapshot.files.map((file) =>
          file.path === normalizedPath ? { ...file, source } : file
        )
      : [
          ...this.snapshot.files,
          {
            path: normalizedPath,
            source,
            initialSource: source,
            kind: 'file' as const,
          },
        ];
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
    }
  ): LiveEditorWorkspaceSnapshot {
    const normalizedFiles = files
      .map((file) => ({ ...file, path: normalizeWorkspacePath(file.path) }))
      .filter((file) => file.path.length > 0);
    this.snapshot = {
      ...this.snapshot,
      files: normalizedFiles,
      activePath: normalizedFiles[0]?.path ?? '',
      dirtyPaths: [],
      rootName: options.rootName,
      storageMode: options.storageMode,
    };
    this.emit();
    return this.snapshot;
  }

  markSaved(path: string, source?: string): LiveEditorWorkspaceSnapshot {
    const normalizedPath = normalizeWorkspacePath(path);
    const files =
      source === undefined
        ? this.snapshot.files
        : this.snapshot.files.map((file) =>
            file.path === normalizedPath ? { ...file, source } : file
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

export class BrowserFileSystemWorkspaceAdapter {
  private directoryHandle: FileSystemDirectoryHandleLike | null = null;

  get isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof (window as FileSystemWindow).showDirectoryPicker === 'function'
    );
  }

  async openDirectory(): Promise<OpenWorkspaceResult> {
    const picker = (window as FileSystemWindow).showDirectoryPicker;
    if (!picker) {
      throw new Error(
        'This browser does not support the File System Access API.'
      );
    }
    this.directoryHandle = await picker({ mode: 'readwrite' });
    const files: LiveEditorWorkspaceFile[] = [];
    await this.readDirectory(this.directoryHandle, '', files);
    if (files.length === 0) {
      throw new Error('No supported text files were found in this directory.');
    }
    return { files, rootName: this.directoryHandle.name };
  }

  async saveFile(path: string, source: string): Promise<void> {
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
    await writable.write(source);
    await writable.close();
  }

  private async readDirectory(
    directory: FileSystemDirectoryHandleLike,
    prefix: string,
    files: LiveEditorWorkspaceFile[]
  ): Promise<void> {
    for await (const entry of directory.values()) {
      if (files.length >= MAX_FILES) return;
      const path = normalizeWorkspacePath(`${prefix}/${entry.name}`);
      if (entry.kind === 'directory') {
        await this.readDirectory(entry, path, files);
        continue;
      }
      if (!hasTextExtension(entry.name)) continue;
      const file = await entry.getFile();
      if (file.size > MAX_FILE_SIZE) continue;
      const source = await file.text();
      files.push({ path, source, initialSource: source, kind: 'file' });
    }
  }
}

export function createWorkspaceFile(
  path: string,
  source: string
): LiveEditorWorkspaceFile {
  return { path, source, initialSource: source, kind: 'file' };
}
