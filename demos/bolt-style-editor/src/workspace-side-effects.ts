import { hashWorkspaceSource } from '@context-action/live-code-editor';
import {
  createDurableOperationStore,
  createDurableSideEffectRunner,
  createIndexedDbDurableOperationBackend,
  type DurableSideEffectRunner,
  type SideEffectRunResult,
} from '@context-action/tool-durable-operations';

export type WorkspaceSideEffectOperation = 'write' | 'delete';

export interface WorkspaceSideEffectResult {
  readonly operation: WorkspaceSideEffectOperation;
  readonly path: string;
}

export interface WorkspaceSideEffectDiagnostic {
  readonly operation: WorkspaceSideEffectOperation;
  readonly path: string;
  readonly scopeId: string;
  readonly revision: number;
  readonly sourceLength?: number;
  readonly sourceHash?: string;
}

export interface WorkspaceSideEffectIdentity {
  readonly fingerprint: string;
  readonly sourceHash?: string;
}

export type WorkspaceSideEffectRunResult = SideEffectRunResult<
  WorkspaceSideEffectResult,
  WorkspaceSideEffectDiagnostic
>;

const DATABASE_NAME = 'context-action-bolt-style-editor';
const STORE_NAME = 'workspace-side-effects';
const WORKSPACE_SAVE_ALL_OPERATION = 'workspace.saveAll';

function createOwnerId(): string {
  const randomUUID = globalThis.crypto?.randomUUID;
  return `bolt-style-editor:${
    typeof randomUUID === 'function'
      ? randomUUID.call(globalThis.crypto)
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }`;
}

/**
 * Create the browser-local durable runner lazily at the application boundary.
 * The protocol package remains browser-API agnostic and non-browser builds do
 * not attempt to open IndexedDB.
 */
export function createWorkspaceSideEffectRunner():
  | DurableSideEffectRunner<
      WorkspaceSideEffectResult,
      WorkspaceSideEffectDiagnostic
    >
  | undefined {
  const indexedDBFactory = (
    globalThis as typeof globalThis & { indexedDB?: IDBFactory }
  ).indexedDB;
  if (!indexedDBFactory) {
    return undefined;
  }

  const backend = createIndexedDbDurableOperationBackend<{
    result?: WorkspaceSideEffectResult;
    diagnostic?: WorkspaceSideEffectDiagnostic;
  }>({
    databaseName: DATABASE_NAME,
    storeName: STORE_NAME,
    indexedDB: indexedDBFactory,
  });
  const store = createDurableOperationStore(backend, {
    defaultLeaseMs: 30_000,
    retentionMs: 24 * 60 * 60 * 1000,
    prunePageSize: 100,
    maxPrunePages: 10,
  });
  return createDurableSideEffectRunner({
    store,
    ownerId: createOwnerId(),
  });
}

export function createWorkspaceSideEffectKey(
  scopeId: string,
  revision: number,
  operation: WorkspaceSideEffectOperation,
  path: string
): string {
  return `${WORKSPACE_SAVE_ALL_OPERATION}:${scopeId}:${revision}:${operation}:${path}`;
}

export async function createWorkspaceSideEffectIdentity(
  operation: WorkspaceSideEffectOperation,
  path: string,
  source?: string
): Promise<WorkspaceSideEffectIdentity> {
  const sourceHash =
    source === undefined ? undefined : await hashWorkspaceSource(source);
  return {
    fingerprint: [
      WORKSPACE_SAVE_ALL_OPERATION,
      operation,
      path,
      sourceHash ?? 'delete',
    ].join(':'),
    ...(sourceHash === undefined ? {} : { sourceHash }),
  };
}
