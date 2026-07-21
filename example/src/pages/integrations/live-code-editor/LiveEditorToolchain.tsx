import {
  createWorkspaceSavePlan,
  createWorkspaceSaveUnknownDetails,
} from '@context-action/live-code-editor';
import { createToolContext } from '@context-action/react';
import {
  createDurableOperationStore,
  createIndexedDbDurableOperationBackend,
} from '@context-action/tool-durable-operations';
import {
  TOOL_CALL_ERROR_CODES,
  type ToolCallResult,
} from '@context-action/tool-protocol';
import type { ReactNode } from 'react';
import {
  LiveEditorDocumentManager,
  type LiveEditorDocumentSnapshot,
} from '../../../lib/live-code-editor-bridge';
import { type WorkspaceFileSystemAdapter } from '../../../lib/live-code-editor-filesystem';
import { LiveEditorWorkspaceManager } from '../../../lib/live-code-editor-workspace';
import { applyLiveEditorTextPatch } from '../../../lib/live-editor-text-patch';
import { requestLiveEditorToolApproval } from '../../../lib/live-editor-tool-approval';
import { liveEditorToolsSchema } from '../../../lib/live-editor-tools-schema';
import { recordLiveEditorToolCall } from '../../../lib/live-editor-trace';
import { createLiveEditorResultContext } from '../../../lib/live-tool-result-contract';

const filesystemWriteTools = new Set(['editor.saveFile', 'editor.saveAll']);

function createLiveEditorOwnerId(): string {
  const randomUUID = globalThis.crypto?.randomUUID;
  return `live-editor:${
    typeof randomUUID === 'function'
      ? randomUUID.call(globalThis.crypto)
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }`;
}

// IndexedDB is intentionally created only in browser runtimes. This gives the
// editor a cross-tab operation record without making the framework package or
// the Node build depend on a browser persistence API.
const liveEditorDurableOperationStore =
  typeof globalThis !== 'undefined' && 'indexedDB' in globalThis
    ? createDurableOperationStore(
        createIndexedDbDurableOperationBackend<ToolCallResult>({
          databaseName: 'context-action-live-editor',
          storeName: 'tool-operations',
        }),
        {
          defaultLeaseMs: 30_000,
          retentionMs: 24 * 60 * 60 * 1000,
          prunePageSize: 100,
          maxPrunePages: 10,
        }
      )
    : undefined;

export const {
  Provider: LiveEditorToolProvider,
  useToolHandler: useLiveEditorToolHandler,
  useToolRegistry: useLiveEditorToolRegistry,
} = createToolContext('LiveEditorTools', {
  schema: liveEditorToolsSchema,
  debug: true,
  onToolCall: recordLiveEditorToolCall,
  durableOperationStore: liveEditorDurableOperationStore,
  durableOperationOwnerId: createLiveEditorOwnerId(),
  durableOperationLeaseMs: 30_000,
  toolPolicy: ({ context, definition, request, signal }) => {
    if (
      !filesystemWriteTools.has(request.params.name) ||
      context?.mode === 'direct'
    ) {
      return 'allow';
    }
    return requestLiveEditorToolApproval({
      request,
      definition,
      context,
      signal,
    });
  },
});

function LiveEditorToolHandlers({
  manager,
  workspaceManager,
  filesystemAdapter,
  getExampleIdForPath,
  getResetSource,
  children,
}: {
  manager: LiveEditorDocumentManager;
  workspaceManager: LiveEditorWorkspaceManager;
  filesystemAdapter: WorkspaceFileSystemAdapter;
  getExampleIdForPath: (path: string) => string;
  getResetSource: () => string;
  children: ReactNode;
}) {
  const blockingToolHandler = { blocking: true };

  useLiveEditorToolHandler(
    'editor.getStatus',
    () => {
      const workspace = workspaceManager.getSnapshot();
      const document = manager.getSnapshot();
      const folderLinked = filesystemAdapter.isWritable;
      return {
        ...createLiveEditorResultContext(workspace, document.revision),
        documentPath: document.file,
        documentExampleId: document.exampleId,
        rootName: workspace.rootName,
        storageMode: workspace.storageMode,
        fileCount: workspace.files.length,
        dirtyPaths: workspace.dirtyPaths,
        filesystem: {
          mode: folderLinked ? 'local-folder' : 'browser-only',
          folderLinked,
          saveAllAvailable: folderLinked,
        },
        preview: manager.getPreviewStatus(),
      };
    },
    blockingToolHandler
  );

  useLiveEditorToolHandler(
    'editor.listFiles',
    () => {
      const snapshot = workspaceManager.getSnapshot();
      return {
        activePath: snapshot.activePath,
        workspaceRevision: snapshot.revision,
        dirtyPaths: snapshot.dirtyPaths,
        rootName: snapshot.rootName,
        storageMode: snapshot.storageMode,
        files: snapshot.files.map((file) => ({
          isText: file.isText,
          mimeType: file.mimeType,
          path: file.path,
          size: file.size,
        })),
      };
    },
    blockingToolHandler
  );

  useLiveEditorToolHandler(
    'editor.getDocument',
    () => {
      const document = manager.getSnapshot();
      return {
        ...document,
        ...createLiveEditorResultContext(
          workspaceManager.getSnapshot(),
          document.revision
        ),
      };
    },
    blockingToolHandler
  );

  useLiveEditorToolHandler(
    'editor.getPreviewStatus',
    () => manager.getPreviewStatus(),
    blockingToolHandler
  );

  const updateAndWait = async (
    patch: Parameters<LiveEditorDocumentManager['update']>[0],
    signal?: AbortSignal
  ) => {
    if (signal?.aborted) throw new Error('Editor update cancelled.');
    const snapshot = manager.update(patch);
    const preview = await manager.waitForRendered(
      snapshot.revision,
      2_000,
      signal
    );
    if (preview.state === 'error') {
      throw new Error(
        `Preview execution failed: ${preview.message ?? 'unknown runtime error.'}`
      );
    }
    if (preview.state === 'timeout') {
      throw new Error(
        'Preview did not acknowledge the requested revision within 2 seconds.'
      );
    }
    return {
      ...snapshot,
      ...createLiveEditorResultContext(
        workspaceManager.getSnapshot(),
        snapshot.revision
      ),
      preview,
    };
  };

  useLiveEditorToolHandler<'editor.openFile', unknown>(
    'editor.openFile',
    ({ path }, controller) => {
      const file = workspaceManager
        .getSnapshot()
        .files.find((candidate) => candidate.path === path);
      if (!file) {
        throw new Error(`Workspace file not found: ${path}`);
      }
      if (!file.isText) {
        throw new Error(
          `Workspace file is binary and cannot be opened: ${path}`
        );
      }
      workspaceManager.setActivePath(file.path);
      return updateAndWait(
        {
          exampleId: getExampleIdForPath(file.path),
          file: file.path,
          source: file.source,
        },
        controller.signal
      );
    },
    blockingToolHandler
  );

  useLiveEditorToolHandler<'editor.saveFile', unknown>(
    'editor.saveFile',
    async ({ path }, controller) => {
      if (controller.signal?.aborted) throw new Error('File save cancelled.');
      if (!filesystemAdapter.isWritable) {
        throw new Error(
          'No writable folder is open. Open a local folder before saving files.'
        );
      }
      const file = workspaceManager
        .getSnapshot()
        .files.find((candidate) => candidate.path === path);
      if (!file) {
        throw new Error(`Workspace file not found: ${path}`);
      }
      if (!file.isText) {
        throw new Error(
          `Workspace file is binary and cannot be saved: ${path}`
        );
      }
      await filesystemAdapter.saveFile(
        file.path,
        new Blob([file.source], { type: file.mimeType })
      );
      if (controller.signal?.aborted) throw new Error('File save cancelled.');
      const snapshot = workspaceManager.markSaved(file.path, file.source);
      return {
        path: file.path,
        savedTo: 'filesystem',
        dirtyPaths: snapshot.dirtyPaths,
        ...createLiveEditorResultContext(
          snapshot,
          manager.getSnapshot().revision
        ),
      };
    },
    blockingToolHandler
  );

  useLiveEditorToolHandler<'editor.saveAll', unknown>(
    'editor.saveAll',
    async (_, controller) => {
      if (controller.signal?.aborted) throw new Error('File save cancelled.');
      if (!filesystemAdapter.isWritable) {
        throw new Error(
          'No writable folder is open. Open a local folder before saving files.'
        );
      }

      const initialSnapshot = workspaceManager.getSnapshot();
      const dirtyFiles = initialSnapshot.files.filter(
        (file) => initialSnapshot.dirtyPaths.includes(file.path) && file.isText
      );
      const plannedFiles = await createWorkspaceSavePlan(
        dirtyFiles.map((file) => ({ path: file.path, source: file.source })),
        'editor.saveAll'
      );
      const savedPaths: string[] = [];

      try {
        for (const file of dirtyFiles) {
          if (controller.signal?.aborted) {
            throw new Error('File save cancelled.');
          }
          await filesystemAdapter.saveFile(
            file.path,
            new Blob([file.source], { type: file.mimeType })
          );
          if (controller.signal?.aborted) {
            throw new Error('File save cancelled.');
          }
          const latestFile = workspaceManager
            .getSnapshot()
            .files.find((candidate) => candidate.path === file.path);
          if (latestFile?.source === file.source) {
            workspaceManager.markSaved(file.path, file.source);
            savedPaths.push(file.path);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const unknownError = new Error(message) as Error & {
          code: string;
          retryable: boolean;
          details: ReturnType<typeof createWorkspaceSaveUnknownDetails>;
        };
        Object.assign(unknownError, {
          code: TOOL_CALL_ERROR_CODES.EXECUTION_UNKNOWN,
          retryable: true,
          details: createWorkspaceSaveUnknownDetails({
            operation: 'editor.saveAll',
            plannedFiles,
            completedPaths: savedPaths,
            reason: message,
          }),
        });
        throw unknownError;
      }

      const snapshot = workspaceManager.getSnapshot();
      return {
        savedPaths,
        dirtyPaths: snapshot.dirtyPaths,
        ...createLiveEditorResultContext(
          snapshot,
          manager.getSnapshot().revision
        ),
      };
    },
    blockingToolHandler
  );

  useLiveEditorToolHandler<'editor.setDocument', unknown>(
    'editor.setDocument',
    ({ source, scenario }, controller) =>
      updateAndWait(
        {
          source,
          ...(scenario === undefined ? {} : { scenario }),
        },
        controller.signal
      ),
    blockingToolHandler
  );

  useLiveEditorToolHandler<'editor.applyPatch', unknown>(
    'editor.applyPatch',
    ({ search, replace, occurrence, expectedRevision }, controller) => {
      const current = manager.getSnapshot();
      if (
        expectedRevision !== undefined &&
        expectedRevision !== current.revision
      ) {
        throw new Error(
          `Editor revision mismatch: expected ${expectedRevision}, current ${current.revision}. Re-read the document before applying the patch.`
        );
      }
      const patch = applyLiveEditorTextPatch(
        current.source,
        search,
        replace,
        occurrence
      );
      if (patch.source.length > 100_000) {
        throw new Error(
          'Patched document exceeds the 100,000 character limit.'
        );
      }
      return updateAndWait({ source: patch.source }, controller.signal).then(
        (snapshot) => ({
          ...snapshot,
          replacements: patch.replacements,
        })
      );
    },
    blockingToolHandler
  );

  useLiveEditorToolHandler<'editor.setScenario', unknown>(
    'editor.setScenario',
    ({ scenario }, controller) =>
      updateAndWait({ scenario }, controller.signal),
    blockingToolHandler
  );

  useLiveEditorToolHandler<'editor.resetDocument', unknown>(
    'editor.resetDocument',
    (_, controller) => {
      const snapshot: LiveEditorDocumentSnapshot = manager.getSnapshot();
      return updateAndWait(
        {
          source: getResetSource(),
          scenario: snapshot.scenario,
        },
        controller.signal
      );
    },
    blockingToolHandler
  );

  return <>{children}</>;
}

export function LiveEditorToolchainProvider({
  manager,
  workspaceManager,
  filesystemAdapter,
  getExampleIdForPath,
  getResetSource,
  children,
}: {
  manager: LiveEditorDocumentManager;
  workspaceManager: LiveEditorWorkspaceManager;
  filesystemAdapter: WorkspaceFileSystemAdapter;
  getExampleIdForPath: (path: string) => string;
  getResetSource: () => string;
  children: ReactNode;
}) {
  return (
    <LiveEditorToolProvider>
      <LiveEditorToolHandlers
        manager={manager}
        workspaceManager={workspaceManager}
        filesystemAdapter={filesystemAdapter}
        getExampleIdForPath={getExampleIdForPath}
        getResetSource={getResetSource}
      >
        {children}
      </LiveEditorToolHandlers>
    </LiveEditorToolProvider>
  );
}
