import Dexie, { type Table } from 'dexie';

import type { WorkspaceFile } from './workspace';

const DATABASE_NAME = 'context-action-web-coding-demo';
const DATABASE_VERSION = 1;
export const DEMO_WORKSPACE_ID = 'canvas-landing';

type WorkspaceMetadataRecord = {
  id: string;
  rootName: string;
  activePath: string;
  updatedAt: number;
  schemaVersion: number;
};

type WorkspaceFileRecord = {
  id: string;
  workspaceId: string;
  path: string;
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
    rootName: string
  ): Promise<PersistedWorkspace> {
    const now = Date.now();
    const metadata: WorkspaceMetadataRecord = {
      id: this.workspaceId,
      rootName: rootName || 'workspace',
      activePath,
      updatedAt: now,
      schemaVersion: DATABASE_VERSION,
    };
    const records = files.map<WorkspaceFileRecord>((file) => {
      const blob = blobForFile(file);
      return {
        id: `${this.workspaceId}:${file.path}`,
        workspaceId: this.workspaceId,
        path: file.path,
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
    await this.database.files.put({
      id: `${this.workspaceId}:${file.path}`,
      workspaceId: this.workspaceId,
      path: file.path,
      language: file.language,
      kind: file.kind ?? 'text',
      mimeType: blob.type,
      size: blob.size,
      blob,
      updatedAt: now,
    });
    await this.touchMetadata(now);
  }

  async deleteFile(path: string): Promise<void> {
    await this.database.files.delete(`${this.workspaceId}:${path}`);
    await this.touchMetadata(Date.now());
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

  private async touchMetadata(updatedAt: number): Promise<void> {
    const metadata = await this.database.workspaces.get(this.workspaceId);
    if (!metadata) return;
    await this.database.workspaces.put({ ...metadata, updatedAt });
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
              language: 'asset',
              source: '',
              kind: 'asset' as const,
              mimeType: record.mimeType,
              blob: record.blob,
            }
          : {
              path: record.path,
              language: record.language,
              source: await record.blob.text(),
              kind: 'text' as const,
              mimeType: record.mimeType,
            }
      )
    );
    return {
      rootName: metadata.rootName,
      activePath: metadata.activePath,
      files: files.sort(
        (left, right) => displayOrder(left.path) - displayOrder(right.path)
      ),
    };
  }
}
