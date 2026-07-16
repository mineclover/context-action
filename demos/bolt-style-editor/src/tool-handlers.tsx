import type { ReactNode } from 'react';
import { useBoltStyleToolHandler } from './bolt-style-tool-context';
import {
  applyTextPatch,
  assertExpectedWorkspaceRevision,
  downloadWorkspaceFile,
  escapeHtml,
  themeTokens,
  throwIfAborted,
} from './tool-runtime-utils';
import {
  assertWorkspaceTextSourceLength,
  BrowserWorkspace,
  collectPreviewDiagnostics,
  findPreviewHtmlFile,
  findPreviewStylesheetFile,
  normalizeWorkspacePath,
} from './workspace';
import { WorkspaceToolError } from './workspace-errors';
import { BrowserWorkspaceFileSystemAdapter } from './workspace-filesystem';

function createPreviewTargetError(
  message: string,
  target: string,
  path?: string
): WorkspaceToolError {
  return new WorkspaceToolError(message, {
    code: 'PREVIEW_TARGET_NOT_FOUND',
    retryable: false,
    details: {
      target,
      ...(path ? { path } : {}),
    },
  });
}

function createWorkspaceTypeError(
  message: string,
  path: string,
  operation: 'read' | 'write' | 'patch'
): WorkspaceToolError {
  return new WorkspaceToolError(message, {
    code: 'WORKSPACE_FILE_TYPE_CONFLICT',
    retryable: false,
    details: { path, operation, actualKind: 'asset', expectedKind: 'text' },
  });
}

function createWorkspaceRevisionError(
  message: string,
  expectedRevision: number,
  currentRevision: number,
  operation: 'save' | 'checkpoint'
): WorkspaceToolError {
  return new WorkspaceToolError(message, {
    code: 'WORKSPACE_REVISION_CONFLICT',
    retryable: true,
    details: { expectedRevision, currentRevision, operation },
  });
}

function createWorkspaceFolderStateError(
  message: string,
  operation: 'reset' | 'checkpoint'
): WorkspaceToolError {
  return new WorkspaceToolError(message, {
    code: 'WORKSPACE_FOLDER_STATE_CONFLICT',
    retryable: false,
    details: { operation, folderLinked: true },
  });
}

export function ToolHandlers({
  workspace,
  fileSystemAdapter,
  onPreviewRefresh,
  children,
}: {
  workspace: BrowserWorkspace;
  fileSystemAdapter: BrowserWorkspaceFileSystemAdapter;
  onPreviewRefresh: () => void;
  children: ReactNode;
}) {
  const workspacePersistenceMeta = (snapshot = workspace.getSnapshot()) => {
    return {
      storageMode: snapshot.storageMode,
      ...(snapshot.storageError ? { storageError: snapshot.storageError } : {}),
    };
  };
  const workspaceResultMeta = (snapshot = workspace.getSnapshot()) => {
    return {
      activePath: snapshot.activePath,
      revision: snapshot.revision,
      ...workspacePersistenceMeta(),
    };
  };

  useBoltStyleToolHandler('workspace.getStatus', () => {
    const snapshot = workspace.getSnapshot();
    const dirtyPaths = workspace.getDirtyFiles().map((file) => file.path);
    const folderLinked = fileSystemAdapter.hasWritableFolder;
    return {
      rootName: snapshot.rootName,
      activePath: snapshot.activePath,
      revision: snapshot.revision,
      ...workspacePersistenceMeta(snapshot),
      preview: snapshot.preview,
      fileCount: snapshot.files.length,
      dirtyPaths,
      deletedPaths: workspace.getDeletedPaths(),
      history: {
        canUndo: workspace.canUndo(),
        canRedo: workspace.canRedo(),
      },
      filesystem: {
        mode: folderLinked ? 'local-folder' : 'browser-only',
        folderLinked,
        permission: folderLinked
          ? fileSystemAdapter.folderPermission
          : ('disconnected' as const),
        saveAllAvailable: folderLinked,
        reloadAvailable: folderLinked,
      },
    };
  });

  useBoltStyleToolHandler<'workspace.reset', unknown>(
    'workspace.reset',
    async ({ expectedRevision }, controller) => {
      if (fileSystemAdapter.hasWritableFolder) {
        throw createWorkspaceFolderStateError(
          'A writable folder is connected. Disconnect the folder before resetting the browser demo workspace.',
          'reset'
        );
      }
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      throwIfAborted(controller.signal);
      await fileSystemAdapter.disconnectFolder();
      throwIfAborted(controller.signal);
      await workspace.resetToSeed({ expectedRevision });
      const snapshot = workspace.getSnapshot();
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        ...workspacePersistenceMeta(),
        rootName: snapshot.rootName,
        activePath: snapshot.activePath,
        fileCount: snapshot.files.length,
        revision: snapshot.revision,
        preview: 'synced' as const,
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler('workspace.listFiles', () => {
    const snapshot = workspace.getSnapshot();
    const dirtyPaths = new Set(
      workspace.getDirtyFiles().map((file) => file.path)
    );
    return {
      ...workspacePersistenceMeta(),
      activePath: snapshot.activePath,
      revision: snapshot.revision,
      dirty: workspace.isDirty(),
      deletedPaths: workspace.getDeletedPaths(),
      files: snapshot.files.map(
        ({ path, language, source, kind, mimeType, blob }) => ({
          path,
          language,
          size: blob?.size ?? source.length,
          kind: kind ?? 'text',
          mimeType,
          dirty: dirtyPaths.has(path),
        })
      ),
    };
  });

  useBoltStyleToolHandler(
    'workspace.readFile',
    ({ path }) => {
      const file = workspace.getFile(path);
      if (file.kind === 'asset') {
        throw createWorkspaceTypeError(
          `Binary asset cannot be returned as text: ${file.path}`,
          file.path,
          'read'
        );
      }
      const snapshot = workspace.getSnapshot();
      return {
        ...workspacePersistenceMeta(snapshot),
        path: file.path,
        source: file.source,
        revision: snapshot.revision,
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.downloadFile', unknown>(
    'workspace.downloadFile',
    ({ path }) => {
      const file = workspace.getFile(path);
      const size = downloadWorkspaceFile(file);
      const snapshot = workspace.getSnapshot();
      return {
        ...workspacePersistenceMeta(snapshot),
        path: file.path,
        kind: file.kind === 'asset' ? ('asset' as const) : ('text' as const),
        size,
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler(
    'workspace.openFile',
    async ({ path }) => {
      const normalizedPath = normalizeWorkspacePath(path);
      workspace.setActivePath(normalizedPath);
      await workspace.waitForPersistence();
      const snapshot = workspace.getSnapshot();
      return {
        ...workspacePersistenceMeta(),
        path: normalizedPath,
        activePath: snapshot.activePath,
        revision: snapshot.revision,
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.createFile', unknown>(
    'workspace.createFile',
    async ({ path, source, expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      const snapshot = workspace.createFile(path, source);
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      await workspace.waitForPersistence();
      return {
        ...workspacePersistenceMeta(),
        path: snapshot.activePath,
        activePath: snapshot.activePath,
        language: workspace.getFile(snapshot.activePath).language,
        revision: snapshot.revision,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.renameFile', unknown>(
    'workspace.renameFile',
    async ({ fromPath, toPath, expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      const normalizedFromPath = normalizeWorkspacePath(fromPath);
      const normalizedToPath = normalizeWorkspacePath(toPath);
      const snapshot = workspace.renameFile(
        normalizedFromPath,
        normalizedToPath
      );
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      await workspace.waitForPersistence();
      return {
        ...workspacePersistenceMeta(),
        fromPath: normalizedFromPath,
        toPath: normalizedToPath,
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.deleteFile', unknown>(
    'workspace.deleteFile',
    async ({ path, expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      const file = workspace.getFile(path);
      const snapshot = workspace.deleteFile(file.path);
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      await workspace.waitForPersistence();
      return {
        ...workspacePersistenceMeta(),
        path: file.path,
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.writeFile', unknown>(
    'workspace.writeFile',
    async ({ path, source, expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      const file = workspace.getFile(path);
      if (file.kind === 'asset') {
        throw createWorkspaceTypeError(
          `Binary asset cannot be replaced as text: ${file.path}`,
          file.path,
          'write'
        );
      }
      const snapshot = workspace.updateFile(file.path, source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      await workspace.waitForPersistence();
      return {
        ...workspacePersistenceMeta(),
        path: file.path,
        revision: snapshot.revision,
        activePath: snapshot.activePath,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.saveAll', unknown>(
    'workspace.saveAll',
    async ({ expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      if (!fileSystemAdapter.hasWritableFolder) {
        throw new WorkspaceToolError(
          'No writable folder is open. Open a local folder before saving files.',
          {
            code: 'WORKSPACE_FOLDER_NOT_CONNECTED',
            retryable: true,
            details: { operation: 'save' },
          }
        );
      }
      if (controller.signal?.aborted) throw new Error('Save cancelled.');
      const saveRevision = workspace.getSnapshot().revision;
      const dirtyFiles = workspace.getDirtyFiles();
      const deletedPaths = workspace.getDeletedPaths();
      if (dirtyFiles.length === 0 && deletedPaths.length === 0) {
        return {
          ...workspacePersistenceMeta(),
          savedPaths: [],
          deletedPaths: [],
          activePath: workspace.getSnapshot().activePath,
          revision: workspace.getSnapshot().revision,
        };
      }

      const savedPaths: string[] = [];
      const removedPaths: string[] = [];
      try {
        for (const file of dirtyFiles) {
          if (workspace.getSnapshot().revision !== saveRevision) {
            throw createWorkspaceRevisionError(
              'The workspace changed while saving. Retry to write the remaining changes.',
              saveRevision,
              workspace.getSnapshot().revision,
              'save'
            );
          }
          await fileSystemAdapter.writeFiles([file]);
          if (controller.signal?.aborted) throw new Error('Save cancelled.');
          if (
            !(await workspace.markFileSavedIfRevision(file.path, saveRevision))
          ) {
            throw createWorkspaceRevisionError(
              'The workspace changed while saving. Retry to write the remaining changes.',
              saveRevision,
              workspace.getSnapshot().revision,
              'save'
            );
          }
          savedPaths.push(file.path);
        }

        for (const path of deletedPaths) {
          if (workspace.getSnapshot().revision !== saveRevision) {
            throw createWorkspaceRevisionError(
              'The workspace changed while saving. Retry to apply the remaining deletions.',
              saveRevision,
              workspace.getSnapshot().revision,
              'save'
            );
          }
          await fileSystemAdapter.removeFiles([path]);
          if (controller.signal?.aborted) throw new Error('Save cancelled.');
          if (
            !(await workspace.markDeletedPathSavedIfRevision(
              path,
              saveRevision
            ))
          ) {
            throw createWorkspaceRevisionError(
              'The workspace changed while saving. Retry to apply the remaining deletions.',
              saveRevision,
              workspace.getSnapshot().revision,
              'save'
            );
          }
          removedPaths.push(path);
        }

        const checkpointUpdated =
          await workspace.markSavedIfRevision(saveRevision);
        if (!checkpointUpdated) {
          throw createWorkspaceRevisionError(
            'The workspace changed while saving. Retry to write the remaining changes.',
            saveRevision,
            workspace.getSnapshot().revision,
            'save'
          );
        }
        return {
          ...workspacePersistenceMeta(),
          savedPaths,
          deletedPaths: removedPaths,
          activePath: workspace.getSnapshot().activePath,
          revision: workspace.getSnapshot().revision,
          checkpointUpdated,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Folder save failed.';
        const completed = [...savedPaths, ...removedPaths];
        const wrappedMessage = `${completed.length ? `Folder save completed ${completed.length} item(s): ${completed.join(', ')}. ` : ''}Remaining changes stay in the browser workspace. ${message}`;
        if (error instanceof WorkspaceToolError) {
          throw new WorkspaceToolError(wrappedMessage, {
            code: error.code,
            retryable: error.retryable,
            details: error.details,
          });
        }
        throw new Error(wrappedMessage, { cause: error });
      }
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.saveCheckpoint', unknown>(
    'workspace.saveCheckpoint',
    async ({ expectedRevision }) => {
      if (fileSystemAdapter.hasWritableFolder) {
        throw createWorkspaceFolderStateError(
          'A writable folder is connected. Use workspace.saveAll to persist filesystem changes.',
          'checkpoint'
        );
      }
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      const checkpointRevision = workspace.getSnapshot().revision;
      const dirtyFiles = workspace.getDirtyFiles();
      const deletedPaths = workspace.getDeletedPaths();
      const checkpointUpdated =
        await workspace.markSavedIfRevision(checkpointRevision);
      if (!checkpointUpdated) {
        throw createWorkspaceRevisionError(
          'The workspace changed while saving the browser checkpoint. Re-read the workspace and retry.',
          checkpointRevision,
          workspace.getSnapshot().revision,
          'checkpoint'
        );
      }
      const snapshot = workspace.getSnapshot();
      return {
        ...workspacePersistenceMeta(),
        savedPaths: dirtyFiles.map((file) => file.path),
        deletedPaths,
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        checkpointUpdated: true as const,
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.reloadFolder', unknown>(
    'workspace.reloadFolder',
    async ({ expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      if (!fileSystemAdapter.hasWritableFolder) {
        throw new WorkspaceToolError(
          'No writable folder is open. Open a local folder before reloading it.',
          {
            code: 'WORKSPACE_FOLDER_NOT_CONNECTED',
            retryable: true,
            details: { operation: 'reload' },
          }
        );
      }
      if (controller.signal?.aborted) throw new Error('Reload cancelled.');
      const imported = await fileSystemAdapter.reloadFolder();
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      await workspace.importFolder(imported, { expectedRevision });
      const snapshot = workspace.getSnapshot();
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      await workspace.waitForPersistence();
      return {
        ...workspacePersistenceMeta(),
        rootName: snapshot.rootName,
        activePath: snapshot.activePath,
        fileCount: imported.files.length,
        skipped: imported.skipped,
        revision: snapshot.revision,
        preview: 'synced' as const,
        filesystem: {
          mode: 'local-folder' as const,
          folderLinked: true as const,
          permission: fileSystemAdapter.folderPermission,
          saveAllAvailable: true as const,
          reloadAvailable: true as const,
        },
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.disconnectFolder', unknown>(
    'workspace.disconnectFolder',
    async () => {
      await fileSystemAdapter.disconnectFolder();
      const snapshot = workspace.getSnapshot();
      return {
        ...workspacePersistenceMeta(),
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        filesystem: {
          mode: 'browser-only' as const,
          folderLinked: false as const,
          permission: 'disconnected' as const,
          saveAllAvailable: false as const,
          reloadAvailable: false as const,
        },
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.applyPatch', unknown>(
    'workspace.applyPatch',
    async (
      { path, search, replace, occurrence, expectedRevision },
      controller
    ) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      const file = workspace.getFile(path);
      if (file.kind === 'asset') {
        throw createWorkspaceTypeError(
          `Binary asset cannot be patched as text: ${file.path}`,
          file.path,
          'patch'
        );
      }
      const patch = applyTextPatch(
        file.source,
        search,
        replace,
        occurrence,
        file.path
      );
      assertWorkspaceTextSourceLength(patch.source, 'Patched source');
      const snapshot = workspace.updateFile(file.path, patch.source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      await workspace.waitForPersistence();
      return {
        ...workspacePersistenceMeta(),
        path: file.path,
        replacements: patch.replacements,
        revision: snapshot.revision,
        activePath: snapshot.activePath,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.revertFile', unknown>(
    'workspace.revertFile',
    async ({ path, expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      const file = workspace.getFile(path);
      const snapshot = workspace.revertFile(file.path);
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      await workspace.waitForPersistence();
      return {
        ...workspacePersistenceMeta(),
        path: file.path,
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.undo', unknown>(
    'workspace.undo',
    async ({ expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      if (!workspace.canUndo()) {
        throw new WorkspaceToolError(
          'No workspace edit is available to undo.',
          {
            code: 'WORKSPACE_HISTORY_EMPTY',
            retryable: false,
            details: { direction: 'undo' },
          }
        );
      }
      const snapshot = workspace.undo();
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      await workspace.waitForPersistence();
      return {
        ...workspacePersistenceMeta(),
        direction: 'undo' as const,
        changed: true,
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        preview: 'synced' as const,
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'workspace.redo', unknown>(
    'workspace.redo',
    async ({ expectedRevision }, controller) => {
      assertExpectedWorkspaceRevision(workspace, expectedRevision);
      if (!workspace.canRedo()) {
        throw new WorkspaceToolError(
          'No workspace edit is available to redo.',
          {
            code: 'WORKSPACE_HISTORY_EMPTY',
            retryable: false,
            details: { direction: 'redo' },
          }
        );
      }
      const snapshot = workspace.redo();
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      await workspace.waitForPersistence();
      return {
        ...workspacePersistenceMeta(),
        direction: 'redo' as const,
        changed: true,
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        preview: 'synced' as const,
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'preview.setTheme', unknown>(
    'preview.setTheme',
    async ({ theme }, controller) => {
      const file = findPreviewStylesheetFile(workspace.getSnapshot().files);
      if (!file)
        throw createPreviewTargetError(
          'No CSS stylesheet was found in the workspace.',
          'stylesheet'
        );
      const tokens = themeTokens[theme];
      const hasThemeTokens =
        /--accent:\s*#[0-9a-f]+;/i.test(file.source) ||
        /--accent-soft:\s*#[0-9a-f]+;/i.test(file.source);
      if (!hasThemeTokens) {
        throw createPreviewTargetError(
          `The stylesheet does not expose supported theme tokens: ${file.path}`,
          'theme-tokens',
          file.path
        );
      }
      const source = file.source
        .replace(/--accent:\s*#[0-9a-f]+;/i, `--accent: ${tokens.accent};`)
        .replace(
          /--accent-soft:\s*#[0-9a-f]+;/i,
          `--accent-soft: ${tokens.soft};`
        );
      if (source === file.source) {
        const current = workspace.getSnapshot();
        await workspace.waitForPreviewRevision(
          current.revision,
          2500,
          controller.signal
        );
        return {
          theme,
          ...workspaceResultMeta(current),
          preview: 'synced' as const,
        };
      }
      const snapshot = workspace.updateFile(file.path, source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      await workspace.waitForPersistence();
      return {
        theme,
        ...workspaceResultMeta(snapshot),
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'preview.addFeature', unknown>(
    'preview.addFeature',
    async ({ title, description }, controller) => {
      const file = findPreviewHtmlFile(workspace.getSnapshot().files);
      if (!file)
        throw createPreviewTargetError(
          'No HTML entry file was found in the workspace.',
          'html-entry'
        );
      const card = `<article class="feature-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></article>`;
      if (!file.source.includes('<!-- feature-slot -->')) {
        throw createPreviewTargetError(
          `The HTML entry file does not expose a feature slot: ${file.path}`,
          'feature-slot',
          file.path
        );
      }
      const source = file.source.replace(
        '<!-- feature-slot -->',
        () => `${card}\n        <!-- feature-slot -->`
      );
      const snapshot = workspace.updateFile(file.path, source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      await workspace.waitForPersistence();
      return {
        title,
        ...workspaceResultMeta(snapshot),
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler<'preview.updateHero', unknown>(
    'preview.updateHero',
    async ({ title, subtitle }, controller) => {
      const file = findPreviewHtmlFile(workspace.getSnapshot().files);
      if (!file)
        throw createPreviewTargetError(
          'No HTML entry file was found in the workspace.',
          'html-entry'
        );
      if (!/<h1\b[^>]*id=["']hero-title["'][^>]*>/i.test(file.source)) {
        throw createPreviewTargetError(
          `The HTML entry file has no hero title target: ${file.path}`,
          'hero-title',
          file.path
        );
      }
      if (!/<p\b[^>]*id=["']hero-subtitle["'][^>]*>/i.test(file.source)) {
        throw createPreviewTargetError(
          `The HTML entry file has no hero subtitle target: ${file.path}`,
          'hero-subtitle',
          file.path
        );
      }
      const source = file.source
        .replace(
          /(<h1\b[^>]*id=["']hero-title["'][^>]*>)[\s\S]*?(<\/h1>)/i,
          (_match, opening, closing) =>
            `${opening}${escapeHtml(title)}${closing}`
        )
        .replace(
          /(<p\b[^>]*id=["']hero-subtitle["'][^>]*>)[\s\S]*?(<\/p>)/i,
          (_match, opening, closing) =>
            `${opening}${escapeHtml(subtitle)}${closing}`
        );
      const snapshot = workspace.updateFile(file.path, source, {
        coalesce: false,
      });
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      await workspace.waitForPersistence();
      return {
        title,
        ...workspaceResultMeta(snapshot),
        preview: 'synced',
      };
    },
    { blocking: true }
  );

  useBoltStyleToolHandler('preview.getStatus', () => {
    const snapshot = workspace.getSnapshot();
    return {
      ...workspacePersistenceMeta(snapshot),
      revision: snapshot.revision,
      status: snapshot.preview.status,
      message: snapshot.preview.message,
      runtime: 'sandbox iframe',
      diagnostics: collectPreviewDiagnostics(snapshot.files),
    };
  });

  useBoltStyleToolHandler<'preview.refresh', unknown>(
    'preview.refresh',
    async (_, controller) => {
      const snapshot = workspace.getSnapshot();
      workspace.setPreviewStatus(snapshot.revision, 'waiting');
      onPreviewRefresh();
      await workspace.waitForPreviewRevision(
        snapshot.revision,
        2500,
        controller.signal
      );
      return {
        ...workspacePersistenceMeta(),
        activePath: snapshot.activePath,
        revision: snapshot.revision,
        preview: 'synced' as const,
      };
    },
    { blocking: true }
  );

  return <>{children}</>;
}
