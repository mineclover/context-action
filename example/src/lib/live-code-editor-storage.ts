/**
 * Dexie persistence for Live Code Editor workspace metadata and Blob content.
 *
 * Blob URLs are derived preview handles only. The database remains the source
 * of truth and the URLs are revoked when a repository is replaced or closed.
 */

import Dexie, { type Table } from 'dexie';
import {
  inferWorkspaceMimeType,
  isTextWorkspaceFile,
  normalizeWorkspacePath,
  type WorkspaceBlobFile,
} from './live-code-editor-filesystem';
import {
  createWorkspaceFile,
  type LiveEditorWorkspaceFile,
} from './live-code-editor-workspace';

export const LIVE_EDITOR_WORKSPACE_ID = 'context-action-showcase';
export const LIVE_EDITOR_WORKSPACE_ROOT = 'context-action-showcase';

const DATABASE_NAME = 'context-action-live-editor';
const SCHEMA_VERSION = 1;

export interface WorkspaceMetadataRecord {
  readonly id: string;
  readonly rootName: string;
  readonly activePath: string;
  readonly entryPath?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly schemaVersion: number;
}

export interface WorkspaceFileRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly path: string;
  readonly blob: Blob;
  readonly mimeType: string;
  readonly size: number;
  readonly updatedAt: number;
}

export interface PersistedWorkspaceSnapshot {
  readonly metadata: WorkspaceMetadataRecord;
  readonly files: LiveEditorWorkspaceFile[];
}

export class LiveEditorWorkspaceDatabase extends Dexie {
  workspaces!: Table<WorkspaceMetadataRecord, string>;
  files!: Table<WorkspaceFileRecord, string>;

  constructor(name = DATABASE_NAME) {
    super(name);
    this.version(SCHEMA_VERSION).stores({
      workspaces: 'id,updatedAt',
      files: 'id,workspaceId,[workspaceId+path],updatedAt',
    });
  }
}

function entryPathForFiles(
  files: readonly { path: string }[]
): string | undefined {
  const htmlFiles = files.filter((file) =>
    file.path.toLowerCase().endsWith('.html')
  );
  return (
    htmlFiles.find(
      (file) => file.path.split('/').pop()?.toLowerCase() === 'index.html'
    )?.path ?? htmlFiles[0]?.path
  );
}

function activePathForFiles(files: readonly LiveEditorWorkspaceFile[]): string {
  return (
    entryPathForFiles(files)?.toString() ??
    files.find((file) => file.isText)?.path ??
    files[0]?.path ??
    ''
  );
}

export class LiveEditorWorkspaceRepository {
  private readonly objectUrls = new Set<string>();

  constructor(private readonly database = new LiveEditorWorkspaceDatabase()) {}

  async ensureWorkspace(
    workspaceId: string,
    seedFiles: readonly LiveEditorWorkspaceFile[],
    rootName = LIVE_EDITOR_WORKSPACE_ROOT
  ): Promise<PersistedWorkspaceSnapshot> {
    const metadata = await this.database.workspaces.get(workspaceId);
    const fileCount = metadata
      ? await this.database.files
          .where('workspaceId')
          .equals(workspaceId)
          .count()
      : 0;
    if (!metadata || fileCount === 0) {
      return this.replaceWorkspace(
        workspaceId,
        seedFiles.map((file) => ({
          path: file.path,
          blob: new Blob([file.source], { type: file.mimeType }),
          mimeType: file.mimeType,
          size: file.size,
        })),
        { rootName }
      );
    }
    return this.loadWorkspace(workspaceId);
  }

  async replaceWorkspace(
    workspaceId: string,
    files: readonly WorkspaceBlobFile[],
    options: { readonly rootName: string }
  ): Promise<PersistedWorkspaceSnapshot> {
    const now = Date.now();
    const normalizedFiles = files.map((file) => ({
      ...file,
      path: normalizeWorkspacePath(file.path),
      mimeType: inferWorkspaceMimeType(file.path, file.mimeType),
    }));
    const loadedTextFiles = normalizedFiles.filter((file) =>
      isTextWorkspaceFile(file.path, file.mimeType)
    );
    const activePath = activePathForFiles(
      loadedTextFiles.map((file) =>
        createWorkspaceFile(file.path, '', { mimeType: file.mimeType })
      )
    );
    const metadata: WorkspaceMetadataRecord = {
      id: workspaceId,
      rootName: options.rootName,
      activePath,
      ...(entryPathForFiles(normalizedFiles)
        ? { entryPath: entryPathForFiles(normalizedFiles) }
        : {}),
      createdAt: now,
      updatedAt: now,
      schemaVersion: SCHEMA_VERSION,
    };
    const records = normalizedFiles.map<WorkspaceFileRecord>((file) => ({
      id: `${workspaceId}:${file.path}`,
      workspaceId,
      path: file.path,
      blob: file.blob,
      mimeType: file.mimeType,
      size: file.size,
      updatedAt: now,
    }));

    await this.database.transaction(
      'rw',
      this.database.workspaces,
      this.database.files,
      async () => {
        await this.database.files
          .where('workspaceId')
          .equals(workspaceId)
          .delete();
        await this.database.files.bulkPut(records);
        await this.database.workspaces.put(metadata);
      }
    );
    this.revokeObjectUrls();
    return this.loadWorkspace(workspaceId);
  }

  async saveTextFile(
    workspaceId: string,
    path: string,
    source: string,
    mimeType?: string
  ): Promise<void> {
    const normalizedPath = normalizeWorkspacePath(path);
    const existing = await this.database.files
      .where('[workspaceId+path]')
      .equals([workspaceId, normalizedPath])
      .first();
    if (!existing) return;
    const resolvedMimeType = inferWorkspaceMimeType(
      normalizedPath,
      mimeType ?? existing.mimeType
    );
    const blob = new Blob([source], { type: resolvedMimeType });
    await this.database.files.put({
      ...existing,
      blob,
      mimeType: resolvedMimeType,
      size: blob.size,
      updatedAt: Date.now(),
    });
    await this.touchWorkspace(workspaceId);
  }

  async setActivePath(workspaceId: string, activePath: string): Promise<void> {
    const metadata = await this.database.workspaces.get(workspaceId);
    if (!metadata) return;
    await this.database.workspaces.put({
      ...metadata,
      activePath: normalizeWorkspacePath(activePath),
      updatedAt: Date.now(),
    });
  }

  async loadWorkspace(
    workspaceId: string
  ): Promise<PersistedWorkspaceSnapshot> {
    const metadata = await this.database.workspaces.get(workspaceId);
    if (!metadata) throw new Error(`Workspace not found: ${workspaceId}`);
    const records = await this.database.files
      .where('workspaceId')
      .equals(workspaceId)
      .sortBy('path');
    const files = await Promise.all(
      records.map(async (record) => {
        const isText = isTextWorkspaceFile(record.path, record.mimeType);
        const source = isText ? await record.blob.text() : '';
        const previewUrl = isText
          ? undefined
          : URL.createObjectURL(record.blob);
        if (previewUrl) this.objectUrls.add(previewUrl);
        return {
          ...createWorkspaceFile(record.path, source, {
            mimeType: record.mimeType,
          }),
          initialSource: source,
          size: record.size,
          isText,
          ...(previewUrl ? { previewUrl } : {}),
        } satisfies LiveEditorWorkspaceFile;
      })
    );
    return { metadata, files };
  }

  close(): void {
    this.revokeObjectUrls();
    this.database.close();
  }

  private async touchWorkspace(workspaceId: string): Promise<void> {
    const metadata = await this.database.workspaces.get(workspaceId);
    if (!metadata) return;
    await this.database.workspaces.put({
      ...metadata,
      updatedAt: Date.now(),
    });
  }

  private revokeObjectUrls(): void {
    for (const url of this.objectUrls) URL.revokeObjectURL(url);
    this.objectUrls.clear();
  }
}
