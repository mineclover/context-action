import type { WorkspaceSnapshot } from './workspace';

type WorkspacePersistenceSnapshot = Pick<
  WorkspaceSnapshot,
  'storageMode' | 'storageError'
>;

type WorkspaceRevisionSnapshot = Pick<
  WorkspaceSnapshot,
  'activePath' | 'revision' | 'storageMode' | 'storageError'
>;

/**
 * Keep persistence state explicit in every standalone tool result.
 *
 * The handler layer supplies the snapshot; this module only defines the
 * provider-neutral result metadata shape and never reads workspace state.
 */
export function createWorkspacePersistenceMeta(
  snapshot: WorkspacePersistenceSnapshot
) {
  return {
    storageMode: snapshot.storageMode,
    ...(snapshot.storageError ? { storageError: snapshot.storageError } : {}),
  };
}

export function createWorkspaceResultMeta(snapshot: WorkspaceRevisionSnapshot) {
  return {
    activePath: snapshot.activePath,
    revision: snapshot.revision,
    ...createWorkspacePersistenceMeta(snapshot),
  };
}
