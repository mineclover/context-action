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
};

type FileSystemDirectoryHandleLike = {
  kind: 'directory';
  name: string;
  entries(): AsyncIterableIterator<
    [string, FileSystemFileHandleLike | FileSystemDirectoryHandleLike]
  >;
};

type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandleLike>;
};

const MAX_FILES = 200;
const MAX_FILE_BYTES = 512 * 1024;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024;

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

function isLikelyText(file: File): boolean {
  return file.type.startsWith('text/') || file.type === 'application/json';
}

function selectActivePath(files: readonly WorkspaceFile[]): string {
  return (
    files.find((file) => file.path === 'index.html')?.path ??
    files.find((file) => file.language === 'html')?.path ??
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
  async pickFolder(): Promise<ImportedFolder> {
    const picker = (window as WindowWithDirectoryPicker).showDirectoryPicker;
    if (!picker) {
      throw new Error(
        'Directory picker is not available. Use the folder upload fallback.'
      );
    }
    return this.importDirectoryHandle(await picker());
  }

  async importDirectoryHandle(
    handle: FileSystemDirectoryHandleLike
  ): Promise<ImportedFolder> {
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

  private async readFile(
    file: File,
    path: string,
    files: WorkspaceFile[],
    skipped: string[],
    totalBytes: number
  ): Promise<{ totalBytes: number }> {
    const language = languageForPath(path);
    if (!language || !path) {
      skipped.push(`${path || file.name} · unsupported file type`);
      return { totalBytes };
    }
    if (files.length >= MAX_FILES) {
      skipped.push(`${path} · file limit reached`);
      return { totalBytes };
    }
    if (file.size > MAX_FILE_BYTES) {
      skipped.push(`${path} · larger than 512 KB`);
      return { totalBytes };
    }
    if (totalBytes + file.size > MAX_TOTAL_BYTES) {
      skipped.push(`${path} · workspace limit reached`);
      return { totalBytes };
    }
    if (!isLikelyText(file) && file.type !== '') {
      skipped.push(`${path} · binary file`);
      return { totalBytes };
    }

    files.push({ path, language, source: await file.text() });
    return { totalBytes: totalBytes + file.size };
  }

  static activePathFor(files: readonly WorkspaceFile[]): string {
    return selectActivePath(files);
  }
}
