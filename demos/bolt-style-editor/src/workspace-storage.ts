import {
  selectWorkspaceActivePath,
  type WorkspaceFile,
} from '@context-action/live-code-editor';
import Dexie, { type Table } from 'dexie';
import type { FileSystemDirectoryHandleLike } from './workspace-filesystem';

const DATABASE_NAME = 'context-action-web-coding-demo';
const DATABASE_VERSION = 1;
export const DEMO_WORKSPACE_ID = 'canvas-landing';

type WorkspaceMetadataRecord = {
  id: string;
  rootName: string;
  activePath: string;
  directoryHandle?: FileSystemDirectoryHandleLike;
  deletedPaths?: string[];
  updatedAt: number;
  schemaVersion: number;
};

type WorkspaceFileRecord = {
  id: string;
  workspaceId: string;
  path: string;
  renamedFrom?: string;
  language: string;
  kind?: 'text' | 'asset';
  mimeType: string;
  size: number;
  blob: Blob;
  updatedAt: number;
};

export class WebCodingWorkspaceDatabase extends Dexie {
  workspaces!: Table<WorkspaceMetadataRecord, string>;
  files!: Table<WorkspaceFileRecord, string>;

  constructor(name = DATABASE_NAME) {
    super(name);
    this.version(DATABASE_VERSION).stores({
      workspaces: 'id,updatedAt',
      files: 'id,workspaceId,[workspaceId+path],updatedAt',
    });
  }
}

export type PersistedWorkspace = {
  rootName: string;
  activePath: string;
  files: WorkspaceFile[];
  deletedPaths: string[];
  directoryHandle?: FileSystemDirectoryHandleLike;
};

function mimeTypeForLanguage(language: string): string {
  switch (language) {
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'javascript':
      return 'text/javascript';
    case 'markdown':
      return 'text/markdown';
    default:
      return 'text/plain';
  }
}

function blobForFile(file: WorkspaceFile): Blob {
  if (file.kind === 'asset' && file.blob) return file.blob;
  return new Blob([file.source], {
    type: file.mimeType ?? mimeTypeForLanguage(file.language),
  });
}

function displayOrder(path: string): number {
  return (
    ['index.html', 'styles.css', 'app.js', 'README.md'].indexOf(path) + 1 || 100
  );
}

export class WebCodingWorkspaceRepository {
  constructor(
    private readonly database = new WebCodingWorkspaceDatabase(),
    private readonly workspaceId = DEMO_WORKSPACE_ID
  ) {}

  async ensureWorkspace(
    seedFiles: readonly WorkspaceFile[]
  ): Promise<PersistedWorkspace> {
    const metadata = await this.database.workspaces.get(this.workspaceId);
    const records = metadata
      ? await this.database.files
          .where('workspaceId')
          .equals(this.workspaceId)
          .sortBy('path')
      : [];

    if (!metadata || records.length === 0) {
      await this.replaceWorkspace(seedFiles, 'index.html', 'canvas-landing');
      return this.loadWorkspace();
    }
    return this.toWorkspace(metadata, records);
  }

  async replaceWorkspace(
    files: readonly WorkspaceFile[],
    activePath: string,
    rootName: string,
    deletedPaths: readonly string[] = []
  ): Promise<PersistedWorkspace> {
    const now = Date.now();
    const previousMetadata = await this.database.workspaces.get(
      this.workspaceId
    );
    const metadata: WorkspaceMetadataRecord = {
      id: this.workspaceId,
      rootName: rootName || 'workspace',
      activePath,
      directoryHandle: previousMetadata?.directoryHandle,
      deletedPaths: [...new Set(deletedPaths)],
      updatedAt: now,
      schemaVersion: DATABASE_VERSION,
    };
    const records = files.map<WorkspaceFileRecord>((file) => {
      const blob = blobForFile(file);
      return {
        id: `${this.workspaceId}:${file.path}`,
        workspaceId: this.workspaceId,
        path: file.path,
        renamedFrom: file.renamedFrom,
        language: file.language,
        kind: file.kind ?? 'text',
        mimeType: blob.type,
        size: blob.size,
        blob,
        updatedAt: now,
      };
    });

    await this.database.transaction(
      'rw',
      this.database.workspaces,
      this.database.files,
      async () => {
        await this.database.files
          .where('workspaceId')
          .equals(this.workspaceId)
          .delete();
        await this.database.files.bulkPut(records);
        await this.database.workspaces.put(metadata);
      }
    );
    return this.loadWorkspace();
  }

  async saveFile(file: WorkspaceFile): Promise<void> {
    const now = Date.now();
    const blob = blobForFile(file);
    await this.database.transaction(
      'rw',
      this.database.workspaces,
      this.database.files,
      async () => {
        await this.database.files.put({
          id: `${this.workspaceId}:${file.path}`,
          workspaceId: this.workspaceId,
          path: file.path,
          renamedFrom: file.renamedFrom,
          language: file.language,
          kind: file.kind ?? 'text',
          mimeType: blob.type,
          size: blob.size,
          blob,
          updatedAt: now,
        });
        const metadata = await this.database.workspaces.get(this.workspaceId);
        if (metadata) {
          await this.database.workspaces.put({
            ...metadata,
            deletedPaths: (metadata.deletedPaths ?? []).filter(
              (path) => path !== file.path
            ),
            updatedAt: now,
          });
        }
      }
    );
  }

  async deleteFile(
    path: string,
    options: { trackPendingDeletion?: boolean } = {}
  ): Promise<void> {
    const now = Date.now();
    const trackPendingDeletion = options.trackPendingDeletion ?? true;
    await this.database.transaction(
      'rw',
      this.database.workspaces,
      this.database.files,
      async () => {
        await this.database.files.delete(`${this.workspaceId}:${path}`);
        const metadata = await this.database.workspaces.get(this.workspaceId);
        if (metadata) {
          await this.database.workspaces.put({
            ...metadata,
            deletedPaths: trackPendingDeletion
              ? [...new Set([...(metadata.deletedPaths ?? []), path])]
              : (metadata.deletedPaths ?? []).filter(
                  (deletedPath) => deletedPath !== path
                ),
            updatedAt: now,
          });
        }
      }
    );
  }

  async clearDeletedPaths(): Promise<void> {
    const metadata = await this.database.workspaces.get(this.workspaceId);
    if (!metadata) return;
    await this.database.workspaces.put({
      ...metadata,
      deletedPaths: [],
      updatedAt: Date.now(),
    });
  }

  async getDirectoryHandle(): Promise<
    FileSystemDirectoryHandleLike | undefined
  > {
    const metadata = await this.database.workspaces.get(this.workspaceId);
    return metadata?.directoryHandle;
  }

  async setDirectoryHandle(
    directoryHandle: FileSystemDirectoryHandleLike
  ): Promise<void> {
    const metadata = await this.database.workspaces.get(this.workspaceId);
    if (!metadata) return;
    await this.database.workspaces.put({
      ...metadata,
      directoryHandle,
      updatedAt: Date.now(),
    });
  }

  async clearDirectoryHandle(): Promise<void> {
    const metadata = await this.database.workspaces.get(this.workspaceId);
    if (!metadata) return;
    const { directoryHandle: _directoryHandle, ...withoutHandle } = metadata;
    await this.database.workspaces.put({
      ...withoutHandle,
      updatedAt: Date.now(),
    });
  }

  async setActivePath(activePath: string): Promise<void> {
    const metadata = await this.database.workspaces.get(this.workspaceId);
    if (!metadata) return;
    await this.database.workspaces.put({
      ...metadata,
      activePath,
      updatedAt: Date.now(),
    });
  }

  close(): void {
    this.database.close();
  }

  private async loadWorkspace(): Promise<PersistedWorkspace> {
    const metadata = await this.database.workspaces.get(this.workspaceId);
    if (!metadata) throw new Error('Workspace metadata was not created.');
    const records = await this.database.files
      .where('workspaceId')
      .equals(this.workspaceId)
      .sortBy('path');
    return this.toWorkspace(metadata, records);
  }

  private async toWorkspace(
    metadata: WorkspaceMetadataRecord,
    records: readonly WorkspaceFileRecord[]
  ): Promise<PersistedWorkspace> {
    const files = await Promise.all(
      records.map(async (record) =>
        record.kind === 'asset' || record.language === 'asset'
          ? {
              path: record.path,
              renamedFrom: record.renamedFrom,
              language: 'asset',
              source: '',
              kind: 'asset' as const,
              mimeType: record.mimeType,
              blob: record.blob,
            }
          : {
              path: record.path,
              renamedFrom: record.renamedFrom,
              language: record.language,
              source: await record.blob.text(),
              kind: 'text' as const,
              mimeType: record.mimeType,
            }
      )
    );
    const sortedFiles = files.sort(
      (left, right) => displayOrder(left.path) - displayOrder(right.path)
    );
    const filePaths = new Set(sortedFiles.map((file) => file.path));
    const activePath = filePaths.has(metadata.activePath)
      ? metadata.activePath
      : selectWorkspaceActivePath(sortedFiles);
    const deletedPaths = [...new Set(metadata.deletedPaths ?? [])].filter(
      (path) => !filePaths.has(path)
    );
    const storedDeletedPaths = metadata.deletedPaths ?? [];
    const metadataNeedsRepair =
      metadata.activePath !== activePath ||
      storedDeletedPaths.length !== deletedPaths.length ||
      storedDeletedPaths.some((path, index) => path !== deletedPaths[index]);
    if (metadataNeedsRepair) {
      await this.database.workspaces.put({
        ...metadata,
        activePath,
        deletedPaths,
        updatedAt: Date.now(),
      });
    }

    return {
      rootName: metadata.rootName,
      activePath,
      files: sortedFiles,
      deletedPaths,
      directoryHandle: metadata.directoryHandle,
    };
  }
}
