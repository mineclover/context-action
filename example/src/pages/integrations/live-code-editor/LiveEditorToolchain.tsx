import { createToolContext } from '@context-action/react';
import type { ReactNode } from 'react';
import {
  LiveEditorDocumentManager,
  type LiveEditorDocumentSnapshot,
} from '../../../lib/live-code-editor-bridge';
import { type WorkspaceFileSystemAdapter } from '../../../lib/live-code-editor-filesystem';
import { LiveEditorWorkspaceManager } from '../../../lib/live-code-editor-workspace';
import { applyLiveEditorTextPatch } from '../../../lib/live-editor-text-patch';
import { liveEditorToolsSchema } from '../../../lib/live-editor-tools-schema';
import { recordLiveEditorToolCall } from '../../../lib/live-editor-trace';

export const {
  Provider: LiveEditorToolProvider,
  useToolHandler: useLiveEditorToolHandler,
  useToolRegistry: useLiveEditorToolRegistry,
} = createToolContext('LiveEditorTools', {
  schema: liveEditorToolsSchema,
  debug: true,
  onToolCall: recordLiveEditorToolCall,
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
    'editor.listFiles',
    () => {
      const snapshot = workspaceManager.getSnapshot();
      return {
        activePath: snapshot.activePath,
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
    () => manager.getSnapshot(),
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
    return { ...snapshot, preview };
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
        workspaceRevision: snapshot.revision,
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
      const savedPaths: string[] = [];

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

      const snapshot = workspaceManager.getSnapshot();
      return {
        savedPaths,
        dirtyPaths: snapshot.dirtyPaths,
        workspaceRevision: snapshot.revision,
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
