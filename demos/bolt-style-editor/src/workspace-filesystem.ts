import type { WorkspaceFile } from './workspace';

export type ImportedFolder = {
  rootName: string;
  files: WorkspaceFile[];
  skipped: string[];
};

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

type FileSystemDirectoryHandleLike = {
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

const MAX_FILES = 200;
const MAX_TEXT_FILE_BYTES = 512 * 1024;
const MAX_ASSET_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 12 * 1024 * 1024;

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

function normalizePath(path: string): string {
  return path
    .replaceAll('\\', '/')
    .split('/')
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .join('/');
}

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

function selectActivePath(files: readonly WorkspaceFile[]): string {
  return (
    files.find((file) => file.path === 'index.html')?.path ??
    files.find((file) => file.language === 'html')?.path ??
    files.find((file) => file.kind !== 'asset')?.path ??
    files[0]?.path ??
    'index.html'
  );
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

export class BrowserWorkspaceFileSystemAdapter {
  private directoryHandle: FileSystemDirectoryHandleLike | null = null;

  get hasWritableFolder(): boolean {
    return this.directoryHandle !== null;
  }

  async pickFolder(): Promise<ImportedFolder> {
    const picker = (window as WindowWithDirectoryPicker).showDirectoryPicker;
    if (!picker) {
      throw new Error(
        'Directory picker is not available. Use the folder upload fallback.'
      );
    }
    const handle = await picker({ mode: 'readwrite' });
    this.directoryHandle = handle;
    try {
      return await this.importDirectoryHandle(handle);
    } catch (error) {
      this.directoryHandle = null;
      throw error;
    }
  }

  async importDirectoryHandle(
    handle: FileSystemDirectoryHandleLike
  ): Promise<ImportedFolder> {
    this.directoryHandle = handle;
    const files: WorkspaceFile[] = [];
    const skipped: string[] = [];
    let totalBytes = 0;

    const visit = async (
      directory: FileSystemDirectoryHandleLike,
      prefix: string
    ): Promise<void> => {
      for await (const [name, entry] of directory.entries()) {
        const path = normalizePath(`${prefix}/${name}`);
        if (entry.kind === 'directory') {
          await visit(entry, path);
          continue;
        }
        const file = await entry.getFile();
        const accepted = await this.readFile(
          file,
          path,
          files,
          skipped,
          totalBytes
        );
        totalBytes = accepted.totalBytes;
        if (files.length >= MAX_FILES) return;
      }
    };

    await visit(handle, '');
    return {
      rootName: handle.name || 'workspace',
      files: sortFiles(files),
      skipped,
    };
  }

  async importFileList(fileList: FileList): Promise<ImportedFolder> {
    this.directoryHandle = null;
    const files: WorkspaceFile[] = [];
    const skipped: string[] = [];
    let totalBytes = 0;
    let rootName = 'workspace';

    for (const file of Array.from(fileList)) {
      const relativePath = file.webkitRelativePath || file.name;
      const segments = relativePath.split('/');
      if (segments.length > 1 && segments[0]) rootName = segments[0];
      const path = normalizePath(segments.slice(1).join('/') || file.name);
      const accepted = await this.readFile(
        file,
        path,
        files,
        skipped,
        totalBytes
      );
      totalBytes = accepted.totalBytes;
      if (files.length >= MAX_FILES) break;
    }

    return { rootName, files: sortFiles(files), skipped };
  }

  async writeFiles(files: readonly WorkspaceFile[]): Promise<number> {
    const directory = this.directoryHandle;
    if (!directory) {
      throw new Error('This workspace was imported without a writable folder.');
    }

    const permission = await this.ensureWritePermission(directory);
    if (permission !== 'granted') {
      throw new Error(
        'Write permission for the selected folder was not granted.'
      );
    }

    for (const file of files) {
      await this.writeFile(directory, file);
    }
    return files.length;
  }

  async removeFiles(paths: readonly string[]): Promise<number> {
    const directory = this.directoryHandle;
    if (!directory) {
      throw new Error('This workspace was imported without a writable folder.');
    }

    const permission = await this.ensureWritePermission(directory);
    if (permission !== 'granted') {
      throw new Error(
        'Write permission for the selected folder was not granted.'
      );
    }

    for (const path of paths) {
      await this.removeFile(directory, path);
    }
    return paths.length;
  }

  private async ensureWritePermission(
    directory: FileSystemDirectoryHandleLike
  ): Promise<'granted' | 'prompt' | 'denied'> {
    const descriptor = { mode: 'readwrite' as const };
    const current = await directory.queryPermission?.(descriptor);
    if (current === 'granted') return current;
    if (!directory.requestPermission) return current ?? 'granted';
    return directory.requestPermission(descriptor);
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
    await directory.removeEntry(filename);
  }

  private async readFile(
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
}
